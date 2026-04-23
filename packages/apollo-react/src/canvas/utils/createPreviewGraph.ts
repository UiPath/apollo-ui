import {
  type Edge,
  type Node,
  Position,
  type ReactFlowInstance,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  DEFAULT_NODE_SIZE,
  DEFAULT_SOURCE_HANDLE_ID,
  DEFAULT_TARGET_HANDLE_ID,
  GRID_SPACING,
  PREVIEW_EDGE_ID,
  PREVIEW_NODE_ID,
} from '../constants';
import {
  getAbsolutePosition,
  getNonOverlappingPositionForDirection,
  type HandleContext,
  resolveHandleContext,
} from './NodeUtils';

export interface PreviewGraph {
  node: Node;
  edges: Edge[];
  removedEdgeIds?: string[];
}

export const PREVIEW_EDGE_STYLE: Edge['style'] = {
  strokeDasharray: '5,5',
  opacity: 0.8,
  stroke: 'var(--canvas-selection-indicator)',
  strokeWidth: 2,
};

export type PreviewNodePositionMode = 'drop' | 'center';

interface CreatePreviewNodeOptions {
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
}

export interface CreatePreviewGraphOptions extends CreatePreviewNodeOptions {
  targetNodeId?: string;
  targetHandleId?: string | null;
  containerId?: string;
  removedEdgeIds?: string[];
  trailingEdgeId?: string;
  trailingEdgeStyle?: Edge['style'];
}

interface PreviewNodeResult {
  sourceNode: Node;
  node: Node;
  edge: Edge;
}

export function inferParentId(
  sourceId: string,
  targetId: string,
  nodes: Node[]
): string | undefined {
  const sourceNode = nodes.find((node) => node.id === sourceId);
  const targetNode = nodes.find((node) => node.id === targetId);
  if (!sourceNode || !targetNode) return undefined;

  if (sourceNode.parentId && sourceNode.parentId === targetNode.parentId) {
    return sourceNode.parentId;
  }

  if (targetNode.parentId && targetNode.parentId === sourceNode.id) {
    return sourceNode.id;
  }

  if (sourceNode.parentId && sourceNode.parentId === targetNode.id) {
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

/**
 * Returns the opposite position for a given handle position.
 * Used when dragging from a target handle where the preview should appear on the opposite side.
 */
export function getOppositePosition(position: Position): Position {
  switch (position) {
    case Position.Left:
      return Position.Right;
    case Position.Right:
      return Position.Left;
    case Position.Top:
      return Position.Bottom;
    case Position.Bottom:
      return Position.Top;
    default:
      return Position.Right;
  }
}

/**
 * Calculates the preview node position based on handle position when a drop position is provided.
 * The preview node is positioned so it doesn't overlap with where the user dropped.
 */
function calculatePositionFromDrop(
  dropPosition: { x: number; y: number },
  handlePosition: Position,
  previewNodeSize: { width: number; height: number }
): { x: number; y: number } {
  switch (handlePosition) {
    case Position.Left:
      // Handle is on left side of source node, preview should appear to the left
      return {
        x: dropPosition.x - previewNodeSize.width,
        y: dropPosition.y - previewNodeSize.height / 2,
      };
    case Position.Right:
      // Handle is on right side of source node, preview should appear to the right
      return {
        x: dropPosition.x,
        y: dropPosition.y - previewNodeSize.height / 2,
      };
    case Position.Top:
      // Handle is on top of source node, preview should appear above
      return {
        x: dropPosition.x - previewNodeSize.width / 2,
        y: dropPosition.y - previewNodeSize.height,
      };
    case Position.Bottom:
      // Handle is on bottom of source node, preview should appear below
      return {
        x: dropPosition.x - previewNodeSize.width / 2,
        y: dropPosition.y,
      };
    default:
      // Fallback to right-side behavior
      return {
        x: dropPosition.x,
        y: dropPosition.y - previewNodeSize.height / 2,
      };
  }
}

function calculateCenteredPosition(
  centerPosition: { x: number; y: number },
  previewNodeSize: { width: number; height: number }
): { x: number; y: number } {
  return {
    x: centerPosition.x - previewNodeSize.width / 2,
    y: centerPosition.y - previewNodeSize.height / 2,
  };
}

/**
 * Returns the spread offset for a handle within a multi-handle group.
 * Left/top half shifts by -size, right/bottom half by +size, middle stays at 0.
 */
function computeSpreadOffset(handle: HandleContext | undefined, size: number): number {
  const index = handle?.index ?? null;
  const count = handle?.count ?? 1;
  if (index === null || count <= 1) return 0;
  if (index < Math.floor(count / 2)) return -size;
  if (index >= Math.ceil(count / 2)) return size;
  return 0;
}

/**
 * Calculates the preview node position when no drop position is provided.
 * Positions the preview node on the appropriate side based on handle position.
 * Uses overlap detection to ensure the preview doesn't overlap existing nodes.
 */
function calculateAutoPosition(
  sourceNode: Node,
  handlePosition: Position,
  previewNodeSize: { width: number; height: number },
  existingNodes: Node[],
  offset = GRID_SPACING * 5,
  ignoredNodeTypes: string[] = [],
  handle?: HandleContext
): { x: number; y: number } {
  const sourceAbsolutePosition = sourceNode.parentId
    ? getAbsolutePosition(sourceNode, existingNodes)
    : sourceNode.position;
  const sourceWidth = sourceNode.measured?.width ?? 0;
  const sourceHeight = sourceNode.measured?.height ?? 0;
  // Use exact handle position when available, fall back to node center
  const anchorX = handle?.anchor.x ?? sourceAbsolutePosition.x + sourceWidth / 2;
  const anchorY = handle?.anchor.y ?? sourceAbsolutePosition.y + sourceHeight / 2;

  // Prepare nodes with absolute positions for overlap detection
  const nodesWithAbsolutePositions = existingNodes.map((node) => ({
    ...node,
    position: node.parentId ? getAbsolutePosition(node, existingNodes) : node.position,
  }));

  let initialPosition: { x: number; y: number };
  let direction: 'left' | 'right' | 'top' | 'bottom';

  switch (handlePosition) {
    case Position.Left:
      // Place preview to the left of source node, vertically aligned with the handle
      initialPosition = {
        x: sourceAbsolutePosition.x - previewNodeSize.width - offset,
        y: anchorY - previewNodeSize.height / 2,
      };
      direction = 'left';
      break;
    case Position.Right:
      // Spread vertically when multiple handles share the right side.
      initialPosition = {
        x: sourceAbsolutePosition.x + sourceWidth + offset,
        y:
          anchorY -
          previewNodeSize.height / 2 +
          computeSpreadOffset(handle, previewNodeSize.height),
      };
      direction = 'right';
      break;
    case Position.Top:
      // Spread horizontally when multiple handles share the top side.
      initialPosition = {
        x:
          anchorX -
          previewNodeSize.width / 2 +
          computeSpreadOffset(handle, previewNodeSize.width / 2),
        y: sourceAbsolutePosition.y - previewNodeSize.height - offset,
      };
      direction = 'top';
      break;
    case Position.Bottom:
      // Spread horizontally when multiple handles share the bottom side.
      initialPosition = {
        x:
          anchorX -
          previewNodeSize.width / 2 +
          computeSpreadOffset(handle, previewNodeSize.width / 2),
        y: sourceAbsolutePosition.y + sourceHeight + offset,
      };
      direction = 'bottom';
      break;
    default:
      // Fallback to right-side behavior
      initialPosition = {
        x: sourceAbsolutePosition.x + sourceWidth + offset,
        y: anchorY - previewNodeSize.height / 2,
      };
      direction = 'right';
  }

  // Overflow toward the closest perpendicular edge of the source node:
  // for top/bottom handles, left of center → shift left, right of center → shift right;
  // for left/right handles, above center → shift up, below center → shift down.
  const overflowDirection = {
    x: anchorX >= sourceAbsolutePosition.x + sourceWidth / 2 ? 'right' : 'left',
    y: anchorY >= sourceAbsolutePosition.y + sourceHeight / 2 ? 'down' : 'up',
  } as { x: 'left' | 'right'; y: 'up' | 'down' };

  // Find non-overlapping position
  return getNonOverlappingPositionForDirection(
    nodesWithAbsolutePositions,
    initialPosition,
    previewNodeSize,
    direction,
    offset,
    ignoredNodeTypes,
    overflowDirection
  );
}

/**
 * Builds the preview node plus its primary edge back to the source handle.
 */
function createPreviewNode({
  sourceNodeId,
  sourceHandleId,
  reactFlowInstance,
  position,
  data,
  sourceHandleType = 'source',
  previewNodeSize = {
    width: DEFAULT_NODE_SIZE,
    height: DEFAULT_NODE_SIZE,
  },
  handlePosition = Position.Right,
  ignoredNodeTypes = [],
  positionMode = 'drop',
}: CreatePreviewNodeOptions): PreviewNodeResult | null {
  const sourceNode = reactFlowInstance.getNode(sourceNodeId);
  if (!sourceNode) {
    console.warn(`Source node ${sourceNodeId} not found`);
    return null;
  }

  // When dragging from a target handle, we should treat the preview as the source for the edge connection.
  const treatPreviewAsSource = sourceHandleType === 'target';

  const existingNodes = reactFlowInstance.getNodes().filter((n) => n.id !== PREVIEW_NODE_ID);

  // Resolve the exact canvas position of the clicked handle via InternalNode bounds.
  // Falls back to undefined (node-center) if the node or handle isn't found.
  const internalNode =
    position === undefined ? reactFlowInstance.getInternalNode(sourceNodeId) : undefined;
  const handle = internalNode
    ? resolveHandleContext(internalNode, sourceHandleId, handlePosition)
    : undefined;

  const previewPosition = position
    ? positionMode === 'center'
      ? calculateCenteredPosition(position, previewNodeSize)
      : calculatePositionFromDrop(position, handlePosition, previewNodeSize)
    : calculateAutoPosition(
        sourceNode,
        handlePosition,
        previewNodeSize,
        existingNodes,
        undefined,
        ignoredNodeTypes,
        handle
      );

  // Calculate handle positions for the preview node
  // The handle facing the source should be on the opposite side of where the preview is placed
  const handleFacingSource = getOppositePosition(handlePosition);

  // Create preview node
  const previewData: Record<string, unknown> = { ...(data ?? {}) };
  // Set handle positions based on whether preview is acting as the source or the target.
  //
  // - When dragging from a *target* handle, we treat the preview node as the *source* (`treatPreviewAsSource`).
  //   In that case the edge should go: preview (source, output handle) -> original node (target, original handle).
  //   Therefore:
  //     • preview.inputHandlePosition stays at the original `handlePosition` (same side as the original target handle),
  //       because this is where an upstream node would eventually connect to the preview.
  //     • preview.outputHandlePosition is `handleFacingSource`, so the preview's output handle visually faces back
  //       towards the original node we are currently connected to.
  //
  // - When dragging from a *source* handle (`treatPreviewAsSource` is false), the original node remains the source.
  //   The preview acts as the target, so its *input* handle must face the original node, and its *output* handle
  //   stays on the original `handlePosition` side for any downstream connections from the preview.
  previewData.inputHandlePosition = treatPreviewAsSource ? handlePosition : handleFacingSource;
  previewData.outputHandlePosition = treatPreviewAsSource ? handleFacingSource : handlePosition;

  const node: Node = {
    id: PREVIEW_NODE_ID,
    type: 'preview',
    position: previewPosition,
    ...previewNodeSize,
    selected: true,
    data: previewData,
  };

  // Create preview edge with consistent styling
  const edge: Edge = {
    id: PREVIEW_EDGE_ID,
    ...(treatPreviewAsSource
      ? {
          source: PREVIEW_NODE_ID,
          sourceHandle: DEFAULT_SOURCE_HANDLE_ID,
          target: sourceNodeId,
          targetHandle: sourceHandleId,
        }
      : {
          source: sourceNodeId,
          sourceHandle: sourceHandleId,
          target: PREVIEW_NODE_ID,
          targetHandle: DEFAULT_TARGET_HANDLE_ID,
        }),
    type: 'default',
    style: PREVIEW_EDGE_STYLE,
  };

  return {
    sourceNode,
    node,
    edge,
  };
}

export function createPreviewGraph(options: CreatePreviewGraphOptions): PreviewGraph | null {
  const {
    reactFlowInstance,
    targetNodeId,
    targetHandleId,
    containerId,
    removedEdgeIds,
    trailingEdgeId,
    trailingEdgeStyle = PREVIEW_EDGE_STYLE,
  } = options;

  const preview = createPreviewNode(options);
  if (!preview) return null;

  const resolvedContainerId = containerId ?? preview.sourceNode.parentId;
  const finalPreviewNode = resolvedContainerId
    ? reparentPreviewNodeToContainer(preview.node, resolvedContainerId, reactFlowInstance)
    : preview.node;

  if (!finalPreviewNode) return null;

  const edges: Edge[] = [preview.edge];

  if (targetNodeId) {
    edges.push({
      id: trailingEdgeId ?? `${PREVIEW_NODE_ID}-${targetNodeId}`,
      source: PREVIEW_NODE_ID,
      sourceHandle: DEFAULT_SOURCE_HANDLE_ID,
      target: targetNodeId,
      targetHandle: targetHandleId,
      type: 'default',
      style: trailingEdgeStyle,
    });
  }

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
  // Use a timeout to avoid React Flow internal reset.
  setTimeout(() => {
    // Update nodes and edges (remove any existing preview first)
    reactFlowInstance.setNodes((nodes) => [
      ...nodes.filter((n) => n.id !== PREVIEW_NODE_ID).map((n) => ({ ...n, selected: false })),
      preview.node,
    ]);

    reactFlowInstance.setEdges((edges) => [
      ...edges.filter(
        (edge) =>
          edge.source !== PREVIEW_NODE_ID &&
          edge.target !== PREVIEW_NODE_ID &&
          !preview.removedEdgeIds?.includes(edge.id)
      ),
      ...preview.edges,
    ]);
  }, 0);
}

/**
 * Removes the preview node and every preview-connected edge from React Flow.
 */
export function removePreviewFromReactFlow(reactFlowInstance: ReactFlowInstance): void {
  reactFlowInstance.setNodes((nodes) => nodes.filter((n) => n.id !== PREVIEW_NODE_ID));
  reactFlowInstance.setEdges((edges) =>
    edges.filter((edge) => edge.source !== PREVIEW_NODE_ID && edge.target !== PREVIEW_NODE_ID)
  );
}
