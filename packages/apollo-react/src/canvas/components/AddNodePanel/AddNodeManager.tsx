import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { FLOATING_CANVAS_PANEL_OFFSET, PREVIEW_NODE_ID } from '../../constants';
import { useOptionalNodeTypeRegistry } from '../../core';
import { usePreviewNode } from '../../hooks/usePreviewNode';
import { isPreviewEdge } from '../../utils/createPreviewNode';
import type { BaseNodeData } from '../BaseNode';
import { FloatingCanvasPanel } from '../FloatingCanvasPanel';
import type { ListItem } from '../Toolbox';
import { alignNodeToPreview, getOriginalEdge, placeAddedNode } from './AddNodeManager.helpers';
import { AddNodePanel } from './AddNodePanel';
import type { NodeItemData } from './AddNodePanel.types';

export interface AddNodeManagerProps {
  /**
   * Custom panel component to render inside the floating panel
   * Should accept the same props as AddNodePanel
   */
  customPanel?: React.ComponentType<React.ComponentProps<typeof AddNodePanel>>;
  /**
   * Whether the manager is initializing (loading)
   */
  initializing?: boolean;
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
  onBeforeNodeAdded?: (newNode: Node, newEdges: Edge[]) => { newNode: Node; newEdges: Edge[] };

  /**
   * Callback when a new node is added
   */
  onNodeAdded?: (sourceNodeId: string, sourceHandleId: string, newNode: Node) => void;

  /**
   * Node types to exclude from collision resolution when a new node is added.
   * Nodes matching these types will not be repositioned and will not affect the placement of other nodes.
   */
  ignoredNodeTypes?: string[];
}

/**
 * Component that manages preview node selection and replacement.
 * Must be rendered as a child of ReactFlow/BaseCanvas.
 *
 * When a preview node is selected, it automatically shows a node selector panel.
 * When a node type is selected, it replaces the preview with the actual node.
 */
export const AddNodeManager: React.FC<AddNodeManagerProps> = ({
  initializing,
  customPanel: CustomPanel,
  createNodeData,
  onBeforeNodeAdded,
  onNodeAdded,
  ignoredNodeTypes,
}) => {
  const reactFlowInstance = useReactFlow();
  const registry = useOptionalNodeTypeRegistry();

  // Watch for preview node selection
  const { previewNode, previewNodeConnectionInfo } = usePreviewNode();
  const lastPreviewNodeRef = useRef<Node | null>(null);
  const restoreEdgesRef = useRef<Edge[] | null>(null);

  // Handle cleanup when preview node is deselected
  useEffect(() => {
    if (!previewNode && lastPreviewNodeRef.current) {
      // Preview node just got deselected
      // Clean up preview node and all preview edges if they still exist
      reactFlowInstance.setNodes((nodes) => nodes.filter((n) => n.id !== PREVIEW_NODE_ID));
      reactFlowInstance.setEdges((edges) => {
        const filteredEdges = edges.filter((edge) => !isPreviewEdge(edge));
        // Restore original edge if it exists
        const restoredEdges = restoreEdgesRef.current
          ? [...filteredEdges, ...restoreEdgesRef.current]
          : filteredEdges;
        restoreEdgesRef.current = null;
        return restoredEdges;
      });
    } else if (previewNode && !restoreEdgesRef.current) {
      // Preview node just got selected
      // Store original edge(s) to restore later
      const originalEdge = getOriginalEdge(previewNode);
      restoreEdgesRef.current = originalEdge ? [originalEdge] : null;
    }
    lastPreviewNodeRef.current = previewNode || null;
  }, [previewNode, reactFlowInstance]);

  const handleClose = useCallback(() => {
    // Deselect preview node (which will trigger cleanup in the effect above)
    reactFlowInstance.setNodes((nodes) =>
      nodes.map((n) => (n.id === PREVIEW_NODE_ID ? { ...n, selected: false } : n))
    );
  }, [reactFlowInstance]);

  // Handle node selection from the selector panel
  const handleNodeSelect = useCallback(
    (nodeItem: ListItem) => {
      // Get preview node dynamically to avoid recreating this callback on position changes
      const currentPreviewNode = reactFlowInstance.getNode(PREVIEW_NODE_ID);

      if (
        !currentPreviewNode ||
        !previewNodeConnectionInfo ||
        previewNodeConnectionInfo.length === 0
      ) {
        return;
      }
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
      const nodeData = currentPreviewNode.data?.useSmartHandles
        ? { ...baseNodeData, useSmartHandles: true }
        : baseNodeData;
      const previewNodeScope = currentPreviewNode.parentId
        ? { parentId: currentPreviewNode.parentId, extent: currentPreviewNode.extent }
        : {};
      // Get the manifest for the new node type to find its default handles
      const newNodeManifest = registry?.getManifest(nodeItem.data.type);

      // Create new node at preview position
      const newNode = alignNodeToPreview(
        {
          id: newNodeId,
          type: nodeItem.data.type,
          position: currentPreviewNode.position,
          selected: true,
          data: nodeData,
          ...previewNodeScope,
        },
        currentPreviewNode,
        previewNodeConnectionInfo,
        newNodeManifest
      );

      // Create edges for all connections
      const newEdges: Edge[] = [];
      const previewEdgeIds = new Set<string>();

      for (const connectionInfoItem of previewNodeConnectionInfo) {
        // Get the default handle for the new node based on connection direction
        const newNodeHandleType = connectionInfoItem.addNewNodeAsSource ? 'source' : 'target';
        const newNodeDefaultHandle = newNodeManifest
          ? registry?.getDefaultHandle(newNodeManifest.nodeType, newNodeHandleType)
          : undefined;
        const newNodeHandleId = newNodeDefaultHandle?.id;
        // Arrange edge based on whether new node is source or target
        const edgeSourceTargetData = connectionInfoItem.addNewNodeAsSource
          ? {
              source: newNode.id,
              sourceHandle: newNodeHandleId,
              target: connectionInfoItem.existingNodeId,
              targetHandle: connectionInfoItem.existingHandleId,
            }
          : {
              source: connectionInfoItem.existingNodeId,
              sourceHandle: connectionInfoItem.existingHandleId,
              target: newNode.id,
              targetHandle: newNodeHandleId,
            };
        const newEdgeId = `edge_${edgeSourceTargetData.source}-${edgeSourceTargetData.sourceHandle}-${edgeSourceTargetData.target}-${edgeSourceTargetData.targetHandle}`;

        newEdges.push({
          id: newEdgeId,
          ...edgeSourceTargetData,
          type: 'default',
        });
        previewEdgeIds.add(connectionInfoItem.previewEdgeId);
      }

      const { newNode: finalNode, newEdges: finalEdges } = onBeforeNodeAdded?.(
        newNode,
        newEdges
      ) ?? {
        newNode,
        newEdges,
      };
      const placementEdges = reactFlowInstance.getEdges();

      // Replace preview node with actual node and resolve collisions
      let placedNode = finalNode;
      reactFlowInstance.setNodes((nodes) => {
        const newNodes = [
          ...nodes.filter((n) => n.id !== PREVIEW_NODE_ID).map((n) => ({ ...n, selected: false })),
          finalNode,
        ];
        const placement = placeAddedNode({
          nodes: newNodes,
          edges: placementEdges,
          previewNode: currentPreviewNode,
          insertedNode: finalNode,
          registry,
          ignoredNodeTypes,
        });
        placedNode = placement.insertedNode;
        return placement.nodes;
      });

      // Replace all preview edges with actual edges
      reactFlowInstance.setEdges((edges) => [
        ...edges.filter((edge) => !previewEdgeIds.has(edge.id) && !isPreviewEdge(edge)),
        ...finalEdges,
      ]);
      restoreEdgesRef.current = null;

      // Call onNodeAdded for the first connection (for backwards compatibility)
      const [firstConnection] = previewNodeConnectionInfo;
      if (firstConnection) {
        const firstMaterializedEdge = finalEdges.find(
          (edge) => edge.source === placedNode.id || edge.target === placedNode.id
        );
        const firstEdgeData = firstConnection.addNewNodeAsSource
          ? {
              source: placedNode.id,
              sourceHandle: firstMaterializedEdge?.sourceHandle ?? 'output',
            }
          : {
              source: firstConnection.existingNodeId,
              sourceHandle: firstConnection.existingHandleId,
            };
        onNodeAdded?.(firstEdgeData.source, firstEdgeData.sourceHandle, placedNode);
      }
      lastPreviewNodeRef.current = null;
    },
    [
      previewNodeConnectionInfo,
      reactFlowInstance,
      registry,
      createNodeData,
      onBeforeNodeAdded,
      onNodeAdded,
      ignoredNodeTypes,
    ]
  );

  if (!previewNode || !previewNodeConnectionInfo || previewNodeConnectionInfo.length === 0) {
    return null;
  }

  return (
    <FloatingCanvasPanel
      open={!!previewNode}
      nodeId={PREVIEW_NODE_ID}
      placement="right-start"
      offset={FLOATING_CANVAS_PANEL_OFFSET}
    >
      {CustomPanel ? (
        <CustomPanel onNodeSelect={(item) => handleNodeSelect(item)} onClose={handleClose} />
      ) : (
        <AddNodePanel
          loading={initializing}
          onNodeSelect={handleNodeSelect}
          onClose={handleClose}
        />
      )}
    </FloatingCanvasPanel>
  );
};
