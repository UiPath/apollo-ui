import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { sequenceFingerprint } from './fingerprint';
import { makeMultiRootFixture, makeWireframeFixture, WIREFRAME_NODE_IDS } from './fixtures';

const EMPTY = new Set<string>();

function plainNode(id: string, x: number, y: number): Node {
  return { id, type: 'uipath.script', position: { x, y }, data: {} };
}

describe('sequenceFingerprint', () => {
  const base = makeWireframeFixture();
  const baseline = sequenceFingerprint(base.nodes, base.edges, EMPTY);

  it('is invariant under data-only changes (rename keystrokes)', () => {
    const renamed = base.nodes.map((node) =>
      node.id === WIREFRAME_NODE_IDS.http
        ? { ...node, data: { display: { label: 'Renamed HTTP call' } } }
        : node
    );
    expect(sequenceFingerprint(renamed, base.edges, EMPTY)).toBe(baseline);
  });

  it('is invariant under position-only changes that preserve sibling order', () => {
    const moved = base.nodes.map((node) => ({
      ...node,
      position: { x: node.position.x + 100, y: node.position.y + 100 },
    }));
    expect(sequenceFingerprint(moved, base.edges, EMPTY)).toBe(baseline);
  });

  it('changes when position changes reorder siblings', () => {
    const moved = base.nodes.map((node) => ({ ...node, position: { x: 999, y: 999 } }));
    expect(sequenceFingerprint(moved, base.edges, EMPTY)).not.toBe(baseline);
  });

  it('is invariant under input array reordering', () => {
    const shuffledNodes = [...base.nodes].reverse();
    const shuffledEdges = [...base.edges].reverse();
    expect(sequenceFingerprint(shuffledNodes, shuffledEdges, EMPTY)).toBe(baseline);
  });

  it('changes when the collapsed set changes', () => {
    expect(
      sequenceFingerprint(base.nodes, base.edges, new Set([WIREFRAME_NODE_IDS.forEach]))
    ).not.toBe(baseline);
  });

  it('changes when an edge endpoint changes', () => {
    const rewired = base.edges.map((edge) =>
      edge.id === 'e-http-js' ? { ...edge, target: WIREFRAME_NODE_IDS.forEach } : edge
    );
    expect(sequenceFingerprint(base.nodes, rewired, EMPTY)).not.toBe(baseline);
  });

  it('changes when a node type changes', () => {
    const retyped = base.nodes.map((node) =>
      node.id === WIREFRAME_NODE_IDS.ifNode ? { ...node, type: 'uipath.control-flow.switch' } : node
    );
    expect(sequenceFingerprint(retyped, base.edges, EMPTY)).not.toBe(baseline);
  });

  it('changes when container nesting (parentId) changes', () => {
    const reparented = base.nodes.map((node) =>
      node.id === WIREFRAME_NODE_IDS.sendMessage
        ? { ...node, parentId: WIREFRAME_NODE_IDS.forEach }
        : node
    );
    expect(sequenceFingerprint(reparented, base.edges, EMPTY)).not.toBe(baseline);
  });

  it('changes when a node is added or removed', () => {
    const fewer = base.nodes.slice(0, -1);
    expect(sequenceFingerprint(fewer, base.edges, EMPTY)).not.toBe(baseline);
  });

  describe('delimiter escaping (F6)', () => {
    it('does not collide when a field value contains the raw delimiter characters', () => {
      const graphA: Edge[] = [];
      const nodesA = [plainNode('a:b', 0, 0)].map((n) => ({ ...n, type: 'c', parentId: 'd' }));
      const nodesB = [plainNode('a', 0, 0)].map((n) => ({ ...n, type: 'b:c', parentId: 'd' }));
      expect(sequenceFingerprint(nodesA, graphA, EMPTY)).not.toBe(
        sequenceFingerprint(nodesB, graphA, EMPTY)
      );
    });
  });

  describe('root ordering (F6)', () => {
    it('changes when reordering multiple roots by flow-view y, even though node/edge identity is unchanged', () => {
      const { nodes, edges } = makeMultiRootFixture();
      const reordered = nodes.map((n) =>
        n.id === 'a'
          ? { ...n, position: { x: 0, y: 900 } }
          : n.id === 'c'
            ? { ...n, position: { x: 0, y: -900 } }
            : n
      );
      expect(sequenceFingerprint(reordered, edges, EMPTY)).not.toBe(
        sequenceFingerprint(nodes, edges, EMPTY)
      );
    });

    it('stays invariant under a uniform position shift that does not change relative order', () => {
      const { nodes, edges } = makeMultiRootFixture();
      const shifted = nodes.map((n) => ({
        ...n,
        position: { x: n.position.x + 10, y: n.position.y + 10 },
      }));
      expect(sequenceFingerprint(shifted, edges, EMPTY)).toBe(
        sequenceFingerprint(nodes, edges, EMPTY)
      );
    });
  });

  describe('edge identity (F6)', () => {
    it('changes when an edge is replaced by a different id with identical endpoints', () => {
      const rewired = base.edges.map((e) =>
        e.id === 'e-http-js' ? { ...e, id: 'renamed-id' } : e
      );
      expect(sequenceFingerprint(base.nodes, rewired, EMPTY)).not.toBe(baseline);
    });
  });
});
