import type { Node, ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { type ContainerPlacement, getNodeDimensions } from '../../utils/container';
import {
  applyPreviewGraphToReactFlow,
  createPreviewGraph,
  showPreviewGraph,
} from '../../utils/createPreviewGraph';
import { PREVIEW_UNCONNECTED_DATA_KEY } from '../../utils/createPreviewNode';
import { getAbsolutePosition, snapToGrid } from '../../utils/NodeUtils';
import {
  type ContainerPreviewConnectionHandles,
  getContainerRelativeBodyCenter,
} from './ContainerNode.helpers';

function firstChildPlacement(containerId: string): ContainerPlacement {
  return {
    containerId,
    sourceNodeId: containerId,
    targetNodeId: containerId,
    mode: 'first-child',
  };
}

/** Absolute point at the body's horizontal center, on the frame's vertical midline. */
function containerPreviewCenter(containerNode: Node, allNodes: Node[]) {
  const containerAbsolutePosition = getAbsolutePosition(containerNode, allNodes);
  const relativeCenter = getContainerRelativeBodyCenter(containerNode);
  const containerSize = getNodeDimensions(containerNode);
  // Y aligns with the inner handle rail (50% of the height), which is also where the
  // empty-state button sits.
  return {
    x: snapToGrid(containerAbsolutePosition.x + relativeCenter.x),
    y: snapToGrid(containerAbsolutePosition.y + containerSize.height / 2),
  };
}

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

  showPreviewGraph({
    source: {
      nodeId: containerId,
      handleId: previewHandles.sourceHandleId,
    },
    reactFlowInstance,
    position: containerPreviewCenter(containerNode, reactFlowInstance.getNodes()),
    positionMode: 'center',
    handlePosition: previewHandles.sourceHandlePosition,
    target: previewHandles.targetHandleId
      ? {
          nodeId: containerId,
          handleId: previewHandles.targetHandleId,
        }
      : undefined,
    data: { placement: firstChildPlacement(containerId) },
    containerId,
    trailingEdgeId,
  });
}

/**
 * Add-first-step preview for a self-contained container (no inner handles): the preview is
 * parented to the container like any first child, but carries no edge, and Add Node
 * materializes it as an unconnected child.
 */
export function showUnconnectedContainerPreview({
  containerId,
  reactFlowInstance,
}: {
  containerId: string;
  reactFlowInstance: ReactFlowInstance;
}) {
  const containerNode = reactFlowInstance.getNode(containerId);
  if (!containerNode) return;

  const preview = createPreviewGraph({
    source: { nodeId: containerId },
    reactFlowInstance,
    position: containerPreviewCenter(containerNode, reactFlowInstance.getNodes()),
    positionMode: 'center',
    data: {
      placement: firstChildPlacement(containerId),
      [PREVIEW_UNCONNECTED_DATA_KEY]: true,
    },
    containerId,
  });
  if (!preview) return;

  applyPreviewGraphToReactFlow({ node: preview.node, edges: [] }, reactFlowInstance);
}
