import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { compactAlignNodes, subtleAlignNodes } from './tidy-up';

describe('tidy-up', () => {
  describe('subtleAlignNodes', () => {
    it('returns the input unchanged for an empty list', () => {
      expect(subtleAlignNodes([])).toEqual([]);
    });

    it('snaps nodes that are already close together onto a shared line', () => {
      const nodes: Node[] = [
        { id: 'a', type: 'generic', position: { x: 100, y: 0 }, data: {} },
        { id: 'b', type: 'generic', position: { x: 108, y: 200 }, data: {} },
        { id: 'c', type: 'generic', position: { x: 94, y: 400 }, data: {} },
      ];

      const result = subtleAlignNodes(nodes);
      const xs = result.map((node) => node.position.x);

      expect(xs[0]).toBe(xs[1]);
      expect(xs[1]).toBe(xs[2]);
    });

    it('leaves nodes far from any neighbor untouched', () => {
      const nodes: Node[] = [
        { id: 'a', type: 'generic', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'generic', position: { x: 500, y: 500 }, data: {} },
      ];

      const result = subtleAlignNodes(nodes);

      expect(result[0]?.position).toEqual({ x: 0, y: 0 });
      expect(result[1]?.position).toEqual({ x: 500, y: 500 });
    });

    it('respects a custom snap threshold', () => {
      const nodes: Node[] = [
        { id: 'a', type: 'generic', position: { x: 0, y: 0 }, data: {} },
        { id: 'b', type: 'generic', position: { x: 30, y: 0 }, data: {} },
      ];

      const snapped = subtleAlignNodes(nodes, 40);
      const notSnapped = subtleAlignNodes(nodes, 10);

      expect(snapped[0]?.position.x).toBe(snapped[1]?.position.x);
      expect(notSnapped[0]?.position.x).not.toBe(notSnapped[1]?.position.x);
    });

    it('does not mutate the input nodes', () => {
      const nodes: Node[] = [{ id: 'a', type: 'generic', position: { x: 0, y: 0 }, data: {} }];
      const original = structuredClone(nodes);

      subtleAlignNodes(nodes);

      expect(nodes).toEqual(original);
    });
  });

  describe('compactAlignNodes', () => {
    it('lays out a simple chain left-to-right by default, matching handle-based edge routing', async () => {
      const nodes: Node[] = [
        { id: 'a', type: 'generic', position: { x: 300, y: 10 }, data: {} },
        { id: 'b', type: 'generic', position: { x: -50, y: 900 }, data: {} },
      ];
      const edges: Edge[] = [{ id: 'a-b', source: 'a', target: 'b' }];

      const result = await compactAlignNodes(nodes, edges);

      const a = result.find((node) => node.id === 'a');
      const b = result.find((node) => node.id === 'b');

      expect(a).toBeDefined();
      expect(b).toBeDefined();
      // left-to-right layout: child sits to the right of its parent
      expect(b?.position.x).toBeGreaterThan(a?.position.x ?? 0);
    });

    it('supports overriding the direction, e.g. back to top-down', async () => {
      const nodes: Node[] = [
        { id: 'a', type: 'generic', position: { x: 300, y: 10 }, data: {} },
        { id: 'b', type: 'generic', position: { x: -50, y: 900 }, data: {} },
      ];
      const edges: Edge[] = [{ id: 'a-b', source: 'a', target: 'b' }];

      const result = await compactAlignNodes(nodes, edges, undefined, 'TD');

      const a = result.find((node) => node.id === 'a');
      const b = result.find((node) => node.id === 'b');

      expect(b?.position.y).toBeGreaterThan(a?.position.y ?? 0);
    });
  });
});
