import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_NODE_SIZE, GRID_SPACING } from '../../constants';
import { getNonOverlappingPositionForDirection, snapToGrid } from '../../utils/NodeUtils';
import { SEQ_INSERTED_FLAG } from './edges/sequentialInsert';

/**
 * Places nodes that were inserted while in the sequential view (D4).
 *
 * Sequential view never persists positions: layout owns them, and canonical
 * `node.position` is left untouched so toggling back to flow is lossless. The
 * one exception is a node the user added while in sequential view, which has no
 * meaningful flow position. Those are stamped `data.seqInserted` (by
 * `sequentialOnBeforeNodeAdded`); on toggle back to flow this function gives each
 * one a real, non-overlapping position and clears the flag.
 *
 * Guarantees (asserted by the round-trip test):
 *  - NO pre-existing node is moved. Existing nodes are only read as obstacles;
 *    their objects are returned by identity. Only `seqInserted` nodes change.
 *  - No inserted node overlaps another node. Placement uses
 *    `getNonOverlappingPositionForDirection`, which shifts ONLY the new node
 *    (never the obstacles) until it clears them — the opposite of
 *    `resolveCollisions`, which would move both and violate the guarantee.
 *
 * Placement anchors each inserted node just to the right of its seam source (the
 * node its incoming edge comes from), matching the left-to-right bias of the
 * free-form Add Node pipeline, then resolves overlap by shifting downward.
 * Obstacle checks stay within the node's own coordinate frame (same `parentId`),
 * so a node inserted inside a container is placed relative to its siblings.
 */
export function synthesizePositionsForFlow(nodes: Node[], edges: Edge[]): Node[] {
  const hasInserted = nodes.some((node) => isSeqInserted(node));
  if (!hasInserted) return nodes;

  const gap = GRID_SPACING * 5;
  const result = [...nodes];
  const indexById = new Map(result.map((node, index) => [node.id, index]));
  const incomingByTarget = new Map<string, Edge>();
  for (const edge of edges) {
    if (!incomingByTarget.has(edge.target)) incomingByTarget.set(edge.target, edge);
  }

  for (let i = 0; i < result.length; i++) {
    const node = result[i]!;
    if (!isSeqInserted(node)) continue;

    const size = {
      width: node.width ?? node.measured?.width ?? DEFAULT_NODE_SIZE,
      height: node.height ?? node.measured?.height ?? DEFAULT_NODE_SIZE,
    };

    const sourceEdge = incomingByTarget.get(node.id);
    const sourceIndex = sourceEdge ? indexById.get(sourceEdge.source) : undefined;
    const source = sourceIndex !== undefined ? result[sourceIndex] : undefined;
    const sourceWidth = source?.width ?? source?.measured?.width ?? DEFAULT_NODE_SIZE;

    const anchor = source
      ? { x: source.position.x + sourceWidth + gap, y: source.position.y }
      : { x: 0, y: 0 };

    // Obstacles: every other node sharing this node's coordinate frame. Same
    // frame => comparing raw `position` is valid; nodes in other frames are
    // irrelevant to overlap here.
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

function isSeqInserted(node: Node): boolean {
  return (node.data as Record<string, unknown> | undefined)?.[SEQ_INSERTED_FLAG] === true;
}

/**
 * Returns a node with a real flow position and the sequential-only markers
 * removed: the `seqInserted` flag is dropped and `draggable` (forced false by the
 * sequential insert helper) is cleared so the node behaves normally in flow view.
 */
function clearInsertedMarker(node: Node, position: { x: number; y: number }): Node {
  const { [SEQ_INSERTED_FLAG]: _flag, ...restData } = node.data as Record<string, unknown>;
  const { draggable: _draggable, ...restNode } = node;
  return { ...restNode, position, data: restData };
}
