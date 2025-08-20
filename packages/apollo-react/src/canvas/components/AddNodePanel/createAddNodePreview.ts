import type { Node, Edge, ReactFlowInstance } from "@xyflow/react";
import { getNewNodePosition } from "../../utils/NodeUtils";

/**
 * Creates a preview node and edge when a button handle is clicked.
 * Removes any existing preview node/edge before creating new ones.
 *
 * @param sourceNodeId - The ID of the source node
 * @param sourceHandleId - The ID of the source handle
 * @param reactFlowInstance - The React Flow instance
 */
export function createAddNodePreview(sourceNodeId: string, sourceHandleId: string, reactFlowInstance: ReactFlowInstance): void {
  const sourceNode = reactFlowInstance.getNode(sourceNodeId);
  if (!sourceNode) {
    console.warn(`Source node ${sourceNodeId} not found`);
    return;
  }

  // Get all current nodes
  const currentNodes = reactFlowInstance.getNodes();

  // Find optimal position for preview node
  const previewPosition = getNewNodePosition(
    sourceNode,
    { width: 100, height: 100 },
    currentNodes.filter((n) => n.id !== "preview-node"), // Exclude existing preview
    "right"
  );

  // Create preview node
  const previewNode: Node = {
    id: "preview-node",
    type: "preview",
    position: previewPosition,
    selected: true,
    data: {},
  };

  // Create preview edge
  const previewEdge: Edge = {
    id: "preview-edge",
    source: sourceNodeId,
    sourceHandle: sourceHandleId,
    target: "preview-node",
    targetHandle: "input",
    type: "default",
    style: {
      strokeDasharray: "3 5",
      opacity: 0.8,
      stroke: "var(--color-selection-indicator)",
      strokeWidth: 2,
    },
  };

  // Update nodes and edges (remove any existing preview first)
  reactFlowInstance.setNodes((nodes) => [
    ...nodes.filter((n) => n.id !== "preview-node").map((n) => ({ ...n, selected: false })), // Deselect all other nodes
    previewNode,
  ]);

  reactFlowInstance.setEdges((edges) => [...edges.filter((e) => e.id !== "preview-edge"), previewEdge]);

  // Force select the preview node after a short delay to ensure React Flow processes it
  setTimeout(() => {
    reactFlowInstance.setNodes((nodes) =>
      nodes.map((n) => (n.id === "preview-node" ? { ...n, selected: true } : { ...n, selected: false }))
    );
  }, 50);
}
