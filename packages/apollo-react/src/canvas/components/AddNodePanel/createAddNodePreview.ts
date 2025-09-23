import type { ReactFlowInstance } from "@uipath/uix/xyflow/react";
import { createPreviewNode, applyPreviewToReactFlow } from "../../utils/createPreviewNode";

/**
 * Creates a preview node and edge when a button handle is clicked.
 * Removes any existing preview node/edge before creating new ones.
 *
 * @param sourceNodeId - The ID of the source node
 * @param sourceHandleId - The ID of the source handle
 * @param reactFlowInstance - The React Flow instance
 */
export function createAddNodePreview(sourceNodeId: string, sourceHandleId: string, reactFlowInstance: ReactFlowInstance): void {
  // Use the unified preview creation utility
  const preview = createPreviewNode(sourceNodeId, sourceHandleId, reactFlowInstance);

  if (preview) {
    applyPreviewToReactFlow(preview, reactFlowInstance);
  }
}
