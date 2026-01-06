import type { Edge, Node, ReactFlowState } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PREVIEW_NODE_ID } from '../../constants';
import { resolveCollisions } from '../../utils';
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
  const [connectionInfo, setConnectionInfo] = useState<
    Array<{
      existingNodeId: string;
      existingHandleId: string;
      addNewNodeAsSource: boolean;
      previewEdgeId: string;
    }>
  >([]);
  const [_selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const lastPreviewNodeRef = useRef<Node | null>(null);
  const restoreEdgesRef = useRef<Edge[] | null>(null);

  // Extract source info from preview edges when preview node is selected
  useEffect(() => {
    if (previewNode && !lastPreviewNodeRef.current) {
      // Preview node just got selected - find all edges connected to the preview node
      const previewEdges = reactFlowInstance
        .getEdges()
        .filter((edge) => edge.source === PREVIEW_NODE_ID || edge.target === PREVIEW_NODE_ID);

      if (previewEdges.length > 0) {
        const connections = previewEdges.map((previewEdge) => {
          const sourceIsPreviewNode = previewEdge.source === PREVIEW_NODE_ID;
          return {
            addNewNodeAsSource: sourceIsPreviewNode,
            existingNodeId: sourceIsPreviewNode ? previewEdge.target : previewEdge.source,
            existingHandleId: sourceIsPreviewNode
              ? previewEdge.targetHandle || 'input'
              : previewEdge.sourceHandle || 'output',
            previewEdgeId: previewEdge.id,
          };
        });
        setConnectionInfo(connections);
        setIsOpen(true);
        restoreEdgesRef.current = previewNode.data.originalEdge
          ? [previewNode.data.originalEdge as Edge]
          : null;
      }
    } else if (!previewNode && lastPreviewNodeRef.current) {
      // Preview node just got deselected
      setIsOpen(false);
      setConnectionInfo([]);

      // Clean up preview node and all preview edges if they still exist
      reactFlowInstance.setNodes((nodes) => nodes.filter((n) => n.id !== PREVIEW_NODE_ID));
      reactFlowInstance.setEdges((edges) => {
        const filteredEdges = edges.filter(
          (e) => e.source !== PREVIEW_NODE_ID && e.target !== PREVIEW_NODE_ID
        );
        // Restore original edge if it exists
        return restoreEdgesRef.current
          ? [...filteredEdges, ...restoreEdgesRef.current]
          : filteredEdges;
      });
    }

    lastPreviewNodeRef.current = previewNode || null;
  }, [previewNode, reactFlowInstance]);

  const handleClose = useCallback(() => {
    // Deselect preview node (which will trigger cleanup in the effect above)
    reactFlowInstance.setNodes((nodes) =>
      nodes.map((n) => (n.id === PREVIEW_NODE_ID ? { ...n, selected: false } : n))
    );

    setIsOpen(false);
    setConnectionInfo([]);
    setSelectedCategory(undefined);
  }, [reactFlowInstance]);

  // Handle node selection from the selector panel
  const handleNodeSelect = useCallback(
    (nodeItem: ListItem) => {
      if (connectionInfo.length === 0 || !previewNode) return;
      // Generate new node ID
      const newNodeId = `${nodeItem.data.type}-${Date.now()}`;
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

      // Create edges for all connections
      const newEdges: Edge[] = [];
      const previewEdgeIds: string[] = [];

      for (const connectionInfoItem of connectionInfo) {
        // Arrange edge based on whether new node is source or target
        const edgeSourceTargetData = connectionInfoItem.addNewNodeAsSource
          ? {
              source: newNode.id,
              // Explicitly omitting sourceHandle to use default of the new node
              target: connectionInfoItem.existingNodeId,
              targetHandle: connectionInfoItem.existingHandleId,
            }
          : {
              source: connectionInfoItem.existingNodeId,
              sourceHandle: connectionInfoItem.existingHandleId,
              target: newNode.id,
              // Explicitly omitting targetHandle to use default of the new node
            };
        const newEdgeId = `edge_${edgeSourceTargetData.source}-${edgeSourceTargetData.sourceHandle}-${edgeSourceTargetData.target}-${edgeSourceTargetData.targetHandle}`;

        // Create new edge
        const newEdge: Edge = {
          id: newEdgeId,
          ...edgeSourceTargetData,
          type: 'default',
        };

        const { newNode: _, newEdge: finalEdge } = onBeforeNodeAdded?.(newNode, newEdge) ?? {
          newNode,
          newEdge,
        };
        newEdges.push(finalEdge);
        previewEdgeIds.push(connectionInfoItem.previewEdgeId);
      }

      // Replace preview node with actual node and resolve collisions
      reactFlowInstance.setNodes((nodes) => {
        const newNodes = [
          ...nodes.filter((n) => n.id !== PREVIEW_NODE_ID).map((n) => ({ ...n, selected: false })),
          newNode,
        ];
        return resolveCollisions(newNodes);
      });

      // Replace all preview edges with actual edges
      reactFlowInstance.setEdges((edges) => [
        ...edges.filter((e) => !previewEdgeIds.includes(e.id)),
        ...newEdges,
      ]);

      // Call onNodeAdded for the first connection (for backwards compatibility)
      const [firstConnection] = connectionInfo;
      if (firstConnection) {
        const firstEdgeData = firstConnection.addNewNodeAsSource
          ? { source: newNode.id, sourceHandle: 'output' }
          : {
              source: firstConnection.existingNodeId,
              sourceHandle: firstConnection.existingHandleId,
            };
        onNodeAdded?.(firstEdgeData.source, firstEdgeData.sourceHandle, newNode);
      }
      // No need to restore edges once we have added the new node.
      restoreEdgesRef.current = null;
      handleClose();
    },
    [
      connectionInfo,
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

  if (!isOpen || connectionInfo.length === 0 || !previewNode) {
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
