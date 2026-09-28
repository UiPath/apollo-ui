import type { ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { type ContainerPlacement, getNodeDimensions } from '../../utils/container';
import { showPreviewGraph } from '../../utils/createPreviewGraph';
import { getAbsolutePosition, snapToGrid } from '../../utils/NodeUtils';
import {
  type ContainerPreviewConnectionHandles,
  getContainerRelativeBodyCenter,
} from './LoopNode.helpers';

export function showCenteredContainerPreview({
  containerId,
  reactFlowInstance,
  previewHandles,
  trailingEdgeId,
}: {
  containerId: string;
  reactFlowInstance: ReactFlowInstance;
  previewHandles: ContainerPreviewConnectionHandles;
  trailingEdgeId?: string;
}) {
  const containerNode = reactFlowInstance.getNode(containerId);
  if (!containerNode) return;

  const allNodes = reactFlowInstance.getNodes();
  const containerAbsolutePosition = getAbsolutePosition(containerNode, allNodes);
  const relativeCenter = getContainerRelativeBodyCenter(containerNode);
  const containerSize = getNodeDimensions(containerNode);
  // Y aligns with the inner source handle's rail (50% of container height) so
  // the preview shows on the same row as the Start handle and the empty-state
  // button. X stays at the body's horizontal center.
  const previewCenter = {
    x: snapToGrid(containerAbsolutePosition.x + relativeCenter.x),
    y: snapToGrid(containerAbsolutePosition.y + containerSize.height / 2),
  };
  const placement: ContainerPlacement = {
    containerId,
    sourceNodeId: containerId,
    targetNodeId: containerId,
    mode: 'first-child',
  };

  showPreviewGraph({
    source: {
      nodeId: containerId,
      handleId: previewHandles.sourceHandleId,
    },
    reactFlowInstance,
    position: previewCenter,
    positionMode: 'center',
    handlePosition: previewHandles.sourceHandlePosition,
    target: {
      nodeId: containerId,
      handleId: previewHandles.targetHandleId,
    },
    data: { placement },
    containerId,
    trailingEdgeId,
  });
}
