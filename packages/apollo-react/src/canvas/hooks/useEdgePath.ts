import { getSmoothStepPath, Position } from '@uipath/apollo-react/canvas/xyflow/react';
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
  ]);
}
