import type { Edge, EdgeChange, Node, NodeChange } from '@uipath/apollo-react/canvas/xyflow/react';
import { PREVIEW_NODE_ID } from '../../constants';
import { isPreviewEdge } from '../../utils/createPreviewNode';
import type { GraphChangeSet } from '../../utils/sequential/sequential.types';
import { isSequentialInsertedNode, SEQ_SPLIT_EDGE_ID_KEY } from './edges/sequentialInsert';
import { SEQ_CONNECTOR_EDGE_TYPE } from './sequentialGraph.constants';

/**
 * Translates the derived view's xyflow change stream into what canonical state may see.
 * In controlled mode ReactFlow reports every store mutation, including position and
 * dimension changes the derivation owns; forwarding those verbatim would overwrite the
 * consumer's canonical geometry with view-only values.
 */

export function nodeChangeId<N extends Node>(change: NodeChange<N>): string | undefined {
  return change.type === 'add' ? change.item.id : change.id;
}

/**
 * Node changes for canonical state: geometry and synthetic-row changes are dropped, a
 * `replace` merges only `data` + `selected` onto the canonical node, `select` / `remove` and
 * inserted (`seqInserted`) nodes pass through.
 */
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
        if (isSequentialInsertedNode(change.item)) out.push(change);
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
          item: {
            ...canonical,
            data: change.item.data,
            // A replace built without `selected` must not deselect the node by omission.
            selected: change.item.selected ?? canonical.selected,
          },
        });
        break;
      }
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
 * Canonical edges made redundant by an insert: the pivot is the id that is both a target and
 * a source among the added edges, and any canonical S->T across it must be removed.
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

/**
 * Edge changes for canonical state: preview and connector edges are dropped, `select` /
 * `remove` on canonical edges pass through, and the edge an insert split is removed.
 */
export function forwardSequentialEdgeChanges<E extends Edge>(
  changes: EdgeChange<E>[],
  canonicalEdges: readonly E[]
): EdgeChange<E>[] {
  const canonicalEdgeIds = new Set(canonicalEdges.map((edge) => edge.id));
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
      default:
        break;
    }
  }

  if (addedEdges.length > 0) {
    const removedIds = new Set(
      out.filter((change) => change.type === 'remove').map((change) => change.id)
    );
    // Prefer the exact split edge id over topology inference: two parallel edges can share
    // endpoints and handles, and inference would remove both.
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
 * Converts a {@link GraphChangeSet} into canonical `NodeChange[]`. The set is built over the
 * canonical graph, so it must not go through `forwardSequentialNodeChanges` (whose `replace`
 * drops `parentId`). A paired remove+add of one id becomes a `replace` to avoid a flicker.
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
