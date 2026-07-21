import type { Edge, EdgeChange, Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import { PREVIEW_NODE_ID } from '../../constants';
import { isPreviewEdge } from '../../utils/createPreviewNode';
import type { GraphChangeSet } from '../../utils/sequential/sequential.types';
import { SEQ_INSERTED_FLAG, SEQ_SPLIT_EDGE_ID_KEY } from './edges/sequentialInsert';
import { SEQ_CONNECTOR_EDGE_TYPE } from './sequentialGraph.constants';

/**
 * Change filtering is the robust guarantee that the sequential view never
 * corrupts canonical state (seam 2). In the sequential view the nodes/edges
 * handed to ReactFlow are DERIVED clones + connector edges, not the canonical
 * graph. ReactFlow (in controlled mode) reports every store mutation through
 * onNodesChange / onEdgesChange as diff changes — including position and
 * dimension changes the derivation owns, and the Add Node pipeline's collision
 * pass nudging clones. Forwarding those verbatim would overwrite the consumer's
 * canonical positions/geometry with view-only values.
 *
 * These pure functions translate the derived-view change stream into the subset
 * that is meaningful for canonical state:
 *  - position + dimension changes are DROPPED (the derivation owns geometry);
 *  - changes referencing synthetic rows (start bar, placeholder, preview) are
 *    DROPPED (they never exist in canonical state);
 *  - a `replace` on a real node (e.g. an inline rename via updateNodeData) is
 *    rewritten to merge only `data` + `selected` onto the CANONICAL node, so the
 *    clone's view geometry (type / position / width / draggable) can't leak;
 *  - `select` and `remove` on real nodes/edges pass through;
 *  - an insert's added node (stamped `seqInserted`) and its healed real edges
 *    pass through, and the canonical edge the insert split is removed.
 */

function nodeChangeId<N extends Node>(change: NodeChange<N>): string | undefined {
  return change.type === 'add' ? change.item.id : change.id;
}

function isInsertedNode<N extends Node>(node: N): boolean {
  return (node.data as Record<string, unknown> | undefined)?.[SEQ_INSERTED_FLAG] === true;
}

/** Filters/translates node changes from the derived view for the consumer's canonical state. */
export function forwardSequentialNodeChanges<N extends Node>(
  changes: NodeChange<N>[],
  syntheticIds: ReadonlySet<string>,
  canonicalById: ReadonlyMap<string, N>
): NodeChange<N>[] {
  const out: NodeChange<N>[] = [];

  for (const change of changes) {
    const id = nodeChangeId(change);
    if (id !== undefined && (id === PREVIEW_NODE_ID || syntheticIds.has(id))) {
      continue;
    }

    switch (change.type) {
      case 'add':
        // Only a genuinely inserted node (seqInserted) reaches canonical here;
        // any other add is a derivation/preview artifact.
        if (isInsertedNode(change.item)) out.push(change);
        break;
      case 'remove':
      case 'select':
        out.push(change);
        break;
      case 'replace': {
        const canonical = canonicalById.get(change.id);
        if (!canonical) break;
        out.push({
          type: 'replace',
          id: change.id,
          item: { ...canonical, data: change.item.data, selected: change.item.selected },
        });
        break;
      }
      // Derivation owns positions and bar dimensions; never forward them.
      default:
        break;
    }
  }

  return out;
}

function isForwardableEdgeAdd<E extends Edge>(edge: E): boolean {
  return !isPreviewEdge(edge) && edge.type !== SEQ_CONNECTOR_EDGE_TYPE;
}

function splitEdgeId(edge: Edge): string | undefined {
  const value = (edge.data as Record<string, unknown> | undefined)?.[SEQ_SPLIT_EDGE_ID_KEY];
  return typeof value === 'string' ? value : undefined;
}

function withoutSplitMarker<E extends Edge>(edge: E): E {
  if (!splitEdgeId(edge)) return edge;
  const { [SEQ_SPLIT_EDGE_ID_KEY]: _marker, ...data } = edge.data as Record<string, unknown>;
  return { ...edge, data };
}

/**
 * Canonical edges shadowed by an insert: when a new node is spliced between S and
 * T, the pipeline adds S->new and new->T, so the pivot node is the id that is
 * both a target and a source among the added edges. Any pre-existing canonical
 * edge S->T is now redundant and must be removed.
 */
function findShadowedCanonicalEdgeIds<E extends Edge>(
  addedEdges: E[],
  canonicalEdges: readonly E[]
): string[] {
  const targetsOf = new Map<string, Array<{ nodeId: string; handleId?: string | null }>>();
  const sourcesOf = new Map<string, Array<{ nodeId: string; handleId?: string | null }>>();
  for (const edge of addedEdges) {
    const incoming = targetsOf.get(edge.target) ?? [];
    incoming.push({ nodeId: edge.source, handleId: edge.sourceHandle });
    targetsOf.set(edge.target, incoming);
    const outgoing = sourcesOf.get(edge.source) ?? [];
    outgoing.push({ nodeId: edge.target, handleId: edge.targetHandle });
    sourcesOf.set(edge.source, outgoing);
  }

  const shadowed = new Set<string>();
  for (const [pivot, incomingSources] of targetsOf) {
    const outgoingTargets = sourcesOf.get(pivot);
    if (!outgoingTargets) continue;
    for (const source of incomingSources) {
      for (const target of outgoingTargets) {
        for (const edge of canonicalEdges) {
          if (
            edge.source === source.nodeId &&
            edge.target === target.nodeId &&
            (edge.sourceHandle ?? undefined) === (source.handleId ?? undefined) &&
            (edge.targetHandle ?? undefined) === (target.handleId ?? undefined)
          ) {
            shadowed.add(edge.id);
          }
        }
      }
    }
  }
  return [...shadowed];
}

/** Filters/translates edge changes from the derived view for the consumer's canonical state. */
export function forwardSequentialEdgeChanges<E extends Edge>(
  changes: EdgeChange<E>[],
  canonicalEdgeIds: ReadonlySet<string>,
  canonicalEdges: readonly E[]
): EdgeChange<E>[] {
  const out: EdgeChange<E>[] = [];
  const addedEdges: E[] = [];
  const exactSplitEdgeIds = new Set<string>();

  for (const change of changes) {
    switch (change.type) {
      case 'add':
        if (isForwardableEdgeAdd(change.item)) {
          const splitId = splitEdgeId(change.item);
          if (splitId) exactSplitEdgeIds.add(splitId);
          const item = withoutSplitMarker(change.item);
          out.push({ ...change, item });
          addedEdges.push(item);
        }
        break;
      case 'remove':
      case 'select':
        if (canonicalEdgeIds.has(change.id)) out.push(change);
        break;
      // Connector `data` replaces are view-only; canonical edges are not replaced
      // through the view.
      default:
        break;
    }
  }

  if (addedEdges.length > 0) {
    const removedIds = new Set(
      out.filter((change) => change.type === 'remove').map((change) => change.id)
    );
    // A pending insertion carries the exact canonical edge id. Do not also run
    // topology inference in that case: two parallel edges can legitimately
    // have identical endpoints and handles, and inference would remove both.
    const shadowedIds =
      exactSplitEdgeIds.size > 0
        ? exactSplitEdgeIds
        : new Set(findShadowedCanonicalEdgeIds(addedEdges, canonicalEdges));
    for (const id of shadowedIds) {
      if (!removedIds.has(id)) out.push({ type: 'remove', id });
    }
  }

  return out;
}

/**
 * Converts a {@link GraphChangeSet} (the tree move operations -- see
 * `sequentialMoveActions.ts` / `SequentialMoveActionsContext.tsx`) into
 * `NodeChange[]` for the CANONICAL `onNodesChange` callback (D10: the public
 * API stays the standard change stream).
 *
 * Unlike `forwardSequentialNodeChanges` above, these two functions do NOT
 * translate the derived VIEW's own xyflow-emitted changes (that seam exists
 * to strip view-only geometry off a DERIVED clone). A move's `GraphChangeSet`
 * is built directly from `moveSubtree` over the CANONICAL `{nodes, edges}`
 * (see `mutations.ts`), so every node/edge here already has the real shape --
 * routing it through the clone-stripping translator would be wrong (that
 * translator's own `replace` case deliberately drops `parentId`, which is
 * exactly the field a cross-container move needs to carry). `moveSubtree`
 * expresses "this node's parentId changed" as a paired remove+add (same id in
 * both `removeNodeIds` and `addNodes`); that pairing is rewritten here as a
 * `replace` so xyflow updates the existing node in place instead of a
 * remove/re-add flicker. A genuinely new id in `addNodes` (never happens for
 * a move today, since moves never create nodes) still round-trips correctly
 * as a plain `add`.
 */
export function graphChangeSetToNodeChanges<N extends Node>(
  changeSet: GraphChangeSet
): NodeChange<N>[] {
  const removedIds = new Set(changeSet.removeNodeIds);
  const changes: NodeChange<N>[] = [];

  for (const node of changeSet.addNodes) {
    if (removedIds.has(node.id)) {
      changes.push({ type: 'replace', id: node.id, item: node as N });
    } else {
      changes.push({ type: 'add', item: node as N });
    }
  }

  const replacedIds = new Set(changeSet.addNodes.map((node) => node.id));
  for (const id of changeSet.removeNodeIds) {
    if (!replacedIds.has(id)) changes.push({ type: 'remove', id });
  }

  return changes;
}

/** Edge half of {@link graphChangeSetToNodeChanges}: a plain add/remove translation. */
export function graphChangeSetToEdgeChanges<E extends Edge>(
  changeSet: GraphChangeSet
): EdgeChange<E>[] {
  const changes: EdgeChange<E>[] = changeSet.removeEdgeIds.map((id) => ({
    type: 'remove' as const,
    id,
  }));
  for (const edge of changeSet.addEdges) {
    changes.push({ type: 'add', item: edge as E });
  }
  return changes;
}
