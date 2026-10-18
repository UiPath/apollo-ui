import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { GRID_SPACING } from '../../constants';
import { getNodeDimensions } from '../../utils/container';
import { getNonOverlappingPositionForDirection, snapToGrid } from '../../utils/NodeUtils';
import { isSequentialInsertedNode, SEQ_INSERTED_FLAG } from './edges/sequentialInsert';

/**
 * Gives each node inserted while in sequential view (stamped `data.seqInserted`) a real,
 * non-overlapping flow position to the right of its seam source and clears the flag.
 * Pre-existing nodes are only read as obstacles and returned by identity; placement uses
 * `getNonOverlappingPositionForDirection`, not `resolveCollisions`, which would move them.
 */
export function synthesizePositionsForFlow(nodes: Node[], edges: Edge[]): Node[] {
  if (!nodes.some(isSequentialInsertedNode)) return nodes;

  const gap = GRID_SPACING * 5;
  const result = [...nodes];
  const indexById = new Map(result.map((node, index) => [node.id, index]));
  const incomingByTarget = new Map<string, Edge>();
  for (const edge of edges) {
    if (!incomingByTarget.has(edge.target)) incomingByTarget.set(edge.target, edge);
  }

  for (let i = 0; i < result.length; i++) {
    const node = result[i]!;
    if (!isSequentialInsertedNode(node)) continue;

    const size = getNodeDimensions(node);
    const sourceEdge = incomingByTarget.get(node.id);
    const sourceIndex = sourceEdge ? indexById.get(sourceEdge.source) : undefined;
    const source = sourceIndex !== undefined ? result[sourceIndex] : undefined;

    const anchor = source
      ? { x: source.position.x + getNodeDimensions(source).width + gap, y: source.position.y }
      : { x: 0, y: 0 };

    // Only nodes in the same coordinate frame (same `parentId`) are comparable by raw position.
    const obstacles = result.filter(
      (other) =>
        other.id !== node.id && (other.parentId ?? undefined) === (node.parentId ?? undefined)
    );

    const placed = getNonOverlappingPositionForDirection(
      obstacles,
      { x: snapToGrid(anchor.x), y: snapToGrid(anchor.y) },
      size,
      'right',
      GRID_SPACING * 2
    );

    result[i] = clearInsertedMarker(node, placed);
  }

  return result;
}

/** Drops the `seqInserted` flag and the `draggable: false` the sequential insert forced. */
function clearInsertedMarker(node: Node, position: { x: number; y: number }): Node {
  const { [SEQ_INSERTED_FLAG]: _flag, ...restData } = node.data as Record<string, unknown>;
  const { draggable: _draggable, ...restNode } = node;
  return { ...restNode, position, data: restData };
}
