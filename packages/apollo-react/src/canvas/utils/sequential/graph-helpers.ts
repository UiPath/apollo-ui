import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_SOURCE_HANDLE_ID, PREVIEW_NODE_ID } from '../../constants';
import type { SequenceProjection, SequenceRow } from './sequential.types';

/**
 * Internal graph helpers for the projection, merge analysis and layout passes. Not
 * part of the public API. The engine has no registry access: nesting is structural,
 * via `node.parentId` (containers) or more than one in-scope forward edge (branches).
 */

/** Loop-closure target handle; consumed as loop closure, never a cycle. */
export const LOOP_BACK_HANDLE_ID = 'loopBack';

/**
 * Edge-data marker for a continuation through an inserted node, so a downstream edge
 * is not reinterpreted as one of the new node's own lanes.
 */
export const SEQ_CONTINUATION_EDGE_KEY = '__sequentialContinuation';

export function isSequentialContinuationEdge(edge: Edge): boolean {
  return (edge.data as Record<string, unknown> | undefined)?.[SEQ_CONTINUATION_EDGE_KEY] === true;
}

/** Prefix for synthetic placeholder node ids. These rows never appear in canonical state. */
export const SEQ_LANE_PLACEHOLDER_PREFIX = '__sequential-lane__';
/** Deterministic id for a parent node's empty-lane placeholder on a given handle. */
export const lanePlaceholderId = (parentId: string, handleId: string): string =>
  `${SEQ_LANE_PLACEHOLDER_PREFIX}${parentId}::${handleId}`;
/** Deterministic id for the append placeholder after a populated branch tail. */
export const leafPlaceholderId = (leafId: string): string =>
  `${SEQ_LANE_PLACEHOLDER_PREFIX}${leafId}::__tail__`;

/** A scope is the `parentId` of the nodes being walked (`undefined` = top level). */
export type Scope = string | undefined;

export interface GraphIndex {
  nodesById: Map<string, Node>;
  /** parentId (or `undefined` for top level) -> child nodes, in input order. */
  childrenByParent: Map<Scope, Node[]>;
  /** Sequence edges only: non-preview and passing `isSequenceEdge`. Retains loopBack. */
  seqEdges: Edge[];
  /** Sequence edges bucketed by source id, input order preserved. */
  seqEdgesBySource: Map<string, Edge[]>;
  /** Cache of in-degree maps per scope (sibling-forward edges, loopBack excluded). */
  inDegreeCache: Map<Scope, Map<string, number>>;
}

/** True for loop-closure edges (target handle `loopBack`); excluded from forward walks. */
export function isLoopBackEdge(edge: Edge): boolean {
  return edge.targetHandle === LOOP_BACK_HANDLE_ID;
}

/** Default predicate: every non-preview edge. Registry-aware callers exclude artifact handles. */
export function defaultIsSequenceEdge(edge: Edge): boolean {
  return edge.source !== PREVIEW_NODE_ID && edge.target !== PREVIEW_NODE_ID;
}

export function buildGraphIndex(
  nodes: Node[],
  edges: Edge[],
  isSequenceEdge: (edge: Edge) => boolean
): GraphIndex {
  const { nodesById, childrenByParent } = indexNodesByParent(nodes);

  const seqEdges: Edge[] = [];
  const seqEdgesBySource = new Map<string, Edge[]>();
  const seenEndpoints = new Set<string>();
  for (const edge of edges) {
    if (edge.source === PREVIEW_NODE_ID || edge.target === PREVIEW_NODE_ID) continue;
    if (!isSequenceEdge(edge)) continue;
    // Duplicate wiring is one step, not two lanes. First edge wins; compatibility
    // reports the rest.
    const endpointKey = duplicateEdgeKey(edge);
    if (seenEndpoints.has(endpointKey)) continue;
    seenEndpoints.add(endpointKey);
    seqEdges.push(edge);
    const bucket = seqEdgesBySource.get(edge.source);
    if (bucket) bucket.push(edge);
    else seqEdgesBySource.set(edge.source, [edge]);
  }

  return { nodesById, childrenByParent, seqEdges, seqEdgesBySource, inDegreeCache: new Map() };
}

/** Identity of an edge's wiring, ignoring its id. */
export function duplicateEdgeKey(edge: Edge): string {
  return JSON.stringify([
    edge.source,
    edge.sourceHandle ?? '',
    edge.target,
    edge.targetHandle ?? '',
  ]);
}

/** A node with at least one child is treated as a container (structural). */
export function isContainerNode(index: GraphIndex, nodeId: string): boolean {
  return (index.childrenByParent.get(nodeId)?.length ?? 0) > 0;
}

/**
 * Forward sibling edges from `nodeId` inside `scope`, loopBack excluded. Sorted by
 * target flow position (then handle, then id), not edge-array order: a split edge is
 * re-appended, so array order would reorder lanes on every insert.
 */
export function forwardOut(index: GraphIndex, nodeId: string, scope: Scope): Edge[] {
  const out = index.seqEdgesBySource.get(nodeId);
  if (!out) return [];
  const forward = out.filter(
    (edge) => !isLoopBackEdge(edge) && index.nodesById.get(edge.target)?.parentId === scope
  );
  if (forward.length < 2) return forward;
  return forward.sort((a, b) => {
    const targetA = index.nodesById.get(a.target);
    const targetB = index.nodesById.get(b.target);
    const byTarget = targetA && targetB ? flowOrder(targetA, targetB) : 0;
    if (byTarget !== 0) return byTarget;
    const byHandle = sourceHandleOf(a).localeCompare(sourceHandleOf(b));
    if (byHandle !== 0) return byHandle;
    return a.id.localeCompare(b.id);
  });
}

/** More than one forward sibling edge makes a node a branch source. */
export function isBranchSource(index: GraphIndex, nodeId: string, scope: Scope): boolean {
  return forwardOut(index, nodeId, scope).length > 1;
}

/** In-scope forward in-degree per node (sibling-forward edges, loopBack excluded). */
export function inDegreeInScope(index: GraphIndex, scope: Scope): Map<string, number> {
  const cached = index.inDegreeCache.get(scope);
  if (cached) return cached;
  const indeg = new Map<string, number>();
  for (const edge of index.seqEdges) {
    if (isLoopBackEdge(edge)) continue;
    const source = index.nodesById.get(edge.source);
    const target = index.nodesById.get(edge.target);
    if (source?.parentId === scope && target?.parentId === scope) {
      indeg.set(edge.target, (indeg.get(edge.target) ?? 0) + 1);
    }
  }
  index.inDegreeCache.set(scope, indeg);
  return indeg;
}

function flowOrder(a: Node, b: Node): number {
  const ay = a.position?.y ?? 0;
  const by = b.position?.y ?? 0;
  if (ay !== by) return ay - by;
  const ax = a.position?.x ?? 0;
  const bx = b.position?.x ?? 0;
  if (ax !== bx) return ax - bx;
  return a.id.localeCompare(b.id);
}

/** Direct children with zero in-scope forward in-degree, in flow order. */
export function entriesForScope(index: GraphIndex, scope: Scope): Node[] {
  const children = index.childrenByParent.get(scope) ?? [];
  if (children.length === 0) return [];
  const indeg = inDegreeInScope(index, scope);
  return children.filter((child) => (indeg.get(child.id) ?? 0) === 0).sort(flowOrder);
}

/** Sort a plain node list by flow-view order (stable, deterministic). */
export function sortByFlow(nodes: Node[]): Node[] {
  return [...nodes].sort(flowOrder);
}

/** Reads the optional `label` off an edge's open `data` bag. */
export function edgeDataLabel(edge: Edge): string | undefined {
  const label = (edge.data as { label?: string | null } | undefined)?.label;
  return typeof label === 'string' ? label : undefined;
}

/** Source handle id or the canvas default (`'output'`). */
export function sourceHandleOf(edge: Edge): string {
  return edge.sourceHandle ?? DEFAULT_SOURCE_HANDLE_ID;
}

/**
 * `nodeId -> SequenceRow` index, memoized per projection. Every rendered row's move
 * options fan out to several slot finders, so without this the move machinery is
 * quadratic. Safe because the projection is reference-stable across data-only changes.
 */
const rowIndexByProjection = new WeakMap<SequenceProjection, ReadonlyMap<string, SequenceRow>>();

export function rowsById(projection: SequenceProjection): ReadonlyMap<string, SequenceRow> {
  const cached = rowIndexByProjection.get(projection);
  if (cached) return cached;
  const index = new Map(projection.rows.map((row) => [row.nodeId, row]));
  rowIndexByProjection.set(projection, index);
  return index;
}

/** The row for `nodeId`, via the memoized {@link rowsById} index. */
export function rowFor(projection: SequenceProjection, nodeId: string): SequenceRow | undefined {
  return rowsById(projection).get(nodeId);
}

/** Id lookup plus parentId buckets (top level under `undefined`), in input order. */
export function indexNodesByParent<T extends Node>(
  nodes: readonly T[]
): { nodesById: Map<string, T>; childrenByParent: Map<Scope, T[]> } {
  const nodesById = new Map<string, T>();
  const childrenByParent = new Map<Scope, T[]>();
  for (const node of nodes) {
    nodesById.set(node.id, node);
    const bucket = childrenByParent.get(node.parentId);
    if (bucket) bucket.push(node);
    else childrenByParent.set(node.parentId, [node]);
  }
  return { nodesById, childrenByParent };
}

/** Keeps the nodes passing `keep` and only the edges whose endpoints both survive. */
export function filterGraphByNodes<N extends Node, E extends Edge>(
  nodes: readonly N[],
  edges: readonly E[],
  keep: (node: N) => boolean
): { nodes: N[]; edges: E[]; nodeIds: Set<string> } {
  const kept = nodes.filter(keep);
  const nodeIds = new Set(kept.map((node) => node.id));
  return {
    nodes: kept,
    edges: edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)),
    nodeIds,
  };
}
