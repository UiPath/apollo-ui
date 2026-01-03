import type { Edge, Node, ReactFlowState } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../../constants';
import type { BaseNodeData } from '../BaseNode/BaseNode.types';
import { FloatingCanvasPanel } from '../FloatingCanvasPanel';
import type { ListItem } from '../Toolbox';
import { AddNodePanel } from './AddNodePanel';
import type { NodeItemData } from './AddNodePanel.types';

// Optimized selector - only find the preview node instead of filtering all nodes
const previewNodeSelector = (state: ReactFlowState) => {
  const node = state.nodes.find((n) => n.id === PREVIEW_NODE_ID);
  return node?.selected ? node : null;
};

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
   * Callback to customize the node and edge configuration before they are created.
   *
   * This takes precedence over the default configuration, except for the node's and edge's `id`.
   */
  onBeforeNodeAdded?: (newNode: Node, newEdge: Edge) => { newNode: Node; newEdge: Edge };

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
export const AddNodeManager: React.FC<AddNodeManagerProps> = ({
  customPanel,
  createNodeData,
  onBeforeNodeAdded,
  onNodeAdded,
}) => {
  const reactFlowInstance = useReactFlow();

  // Watch for preview node selection
  const previewNode = useStore(previewNodeSelector);
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
          handleId: previewEdge.sourceHandle || 'output',
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
    reactFlowInstance.setNodes((nodes) =>
      nodes.map((n) => (n.id === PREVIEW_NODE_ID ? { ...n, selected: false } : n))
    );

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
      const newEdgeId = `edge_${sourceInfo.nodeId}-${sourceInfo.handleId}-${newNodeId}`;

      // Create node data
      const baseNodeData = createNodeData
        ? createNodeData(nodeItem)
        : {
            label: nodeItem.name,
            subLabel: nodeItem.description,
          };

      // Inherit useSmartHandles from preview node if set
      const nodeData = previewNode.data?.useSmartHandles
        ? { ...baseNodeData, useSmartHandles: true }
        : baseNodeData;

      // Create new node at preview position
      const newNode: Node = {
        id: newNodeId,
        type: nodeItem.data.type,
        position: previewNode.position,
        selected: true,
        data: nodeData,
      };

      // Create new edge at preview position
      const newEdge: Edge = {
        id: newEdgeId,
        source: sourceInfo.nodeId,
        sourceHandle: sourceInfo.handleId,
        target: newNodeId,
        targetHandle: 'input',
        type: 'default',
      };

      const { newNode: finalNode, newEdge: finalEdge } = onBeforeNodeAdded?.(newNode, newEdge) ?? {
        newNode,
        newEdge,
      };

      // Replace preview node and edge with actual ones
      reactFlowInstance.setNodes((nodes) => [
        ...nodes.filter((n) => n.id !== PREVIEW_NODE_ID).map((n) => ({ ...n, selected: false })),
        finalNode,
      ]);

      reactFlowInstance.setEdges((edges) => [
        ...edges.filter((e) => e.id !== PREVIEW_EDGE_ID),
        finalEdge,
      ]);

      onNodeAdded?.(sourceInfo.nodeId, sourceInfo.handleId, newNode);

      handleClose();
    },
    [
      sourceInfo,
      previewNode,
      reactFlowInstance,
      createNodeData,
      onBeforeNodeAdded,
      onNodeAdded,
      handleClose,
    ]
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
                  iconName: typeof category.icon === 'string' ? category.icon : undefined,
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
        <AddNodePanel
          onNodeSelect={(item) => handleNodeSelect(item)}
          onClose={handleClose}
          onNodeHover={handleNodeOptionHover}
        />
      )}
    </FloatingCanvasPanel>
  );
};
