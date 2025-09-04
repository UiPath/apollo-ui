import type { Node, XYPosition } from "@xyflow/react";
import { BASE_CANVAS_GRID_SPACING } from "../components/BaseCanvas";

/**
 * Calculates the absolute position of a node, taking into account its parent nodes.
 *
 * @param node The node for which to calculate the absolute position.
 * @param nodes Array of all existing nodes.
 * @returns { x: number, y: number } The absolute position of the node.
 */
export const getAbsolutePosition = (node: Node, nodes: Node[]): { x: number; y: number } => {
  let x = node.position.x;
  let y = node.position.y;
  let currentNode: Node | undefined = node;
  while (currentNode?.parentId) {
    const parentNode = nodes.find((n) => n.id === currentNode?.parentId);
    x += parentNode?.position.x ?? 0;
    y += parentNode?.position.y ?? 0;
    currentNode = parentNode;
  }
  return { x, y };
};

/**
 * Calculates a position for a new node to be aligned beside a target node without overlapping.
 *
 * @param targetNode The node beside which the new node should be positioned.
 * @param newNodeSize The style (height and width) of the new node.
 * @param existingNodes Array of all existing nodes, including dynamically added ones.
 * @param offset The default offset distance between nodes.
 * @returns { x: number, y: number } The position for the new node.
 */
export const getNewNodePosition = (
  targetNode: Node,
  newNodeSize: { width: number; height: number },
  existingNodes: Node[],
  placementPreference: "right" | "top-right" | "align-top" = "right",
  offset = BASE_CANVAS_GRID_SPACING * 6
): { x: number; y: number } => {
  const getNodesToCompare = (targetNode: Node | undefined) => {
    if (targetNode?.parentId) {
      if (targetNode.type === "bpmn:BoundaryEvent") {
        // get task the boundary event is attached to
        const attachedToNode = existingNodes.find((node) => node.id === targetNode.data?.attachedToId);
        return attachedToNode?.parentId ? existingNodes.filter((node) => node.parentId === attachedToNode.parentId) : existingNodes;
      }
      return existingNodes.filter((node) => node.parentId === targetNode.parentId);
    }
    return existingNodes;
  };
  let nodesToCompare = getNodesToCompare(targetNode);
  nodesToCompare = nodesToCompare.map((node) => {
    return {
      ...node,
      position: getAbsolutePosition(node, existingNodes),
    };
  });
  const targetAbsolutePosition = targetNode.parentId ? getAbsolutePosition(targetNode, existingNodes) : targetNode.position;
  const currentNodeCenterY = targetAbsolutePosition.y + (targetNode.measured?.height ?? 0) / 2;
  const newNodeHeight = newNodeSize.height;
  const newNodePositionY = currentNodeCenterY - newNodeHeight / 2;
  const newNodePositionX = targetAbsolutePosition.x + (targetNode.measured?.width ?? 0) + offset;

  if (placementPreference === "top-right") {
    return getNonOverlappingPosition(nodesToCompare, { x: newNodePositionX, y: newNodePositionY - offset }, newNodeSize, offset * -1);
  }

  if (placementPreference === "align-top") {
    return getNonOverlappingPosition(nodesToCompare, { x: newNodePositionX, y: targetAbsolutePosition.y }, newNodeSize, offset);
  }

  return getNonOverlappingPosition(nodesToCompare, { x: newNodePositionX, y: newNodePositionY }, newNodeSize, offset);
};

/**
 * Recursively calculates a non-overlapping position for a new node.
 *
 * @param nodes Array of all existing nodes.
 * @param newNodePosition The position for the new node.
 * @param newNodeStyle The style (height and width) of the new node.
 * @param offset The default offset distance between nodes.
 * @returns { x: number, y: number } The non-overlapping position for the new node.
 */
function getNonOverlappingPosition(
  nodes: Node[],
  newNodePosition: XYPosition,
  newNodeStyle: { width: number; height: number },
  offset = BASE_CANVAS_GRID_SPACING * 2
): XYPosition {
  const isOverlapping = nodes.some(
    (node) =>
      node.id !== "preview-node-id" &&
      node.position.x < newNodePosition.x + newNodeStyle.width &&
      node.position.x + (node.measured?.width ?? 0) > newNodePosition.x &&
      node.position.y < newNodePosition.y + newNodeStyle.height &&
      node.position.y + (node.measured?.height ?? 0) > newNodePosition.y
  );

  if (isOverlapping) {
    newNodePosition.y += offset;
    return getNonOverlappingPosition(nodes, newNodePosition, newNodeStyle, offset);
  }

  return newNodePosition;
}
