import type { ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
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
  const previewCenter = {
    x: snapToGrid(containerAbsolutePosition.x + relativeCenter.x),
    y: snapToGrid(containerAbsolutePosition.y + relativeCenter.y),
  };

  showPreviewGraph({
    sourceNodeId: containerId,
    sourceHandleId: previewHandles.sourceHandleId,
    reactFlowInstance,
    position: previewCenter,
    positionMode: 'center',
    handlePosition: previewHandles.sourceHandlePosition,
    targetNodeId: containerId,
    targetHandleId: previewHandles.targetHandleId,
    containerId,
    trailingEdgeId,
  });
}
