import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { getAbsolutePosition } from '../NodeUtils';
import { buildEdgeId } from '../props-helpers';
import {
  indexNodesByParent,
  isSequentialContinuationEdge,
  rowsById,
  SEQ_CONTINUATION_EDGE_KEY,
} from './graph-helpers';
import type {
  GraphChangeSet,
  InsertionSlot,
  SequenceConnector,
  SequenceProjection,
} from './sequential.types';

/**
 * Pure mutation ops. Each returns a {@link GraphChangeSet} the caller applies through
 * onNodesChange / onEdgesChange. Edge ids follow the AddNodeManager convention so
 * inserts made here are indistinguishable from pipeline inserts.
 */

function makeEdge(
  source: string,
  sourceHandle: string | undefined,
  target: string,
  targetHandle: string | undefined,
  continuation = false
): Edge {
  return {
    id: buildEdgeId(source, sourceHandle, target, targetHandle),
    source,
    target,
    sourceHandle: sourceHandle ?? undefined,
    targetHandle: targetHandle ?? undefined,
    type: 'default',
    ...(continuation ? { data: { [SEQ_CONTINUATION_EDGE_KEY]: true } } : {}),
  };
}

interface Incomer {
  source: string;
  sourceHandle?: string;
  edgeId: string;
  continuation?: boolean;
}
interface Outgoer {
  target: string;
  targetHandle?: string;
  edgeId: string;
}

const EMPTY_CHANGE_SET: GraphChangeSet = {
  addNodes: [],
  addEdges: [],
  removeNodeIds: [],
  removeEdgeIds: [],
};

/** The one or two edges that wire `nodeId` into `slot`. */
function edgesForSlot(slot: InsertionSlot, nodeId: string): Edge[] {
  const fromSource = slot.source
    ? makeEdge(slot.source.nodeId, slot.source.handleId, nodeId, undefined, slot.continuation)
    : undefined;
  const toTarget = slot.target
    ? makeEdge(nodeId, undefined, slot.target.nodeId, slot.target.handleId, true)
    : undefined;
  if (fromSource && toTarget && slot.graphEdgeId) return [fromSource, toTarget];
  if (fromSource) return [fromSource];
  if (toTarget) return [toTarget];
  return [];
}

/** Splice a new node into the graph at the given insertion slot. */
export function insertAtSlot(
  _projection: SequenceProjection,
  slot: InsertionSlot,
  newNode: Node
): GraphChangeSet {
  // `extent: 'parent'` travels with `parentId`, matching `sequentialOnBeforeNodeAdded`
  // and `reparentNode`; insertParity.test.ts relies on the shapes agreeing.
  const node = slot.containerId
    ? { ...newNode, parentId: slot.containerId, extent: 'parent' as const }
    : newNode;
  const splitsEdge = Boolean(slot.graphEdgeId && slot.source && slot.target);
  return {
    addNodes: [node],
    addEdges: edgesForSlot(slot, node.id),
    removeNodeIds: [],
    removeEdgeIds: splitsEdge ? [slot.graphEdgeId as string] : [],
  };
}

/**
 * Cross-product of incomers and outgoers, deduplicated by edge id. An incomer whose
 * source is the outgoer's target would heal into a self-loop and is skipped, as is
 * anything touching `skipNodeId` (the node being moved).
 */
function healEdges(incomers: Incomer[], outgoers: Outgoer[], skipNodeId?: string): Edge[] {
  const addEdges: Edge[] = [];
  const seen = new Set<string>();
  for (const incomer of incomers) {
    if (incomer.source === skipNodeId) continue;
    for (const outgoer of outgoers) {
      if (outgoer.target === skipNodeId || incomer.source === outgoer.target) continue;
      const edge = makeEdge(
        incomer.source,
        incomer.sourceHandle,
        outgoer.target,
        outgoer.targetHandle,
        incomer.continuation
      );
      if (!seen.has(edge.id)) {
        seen.add(edge.id);
        addEdges.push(edge);
      }
    }
  }
  return addEdges;
}

/**
 * Every slot-bearing connector targeting `nodeId`, regardless of kind. `branch-entry`
 * needs no exclusion here: a node is never the target of its own branch-entry.
 */
export function incomingSeams(projection: SequenceProjection, nodeId: string): SequenceConnector[] {
  return projection.connectors.filter((c) => c.targetRowId === nodeId && c.slot);
}

export function ownIncomingConnector(
  projection: SequenceProjection,
  nodeId: string
): SequenceConnector | undefined {
  return incomingSeams(projection, nodeId)[0];
}

/**
 * `nodeId`'s own next-step connector. Excludes `branch-entry`, which is sourced at
 * the owner into its own body/lane and is not a forward step.
 */
export function ownOutgoingConnector(
  projection: SequenceProjection,
  nodeId: string
): SequenceConnector | undefined {
  return projection.connectors.find(
    (c) => c.sourceRowId === nodeId && c.kind !== 'branch-entry' && c.slot
  );
}

/** A node's own seam from slot-bearing connectors, excluding its `branch-entry` outgoers. */
function collectOwnSeam(
  projection: SequenceProjection,
  nodeId: string
): { incomers: Incomer[]; outgoers: Outgoer[] } {
  const incomers: Incomer[] = [];
  const outgoers: Outgoer[] = [];
  for (const connector of projection.connectors) {
    const edgeId = connector.slot?.graphEdgeId;
    if (!edgeId) continue;
    if (connector.targetRowId === nodeId) {
      incomers.push({
        source: connector.slot?.source?.nodeId ?? connector.sourceRowId,
        sourceHandle: connector.slot?.source?.handleId,
        edgeId,
        continuation: connector.slot?.continuation,
      });
    }
    if (connector.sourceRowId === nodeId && connector.kind !== 'branch-entry') {
      outgoers.push({
        target: connector.slot?.target?.nodeId ?? connector.targetRowId,
        targetHandle: connector.slot?.target?.handleId,
        edgeId,
      });
    }
  }
  return { incomers, outgoers };
}

/** Ids transitively under `rootId` in a parent -> child-ids map (pre-order, LIFO). */
function descendantsOf(
  childIdsByParent: ReadonlyMap<string | undefined, readonly string[]>,
  rootId: string
): string[] {
  const result: string[] = [];
  const stack = [...(childIdsByParent.get(rootId) ?? [])];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    result.push(id);
    stack.push(...(childIdsByParent.get(id) ?? []));
  }
  return result;
}

/** Child ids by `node.parentId`. */
function structuralChildIds(nodes: Node[]): Map<string | undefined, string[]> {
  const byParent = new Map<string | undefined, string[]>();
  for (const [parentId, children] of indexNodesByParent(nodes).childrenByParent) {
    byParent.set(
      parentId,
      children.map((node) => node.id)
    );
  }
  return byParent;
}

/** Child ids by `row.parentRowId` (container nesting and branch ownership), placeholders excluded. */
function projectedChildIds(projection: SequenceProjection): Map<string | undefined, string[]> {
  const byParent = new Map<string | undefined, string[]>();
  for (const row of projection.rows) {
    if (row.parentRowId === undefined || row.lanePlaceholder) continue;
    const bucket = byParent.get(row.parentRowId);
    if (bucket) bucket.push(row.nodeId);
    else byParent.set(row.parentRowId, [row.nodeId]);
  }
  return byParent;
}

/**
 * Reparents a node without changing its absolute flow position. React Flow stores
 * child positions relative to the parent, and `extent`/`expandParent` must not
 * outlive the relationship.
 */
function reparentNode(
  node: Node,
  parentId: string | undefined,
  nodesById: ReadonlyMap<string, Node>
): Node {
  const absolute = getAbsolutePosition(node, nodesById);
  const parent = parentId ? nodesById.get(parentId) : undefined;
  const parentAbsolute = parent ? getAbsolutePosition(parent, nodesById) : { x: 0, y: 0 };
  const next: Node = {
    ...node,
    position: {
      x: absolute.x - parentAbsolute.x,
      y: absolute.y - parentAbsolute.y,
    },
  };

  if (parentId === undefined) {
    delete next.parentId;
    if (next.extent === 'parent') delete next.extent;
    delete next.expandParent;
  } else {
    next.parentId = parentId;
    next.extent = 'parent';
  }
  return next;
}

/**
 * Remove a step with its descendants (structural children and projected lane rows) and
 * every raw edge touching them, healing only the step's own outer seam.
 * `graph.isSequenceEdge` keeps artifact/resource edges out of the heal cross-product.
 */
export function removeStep(
  projection: SequenceProjection,
  nodeId: string,
  graph: { nodes: Node[]; edges: Edge[]; isSequenceEdge?: (edge: Edge) => boolean }
): GraphChangeSet {
  const structuralDescendants = descendantsOf(structuralChildIds(graph.nodes), nodeId);
  const projectedDescendants = descendantsOf(projectedChildIds(projection), nodeId);
  const removeSet = new Set([nodeId, ...structuralDescendants, ...projectedDescendants]);
  const removesProjectedBranch = projectedDescendants.some(
    (id) => !structuralDescendants.includes(id)
  );
  const isSequenceEdge = graph.isSequenceEdge ?? (() => true);
  const incomers: Incomer[] = [];
  const outgoers: Outgoer[] = [];
  const removeEdgeIds = new Set<string>();
  for (const edge of graph.edges) {
    const sourceIn = removeSet.has(edge.source);
    const targetIn = removeSet.has(edge.target);
    if (!sourceIn && !targetIn) continue;
    removeEdgeIds.add(edge.id);
    if (!isSequenceEdge(edge)) continue;
    // Containers heal only their outer seam. Branch owners also drop their lane rows,
    // so the lane-tail -> merge boundary is their outgoing seam too.
    if (!sourceIn && targetIn && (edge.target === nodeId || removesProjectedBranch)) {
      incomers.push({
        source: edge.source,
        sourceHandle: edge.sourceHandle ?? undefined,
        edgeId: edge.id,
        continuation: isSequentialContinuationEdge(edge) || undefined,
      });
    }
    if (sourceIn && !targetIn && (edge.source === nodeId || removesProjectedBranch)) {
      outgoers.push({
        target: edge.target,
        targetHandle: edge.targetHandle ?? undefined,
        edgeId: edge.id,
      });
    }
  }

  return {
    addNodes: [],
    addEdges: healEdges(incomers, outgoers),
    removeNodeIds: [...removeSet],
    removeEdgeIds: [...removeEdgeIds],
  };
}

/** True when `containerId` is `ancestorId` or nested inside it via `parentRowId`. */
function isNestedContainer(
  projection: SequenceProjection,
  containerId: string,
  ancestorId: string
): boolean {
  if (containerId === ancestorId) return true;
  const rows = rowsById(projection);
  const seen = new Set<string>();
  let current = rows.get(containerId)?.parentRowId;
  while (current !== undefined && !seen.has(current)) {
    if (current === ancestorId) return true;
    seen.add(current);
    current = rows.get(current)?.parentRowId;
  }
  return false;
}

/**
 * Move a node with its whole subtree. Subtree content needs no cascade: children
 * follow `nodeId` via `parentId` and branch lanes via its own forward edges. With
 * `graph`, a cross-container move also reparents `nodeId` and any lane content that
 * shared its old `parentId` (branches never reparent on their own).
 * Known limitation: a body-tail edge closing back into its container (e.g. For Each
 * `continue`) is invisible here and is not relocated when the tail changes.
 */
export function moveSubtree(
  projection: SequenceProjection,
  nodeId: string,
  to: InsertionSlot,
  graph?: { nodes: Node[]; edges: Edge[] }
): GraphChangeSet {
  const { incomers, outgoers } = collectOwnSeam(projection, nodeId);
  const ownSeamEdgeIds = new Set<string>([
    ...incomers.map((i) => i.edgeId),
    ...outgoers.map((o) => o.edgeId),
  ]);

  // Moving onto its own seam or anywhere inside its own projected subtree; no-op.
  const targetsSelfOrOwnSubtree =
    to.source?.nodeId === nodeId ||
    to.target?.nodeId === nodeId ||
    (to.graphEdgeId !== undefined && ownSeamEdgeIds.has(to.graphEdgeId)) ||
    (to.containerId !== undefined && isNestedContainer(projection, to.containerId, nodeId)) ||
    (to.source !== undefined && isNestedContainer(projection, to.source.nodeId, nodeId)) ||
    (to.target !== undefined && isNestedContainer(projection, to.target.nodeId, nodeId));
  if (targetsSelfOrOwnSubtree) return EMPTY_CHANGE_SET;

  const removeEdgeIds = new Set<string>(ownSeamEdgeIds);
  if (to.graphEdgeId) removeEdgeIds.add(to.graphEdgeId);

  const addEdges = healEdges(incomers, outgoers, nodeId);
  const seen = new Set(addEdges.map((edge) => edge.id));
  for (const edge of edgesForSlot(to, nodeId)) {
    if (!seen.has(edge.id)) {
      seen.add(edge.id);
      addEdges.push(edge);
    }
  }

  const removeNodeIds: string[] = [];
  const addNodes: Node[] = [];
  if (graph) {
    const { nodesById } = indexNodesByParent(graph.nodes);
    const rawNode = nodesById.get(nodeId);
    if (rawNode && rawNode.parentId !== to.containerId) {
      const oldParentId = rawNode.parentId;
      removeNodeIds.push(nodeId);
      addNodes.push(reparentNode(rawNode, to.containerId, nodesById));

      // Lane content sharing the old parentId travels with nodeId; a container-child
      // (parentId === nodeId) already follows it.
      for (const descendantId of descendantsOf(projectedChildIds(projection), nodeId)) {
        const rawDescendant = nodesById.get(descendantId);
        if (rawDescendant && rawDescendant.parentId === oldParentId) {
          removeNodeIds.push(descendantId);
          addNodes.push(reparentNode(rawDescendant, to.containerId, nodesById));
        }
      }
    }
  }

  return { addNodes, addEdges, removeNodeIds, removeEdgeIds: [...removeEdgeIds] };
}
