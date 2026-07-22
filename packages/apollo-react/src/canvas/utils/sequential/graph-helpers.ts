import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_SOURCE_HANDLE_ID, PREVIEW_NODE_ID } from '../../constants';

/**
 * Internal pure graph helpers shared by the projection, merge analysis, and
 * layout passes. Nothing here is part of the public sequential API (kept out of
 * index.ts); it is imported directly by projectSequence / mergeAnalysis.
 *
 * The engine has zero manifest/registry access: it reasons purely from the
 * canonical `nodes`/`edges` arrays. Two structural nesting mechanisms exist:
 *  - container nesting via `node.parentId` (a node with children is a container);
 *  - branch nesting via a node with more than one in-scope forward edge.
 */

/** Loop-closure target handle; consumed as loop closure, never a cycle (useEdgePath.ts:114). */
export const LOOP_BACK_HANDLE_ID = 'loopBack';

/**
 * Canonical edge-data marker for a structural continuation through an inserted
 * node. It prevents a downstream edge from being reinterpreted as one of a
 * newly inserted decision/container node's own lanes merely because the Add
 * Node pipeline selected that node's default source handle.
 */
export const SEQ_CONTINUATION_EDGE_KEY = '__sequentialContinuation';

export function isSequentialContinuationEdge(edge: Edge): boolean {
  return (edge.data as Record<string, unknown> | undefined)?.[SEQ_CONTINUATION_EDGE_KEY] === true;
}

/**
 * Prefix for synthetic empty-branch-lane placeholder node ids (a parent's
 * declared branch handle with no child yet). These rows are view-only: they
 * never appear in canonical state. Change forwarding receives the exact set of
 * projected synthetic ids, so a canonical id that happens to share this prefix
 * is still handled normally.
 */
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

/**
 * Default sequence-edge predicate. Mirrors the container-engine contract
 * (utils/container.ts:766) where the predicate is caller-supplied: without a
 * manifest registry this layer cannot resolve `handleType === 'artifact'`, so
 * every non-preview edge counts as a sequence edge. Callers with registry
 * access pass `isSequenceEdge` to exclude artifact/resource handles.
 */
export function defaultIsSequenceEdge(edge: Edge): boolean {
  return edge.source !== PREVIEW_NODE_ID && edge.target !== PREVIEW_NODE_ID;
}

export function buildGraphIndex(
  nodes: Node[],
  edges: Edge[],
  isSequenceEdge: (edge: Edge) => boolean
): GraphIndex {
  const nodesById = new Map<string, Node>();
  const childrenByParent = new Map<Scope, Node[]>();
  for (const node of nodes) {
    nodesById.set(node.id, node);
    const bucket = childrenByParent.get(node.parentId);
    if (bucket) bucket.push(node);
    else childrenByParent.set(node.parentId, [node]);
  }

  const seqEdges: Edge[] = [];
  const seqEdgesBySource = new Map<string, Edge[]>();
  for (const edge of edges) {
    if (edge.source === PREVIEW_NODE_ID || edge.target === PREVIEW_NODE_ID) continue;
    if (!isSequenceEdge(edge)) continue;
    seqEdges.push(edge);
    const bucket = seqEdgesBySource.get(edge.source);
    if (bucket) bucket.push(edge);
    else seqEdgesBySource.set(edge.source, [edge]);
  }

  return { nodesById, childrenByParent, seqEdges, seqEdgesBySource, inDegreeCache: new Map() };
}

/** A node with at least one child is treated as a container (structural). */
export function isContainerNode(index: GraphIndex, nodeId: string): boolean {
  return (index.childrenByParent.get(nodeId)?.length ?? 0) > 0;
}

/**
 * Forward sibling edges from `nodeId` inside `scope`: source and target both
 * live directly in `scope`, loopBack excluded. Edges that wire back to the
 * container itself (target === scope) or leave the scope are not forward steps.
 */
export function forwardOut(index: GraphIndex, nodeId: string, scope: Scope): Edge[] {
  const out = index.seqEdgesBySource.get(nodeId);
  if (!out) return [];
  return out.filter(
    (edge) => !isLoopBackEdge(edge) && index.nodesById.get(edge.target)?.parentId === scope
  );
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

/**
 * Entry nodes for a scope: direct children with zero in-scope forward in-degree
 * (no sibling points at them), ordered by flow-view y so multi-root lanes stack
 * top-to-bottom (D9). Container-boundary edges from the parent do not count as
 * sibling incomers, so a container body's first child is correctly an entry.
 */
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
