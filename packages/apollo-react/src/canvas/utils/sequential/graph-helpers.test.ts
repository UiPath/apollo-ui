import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { filterGraphByNodes, indexNodesByParent } from './graph-helpers';

const node = (id: string, parentId?: string): Node => ({
  id,
  position: { x: 0, y: 0 },
  data: {},
  ...(parentId ? { parentId } : {}),
});
const edge = (source: string, target: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
});

describe('indexNodesByParent', () => {
  it('buckets children under their parent and roots under undefined, in input order', () => {
    const nodes = [node('a'), node('c', 'a'), node('b'), node('d', 'a')];
    const { nodesById, childrenByParent } = indexNodesByParent(nodes);

    expect([...nodesById.keys()]).toEqual(['a', 'c', 'b', 'd']);
    expect(childrenByParent.get(undefined)?.map((n) => n.id)).toEqual(['a', 'b']);
    expect(childrenByParent.get('a')?.map((n) => n.id)).toEqual(['c', 'd']);
    expect(childrenByParent.get('b')).toBeUndefined();
  });
});

describe('filterGraphByNodes', () => {
  it('keeps edges only when both endpoints survive', () => {
    const nodes = [node('a'), node('b'), node('c')];
    const edges = [edge('a', 'b'), edge('b', 'c'), edge('a', 'c')];

    const result = filterGraphByNodes(nodes, edges, (n) => n.id !== 'b');

    expect(result.nodes.map((n) => n.id)).toEqual(['a', 'c']);
    expect(result.edges.map((e) => e.id)).toEqual(['a-c']);
    expect([...result.nodeIds]).toEqual(['a', 'c']);
  });

  it('returns new arrays and leaves the inputs untouched', () => {
    const nodes = [node('a')];
    const edges = [edge('a', 'a')];
    const result = filterGraphByNodes(nodes, edges, () => true);
    expect(result.nodes).not.toBe(nodes);
    expect(result.edges).not.toBe(edges);
    expect(nodes).toHaveLength(1);
  });
});
