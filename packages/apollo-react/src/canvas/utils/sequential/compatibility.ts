import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_TRIGGER_NODE_TYPE } from '../../constants';
import { defaultIsSequenceEdge, LOOP_BACK_HANDLE_ID } from './graph-helpers';
import { projectSequence } from './projectSequence';
import type { ProjectSequenceOptions, SequenceProjection } from './sequential.types';

export type SequentialCompatibilityLevel = 'exact' | 'degraded' | 'unsupported';

export type SequentialCompatibilityIssueCode =
  | 'cycle'
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

export interface SequentialCompatibilityReport {
  level: SequentialCompatibilityLevel;
  /** Sequential mutations are safe only when the structure has an exact projection. */
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
 * Describes how faithfully one canonical node/edge graph can be presented and
 * edited as a sequential workflow. This is analysis, not conversion: excluded
 * presentation concepts remain in canonical state and toggling views never
 * rewrites topology.
 */
export function analyzeSequentialCompatibility(
  nodes: Node[],
  edges: Edge[],
  options: AnalyzeSequentialCompatibilityOptions = {}
): SequentialCompatibilityReport {
  const isSequenceNode = options.isSequenceNode ?? (() => true);
  const isStartNode =
    options.isStartNode ?? ((node: Node) => node.type === DEFAULT_TRIGGER_NODE_TYPE);
  const isSequenceEdge = options.isSequenceEdge ?? defaultIsSequenceEdge;

  const preservedOnlyNodes = nodes.filter((node) => !isSequenceNode(node));
  const preservedOnlyNodeIds = new Set(preservedOnlyNodes.map((node) => node.id));
  const semanticNodes = nodes.filter(isSequenceNode);
  const semanticNodeIds = new Set(semanticNodes.map((node) => node.id));
  const semanticEdges = edges.filter(
    (edge) =>
      semanticNodeIds.has(edge.source) && semanticNodeIds.has(edge.target) && isSequenceEdge(edge)
  );
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

  const nonStartNodes = semanticNodes.filter((node) => !isStartNode(node));
  const nonStartNodeIds = new Set(nonStartNodes.map((node) => node.id));
  const forwardEdges = semanticEdges.filter(
    (edge) =>
      nonStartNodeIds.has(edge.source) &&
      nonStartNodeIds.has(edge.target) &&
      edge.targetHandle !== LOOP_BACK_HANDLE_ID
  );

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

  for (const connector of projection.connectors) {
    if (connector.kind !== 'goto') continue;
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

  return {
    level,
    editable: level === 'exact',
    issues,
    projectedNodeIds: projection.rows
      .filter((row) => !row.lanePlaceholder)
      .map((row) => row.nodeId),
    preservedOnlyNodeIds: [...preservedOnlyNodeIds].sort(),
    preservedOnlyEdgeIds: edges
      .filter((edge) => !semanticEdgeIds.has(edge.id))
      .map((edge) => edge.id)
      .sort(),
    projection,
  };
}
