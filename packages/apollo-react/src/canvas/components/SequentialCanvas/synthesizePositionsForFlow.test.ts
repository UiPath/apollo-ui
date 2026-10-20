import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import {
  getContainerFitGeometry,
  getContainerSafeArea,
  getNodeDimensions,
} from '../../utils/container';
import { SEQ_INSERTED_FLAG } from './edges/sequentialInsert';
import { placeInsertForFlow, synthesizePositionsForFlow } from './synthesizePositionsForFlow';

function boxesOverlap(a: Node, b: Node): boolean {
  const aw = a.width ?? 96;
  const ah = a.height ?? 96;
  const bw = b.width ?? 96;
  const bh = b.height ?? 96;
  return (
    a.position.x < b.position.x + bw &&
    a.position.x + aw > b.position.x &&
    a.position.y < b.position.y + bh &&
    a.position.y + ah > b.position.y
  );
}

function makeNode(id: string, x: number, y: number, extra: Partial<Node> = {}): Node {
  return {
    id,
    type: 'uipath.script',
    position: { x, y },
    data: { display: { label: id } },
    ...extra,
  };
}

describe('synthesizePositionsForFlow', () => {
  it('returns the same array reference when nothing was inserted', () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 0, 200)];
    const result = synthesizePositionsForFlow(nodes, []);
    expect(result).toBe(nodes);
  });

  it('places an inserted node without overlap and clears the sequential markers', () => {
    const a = makeNode('a', 0, 0, { width: 96, height: 96 });
    const inserted: Node = {
      id: 'n',
      type: 'uipath.slack',
      position: { x: 0, y: 0 },
      draggable: false,
      data: { display: { label: 'Slack' }, [SEQ_INSERTED_FLAG]: true },
    };
    const edges: Edge[] = [{ id: 'e', source: 'a', target: 'n' }];

    const result = synthesizePositionsForFlow([a, inserted], edges);
    const placed = result.find((node) => node.id === 'n')!;

    expect(placed.position.x).toBeGreaterThan(a.position.x);
    expect(boxesOverlap(placed, a)).toBe(false);
    expect((placed.data as Record<string, unknown>)[SEQ_INSERTED_FLAG]).toBeUndefined();
    expect(placed.draggable).toBeUndefined();
    expect((placed.data as { display: { label: string } }).display.label).toBe('Slack');
  });

  it('never moves a pre-existing node (returns them by identity)', () => {
    const a = makeNode('a', 0, 0);
    const b = makeNode('b', 500, 500);
    const inserted: Node = {
      id: 'n',
      type: 'uipath.script',
      position: { x: 0, y: 0 },
      data: { [SEQ_INSERTED_FLAG]: true },
    };
    const edges: Edge[] = [{ id: 'e', source: 'a', target: 'n' }];

    const result = synthesizePositionsForFlow([a, b, inserted], edges);

    expect(result.find((n) => n.id === 'a')).toBe(a);
    expect(result.find((n) => n.id === 'b')).toBe(b);
  });

  it('separates multiple inserted nodes so none overlap', () => {
    const a = makeNode('a', 0, 0, { width: 96, height: 96 });
    const makeInserted = (id: string): Node => ({
      id,
      type: 'uipath.script',
      position: { x: 0, y: 0 },
      data: { [SEQ_INSERTED_FLAG]: true },
    });
    // Both inserted nodes anchor to the same source and must be pushed apart.
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'n1' },
      { id: 'e2', source: 'a', target: 'n2' },
    ];

    const result = synthesizePositionsForFlow([a, makeInserted('n1'), makeInserted('n2')], edges);
    const n1 = result.find((n) => n.id === 'n1')!;
    const n2 = result.find((n) => n.id === 'n2')!;

    expect(boxesOverlap(n1, n2)).toBe(false);
    expect(boxesOverlap(n1, a)).toBe(false);
    expect(boxesOverlap(n2, a)).toBe(false);
  });

  describe('inside a container', () => {
    const container = makeNode('loop', 400, 300, { width: 600, height: 400 });
    const origin = getContainerSafeArea(container).padding;
    const inserted = (id: string, position = { x: 999, y: 999 }): Node => ({
      id,
      type: 'uipath.script',
      parentId: 'loop',
      extent: 'parent',
      position,
      data: { [SEQ_INSERTED_FLAG]: true },
    });

    it('anchors at the body origin when the source is the container itself', () => {
      // The head of a For Each body is entered from the container's inner start handle.
      const result = synthesizePositionsForFlow(
        [container, inserted('n')],
        [{ id: 'e', source: 'loop', sourceHandle: 'start', target: 'n' }]
      );
      const placed = result.find((node) => node.id === 'n')!;
      expect(placed.position).toEqual({ x: origin?.left ?? 0, y: origin?.top ?? 0 });
      expect(placed.parentId).toBe('loop');
    });

    it('anchors at the body origin when nothing connects into the node', () => {
      // The head of a self-contained body has no incoming edge at all.
      const result = synthesizePositionsForFlow([container, inserted('n')], []);
      expect(result.find((node) => node.id === 'n')!.position).toEqual({
        x: origin?.left ?? 0,
        y: origin?.top ?? 0,
      });
    });

    it('anchors beside a source in the same frame, ignoring the stale insert position', () => {
      const sibling = makeNode('s', 64, 80, { parentId: 'loop', width: 96, height: 96 });
      const result = synthesizePositionsForFlow(
        [container, sibling, inserted('n')],
        [{ id: 'e', source: 's', target: 'n' }]
      );
      const placed = result.find((node) => node.id === 'n')!;
      expect(placed.position.y).toBe(80);
      expect(placed.position.x).toBeGreaterThan(64 + 96);
    });
  });
});

describe('placeInsertForFlow', () => {
  // A full For Each (2x2 children) inside a runtime container: the only free spot for a new
  // step is outside the For Each's current frame, so the frame must grow.
  const runtime = makeNode('rt', 0, 0, { width: 900, height: 700 });
  const loop = makeNode('loop', 80, 80, { parentId: 'rt', width: 400, height: 320 });
  const step = (id: string, x: number, y: number) =>
    makeNode(id, x, y, { parentId: 'loop', width: 96, height: 96 });
  const children = [
    step('s4', 96, 80),
    step('s5', 256, 80),
    step('s6', 96, 208),
    step('s7', 256, 208),
  ];
  const nodes = [runtime, loop, ...children];
  const inserted: Node = {
    id: 'new',
    type: 'uipath.script',
    parentId: 'loop',
    extent: 'parent',
    // A sequence-layout position in the runtime frame's space, meaningless inside the loop.
    position: { x: 64, y: 360 },
    data: { [SEQ_INSERTED_FLAG]: true },
  };
  const placeNew = () =>
    placeInsertForFlow({
      nodes,
      edges: [],
      inserted,
      newEdges: [{ id: 'e', source: 's4', target: 'new' }],
      getNodeDimensions: (node) => getNodeDimensions(node),
      getContainerFitGeometry,
    });

  it('places the node beside its source, clears the marker, and overlaps no sibling', () => {
    const { node } = placeNew();
    expect(node.parentId).toBe('loop');
    expect((node.data as Record<string, unknown>)[SEQ_INSERTED_FLAG]).toBeUndefined();
    for (const sibling of children)
      expect(boxesOverlap({ ...node, width: 96, height: 96 }, sibling)).toBe(false);
  });

  it('grows the parent container to fit the new node and reports it as an update', () => {
    const { node, updates } = placeNew();
    const grownLoop = updates.find((update) => update.id === 'loop');
    expect(grownLoop).toBeDefined();
    const loopWidth = grownLoop!.width ?? 0;
    const loopHeight = grownLoop!.height ?? 0;
    expect(node.position.x + 96).toBeLessThanOrEqual(loopWidth);
    expect(node.position.y + 96).toBeLessThanOrEqual(loopHeight);
    // Inputs are untouched.
    expect(loop.width).toBe(400);
    expect(nodes).toHaveLength(6);
  });
});
