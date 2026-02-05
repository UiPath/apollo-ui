import {
  type Edge,
  type Node,
  type ReactFlowState,
  useReactFlow,
  useStore,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { PREVIEW_NODE_ID } from '../constants';
import { useOptionalNodeTypeRegistry } from '../core';
import type { HandleManifest, NodeManifest } from '../schema/node-definition';

/**
 * Information about an existing node connected to the preview node.
 *
 * This interface is used to determine how to connect a new node (that will replace the preview node) to existing nodes.
 * We include manifest information for the existing node and handle to constrain node options for the preview node.
 */
export interface PreviewNodeConnectionInfo {
  /** The id of the existing node connected to the preview node. */
  existingNodeId: string;
  /** The handle id on the existing node connected to the preview node. */
  existingHandleId: string;
  /** The manifest of the existing node connected to the preview node. */
  existingNodeManifest: NodeManifest | undefined;
  /** The manifest of the handle on the existing node connected to the preview node. */
  existingHandleManifest: HandleManifest | undefined;
  /** Whether the new node is to be added as a source of the existing node. */
  addNewNodeAsSource: boolean;
  /** The id of the edge connecting the preview node to the existing node. Can be the constant PREVIEW_EDGE_ID or an existing edge id if we are adding a new node between two existing nodes. */
  previewEdgeId: string;
}

// Optimized selector - return boolean to prevent re-renders on position changes
const previewNodeSelectedSelector = (state: ReactFlowState) => {
  const node = state.nodes.find((n) => n.id === PREVIEW_NODE_ID);
  return node?.selected ?? false;
};

// Selector to track edges connected to preview node
// Returns minimal edge data to avoid unnecessary re-renders
const edgesConnectedToPreviewSelector = (state: ReactFlowState): Edge[] => {
  return state.edges
    .filter((edge) => edge.source === PREVIEW_NODE_ID || edge.target === PREVIEW_NODE_ID)
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));
};

interface UsePreviewNodeResult {
  /** The currently selected preview node, or null if no preview node is selected. */
  previewNode: Node | null;
  /**
   * Array of connection information for all edges connected to the preview node.
   * Null if no preview node is selected.
   */
  previewNodeConnectionInfo: Array<PreviewNodeConnectionInfo> | null;
}

/**
 * Hook to track the selected preview node and its connection information.
 *
 * When a preview node is selected in the canvas, this hook extracts information
 * about all connected edges and pre-computes handle manifests for efficient
 * constraint validation in the Add Node Panel.
 *
 * Performance optimization: Uses boolean selector for node selection and tracks
 * edges separately to prevent re-renders when only the preview node position changes.
 *
 * @returns Object containing the preview node and its connection information.
 */
export const usePreviewNode = (): UsePreviewNodeResult => {
  const reactFlowInstance = useReactFlow();
  const isPreviewNodeSelected = useStore(previewNodeSelectedSelector);
  const previewEdges = useStore(edgesConnectedToPreviewSelector, shallow);
  const registry = useOptionalNodeTypeRegistry();

  // Get the actual node object for the return value (doesn't affect memoization)
  const previewNode = isPreviewNodeSelected
    ? (reactFlowInstance.getNode(PREVIEW_NODE_ID) ?? null)
    : null;

  // Extract connection info when preview node is selected.
  // This now only recalculates when selection state or edges change, not on position changes.
  const connectionInfo: Array<PreviewNodeConnectionInfo> | null = useMemo(() => {
    if (!isPreviewNodeSelected) {
      // Preview node was deselected - clear connection info.
      return null;
    }

    // Build connection info with cached handle manifests.
    const connections = previewEdges.map((previewEdge) => {
      // Determine which end of the edge is the preview node.
      const sourceIsPreviewNode = previewEdge.source === PREVIEW_NODE_ID;
      const existingNodeId = sourceIsPreviewNode ? previewEdge.target : previewEdge.source;

      // Get the existing node's manifest.
      const existingNodeType = reactFlowInstance.getNode(existingNodeId)?.type;
      const existingNodeManifest = existingNodeType
        ? registry?.getManifest(existingNodeType)
        : undefined;

      // Determine which handle on the existing node is involved.
      const existingHandleId = sourceIsPreviewNode
        ? previewEdge.targetHandle || 'input'
        : previewEdge.sourceHandle || 'output';

      // Pre-compute the handle manifest here so consumers don't need to look it up repeatedly.
      const existingHandleManifest = existingNodeManifest?.handleConfiguration
        .flatMap((hg) => hg.handles)
        .find((h) => {
          if (h.id === existingHandleId) return true;

          const repeatHandleIdBase = h.repeat && h.id.split('{')[0];
          if (repeatHandleIdBase) {
            return existingHandleId.startsWith(repeatHandleIdBase);
          }
          return false;
        });

      return {
        addNewNodeAsSource: sourceIsPreviewNode,
        existingNodeId,
        existingHandleId,
        existingNodeManifest,
        existingHandleManifest,
        previewEdgeId: previewEdge.id,
      };
    });
    return connections;
  }, [isPreviewNodeSelected, previewEdges, reactFlowInstance, registry]);

  return { previewNode, previewNodeConnectionInfo: connectionInfo };
};
