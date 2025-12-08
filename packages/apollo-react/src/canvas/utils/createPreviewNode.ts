import { Position, type Edge, type Node, type ReactFlowInstance } from "@uipath/uix/xyflow/react";
import { DEFAULT_NODE_SIZE, PREVIEW_EDGE_ID, PREVIEW_NODE_ID, GRID_SPACING } from "../constants";
import { getAbsolutePosition, getNonOverlappingPositionForDirection } from "./NodeUtils";

/**
 * Returns the opposite position for a given handle position.
 * Used when dragging from a target handle where the preview should appear on the opposite side.
 */
function getOppositePosition(position: Position): Position {
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
  ignoredNodeTypes: string[] = []
): { x: number; y: number } {
  const sourceAbsolutePosition = sourceNode.parentId ? getAbsolutePosition(sourceNode, existingNodes) : sourceNode.position;
  const sourceWidth = sourceNode.measured?.width ?? 0;
  const sourceHeight = sourceNode.measured?.height ?? 0;
  const sourceCenterX = sourceAbsolutePosition.x + sourceWidth / 2;
  const sourceCenterY = sourceAbsolutePosition.y + sourceHeight / 2;

  // Prepare nodes with absolute positions for overlap detection
  const nodesWithAbsolutePositions = existingNodes.map((node) => ({
    ...node,
    position: node.parentId ? getAbsolutePosition(node, existingNodes) : node.position,
  }));

  let initialPosition: { x: number; y: number };
  let direction: "left" | "right" | "top" | "bottom";

  switch (handlePosition) {
    case Position.Left:
      // Place preview to the left of source node
      initialPosition = {
        x: sourceAbsolutePosition.x - previewNodeSize.width - offset,
        y: sourceCenterY - previewNodeSize.height / 2,
      };
      direction = "left";
      break;
    case Position.Right:
      // Place preview to the right of source node
      initialPosition = {
        x: sourceAbsolutePosition.x + sourceWidth + offset,
        y: sourceCenterY - previewNodeSize.height / 2,
      };
      direction = "right";
      break;
    case Position.Top:
      // Place preview above source node
      initialPosition = {
        x: sourceCenterX - previewNodeSize.width / 2,
        y: sourceAbsolutePosition.y - previewNodeSize.height - offset,
      };
      direction = "top";
      break;
    case Position.Bottom:
      // Place preview below source node
      initialPosition = {
        x: sourceCenterX - previewNodeSize.width / 2,
        y: sourceAbsolutePosition.y + sourceHeight + offset,
      };
      direction = "bottom";
      break;
    default:
      // Fallback to right-side behavior
      initialPosition = {
        x: sourceAbsolutePosition.x + sourceWidth + offset,
        y: sourceCenterY - previewNodeSize.height / 2,
      };
      direction = "right";
  }

  // Find non-overlapping position
  return getNonOverlappingPositionForDirection(
    nodesWithAbsolutePositions,
    initialPosition,
    previewNodeSize,
    direction,
    offset,
    ignoredNodeTypes
  );
}

/**
 * Creates a preview node and edge at a specific position or calculated position
 * This is the single source of truth for preview node creation
 *
 * @param ignoredNodeTypes Optional array of node types to ignore when calculating overlap (e.g., ["stickyNote"])
 */
export function createPreviewNode(
  sourceNodeId: string,
  sourceHandleId: string,
  reactFlowInstance: ReactFlowInstance,
  position?: { x: number; y: number },
  data?: Record<string, any>,
  sourceHandleType: "source" | "target" = "source",
  previewNodeSize: { width: number; height: number } = { width: DEFAULT_NODE_SIZE, height: DEFAULT_NODE_SIZE },
  handlePosition: Position = Position.Right,
  ignoredNodeTypes: string[] = []
): { node: Node; edge: Edge } | null {
  const sourceNode = reactFlowInstance.getNode(sourceNodeId);
  if (!sourceNode) {
    console.warn(`Source node ${sourceNodeId} not found`);
    return null;
  }

  // When dragging from a target handle, we should treat the preview as the source for the edge connection.
  const treatPreviewAsSource = sourceHandleType === "target";

  // Determine which side to place the preview based on handle position and handle type
  // If dragging from a target handle, the preview should be on the opposite side
  const effectiveHandlePosition = treatPreviewAsSource ? getOppositePosition(handlePosition) : handlePosition;

  const nodePosition = position
    ? calculatePositionFromDrop(position, effectiveHandlePosition, previewNodeSize)
    : calculateAutoPosition(
        sourceNode,
        effectiveHandlePosition,
        previewNodeSize,
        reactFlowInstance.getNodes().filter((n) => n.id !== PREVIEW_NODE_ID),
        undefined,
        ignoredNodeTypes
      );

  // Calculate handle positions for the preview node
  // The handle facing the source should be on the opposite side of where the preview is placed
  const handleFacingSource = getOppositePosition(effectiveHandlePosition);

  // Create preview node
  const finalData = { ...(data ?? {}) };
  if (treatPreviewAsSource) {
    // When preview is the source, it needs an output handle facing the original node
    finalData.showOutputHandle = true;
    finalData.outputHandlePosition = handleFacingSource;
    // Input handle goes on the opposite side (away from source)
    finalData.inputHandlePosition = effectiveHandlePosition;
  } else {
    // When preview is the target, it needs an input handle facing the source node
    finalData.inputHandlePosition = handleFacingSource;
    // Output handle goes on the opposite side (away from source) - for future chaining
    finalData.outputHandlePosition = effectiveHandlePosition;
  }

  const previewNode: Node = {
    id: PREVIEW_NODE_ID,
    type: "preview",
    position: nodePosition,
    ...previewNodeSize,
    selected: true,
    data: finalData,
  };

  const previewSourceAndTargetData = treatPreviewAsSource
    ? { source: PREVIEW_NODE_ID, sourceHandle: "output", target: sourceNodeId, targetHandle: sourceHandleId }
    : { source: sourceNodeId, sourceHandle: sourceHandleId, target: PREVIEW_NODE_ID, targetHandle: "input" };

  // Create preview edge with consistent styling
  const previewEdge: Edge = {
    id: PREVIEW_EDGE_ID,
    ...previewSourceAndTargetData,
    type: "default",
    style: {
      strokeDasharray: "5,5",
      opacity: 0.8,
      stroke: "var(--uix-canvas-selection-indicator)",
      strokeWidth: 2,
    },
  };

  return { node: previewNode, edge: previewEdge };
}

/**
 * Applies preview node and edge to React Flow instance
 * Handles cleanup of existing previews and selection
 */
export function applyPreviewToReactFlow(preview: { node: Node; edge: Edge }, reactFlowInstance: ReactFlowInstance): void {
  // Use a timeout to avoid React Flow internal reset.
  setTimeout(() => {
    // Update nodes and edges (remove any existing preview first)
    reactFlowInstance.setNodes((nodes) => [
      ...nodes.filter((n) => n.id !== PREVIEW_NODE_ID).map((n) => ({ ...n, selected: false })),
      preview.node,
    ]);

    reactFlowInstance.setEdges((edges) => [...edges.filter((e) => e.id !== PREVIEW_EDGE_ID), preview.edge]);
  }, 0);
}

/**
 * Removes preview node and edge from React Flow instance
 */
export function removePreviewFromReactFlow(reactFlowInstance: ReactFlowInstance): void {
  reactFlowInstance.setNodes((nodes) => nodes.filter((n) => n.id !== PREVIEW_NODE_ID));
  reactFlowInstance.setEdges((edges) => edges.filter((e) => e.id !== PREVIEW_EDGE_ID));
}
