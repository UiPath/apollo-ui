import {
  type Edge,
  type Node,
  Position,
  type ReactFlowInstance,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_NODE_SIZE, GRID_SPACING, PREVIEW_EDGE_ID, PREVIEW_NODE_ID } from '../constants';
import { getNodeDimensions } from './container';
import {
  getAbsolutePosition,
  getNonOverlappingPositionForDirection,
  type HandleBoundaryResolver,
  type HandleContext,
  resolveHandleContext,
} from './NodeUtils';

export type PreviewNodePositionMode = 'drop' | 'center';

export const PREVIEW_EDGE_STYLE: Edge['style'] = {
  strokeDasharray: '5,5',
  opacity: 0.8,
  stroke: 'var(--canvas-selection-indicator)',
  strokeWidth: 2,
};

export function isPreviewEdge(edge: { id?: string; source?: string; target?: string }): boolean {
  return (
    edge.id === PREVIEW_EDGE_ID ||
    edge.source === PREVIEW_NODE_ID ||
    edge.target === PREVIEW_NODE_ID
  );
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
  const sourceSize = getNodeDimensions(sourceNode);
  // Use exact handle position when available, fall back to node center
  const anchorX = handle?.anchor.x ?? sourceAbsolutePosition.x + sourceSize.width / 2;
  const anchorY = handle?.anchor.y ?? sourceAbsolutePosition.y + sourceSize.height / 2;
  const ignoredNodeIds = new Set<string>();
  let parentId = sourceNode.parentId;

  while (parentId) {
    ignoredNodeIds.add(parentId);
    parentId = existingNodes.find((node) => node.id === parentId)?.parentId;
  }

  // Prepare nodes with absolute positions for overlap detection.
  // Parent containers are ignored for child previews so they do not push the
  // preview away from the scoped canvas it belongs to.
  const nodesWithAbsolutePositions = existingNodes
    .filter((node) => node.id !== PREVIEW_NODE_ID && !ignoredNodeIds.has(node.id))
    .map((node) => ({
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
        x: sourceAbsolutePosition.x + sourceSize.width + offset,
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
        y: sourceAbsolutePosition.y + sourceSize.height + offset,
      };
      direction = 'bottom';
      break;
    default:
      // Fallback to right-side behavior
      initialPosition = {
        x: sourceAbsolutePosition.x + sourceSize.width + offset,
        y: anchorY - previewNodeSize.height / 2,
      };
      direction = 'right';
  }

  // Overflow toward the closest perpendicular edge of the source node:
  // for top/bottom handles, left of center -> shift left, right of center -> shift right;
  // for left/right handles, above center -> shift up, below center -> shift down.
  const overflowDirection = {
    x: anchorX >= sourceAbsolutePosition.x + sourceSize.width / 2 ? 'right' : 'left',
    y: anchorY >= sourceAbsolutePosition.y + sourceSize.height / 2 ? 'down' : 'up',
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

export interface CreatePreviewNodeOptions {
  /** ID of the node the preview originates from. */
  sourceNodeId: string;
  /** ID of the handle the preview connects to. */
  sourceHandleId: string;
  /** React Flow instance for reading nodes/edges and handle bounds. */
  reactFlowInstance: ReactFlowInstance;
  /**
   * Optional explicit anchor for the preview. When provided, auto-positioning
   * is skipped and `positionMode` decides whether the value is treated as a
   * drop point (`'drop'`) or as the preview's center (`'center'`).
   */
  position?: { x: number; y: number };
  /** Extra data merged into the preview node. */
  data?: Record<string, unknown>;
  /**
   * Whether the clicked handle is a `'source'` or `'target'`. Determines
   * which side of the preview points back at the source node.
   * @default 'source'
   */
  sourceHandleType?: 'source' | 'target';
  /**
   * Size used for the preview node. Defaults to a square node of
   * `DEFAULT_NODE_SIZE`.
   */
  previewNodeSize?: { width: number; height: number };
  /** Side of the source the preview should appear on. @default Position.Right */
  handlePosition?: Position;
  /** Node types to ignore during overlap detection (e.g., sticky notes). */
  ignoredNodeTypes?: string[];
  /**
   * Interpretation of `position`: `'drop'` places the preview adjacent to the
   * point; `'center'` centers the preview on the point.
   * @default 'drop'
   */
  positionMode?: PreviewNodePositionMode;
  /**
   * Manifest-aware boundary resolver for the source node's handles. Lets the
   * peer-count math distinguish outer handles from inner handles flipped to
   * the opposite side via `connectionPosition`, so previews stay anchored to
   * the clicked handle's actual rail.
   */
  sourceBoundaryOf?: HandleBoundaryResolver;
}

/**
 * Creates the preview node and primary preview edge for Add Node flows. The
 * preview can be placed from a drop coordinate, centered at an absolute point,
 * or auto-positioned from the clicked handle when no position is provided.
 */
export function createPreviewNode(
  options: CreatePreviewNodeOptions
): { node: Node; edge: Edge } | null {
  const {
    sourceNodeId,
    sourceHandleId,
    reactFlowInstance,
    position,
    data,
    sourceHandleType = 'source',
    previewNodeSize = { width: DEFAULT_NODE_SIZE, height: DEFAULT_NODE_SIZE },
    handlePosition = Position.Right,
    ignoredNodeTypes = [],
    positionMode = 'drop',
    sourceBoundaryOf,
  } = options;

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
    ? resolveHandleContext(internalNode, sourceHandleId, handlePosition, {
        boundaryOf: sourceBoundaryOf,
      })
    : undefined;

  const nodePosition = position
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
  const finalData: Record<string, unknown> = { ...(data ?? {}) };
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
  finalData.inputHandlePosition = treatPreviewAsSource ? handlePosition : handleFacingSource;
  finalData.outputHandlePosition = treatPreviewAsSource ? handleFacingSource : handlePosition;

  const previewNode: Node = {
    id: PREVIEW_NODE_ID,
    type: 'preview',
    position: nodePosition,
    ...previewNodeSize,
    selected: true,
    data: finalData,
  };

  const previewSourceAndTargetData = treatPreviewAsSource
    ? {
        source: PREVIEW_NODE_ID,
        sourceHandle: 'output',
        target: sourceNodeId,
        targetHandle: sourceHandleId,
      }
    : {
        source: sourceNodeId,
        sourceHandle: sourceHandleId,
        target: PREVIEW_NODE_ID,
        targetHandle: 'input',
      };

  // Create preview edge with consistent styling
  const previewEdge: Edge = {
    id: PREVIEW_EDGE_ID,
    ...previewSourceAndTargetData,
    type: 'default',
    style: PREVIEW_EDGE_STYLE,
  };

  return { node: previewNode, edge: previewEdge };
}

/**
 * Applies preview node and edge to React Flow instance
 * Handles cleanup of existing previews and selection
 */
export function applyPreviewToReactFlow(
  preview: { node: Node; edge: Edge },
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
      ...edges.filter((edge) => !isPreviewEdge(edge)),
      preview.edge,
    ]);
  }, 0);
}

/**
 * Removes preview node and edge from React Flow instance
 */
export function removePreviewFromReactFlow(reactFlowInstance: ReactFlowInstance): void {
  if (reactFlowInstance.getNodes().some((n) => n.id === PREVIEW_NODE_ID)) {
    reactFlowInstance.setNodes((nodes) => nodes.filter((n) => n.id !== PREVIEW_NODE_ID));
  }
  if (reactFlowInstance.getEdges().some((edge) => isPreviewEdge(edge))) {
    reactFlowInstance.setEdges((edges) => edges.filter((edge) => !isPreviewEdge(edge)));
  }
}
