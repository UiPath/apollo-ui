import {
  type Edge,
  type Node,
  type ReactFlowState,
  useReactFlow,
  useStore,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useMemo } from 'react';
import { PREVIEW_NODE_ID } from '../constants';
import { type NodeTypeRegistry, useOptionalNodeTypeRegistry } from '../core';
import type { HandleManifest, NodeManifest } from '../schema/node-definition';
import { isPreviewEdge } from '../utils/createPreviewNode';

type PreviewConnectionEdgeData = {
  ignorePreviewConnection?: boolean;
  /** Canonical existing-endpoint handle when the rendered edge uses a view-only anchor. */
  previewConnectionHandleId?: string;
};

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
const previewNodeSelectedSelector = (state: ReactFlowState) =>
  state.nodeLookup.get(PREVIEW_NODE_ID)?.selected ?? false;

/**
 * One key per preview connection, built from the same values `connectionInfo` derives below,
 * so the subscription invalidates exactly when the computed output would change. Notably the
 * handles are defaulted here the same way, and the node type is included because both manifest
 * lookups hang off it.
 *
 * Order is deliberately preserved by the caller: consumers treat the first connection as the
 * primary one, so a reordering has to produce a new array rather than reuse the old order.
 */
const previewConnectionKey = (edge: Edge, state: ReactFlowState): string => {
  const sourceIsPreviewNode = edge.source === PREVIEW_NODE_ID;
  const existingNodeId = sourceIsPreviewNode ? edge.target : edge.source;
  const existingHandleId = resolvePreviewExistingHandleId(edge);
  const existingNodeType = state.nodeLookup.get(existingNodeId)?.type ?? '';

  return `${edge.id},${existingNodeId},${existingHandleId},${existingNodeType},${sourceIsPreviewNode}`;
};

/**
 * Preview edges a derived view renders for layout only. They connect to the preview
 * node visually but must not contribute a connection the Add Node panel validates.
 */
const isConnectingPreviewEdge = (edge: Edge): boolean =>
  isPreviewEdge(edge) &&
  (edge.data as PreviewConnectionEdgeData | undefined)?.ignorePreviewConnection !== true;

// Selector to track edges connected to the preview node.
// Returns a primitive signature rather than edge objects, so the subscription stays
// memoized even when a caller hands React Flow equivalent but newly allocated edges.
// Returning objects here (even copies) would compare unequal on every store update.
const previewEdgeSignatureSelector = (state: ReactFlowState): string =>
  state.edges
    .filter(isConnectingPreviewEdge)
    .map((edge) => previewConnectionKey(edge, state))
    .join('|');

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
 * Resolves the existing node's canonical handle for Add Node validation.
 * Some derived views render preview edges on view-only handles, so they carry
 * the manifest handle separately in edge data.
 */
export function resolvePreviewExistingHandleId(previewEdge: Edge): string {
  const sourceIsPreviewNode = previewEdge.source === PREVIEW_NODE_ID;
  const canonicalHandleId = (previewEdge.data as PreviewConnectionEdgeData | undefined)
    ?.previewConnectionHandleId;
  return sourceIsPreviewNode
    ? (canonicalHandleId ?? previewEdge.targetHandle ?? 'input')
    : (canonicalHandleId ?? previewEdge.sourceHandle ?? 'output');
}

/**
 * Resolves a requested existing-node handle against its manifest. Generic
 * `input`/`output` ids are aliases for the manifest default when that literal
 * id is absent; any other unknown explicit id remains invalid.
 */
export function resolvePreviewExistingHandle(
  registry: Pick<NodeTypeRegistry, 'getDefaultHandle' | 'getManifest'> | null,
  nodeType: string | undefined,
  requestedHandleId: string,
  handleType: 'source' | 'target'
): { handleId: string; manifest: HandleManifest | undefined } {
  const manifest = nodeType ? registry?.getManifest(nodeType) : undefined;
  const exactHandle = manifest?.handleConfiguration
    .flatMap((group) => group.handles)
    .find((handle) => handle.id === requestedHandleId);
  if (exactHandle) return { handleId: requestedHandleId, manifest: exactHandle };

  const genericAlias = handleType === 'source' ? 'output' : 'input';
  const defaultHandle =
    requestedHandleId === genericAlias && nodeType
      ? registry?.getDefaultHandle(nodeType, handleType)
      : undefined;
  return {
    handleId: defaultHandle?.id ?? requestedHandleId,
    manifest: defaultHandle,
  };
}

/**
 * Hook to track the selected preview node and its connection information.
 *
 * When a preview node is selected in the canvas, this hook extracts information
 * about all connected edges and pre-computes handle manifests for efficient
 * constraint validation in the Add Node Panel.
 *
 * Performance optimization: both store selectors return primitives, so the hook only
 * re-renders when the preview node's selection state or its connections change, not on
 * position changes or unrelated store updates. `previewNode` is therefore a snapshot from
 * the last such change; read the live node via `getNode` when up-to-date data is needed.
 *
 * @returns Object containing the preview node and its connection information.
 */
export const usePreviewNode = (): UsePreviewNodeResult => {
  const reactFlowInstance = useReactFlow();
  const isPreviewNodeSelected = useStore(previewNodeSelectedSelector);
  const previewEdgeSignature = useStore(previewEdgeSignatureSelector);
  const registry = useOptionalNodeTypeRegistry();

  // Get the actual node object for the return value (doesn't affect memoization)
  const previewNode = isPreviewNodeSelected
    ? (reactFlowInstance.getNode(PREVIEW_NODE_ID) ?? null)
    : null;

  // Extract connection info when preview node is selected.
  // This only recalculates when the selection state or the preview connections change,
  // not on position changes or any other unrelated React Flow store update.
  // biome-ignore lint/correctness/useExhaustiveDependencies: previewEdgeSignature is the cache key for the edges read via getEdges().
  const connectionInfo: Array<PreviewNodeConnectionInfo> | null = useMemo(() => {
    if (!isPreviewNodeSelected) {
      // Preview node was deselected - clear connection info.
      return null;
    }

    // Read the edges on demand, keyed by the signature above, so the subscription
    // doesn't have to hold on to edge objects.
    const previewEdges = reactFlowInstance.getEdges().filter(isConnectingPreviewEdge);

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
      const existingHandleId = resolvePreviewExistingHandleId(previewEdge);

      // Pre-compute the handle manifest here so consumers don't need to look it up repeatedly.
      // Repeating handles retain their existing prefix matching; ordinary handles
      // additionally allow generic input/output to resolve to the manifest default.
      const repeatedHandleManifest = existingNodeManifest?.handleConfiguration
        .flatMap((hg) => hg.handles)
        .find((handle) => {
          const repeatHandleIdBase = handle.repeat && handle.id.split('{')[0];
          return repeatHandleIdBase ? existingHandleId.startsWith(repeatHandleIdBase) : false;
        });
      const resolvedHandle = repeatedHandleManifest
        ? { handleId: existingHandleId, manifest: repeatedHandleManifest }
        : resolvePreviewExistingHandle(
            registry,
            existingNodeType,
            existingHandleId,
            sourceIsPreviewNode ? 'target' : 'source'
          );

      return {
        addNewNodeAsSource: sourceIsPreviewNode,
        existingNodeId,
        existingHandleId: resolvedHandle.handleId,
        existingNodeManifest,
        existingHandleManifest: resolvedHandle.manifest,
        previewEdgeId: previewEdge.id,
      };
    });
    return connections;
  }, [isPreviewNodeSelected, previewEdgeSignature, reactFlowInstance, registry]);

  return { previewNode, previewNodeConnectionInfo: connectionInfo };
};
