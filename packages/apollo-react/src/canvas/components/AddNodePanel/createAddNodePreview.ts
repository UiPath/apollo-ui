import { Position, type ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { applyPreviewToReactFlow, createPreviewNode } from '../../utils/createPreviewNode';

/**
 * Creates a preview node and edge when a button handle is clicked.
 * Removes any existing preview node/edge before creating new ones.
 *
 * @param sourceNodeId - The ID of the source node
 * @param sourceHandleId - The ID of the source handle
 * @param reactFlowInstance - The React Flow instance
 * @param handlePosition - The position/side of the handle (defaults to Right)
 * @param sourceHandleType - Whether the source handle is a "source" or "target" (defaults to "source")
 */
export function createAddNodePreview(
  sourceNodeId: string,
  sourceHandleId: string,
  reactFlowInstance: ReactFlowInstance,
  handlePosition: Position = Position.Right,
  sourceHandleType: 'source' | 'target' = 'source',
  ignoredNodeTypes: string[] = []
): void {
  // Use the unified preview creation utility
  const preview = createPreviewNode(
    sourceNodeId,
    sourceHandleId,
    reactFlowInstance,
    undefined, // No drop position - use auto-placement
    undefined, // No custom data
    sourceHandleType,
    undefined, // Use default preview node size
    handlePosition,
    ignoredNodeTypes
  );

  if (preview) {
    applyPreviewToReactFlow(preview, reactFlowInstance);
  }
}
