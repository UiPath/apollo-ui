import type { InternalNode, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { GRID_SPACING, PREVIEW_NODE_ID } from '../constants';
import {
  getAbsolutePosition,
  getNonOverlappingPositionForDirection,
  resolveCollisions,
  resolveHandleContext,
} from './NodeUtils';

describe('NodeUtils', () => {
  describe('getAbsolutePosition', () => {
    it('should return node position when node has no parent', () => {
      const node: Node = {
        id: 'node-1',
        position: { x: 100, y: 200 },
        data: {},
      };

      const result = getAbsolutePosition(node, [node]);

      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should calculate absolute position for node with one parent', () => {
      const parentNode: Node = {
        id: 'parent-1',
        position: { x: 50, y: 75 },
        data: {},
      };

      const childNode: Node = {
        id: 'child-1',
        position: { x: 100, y: 200 },
        parentId: 'parent-1',
        data: {},
      };

      const result = getAbsolutePosition(childNode, [parentNode, childNode]);

      expect(result).toEqual({ x: 150, y: 275 }); // 50+100, 75+200
    });

    it('should calculate absolute position for node with nested parents', () => {
      const grandparentNode: Node = {
        id: 'grandparent',
        position: { x: 10, y: 20 },
        data: {},
      };

      const parentNode: Node = {
        id: 'parent',
        position: { x: 30, y: 40 },
        parentId: 'grandparent',
        data: {},
      };

      const childNode: Node = {
        id: 'child',
        position: { x: 50, y: 60 },
        parentId: 'parent',
        data: {},
      };

      const result = getAbsolutePosition(childNode, [grandparentNode, parentNode, childNode]);

      expect(result).toEqual({ x: 90, y: 120 }); // 10+30+50, 20+40+60
    });

    it('should handle missing parent node gracefully', () => {
      const childNode: Node = {
        id: 'child-1',
        position: { x: 100, y: 200 },
        parentId: 'missing-parent',
        data: {},
      };

      const result = getAbsolutePosition(childNode, [childNode]);

      // Should add 0 for missing parent
      expect(result).toEqual({ x: 100, y: 200 });
    });

    it('should handle negative positions', () => {
      const parentNode: Node = {
        id: 'parent-1',
        position: { x: -50, y: -75 },
        data: {},
      };

      const childNode: Node = {
        id: 'child-1',
        position: { x: 100, y: 200 },
        parentId: 'parent-1',
        data: {},
      };

      const result = getAbsolutePosition(childNode, [parentNode, childNode]);

      expect(result).toEqual({ x: 50, y: 125 }); // -50+100, -75+200
    });
  });

  describe('getNonOverlappingPositionForDirection', () => {
    const newNodeStyle = { width: 100, height: 80 };

    it('should return original position when no overlap', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 0, y: 0 },
          measured: { width: 100, height: 80 },
          data: {},
        },
      ];

      const newPosition = { x: 200, y: 200 };

      const result = getNonOverlappingPositionForDirection(
        nodes,
        newPosition,
        newNodeStyle,
        'right'
      );

      expect(result).toEqual({ x: 200, y: 200 });
    });

    it('should shift vertically for horizontal placement when overlapping', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          measured: { width: 100, height: 80 },
          data: {},
        },
      ];

      const newPosition = { x: 150, y: 120 }; // Overlaps with node-1

      const result = getNonOverlappingPositionForDirection(
        nodes,
        newPosition,
        newNodeStyle,
        'right'
      );

      // Should shift down (y increases)
      expect(result.x).toBe(150);
      expect(result.y).toBeGreaterThan(120);
    });

    it('should shift horizontally for vertical placement when overlapping', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          measured: { width: 100, height: 80 },
          data: {},
        },
      ];

      const newPosition = { x: 120, y: 150 }; // Overlaps with node-1

      const result = getNonOverlappingPositionForDirection(
        nodes,
        newPosition,
        newNodeStyle,
        'bottom'
      );

      // Should shift right (x increases)
      expect(result.x).toBeGreaterThan(120);
      expect(result.y).toBe(150);
    });

    it('should use default offset of GRID_SPACING * 2', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          measured: { width: 100, height: 80 },
          data: {},
        },
      ];

      const newPosition = { x: 150, y: 150 };

      const result = getNonOverlappingPositionForDirection(
        nodes,
        newPosition,
        newNodeStyle,
        'right'
      );

      expect(result.y).toBe(150 + GRID_SPACING * 2);
    });

    it('should use custom offset when provided', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          measured: { width: 100, height: 80 },
          data: {},
        },
      ];

      const newPosition = { x: 150, y: 150 };
      const customOffset = 50;

      const result = getNonOverlappingPositionForDirection(
        nodes,
        newPosition,
        newNodeStyle,
        'right',
        customOffset
      );

      expect(result.y).toBe(150 + customOffset);
    });

    it('should recursively shift until no overlap', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          measured: { width: 100, height: 80 },
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 150, y: 132 }, // At first shift position
          measured: { width: 100, height: 80 },
          data: {},
        },
      ];

      const newPosition = { x: 150, y: 120 };

      const result = getNonOverlappingPositionForDirection(
        nodes,
        newPosition,
        newNodeStyle,
        'right'
      );

      // Should shift twice to avoid both nodes
      expect(result.y).toBeGreaterThan(132 + GRID_SPACING * 2);
    });

    it('should ignore preview node when checking overlap', () => {
      const nodes: Node[] = [
        {
          id: PREVIEW_NODE_ID,
          position: { x: 150, y: 120 },
          measured: { width: 100, height: 80 },
          data: {},
        },
      ];

      const newPosition = { x: 150, y: 120 }; // Overlaps with preview node

      const result = getNonOverlappingPositionForDirection(
        nodes,
        newPosition,
        newNodeStyle,
        'right'
      );

      // Should not shift because preview node is ignored
      expect(result).toEqual({ x: 150, y: 120 });
    });

    it('should ignore specified node types', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          type: 'group',
          position: { x: 150, y: 120 },
          measured: { width: 100, height: 80 },
          data: {},
        },
      ];

      const newPosition = { x: 150, y: 120 };

      const result = getNonOverlappingPositionForDirection(
        nodes,
        newPosition,
        newNodeStyle,
        'right',
        GRID_SPACING * 2,
        ['group']
      );

      // Should not shift because "group" type is ignored
      expect(result).toEqual({ x: 150, y: 120 });
    });

    it('should handle all directions correctly', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          measured: { width: 100, height: 80 },
          data: {},
        },
      ];

      // Test left direction (should shift vertically)
      const leftResult = getNonOverlappingPositionForDirection(
        nodes,
        { x: 120, y: 120 },
        newNodeStyle,
        'left'
      );
      expect(leftResult.y).toBeGreaterThan(120);

      // Test top direction (should shift horizontally)
      const topResult = getNonOverlappingPositionForDirection(
        nodes,
        { x: 120, y: 120 },
        newNodeStyle,
        'top'
      );
      expect(topResult.x).toBeGreaterThan(120);
    });
  });

  describe('resolveCollisions', () => {
    it('should return nodes unchanged when no collisions', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 0, y: 0 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 300, y: 300 },
          width: 100,
          height: 80,
          data: {},
        },
      ];

      const result = resolveCollisions(nodes);

      expect(result[0]?.position).toEqual({ x: 0, y: 0 });
      expect(result[1]?.position).toEqual({ x: 300, y: 300 });
    });

    it('should move overlapping nodes apart', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 120, y: 110 }, // Overlaps with node-1
          width: 100,
          height: 80,
          data: {},
        },
      ];

      const result = resolveCollisions(nodes);

      const node1 = result.find((n) => n.id === 'node-1');
      const node2 = result.find((n) => n.id === 'node-2');

      // Both nodes should have moved from their original positions
      expect(node1!.position).not.toEqual({ x: 100, y: 100 });
      expect(node2!.position).not.toEqual({ x: 120, y: 110 });
    });

    it('should snap positions to grid', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 120, y: 110 },
          width: 100,
          height: 80,
          data: {},
        },
      ];

      const result = resolveCollisions(nodes);

      // Positions should be multiples of GRID_SPACING
      for (const node of result) {
        expect(node.position.x % GRID_SPACING).toBe(0);
        expect(node.position.y % GRID_SPACING).toBe(0);
      }
    });

    it('should use measured dimensions when width/height not provided', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          measured: { width: 100, height: 80 },
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 120, y: 110 },
          measured: { width: 100, height: 80 },
          data: {},
        },
      ];

      const result = resolveCollisions(nodes);

      // Nodes should be moved to avoid collision
      const node1 = result.find((n) => n.id === 'node-1');
      const node2 = result.find((n) => n.id === 'node-2');

      expect(node1!.position).not.toEqual({ x: 100, y: 100 });
      expect(node2!.position).not.toEqual({ x: 120, y: 110 });
    });

    it('should use DEFAULT_NODE_SIZE when no dimensions provided', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 110, y: 110 },
          data: {},
        },
      ];

      const result = resolveCollisions(nodes);

      // Should still resolve using DEFAULT_NODE_SIZE
      expect(result).toHaveLength(2);
      const node1 = result.find((n) => n.id === 'node-1');
      const node2 = result.find((n) => n.id === 'node-2');

      // At least one node should have moved
      expect(
        node1!.position.x !== 100 ||
          node1!.position.y !== 100 ||
          node2!.position.x !== 110 ||
          node2!.position.y !== 110
      ).toBe(true);
    });

    it('should respect overlapThreshold option', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 120, y: 110 },
          width: 100,
          height: 80,
          data: {},
        },
      ];

      // With very high threshold, nodes shouldn't move (overlap must be > threshold to resolve)
      const resultHighThreshold = resolveCollisions(nodes, { overlapThreshold: 1000 });
      expect(resultHighThreshold[0]?.position).toEqual({ x: 100, y: 100 });
      expect(resultHighThreshold[1]?.position).toEqual({ x: 120, y: 110 });
    });

    it('should respect margin option', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 120, y: 110 },
          width: 100,
          height: 80,
          data: {},
        },
      ];

      const largeMargin = GRID_SPACING * 4;
      const result = resolveCollisions(nodes, { margin: largeMargin });

      const node1 = result.find((n) => n.id === 'node-1');
      const node2 = result.find((n) => n.id === 'node-2');

      // Nodes should be moved apart
      expect(node1!.position).not.toEqual({ x: 100, y: 100 });
      expect(node2!.position).not.toEqual({ x: 120, y: 110 });
    });

    it('should handle multiple overlapping nodes', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 110, y: 110 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'node-3',
          position: { x: 120, y: 120 },
          width: 100,
          height: 80,
          data: {},
        },
      ];

      const result = resolveCollisions(nodes);

      expect(result).toHaveLength(3);

      // All nodes should have moved from their original positions
      expect(result[0]!.position).not.toEqual({ x: 100, y: 100 });
      expect(result[1]!.position).not.toEqual({ x: 110, y: 110 });
      expect(result[2]!.position).not.toEqual({ x: 120, y: 120 });
    });

    it('should not move ignored node types', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'sticky-1',
          type: 'stickyNote',
          position: { x: 120, y: 110 }, // Overlaps with node-1
          width: 200,
          height: 200,
          data: {},
        },
      ];

      const result = resolveCollisions(nodes, { ignoredNodeTypes: ['stickyNote'] });

      // Sticky note should remain at its original position
      const sticky = result.find((n) => n.id === 'sticky-1');
      expect(sticky!.position).toEqual({ x: 120, y: 110 });

      // Regular node should also not move since the only overlapping node was ignored
      const node1 = result.find((n) => n.id === 'node-1');
      expect(node1!.position).toEqual({ x: 100, y: 100 });
    });

    it('should not let ignored nodes push other nodes', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 300, y: 300 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'sticky-1',
          type: 'stickyNote',
          position: { x: 110, y: 110 }, // Overlaps with node-1
          width: 200,
          height: 200,
          data: {},
        },
      ];

      const result = resolveCollisions(nodes, { ignoredNodeTypes: ['stickyNote'] });

      // Both regular nodes should stay put (no collision between them)
      expect(result.find((n) => n.id === 'node-1')!.position).toEqual({ x: 100, y: 100 });
      expect(result.find((n) => n.id === 'node-2')!.position).toEqual({ x: 300, y: 300 });

      // Sticky note stays untouched
      expect(result.find((n) => n.id === 'sticky-1')!.position).toEqual({ x: 110, y: 110 });
    });

    it('should preserve original node order with ignoredNodeTypes', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'sticky-1',
          type: 'stickyNote',
          position: { x: 150, y: 150 },
          width: 200,
          height: 200,
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 110, y: 110 },
          width: 100,
          height: 80,
          data: {},
        },
      ];

      const result = resolveCollisions(nodes, { ignoredNodeTypes: ['stickyNote'] });

      // Order should be preserved
      expect(result[0]!.id).toBe('node-1');
      expect(result[1]!.id).toBe('sticky-1');
      expect(result[2]!.id).toBe('node-2');
    });

    it('should handle exact overlaps (same position)', () => {
      const nodes: Node[] = [
        {
          id: 'node-1',
          position: { x: 100, y: 100 },
          width: 100,
          height: 80,
          data: {},
        },
        {
          id: 'node-2',
          position: { x: 100, y: 100 }, // Exact same position
          width: 100,
          height: 80,
          data: {},
        },
      ];

      const result = resolveCollisions(nodes);

      const node1 = result.find((n) => n.id === 'node-1');
      const node2 = result.find((n) => n.id === 'node-2');

      // Nodes should be moved apart
      expect(node1!.position).not.toEqual({ x: 100, y: 100 });
      expect(node2!.position).not.toEqual({ x: 100, y: 100 });
    });

    it('should use caller-provided node sizes during collision resolution', () => {
      const nodes: Node[] = [
        {
          id: 'wide-node',
          position: { x: 100, y: 100 },
          data: {},
        },
        {
          id: 'second-node',
          position: { x: 220, y: 100 },
          width: 40,
          height: 40,
          data: {},
        },
      ];

      const result = resolveCollisions(nodes, {
        getNodeDimensions: (node) =>
          node.id === 'wide-node'
            ? { width: 160, height: 40 }
            : {
                width: node.width ?? 40,
                height: node.height ?? 40,
              },
      });

      expect(result.find((node) => node.id === 'wide-node')?.position).not.toEqual({
        x: 100,
        y: 100,
      });
      expect(result.find((node) => node.id === 'second-node')?.position).not.toEqual({
        x: 220,
        y: 100,
      });
    });
  });

  describe('resolveHandleContext', () => {
    type TestHandleSpec = {
      id: string;
      type: 'source' | 'target';
      position: Position;
      x: number;
      y: number;
    };

    function makeInternalNode(
      handles: TestHandleSpec[],
      positionAbsolute: { x: number; y: number } = { x: 0, y: 0 }
    ): InternalNode {
      const sources = handles.filter((h) => h.type === 'source');
      const targets = handles.filter((h) => h.type === 'target');
      const toBound = (h: TestHandleSpec) => ({
        id: h.id,
        nodeId: 'n',
        x: h.x,
        y: h.y,
        position: h.position,
        type: h.type,
        width: 8,
        height: 8,
      });
      return {
        internals: {
          positionAbsolute,
          handleBounds: {
            source: sources.map(toBound),
            target: targets.map(toBound),
          },
        },
      } as unknown as InternalNode;
    }

    // Container layout: success on outer-right, start inner-left flipped to right
    // (Handle component renders at opposite side via connectionPosition).
    // Both report `position: Right` to React Flow but live on different visual rails.
    const containerHandles: TestHandleSpec[] = [
      { id: 'success', type: 'source', position: Position.Right, x: 700, y: 160 },
      { id: 'start', type: 'source', position: Position.Right, x: 80, y: 160 },
      { id: 'continue', type: 'target', position: Position.Left, x: 624, y: 104 },
      { id: 'break', type: 'target', position: Position.Left, x: 624, y: 216 },
      { id: 'input', type: 'target', position: Position.Left, x: 0, y: 160 },
    ];

    it('counts every handle with the same React Flow position when no boundaryOf is provided', () => {
      const internalNode = makeInternalNode(containerHandles);

      const ctx = resolveHandleContext(internalNode, 'success', Position.Right);

      // Without boundary awareness, success and the inner-flipped start both
      // count as right-side peers — count is 2.
      expect(ctx?.count).toBe(2);
    });

    it('filters peer count by boundary so flipped inner handles are excluded', () => {
      const internalNode = makeInternalNode(containerHandles);
      const boundaryOf = (handleId: string): 'outer' | 'inner' | undefined => {
        if (handleId === 'success' || handleId === 'input') return 'outer';
        if (handleId === 'start' || handleId === 'continue' || handleId === 'break') {
          return 'inner';
        }
        return undefined;
      };

      const ctx = resolveHandleContext(internalNode, 'success', Position.Right, {
        boundaryOf,
      });

      // success is the only handle on the outer-right rail.
      expect(ctx).toMatchObject({ count: 1, index: 0 });
    });

    it('groups two outer-right peers as count=2 with boundary-aware filtering', () => {
      // Branching node: two source handles share the outer-right rail.
      const branchingHandles: TestHandleSpec[] = [
        { id: 'output-1', type: 'source', position: Position.Right, x: 96, y: 32 },
        { id: 'output-2', type: 'source', position: Position.Right, x: 96, y: 64 },
      ];
      const internalNode = makeInternalNode(branchingHandles);
      const boundaryOf = () => 'outer' as const;

      const ctx = resolveHandleContext(internalNode, 'output-1', Position.Right, {
        boundaryOf,
      });

      expect(ctx).toMatchObject({ count: 2, index: 0 });
    });
  });
});
