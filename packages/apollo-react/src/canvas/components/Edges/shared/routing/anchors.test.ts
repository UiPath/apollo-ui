import {
  ConnectionMode,
  type Edge,
  type InternalNode,
  Position,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';

// These resolvers run against real React Flow node internals; the global canvas
// test setup stubs the module out entirely.
vi.unmock('@uipath/apollo-react/canvas/xyflow/react');

import { type RouteNodeLookup, resolveRouteAnchors, toRouteNode } from './anchors';

type HandleSpec = {
  id: string | null;
  position: Position;
  x: number;
  y: number;
};

/**
 * A node as React Flow's store holds it: `position` is parent-relative, while
 * `internals.positionAbsolute` is resolved against the parent chain.
 */
function makeNode(
  id: string,
  {
    position,
    positionAbsolute = position,
    width = 100,
    height = 40,
    sourceHandles = [],
    targetHandles = [],
    measured = true,
  }: {
    position: { x: number; y: number };
    positionAbsolute?: { x: number; y: number };
    width?: number;
    height?: number;
    sourceHandles?: HandleSpec[];
    targetHandles?: HandleSpec[];
    measured?: boolean;
  }
): InternalNode {
  const toHandles = (specs: HandleSpec[], type: 'source' | 'target') =>
    specs.map((spec) => ({
      ...spec,
      nodeId: id,
      type,
      width: 10,
      height: 10,
    }));

  return {
    id,
    position,
    data: {},
    width,
    height,
    measured: { width, height },
    internals: {
      positionAbsolute,
      z: 0,
      userNode: { id, position, data: {} },
      handleBounds: measured
        ? {
            source: toHandles(sourceHandles, 'source'),
            target: toHandles(targetHandles, 'target'),
          }
        : undefined,
    },
  } as unknown as InternalNode;
}

function makeEdge(overrides: Partial<Edge> = {}): Edge {
  return { id: 'e1', source: 'a', target: 'b', ...overrides };
}

function lookup(...nodes: InternalNode[]): RouteNodeLookup {
  return new Map(nodes.map((node) => [node.id, node])) as RouteNodeLookup;
}

describe('toRouteNode', () => {
  it('reports the absolute box for a child of a container, not the parent-relative one', () => {
    const child = makeNode('child', {
      position: { x: 40, y: 20 },
      positionAbsolute: { x: 540, y: 320 },
    });

    expect(toRouteNode(child)).toEqual({ id: 'child', x: 540, y: 320, width: 100, height: 40 });
  });
});

describe('resolveRouteAnchors', () => {
  it('resolves anchors from the addressed handle on a multi-handle node', () => {
    // Two source handles stacked on the right face: routing from the second one
    // must not land on the node-box midpoint the first one is near.
    const source = makeNode('a', {
      position: { x: 0, y: 0 },
      sourceHandles: [
        { id: 'continue', position: Position.Right, x: 95, y: 5 },
        { id: 'start', position: Position.Right, x: 95, y: 25 },
      ],
    });
    const target = makeNode('b', {
      position: { x: 300, y: 0 },
      targetHandles: [{ id: 'input', position: Position.Left, x: -5, y: 15 }],
    });

    const anchors = resolveRouteAnchors(
      lookup(source, target),
      makeEdge({ sourceHandle: 'start', targetHandle: 'input' }),
      ConnectionMode.Strict
    );

    // Right face: x is the handle's far edge, y its centre.
    expect(anchors?.source).toEqual({
      nodeId: 'a',
      handleId: 'start',
      x: 105,
      y: 30,
      position: Position.Right,
    });
    // Left face: x is the handle's near edge, y its centre.
    expect(anchors?.target).toEqual({
      nodeId: 'b',
      handleId: 'input',
      x: 295,
      y: 20,
      position: Position.Left,
    });
  });

  it('anchors a nested node from its absolute position', () => {
    const child = makeNode('a', {
      position: { x: 40, y: 20 },
      positionAbsolute: { x: 540, y: 320 },
      sourceHandles: [{ id: 'out', position: Position.Right, x: 95, y: 15 }],
    });
    const target = makeNode('b', {
      position: { x: 900, y: 320 },
      targetHandles: [{ id: 'in', position: Position.Left, x: -5, y: 15 }],
    });

    const anchors = resolveRouteAnchors(
      lookup(child, target),
      makeEdge({ sourceHandle: 'out', targetHandle: 'in' }),
      ConnectionMode.Strict
    );

    expect(anchors?.source.x).toBe(645);
    expect(anchors?.source.y).toBe(340);
  });

  it('honours a handle on a face other than left/right', () => {
    const source = makeNode('a', {
      position: { x: 0, y: 0 },
      sourceHandles: [{ id: 'out', position: Position.Bottom, x: 45, y: 35 }],
    });
    const target = makeNode('b', {
      position: { x: 0, y: 200 },
      targetHandles: [{ id: 'in', position: Position.Top, x: 45, y: -5 }],
    });

    const anchors = resolveRouteAnchors(
      lookup(source, target),
      makeEdge({ sourceHandle: 'out', targetHandle: 'in' }),
      ConnectionMode.Strict
    );

    // Bottom face: y is the handle's far edge; top face: its near edge.
    expect(anchors?.source).toMatchObject({ x: 50, y: 45, position: Position.Bottom });
    expect(anchors?.target).toMatchObject({ x: 50, y: 195, position: Position.Top });
  });

  it('falls back to node-box faces when handles are not measured yet', () => {
    const source = makeNode('a', { position: { x: 0, y: 0 }, measured: false });
    const target = makeNode('b', {
      position: { x: 100, y: 100 },
      positionAbsolute: { x: 400, y: 100 },
      measured: false,
    });

    const anchors = resolveRouteAnchors(lookup(source, target), makeEdge(), ConnectionMode.Strict);

    expect(anchors?.source).toEqual({
      nodeId: 'a',
      handleId: null,
      x: 100,
      y: 20,
      position: Position.Right,
    });
    expect(anchors?.target).toEqual({
      nodeId: 'b',
      handleId: null,
      x: 400,
      y: 120,
      position: Position.Left,
    });
  });

  it('returns null for a dangling edge', () => {
    const source = makeNode('a', { position: { x: 0, y: 0 } });

    expect(resolveRouteAnchors(lookup(source), makeEdge(), ConnectionMode.Strict)).toBeNull();
  });
});
