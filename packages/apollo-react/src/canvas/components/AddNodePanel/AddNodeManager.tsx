import type { Node } from "@uipath/uix/xyflow/react";
import { useReactFlow, useStore } from "@uipath/uix/xyflow/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { BaseNodeData } from "../BaseNode/BaseNode.types";
import type { ListItem } from "../Toolbox";
import { AddNodePanel } from "./AddNodePanel";
import { FloatingCanvasPanel } from "../FloatingCanvasPanel";
import type { NodeItemData } from "./AddNodePanel.types";
import { PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from "../../constants";

export interface AddNodeManagerProps {
  /**
   * Custom panel component to render inside the floating panel
   * Should accept the same props as AddNodePanel
   */
  customPanel?: React.ComponentType<React.ComponentProps<typeof AddNodePanel>>;
  /**
   * Function to fetch available node options
   */
  fetchNodeOptions?: (category?: string, search?: string) => Promise<ListItem<NodeItemData>[]>;

  /**
   * Function to create node data from a node option
   */
  createNodeData?: (nodeOption: ListItem<NodeItemData>) => BaseNodeData;

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

  const previewNode = selectedNodes.find((node) => node.id === PREVIEW_NODE_ID);
  const [isOpen, setIsOpen] = useState(false);
  const [sourceInfo, setSourceInfo] = useState<{ nodeId: string; handleId: string } | null>(null);
  const [_selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const lastPreviewNodeRef = useRef<Node | null>(null);

  // Extract source info from preview edge when preview node is selected
  useEffect(() => {
    if (previewNode && !lastPreviewNodeRef.current) {
      // Preview node just got selected
      const previewEdge = reactFlowInstance.getEdges().find((edge) => edge.id === PREVIEW_EDGE_ID);

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
      reactFlowInstance.setNodes((nodes) => nodes.filter((n) => n.id !== PREVIEW_NODE_ID));
      reactFlowInstance.setEdges((edges) => edges.filter((e) => e.id !== PREVIEW_EDGE_ID));
    }

    lastPreviewNodeRef.current = previewNode || null;
  }, [previewNode, reactFlowInstance]);

  const handleClose = useCallback(() => {
    // Deselect preview node (which will trigger cleanup in the effect above)
    reactFlowInstance.setNodes((nodes) => nodes.map((n) => (n.id === PREVIEW_NODE_ID ? { ...n, selected: false } : n)));

    setIsOpen(false);
    setSourceInfo(null);
    setSelectedCategory(undefined);
  }, [reactFlowInstance]);

  // Handle node selection from the selector panel
  const handleNodeSelect = useCallback(
    (nodeItem: ListItem) => {
      if (!sourceInfo || !previewNode) return;

      // Generate new node ID
      const newNodeId = `${nodeItem.data.type}-${Date.now()}`;

      // Create node data
      const nodeData = createNodeData
        ? createNodeData(nodeItem)
        : {
            label: nodeItem.name,
            subLabel: nodeItem.description,
          };

      // Create new node at preview position
      const newNode: Node = {
        id: newNodeId,
        type: nodeItem.data.type,
        position: previewNode.position,
        selected: true,
        data: nodeData,
      };

      // Replace preview node and edge with actual ones
      reactFlowInstance.setNodes((nodes) => [
        ...nodes.filter((n) => n.id !== PREVIEW_NODE_ID).map((n) => ({ ...n, selected: false })),
        newNode,
      ]);

      reactFlowInstance.setEdges((edges) => [
        ...edges.filter((e) => e.id !== PREVIEW_EDGE_ID),
        {
          id: `edge_${sourceInfo.nodeId}-${sourceInfo.handleId}-${newNodeId}`,
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

  // Handle node hover to update preview node icon
  const handleNodeOptionHover = useCallback(
    (category: ListItem) => {
      if (!previewNode) return;

      // Update the preview node with serializable data only
      reactFlowInstance.setNodes((nodes) =>
        nodes.map((n) =>
          n.id === PREVIEW_NODE_ID
            ? {
                ...n,
                data: {
                  ...n.data,
                  iconName: typeof category.icon === "string" ? category.icon : undefined,
                },
              }
            : n
        )
      );
    },
    [reactFlowInstance, previewNode]
  );

  if (!isOpen || !sourceInfo || !previewNode) {
    return null;
  }

  return (
    <FloatingCanvasPanel open={isOpen} nodeId={PREVIEW_NODE_ID} placement="right-start" offset={10}>
      {customPanel ? (
        React.createElement(customPanel, {
          onNodeSelect: (item) => handleNodeSelect(item),
          onClose: handleClose,
        })
      ) : (
        <AddNodePanel onNodeSelect={(item) => handleNodeSelect(item)} onClose={handleClose} onNodeHover={handleNodeOptionHover} />
      )}
    </FloatingCanvasPanel>
  );
};
