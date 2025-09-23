import type { Node, Edge, ReactFlowInstance } from "@uipath/uix/xyflow/react";
import { getNewNodePosition } from "./NodeUtils";

/**
 * Creates a preview node and edge at a specific position or calculated position
 * This is the single source of truth for preview node creation
 */
export function createPreviewNode(
  sourceNodeId: string,
  sourceHandleId: string,
  reactFlowInstance: ReactFlowInstance,
  position?: { x: number; y: number }
): { node: Node; edge: Edge } | null {
  const sourceNode = reactFlowInstance.getNode(sourceNodeId);
  if (!sourceNode) {
    console.warn(`Source node ${sourceNodeId} not found`);
    return null;
  }

  const nodePosition =
    position ||
    getNewNodePosition(
      sourceNode,
      { width: 96, height: 96 },
      reactFlowInstance.getNodes().filter((n) => n.id !== "preview-node-id"),
      "right"
    );

  // Create preview node
  const previewNode: Node = {
    id: "preview-node-id",
    type: "preview",
    position: nodePosition,
    selected: true,
    data: {},
  };

  // Create preview edge with consistent styling
  const previewEdge: Edge = {
    id: "preview-edge-id",
    source: sourceNodeId,
    sourceHandle: sourceHandleId,
    target: "preview-node-id",
    targetHandle: "input",
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
  // Update nodes and edges (remove any existing preview first)
  reactFlowInstance.setNodes((nodes) => [
    ...nodes.filter((n) => n.id !== "preview-node-id").map((n) => ({ ...n, selected: false })),
    preview.node,
  ]);

  reactFlowInstance.setEdges((edges) => [...edges.filter((e) => e.id !== "preview-edge-id"), preview.edge]);

  // Force select the preview node after a short delay
  setTimeout(() => {
    reactFlowInstance.setNodes((nodes) =>
      nodes.map((n) => (n.id === "preview-node-id" ? { ...n, selected: true } : { ...n, selected: false }))
    );
  }, 50);
}

/**
 * Removes preview node and edge from React Flow instance
 */
export function removePreviewFromReactFlow(reactFlowInstance: ReactFlowInstance): void {
  reactFlowInstance.setNodes((nodes) => nodes.filter((n) => n.id !== "preview-node-id"));
  reactFlowInstance.setEdges((edges) => edges.filter((e) => e.id !== "preview-edge-id"));
}
