import { describe, expect, it } from 'vitest';
import { diffById } from './diffById';

interface Doc {
  nodes: Array<{ id: string; label?: string; position?: { x: number; y: number }; data?: object }>;
  edges: Array<{ id: string; source: string; target: string }>;
}

const options = {
  getNodes: (doc: Doc) => doc.nodes,
  getEdges: (doc: Doc) => doc.edges,
};

describe('diffById', () => {
  const before: Doc = {
    nodes: [
      { id: 'kept', label: 'Kept', position: { x: 0, y: 0 } },
      { id: 'edited', label: 'Old' },
      { id: 'gone', label: 'Gone' },
    ],
    edges: [
      { id: 'e1', source: 'kept', target: 'edited' },
      { id: 'e2', source: 'edited', target: 'gone' },
    ],
  };
  const after: Doc = {
    nodes: [
      { id: 'kept', label: 'Kept', position: { x: 100, y: 50 } },
      { id: 'edited', label: 'New' },
      { id: 'fresh', label: 'Fresh' },
    ],
    edges: [
      { id: 'e1', source: 'kept', target: 'fresh' },
      { id: 'e3', source: 'fresh', target: 'edited' },
    ],
  };

  it('counts added, removed and changed nodes and edges', () => {
    const { highlight, summary } = diffById(before, after, options);

    expect(summary).toEqual({
      addedNodes: 1,
      removedNodes: 1,
      changedNodes: 2,
      addedEdges: 1,
      removedEdges: 1,
      changedEdges: 1,
    });
    expect(highlight.nodeKind.get('fresh')).toBe('added');
    expect(highlight.nodeKind.get('gone')).toBe('removed');
    expect(highlight.nodeKind.get('edited')).toBe('changed');
    expect(highlight.edgeKind.get('e1')).toBe('changed');
    expect(highlight.edgeKind.get('e2')).toBe('removed');
    expect(highlight.edgeKind.get('e3')).toBe('added');
  });

  it('skips ignored node keys so layout moves are not changes', () => {
    const { highlight, summary } = diffById(before, after, {
      ...options,
      ignoreNodeKeys: ['position'],
    });

    expect(highlight.nodeKind.has('kept')).toBe(false);
    expect(summary.changedNodes).toBe(1);
  });

  it('supports dotted ignore paths', () => {
    const a: Doc = { nodes: [{ id: 'n', data: { ui: { x: 1 }, label: 'L' } }], edges: [] };
    const b: Doc = { nodes: [{ id: 'n', data: { ui: { x: 9 }, label: 'L' } }], edges: [] };

    expect(diffById(a, b, options).summary.changedNodes).toBe(1);
    expect(diffById(a, b, { ...options, ignoreNodeKeys: ['data.ui'] }).summary.changedNodes).toBe(
      0
    );
  });

  it('uses custom id getters', () => {
    const a = { items: [{ key: 'x', v: 1 }] };
    const b = { items: [{ key: 'x', v: 2 }] };
    const { highlight } = diffById(a, b, {
      getNodes: (doc: typeof a) => doc.items,
      getEdges: () => [],
      nodeId: (node) => node.key,
    });

    expect(highlight.nodeKind.get('x')).toBe('changed');
  });

  it('returns an empty diff for identical documents', () => {
    const { highlight, summary } = diffById(before, structuredClone(before), options);

    expect(highlight.nodeKind.size).toBe(0);
    expect(highlight.edgeKind.size).toBe(0);
    expect(Object.values(summary).every((count) => count === 0)).toBe(true);
  });

  it('ignores key order, undefined values and node order', () => {
    const shuffled: Doc = {
      nodes: [
        { id: 'b', data: { y: 2, x: 1 } },
        { id: 'a', label: 'A', data: undefined },
      ],
      edges: [],
    };
    const ordered: Doc = {
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', data: { x: 1, y: 2 } },
      ],
      edges: [],
    };

    expect(diffById(shuffled, ordered, options).highlight.nodeKind.size).toBe(0);
  });

  it('compares dates by value', () => {
    const at = (iso: string): Doc => ({
      nodes: [{ id: 'n', data: { at: new Date(iso) } }],
      edges: [],
    });

    const { highlight } = diffById(at('2024-01-01'), at('2024-06-01'), options);
    expect(highlight.nodeKind.get('n')).toBe('changed');
    expect(diffById(at('2024-01-01'), at('2024-01-01'), options).highlight.nodeKind.size).toBe(0);
  });
});
