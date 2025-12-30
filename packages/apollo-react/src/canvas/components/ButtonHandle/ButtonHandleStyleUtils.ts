import { Position } from '@uipath/uix/xyflow/react';
import type { HandleConfigurationSpecificPosition } from '../BaseNode/BaseNode.types';
import { GRID_SPACING } from '../../constants';

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
 * Calculates grid-aligned positions for handles along a dimension.
 * First divides the space equally, then snaps each position to the nearest grid multiple.
 * Positions are rounded away from center to maximize handle spacing.
 * @param nodeSize - The size of the node in the relevant dimension (width for Top/Bottom handles, height for Left/Right handles)
 * @param numHandles - Number of handles to position
 * @param gridSize - The grid size
 * @returns Array of grid-snapped pixel positions for each handle
 */
export const calculateGridAlignedHandlePositions = (
  nodeSize: number,
  numHandles: number,
  gridSize: number = GRID_SPACING
): number[] => {
  if (numHandles === 0) return [];
  if (nodeSize <= 0) return [];

  const center = nodeSize / 2;
  const positions: number[] = [];

  for (let i = 0; i < numHandles; i++) {
    // Calculate ideal position using equal division
    const idealPosition = ((i + 1) / (numHandles + 1)) * nodeSize;

    // Snap to grid, rounding away from center to spread handles out
    let snappedPosition: number;
    if (idealPosition < center) {
      // Below center: round down
      snappedPosition = Math.floor(idealPosition / gridSize) * gridSize;
    } else if (idealPosition > center) {
      // Above center: round up
      snappedPosition = Math.ceil(idealPosition / gridSize) * gridSize;
    } else {
      // At center: snap to nearest
      snappedPosition = snapToGrid(idealPosition, gridSize);
    }

    positions.push(snappedPosition);
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
