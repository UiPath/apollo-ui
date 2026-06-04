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

const distance = (a: XYPosition, b: XYPosition): number => Math.hypot(b.x - a.x, b.y - a.y);

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

    const hasBendPoints = !needsCustomPath && bendPoints != null && bendPoints.length > 0;

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

      // Copy the bends — they're shared edge data and we mutate below (snap + shift).
      const interior: XYPosition[] = bendPoints.map((p) => ({ x: p.x, y: p.y }));
      const isSrcHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
      const isTgtHorizontal = targetPosition === Position.Left || targetPosition === Position.Right;
      const firstBend = interior[0];
      const lastBend = interior[interior.length - 1];

      // Snap the first/last bend onto the handle's perpendicular axis so the
      // exit/entry segments stay orthogonal despite ELK's port vs handle offset.
      if (firstBend) {
        if (isSrcHorizontal) firstBend.y = start.y;
        else firstBend.x = start.x;
      }
      if (lastBend) {
        if (isTgtHorizontal) lastBend.y = end.y;
        else lastBend.x = end.x;
      }

      // Keep the riser at least the source-offset past the handle in the exit
      // direction; otherwise it lands on/behind the protruding handle and routes
      // back into the node. Shift every bend by the shortfall to preserve shape.
      if (firstBend) {
        const exitGap = Math.abs(
          isSrcHorizontal ? SOURCE_OFFSETS[sourcePosition].x : SOURCE_OFFSETS[sourcePosition].y
        );
        let dx = 0;
        let dy = 0;
        if (sourcePosition === Position.Right) dx = Math.max(0, sourceX + exitGap - firstBend.x);
        else if (sourcePosition === Position.Left)
          dx = Math.min(0, sourceX - exitGap - firstBend.x);
        else if (sourcePosition === Position.Bottom)
          dy = Math.max(0, sourceY + exitGap - firstBend.y);
        else if (sourcePosition === Position.Top) dy = Math.min(0, sourceY - exitGap - firstBend.y);
        if (dx !== 0 || dy !== 0) {
          for (const p of interior) {
            p.x += dx;
            p.y += dy;
          }
        }
      }

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
