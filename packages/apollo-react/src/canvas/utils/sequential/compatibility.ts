import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  defaultIsSequenceEdge,
  duplicateEdgeKey,
  filterGraphByNodes,
  isLoopBackEdge,
} from './graph-helpers';
import { defaultIsSequenceNode, defaultIsStartNode } from './predicates';
import { projectSequence } from './projectSequence';
import type { ProjectSequenceOptions, SequenceProjection } from './sequential.types';

export type SequentialCompatibilityLevel = 'exact' | 'degraded' | 'unsupported';

export type SequentialCompatibilityIssueCode =
  | 'cross-scope-edge'
  | 'cycle'
  | 'duplicate-edge'
  | 'duplicate-node-id'
  | 'missing-parent'
  | 'multiple-roots'
  | 'orphan'
  | 'parent-cycle'
  | 'unstructured-merge';

export interface SequentialCompatibilityIssue {
  code: SequentialCompatibilityIssueCode;
  severity: 'warning' | 'error';
  /** Canonical nodes involved in the issue, kept deterministic for UI and tests. */
  nodeIds: string[];
  /** Canonical or derived connector ids involved in the issue. */
  edgeIds?: string[];
  /** Containment scope for a multiple-root issue; undefined means the root canvas. */
  scopeId?: string;
}

/**
 * Issues that block editing, as opposed to merely degrading the projection. These all
 * surface as slot-less `goto` connectors (or a hidden duplicate edge), so a splice near
 * them would silently rewire control flow. `multiple-roots` and `orphan` stay editable:
 * they are the normal state of a half-built flow and are fixed by ordinary editing.
 */
const EDIT_BLOCKING_ISSUE_CODES: ReadonlySet<SequentialCompatibilityIssueCode> = new Set([
  'cross-scope-edge',
  'cycle',
  'duplicate-edge',
  'unstructured-merge',
]);

export interface SequentialCompatibilityReport {
  level: SequentialCompatibilityLevel;
  /**
   * Whether the mutation ops can be trusted: no error and no {@link EDIT_BLOCKING_ISSUE_CODES}
   * issue. Looser than `level === 'exact'` by design.
   */
  editable: boolean;
  issues: SequentialCompatibilityIssue[];
  /** Canonical nodes represented as numbered sequential rows. */
  projectedNodeIds: string[];
  /** Presentation-only nodes intentionally retained in canonical state but omitted here. */
  preservedOnlyNodeIds: string[];
  /** Non-control-flow edges retained in canonical state but omitted from the projection. */
  preservedOnlyEdgeIds: string[];
  projection: SequenceProjection;
}

export interface AnalyzeSequentialCompatibilityOptions extends ProjectSequenceOptions {
  /** Excludes presentation-only concepts such as sticky notes from sequential rows. */
  isSequenceNode?: (node: Node) => boolean;
}

/**
 * How faithfully a graph can be presented and edited as a sequence. Analysis only:
 * canonical state is never rewritten.
 */
export function analyzeSequentialCompatibility(
  nodes: Node[],
  edges: Edge[],
  options: AnalyzeSequentialCompatibilityOptions = {}
): SequentialCompatibilityReport {
  const isSequenceNode = options.isSequenceNode ?? defaultIsSequenceNode;
  const isStartNode = options.isStartNode ?? defaultIsStartNode;
  const isSequenceEdge = options.isSequenceEdge ?? defaultIsSequenceEdge;

  const {
    nodes: semanticNodes,
    edges: semanticNodeEdges,
    nodeIds: semanticNodeIds,
  } = filterGraphByNodes(nodes, edges, isSequenceNode);
  const preservedOnlyNodeIds = nodes
    .filter((node) => !semanticNodeIds.has(node.id))
    .map((node) => node.id);
  const semanticEdges = semanticNodeEdges.filter(isSequenceEdge);
  const semanticEdgeIds = new Set(semanticEdges.map((edge) => edge.id));
  const projection = projectSequence(semanticNodes, semanticEdges, options);

  const issues: SequentialCompatibilityIssue[] = [];
  const nodeById = new Map<string, Node>();
  for (const node of semanticNodes) {
    if (nodeById.has(node.id)) {
      issues.push({ code: 'duplicate-node-id', severity: 'error', nodeIds: [node.id] });
    } else {
      nodeById.set(node.id, node);
    }
  }

  for (const node of semanticNodes) {
    if (node.parentId && !nodeById.has(node.parentId)) {
      issues.push({
        code: 'missing-parent',
        severity: 'error',
        nodeIds: [node.id, node.parentId],
      });
    }
  }

  const reportedParentCycles = new Set<string>();
  for (const node of semanticNodes) {
    const path: string[] = [];
    const pathIndex = new Map<string, number>();
    let current: Node | undefined = node;
    while (current) {
      const seenAt = pathIndex.get(current.id);
      if (seenAt !== undefined) {
        const cycle = path.slice(seenAt).sort();
        const key = cycle.join('|');
        if (!reportedParentCycles.has(key)) {
          reportedParentCycles.add(key);
          issues.push({ code: 'parent-cycle', severity: 'error', nodeIds: cycle });
        }
        break;
      }
      pathIndex.set(current.id, path.length);
      path.push(current.id);
      current = current.parentId ? nodeById.get(current.parentId) : undefined;
    }
  }

  const { nodes: nonStartNodes, edges: nonStartEdges } = filterGraphByNodes(
    semanticNodes,
    semanticEdges,
    (node) => !isStartNode(node)
  );
  const forwardEdges = nonStartEdges.filter((edge) => !isLoopBackEdge(edge));

  const scopes = new Map<string | undefined, Node[]>();
  for (const node of nonStartNodes) {
    const scoped = scopes.get(node.parentId);
    if (scoped) scoped.push(node);
    else scopes.set(node.parentId, [node]);
  }
  for (const [scopeId, scopedNodes] of scopes) {
    const scopedNodeIds = new Set(scopedNodes.map((node) => node.id));
    const incoming = new Set<string>();
    for (const edge of forwardEdges) {
      if (!scopedNodeIds.has(edge.source) || !scopedNodeIds.has(edge.target)) continue;
      incoming.add(edge.target);
    }
    const roots = scopedNodes
      .filter((node) => !incoming.has(node.id))
      .map((node) => node.id)
      .sort();
    if (roots.length > 1) {
      issues.push({
        code: 'multiple-roots',
        severity: 'warning',
        nodeIds: roots,
        scopeId,
      });
    }
  }

  const adjacency = new Map<string, string[]>();
  for (const edge of forwardEdges) {
    const targets = adjacency.get(edge.source);
    if (targets) targets.push(edge.target);
    else adjacency.set(edge.source, [edge.target]);
  }
  const hasPath = (start: string, target: string): boolean => {
    if (start === target) return true;
    const visited = new Set<string>();
    const pending = [start];
    while (pending.length > 0) {
      const current = pending.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const next of adjacency.get(current) ?? []) {
        if (next === target) return true;
        if (!visited.has(next)) pending.push(next);
      }
    }
    return false;
  };

  // Container entry (container -> child) and body-close (child -> container) edges are
  // structural, not cross-scope.
  const crossScopeGotoIds = new Set<string>();
  for (const edge of forwardEdges) {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target || source.parentId === target.parentId) continue;
    if (edge.source === target.parentId || edge.target === source.parentId) continue;
    crossScopeGotoIds.add(`conn:goto:${edge.id}`);
    issues.push({
      code: 'cross-scope-edge',
      severity: 'warning',
      nodeIds: [edge.source, edge.target],
      edgeIds: [edge.id],
    });
  }

  // The projection keeps only the first of duplicate edges; report the rest here.
  const seenWiring = new Map<string, Edge>();
  for (const edge of forwardEdges) {
    const key = duplicateEdgeKey(edge);
    const first = seenWiring.get(key);
    if (!first) {
      seenWiring.set(key, edge);
      continue;
    }
    issues.push({
      code: 'duplicate-edge',
      severity: 'warning',
      nodeIds: [edge.source, edge.target],
      edgeIds: [first.id, edge.id],
    });
  }

  for (const connector of projection.connectors) {
    if (connector.kind !== 'goto' || crossScopeGotoIds.has(connector.id)) continue;
    const closesCycle = hasPath(connector.targetRowId, connector.sourceRowId);
    issues.push({
      code: closesCycle ? 'cycle' : 'unstructured-merge',
      severity: 'warning',
      nodeIds: [connector.sourceRowId, connector.targetRowId],
      edgeIds: [connector.id],
    });
  }

  const orphanIds = projection.rows
    .filter((row) => row.orphan)
    .map((row) => row.nodeId)
    .sort();
  if (orphanIds.length > 0) {
    issues.push({ code: 'orphan', severity: 'warning', nodeIds: orphanIds });
  }

  const level: SequentialCompatibilityLevel = issues.some((issue) => issue.severity === 'error')
    ? 'unsupported'
    : issues.length > 0
      ? 'degraded'
      : 'exact';
  const editable = !issues.some(
    (issue) => issue.severity === 'error' || EDIT_BLOCKING_ISSUE_CODES.has(issue.code)
  );

  return {
    level,
    editable,
    issues,
    projectedNodeIds: projection.rows
      .filter((row) => !row.lanePlaceholder)
      .map((row) => row.nodeId),
    preservedOnlyNodeIds: preservedOnlyNodeIds.sort(),
    preservedOnlyEdgeIds: edges
      .filter((edge) => !semanticEdgeIds.has(edge.id))
      .map((edge) => edge.id)
      .sort(),
    projection,
  };
}
