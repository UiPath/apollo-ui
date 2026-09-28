import {
  type Handle,
  type InternalNode,
  type Node,
  Position,
  type ReactFlowState,
  type XYPosition,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_NODE_SIZE, GRID_SPACING, PREVIEW_NODE_ID } from '../constants';

// Use `connection.inProgress` rather than `connectionClickStartHandle`.
// `connectionClickStartHandle` is set by click-to-connect and only cleared when
// the user clicks a second handle — clicking the pane does NOT clear it, so it
// can get stuck and cause all handles across all nodes to stay visible.
// `connection.inProgress` accurately reflects an active drag-to-connect gesture.
export const selectIsConnecting = (state: ReactFlowState) => !!state.connection.inProgress;

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
 * @param overflowDirection Controls the shift direction when overlap is detected. Derived from handle position relative to node center — `'left'`/`'up'` shifts toward those edges, `'right'`/`'down'` toward the opposite.
 * @returns { x: number, y: number } The non-overlapping position for the new node.
 */
export function getNonOverlappingPositionForDirection(
  nodes: Node[],
  newNodePosition: XYPosition,
  newNodeStyle: { width: number; height: number },
  direction: 'left' | 'right' | 'top' | 'bottom',
  offset = GRID_SPACING * 2,
  ignoredNodeTypes: string[] = [],
  overflowDirection: { x: 'left' | 'right'; y: 'up' | 'down' } = { x: 'right', y: 'down' }
): XYPosition {
  const isOverlapping = nodes.some((node) => {
    if (node.id === PREVIEW_NODE_ID || ignoredNodeTypes.includes(node.type ?? '')) return false;
    // Fall back to width/height and DEFAULT_NODE_SIZE when `measured` isn't
    // populated yet — React Flow measures asynchronously, so a node committed
    // by the previous Add Node click can still have `measured` undefined when
    // the next click runs overlap detection.
    const nodeWidth = node.measured?.width ?? node.width ?? DEFAULT_NODE_SIZE;
    const nodeHeight = node.measured?.height ?? node.height ?? DEFAULT_NODE_SIZE;
    return (
      node.position.x < newNodePosition.x + newNodeStyle.width &&
      node.position.x + nodeWidth > newNodePosition.x &&
      node.position.y < newNodePosition.y + newNodeStyle.height &&
      node.position.y + nodeHeight > newNodePosition.y
    );
  });

  if (isOverlapping) {
    // Shift toward the closest perpendicular edge of the source node.
    // For left/right placement, shift vertically; for top/bottom, shift horizontally.
    // The direction is derived from the handle's position relative to node center.
    if (direction === 'left' || direction === 'right') {
      newNodePosition.y += overflowDirection.y === 'down' ? offset : -offset;
    } else {
      newNodePosition.x += overflowDirection.x === 'right' ? offset : -offset;
    }
    return getNonOverlappingPositionForDirection(
      nodes,
      newNodePosition,
      newNodeStyle,
      direction,
      offset,
      ignoredNodeTypes,
      overflowDirection
    );
  }

  return newNodePosition;
}

export const snapToGrid = (value: number): number => {
  return Math.round(value / GRID_SPACING) * GRID_SPACING;
};

export const snapUpToGrid = (value: number): number => {
  return Math.ceil(value / GRID_SPACING) * GRID_SPACING;
};

export const snapDownToGrid = (value: number): number => {
  return Math.floor(value / GRID_SPACING) * GRID_SPACING;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export type CollisionAlgorithmOptions = {
  maxIterations?: number;
  overlapThreshold?: number;
  margin?: number;
  ignoredNodeTypes?: string[];
  /** Allows callers to resolve manifest-aware sizes before collision math runs. */
  getNodeDimensions?: (node: Node) => { width: number; height: number };
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

function getBoxesFromNodes(
  nodes: Node[],
  margin: number = 0,
  getNodeDimensions?: (node: Node) => { width: number; height: number }
): Box[] {
  const boxes: Box[] = new Array(nodes.length);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;
    const nodeSize = getNodeDimensions?.(node) ?? {
      width: node.width ?? node.measured?.width ?? DEFAULT_NODE_SIZE,
      height: node.height ?? node.measured?.height ?? DEFAULT_NODE_SIZE,
    };
    boxes[i] = {
      x: node.position.x - margin,
      y: node.position.y - margin,
      width: nodeSize.width + margin * 2,
      height: nodeSize.height + margin * 2,
      node,
      moved: false,
    };
  }

  return boxes;
}

/**
 * Moves overlapping nodes apart on the smallest overlap axis while
 * preserving original order and leaving ignored node types untouched.
 */
export const resolveCollisions: CollisionAlgorithm = (
  nodes,
  {
    maxIterations = 50,
    overlapThreshold = 0,
    margin = GRID_SPACING * 2,
    ignoredNodeTypes,
    getNodeDimensions,
  } = {}
) => {
  const ignoredSet = new Set(ignoredNodeTypes);
  const collisionNodes =
    ignoredSet.size > 0 ? nodes.filter((n) => !ignoredSet.has(n.type ?? '')) : nodes;

  const boxes = getBoxesFromNodes(collisionNodes, margin, getNodeDimensions);
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

export type HandleContext = {
  anchor: { x: number; y: number };
  index: number | null;
  count: number;
};

/**
 * Resolves the manifest-level boundary ('outer' | 'inner') for a given handle
 * id. Container nodes flip inner-handle Handle components to the opposite side
 * via `connectionPosition`, so multiple visual rails collapse onto the same
 * React Flow `Position`. Pass this to `resolveHandleContext` so the peer count
 * only includes handles that visually share an edge with the queried handle.
 */
export type HandleBoundaryResolver = (handleId: string) => 'outer' | 'inner' | undefined;

export interface ResolveHandleContextOptions {
  boundaryOf?: HandleBoundaryResolver;
}

/**
 * Resolves handle context (anchor coordinates, peer index, peer count) for a
 * given handle on an internal node. Returns undefined if the handle isn't found.
 */
export function resolveHandleContext(
  internalNode: InternalNode,
  handleId: string,
  handlePosition: Position,
  options?: ResolveHandleContextOptions
): HandleContext | undefined {
  const allHandles = [
    ...(internalNode.internals.handleBounds?.source ?? []),
    ...(internalNode.internals.handleBounds?.target ?? []),
  ];
  const matchedHandle = allHandles.find((h) => h.id === handleId);
  if (!matchedHandle) return undefined;

  const peers = filterRailPeers(allHandles, handleId, handlePosition, options?.boundaryOf);

  return {
    anchor: {
      x: internalNode.internals.positionAbsolute.x + matchedHandle.x + matchedHandle.width / 2,
      y: internalNode.internals.positionAbsolute.y + matchedHandle.y + matchedHandle.height / 2,
    },
    index: getHandleIndex(handleId, handlePosition, peers),
    count: peers.length,
  };
}

/**
 * Filters handles to those sharing the same visual rail as the queried handle:
 * matching React Flow position, and (when a boundary resolver is provided) the
 * same manifest boundary. Without a resolver, falls back to position-only
 * matching to preserve legacy behavior.
 */
function filterRailPeers(
  allHandles: Handle[],
  handleId: string,
  handlePosition: Position,
  boundaryOf: HandleBoundaryResolver | undefined
): Handle[] {
  const samePosition = allHandles.filter((h) => h.position === handlePosition);
  if (!boundaryOf) return samePosition;

  const targetBoundary = boundaryOf(handleId);
  if (targetBoundary === undefined) return samePosition;

  return samePosition.filter((h) => {
    if (!h.id) return false;
    const peerBoundary = boundaryOf(h.id);
    return peerBoundary === undefined || peerBoundary === targetBoundary;
  });
}

/**
 * Returns the 0-based index of a handle among all handles on the same side,
 * sorted top-to-bottom (Left/Right) or left-to-right (Top/Bottom).
 *
 * @param handleId The ID of the target handle.
 * @param position Which side the handle is on.
 * @param allHandles Flat list of all Handle objects from handleBounds.
 * @returns The ordinal index, or null if the handle isn't found.
 */
export function getHandleIndex(
  handleId: string,
  position: Position,
  allHandles: Handle[]
): number | null {
  const peers = allHandles
    .filter((h) => h.position === position)
    .sort((a, b) =>
      position === Position.Left || position === Position.Right ? a.y - b.y : a.x - b.x
    );
  const index = peers.findIndex((h) => h.id === handleId);
  return index === -1 ? null : index;
}
