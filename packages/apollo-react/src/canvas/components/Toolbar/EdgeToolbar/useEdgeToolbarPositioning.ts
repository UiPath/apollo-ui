import { Position, useReactFlow, type XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { snapToGrid } from '../../../utils';
import type { EdgeToolbarPositionData } from './EdgeToolbar.types';

export interface EdgeToolbarPositioning {
  positionData: EdgeToolbarPositionData | null;
  handleMouseMoveOnPath?: (event: React.MouseEvent) => void;
}

export interface UseEdgeToolbarPositioningProps {
  pathElementRef: React.MutableRefObject<SVGPathElement | null>;
  isEnabled: boolean;
  targetPosition: Position;
}

const MIN_MOUSE_FOLLOW_DISTANCE = 100;
const DEFAULT_OFFSET_DISTANCE = 24;
const LINE_TANGENT_SAMPLE_DISTANCE = 10;

/**
 * Uses ternary search to find the nearest point on the path (as length along the path) to the given mouse position.
 */
function getNearestLengthOnPath(
  pathElement: SVGPathElement,
  mousePosition: { x: number; y: number }
): number {
  const totalLength = pathElement.getTotalLength();
  // If the path is short, just return the midpoint.
  if (totalLength < MIN_MOUSE_FOLLOW_DISTANCE) {
    return totalLength / 2;
  }

  let left = 0;
  let right = totalLength;
  const threshold = 1; // Stop when search range is within 1 pixel

  while (right - left > threshold) {
    const mid1 = left + (right - left) / 3;
    const mid2 = right - (right - left) / 3;

    const point1 = pathElement.getPointAtLength(mid1);
    const point2 = pathElement.getPointAtLength(mid2);

    const dist1 = Math.hypot(point1.x - mousePosition.x, point1.y - mousePosition.y);
    const dist2 = Math.hypot(point2.x - mousePosition.x, point2.y - mousePosition.y);

    if (dist1 > dist2) {
      left = mid1;
    } else {
      right = mid2;
    }
  }

  return (left + right) / 2;
}

/**
 * Calculates a point offset from the bounding box of the path element based on the target position.
 */
function getOffsetPointFromPathBoundingBox(
  pathElement: SVGPathElement,
  targetPosition: Position,
  offsetDistance: number = DEFAULT_OFFSET_DISTANCE
): XYPosition {
  const box = pathElement.getBBox();

  switch (targetPosition) {
    case Position.Top: {
      const centerY = box.y + box.height / 2;
      const offsetX = box.x + box.width + offsetDistance; // Offset right of the path
      return { x: offsetX, y: centerY };
    }

    case Position.Bottom: {
      const centerY = box.y + box.height / 2;
      const offsetX = box.x - offsetDistance; // Offset left of the path
      return { x: offsetX, y: centerY };
    }

    case Position.Left:
    case Position.Right: {
      const centerX = box.x + box.width / 2;
      const offsetY = box.y - offsetDistance; // Offset above the path
      return { x: centerX, y: offsetY };
    }
  }
}

/**
 * Calculates a point offset perpendicular to the path direction at a given length along the path.
 */
function getPerpendicularOffsetPointAtPathLength(
  pathElement: SVGPathElement,
  length: number,
  offsetDistance: number = 24
): XYPosition {
  const totalLength = pathElement.getTotalLength();

  // Sample points before and after to calculate tangent
  const beforeLength = Math.max(0, length - LINE_TANGENT_SAMPLE_DISTANCE);
  const afterLength = Math.min(totalLength, length + LINE_TANGENT_SAMPLE_DISTANCE);

  const pathPoint = pathElement.getPointAtLength(length);
  const beforePoint = pathElement.getPointAtLength(beforeLength);
  const afterPoint = pathElement.getPointAtLength(afterLength);

  // Calculate tangent vector (direction of path)
  const tangentX = afterPoint.x - beforePoint.x;
  const tangentY = afterPoint.y - beforePoint.y;
  const tangentLength = Math.hypot(tangentX, tangentY);

  // Normalize tangent
  const normTangentX = tangentX / tangentLength;
  const normTangentY = tangentY / tangentLength;

  // Calculate normal vector (perpendicular to tangent)
  // Rotate tangent 90° clockwise: (x, y) -> (y, -x)
  const normalX = normTangentY;
  const normalY = -normTangentX;

  // Offset the point perpendicular to the path
  const offsetX = pathPoint.x + normalX * offsetDistance;
  const offsetY = pathPoint.y + normalY * offsetDistance;

  return { x: offsetX, y: offsetY };
}

/**
 * Hook to track mouse position along an edge path.
 * Returns the flow position, screen position, and percentage along the path.
 */
export function useEdgeToolbarPositioning({
  pathElementRef,
  isEnabled,
  targetPosition,
}: UseEdgeToolbarPositioningProps): EdgeToolbarPositioning {
  const reactFlow = useReactFlow();
  const [positionData, setPositionData] = useState<EdgeToolbarPositionData | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Reset position and cleanup when disabled
  useEffect(() => {
    if (!isEnabled) {
      // Cancel any pending animation frame
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      setPositionData(null);
    }

    // Cleanup on unmount
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isEnabled]);

  const handleMouseMoveOnPath = useCallback(
    (event: React.MouseEvent) => {
      if (!isEnabled || !pathElementRef.current) {
        return;
      }

      // Cancel any pending animation frame to throttle updates
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      // Throttle updates using requestAnimationFrame (max 60fps)
      rafIdRef.current = requestAnimationFrame(() => {
        if (!pathElementRef.current) {
          return;
        }

        // Convert screen coordinates to flow coordinates
        const screenPosition = { x: event.clientX, y: event.clientY };
        const mouseFlowPosition = reactFlow.screenToFlowPosition(screenPosition, {
          snapToGrid: false,
        });

        const nearestLength = getNearestLengthOnPath(pathElementRef.current, mouseFlowPosition);
        const pathPosition = pathElementRef.current.getPointAtLength(nearestLength);
        const snappedPathPosition = {
          x: snapToGrid(pathPosition.x),
          y: snapToGrid(pathPosition.y),
        };

        let offsetPosition: XYPosition;
        // If the path is too short, the offset should be set generally above the path to avoid overlap.
        if (pathElementRef.current.getTotalLength() < MIN_MOUSE_FOLLOW_DISTANCE) {
          offsetPosition = getOffsetPointFromPathBoundingBox(
            pathElementRef.current,
            targetPosition
          );
        } else {
          offsetPosition = getPerpendicularOffsetPointAtPathLength(
            pathElementRef.current,
            nearestLength
          );
        }

        setPositionData({ offsetPosition, pathPosition: snappedPathPosition });
        rafIdRef.current = null;
      });
    },
    [isEnabled, reactFlow, pathElementRef, targetPosition]
  );

  return {
    positionData,
    // Return the handleMouseMove function for external use
    handleMouseMoveOnPath: isEnabled ? handleMouseMoveOnPath : undefined,
  };
}
