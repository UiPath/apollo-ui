import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { analyzeSequentialCompatibility } from './compatibility';
import { buildGraphIndex, defaultIsSequenceEdge } from './graph-helpers';
import { findMerge } from './mergeAnalysis';
import { projectSequence } from './projectSequence';

const node = (id: string, y: number): Node => ({
  id,
  type: 'step',
  position: { x: 0, y },
  data: {},
});
const edge = (source: string, target: string, sourceHandle?: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  ...(sourceHandle ? { sourceHandle } : {}),
});
const nodesOf = (...ids: string[]): Node[] => ids.map((id, i) => node(id, i * 10));

function mergeOf(nodes: Node[], edges: Edge[], branchId: string): string | undefined {
  const index = buildGraphIndex(nodes, edges, defaultIsSequenceEdge);
  const branchEdges = index.seqEdgesBySource.get(branchId) ?? [];
  return findMerge(index, branchEdges, undefined);
}

describe('findMerge', () => {
  it('finds the join of a plain diamond', () => {
    const nodes = nodesOf('if', 'a', 'b', 'm');
    const edges = [
      edge('if', 'a', 'then'),
      edge('if', 'b', 'else'),
      edge('a', 'm'),
      edge('b', 'm'),
    ];
    expect(mergeOf(nodes, edges, 'if')).toBe('m');
  });

  it('returns undefined when lanes never converge', () => {
    const nodes = nodesOf('if', 'a', 'b');
    const edges = [edge('if', 'a', 'then'), edge('if', 'b', 'else')];
    expect(mergeOf(nodes, edges, 'if')).toBeUndefined();
  });

  /**
   * outer -> { inner -> { a, b } -> j, other } -> m. The nested branch closes at its own
   * join `j`; the outer lanes only converge further down, at `m`.
   */
  const nestedWithOwnJoin = () => {
    const nodes = nodesOf('outer', 'inner', 'other', 'a', 'b', 'j', 'm', 'tail');
    const edges = [
      edge('outer', 'inner', 'then'),
      edge('outer', 'other', 'else'),
      edge('inner', 'a', 'then'),
      edge('inner', 'b', 'else'),
      edge('a', 'j'),
      edge('b', 'j'),
      edge('j', 'm'),
      edge('other', 'm'),
      edge('m', 'tail'),
    ];
    return { nodes, edges };
  };

  it('looks past a nested branch that closes at its own join', () => {
    const { nodes, edges } = nestedWithOwnJoin();
    expect(mergeOf(nodes, edges, 'inner')).toBe('j');
    expect(mergeOf(nodes, edges, 'outer')).toBe('m');
  });

  it('projects the outer continuation below both outer lanes and stays editable', () => {
    const { nodes, edges } = nestedWithOwnJoin();
    const projection = projectSequence(nodes, edges);
    const depthOf = (id: string) => projection.rows.find((row) => row.nodeId === id)?.depth;

    expect(depthOf('inner')).toBe(1);
    expect(depthOf('j')).toBe(1);
    expect(depthOf('other')).toBe(1);
    expect(depthOf('m')).toBe(0);
    expect(depthOf('tail')).toBe(0);
    expect(projection.connectors.some((connector) => connector.kind === 'goto')).toBe(false);

    const report = analyzeSequentialCompatibility(nodes, edges);
    expect(report.level).toBe('exact');
    expect(report.editable).toBe(true);
  });

  it('still treats a nested join that an outer lane also feeds as the outer merge', () => {
    // inner's lanes and the outer else lane all land on `j`.
    const nodes = nodesOf('outer', 'inner', 'other', 'a', 'b', 'j');
    const edges = [
      edge('outer', 'inner', 'then'),
      edge('outer', 'other', 'else'),
      edge('inner', 'a', 'then'),
      edge('inner', 'b', 'else'),
      edge('a', 'j'),
      edge('b', 'j'),
      edge('other', 'j'),
    ];
    expect(mergeOf(nodes, edges, 'outer')).toBe('j');
  });

  it('accounts for every edge a doubly nested branch brings into a join', () => {
    // inner -> { a, b -> { c, d } }, with a, c and d all closing at `j`; then j -> m <- other.
    const nodes = nodesOf('outer', 'inner', 'other', 'a', 'b', 'c', 'd', 'j', 'm');
    const edges = [
      edge('outer', 'inner', 'then'),
      edge('outer', 'other', 'else'),
      edge('inner', 'a', 'then'),
      edge('inner', 'b', 'else'),
      edge('b', 'c', 'then'),
      edge('b', 'd', 'else'),
      edge('a', 'j'),
      edge('c', 'j'),
      edge('d', 'j'),
      edge('j', 'm'),
      edge('other', 'm'),
    ];
    expect(mergeOf(nodes, edges, 'outer')).toBe('m');
  });
});
