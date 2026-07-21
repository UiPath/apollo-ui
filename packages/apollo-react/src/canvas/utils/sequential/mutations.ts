import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import type {
  GraphChangeSet,
  InsertionSlot,
  SequenceConnector,
  SequenceProjection,
} from './sequential.types';

/**
 * Pure mutation ops as the internal semantic core (D10). Each returns a
 * {@link GraphChangeSet} the caller applies through the standard onNodesChange /
 * onEdgesChange callbacks; there is no parallel mutation channel.
 *
 * Edge ids follow the AddNodeManager convention
 * (`edge_${source}-${sourceHandle}-${target}-${targetHandle}`, AddNodePanel.tsx)
 * so inserts made here are indistinguishable from pipeline inserts. `insertAtSlot`
 * and `moveStep` read only the projection's connectors (which carry the split
 * edge id + endpoints on their slot), so they stay pure and never touch xyflow
 * state. `removeStep` does too UNLESS the node being removed is a container, in
 * which case the projection's connectors are not enough to cascade correctly
 * (see its own doc comment) and it accepts the raw graph as an optional third
 * argument.
 */

function makeEdge(
  source: string,
  sourceHandle: string | undefined,
  target: string,
  targetHandle: string | undefined
): Edge {
  return {
    id: `edge_${source}-${sourceHandle ?? ''}-${target}-${targetHandle ?? ''}`,
    source,
    target,
    sourceHandle: sourceHandle ?? undefined,
    targetHandle: targetHandle ?? undefined,
    type: 'default',
  };
}

interface Incomer {
  source: string;
  sourceHandle?: string;
  edgeId: string;
}
interface Outgoer {
  target: string;
  targetHandle?: string;
  edgeId: string;
}

/**
 * Reconstructs a node's real incoming/outgoing sequence edges from the
 * projection's slot-bearing connectors (`step` / `branch-entry`). merge-back and
 * goto connectors carry no slot, so degenerate joins are intentionally ignored.
 */
function collectSeam(
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
      });
    }
    if (connector.sourceRowId === nodeId) {
      outgoers.push({
        target: connector.slot?.target?.nodeId ?? connector.targetRowId,
        targetHandle: connector.slot?.target?.handleId,
        edgeId,
      });
    }
  }
  return { incomers, outgoers };
}

/** Splice a new node into the graph at the given insertion slot. */
export function insertAtSlot(
  _projection: SequenceProjection,
  slot: InsertionSlot,
  newNode: Node
): GraphChangeSet {
  const node = slot.containerId ? { ...newNode, parentId: slot.containerId } : newNode;
  const addEdges: Edge[] = [];

  if (slot.graphEdgeId && slot.source && slot.target) {
    // Splitting an existing edge: it is removed and re-formed around the node.
    addEdges.push(makeEdge(slot.source.nodeId, slot.source.handleId, node.id, undefined));
    addEdges.push(makeEdge(node.id, undefined, slot.target.nodeId, slot.target.handleId));
    return { addNodes: [node], addEdges, removeNodeIds: [], removeEdgeIds: [slot.graphEdgeId] };
  }
  if (slot.source) {
    addEdges.push(makeEdge(slot.source.nodeId, slot.source.handleId, node.id, undefined));
  } else if (slot.target) {
    addEdges.push(makeEdge(node.id, undefined, slot.target.nodeId, slot.target.handleId));
  }
  return { addNodes: [node], addEdges, removeNodeIds: [], removeEdgeIds: [] };
}

function healEdges(incomers: Incomer[], outgoers: Outgoer[]): Edge[] {
  const addEdges: Edge[] = [];
  const seen = new Set<string>();
  for (const incomer of incomers) {
    for (const outgoer of outgoers) {
      // Removing a branch that closes back to its owning loop/container can
      // put the same owner on both sides of the seam. Healing that boundary
      // would create a meaningless owner -> owner self-loop; the correct
      // result is an empty body that remains insertable through projection.
      if (incomer.source === outgoer.target) continue;
      const edge = makeEdge(
        incomer.source,
        incomer.sourceHandle,
        outgoer.target,
        outgoer.targetHandle
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
 * Any connector with a slot whose target is `nodeId`: its true incoming seam
 * edge, regardless of kind. `branch-entry` needs no exclusion here (unlike
 * {@link ownOutgoingConnector}) because a node can never be the target of its
 * OWN branch-entry connector (projectSequence always sources those at the
 * owner, see below).
 */
export function ownIncomingConnector(
  projection: SequenceProjection,
  nodeId: string
): SequenceConnector | undefined {
  return projection.connectors.find((c) => c.targetRowId === nodeId && c.slot);
}

/**
 * The connector representing `nodeId`'s own genuine next step, excluding
 * `branch-entry`: projectSequence's walkContainerBody/walkBranch always emit a
 * `branch-entry` connector SOURCED AT the container/branch owner into its own
 * body/lane, never a real forward step to a sibling or the enclosing scope.
 * Plain `collectSeam` (used by leaf-only `moveStep`) does not apply this
 * exclusion, which is exactly why a container/branch owner needs
 * {@link collectOwnSeam} instead - see `moveSubtree`'s doc comment.
 */
export function ownOutgoingConnector(
  projection: SequenceProjection,
  nodeId: string
): SequenceConnector | undefined {
  return projection.connectors.find(
    (c) => c.sourceRowId === nodeId && c.kind !== 'branch-entry' && c.slot
  );
}

/**
 * Like {@link collectSeam}, but safe for a node that may itself own a
 * body/branch (a container, or a branch source): see {@link ownOutgoingConnector}.
 */
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

/**
 * Every node's id transitively owned by `rootId` in the PROJECTED tree (via
 * `SequenceRow.parentRowId`, which covers both container nesting AND branch
 * ownership - see graph-helpers.ts's dual nesting model), as opposed to
 * {@link collectDescendantIds}'s pure `node.parentId` walk. A branch owner's
 * lane content shares the owner's OWN `parentId` (branches never reparent),
 * so this is the set `moveSubtree` must consider for a possible `parentId`
 * rewrite when the owner itself crosses a container boundary.
 */
function collectProjectedDescendantIds(projection: SequenceProjection, rootId: string): string[] {
  const childRowIds = new Map<string, string[]>();
  for (const row of projection.rows) {
    if (row.parentRowId === undefined || row.lanePlaceholder) continue;
    const bucket = childRowIds.get(row.parentRowId);
    if (bucket) bucket.push(row.nodeId);
    else childRowIds.set(row.parentRowId, [row.nodeId]);
  }
  const result: string[] = [];
  const stack = [...(childRowIds.get(rootId) ?? [])];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    result.push(id);
    stack.push(...(childRowIds.get(id) ?? []));
  }
  return result;
}

/** A shallow clone of `node` with `parentId` set to `parentId`, or removed entirely when `undefined`. */
function withParentId(node: Node, parentId: string | undefined): Node {
  const next: Node = { ...node };
  if (parentId === undefined) {
    delete next.parentId;
  } else {
    next.parentId = parentId;
  }
  return next;
}

/** Every node's id transitively nested under `containerId` via `node.parentId`. */
function collectDescendantIds(nodes: Node[], containerId: string): string[] {
  const childrenByParent = new Map<string, string[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const bucket = childrenByParent.get(node.parentId);
    if (bucket) bucket.push(node.id);
    else childrenByParent.set(node.parentId, [node.id]);
  }
  const result: string[] = [];
  const stack = [...(childrenByParent.get(containerId) ?? [])];
  while (stack.length > 0) {
    const id = stack.pop() as string;
    result.push(id);
    stack.push(...(childrenByParent.get(id) ?? []));
  }
  return result;
}

/**
 * Remove a step and heal the seam so the sequence stays connected.
 *
 * The projection's connectors alone are not enough to remove a CONTAINER
 * correctly: they omit the container's descendants entirely, and they never
 * carry a raw edge that `forwardOut` filtered out of the forward walk (e.g. a
 * loop body's container-closing "continue" edge) — deleting only the
 * container would leave descendants with a `parentId` pointing at nothing and
 * strand those edges. Passing the optional `graph` (the canonical raw
 * nodes/edges the host already holds) lets `removeStep` cascade correctly:
 * every descendant is removed, every raw edge with an endpoint inside
 * `{nodeId} ∪ descendants` is removed, and only the container's OWN
 * incomer/outgoer seam — never a body-internal edge — is healed. Without
 * `graph`, the op keeps its original single-node behavior (backward
 * compatible with existing 2-argument callers), so callers must not point it
 * at a container unless they supply `graph`.
 */
export function removeStep(
  projection: SequenceProjection,
  nodeId: string,
  graph?: { nodes: Node[]; edges: Edge[] }
): GraphChangeSet {
  if (!graph) {
    const { incomers, outgoers } = collectSeam(projection, nodeId);
    const removeEdgeIds = [
      ...new Set([...incomers.map((i) => i.edgeId), ...outgoers.map((o) => o.edgeId)]),
    ];
    return {
      addNodes: [],
      addEdges: healEdges(incomers, outgoers),
      removeNodeIds: [nodeId],
      removeEdgeIds,
    };
  }

  const structuralDescendants = collectDescendantIds(graph.nodes, nodeId);
  const projectedDescendants = collectProjectedDescendantIds(projection, nodeId);
  const removeSet = new Set([nodeId, ...structuralDescendants, ...projectedDescendants]);
  const removesProjectedBranch = projectedDescendants.some(
    (id) => !structuralDescendants.includes(id)
  );
  const incomers: Incomer[] = [];
  const outgoers: Outgoer[] = [];
  const removeEdgeIds = new Set<string>();
  for (const edge of graph.edges) {
    const sourceIn = removeSet.has(edge.source);
    const targetIn = removeSet.has(edge.target);
    if (!sourceIn && !targetIn) continue;
    removeEdgeIds.add(edge.id);
    // Containers heal only their own outer seam. Branch owners also remove
    // their projected lane rows, so the lane-tail -> merge boundary is their
    // semantic outgoing seam and must be healed too.
    if (!sourceIn && targetIn && (edge.target === nodeId || removesProjectedBranch)) {
      incomers.push({
        source: edge.source,
        sourceHandle: edge.sourceHandle ?? undefined,
        edgeId: edge.id,
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

/**
 * True when `containerId` is `ancestorId` itself or is structurally nested
 * inside it, walking the projection's `parentRowId` chain (container/branch
 * ownership; see the module-level moveStep guard). Reused by `moveSubtree`'s
 * self-subtree guard for THREE different candidates (a target slot's
 * `containerId`, `source.nodeId`, and `target.nodeId`), since any of them
 * landing inside the moved node's own subtree is equally a degenerate move.
 */
function isNestedContainer(
  projection: SequenceProjection,
  containerId: string,
  ancestorId: string
): boolean {
  if (containerId === ancestorId) return true;
  const rowsById = new Map(projection.rows.map((row) => [row.nodeId, row]));
  const seen = new Set<string>();
  let current = rowsById.get(containerId)?.parentRowId;
  while (current !== undefined && !seen.has(current)) {
    if (current === ancestorId) return true;
    seen.add(current);
    current = rowsById.get(current)?.parentRowId;
  }
  return false;
}

/**
 * Move a step to a different slot (unlocks kebab "Move up/down" in v1.5). Heals
 * the old seam and splices the node into the target slot by rewiring edges only.
 * The node object is not re-created, so a cross-container move does not update
 * `parentId` here; v1.5 reorder stays within a lane where `parentId` is stable.
 *
 * Delegates entirely to {@link moveSubtree} whenever `nodeId`'s row is
 * `collapsible` (a container or branch owner, per `SequenceRow.collapsible`),
 * `graph` included: plain `collectSeam` would otherwise misidentify that
 * node's OWN `branch-entry` connector (its own body/branch entry) as a real
 * external outgoer and corrupt the container/branch on splice - see
 * `moveSubtree`'s doc comment. This delegation does not depend on whether
 * `graph` is supplied: the seam fix is needed either way, `graph` only
 * additionally lets a cross-container move correct `parentId`. For leaf nodes
 * the two ops are equivalent (no `branch-entry` connector is ever sourced at a
 * leaf), so this changes nothing for existing leaf-only callers/tests.
 *
 * The VIEW layer's four tree operations (move up/down, indent, outdent)
 * should call `moveSubtree` directly with `graph`, not this function: even a
 * plain leaf crosses a container boundary on indent/outdent, and only
 * `moveSubtree` updates `parentId`.
 */
export function moveStep(
  projection: SequenceProjection,
  nodeId: string,
  to: InsertionSlot,
  graph?: { nodes: Node[]; edges: Edge[] }
): GraphChangeSet {
  const row = projection.rows.find((r) => r.nodeId === nodeId);
  if (row?.collapsible) {
    return moveSubtree(projection, nodeId, to, graph);
  }

  const { incomers, outgoers } = collectSeam(projection, nodeId);
  const ownSeamEdgeIds = new Set<string>([
    ...incomers.map((i) => i.edgeId),
    ...outgoers.map((o) => o.edgeId),
  ]);

  // A degenerate "move to where it already is" (e.g. Move Up at the top of a
  // lane targets the node's own incoming edge), or a container moved into a
  // slot inside its own subtree, would splice a self-loop and orphan the
  // node's real neighbor. No-op instead of corrupting the graph.
  const targetsSelf =
    to.source?.nodeId === nodeId ||
    to.target?.nodeId === nodeId ||
    (to.graphEdgeId !== undefined && ownSeamEdgeIds.has(to.graphEdgeId)) ||
    (to.containerId !== undefined && isNestedContainer(projection, to.containerId, nodeId));
  if (targetsSelf) {
    return { addNodes: [], addEdges: [], removeNodeIds: [], removeEdgeIds: [] };
  }

  const removeEdgeIds = new Set<string>(ownSeamEdgeIds);
  if (to.graphEdgeId) removeEdgeIds.add(to.graphEdgeId);

  const addEdges: Edge[] = [];
  const seen = new Set<string>();
  const pushEdge = (edge: Edge): void => {
    if (!seen.has(edge.id)) {
      seen.add(edge.id);
      addEdges.push(edge);
    }
  };

  for (const incomer of incomers) {
    for (const outgoer of outgoers) {
      if (incomer.source === nodeId || outgoer.target === nodeId) continue;
      pushEdge(
        makeEdge(incomer.source, incomer.sourceHandle, outgoer.target, outgoer.targetHandle)
      );
    }
  }

  if (to.source && to.target && to.graphEdgeId) {
    pushEdge(makeEdge(to.source.nodeId, to.source.handleId, nodeId, undefined));
    pushEdge(makeEdge(nodeId, undefined, to.target.nodeId, to.target.handleId));
  } else if (to.source) {
    pushEdge(makeEdge(to.source.nodeId, to.source.handleId, nodeId, undefined));
  } else if (to.target) {
    pushEdge(makeEdge(nodeId, undefined, to.target.nodeId, to.target.handleId));
  }

  return { addNodes: [], addEdges, removeNodeIds: [], removeEdgeIds: [...removeEdgeIds] };
}

/**
 * Move a container or branch owner WITH its entire subtree as a single unit
 * (file-explorer-like tree move; the four view-layer operations - move
 * up/down, indent, outdent - should all call this directly, with `graph`).
 *
 * No cascade is needed for the subtree's CONTENT, unlike `removeStep`: every
 * descendant is reached purely through edges this op never touches. A
 * container's children keep pointing at `nodeId` by id via `parentId`, which
 * stays valid regardless of where the container node itself relocates. A
 * branch owner's lanes stay wired via its own untouched forward edges (e.g.
 * `if.true -> thenNode`), which simply follow `nodeId` wherever it moves. The
 * op only has to get `nodeId`'s OWN seam right, which is exactly what
 * {@link collectOwnSeam} does (excluding its own `branch-entry` connectors,
 * unlike plain `collectSeam`) - see `moveStep`'s doc comment for why this
 * matters.
 *
 * ONE thing edges alone cannot carry: a branch owner's lane content shares
 * the OWNER's OWN `parentId` (branches never reparent - see graph-helpers.ts's
 * dual nesting model), so if `nodeId` itself crosses a container boundary
 * (its `parentId` changes), any descendant that shared `nodeId`'s OLD
 * `parentId` must be rewritten to `nodeId`'s NEW one too, or it is silently
 * left behind in the old container. A genuine container-child of `nodeId`
 * (`parentId === nodeId`) needs no such rewrite: its `parentId` still points
 * at the same (unchanged) id wherever `nodeId` now lives. Both the `parentId`
 * rewrite and the fix above require the raw `graph` (a `Node`'s full shape
 * cannot be reconstructed from the projection alone); without it, `nodeId`'s
 * `parentId` is left untouched, matching `moveStep`'s existing documented
 * limitation.
 *
 * KNOWN LIMITATION: a container idiom where a body's tail closes the loop via
 * an edge back into the container itself (e.g. For Each's `continue` handle)
 * is invisible to this layer - `forwardOut` filters it out of every walk (see
 * `removeStep`'s doc comment), so it is never part of any seam this op
 * computes, and is left untouched pointing at whichever node was the body's
 * tail BEFORE the move. Callers whose container manifests use that
 * convention are responsible for relocating such an edge themselves after an
 * indent/outdent that changes which node is the body's last step.
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

  // Extends moveStep's self-loop guard: a target referencing `nodeId` itself,
  // one of its own seam edges, or ANY location inside its own projected
  // subtree (container OR branch-lane content - `isNestedContainer` walks
  // `parentRowId`, which covers both) would splice `nodeId` into its own
  // body. No-op instead of corrupting the graph.
  const targetsSelfOrOwnSubtree =
    to.source?.nodeId === nodeId ||
    to.target?.nodeId === nodeId ||
    (to.graphEdgeId !== undefined && ownSeamEdgeIds.has(to.graphEdgeId)) ||
    (to.containerId !== undefined && isNestedContainer(projection, to.containerId, nodeId)) ||
    (to.source !== undefined && isNestedContainer(projection, to.source.nodeId, nodeId)) ||
    (to.target !== undefined && isNestedContainer(projection, to.target.nodeId, nodeId));
  if (targetsSelfOrOwnSubtree) {
    return { addNodes: [], addEdges: [], removeNodeIds: [], removeEdgeIds: [] };
  }

  const removeEdgeIds = new Set<string>(ownSeamEdgeIds);
  if (to.graphEdgeId) removeEdgeIds.add(to.graphEdgeId);

  const addEdges: Edge[] = [];
  const seen = new Set<string>();
  const pushEdge = (edge: Edge): void => {
    if (!seen.has(edge.id)) {
      seen.add(edge.id);
      addEdges.push(edge);
    }
  };

  for (const incomer of incomers) {
    for (const outgoer of outgoers) {
      if (incomer.source === nodeId || outgoer.target === nodeId) continue;
      pushEdge(
        makeEdge(incomer.source, incomer.sourceHandle, outgoer.target, outgoer.targetHandle)
      );
    }
  }

  if (to.source && to.target && to.graphEdgeId) {
    pushEdge(makeEdge(to.source.nodeId, to.source.handleId, nodeId, undefined));
    pushEdge(makeEdge(nodeId, undefined, to.target.nodeId, to.target.handleId));
  } else if (to.source) {
    pushEdge(makeEdge(to.source.nodeId, to.source.handleId, nodeId, undefined));
  } else if (to.target) {
    pushEdge(makeEdge(nodeId, undefined, to.target.nodeId, to.target.handleId));
  }

  const removeNodeIds: string[] = [];
  const addNodes: Node[] = [];
  if (graph) {
    const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
    const rawNode = nodesById.get(nodeId);
    if (rawNode && rawNode.parentId !== to.containerId) {
      const oldParentId = rawNode.parentId;
      removeNodeIds.push(nodeId);
      addNodes.push(withParentId(rawNode, to.containerId));

      // Branch-lane content shares nodeId's OLD parentId (it has none of its
      // own distinct from its owner); it must travel with nodeId. A genuine
      // container-child of nodeId (parentId === nodeId, untouched here) is
      // already correctly nested regardless of where nodeId now lives.
      for (const descendantId of collectProjectedDescendantIds(projection, nodeId)) {
        const rawDescendant = nodesById.get(descendantId);
        if (rawDescendant && rawDescendant.parentId === oldParentId) {
          removeNodeIds.push(descendantId);
          addNodes.push(withParentId(rawDescendant, to.containerId));
        }
      }
    }
  }

  return { addNodes, addEdges, removeNodeIds, removeEdgeIds: [...removeEdgeIds] };
}
