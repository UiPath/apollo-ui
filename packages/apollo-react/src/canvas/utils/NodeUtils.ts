import type { Node, XYPosition } from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_NODE_SIZE, GRID_SPACING, PREVIEW_NODE_ID } from '../constants';

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

export const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SPACING) * GRID_SPACING;
};

export type CollisionAlgorithmOptions = {
  maxIterations?: number;
  overlapThreshold?: number;
  margin?: number;
  ignoredNodeTypes?: string[];
};

export type CollisionAlgorithm = (nodes: Node[], options?: CollisionAlgorithmOptions) => Node[];

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  moved: boolean;
  node: Node;
};

function getBoxesFromNodes(nodes: Node[], margin: number = 0): Box[] {
  const boxes: Box[] = new Array(nodes.length);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    boxes[i] = {
      x: node.position.x - margin,
      y: node.position.y - margin,
      width: (node.width ?? node.measured?.width ?? DEFAULT_NODE_SIZE) + margin * 2,
      height: (node.height ?? node.measured?.height ?? DEFAULT_NODE_SIZE) + margin * 2,
      node,
      moved: false,
    };
  }

  return boxes;
}

export const resolveCollisions: CollisionAlgorithm = (
  nodes,
  { maxIterations = 50, overlapThreshold = 0, margin = GRID_SPACING * 2, ignoredNodeTypes } = {}
) => {
  const ignoredSet = new Set(ignoredNodeTypes);
  const collisionNodes =
    ignoredSet.size > 0 ? nodes.filter((n) => !ignoredSet.has(n.type ?? '')) : nodes;

  const boxes = getBoxesFromNodes(collisionNodes, margin);
  for (let iter = 0; iter < maxIterations; iter++) {
    let moved = false;

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const A = boxes[i]!;
        const B = boxes[j]!;

        // Calculate center positions
        const centerAX = A.x + A.width * 0.5;
        const centerAY = A.y + A.height * 0.5;
        const centerBX = B.x + B.width * 0.5;
        const centerBY = B.y + B.height * 0.5;

        // Calculate distance between centers
        const dx = centerAX - centerBX;
        const dy = centerAY - centerBY;

        // Calculate overlap along each axis
        const px = (A.width + B.width) * 0.5 - Math.abs(dx);
        const py = (A.height + B.height) * 0.5 - Math.abs(dy);

        // Check if there's significant overlap
        if (px > overlapThreshold && py > overlapThreshold) {
          A.moved = B.moved = moved = true;
          // Resolve along the smallest overlap axis
          if (px < py) {
            // Move along x-axis
            const sx = dx > 0 ? 1 : -1;
            const moveAmount = snapToGrid((px / 2) * sx);
            A.x += moveAmount;
            B.x -= moveAmount;
          } else {
            // Move along y-axis
            const sy = dy > 0 ? 1 : -1;
            const moveAmount = snapToGrid((py / 2) * sy);
            A.y += moveAmount;
            B.y -= moveAmount;
          }
        }
      }
    }
    if (!moved) {
      break;
    }
  }

  // Build a map of resolved collision nodes by id
  const resolvedMap = new Map<string, Node>();
  for (const box of boxes) {
    if (box.moved) {
      resolvedMap.set(box.node.id, {
        ...box.node,
        position: {
          x: snapToGrid(box.x + margin),
          y: snapToGrid(box.y + margin),
        },
      });
    }
  }

  // Return all nodes in original order: resolved nodes get updated positions, ignored nodes stay untouched
  return nodes.map((n) => resolvedMap.get(n.id) ?? n);
};
