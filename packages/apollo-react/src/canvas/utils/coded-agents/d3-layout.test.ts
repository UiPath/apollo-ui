import { describe, expect, it } from 'vitest';
import type { Edge, Node } from '@uipath/uix/xyflow/react';
import { d3HierarchyLayout, type LayoutDirection } from './d3-layout';

describe('d3-layout', () => {
  describe('d3HierarchyLayout', () => {
    it('positions nodes in a tree layout', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
      ];

      const result = await d3HierarchyLayout(nodes, edges, {
        direction: 'TD',
        spacing: [50, 50],
      });

      // All nodes should have been positioned
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes[0]?.position).toBeDefined();
      expect(result.nodes[1]?.position).toBeDefined();
      expect(result.nodes[2]?.position).toBeDefined();

      // In TD layout, children should be below parent
      const parent = result.nodes.find((n) => n.id === '1');
      const child1 = result.nodes.find((n) => n.id === '2');
      const child2 = result.nodes.find((n) => n.id === '3');

      expect(parent).toBeDefined();
      expect(child1).toBeDefined();
      expect(child2).toBeDefined();

      expect(child1?.position.y).toBeGreaterThan(parent?.position.y || 0);
      expect(child2?.position.y).toBeGreaterThan(parent?.position.y || 0);
    });

    it('handles different layout directions', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

      const directions: LayoutDirection[] = ['TD', 'BT', 'LR', 'RL'];

      for (const direction of directions) {
        const result = await d3HierarchyLayout(nodes, edges, {
          direction,
          spacing: [50, 50],
        });

        // Should have positioned nodes
        expect(result.nodes).toHaveLength(2);
        expect(result.nodes[0]?.position).toBeDefined();
        expect(result.nodes[1]?.position).toBeDefined();
      }
    });

    it('handles nodes with measured dimensions', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          data: {},
          measured: { width: 300, height: 150 },
        },
        {
          id: '2',
          position: { x: 0, y: 0 },
          data: {},
          measured: { width: 250, height: 120 },
        },
      ];

      const edges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

      const result = await d3HierarchyLayout(nodes, edges, {
        direction: 'TD',
        spacing: [50, 50],
      });

      // Should use measured dimensions
      const node1 = result.nodes.find((n) => n.id === '1');
      const node2 = result.nodes.find((n) => n.id === '2');

      expect(node1).toBeDefined();
      expect(node2).toBeDefined();

      // Nodes should be positioned
      expect(node1?.position).toBeDefined();
      expect(node2?.position).toBeDefined();

      // Child should be below parent in TD layout
      expect(node2?.position.y).toBeGreaterThan(node1?.position.y || 0);
    });

    it('handles disconnected nodes by connecting to fake root', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [{ id: 'e2-3', source: '2', target: '3' }];

      const result = await d3HierarchyLayout(nodes, edges, {
        direction: 'TD',
        spacing: [50, 50],
      });

      // All nodes should be positioned
      expect(result.nodes).toHaveLength(3);
      for (const node of result.nodes) {
        expect(node.position).toBeDefined();
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
      }
    });

    it('preserves edges in the result', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [{ id: 'e1-2', source: '1', target: '2', type: 'custom' }];

      const result = await d3HierarchyLayout(nodes, edges, {
        direction: 'TD',
        spacing: [50, 50],
      });

      expect(result.edges).toEqual(edges);
    });

    it('handles horizontal layouts correctly', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
      ];

      const result = await d3HierarchyLayout(nodes, edges, {
        direction: 'LR',
        spacing: [50, 50],
      });

      // In LR layout, children should be to the right of parent
      const parent = result.nodes.find((n) => n.id === '1');
      const child1 = result.nodes.find((n) => n.id === '2');
      const child2 = result.nodes.find((n) => n.id === '3');

      expect(parent).toBeDefined();
      expect(child1).toBeDefined();
      expect(child2).toBeDefined();

      expect(child1?.position.x).toBeGreaterThanOrEqual(parent?.position.x || 0);
      expect(child2?.position.x).toBeGreaterThanOrEqual(parent?.position.x || 0);
    });

    it('handles spacing parameter correctly', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
        { id: '3', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e1-3', source: '1', target: '3' },
      ];

      const smallSpacing = await d3HierarchyLayout(nodes, edges, {
        direction: 'TD',
        spacing: [10, 10],
      });

      const largeSpacing = await d3HierarchyLayout(nodes, edges, {
        direction: 'TD',
        spacing: [100, 100],
      });

      // Nodes should be further apart with larger spacing
      const smallChild1 = smallSpacing.nodes.find((n) => n.id === '2');
      const smallChild2 = smallSpacing.nodes.find((n) => n.id === '3');
      expect(smallChild1).toBeDefined();
      expect(smallChild2).toBeDefined();
      const smallDistance = Math.abs(
        (smallChild1?.position.x || 0) - (smallChild2?.position.x || 0)
      );

      const largeChild1 = largeSpacing.nodes.find((n) => n.id === '2');
      const largeChild2 = largeSpacing.nodes.find((n) => n.id === '3');
      expect(largeChild1).toBeDefined();
      expect(largeChild2).toBeDefined();
      const largeDistance = Math.abs(
        (largeChild1?.position.x || 0) - (largeChild2?.position.x || 0)
      );

      expect(largeDistance).toBeGreaterThan(smallDistance);
    });

    it('handles empty inputs gracefully', async () => {
      const result = await d3HierarchyLayout([], [], {
        direction: 'TD',
        spacing: [50, 50],
      });

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });

    it('handles complex hierarchies with multiple levels', async () => {
      const nodes: Node[] = [
        { id: 'root', position: { x: 0, y: 0 }, data: {} },
        { id: 'level1-1', position: { x: 0, y: 0 }, data: {} },
        { id: 'level1-2', position: { x: 0, y: 0 }, data: {} },
        { id: 'level2-1', position: { x: 0, y: 0 }, data: {} },
        { id: 'level2-2', position: { x: 0, y: 0 }, data: {} },
      ];

      const edges: Edge[] = [
        { id: 'e-root-l1-1', source: 'root', target: 'level1-1' },
        { id: 'e-root-l1-2', source: 'root', target: 'level1-2' },
        { id: 'e-l1-1-l2-1', source: 'level1-1', target: 'level2-1' },
        { id: 'e-l1-2-l2-2', source: 'level1-2', target: 'level2-2' },
      ];

      const result = await d3HierarchyLayout(nodes, edges, {
        direction: 'TD',
        spacing: [50, 50],
      });

      expect(result.nodes).toHaveLength(5);

      const root = result.nodes.find((n) => n.id === 'root');
      const level1_1 = result.nodes.find((n) => n.id === 'level1-1');
      const level1_2 = result.nodes.find((n) => n.id === 'level1-2');
      const level2_1 = result.nodes.find((n) => n.id === 'level2-1');
      const level2_2 = result.nodes.find((n) => n.id === 'level2-2');

      expect(root).toBeDefined();
      expect(level1_1).toBeDefined();
      expect(level1_2).toBeDefined();
      expect(level2_1).toBeDefined();
      expect(level2_2).toBeDefined();

      // Level 1 should be below root
      expect(level1_1?.position.y).toBeGreaterThan(root?.position.y || 0);
      expect(level1_2?.position.y).toBeGreaterThan(root?.position.y || 0);

      // Level 2 should be below level 1
      expect(level2_1?.position.y).toBeGreaterThan(level1_1?.position.y || 0);
      expect(level2_2?.position.y).toBeGreaterThan(level1_2?.position.y || 0);
    });

    it('handles single node without edges', async () => {
      const nodes: Node[] = [{ id: 'alone', position: { x: 0, y: 0 }, data: {} }];

      const edges: Edge[] = [];

      const result = await d3HierarchyLayout(nodes, edges, {
        direction: 'TD',
        spacing: [50, 50],
      });

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]?.position).toBeDefined();
      expect(typeof result.nodes[0]?.position.x).toBe('number');
      expect(typeof result.nodes[0]?.position.y).toBe('number');
    });

    it('handles circular edges by throwing an error', async () => {
      const nodes: Node[] = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 0, y: 0 }, data: {} },
      ];

      // Circular reference: 1 -> 2 -> 1
      const edges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-1', source: '2', target: '1' },
      ];

      // D3 hierarchy should detect the cycle and throw an error
      try {
        await d3HierarchyLayout(nodes, edges, {
          direction: 'TD',
          spacing: [50, 50],
        });
        // If we get here, the function didn't throw as expected
        expect.fail('Expected function to throw an error for circular edges');
      } catch (error) {
        // Verify that the error is the expected cycle error
        expect(error).toBeDefined();
        expect(String(error)).toContain('cycle');
      }
    });

    it('preserves original node data and properties', async () => {
      const nodes: Node[] = [
        {
          id: '1',
          position: { x: 0, y: 0 },
          data: { label: 'Node 1', custom: 'value' },
          type: 'custom',
          selected: true,
        },
        {
          id: '2',
          position: { x: 0, y: 0 },
          data: { label: 'Node 2' },
          type: 'default',
        },
      ];

      const edges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

      const result = await d3HierarchyLayout(nodes, edges, {
        direction: 'TD',
        spacing: [50, 50],
      });

      const node1 = result.nodes.find((n) => n.id === '1');
      const node2 = result.nodes.find((n) => n.id === '2');

      expect(node1?.data).toEqual({ label: 'Node 1', custom: 'value' });
      expect(node1?.type).toBe('custom');
      expect(node1?.selected).toBe(true);
      expect(node2?.data).toEqual({ label: 'Node 2' });
      expect(node2?.type).toBe('default');
    });
  });
});
