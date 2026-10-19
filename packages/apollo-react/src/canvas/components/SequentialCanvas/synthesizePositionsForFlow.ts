import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { GRID_SPACING } from '../../constants';
import {
  CONTAINER_SEQUENCE_GAP_PX,
  type ContainerFitGeometry,
  fitContainersAndPushSiblings,
  getContainerSafeArea,
  getNodeDimensions,
} from '../../utils/container';
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
    const parentIndex = node.parentId ? indexById.get(node.parentId) : undefined;
    const parent = parentIndex !== undefined ? result[parentIndex] : undefined;

    // A source in the same frame anchors the node beside it. A source that is the parent
    // itself (entry from its inner start handle), one in another frame, or no source at all
    // (head of a self-contained body) anchors at the parent's body origin instead.
    const sameFrame =
      source !== undefined && (source.parentId ?? undefined) === (node.parentId ?? undefined);
    const anchor = sameFrame
      ? { x: source.position.x + getNodeDimensions(source).width + gap, y: source.position.y }
      : parent
        ? bodyOrigin(parent)
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

export interface FlowInsertPlacement<N extends Node = Node> {
  /** The inserted node with a flow position in its real parent and the insert marker cleared. */
  node: N;
  /** Existing canonical nodes the placement changed: grown ancestor containers, pushed siblings. */
  updates: N[];
}

/**
 * Canonical flow placement for a node inserted into a container body shown as a sequence.
 * Places it beside its source in its real parent (see {@link synthesizePositionsForFlow}),
 * then grows every ancestor container and pushes siblings the way a flow-mode add does, so
 * the body reads correctly when it switches back to flow. Pure: inputs are not mutated.
 */
export function placeInsertForFlow<N extends Node>({
  nodes,
  edges,
  inserted,
  newEdges,
  getNodeDimensions: dimensionsOf,
  getContainerFitGeometry,
  ignoredNodeTypes,
}: {
  nodes: readonly N[];
  edges: readonly Edge[];
  inserted: N;
  newEdges: readonly Edge[];
  getNodeDimensions: (node: Node) => { width: number; height: number };
  getContainerFitGeometry: (container: Node) => ContainerFitGeometry | null | undefined;
  ignoredNodeTypes?: string[];
}): FlowInsertPlacement<N> {
  const synthesized = synthesizePositionsForFlow([...nodes, inserted] as Node[], [
    ...edges,
    ...newEdges,
  ]);
  const ancestorIds: string[] = [];
  const byId = new Map(synthesized.map((node) => [node.id, node]));
  for (let id = inserted.parentId; id && !ancestorIds.includes(id); id = byId.get(id)?.parentId) {
    ancestorIds.push(id);
  }
  const fitted =
    ancestorIds.length === 0
      ? synthesized
      : fitContainersAndPushSiblings({
          nodes: synthesized,
          containerIds: ancestorIds,
          getContainerFitGeometry,
          getNodeDimensions: dimensionsOf,
          ignoredNodeTypes,
          gap: CONTAINER_SEQUENCE_GAP_PX,
        });

  const originalById = new Map(nodes.map((node) => [node.id, node]));
  const updates: N[] = [];
  let node = inserted;
  for (const candidate of fitted) {
    if (candidate.id === inserted.id) node = candidate as N;
    else if (originalById.get(candidate.id) !== candidate) updates.push(candidate as N);
  }
  return { node, updates };
}

function bodyOrigin(container: Node): { x: number; y: number } {
  const padding = getContainerSafeArea(container).padding;
  return { x: padding?.left ?? 0, y: padding?.top ?? 0 };
}

/** Drops the `seqInserted` flag and the `draggable: false` the sequential insert forced. */
function clearInsertedMarker(node: Node, position: { x: number; y: number }): Node {
  const { [SEQ_INSERTED_FLAG]: _flag, ...restData } = node.data as Record<string, unknown>;
  const { draggable: _draggable, ...restNode } = node;
  return { ...restNode, position, data: restData };
}
