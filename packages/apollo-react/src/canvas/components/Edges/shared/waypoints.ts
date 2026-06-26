import type { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { snapToGrid } from '../../../utils/NodeUtils';
import { EDGE_CONSTANTS } from './constants';
import { consolidateWaypoints, isHorizontalPosition, snapPointToGrid } from './geometry';
import type { PathVertex, Point, Segment, Waypoint } from './types';

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
