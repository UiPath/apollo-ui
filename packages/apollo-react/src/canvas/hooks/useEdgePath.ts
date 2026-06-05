import {
  getSmoothStepPath,
  Position,
  type XYPosition,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { GRID_SPACING } from '../constants';

// Constants
const LOOP_HEIGHT = GRID_SPACING * 6;
const LOOP_SUCCESS_HEIGHT = GRID_SPACING * 7;
const LOOP_RIGHT_EXTENSION = GRID_SPACING * 3;
const LOOP_SUCCESS_RIGHT_EXTENSION = GRID_SPACING * 4;
const LOOP_LEFT_EXTENSION = GRID_SPACING * 2;
const LOOP_CORNER_RADIUS = GRID_SPACING;
const SOURCE_OFFSETS: Record<Position, { x: number; y: number }> = {
  [Position.Left]: { x: 8, y: 0 },
  [Position.Right]: { x: -8, y: 0 },
  [Position.Top]: { x: 0, y: 8 },
  [Position.Bottom]: { x: 0, y: -8 },
};

// Helper function to snap a value to the grid
const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SPACING) * GRID_SPACING;
};

const BEND_CORNER_RADIUS = GRID_SPACING;

const GAP_OFFSET = 28;

const distance = (a: XYPosition, b: XYPosition): number => Math.hypot(b.x - a.x, b.y - a.y);

const isColinear = (a: XYPosition, b: XYPosition, c: XYPosition): boolean =>
  (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);

const dropColinearBends = (
  interior: XYPosition[],
  start: XYPosition,
  end: XYPosition
): XYPosition[] => {
  const kept: XYPosition[] = [];
  let prev = start;
  for (let i = 0; i < interior.length; i++) {
    const cur = interior[i];
    if (!cur) continue;
    const next = interior[i + 1] ?? end;
    if (isColinear(prev, cur, next)) continue;
    kept.push(cur);
    prev = cur;
  }
  return kept;
};

// A point `d` units from `from` along the direction toward `to`.
const pointToward = (from: XYPosition, to: XYPosition, d: number): XYPosition => {
  const len = distance(from, to);
  if (len === 0) return { x: from.x, y: from.y };
  const t = d / len;
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
};

/**
 * Build an SVG path through an ordered list of points, rounding each interior
 * vertex with a quadratic curve.
 */
const roundedPolylinePath = (points: XYPosition[]): string => {
  const first = points[0];
  if (!first) return '';

  let path = `M ${first.x} ${first.y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const corner = points[i];
    const next = points[i + 1];
    if (!prev || !corner || !next) continue;
    const radiusIn = Math.min(BEND_CORNER_RADIUS, distance(prev, corner) / 2);
    const radiusOut = Math.min(BEND_CORNER_RADIUS, distance(corner, next) / 2);
    const approach = pointToward(corner, prev, radiusIn);
    const departure = pointToward(corner, next, radiusOut);
    path += ` L ${approach.x} ${approach.y} Q ${corner.x} ${corner.y} ${departure.x} ${departure.y}`;
  }
  const last = points[points.length - 1];
  if (last && points.length > 1) path += ` L ${last.x} ${last.y}`;
  return path;
};

/**
 * Helper function to create a custom loop path that goes below the node
 */
const createLoopPath = ({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  sourceHandleId,
}: EdgePathParams): { path: string; loopHeight: number } => {
  const offsets = SOURCE_OFFSETS[sourcePosition];
  const sourceOffsetX = sourceX + offsets.x;
  const sourceOffsetY = sourceY + offsets.y;
  const loopHeight = sourceHandleId === 'success' ? LOOP_SUCCESS_HEIGHT : LOOP_HEIGHT;
  const bottomY = Math.max(sourceOffsetY, targetY) + loopHeight;

  // Calculate extension points
  const rightExtension =
    sourceHandleId === 'success' ? LOOP_SUCCESS_RIGHT_EXTENSION : LOOP_RIGHT_EXTENSION;
  const rightPoint = snapToGrid(sourceX + rightExtension);
  const leftPoint = snapToGrid(targetX - LOOP_LEFT_EXTENSION);
  // Path with rounded corners using quadratic bezier curves
  const path = `
    M ${sourceOffsetX} ${sourceOffsetY}
    L ${rightPoint - LOOP_CORNER_RADIUS} ${sourceOffsetY}
    Q ${rightPoint} ${sourceOffsetY} ${rightPoint} ${sourceOffsetY + LOOP_CORNER_RADIUS}
    L ${rightPoint} ${bottomY - LOOP_CORNER_RADIUS}
    Q ${rightPoint} ${bottomY} ${rightPoint - LOOP_CORNER_RADIUS} ${bottomY}
    L ${leftPoint + LOOP_CORNER_RADIUS} ${bottomY}
    Q ${leftPoint} ${bottomY} ${leftPoint} ${bottomY - LOOP_CORNER_RADIUS}
    L ${leftPoint} ${targetY + LOOP_CORNER_RADIUS}
    Q ${leftPoint} ${targetY} ${leftPoint + LOOP_CORNER_RADIUS} ${targetY}
    L ${targetX} ${targetY}
  `
    .trim()
    .replace(/\s+/g, ' ');

  return { path, loopHeight };
};

export interface EdgePathParams {
  sourceNodeId: string;
  sourceHandleId: string | null | undefined;
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetNodeId: string;
  targetHandleId: string | null | undefined;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  bendPoints?: XYPosition[];
}

export interface EdgePathState {
  edgePath: string;
  labelX: number;
  labelY: number;
  isLoopEdge: boolean;
}

/**
 * Hook to calculate edge path for regular edges and loop edges.
 *
 * Regular edges use the standard smooth step path.
 *
 * Loop edges are detected in two ways:
 * 1. Self-loops: When sourceNodeId and targetNodeId nodes are the same
 * 2. LoopBack edges: When the targetNodeId handle is "loopBack"
 *
 * Loop edges render with a custom path that goes below the node with rounded corners,
 * while regular edges use the standard smooth step path.
 *
 * The loop height and right extension vary based on the sourceHandleId:
 * - "success" handle: Uses larger dimensions (96px height, 64px right extension)
 * - Default: Uses standard dimensions (64px height, 48px right extension)
 *
 * All coordinates are snapped to a 16px grid for visual consistency.
 */
export function useEdgePath({
  sourceNodeId,
  sourceHandleId,
  sourceX,
  sourceY,
  sourcePosition,
  targetNodeId,
  targetHandleId,
  targetX,
  targetY,
  targetPosition,
  bendPoints,
}: EdgePathParams): EdgePathState {
  // Memoize path calculation
  return useMemo(() => {
    // Get the edge to check sourceHandleId and targetHandleId

    // Detect if this is a self-loop, backwards edge, or loopBack edge that needs special handling
    const isSelfLoop = sourceNodeId === targetNodeId;
    const isLoopBackEdge = targetHandleId === 'loopBack';
    const needsCustomPath = isSelfLoop || isLoopBackEdge;

    let edgePath: string;
    let labelX: number;
    let labelY: number;

    // Keep only finite bends so a malformed/non-finite point can't corrupt the
    // SVG path; with none left we fall through to the smooth-step path.
    const finiteBends = bendPoints?.filter((p) => Number.isFinite(p?.x) && Number.isFinite(p?.y));
    const hasBendPoints = !needsCustomPath && finiteBends != null && finiteBends.length > 0;

    if (needsCustomPath) {
      // Use larger height and right extension for success edges
      const { path, loopHeight } = createLoopPath({
        sourceX,
        sourceY,
        sourceNodeId,
        sourceHandleId,
        sourcePosition,
        targetNodeId,
        targetHandleId,
        targetX,
        targetY,
        targetPosition,
      });
      edgePath = path;
      // Position label below the edge
      labelX = (sourceX + targetX) / 2;
      labelY = Math.max(sourceY, targetY) + loopHeight;
    } else if (hasBendPoints) {
      const start: XYPosition = {
        x: sourceX + SOURCE_OFFSETS[sourcePosition].x,
        y: sourceY + SOURCE_OFFSETS[sourcePosition].y,
      };
      const end: XYPosition = { x: targetX, y: targetY };

      // Copy the bends (shared edge data, mutated below) and drop colinear points
      // so the first/last two are the genuine exit/entry risers the shifts assume.
      const interior: XYPosition[] = dropColinearBends(
        finiteBends.map((p) => ({ x: p.x, y: p.y })),
        start,
        end
      );
      const isSrcHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
      const isTgtHorizontal = targetPosition === Position.Left || targetPosition === Position.Right;
      const firstBend = interior[0];
      const lastBend = interior[interior.length - 1];

      // Snap the first/last bend onto the handle's perpendicular axis so the
      // exit/entry segments stay orthogonal. Re-run after the shifts (see below).
      const snapFirstToSource = (): void => {
        if (!firstBend) return;
        if (isSrcHorizontal) firstBend.y = start.y;
        else firstBend.x = start.x;
      };
      const snapLastToTarget = (): void => {
        if (!lastBend) return;
        if (isTgtHorizontal) lastBend.y = end.y;
        else lastBend.x = end.x;
      };
      snapFirstToSource();
      snapLastToTarget();

      // Translate the bends in [from, to] by (dx, dy) — moving a riser's two
      // endpoints together keeps it and its neighbours orthogonal.
      const shiftBends = (from: number, to: number, dx: number, dy: number): void => {
        if (dx === 0 && dy === 0) return;
        for (let i = from; i <= to; i++) {
          const p = interior[i];
          if (p) {
            p.x += dx;
            p.y += dy;
          }
        }
      };

      // Pull the last riser back so the approach clears the target handle (only
      // when ELK's last bend is closer than GAP_OFFSET). Touches just the last
      // riser, leaving the source exit untouched.
      if (lastBend) {
        let dx = 0;
        let dy = 0;
        if (targetPosition === Position.Left) dx = Math.min(0, end.x - GAP_OFFSET - lastBend.x);
        else if (targetPosition === Position.Right)
          dx = Math.max(0, end.x + GAP_OFFSET - lastBend.x);
        else if (targetPosition === Position.Top) dy = Math.min(0, end.y - GAP_OFFSET - lastBend.y);
        else if (targetPosition === Position.Bottom)
          dy = Math.max(0, end.y + GAP_OFFSET - lastBend.y);
        shiftBends(interior.length - 2, interior.length - 1, dx, dy);
      }

      // Push the first riser past the handle so the throw-out clears the `+`
      // button before turning — measured from `start` with the same GAP_OFFSET
      // getSmoothStepPath uses, so bend and smooth-step edges exit alike.
      if (firstBend) {
        let dx = 0;
        let dy = 0;
        if (sourcePosition === Position.Right) dx = Math.max(0, start.x + GAP_OFFSET - firstBend.x);
        else if (sourcePosition === Position.Left)
          dx = Math.min(0, start.x - GAP_OFFSET - firstBend.x);
        else if (sourcePosition === Position.Bottom)
          dy = Math.max(0, start.y + GAP_OFFSET - firstBend.y);
        else if (sourcePosition === Position.Top)
          dy = Math.min(0, start.y - GAP_OFFSET - firstBend.y);
        shiftBends(0, 1, dx, dy);
      }

      // Re-snap: on a short route the two risers overlap, so a cross-axis shift
      // can knock the opposite end off its handle axis.
      snapFirstToSource();
      snapLastToTarget();

      const points: XYPosition[] = [start, ...interior, end];
      edgePath = roundedPolylinePath(points);

      const mid = points[Math.floor(points.length / 2)] ?? end;
      labelX = mid.x;
      labelY = mid.y;
    } else {
      const { sourceOffsetX, sourceOffsetY } = {
        sourceOffsetX: sourceX + SOURCE_OFFSETS[sourcePosition].x,
        sourceOffsetY: sourceY + SOURCE_OFFSETS[sourcePosition].y,
      };
      [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX: sourceOffsetX,
        sourceY: sourceOffsetY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 16,
        offset: GAP_OFFSET,
      });
    }

    return {
      edgePath,
      labelX,
      labelY,
      isLoopEdge: needsCustomPath,
    };
  }, [
    sourceNodeId,
    targetNodeId,
    targetHandleId,
    sourceHandleId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    bendPoints,
  ]);
}
