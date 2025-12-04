import { Position } from "@uipath/uix/xyflow/react";
import type { HandleConfigurationSpecificPosition } from "../BaseNode/BaseNode.types";
import { GRID_SPACING } from "../../constants";

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
export const calculateGridAlignedHandlePositions = (nodeSize: number, numHandles: number, gridSize: number = GRID_SPACING): number[] => {
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
}) => {
  if (customWidth) {
    // if we have a specific width, use it
    return `${customWidth}px`;
  }
  // otherwise default width value
  return position === Position.Top || position === Position.Bottom ? `${50 / numHandles}%` : "24px";
};

export const heightForHandleWithPosition = ({
  position,
  numHandles,
  customHeight,
}: {
  position: Position;
  numHandles: number;
  customHeight?: number;
}) => {
  if (customHeight) {
    // if we have a specific height, use it
    return `${customHeight}px`;
  }
  // otherwise default height value
  return position === Position.Top || position === Position.Bottom ? "24px" : `${50 / numHandles}%`;
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
}) => {
  if (customTop != null) {
    // if we have a specific top, use it
    if (position === Position.Left || position === Position.Right) {
      // if we have multiple handles, we need to position accordingly
      if (customHeight) {
        return `${customTop + customHeight * (positionPercent / 100) - customHeight / 2}px`;
      } else {
        return `calc(${positionPercent}% + ${customTop / 2}px)`;
      }
    } else {
      return `${customTop}px`;
    }
  }

  if (customBottom != null) {
    // if we have a specific top, don't set a bottom value
    return "unset";
  }

  // otherwise default top value depending on the position
  if (position === Position.Top) {
    return "0";
  }
  if (position === Position.Bottom) {
    return "unset";
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
}) => {
  if (customBottom != null) {
    // if we have a specific bottom, use it
    if (position === Position.Left || position === Position.Right) {
      // if we have multiple handles, we need to position accordingly
      if (customHeight) {
        return `${customBottom + customHeight * (positionPercent / 100) - customHeight / 2}px`;
      } else {
        return `calc(${positionPercent}% + ${customBottom / 2}px)`;
      }
    } else {
      return `${customBottom}px`;
    }
  }

  if (customTop != null) {
    // if we have a specific top, don't set a bottom value
    return "unset";
  }

  // otherwise default top value depending on the position
  if (position === Position.Bottom) {
    return "0";
  }
  return "unset";
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
}) => {
  if (customLeft != null) {
    // if we have a specific left, use it
    if (position === Position.Top || position === Position.Bottom) {
      // if we have multiple handles, we need to position accordingly
      if (customWidth) {
        return `${customLeft + customWidth * (positionPercent / 100) - customWidth / 2}px`;
      } else {
        return `calc(${positionPercent}% + ${customLeft / 2}px)`;
      }
    } else {
      return `${customLeft}px`;
    }
  }

  if (customRight != null) {
    // if we have a specific right, don't set a left value
    return "unset";
  }

  // otherwise default left value depending on the position
  if (position === Position.Left) {
    return "0";
  }
  if (position === Position.Right) {
    return "unset";
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
}) => {
  if (customRight != null) {
    // if we have a specific right, use it
    if (position === Position.Top || position === Position.Bottom) {
      // if we have multiple handles, we need to position accordingly
      if (customWidth) {
        return `${customRight + customWidth * (positionPercent / 100) - customWidth / 2}px`;
      } else {
        return `calc(${positionPercent}% + ${customRight / 2}px)`;
      }
    } else {
      return `${customRight}px`;
    }
  }

  if (customLeft != null) {
    // if we have a specific left, don't set a right value
    return "unset";
  }

  // otherwise default right value depending on the position
  if (position === Position.Right) {
    return "0";
  }
  return "unset";
};

export const transformForHandle = ({
  position,
  customPositionAndOffsets,
}: {
  position: Position;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
}) => {
  let horizontalPercent = "0%";
  let verticalPercent = "0%";

  if ((customPositionAndOffsets?.top != null || customPositionAndOffsets?.bottom != null) && customPositionAndOffsets?.height) {
    verticalPercent = "0%";
  } else {
    if (position === Position.Bottom) {
      verticalPercent = "50%";
    } else {
      verticalPercent = "-50%";
    }
  }

  if ((customPositionAndOffsets?.left != null || customPositionAndOffsets?.right != null) && customPositionAndOffsets?.width) {
    horizontalPercent = "0%";
  } else {
    if (position === Position.Right) {
      horizontalPercent = "50%";
    } else {
      horizontalPercent = "-50%";
    }
  }
  return `translate(${horizontalPercent}, ${verticalPercent})`;
};
