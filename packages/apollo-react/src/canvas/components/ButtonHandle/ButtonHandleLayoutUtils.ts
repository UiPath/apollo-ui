import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { CSSProperties } from 'react';
import { GRID_SPACING } from '../../constants';
import { HANDLE_CROSS_AXIS_SIZE_PX, HANDLE_EDGE_COVERAGE_RATIO } from './ButtonHandleStyleUtils';
import type { HandleButtonPortal } from './HandleButton';
import type { HandleType } from './HandleNotch';

const INWARD_HANDLE_ANCHOR_SIZE_PX = GRID_SPACING;
const INWARD_HANDLE_ANCHOR_RADIUS_PX = INWARD_HANDLE_ANCHOR_SIZE_PX / 2;
const INWARD_NOTCH_OVERLAP_PX = {
  artifact: 5,
  input: 4,
  output: 6,
} as const;

export interface HandleActionPortalOptions {
  nodeId: string;
  position: Position;
  positionPercent: number;
  total: number;
  nodeWidth?: number;
  nodeHeight?: number;
}

export type InwardHandleLayout = {
  rootTransform: string;
  contentDirectionClassName: string;
  notchStyle: CSSProperties;
  anchorStyle: CSSProperties;
};

export function getHandleActionPortal({
  nodeId,
  position,
  positionPercent,
  total,
  nodeWidth,
  nodeHeight,
}: HandleActionPortalOptions): HandleButtonPortal | undefined {
  if (!nodeWidth || !nodeHeight) {
    return undefined;
  }

  const edgeCoverageRatio = HANDLE_EDGE_COVERAGE_RATIO / total;
  const horizontalWidth = nodeWidth * edgeCoverageRatio;
  const verticalHeight = nodeHeight * edgeCoverageRatio;
  const x = nodeWidth * (positionPercent / 100);
  const y = nodeHeight * (positionPercent / 100);

  switch (position) {
    case Position.Top:
      return {
        nodeId,
        left: x,
        top: 0,
        width: horizontalWidth,
        height: HANDLE_CROSS_AXIS_SIZE_PX,
        transform: 'translate(-50%, -50%)',
      };
    case Position.Bottom:
      return {
        nodeId,
        left: x,
        top: nodeHeight - HANDLE_CROSS_AXIS_SIZE_PX,
        width: horizontalWidth,
        height: HANDLE_CROSS_AXIS_SIZE_PX,
        transform: 'translate(-50%, 50%)',
      };
    case Position.Left:
      return {
        nodeId,
        left: 0,
        top: y,
        width: HANDLE_CROSS_AXIS_SIZE_PX,
        height: verticalHeight,
        transform: 'translate(-50%, -50%)',
      };
    case Position.Right:
      return {
        nodeId,
        left: nodeWidth - HANDLE_CROSS_AXIS_SIZE_PX,
        top: y,
        width: HANDLE_CROSS_AXIS_SIZE_PX,
        height: verticalHeight,
        transform: 'translate(50%, -50%)',
      };
  }
}

export function getInwardHandleLayout(
  position: Position,
  handleType: HandleType
): InwardHandleLayout {
  const notchOverlap = -INWARD_NOTCH_OVERLAP_PX[handleType];
  const anchorSize = {
    width: INWARD_HANDLE_ANCHOR_SIZE_PX,
    height: INWARD_HANDLE_ANCHOR_SIZE_PX,
  };

  switch (position) {
    case Position.Left:
      return {
        rootTransform: 'translate(0, -50%)',
        contentDirectionClassName: 'flex-row',
        notchStyle: { marginLeft: notchOverlap },
        anchorStyle: {
          ...anchorSize,
          left: `calc(100% - ${INWARD_HANDLE_ANCHOR_RADIUS_PX}px)`,
          top: '50%',
          transform: 'translateY(-50%)',
        },
      };
    case Position.Right:
      return {
        rootTransform: 'translate(0, -50%)',
        contentDirectionClassName: 'flex-row-reverse',
        notchStyle: { marginRight: notchOverlap },
        anchorStyle: {
          ...anchorSize,
          left: -INWARD_HANDLE_ANCHOR_RADIUS_PX,
          top: '50%',
          transform: 'translateY(-50%)',
        },
      };
    case Position.Top:
      return {
        rootTransform: 'translate(-50%, 0)',
        contentDirectionClassName: 'flex-col',
        notchStyle: { marginTop: notchOverlap },
        anchorStyle: {
          ...anchorSize,
          left: '50%',
          top: `calc(100% - ${INWARD_HANDLE_ANCHOR_RADIUS_PX}px)`,
          transform: 'translateX(-50%)',
        },
      };
    case Position.Bottom:
      return {
        rootTransform: 'translate(-50%, 0)',
        contentDirectionClassName: 'flex-col-reverse',
        notchStyle: { marginBottom: notchOverlap },
        anchorStyle: {
          ...anchorSize,
          left: '50%',
          top: -INWARD_HANDLE_ANCHOR_RADIUS_PX,
          transform: 'translateX(-50%)',
        },
      };
  }
}
