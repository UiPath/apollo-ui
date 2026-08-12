import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { orderNodesParentsFirst } from './NodeUtils';

const node = (id: string, parentId?: string): Node => ({
  id,
  type: 'task',
  position: { x: 0, y: 0 },
  data: {},
  ...(parentId ? { parentId } : {}),
});

const ids = (nodes: Node[]) => nodes.map((n) => n.id);

describe('orderNodesParentsFirst', () => {
  it('returns an already-ordered array by identity, so callers can skip a state update', () => {
    const nodes = [node('a'), node('box'), node('child', 'box')];

    expect(orderNodesParentsFirst(nodes)).toBe(nodes);
  });

  it('moves a parent in front of its child', () => {
    const nodes = [node('child', 'box'), node('box')];

    expect(ids(orderNodesParentsFirst(nodes))).toEqual(['box', 'child']);
  });

  it('orders a whole containment chain, deepest last', () => {
    const nodes = [node('leaf', 'inner'), node('inner', 'outer'), node('outer')];

    expect(ids(orderNodesParentsFirst(nodes))).toEqual(['outer', 'inner', 'leaf']);
  });

  it('keeps siblings in their original relative order', () => {
    // Stability matters: array order is the layout's tie-breaker for nodes that
    // share a rank, so reshuffling siblings would silently change the layout.
    const nodes = [
      node('c3', 'box'),
      node('c1', 'box'),
      node('box'),
      node('c2', 'box'),
      node('root'),
    ];

    expect(ids(orderNodesParentsFirst(nodes))).toEqual(['box', 'root', 'c3', 'c1', 'c2']);
  });

  it('treats a parentId pointing at a missing node as a root rather than dropping it', () => {
    const nodes = [node('orphan', 'deleted-container'), node('a')];

    const result = orderNodesParentsFirst(nodes);

    expect(ids(result)).toEqual(['orphan', 'a']);
    // The dangling parentId is preserved: this helper only reorders.
    expect(result[0]?.parentId).toBe('deleted-container');
  });

  it('does not hang on a parentId cycle', () => {
    const nodes = [node('x', 'y'), node('y', 'x')];

    expect(ids(orderNodesParentsFirst(nodes))).toHaveLength(2);
  });

  it('never adds, drops or rewrites a node', () => {
    const nodes = [node('leaf', 'inner'), node('inner', 'outer'), node('outer'), node('loose')];

    const result = orderNodesParentsFirst(nodes);

    expect(result).toHaveLength(nodes.length);
    expect([...ids(result)].sort()).toEqual([...ids(nodes)].sort());
    for (const original of nodes) {
      expect(result).toContain(original);
    }
  });

  it("satisfies React Flow's own rule: every parent is seen before its child", () => {
    const nodes = [
      node('leaf', 'inner'),
      node('inner', 'outer'),
      node('sibling', 'outer'),
      node('outer'),
      node('root'),
    ];

    const result = orderNodesParentsFirst(nodes);

    const seen = new Set<string>();
    for (const item of result) {
      if (item.parentId) expect(seen.has(item.parentId)).toBe(true);
      seen.add(item.id);
    }
  });
});
