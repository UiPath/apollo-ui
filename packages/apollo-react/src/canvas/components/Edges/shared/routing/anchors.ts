import {
  type ConnectionMode,
  type Edge,
  type InternalNode,
  Position,
  type ReactFlowState,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { getEdgePosition } from '@uipath/apollo-react/canvas/xyflow/system';
import { getNodeDimensions } from '../../../../utils/container';
import type { RouteAnchor, RouteNodeRequest } from './types';

export type RouteNodeLookup = ReactFlowState['nodeLookup'];

export type RouteAnchorPair = {
  source: RouteAnchor;
  target: RouteAnchor;
};

/**
 * A node as the router sees it, in absolute canvas coordinates.
 *
 * `internals.positionAbsolute` rather than `position`: a node with a `parentId`
 * stores a parent-relative position, so reading `position` puts every child of a
 * container into the request short by the container's own position and the whole
 * route is computed in the wrong frame.
 */
export function toRouteNode(node: InternalNode): RouteNodeRequest {
  const { width, height } = getNodeDimensions(node);
  const { x, y } = node.internals.positionAbsolute;
  return { id: node.id, x, y, width, height };
}

/**
 * The absolute anchor points an edge actually attaches to, resolved from the
 * handle geometry React Flow measured, so the router plans from the same points
 * the renderer draws from. Nodes with several handles (containers, branching
 * nodes, multi-port nodes) would otherwise be routed from a point no handle
 * occupies.
 *
 * Returns `null` when either endpoint node is missing (a dangling edge). When
 * the nodes exist but handle bounds aren't available yet — first render, before
 * measurement — falls back to the node-box faces of a left-to-right flow, which
 * is what this used to do unconditionally.
 */
export function resolveRouteAnchors(
  nodeLookup: RouteNodeLookup,
  edge: Edge,
  connectionMode: ConnectionMode
): RouteAnchorPair | null {
  const sourceNode = nodeLookup.get(edge.source);
  const targetNode = nodeLookup.get(edge.target);
  if (!sourceNode || !targetNode) return null;

  const sourceHandle = edge.sourceHandle ?? null;
  const targetHandle = edge.targetHandle ?? null;

  const position = getEdgePosition({
    id: edge.id,
    sourceNode,
    sourceHandle,
    targetNode,
    targetHandle,
    connectionMode,
  });

  if (!position) {
    return {
      source: approximateAnchor(sourceNode, sourceHandle, Position.Right),
      target: approximateAnchor(targetNode, targetHandle, Position.Left),
    };
  }

  return {
    source: {
      nodeId: sourceNode.id,
      handleId: sourceHandle,
      x: position.sourceX,
      y: position.sourceY,
      position: position.sourcePosition,
    },
    target: {
      nodeId: targetNode.id,
      handleId: targetHandle,
      x: position.targetX,
      y: position.targetY,
      position: position.targetPosition,
    },
  };
}

/** Node-box face midpoint, for when no measured handle is available. */
function approximateAnchor(
  node: InternalNode,
  handleId: string | null,
  face: Position.Left | Position.Right
): RouteAnchor {
  const { width, height } = getNodeDimensions(node);
  const { x, y } = node.internals.positionAbsolute;
  return {
    nodeId: node.id,
    handleId,
    x: face === Position.Right ? x + width : x,
    y: y + height / 2,
    position: face,
  };
}
