import { EDGE_CONSTANTS } from '../constants';
import type { PathJump, Point } from '../types';

const { COLLINEAR_TOLERANCE: TOL, BORDER_RADIUS } = EDGE_CONSTANTS;

/** One edge's rendered polyline, as registered with the crossings store. */
export type EdgePolyline = {
  edgeId: string;
  /** Ordered path vertices. Segment `i` runs from `points[i]` to `points[i + 1]`. */
  points: Point[];
};

type HorizontalSegment = {
  edgeId: string;
  segmentIndex: number;
  y: number;
  xMin: number;
  xMax: number;
};

type VerticalSegment = {
  edgeId: string;
  x: number;
  yMin: number;
  yMax: number;
  /** Clearance a crossing needs from the low-y end to count. */
  minMargin: number;
  /** Clearance a crossing needs from the high-y end to count. */
  maxMargin: number;
};

/**
 * Find every point where one edge's horizontal segment crosses another edge's
 * vertical segment, and return the resulting line jumps keyed by edge id.
 *
 * Only the horizontal side of a crossing gets a jump — the vertical line is
 * drawn through, unbroken. Making the choice depend on orientation alone (and
 * not on edge order, selection, or registration order) keeps the notch pattern
 * stable while nodes are dragged around.
 *
 * A crossing counts only when the intersection is strictly interior to both
 * segments. Lines that merely meet — a T-junction, a shared node face, two
 * edges fanning out of one handle — touch at a segment end and are skipped, so
 * notches appear only where a line genuinely passes over another. Where the
 * crossed segment runs into a bend, the clearance widens to the border radius:
 * the rendered line curves away from the ideal corner there, and an arc placed
 * on the corner would sit beside the stroke instead of over it.
 *
 * Jumps are returned grouped by edge, ordered by `segmentIndex` and then by
 * ascending x within a segment. The path builder re-sorts them into travel
 * order, since a segment may run right-to-left.
 */
export function computeLineJumps(polylines: EdgePolyline[]): Map<string, PathJump[]> {
  const horizontals: HorizontalSegment[] = [];
  const verticals: VerticalSegment[] = [];

  for (const { edgeId, points } of polylines) {
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!;
      const b = points[i + 1]!;
      const dx = Math.abs(b.x - a.x);
      const dy = Math.abs(b.y - a.y);

      if (dy <= TOL && dx > TOL) {
        horizontals.push({
          edgeId,
          segmentIndex: i,
          y: a.y,
          xMin: Math.min(a.x, b.x),
          xMax: Math.max(a.x, b.x),
        });
      } else if (dx <= TOL && dy > TOL) {
        // A bend is rendered as a curve that pulls the stroke off the ideal
        // corner for up to the border radius, so a crossing that close to one
        // would arc over a line that is no longer there. The radius the path
        // builder uses is clamped by the adjoining segments; half this one is a
        // cheap upper bound on it, and erring long only costs a notch. Terminal
        // anchors are drawn straight, so they keep the bare tolerance.
        const bendMargin = Math.min(BORDER_RADIUS, dy / 2);
        const startMargin = i > 0 ? bendMargin : TOL;
        const endMargin = i + 2 < points.length ? bendMargin : TOL;
        const descending = b.y > a.y;

        verticals.push({
          edgeId,
          x: a.x,
          yMin: Math.min(a.y, b.y),
          yMax: Math.max(a.y, b.y),
          minMargin: descending ? startMargin : endMargin,
          maxMargin: descending ? endMargin : startMargin,
        });
      }
      // Diagonal segments never occur in an orthogonal path; anything that is
      // neither horizontal nor vertical is ignored rather than approximated.
    }
  }

  if (horizontals.length === 0 || verticals.length === 0) return new Map();

  verticals.sort((a, b) => a.x - b.x);
  const xs = verticals.map((v) => v.x);

  const result = new Map<string, PathJump[]>();

  for (const h of horizontals) {
    // Only verticals inside the horizontal's span can cross it, and the search
    // bounds already exclude the horizontal's own endpoints.
    let jumps: PathJump[] | undefined;
    let lastX = Number.NEGATIVE_INFINITY;

    for (let i = lowerBound(xs, h.xMin + TOL); i < verticals.length; i++) {
      const v = verticals[i]!;
      if (v.x >= h.xMax - TOL) break;
      if (v.edgeId === h.edgeId) continue;
      // Clear of both ends of the vertical, so a line stopping on this one
      // reads as a junction rather than a crossing, and one meeting it where it
      // curves into a bend is left alone rather than hopping beside the stroke.
      if (h.y <= v.yMin + v.minMargin || h.y >= v.yMax - v.maxMargin) continue;
      // Exactly overlapping verticals (common when two edges share a lane)
      // would otherwise stack identical arcs on the same spot.
      if (v.x - lastX <= TOL) continue;

      lastX = v.x;
      jumps ??= [];
      jumps.push({ segmentIndex: h.segmentIndex, point: { x: v.x, y: h.y } });
    }

    if (!jumps) continue;

    const existing = result.get(h.edgeId);
    if (existing) existing.push(...jumps);
    else result.set(h.edgeId, jumps);
  }

  return result;
}

/** Index of the first entry in the ascending array that is `>= value`. */
function lowerBound(sorted: number[], value: number): number {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (sorted[mid]! < value) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * Positional equality for two polylines, used to drop registrations that cannot
 * move a crossing. Compared at the same tolerance as {@link jumpsEqual}, so a
 * polyline that passes here provably derives the same jump set.
 */
export function polylinesEqual(a: readonly Point[], b: readonly Point[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i]!;
    const right = b[i]!;
    if (Math.abs(left.x - right.x) > TOL) return false;
    if (Math.abs(left.y - right.y) > TOL) return false;
  }
  return true;
}

/** Positional equality for two jump lists, used to keep snapshot identity stable. */
export function jumpsEqual(a: readonly PathJump[], b: readonly PathJump[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i]!;
    const right = b[i]!;
    if (left.segmentIndex !== right.segmentIndex) return false;
    if (Math.abs(left.point.x - right.point.x) > TOL) return false;
    if (Math.abs(left.point.y - right.point.y) > TOL) return false;
  }
  return true;
}
