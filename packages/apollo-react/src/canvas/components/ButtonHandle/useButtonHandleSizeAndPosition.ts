import { useMemo } from 'react';
import type { Position } from '@uipath/uix/xyflow/react';
import type { HandleConfigurationSpecificPosition } from '../BaseNode/BaseNode.types';
import {
  bottomPositionForHandle,
  heightForHandleWithPosition,
  leftPositionForHandle,
  rightPositionForHandle,
  topPositionForHandle,
  transformForHandle,
  widthForHandleWithPosition,
} from './ButtonHandleStyleUtils';

export const useButtonHandleSizeAndPosition = ({
  position,
  positionPercent,
  numHandles,
  customPositionAndOffsets,
}: {
  position: Position;
  positionPercent: number;
  numHandles: number;
  customPositionAndOffsets?: HandleConfigurationSpecificPosition;
}) => {
  const width = useMemo(() => {
    return widthForHandleWithPosition({
      position,
      numHandles,
      customWidth: customPositionAndOffsets?.width,
    });
  }, [customPositionAndOffsets?.width, position, numHandles]);

  const height = useMemo(() => {
    return heightForHandleWithPosition({
      position,
      numHandles,
      customHeight: customPositionAndOffsets?.height,
    });
  }, [customPositionAndOffsets?.height, position, numHandles]);

  const top = useMemo(() => {
    return topPositionForHandle({
      position,
      positionPercent,
      customHeight: customPositionAndOffsets?.height,
      customTop: customPositionAndOffsets?.top,
      customBottom: customPositionAndOffsets?.bottom,
    });
  }, [
    customPositionAndOffsets?.top,
    customPositionAndOffsets?.bottom,
    customPositionAndOffsets?.height,
    position,
    positionPercent,
  ]);

  const bottom = useMemo(() => {
    return bottomPositionForHandle({
      position,
      positionPercent,
      customHeight: customPositionAndOffsets?.height,
      customTop: customPositionAndOffsets?.top,
      customBottom: customPositionAndOffsets?.bottom,
    });
  }, [
    customPositionAndOffsets?.bottom,
    customPositionAndOffsets?.top,
    customPositionAndOffsets?.height,
    position,
    positionPercent,
  ]);

  const left = useMemo(() => {
    return leftPositionForHandle({
      position,
      positionPercent,
      customWidth: customPositionAndOffsets?.width,
      customRight: customPositionAndOffsets?.right,
      customLeft: customPositionAndOffsets?.left,
    });
  }, [
    customPositionAndOffsets?.left,
    customPositionAndOffsets?.right,
    customPositionAndOffsets?.width,
    position,
    positionPercent,
  ]);

  const right = useMemo(() => {
    return rightPositionForHandle({
      position,
      positionPercent,
      customWidth: customPositionAndOffsets?.width,
      customRight: customPositionAndOffsets?.right,
      customLeft: customPositionAndOffsets?.left,
    });
  }, [
    customPositionAndOffsets?.right,
    customPositionAndOffsets?.left,
    customPositionAndOffsets?.width,
    position,
    positionPercent,
  ]);

  const transform = useMemo(() => {
    return transformForHandle({ position, customPositionAndOffsets });
  }, [position, customPositionAndOffsets]);

  return { width, height, top, bottom, left, right, transform };
};
