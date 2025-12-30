import type { Node, XYPosition } from '@uipath/uix/xyflow/react';
import { PREVIEW_NODE_ID, GRID_SPACING } from '../constants';

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
 * Direction-aware non-overlapping position calculation.
 * Shifts the node perpendicular to the placement direction when overlap is detected.
 *
 * @param nodes Array of all existing nodes.
 * @param newNodePosition The initial position for the new node.
 * @param newNodeStyle The size (height and width) of the new node.
 * @param direction The direction the node is placed relative to source ("left" | "right" | "top" | "bottom").
 * @param offset The offset distance to shift when overlapping.
 * @param ignoredNodeTypes Optional array of node types to ignore when calculating overlap.
 * @returns { x: number, y: number } The non-overlapping position for the new node.
 */
export function getNonOverlappingPositionForDirection(
  nodes: Node[],
  newNodePosition: XYPosition,
  newNodeStyle: { width: number; height: number },
  direction: 'left' | 'right' | 'top' | 'bottom',
  offset = GRID_SPACING * 2,
  ignoredNodeTypes: string[] = []
): XYPosition {
  const isOverlapping = nodes.some(
    (node) =>
      node.id !== PREVIEW_NODE_ID &&
      !ignoredNodeTypes.includes(node.type ?? '') &&
      node.position.x < newNodePosition.x + newNodeStyle.width &&
      node.position.x + (node.measured?.width ?? 0) > newNodePosition.x &&
      node.position.y < newNodePosition.y + newNodeStyle.height &&
      node.position.y + (node.measured?.height ?? 0) > newNodePosition.y
  );

  if (isOverlapping) {
    // Shift perpendicular to the placement direction
    if (direction === 'left' || direction === 'right') {
      // For left/right placement, shift vertically (down)
      newNodePosition.y += offset;
    } else {
      // For top/bottom placement, shift horizontally (right)
      newNodePosition.x += offset;
    }
    return getNonOverlappingPositionForDirection(
      nodes,
      newNodePosition,
      newNodeStyle,
      direction,
      offset,
      ignoredNodeTypes
    );
  }

  return newNodePosition;
}
