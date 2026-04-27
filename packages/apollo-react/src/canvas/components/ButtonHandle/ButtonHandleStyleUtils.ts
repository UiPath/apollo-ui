import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { GRID_SPACING } from '../../constants';
import type { HandleConfigurationSpecificPosition } from '../../schema/node-definition/handle';

/**
 * Returns true if the position is on a horizontal edge (Top or Bottom)
 */
const isHorizontalEdge = (position: Position): boolean =>
  position === Position.Top || position === Position.Bottom;

/**
 * Returns true if the position is on a vertical edge (Left or Right)
 */
const isVerticalEdge = (position: Position): boolean =>
  position === Position.Left || position === Position.Right;

/**
 * Snaps a value to the nearest grid multiple
 * @param value - The value to snap
 * @param gridSize - The grid size (defaults to GRID_SPACING)
 * @returns The value snapped to the nearest grid multiple
 */
export const snapToGrid = (value: number, gridSize: number = GRID_SPACING): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Calculates handle positions that are equidistant, symmetric around the node
 * center, and use a grid-aligned spacing.
 *
 * Symmetry note: positions are placed outward from the node's true center
 * rather than snapped individually. Per-position snapping with `Math.round`
 * (round-half-up) systematically biases the entire row in one direction when
 * `startPosition` lands on a half-grid value — most visibly with even handle
 * counts and odd-multiple spacings. Computing from the center keeps handles
 * mirrored across `nodeSize / 2` even if every position ends up half a grid
 * unit off (still pixel-aligned at the gridSize granularity used here).
 *
 * @param nodeSize - The size of the node in the relevant dimension (width for Top/Bottom handles, height for Left/Right handles)
 * @param numHandles - Number of handles to position
 * @param gridSize - The grid size for spacing
 * @returns Array of pixel positions for each handle, symmetric around the node center
 */
export const calculateGridAlignedHandlePositions = (
  nodeSize: number,
  numHandles: number,
  gridSize: number = GRID_SPACING
): number[] => {
  if (numHandles === 0) return [];
  if (nodeSize <= 0) return [];
  if (numHandles === 1) return [nodeSize / 2];

  const idealSpacing = nodeSize / (numHandles + 1);

  // Grid alignment is only meaningful when the node itself sits on the grid.
  // When nodeSize isn't a grid multiple, snapping spacing can't produce
  // grid-aligned positions, so just return ideal equidistant positions.
  if (nodeSize % gridSize !== 0) {
    const positions: number[] = [];
    for (let i = 0; i < numHandles; i++) {
      positions.push(idealSpacing * (i + 1));
    }
    return positions;
  }

  // Round to the nearest grid multiple, with a lower bound of one grid step so
  // handles don't all stack at the center when `idealSpacing < gridSize / 2`.
  const roundedSpacing = Math.round(idealSpacing / gridSize) * gridSize;
  let gridAlignedSpacing = Math.max(gridSize, roundedSpacing);

  // Distribute symmetrically around the node center.
  let totalSpan = (numHandles - 1) * gridAlignedSpacing;
  let startPosition = (nodeSize - totalSpan) / 2;

  // Since nodeSize is a grid multiple, startPosition is either on-grid or
  // exactly half a grid step off. Bump spacing down one grid step to fix parity.
  if (startPosition % gridSize !== 0 && gridAlignedSpacing > gridSize) {
    gridAlignedSpacing -= gridSize;
    totalSpan = (numHandles - 1) * gridAlignedSpacing;
    startPosition = (nodeSize - totalSpan) / 2;
  }

  const positions: number[] = [];
  for (let i = 0; i < numHandles; i++) {
    positions.push(startPosition + i * gridAlignedSpacing);
  }

  return positions;
};

/**
 * Converts a grid-aligned pixel position to a percentage of the node size
 * @param pixelPosition - The pixel position
 * @param nodeSize - The total node size
 * @returns The position as a percentage
 */
export const pixelToPercent = (pixelPosition: number, nodeSize: number): number => {
  if (nodeSize === 0) return 0;
  return (pixelPosition / nodeSize) * 100;
};

export const widthForHandleWithPosition = ({
  position,
  numHandles,
  customWidth,
}: {
  position: Position;
  numHandles: number;
  customWidth?: number;
}): string => {
  if (customWidth) {
    return `${customWidth}px`;
  }
  // Horizontal edges (Top/Bottom) scale width based on handle count; vertical edges use fixed width
  return isHorizontalEdge(position) ? `${50 / numHandles}%` : '24px';
};

export const heightForHandleWithPosition = ({
  position,
  numHandles,
  customHeight,
}: {
  position: Position;
  numHandles: number;
  customHeight?: number;
}): string => {
  if (customHeight) {
    return `${customHeight}px`;
  }
  // Horizontal edges (Top/Bottom) use fixed height; vertical edges scale height based on handle count
  return isHorizontalEdge(position) ? '24px' : `${50 / numHandles}%`;
};

export const topPositionForHandle = ({
  position,
  positionPercent,
  customHeight,
  customTop,
  customBottom,
}: {
  position: Position;
  positionPercent: number;
  customHeight?: number;
  customTop?: number;
  customBottom?: number;
}): string => {
  if (customTop != null) {
    if (isVerticalEdge(position)) {
      // For vertical edges with multiple handles, position along the edge
      if (customHeight) {
        return `${customTop + customHeight * (positionPercent / 100) - customHeight / 2}px`;
      }
      return `calc(${positionPercent}% + ${customTop / 2}px)`;
    }
    return `${customTop}px`;
  }

  if (customBottom != null) {
    // When customBottom is set, don't set top (use bottom positioning instead)
    return 'unset';
  }

  // Default positioning based on edge
  if (position === Position.Top) {
    return '0';
  }
  if (position === Position.Bottom) {
    return 'unset';
  }
  return `${positionPercent}%`;
};

export const bottomPositionForHandle = ({
  position,
  positionPercent,
  customHeight,
  customTop,
  customBottom,
}: {
  position: Position;
  positionPercent: number;
  customHeight?: number;
  customTop?: number;
  customBottom?: number;
}): string => {
  if (customBottom != null) {
    if (isVerticalEdge(position)) {
      // For vertical edges with multiple handles, position along the edge
      if (customHeight) {
        return `${customBottom + customHeight * (positionPercent / 100) - customHeight / 2}px`;
      }
      return `calc(${positionPercent}% + ${customBottom / 2}px)`;
    }
    return `${customBottom}px`;
  }

  if (customTop != null) {
    // When customTop is set, don't set bottom (use top positioning instead)
    return 'unset';
  }

  // Default positioning based on edge
  if (position === Position.Bottom) {
    return '0';
  }
  return 'unset';
};

export const leftPositionForHandle = ({
  position,
  positionPercent,
  customWidth,
  customRight,
  customLeft,
}: {
  position: Position;
  positionPercent: number;
  customWidth?: number;
  customRight?: number;
  customLeft?: number;
}): string => {
  if (customLeft != null) {
    if (isHorizontalEdge(position)) {
      // For horizontal edges with multiple handles, position along the edge
      if (customWidth) {
        return `${customLeft + customWidth * (positionPercent / 100) - customWidth / 2}px`;
      }
      return `calc(${positionPercent}% + ${customLeft / 2}px)`;
    }
    return `${customLeft}px`;
  }

  if (customRight != null) {
    // When customRight is set, don't set left (use right positioning instead)
    return 'unset';
  }

  // Default positioning based on edge
  if (position === Position.Left) {
    return '0';
  }
  if (position === Position.Right) {
    return 'unset';
  }
  return `${positionPercent}%`;
};

export const rightPositionForHandle = ({
  position,
  positionPercent,
  customWidth,
  customRight,
  customLeft,
}: {
  position: Position;
  positionPercent: number;
  customWidth?: number;
  customRight?: number;
  customLeft?: number;
}): string => {
  if (customRight != null) {
    if (isHorizontalEdge(position)) {
      // For horizontal edges with multiple handles, position along the edge
      if (customWidth) {
        return `${customRight + customWidth * (positionPercent / 100) - customWidth / 2}px`;
      }
      return `calc(${positionPercent}% + ${customRight / 2}px)`;
    }
    return `${customRight}px`;
  }

  if (customLeft != null) {
    // When customLeft is set, don't set right (use left positioning instead)
    return 'unset';
  }

  // Default positioning based on edge
  if (position === Position.Right) {
    return '0';
  }
  return 'unset';
};

export const transformForHandle = ({
  position,
  customPositionAndOffsets,
}: {
  position: Position;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
}): string => {
  const hasCustomVertical =
    (customPositionAndOffsets?.top != null || customPositionAndOffsets?.bottom != null) &&
    customPositionAndOffsets?.height;
  const hasCustomHorizontal =
    (customPositionAndOffsets?.left != null || customPositionAndOffsets?.right != null) &&
    customPositionAndOffsets?.width;

  const verticalPercent = hasCustomVertical ? '0%' : position === Position.Bottom ? '50%' : '-50%';
  const horizontalPercent = hasCustomHorizontal
    ? '0%'
    : position === Position.Right
      ? '50%'
      : '-50%';

  return `translate(${horizontalPercent}, ${verticalPercent})`;
};
