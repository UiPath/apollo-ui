import type { Edge, Node, ReactFlowInstance } from "@uipath/uix/xyflow/react";
import { DEFAULT_NODE_SIZE, PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from "../constants";
import { getNewNodePosition } from "./NodeUtils";

/**
 * Creates a preview node and edge at a specific position or calculated position
 * This is the single source of truth for preview node creation
 */
export function createPreviewNode(
  sourceNodeId: string,
  sourceHandleId: string,
  reactFlowInstance: ReactFlowInstance,
  position?: { x: number; y: number },
  data?: Record<string, any>,
  sourceHandleType: "source" | "target" = "source",
  previewNodeSize: { width: number; height: number } = { width: DEFAULT_NODE_SIZE, height: DEFAULT_NODE_SIZE }
): { node: Node; edge: Edge } | null {
  const sourceNode = reactFlowInstance.getNode(sourceNodeId);
  if (!sourceNode) {
    console.warn(`Source node ${sourceNodeId} not found`);
    return null;
  }

  // When dragging from a target handle, we should treat the preview as the source for the edge connection.
  const treatPreviewAsSource = sourceHandleType === "target";

  const nodePosition = position
    ? {
        x: treatPreviewAsSource ? position.x - previewNodeSize.width : position.x,
        y: position.y - previewNodeSize.height / 2,
      }
    : getNewNodePosition(
        sourceNode,
        previewNodeSize,
        reactFlowInstance.getNodes().filter((n) => n.id !== PREVIEW_NODE_ID),
        "right"
      );

  // Create preview node
  const finalData = { ...(data ?? {}) };
  if (treatPreviewAsSource) {
    // Only override custom data when true because the default is false.
    finalData.showOutputHandle = true;
  }
  const previewNode: Node = {
    id: PREVIEW_NODE_ID,
    type: "preview",
    position: nodePosition,
    ...previewNodeSize,
    selected: true,
    data: finalData,
  };

  const previewSourceAndTargetData = treatPreviewAsSource
    ? { source: PREVIEW_NODE_ID, sourceHandle: "output", target: sourceNodeId, targetHandle: sourceHandleId }
    : { source: sourceNodeId, sourceHandle: sourceHandleId, target: PREVIEW_NODE_ID, targetHandle: "input" };

  // Create preview edge with consistent styling
  const previewEdge: Edge = {
    id: PREVIEW_EDGE_ID,
    ...previewSourceAndTargetData,
    type: "default",
    style: {
      strokeDasharray: "5,5",
      opacity: 0.8,
      stroke: "var(--color-selection-indicator)",
      strokeWidth: 2,
    },
  };

  return { node: previewNode, edge: previewEdge };
}

/**
 * Applies preview node and edge to React Flow instance
 * Handles cleanup of existing previews and selection
 */
export function applyPreviewToReactFlow(preview: { node: Node; edge: Edge }, reactFlowInstance: ReactFlowInstance): void {
  // Use a timeout to avoid React Flow internal reset.
  setTimeout(() => {
    // Update nodes and edges (remove any existing preview first)
    reactFlowInstance.setNodes((nodes) => [
      ...nodes.filter((n) => n.id !== PREVIEW_NODE_ID).map((n) => ({ ...n, selected: false })),
      preview.node,
    ]);

    reactFlowInstance.setEdges((edges) => [...edges.filter((e) => e.id !== PREVIEW_EDGE_ID), preview.edge]);
  }, 0);
}

/**
 * Removes preview node and edge from React Flow instance
 */
export function removePreviewFromReactFlow(reactFlowInstance: ReactFlowInstance): void {
  reactFlowInstance.setNodes((nodes) => nodes.filter((n) => n.id !== PREVIEW_NODE_ID));
  reactFlowInstance.setEdges((edges) => edges.filter((e) => e.id !== PREVIEW_EDGE_ID));
}
