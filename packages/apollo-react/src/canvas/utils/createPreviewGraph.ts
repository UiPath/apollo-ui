import type {
  Edge,
  Node,
  Position,
  ReactFlowInstance,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { CSSProperties } from 'react';
import { DEFAULT_SOURCE_HANDLE_ID, PREVIEW_NODE_ID } from '../constants';
import {
  createPreviewNode,
  isPreviewEdge,
  PREVIEW_EDGE_STYLE,
  type PreviewNodePositionMode,
} from './createPreviewNode';
import { getAbsolutePosition } from './NodeUtils';

/** Preview node plus the temporary edges that should be rendered with it. */
export interface PreviewGraph {
  node: Node;
  edges: Edge[];
}

/** Node/handle pair used for preview graph endpoints. */
export interface PreviewEndpoint {
  nodeId: string;
  handleId?: string | null;
}

/**
 * Options for building a preview graph. The primary edge is always created; the
 * optional target creates a trailing preview edge from the preview node onward.
 */
export interface CreatePreviewGraphOptions {
  reactFlowInstance: ReactFlowInstance;
  source: PreviewEndpoint;
  target?: PreviewEndpoint;
  position?: { x: number; y: number };
  data?: Record<string, unknown>;
  sourceHandleType?: 'source' | 'target';
  previewNodeSize?: { width: number; height: number };
  handlePosition?: Position;
  ignoredNodeTypes?: string[];
  positionMode?: PreviewNodePositionMode;
  containerId?: string;
  trailingEdgeId?: string;
  trailingEdgeStyle?: CSSProperties;
}

export type PreviewGraphOverrides = Partial<
  Pick<
    CreatePreviewGraphOptions,
    | 'containerId'
    | 'data'
    | 'position'
    | 'positionMode'
    | 'target'
    | 'trailingEdgeId'
    | 'trailingEdgeStyle'
  >
>;

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

/**
 * Converts an absolute preview position into container-local coordinates and
 * constrains the preview to the container parent.
 */
export function reparentPreviewNodeToContainer(
  previewNode: Node,
  containerId: string,
  reactFlowInstance: ReactFlowInstance
): Node {
  const containerNode = reactFlowInstance.getNode(containerId)!;
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
  source,
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
    source.nodeId,
    source.handleId ?? DEFAULT_SOURCE_HANDLE_ID,
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
  target,
  trailingEdgeId,
  trailingEdgeStyle = PREVIEW_EDGE_STYLE,
}: {
  target?: PreviewEndpoint;
  trailingEdgeId?: string;
  trailingEdgeStyle?: CSSProperties;
}): Edge | null {
  if (!target) return null;

  return {
    id: trailingEdgeId ?? `${PREVIEW_NODE_ID}-${target.nodeId}`,
    source: PREVIEW_NODE_ID,
    sourceHandle: DEFAULT_SOURCE_HANDLE_ID,
    target: target.nodeId,
    targetHandle: target.handleId,
    type: 'default',
    style: trailingEdgeStyle,
  };
}

/**
 * Creates a preview node and its temporary edge(s), optionally scoped to a
 * container. Container previews use this to show both the incoming and outgoing
 * side of an insertion before the node is materialized.
 */
export function createPreviewGraph(options: CreatePreviewGraphOptions): PreviewGraph | null {
  const { reactFlowInstance, target, containerId, source } = options;

  const preview = createPreviewNodeForGraph(options);
  if (!preview) return null;

  const sourceNode = reactFlowInstance.getNode(source.nodeId)!;
  const targetNode = target ? reactFlowInstance.getNode(target.nodeId) : undefined;
  const resolvedContainerId = containerId ?? inferPreviewContainerId(sourceNode, targetNode);
  const finalPreviewNode = resolvedContainerId
    ? reparentPreviewNodeToContainer(preview.node, resolvedContainerId, reactFlowInstance)
    : preview.node;

  const trailingEdge = createTrailingPreviewEdge(options);
  const edges = trailingEdge ? [preview.edge, trailingEdge] : [preview.edge];

  return {
    node: finalPreviewNode,
    edges,
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
  const originalEdge = preview.node.data?.originalEdge as Edge | undefined;

  setTimeout(() => {
    reactFlowInstance.setNodes((nodes) => [
      ...nodes
        .filter((node) => node.id !== PREVIEW_NODE_ID)
        .map((node) => ({ ...node, selected: false })),
      preview.node,
    ]);

    reactFlowInstance.setEdges((edges) => [
      ...edges.filter((edge) => !isPreviewEdge(edge) && edge.id !== originalEdge?.id),
      ...preview.edges,
    ]);
  }, 0);
}
