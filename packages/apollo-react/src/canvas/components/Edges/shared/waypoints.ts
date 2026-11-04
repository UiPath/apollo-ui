import type { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { snapToGrid } from '../../../utils/NodeUtils';
import { EDGE_CONSTANTS } from './constants';
import { consolidateWaypoints, isHorizontalPosition, snapPointToGrid } from './geometry';
import type { PathVertex, Point, Segment, SegmentOrientation, Waypoint } from './types';

/**
 * Promote the path's interior vertices (waypoints + derived stub/elbow points)
 * to a concrete waypoint list, preserving the ids of real waypoints and
 * minting fresh ids for derived points. Called when the user grabs a segment
 * so segment math operates on a clean 1:1 path — and the derived elbows the
 * user is now editing become real, draggable waypoints. The result is index-
 * aligned with the segment indices from {@link extractSegments}.
 */
export function materializePathWaypoints(vertices: PathVertex[], stored: Waypoint[]): Waypoint[] {
  return vertices.slice(1, -1).map((vertex) => {
    const existing = vertex.waypointIndex >= 0 ? stored[vertex.waypointIndex] : undefined;
    return existing ?? { id: generateWaypointId(), x: vertex.x, y: vertex.y };
  });
}

export function generateWaypointId(): string {
  return `wp-${crypto.randomUUID()}`;
}

/**
 * True when two waypoint arrays describe the same path (id + position). Used
 * by the editor to short-circuit no-op drag ticks where snap-rounding produced
 * the same coordinates.
 */
export function waypointsEqual(a: Waypoint[], b: Waypoint[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const wa = a[i]!;
    const wb = b[i]!;
    if (wa.x !== wb.x || wa.y !== wb.y || wa.id !== wb.id) return false;
  }
  return true;
}

/**
 * Position-only equality. Routers generate fresh ids on every call, so the
 * graph-router orchestration uses this to break the write→re-render→write
 * feedback loop when computed positions haven't actually changed.
 */
export function waypointsPositionallyEqual(a: Waypoint[], b: Waypoint[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.x !== b[i]!.x || a[i]!.y !== b[i]!.y) return false;
  }
  return true;
}

/**
 * Insert a waypoint into the segment at `segmentIndex`. The path's interior
 * vertices (including derived stubs/elbows) are first materialized into a
 * concrete waypoint list, then the new waypoint is spliced into that segment —
 * so insertion lands at the right spot regardless of derived points, and the
 * surrounding stubs become real waypoints alongside it.
 */
export function insertWaypoint(
  vertices: PathVertex[],
  stored: Waypoint[],
  segmentIndex: number,
  position: Point
): Waypoint[] {
  const newWaypoint: Waypoint = {
    id: generateWaypointId(),
    ...snapPointToGrid(position),
  };

  const materialized = materializePathWaypoints(vertices, stored);
  materialized.splice(Math.max(0, segmentIndex), 0, newWaypoint);
  return materialized;
}

export function removeWaypoint(waypoints: Waypoint[], index: number): Waypoint[] {
  return waypoints.filter((_, i) => i !== index);
}

/** An edge endpoint for rebalancing: which face it attaches to, plus the anchor
 * position at drag start (`from`) and now (`to`). */
export type RebalanceEndpoint = {
  position: Position;
  from: Point;
  to: Point;
};

/** Movement below this (px) on both axes is treated as "did not move". */
const REBALANCE_EPSILON = 0.5;

/**
 * Reposition waypoints to follow a node drag (see ALGORITHM.md §9). Three cases:
 *
 * - **Group move** — both endpoints moved by ~the same delta → translate the
 *   whole route by it, preserving the shape exactly (§9.7).
 * - **Single waypoint** — it is both first and last, so apply only the endpoint
 *   that actually moved; if both moved differently it is left as the user's
 *   central intent (derived terminal elbows absorb the difference) rather than
 *   double-shifted (§9.9).
 * - **Otherwise** — the first waypoint tracks the source and the last tracks the
 *   target, each on the axis perpendicular to that node's face (the cross-axis);
 *   interior waypoints stay fixed (§9.3/§9.5/§9.8).
 *
 * Shifts are by the node's cross-axis delta, so any intentional offset between a
 * waypoint and its node is preserved. Ids are preserved.
 */
export function rebalanceWaypoints(
  waypoints: Waypoint[],
  source: RebalanceEndpoint,
  target: RebalanceEndpoint
): Waypoint[] {
  if (waypoints.length === 0) return waypoints;

  const sourceDelta = delta(source);
  const targetDelta = delta(target);

  // Group move: both endpoints moved together → translate the whole route.
  if (isMoved(sourceDelta) && deltasEqual(sourceDelta, targetDelta)) {
    return waypoints.map((w) => ({ id: w.id, x: w.x + sourceDelta.x, y: w.y + sourceDelta.y }));
  }

  const next = waypoints.map((w) => ({ ...w }));

  if (next.length === 1) {
    // A lone waypoint is adjacent to both ends. Apply only the endpoint that
    // moved; if both moved (differently — group move is handled above) leave it
    // alone so it isn't double-shifted.
    const sourceMoved = isMoved(sourceDelta);
    const targetMoved = isMoved(targetDelta);
    if (sourceMoved && !targetMoved) shiftAdjacentWaypoint(next[0]!, source);
    else if (targetMoved && !sourceMoved) shiftAdjacentWaypoint(next[0]!, target);
    return next;
  }

  shiftAdjacentWaypoint(next[0]!, source);
  shiftAdjacentWaypoint(next[next.length - 1]!, target);
  return next;
}

function delta(endpoint: RebalanceEndpoint): Point {
  return { x: endpoint.to.x - endpoint.from.x, y: endpoint.to.y - endpoint.from.y };
}

function isMoved(d: Point): boolean {
  return Math.abs(d.x) >= REBALANCE_EPSILON || Math.abs(d.y) >= REBALANCE_EPSILON;
}

function deltasEqual(a: Point, b: Point): boolean {
  return Math.abs(a.x - b.x) < REBALANCE_EPSILON && Math.abs(a.y - b.y) < REBALANCE_EPSILON;
}

/** Shift a waypoint by the endpoint's delta on the cross-axis only (the axis
 * perpendicular to the node's face). */
function shiftAdjacentWaypoint(waypoint: Waypoint, endpoint: RebalanceEndpoint): void {
  if (isHorizontalPosition(endpoint.position)) {
    waypoint.y += endpoint.to.y - endpoint.from.y;
  } else {
    waypoint.x += endpoint.to.x - endpoint.from.x;
  }
}

export function moveWaypoint(waypoints: Waypoint[], index: number, newPosition: Point): Waypoint[] {
  const snapped = snapPointToGrid(newPosition);
  return waypoints.map((wp, i) => (i === index ? { ...wp, ...snapped } : wp));
}

/** Rebuilds the rendered path (anchors included) for a candidate waypoint list. */
export type PathBuilder = (waypoints: Waypoint[]) => PathVertex[];

/** Orientation of an axis-aligned run, or `null` when coincident or diagonal. */
function runAxis(a: Point, b: Point): SegmentOrientation | null {
  const tol = EDGE_CONSTANTS.COLLINEAR_TOLERANCE;
  const sameX = Math.abs(a.x - b.x) <= tol;
  const sameY = Math.abs(a.y - b.y) <= tol;
  if (sameX === sameY) return null;
  return sameY ? 'horizontal' : 'vertical';
}

/** Index in `path` of stored waypoint `index`, or -1 if it isn't drawn. */
function vertexIndexOf(path: PathVertex[], index: number): number {
  return path.findIndex((v) => v.waypointIndex === index);
}

/**
 * True when stored waypoint `index` is drawn as a corner of `path`: its two
 * runs are non-degenerate and perpendicular. False for a waypoint sitting on a
 * straight run, doubling back over one, coincident with a neighbour, or
 * dropped from the drawn path altogether.
 */
export function isCornerWaypoint(path: PathVertex[], index: number): boolean {
  const i = vertexIndexOf(path, index);
  if (i <= 0) return false;
  const incoming = runAxis(path[i - 1]!, path[i]!);
  const outgoing = runAxis(path[i]!, path[i + 1]!);
  return incoming !== null && outgoing !== null && incoming !== outgoing;
}

/**
 * Drag a corner waypoint: it lands on `desired` and the two runs meeting at it
 * follow, each on its own axis, so it stays a corner.
 *
 * `path` is the drawn path at drag start. For each run, the vertex at its far
 * end is handled by kind:
 * - a stored waypoint gets the shared coordinate updated,
 * - a derived elbow is re-derived by the renderer and follows on its own,
 * - a node anchor can't move, so a two-point stub is inserted next to it
 *   (as {@link moveSegmentByDelta} does for anchored segments).
 */
export function moveCornerWaypoint(
  waypoints: Waypoint[],
  index: number,
  desired: Point,
  path: PathVertex[]
): Waypoint[] {
  const i = vertexIndexOf(path, index);
  if (i <= 0 || !waypoints[index]) return waypoints;

  const corner = path[i]!;
  const next = moveWaypoint(waypoints, index, desired);
  const target = next[index]!;

  // Stored waypoints at the far end of a run take the corner's new shared
  // coordinate: y across a horizontal run, x across a vertical one.
  for (const neighbor of [path[i - 1]!, path[i + 1]!]) {
    const axis = runAxis(neighbor, corner);
    if (!axis || neighbor.waypointIndex < 0) continue;
    const coord = axis === 'horizontal' ? 'y' : 'x';
    next[neighbor.waypointIndex] = { ...next[neighbor.waypointIndex]!, [coord]: target[coord] };
  }

  const sourceStub = i - 1 === 0 ? anchorStub(path[0]!, corner, target) : [];
  const targetStub = i + 1 === path.length - 1 ? anchorStub(path[i + 1]!, corner, target) : [];
  return [...sourceStub, ...next, ...targetStub.reverse()];
}

/**
 * Stub that lets a run attached to a fixed node anchor shift to `target`:
 * a pair (see {@link makeStubPair}) a stub's length out from the anchor toward
 * the corner, ordered anchor-outward. Empty when the run doesn't move.
 */
function anchorStub(anchor: Point, corner: Point, target: Point): Waypoint[] {
  const axis = runAxis(anchor, corner);
  if (!axis) return [];
  const [along, across] = axis === 'horizontal' ? (['x', 'y'] as const) : (['y', 'x'] as const);
  if (Math.abs(target[across] - anchor[across]) <= EDGE_CONSTANTS.COLLINEAR_TOLERANCE) return [];
  const direction = Math.sign(corner[along] - anchor[along]) || 1;
  const stubCoord = snapToGrid(anchor[along] + direction * EDGE_CONSTANTS.STUB_OFFSET);
  return makeStubPair(anchor, axis, stubCoord, target[across]);
}

/**
 * Clean up stored waypoints that aren't drawn as corners (on a straight run,
 * doubling back, coincident) without changing the drawn route. Each one is
 * removed if the route stays the same without it, otherwise moved onto the
 * nearer end of its run; if neither keeps the route, it is left alone.
 * Corners are never touched, so they keep their ids and handles.
 *
 * Run after a waypoint drag ends, never on insert: an inserted waypoint sits
 * on its segment by design.
 */
export function normalizeWaypoints(waypoints: Waypoint[], buildPath: PathBuilder): Waypoint[] {
  let current = waypoints;
  let path = buildPath(current);
  const reference = pathShape(path);
  const keepsRoute = (candidate: Waypoint[]) =>
    pointsEqual(pathShape(buildPath(candidate)), reference);

  const skipped = new Set<string>();
  // Each pass removes a waypoint, moves one onto a corner, or skips one.
  for (let guard = 0; guard <= waypoints.length * 3; guard++) {
    const index = current.findIndex((wp, i) => !skipped.has(wp.id) && !isCornerWaypoint(path, i));
    if (index < 0) return current;

    const fix = runEndCandidates(current, index, path).find(keepsRoute);
    if (fix) {
      current = fix;
      path = buildPath(current);
    } else {
      skipped.add(current[index]!.id);
    }
  }
  return current;
}

/** Removal first, then the waypoint moved onto each adjacent drawn vertex, nearest first. */
function runEndCandidates(waypoints: Waypoint[], index: number, path: PathVertex[]): Waypoint[][] {
  const candidates = [removeWaypoint(waypoints, index)];
  const i = vertexIndexOf(path, index);
  if (i < 0) return candidates;

  const self = path[i]!;
  const distance = (p: Point) => Math.abs(p.x - self.x) + Math.abs(p.y - self.y);
  const ends = [i - 1, i + 1]
    .filter((j) => j > 0 && j < path.length - 1)
    .map((j) => path[j]!)
    .sort((a, b) => distance(a) - distance(b));
  for (const end of ends) {
    // Copied exactly, not grid-snapped: a derived elbow can sit on an
    // off-grid anchor line.
    candidates.push(waypoints.map((wp, j) => (j === index ? { ...wp, x: end.x, y: end.y } : wp)));
  }
  return candidates;
}

/**
 * Move a waypoint toward `desired`, keeping only the axis components that
 * actually change the route.
 *
 * The renderer joins waypoints with derived orthogonal elbows, so a waypoint
 * often has only one meaningful degree of freedom: moving it along the other
 * axis just slides the handle along a straight run (the elbow it left is
 * re-derived in its place) or pushes it past the run's end into a spike that
 * doubles back. Each axis is kept only if it changes the path's minimal
 * orthogonal shape (see {@link consolidateWaypoints}) relative to moving the
 * other axis alone; otherwise that axis stays at its starting value.
 *
 * Used for waypoints on a straight run; corners use {@link moveCornerWaypoint}.
 */
export function moveWaypointConstrained(
  waypoints: Waypoint[],
  index: number,
  desired: Point,
  buildPath: PathBuilder
): Waypoint[] {
  const initial = waypoints[index];
  if (!initial) return waypoints;

  const start = snapPointToGrid(initial);
  const target = snapPointToGrid(desired);
  const movesX = target.x !== start.x;
  const movesY = target.y !== start.y;
  if (!movesX && !movesY) return moveWaypoint(waypoints, index, start);

  // An axis that doesn't move needs no check (its candidate is the full move).
  const shapeAt = (p: Point) => pathShape(buildPath(moveWaypoint(waypoints, index, p)));
  const fullShape = shapeAt(target);
  const keepX = movesX && !pointsEqual(fullShape, shapeAt({ x: start.x, y: target.y }));
  const keepY = movesY && !pointsEqual(fullShape, shapeAt({ x: target.x, y: start.y }));

  return moveWaypoint(waypoints, index, {
    x: keepX ? target.x : start.x,
    y: keepY ? target.y : start.y,
  });
}

/** The path's minimal orthogonal form: anchors plus unprotected consolidation of the interior. */
function pathShape(points: Point[]): Point[] {
  if (points.length <= 2) return points;
  const start = points[0]!;
  const end = points[points.length - 1]!;
  return [start, ...consolidateWaypoints(points.slice(1, -1), start, end), end];
}

function pointsEqual(a: Point[], b: Point[]): boolean {
  if (a.length !== b.length) return false;
  const tol = EDGE_CONSTANTS.COLLINEAR_TOLERANCE;
  return a.every((p, i) => Math.abs(p.x - b[i]!.x) <= tol && Math.abs(p.y - b[i]!.y) <= tol);
}

/**
 * Translate a segment along its perpendicular axis by `delta`. When the
 * segment is anchored to source or target, two stub waypoints are inserted
 * to preserve the smooth-step shape.
 *
 * `initialWaypoints` and `initialSegment` should already be materialized via
 * {@link materializePathWaypoints} at drag start to avoid ID churn during drag.
 */
export function moveSegmentByDelta(
  initialWaypoints: Waypoint[],
  initialSegment: Segment,
  delta: Point,
  initialPathPoints: Point[]
): Waypoint[] {
  const moveAxis = initialSegment.orientation === 'horizontal' ? 'y' : 'x';
  const moveValue = moveAxis === 'y' ? delta.y : delta.x;

  const working: Waypoint[] = initialWaypoints.map((wp) => ({ ...wp }));

  const isConnectedToSource = initialSegment.waypointIndexBefore < 0;
  const isConnectedToTarget = initialSegment.waypointIndexAfter >= working.length;

  let insertedAtStart = false;
  const stubOffset = EDGE_CONSTANTS.STUB_OFFSET;
  const orientation = initialSegment.orientation;

  const segmentStart = initialSegment.start;
  const segmentEnd = initialSegment.end;
  const pathSource = initialPathPoints[0]!;
  const pathTarget = initialPathPoints[initialPathPoints.length - 1]!;

  const movedCoordinate =
    orientation === 'horizontal'
      ? snapToGrid(segmentStart.y + moveValue)
      : snapToGrid(segmentStart.x + moveValue);

  if (isConnectedToSource) {
    const stubCoord = snapToGrid(
      (orientation === 'horizontal' ? segmentStart.x : segmentStart.y) + stubOffset
    );
    const [anchorStub, movedStub] = makeStubPair(
      segmentStart,
      orientation,
      stubCoord,
      movedCoordinate
    );
    working.unshift(anchorStub, movedStub);
    insertedAtStart = true;
  }

  if (isConnectedToTarget) {
    const stubCoord = snapToGrid(
      (orientation === 'horizontal' ? segmentEnd.x : segmentEnd.y) - stubOffset
    );
    const [anchorStub, movedStub] = makeStubPair(
      segmentEnd,
      orientation,
      stubCoord,
      movedCoordinate
    );
    working.push(movedStub, anchorStub);
  }

  const indexOffset = insertedAtStart ? 2 : 0;

  if (!isConnectedToSource && initialSegment.waypointIndexBefore >= 0) {
    const idx = initialSegment.waypointIndexBefore + indexOffset;
    const wp = working[idx];
    if (wp) wp[moveAxis] = movedCoordinate;
  }

  if (!isConnectedToTarget && initialSegment.waypointIndexAfter < initialWaypoints.length) {
    const idx = initialSegment.waypointIndexAfter + indexOffset;
    const wp = working[idx];
    if (wp) wp[moveAxis] = movedCoordinate;
  }

  return consolidateWaypoints(working, pathSource, pathTarget);
}

/**
 * Two stub waypoints preserving the smooth-step shape where a dragged segment
 * meets a node anchor: one on the segment's original line at `stubCoord` (the
 * along-axis coordinate next to the anchor), one shifted to `movedCoordinate`
 * on the perpendicular axis.
 */
function makeStubPair(
  anchor: Point,
  orientation: Segment['orientation'],
  stubCoord: number,
  movedCoordinate: number
): [Waypoint, Waypoint] {
  if (orientation === 'horizontal') {
    return [
      { id: generateWaypointId(), x: stubCoord, y: anchor.y },
      { id: generateWaypointId(), x: stubCoord, y: movedCoordinate },
    ];
  }
  return [
    { id: generateWaypointId(), x: anchor.x, y: stubCoord },
    { id: generateWaypointId(), x: movedCoordinate, y: stubCoord },
  ];
}
