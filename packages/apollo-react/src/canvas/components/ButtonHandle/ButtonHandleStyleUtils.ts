import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
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

// Default handle hit areas cover half of the node edge, split across handles.
// The cross-axis remains fixed so labels/buttons align to a stable anchor.
export const HANDLE_CROSS_AXIS_SIZE_PX = 24;
export const HANDLE_EDGE_COVERAGE_RATIO = 0.5;

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
  return isHorizontalEdge(position)
    ? `${(HANDLE_EDGE_COVERAGE_RATIO * 100) / numHandles}%`
    : `${HANDLE_CROSS_AXIS_SIZE_PX}px`;
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
  return isHorizontalEdge(position)
    ? `${HANDLE_CROSS_AXIS_SIZE_PX}px`
    : `${(HANDLE_EDGE_COVERAGE_RATIO * 100) / numHandles}%`;
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
