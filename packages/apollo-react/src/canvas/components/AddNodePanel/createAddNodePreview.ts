import { Position, type ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { showPreviewGraph } from '../../utils/createPreviewGraph';
import {
  type ContainerPreviewManifestResolver,
  resolveContainerAddNodePreview,
} from '../LoopNode/LoopNode.helpers';

export interface AddNodePreviewOptions {
  getManifestForNode?: ContainerPreviewManifestResolver;
}

/**
 * Creates a preview node and edge when a button handle is clicked.
 * Removes any existing preview node/edge before creating new ones.
 *
 * @param sourceNodeId - The ID of the source node
 * @param sourceHandleId - The ID of the source handle
 * @param reactFlowInstance - The React Flow instance
 * @param handlePosition - The position/side of the handle (defaults to Right)
 * @param sourceHandleType - Whether the source handle is a "source" or "target" (defaults to "source")
 * @param ignoredNodeTypes - Node types to ignore when calculating overlap
 * @param options - Optional add-node preview behavior
 */
export function createAddNodePreview(
  sourceNodeId: string,
  sourceHandleId: string,
  reactFlowInstance: ReactFlowInstance,
  handlePosition: Position = Position.Right,
  sourceHandleType: 'source' | 'target' = 'source',
  ignoredNodeTypes: string[] = [],
  options: AddNodePreviewOptions = {}
): void {
  const source = {
    nodeId: sourceNodeId,
    handleId: sourceHandleId,
  };
  const overrides = options.getManifestForNode
    ? resolveContainerAddNodePreview({
        source,
        sourceHandleType,
        reactFlowInstance,
        getManifestForNode: options.getManifestForNode,
      })
    : null;

  showPreviewGraph({
    source,
    reactFlowInstance,
    sourceHandleType,
    handlePosition,
    ignoredNodeTypes,
    ...(overrides ?? {}),
  });
}
