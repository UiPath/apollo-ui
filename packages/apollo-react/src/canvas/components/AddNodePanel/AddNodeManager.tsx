import React, { useEffect, useState, useCallback, useRef } from "react";
import type { Node } from "@xyflow/react";
import { useReactFlow, useStore } from "@xyflow/react";
import { FloatingCanvasPanel } from "../FloatingCanvasPanel";
import { AddNodePanel } from "./AddNodePanel";
import type { NodeOption } from "./AddNodePanel.types";
import type { BaseNodeData } from "../BaseNode/BaseNode.types";

export interface AddNodeManagerProps {
  /**
   * Custom panel component to render inside the floating panel
   * Should accept the same props as AddNodePanel
   */
  customPanel?: React.ComponentType<React.ComponentProps<typeof AddNodePanel>>;
  /**
   * Function to fetch available node options
   */
  fetchNodeOptions?: (category?: string, search?: string) => Promise<NodeOption[]>;

  /**
   * Function to create node data from a node option
   */
  createNodeData?: (nodeOption: NodeOption) => BaseNodeData;

  /**
   * Callback when a new node is added
   */
  onNodeAdded?: (sourceNodeId: string, sourceHandleId: string, newNode: Node) => void;
}

/**
 * Component that manages preview node selection and replacement.
 * Must be rendered as a child of ReactFlow/BaseCanvas.
 *
 * When a preview node is selected, it automatically shows a node selector panel.
 * When a node type is selected, it replaces the preview with the actual node.
 */
export const AddNodeManager: React.FC<AddNodeManagerProps> = ({ customPanel, createNodeData, onNodeAdded }) => {
  const reactFlowInstance = useReactFlow();

  // Watch for preview node selection
  const selectedNodes = useStore((state) => state.nodes.filter((node) => node.selected));

  const previewNode = selectedNodes.find((node) => node.id === "preview-node");
  const [isOpen, setIsOpen] = useState(false);
  const [sourceInfo, setSourceInfo] = useState<{ nodeId: string; handleId: string } | null>(null);
  const lastPreviewNodeRef = useRef<Node | null>(null);

  // Extract source info from preview edge when preview node is selected
  useEffect(() => {
    if (previewNode && !lastPreviewNodeRef.current) {
      // Preview node just got selected
      const previewEdge = reactFlowInstance.getEdges().find((edge) => edge.id === "preview-edge");

      if (previewEdge) {
        setSourceInfo({
          nodeId: previewEdge.source,
          handleId: previewEdge.sourceHandle || "output",
        });
        setIsOpen(true);
      }
    } else if (!previewNode && lastPreviewNodeRef.current) {
      // Preview node just got deselected
      setIsOpen(false);
      setSourceInfo(null);

      // Clean up preview node and edge if they still exist
      reactFlowInstance.setNodes((nodes) => nodes.filter((n) => n.id !== "preview-node"));
      reactFlowInstance.setEdges((edges) => edges.filter((e) => e.id !== "preview-edge"));
    }

    lastPreviewNodeRef.current = previewNode || null;
  }, [previewNode, reactFlowInstance]);

  const handleClose = useCallback(() => {
    // Deselect preview node (which will trigger cleanup in the effect above)
    reactFlowInstance.setNodes((nodes) => nodes.map((n) => (n.id === "preview-node" ? { ...n, selected: false } : n)));

    setIsOpen(false);
    setSourceInfo(null);
  }, [reactFlowInstance]);

  // Handle node selection from the selector panel
  const handleNodeSelect = useCallback(
    (nodeOption: NodeOption) => {
      if (!sourceInfo || !previewNode) return;

      // Generate new node ID
      const newNodeId = `${nodeOption.type}-${Date.now()}`;

      // Create node data
      const nodeData = createNodeData
        ? createNodeData(nodeOption)
        : {
            label: nodeOption.label,
            subLabel: nodeOption.description,
          };

      // Create new node at preview position
      const newNode: Node = {
        id: newNodeId,
        type: nodeOption.type,
        position: previewNode.position,
        selected: true,
        data: nodeData,
      };

      // Replace preview node and edge with actual ones
      reactFlowInstance.setNodes((nodes) => [
        ...nodes.filter((n) => n.id !== "preview-node").map((n) => ({ ...n, selected: false })),
        newNode,
      ]);

      reactFlowInstance.setEdges((edges) => [
        ...edges.filter((e) => e.id !== "preview-edge"),
        {
          id: `${sourceInfo.nodeId}-${sourceInfo.handleId}-${newNodeId}`,
          source: sourceInfo.nodeId,
          sourceHandle: sourceInfo.handleId,
          target: newNodeId,
          targetHandle: "input",
          type: "default",
        },
      ]);

      if (onNodeAdded) {
        onNodeAdded(sourceInfo.nodeId, sourceInfo.handleId, newNode);
      }

      handleClose();
    },
    [sourceInfo, previewNode, reactFlowInstance, createNodeData, onNodeAdded, handleClose]
  );

  if (!isOpen || !sourceInfo || !previewNode) {
    return null;
  }

  return (
    <FloatingCanvasPanel open={isOpen} nodeId="preview-node" placement="right-start" offset={10}>
      {customPanel ? (
        React.createElement(customPanel, {
          onNodeSelect: handleNodeSelect,
          onClose: handleClose,
        })
      ) : (
        <AddNodePanel onNodeSelect={handleNodeSelect} onClose={handleClose} />
      )}
    </FloatingCanvasPanel>
  );
};
