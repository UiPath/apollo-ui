import type { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { snapToGrid } from '../../../utils/NodeUtils';
import { ARROW_OFFSETS, EDGE_CONSTANTS } from './constants';
import type { PathJump, PathVertex, Point, Segment, SegmentOrientation, Waypoint } from './types';

const { BORDER_RADIUS, MIN_SEGMENT_LENGTH, COLLINEAR_TOLERANCE: TOL } = EDGE_CONSTANTS;

export function snapPointToGrid(point: Point): Point {
  return { x: snapToGrid(point.x), y: snapToGrid(point.y) };
}

function getDirection(position: Position): { dx: number; dy: number } {
  switch (position) {
    case 'left':
      return { dx: -1, dy: 0 };
    case 'right':
      return { dx: 1, dy: 0 };
    case 'top':
      return { dx: 0, dy: -1 };
    case 'bottom':
      return { dx: 0, dy: 1 };
    default:
      return { dx: 1, dy: 0 };
  }
}

/** True when a node face exits horizontally (left/right), i.e. the connecting
 * segment runs along x. */
export function isHorizontalPosition(position: Position): boolean {
  return getDirection(position).dx !== 0;
}

/** The axis a source/target pair already shares, when both faces exit along it
 * and the cross-axis offset is within {@link EDGE_CONSTANTS.COLLINEAR_TOLERANCE}.
 * `null` when they are offset enough to need a mid-axis jog, or when the faces
 * exit on different axes (an L-shape, which never needs one). */
function getCollinearAxis(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
  targetPosition: Position
): 'horizontal' | 'vertical' | null {
  if (isHorizontalPosition(sourcePosition) && isHorizontalPosition(targetPosition)) {
    return Math.abs(sourceY - targetY) <= TOL ? 'horizontal' : null;
  }

  if (!isHorizontalPosition(sourcePosition) && !isHorizontalPosition(targetPosition)) {
    return Math.abs(sourceX - targetX) <= TOL ? 'vertical' : null;
  }

  return null;
}

/**
 * Auto-route a path between source and target with orthogonal segments
 * when no manual waypoints are provided.
 */
export function calculateAutoWaypoints(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
  targetPosition: Position
): Point[] {
  const sourceOffset = ARROW_OFFSETS[sourcePosition];
  const targetOffset = ARROW_OFFSETS[targetPosition];

  const startX = sourceX + sourceOffset.x;
  const startY = sourceY + sourceOffset.y;
  const endX = targetX + targetOffset.x;
  const endY = targetY + targetOffset.y;

  const isSourceHorizontal = isHorizontalPosition(sourcePosition);
  const isTargetHorizontal = isHorizontalPosition(targetPosition);
  const collinearAxis = getCollinearAxis(
    startX,
    startY,
    sourcePosition,
    endX,
    endY,
    targetPosition
  );

  const waypoints: Point[] = [];

  if (isSourceHorizontal && isTargetHorizontal) {
    const midX = snapToGrid((startX + endX) / 2);
    if (collinearAxis !== 'horizontal') {
      waypoints.push({ x: midX, y: startY });
      waypoints.push({ x: midX, y: endY });
    }
  } else if (!isSourceHorizontal && !isTargetHorizontal) {
    const midY = snapToGrid((startY + endY) / 2);
    if (collinearAxis !== 'vertical') {
      waypoints.push({ x: startX, y: midY });
      waypoints.push({ x: endX, y: midY });
    }
  } else if (isSourceHorizontal && !isTargetHorizontal) {
    waypoints.push({ x: endX, y: startY });
  } else {
    waypoints.push({ x: startX, y: endY });
  }

  return waypoints;
}

/**
 * Orthogonal connector joining a node anchor to its adjacent waypoint. Keeps
 * every segment axis-aligned so the stub never collapses into a diagonal line
 * once a node is dragged away from its (fixed) waypoints.
 *
 * The path must leave (or enter) a node perpendicular to the face it attaches
 * to. Two shapes, picked by where the point sits relative to the exit face:
 *
 * - **Point ahead** of the face → a single elbow gives a clean L (travel along
 *   the face axis to the point's coordinate, then turn).
 * - **Point behind** the face → a single elbow would fold the path straight
 *   back across the node. Instead, leave the face by a fixed {@link
 *   EDGE_CONSTANTS.STUB_OFFSET}, cross over to the point's far axis, then
 *   approach — a hook that clears the node.
 *
 * Returns `[]` when the anchor and point are already aligned (no elbow needed).
 * Degenerate elbows (coincident with the anchor, the point, or each other) are
 * dropped so no zero-length segments reach {@link createRoundedPath}.
 *
 * Remaining limitation: a point directly behind the face at the same cross-axis
 * (a true head-on reversal) still routes back over the node — clearing the
 * node's full bounding box needs node dimensions (a real router).
 */
export function routeAnchorToPoint(anchor: Point, anchorPosition: Position, point: Point): Point[] {
  const dir = getDirection(anchorPosition);
  const isHorizontal = dir.dx !== 0;

  // Signed distance from anchor to point along the exit direction. Negative
  // means the point sits behind the node face.
  const forward = isHorizontal ? (point.x - anchor.x) * dir.dx : (point.y - anchor.y) * dir.dy;

  let elbows: Point[];
  if (forward >= 0) {
    elbows = isHorizontal ? [{ x: point.x, y: anchor.y }] : [{ x: anchor.x, y: point.y }];
  } else {
    const { STUB_OFFSET } = EDGE_CONSTANTS;
    elbows = isHorizontal
      ? [
          { x: anchor.x + dir.dx * STUB_OFFSET, y: anchor.y },
          { x: anchor.x + dir.dx * STUB_OFFSET, y: point.y },
        ]
      : [
          { x: anchor.x, y: anchor.y + dir.dy * STUB_OFFSET },
          { x: point.x, y: anchor.y + dir.dy * STUB_OFFSET },
        ];
  }

  // Drop elbows coincident with the previous point or the destination — they
  // collapse into a straight join and would create zero-length segments.
  const result: Point[] = [];
  let prev = anchor;
  for (const elbow of elbows) {
    const samePrev = Math.abs(elbow.x - prev.x) < TOL && Math.abs(elbow.y - prev.y) < TOL;
    const samePoint = Math.abs(elbow.x - point.x) < TOL && Math.abs(elbow.y - point.y) < TOL;
    if (samePrev || samePoint) continue;
    result.push(elbow);
    prev = elbow;
  }
  return result;
}

/**
 * Orthogonal connector between two interior points (waypoint→waypoint). Returns
 * a single elbow when the points aren't already axis-aligned, or `[]` when they
 * are. The elbow leaves `from` perpendicular to how the path arrived there
 * (`incoming`) so the route doesn't immediately double back — producing a clean
 * staircase rather than a diagonal between non-aligned waypoints.
 */
function connectorElbow(from: Point, to: Point, incoming: SegmentOrientation | null): Point | null {
  const alignedX = Math.abs(from.x - to.x) < TOL;
  const alignedY = Math.abs(from.y - to.y) < TOL;
  if (alignedX || alignedY) return null;
  // Arrived horizontally → leave vertically (elbow shares from.x); otherwise
  // leave horizontally (elbow shares from.y).
  return incoming === 'horizontal' ? { x: from.x, y: to.y } : { x: to.x, y: from.y };
}

/**
 * Push the waypoint riser nearest a node face (`anchor` = inset source/target
 * endpoint) out to `EDGE_CONSTANTS.STUB_OFFSET` so the edge keeps a perpendicular
 * offset. Any riser closer than that is shifted forward, including bends behind
 * the face (gap < 0) — common on multi-handle nodes where the router's port sits
 * behind the rendered handle. Shifting the stored waypoint's own vertex (its
 * `waypointIndex` is preserved) survives consolidation, whereas a derived elbow
 * (`waypointIndex === -1`) would be collapsed.
 */
function clearNodeFace(waypoints: Waypoint[], anchor: Point, position: Position): Waypoint[] {
  const dir = getDirection(position);
  const axis = dir.dx !== 0 ? 'x' : 'y';
  const sign = dir.dx !== 0 ? dir.dx : dir.dy;
  const nearest = waypoints.reduce(
    (acc, w) => (sign > 0 ? Math.min(acc, w[axis]) : Math.max(acc, w[axis])),
    sign > 0 ? Infinity : -Infinity
  );
  // Lands the riser exactly STUB_OFFSET in front of the face for any gap < that,
  // including bends behind the face (gap < 0) — common on multi-handle nodes
  // where the router's port sits behind the rendered handle.
  const gap = (nearest - anchor[axis]) * sign;
  if (gap >= EDGE_CONSTANTS.STUB_OFFSET) return waypoints;
  const shift = (EDGE_CONSTANTS.STUB_OFFSET - gap) * sign;
  return waypoints.map((w) =>
    Math.abs(w[axis] - nearest) < TOL ? { ...w, [axis]: w[axis] + shift } : w
  );
}

/**
 * Build the ordered, provenance-tagged vertices of the path:
 * `[start, …, end]`. Falls back to auto-routing when no manual waypoints are
 * provided. When manual waypoints exist:
 *
 * - orthogonal stubs are derived between each anchor and its adjacent waypoint
 *   (see {@link routeAnchorToPoint}),
 * - consecutive waypoints are joined orthogonally (see {@link connectorElbow}),
 * - the whole thing is consolidated so redundant derived elbows collapse —
 *   user waypoints are protected, so the line is always drawn through them.
 *
 * Every vertex carries a `waypointIndex` (the stored waypoint it represents, or
 * `-1` for anchors/derived elbows) so the editor can map segments back to the
 * stored waypoints. Stubs and elbows are render-only — stored waypoints are
 * untouched.
 */
export function buildPathVertices(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
  targetPosition: Position,
  waypoints: Waypoint[] = [],
  // Router waypoints get face-clearance (clearNodeFace); manual ones render as-is.
  autoRouted = false
): PathVertex[] {
  const sourceOffset = ARROW_OFFSETS[sourcePosition];
  const targetOffset = ARROW_OFFSETS[targetPosition];

  const start: Point = { x: sourceX + sourceOffset.x, y: sourceY + sourceOffset.y };
  const end: Point = { x: targetX + targetOffset.x, y: targetY + targetOffset.y };

  const derived = (p: Point): PathVertex => ({ x: p.x, y: p.y, waypointIndex: -1 });

  if (waypoints.length === 0) {
    const autoWaypoints = calculateAutoWaypoints(
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition
    );
    return [start, ...autoWaypoints, end].map(derived);
  }

  const startVertex = derived(start);
  const endVertex = derived(end);

  // Clear both faces for auto-routed bends; leave manual waypoints as placed.
  const routed = autoRouted
    ? clearNodeFace(clearNodeFace(waypoints, start, sourcePosition), end, targetPosition)
    : waypoints;

  // `path` carries the start anchor only as orientation context for the
  // interior-elbow heuristic; it is sliced off before consolidation. The
  // anchors must never be fed to `consolidateWaypoints` — they are trivially
  // collinear with the path endpoints (they *are* the endpoints) and would be
  // trimmed, detaching the edge from its nodes.
  const path: PathVertex[] = [startVertex];

  // Source stub: anchor face → first waypoint.
  for (const elbow of routeAnchorToPoint(start, sourcePosition, routed[0]!)) {
    path.push(derived(elbow));
  }
  path.push({ x: routed[0]!.x, y: routed[0]!.y, waypointIndex: 0 });

  // Interior links: orthogonalize between consecutive waypoints.
  for (let i = 1; i < routed.length; i++) {
    const from = path[path.length - 1]!;
    const incoming = path.length >= 2 ? getSegmentOrientation(path[path.length - 2]!, from) : null;
    const elbow = connectorElbow(from, routed[i]!, incoming);
    if (elbow) path.push(derived(elbow));
    path.push({ x: routed[i]!.x, y: routed[i]!.y, waypointIndex: i });
  }

  // Target stub: last waypoint → anchor face (reverse of the anchor-outward order).
  const targetStub = routeAnchorToPoint(end, targetPosition, routed[routed.length - 1]!);
  for (let j = targetStub.length - 1; j >= 0; j--) {
    path.push(derived(targetStub[j]!));
  }

  // Consolidate the interior only (everything between the anchors), then wrap
  // it back in the untouched anchors.
  const interior = consolidateWaypoints(path.slice(1), start, end, (v) => v.waypointIndex >= 0);
  return [startVertex, ...interior, endVertex];
}

/**
 * Collapse a path's interior points to its minimal orthogonal form: drop
 * duplicates, remove points that are collinear with their neighbours, and trim
 * leading/trailing points that are collinear with the path endpoints. Iterates
 * to a fixed point so cascading removals settle.
 *
 * `isProtected` marks points that must never be dropped — user waypoints, so
 * the line is always drawn through them. Only the derived stub elbows around
 * them are cleaned. Defaults to protecting nothing (pure geometric collapse).
 *
 * Generic over `Point` so it preserves the concrete element type (and object
 * identity of surviving points — callers rely on this to detect no-op
 * changes). Lives here, not in `waypoints.ts`, so the render-path
 * `buildPathVertices` can reuse it without an import cycle.
 */
export function consolidateWaypoints<T extends Point>(
  points: T[],
  pathStart: Point,
  pathEnd: Point,
  isProtected: (point: T) => boolean = () => false
): T[] {
  let current = points;
  let changed = true;

  while (changed && current.length > 0) {
    changed = false;
    const before = current.length;

    if (current.length > 1) {
      const deduped: T[] = [current[0]!];
      for (let i = 1; i < current.length; i++) {
        const prev = deduped[deduped.length - 1]!;
        const curr = current[i]!;
        if (Math.abs(curr.x - prev.x) > TOL || Math.abs(curr.y - prev.y) > TOL) {
          deduped.push(curr);
        } else if (isProtected(curr) && !isProtected(prev)) {
          // Coincident points collapse to one; keep the protected waypoint
          // rather than the derived stub.
          deduped[deduped.length - 1] = curr;
        }
      }
      current = deduped;
    }

    if (current.length > 2) {
      const result: T[] = [current[0]!];
      for (let i = 1; i < current.length - 1; i++) {
        const prev = result[result.length - 1]!;
        const curr = current[i]!;
        const next = current[i + 1]!;
        const horizontalLine = Math.abs(prev.y - curr.y) <= TOL && Math.abs(curr.y - next.y) <= TOL;
        const verticalLine = Math.abs(prev.x - curr.x) <= TOL && Math.abs(curr.x - next.x) <= TOL;
        if ((!horizontalLine && !verticalLine) || isProtected(curr)) result.push(curr);
      }
      result.push(current[current.length - 1]!);
      current = result;
    }

    if (current.length >= 2) {
      const first = current[0]!;
      const second = current[1]!;
      const collinearH =
        Math.abs(pathStart.y - first.y) <= TOL && Math.abs(first.y - second.y) <= TOL;
      const collinearV =
        Math.abs(pathStart.x - first.x) <= TOL && Math.abs(first.x - second.x) <= TOL;
      if ((collinearH || collinearV) && !isProtected(first)) current = current.slice(1);
    }

    if (current.length >= 2) {
      const last = current[current.length - 1]!;
      const secondLast = current[current.length - 2]!;
      const collinearH =
        Math.abs(secondLast.y - last.y) <= TOL && Math.abs(last.y - pathEnd.y) <= TOL;
      const collinearV =
        Math.abs(secondLast.x - last.x) <= TOL && Math.abs(last.x - pathEnd.x) <= TOL;
      if ((collinearH || collinearV) && !isProtected(last)) current = current.slice(0, -1);
    }

    if (current.length === 1) {
      const wp = current[0]!;
      const collinearH = Math.abs(pathStart.y - wp.y) <= TOL && Math.abs(wp.y - pathEnd.y) <= TOL;
      const collinearV = Math.abs(pathStart.x - wp.x) <= TOL && Math.abs(wp.x - pathEnd.x) <= TOL;
      if ((collinearH || collinearV) && !isProtected(wp)) current = [];
    }

    if (current.length >= 2) {
      const cleaned: T[] = [];
      for (let i = 0; i < current.length; i++) {
        const curr = current[i]!;
        const prev = cleaned[cleaned.length - 1];
        const next = current[i + 1];
        if (!isProtected(curr)) {
          if (prev && Math.abs(curr.x - prev.x) <= TOL && Math.abs(curr.y - prev.y) <= TOL)
            continue;
          if (next && Math.abs(curr.x - next.x) <= TOL && Math.abs(curr.y - next.y) <= TOL)
            continue;
        }
        cleaned.push(curr);
      }
      current = cleaned;
    }

    changed = current.length !== before;
  }

  return current;
}

export function getSegmentOrientation(start: Point, end: Point): SegmentOrientation {
  return Math.abs(end.x - start.x) > Math.abs(end.y - start.y) ? 'horizontal' : 'vertical';
}

/**
 * True only when the segment is aligned on one axis (within tolerance).
 */
export function isSegmentPerpendicular(segment: { start: Point; end: Point }): boolean {
  const dx = Math.abs(segment.end.x - segment.start.x);
  const dy = Math.abs(segment.end.y - segment.start.y);
  return dx < TOL || dy < TOL;
}

/**
 * Derive per-segment metadata from the path vertices. `waypointIndexBefore/
 * After` are indices into the *interior* vertex list (= the materialized
 * waypoint list the editor builds on grab), with `-1` meaning the source anchor
 * and the interior count meaning the target anchor. Indexing against the
 * interior count — not the stored waypoint count — keeps the mapping correct
 * even when derived stubs/elbows are present.
 */
export function extractSegments(pathPoints: PathVertex[]): Segment[] {
  const segments: Segment[] = [];
  const interiorCount = Math.max(0, pathPoints.length - 2);
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const start = pathPoints[i]!;
    const end = pathPoints[i + 1]!;
    segments.push({
      id: `seg-${i}`,
      start: { x: start.x, y: start.y },
      end: { x: end.x, y: end.y },
      orientation: getSegmentOrientation(start, end),
      waypointIndexBefore: i - 1,
      waypointIndexAfter: i < interiorCount ? i : interiorCount,
    });
  }
  return segments;
}

/** Where a rounded corner starts and ends on the two segments it joins. */
type Corner = {
  start: Point;
  end: Point;
  /** False when the adjoining segments are too short to fit a curve. */
  rounded: boolean;
};

/**
 * Build an SVG path string. Each interior point becomes a quadratic curve
 * with radius clamped to half the shorter adjoining segment.
 *
 * `jumps` optionally marks crossings where the line hops over another edge:
 * each one replaces a stretch of the straight run with a semicircular arc (see
 * {@link appendRun}). Passing none reproduces the plain rounded path exactly.
 */
export function createRoundedPath(
  points: Point[],
  borderRadius: number = BORDER_RADIUS,
  jumps: readonly PathJump[] = []
): string {
  if (points.length < 2) return '';

  const firstPoint = points[0]!;
  const lastPoint = points[points.length - 1]!;
  const path: string[] = [`M ${firstPoint.x} ${firstPoint.y}`];

  // Corner `i` belongs to interior vertex `points[i]`, so it bounds the end of
  // segment `i - 1` and the start of segment `i`.
  const corners: (Corner | undefined)[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    corners[i] = buildCorner(points[i - 1]!, points[i]!, points[i + 1]!, borderRadius);
  }

  const jumpsBySegment = groupJumpsBySegment(jumps);

  for (let i = 0; i < points.length - 1; i++) {
    const from = i === 0 ? firstPoint : corners[i]!.end;
    const to = i === points.length - 2 ? lastPoint : corners[i + 1]!.start;

    appendRun(path, from, to, jumpsBySegment?.get(i));

    const corner = corners[i + 1];
    if (corner?.rounded) {
      const vertex = points[i + 1]!;
      path.push(`Q ${vertex.x} ${vertex.y} ${corner.end.x} ${corner.end.y}`);
    }
  }

  return path.join(' ');
}

function buildCorner(prev: Point, curr: Point, next: Point, borderRadius: number): Corner {
  const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
  const v2 = { x: next.x - curr.x, y: next.y - curr.y };
  const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  const radius = Math.min(borderRadius, Math.min(len1, len2) / 2);
  if (radius < 1) return { start: curr, end: curr, rounded: false };

  return {
    start: { x: curr.x - (v1.x / len1) * radius, y: curr.y - (v1.y / len1) * radius },
    end: { x: curr.x + (v2.x / len2) * radius, y: curr.y + (v2.y / len2) * radius },
    rounded: true,
  };
}

function groupJumpsBySegment(jumps: readonly PathJump[]): Map<number, PathJump[]> | null {
  if (jumps.length === 0) return null;

  const bySegment = new Map<number, PathJump[]>();
  for (const jump of jumps) {
    const existing = bySegment.get(jump.segmentIndex);
    if (existing) existing.push(jump);
    else bySegment.set(jump.segmentIndex, [jump]);
  }
  return bySegment;
}

/**
 * Draw one straight run, hopping over any crossings on it.
 *
 * A jump becomes `L` up to the arc's entry, then a half-circle of
 * {@link EDGE_CONSTANTS.LINE_JUMP_RADIUS} to its exit. The sweep flag is picked
 * from the direction of travel so every arc bulges to the same side, whichever
 * way the line runs.
 *
 * Two guards keep the arcs from fighting the rest of the path: a jump within a
 * radius of either end of the run would eat into the adjoining corner curve, and
 * a jump within a diameter of the previous one would scallop the line rather
 * than notch it. Both are dropped, so densely crossed stretches degrade to fewer
 * notches instead of a mess.
 */
function appendRun(path: string[], from: Point, to: Point, jumps?: PathJump[]): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  const radius = EDGE_CONSTANTS.LINE_JUMP_RADIUS;
  if (jumps && jumps.length > 0 && length > radius * 2) {
    const ux = dx / length;
    const uy = dy / length;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const sweep = (horizontal ? dx : dy) > 0 ? 1 : 0;

    // Sort into travel order: a run may go right-to-left or bottom-to-top.
    const distances = jumps
      .map((jump) => (jump.point.x - from.x) * ux + (jump.point.y - from.y) * uy)
      .filter((distance) => distance >= radius && distance <= length - radius)
      .sort((a, b) => a - b);

    let previous = Number.NEGATIVE_INFINITY;
    for (const distance of distances) {
      if (distance - previous < radius * 2) continue;
      previous = distance;

      const entry = { x: from.x + ux * (distance - radius), y: from.y + uy * (distance - radius) };
      const exit = { x: from.x + ux * (distance + radius), y: from.y + uy * (distance + radius) };

      path.push(`L ${entry.x} ${entry.y}`);
      path.push(`A ${radius} ${radius} 0 0 ${sweep} ${exit.x} ${exit.y}`);
    }
  }

  path.push(`L ${to.x} ${to.y}`);
}

export function getSegmentMidpoint(segment: Segment): Point {
  return {
    x: (segment.start.x + segment.end.x) / 2,
    y: (segment.start.y + segment.end.y) / 2,
  };
}

export function getSegmentLength(segment: Segment): number {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isSegmentInteractable(segment: Segment): boolean {
  return getSegmentLength(segment) >= MIN_SEGMENT_LENGTH;
}

/**
 * Point at half the total arc length of an orthogonal path. Used for label
 * placement so the label sits on a straight stretch rather than at a corner
 * waypoint. Linearly interpolates within the segment containing the midpoint.
 */
export function getPathArcMidpoint(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return { x: points[0]!.x, y: points[0]!.y };

  const lengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1]!.x - points[i]!.x;
    const dy = points[i + 1]!.y - points[i]!.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    lengths.push(len);
    total += len;
  }

  if (total === 0) return { x: points[0]!.x, y: points[0]!.y };

  const target = total / 2;
  let acc = 0;
  for (let i = 0; i < lengths.length; i++) {
    const segLen = lengths[i]!;
    if (acc + segLen >= target) {
      const t = (target - acc) / segLen;
      const start = points[i]!;
      const end = points[i + 1]!;
      return {
        x: start.x + t * (end.x - start.x),
        y: start.y + t * (end.y - start.y),
      };
    }
    acc += segLen;
  }

  const last = points[points.length - 1]!;
  return { x: last.x, y: last.y };
}
