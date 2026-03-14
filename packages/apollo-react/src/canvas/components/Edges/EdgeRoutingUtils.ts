/**
 * Edge routing utilities for ELK-computed orthogonal paths.
 *
 * When ELK's layered algorithm with ORTHOGONAL edge routing is used,
 * it produces bend points that route edges around nodes. These utilities
 * convert those points into SVG paths with rounded corners.
 */

import { EDGE_BORDER_RADIUS, HANDLE_OFFSET } from '../../constants';

export interface RoutingPoint {
  x: number;
  y: number;
}

/** Threshold (px) below which a coordinate difference is treated as zero. */
const ORTHO_SNAP_THRESHOLD = 1;

/**
 * Ensure all segments in the point array are orthogonal (axis-aligned).
 *
 * The first point (source) and last point (target) come from React Flow handle
 * positions, while intermediate points come from ELK. These coordinate spaces
 * can differ due to grid snapping and handle offsets, creating non-orthogonal
 * segments at the endpoints.
 *
 * Strategy:
 * - First segment: snap the first bend point to be axis-aligned with the source
 * - Last segment: snap the last bend point to be axis-aligned with the target
 * - Middle segments: insert step midpoints for any non-orthogonal segments
 */
export function toOrthogonalPoints(points: RoutingPoint[]): RoutingPoint[] {
  if (points.length < 2) return points;

  const pts = points.map((p) => ({ ...p }));

  if (pts.length >= 3) {
    // Snap first bend to be axis-aligned with source
    const src = pts[0]!;
    const firstBend = pts[1]!;
    const fdx = Math.abs(firstBend.x - src.x);
    const fdy = Math.abs(firstBend.y - src.y);
    if (fdx > ORTHO_SNAP_THRESHOLD && fdy > ORTHO_SNAP_THRESHOLD) {
      if (fdx >= fdy) firstBend.y = src.y;
      else firstBend.x = src.x;
    } else {
      if (fdy <= ORTHO_SNAP_THRESHOLD) firstBend.y = src.y;
      if (fdx <= ORTHO_SNAP_THRESHOLD) firstBend.x = src.x;
    }

    // Snap last bend to be axis-aligned with target
    const tgt = pts[pts.length - 1]!;
    const lastBend = pts[pts.length - 2]!;
    const ldx = Math.abs(tgt.x - lastBend.x);
    const ldy = Math.abs(tgt.y - lastBend.y);
    if (ldx > ORTHO_SNAP_THRESHOLD && ldy > ORTHO_SNAP_THRESHOLD) {
      if (ldx >= ldy) lastBend.y = tgt.y;
      else lastBend.x = tgt.x;
    } else {
      if (ldy <= ORTHO_SNAP_THRESHOLD) lastBend.y = tgt.y;
      if (ldx <= ORTHO_SNAP_THRESHOLD) lastBend.x = tgt.x;
    }
  }

  const result: RoutingPoint[] = [pts[0]!];
  for (let i = 1; i < pts.length; i++) {
    const prev = result[result.length - 1]!;
    const curr = pts[i]!;
    const dx = Math.abs(curr.x - prev.x);
    const dy = Math.abs(curr.y - prev.y);
    if (dx < ORTHO_SNAP_THRESHOLD || dy < ORTHO_SNAP_THRESHOLD) {
      // Snap the near-zero axis to be exactly aligned
      if (dx < ORTHO_SNAP_THRESHOLD) curr.x = prev.x;
      if (dy < ORTHO_SNAP_THRESHOLD) curr.y = prev.y;
      result.push(curr);
      continue;
    }
    const midX = (prev.x + curr.x) / 2;
    result.push({ x: midX, y: prev.y });
    result.push({ x: midX, y: curr.y });
    result.push(curr);
  }
  return result;
}

/**
 * Build an SVG path from routing points. Points are first orthogonalized
 * (snapped to axis-aligned segments) and then connected with rounded corners
 * — matching the visual style of getSmoothStepPath.
 *
 * Returns both the SVG path string and the orthogonalized points so that
 * callers can reuse them for label placement and arrow direction without
 * re-running the orthogonalization.
 *
 * @param points - Raw array of {x, y} routing coordinates
 * @param borderRadius - Radius for rounded corners at bends (default: 16)
 */
export function buildOrthogonalPath(
  points: RoutingPoint[],
  borderRadius = EDGE_BORDER_RADIUS,
): { path: string; orthoPoints: RoutingPoint[] } {
  if (points.length < 2) return { path: '', orthoPoints: [] };

  const ortho = toOrthogonalPoints(points);

  if (ortho.length < 2) return { path: '', orthoPoints: ortho };
  if (ortho.length === 2) {
    return {
      path: `M ${ortho[0]!.x} ${ortho[0]!.y} L ${ortho[1]!.x} ${ortho[1]!.y}`,
      orthoPoints: ortho,
    };
  }

  const parts: string[] = [`M ${ortho[0]!.x} ${ortho[0]!.y}`];
  for (let i = 1; i < ortho.length - 1; i++) {
    const prev = ortho[i - 1]!;
    const curr = ortho[i]!;
    const next = ortho[i + 1]!;
    const d1 = Math.abs(curr.x - prev.x) + Math.abs(curr.y - prev.y);
    const d2 = Math.abs(next.x - curr.x) + Math.abs(next.y - curr.y);
    const r = Math.min(borderRadius, d1 / 2, d2 / 2);
    if (r < 1) {
      parts.push(`L ${curr.x} ${curr.y}`);
      continue;
    }
    const dx1 = d1 > 0 ? (curr.x - prev.x) / d1 : 0;
    const dy1 = d1 > 0 ? (curr.y - prev.y) / d1 : 0;
    const dx2 = d2 > 0 ? (next.x - curr.x) / d2 : 0;
    const dy2 = d2 > 0 ? (next.y - curr.y) / d2 : 0;
    parts.push(`L ${curr.x - dx1 * r} ${curr.y - dy1 * r}`);
    parts.push(`Q ${curr.x} ${curr.y} ${curr.x + dx2 * r} ${curr.y + dy2 * r}`);
  }
  parts.push(`L ${ortho[ortho.length - 1]!.x} ${ortho[ortho.length - 1]!.y}`);
  return { path: parts.join(' '), orthoPoints: ortho };
}

/**
 * Determine the arrow angle from the last segment of a routed path.
 * Returns the angle the arrow should point (INTO the target node)
 * and the offset to keep the arrow away from the node edge.
 *
 * Skips trailing zero-length segments (duplicate points from ELK or snapping)
 * and returns a neutral fallback when no direction can be inferred.
 */
export function arrowFromLastSegment(points: RoutingPoint[]): { angle: number; offsetX: number; offsetY: number } {
  if (points.length < 2) return { angle: 0, offsetX: 0, offsetY: 0 };

  // Walk backwards to find a non-zero-length segment
  const last = points[points.length - 1]!;
  for (let i = points.length - 2; i >= 0; i--) {
    const prev = points[i]!;
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    if (Math.abs(dx) < ORTHO_SNAP_THRESHOLD && Math.abs(dy) < ORTHO_SNAP_THRESHOLD) continue;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0
        ? { angle: 0, offsetX: HANDLE_OFFSET, offsetY: 0 }
        : { angle: Math.PI, offsetX: -HANDLE_OFFSET, offsetY: 0 };
    }
    return dy > 0
      ? { angle: Math.PI / 2, offsetX: 0, offsetY: HANDLE_OFFSET }
      : { angle: -Math.PI / 2, offsetX: 0, offsetY: -HANDLE_OFFSET };
  }

  return { angle: 0, offsetX: 0, offsetY: 0 };
}

/**
 * Calculate the midpoint of a polyline path for label positioning.
 * Walks along the path segments and returns the point at half the total length.
 */
export function calculatePathMidpoint(points: RoutingPoint[]): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0]!;

  let totalLength = 0;
  const segLens: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const len = Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y);
    segLens.push(len);
    totalLength += len;
  }
  let remaining = totalLength / 2;
  for (let i = 0; i < segLens.length; i++) {
    if (remaining <= segLens[i]!) {
      const t = segLens[i]! > 0 ? remaining / segLens[i]! : 0;
      return {
        x: points[i]!.x + (points[i + 1]!.x - points[i]!.x) * t,
        y: points[i]!.y + (points[i + 1]!.y - points[i]!.y) * t,
      };
    }
    remaining -= segLens[i]!;
  }
  return points[points.length - 1]!;
}
