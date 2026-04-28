import type {
  Edge,
  Node,
  Position,
  ReactFlowInstance,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_SOURCE_HANDLE_ID, PREVIEW_NODE_ID } from '../constants';
import {
  createPreviewNode,
  isPreviewEdge,
  PREVIEW_EDGE_STYLE,
  type PreviewNodePositionMode,
} from './createPreviewNode';
import { getAbsolutePosition } from './NodeUtils';

export interface PreviewGraph {
  node: Node;
  edges: Edge[];
  removedEdgeIds?: string[];
}

export interface CreatePreviewGraphOptions {
  sourceNodeId: string;
  sourceHandleId: string;
  reactFlowInstance: ReactFlowInstance;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
  sourceHandleType?: 'source' | 'target';
  previewNodeSize?: { width: number; height: number };
  handlePosition?: Position;
  ignoredNodeTypes?: string[];
  positionMode?: PreviewNodePositionMode;
  targetNodeId?: string;
  targetHandleId?: string | null;
  containerId?: string;
  removedEdgeIds?: string[];
  trailingEdgeId?: string;
  trailingEdgeStyle?: Edge['style'];
}

function inferPreviewContainerId(sourceNode: Node, targetNode?: Node): string | undefined {
  if (!targetNode) {
    return sourceNode.parentId;
  }

  if (sourceNode.parentId === targetNode.parentId) {
    return sourceNode.parentId;
  }

  if (targetNode.parentId === sourceNode.id) {
    return sourceNode.id;
  }

  if (sourceNode.parentId === targetNode.id) {
    return targetNode.id;
  }

  return undefined;
}

export function reparentPreviewNodeToContainer(
  previewNode: Node,
  containerId: string,
  reactFlowInstance: ReactFlowInstance
): Node | null {
  const containerNode = reactFlowInstance.getNode(containerId);
  if (!containerNode) {
    return null;
  }

  const containerAbsolutePosition = getAbsolutePosition(
    containerNode,
    reactFlowInstance.getNodes()
  );

  return {
    ...previewNode,
    position: {
      x: previewNode.position.x - containerAbsolutePosition.x,
      y: previewNode.position.y - containerAbsolutePosition.y,
    },
    parentId: containerId,
    extent: 'parent',
  };
}

function createPreviewNodeForGraph({
  sourceNodeId,
  sourceHandleId,
  reactFlowInstance,
  position,
  data,
  sourceHandleType,
  previewNodeSize,
  handlePosition,
  ignoredNodeTypes,
  positionMode,
}: CreatePreviewGraphOptions) {
  return createPreviewNode(
    sourceNodeId,
    sourceHandleId,
    reactFlowInstance,
    position,
    data,
    sourceHandleType,
    previewNodeSize,
    handlePosition,
    ignoredNodeTypes,
    positionMode
  );
}

function createTrailingPreviewEdge({
  targetNodeId,
  targetHandleId,
  trailingEdgeId,
  trailingEdgeStyle = PREVIEW_EDGE_STYLE,
}: Pick<
  CreatePreviewGraphOptions,
  'targetNodeId' | 'targetHandleId' | 'trailingEdgeId' | 'trailingEdgeStyle'
>): Edge | null {
  if (!targetNodeId) return null;

  return {
    id: trailingEdgeId ?? `${PREVIEW_NODE_ID}-${targetNodeId}`,
    source: PREVIEW_NODE_ID,
    sourceHandle: DEFAULT_SOURCE_HANDLE_ID,
    target: targetNodeId,
    targetHandle: targetHandleId,
    type: 'default',
    style: trailingEdgeStyle,
  };
}

export function createPreviewGraph(options: CreatePreviewGraphOptions): PreviewGraph | null {
  const { reactFlowInstance, targetNodeId, containerId, removedEdgeIds, sourceNodeId } = options;

  const preview = createPreviewNodeForGraph(options);
  if (!preview) return null;

  const sourceNode = reactFlowInstance.getNode(sourceNodeId);
  if (!sourceNode) return null;

  const targetNode = targetNodeId ? reactFlowInstance.getNode(targetNodeId) : undefined;
  const resolvedContainerId = containerId ?? inferPreviewContainerId(sourceNode, targetNode);
  const finalPreviewNode = resolvedContainerId
    ? reparentPreviewNodeToContainer(preview.node, resolvedContainerId, reactFlowInstance)
    : preview.node;

  if (!finalPreviewNode) return null;

  const trailingEdge = createTrailingPreviewEdge(options);
  const edges = trailingEdge ? [preview.edge, trailingEdge] : [preview.edge];

  return {
    node: finalPreviewNode,
    edges,
    removedEdgeIds,
  };
}

/**
 * Creates and shows a preview graph in React Flow.
 * Returns the created preview graph when successful so callers can still
 * inspect the result if needed.
 */
export function showPreviewGraph(options: CreatePreviewGraphOptions): PreviewGraph | null {
  const preview = createPreviewGraph(options);
  if (preview) {
    applyPreviewGraphToReactFlow(preview, options.reactFlowInstance);
  }
  return preview;
}

/**
 * Applies a preview graph to React Flow.
 * This supports both the classic single-edge preview and multi-edge previews
 * such as container/loop insertion flows.
 */
export function applyPreviewGraphToReactFlow(
  preview: PreviewGraph,
  reactFlowInstance: ReactFlowInstance
): void {
  const removedEdgeIds = new Set(preview.removedEdgeIds ?? []);

  setTimeout(() => {
    reactFlowInstance.setNodes((nodes) => [
      ...nodes
        .filter((node) => node.id !== PREVIEW_NODE_ID)
        .map((node) => ({ ...node, selected: false })),
      preview.node,
    ]);

    reactFlowInstance.setEdges((edges) => [
      ...edges.filter((edge) => !isPreviewEdge(edge) && !removedEdgeIds.has(edge.id)),
      ...preview.edges,
    ]);
  }, 0);
}
