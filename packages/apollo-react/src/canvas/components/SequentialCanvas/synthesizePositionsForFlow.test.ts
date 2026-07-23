import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { SEQ_INSERTED_FLAG } from './edges/sequentialInsert';
import { synthesizePositionsForFlow } from './synthesizePositionsForFlow';

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

    // Placed to the right of its source, no overlap with A.
    expect(placed.position.x).toBeGreaterThan(a.position.x);
    expect(boxesOverlap(placed, a)).toBe(false);
    // Markers cleared.
    expect((placed.data as Record<string, unknown>)[SEQ_INSERTED_FLAG]).toBeUndefined();
    expect(placed.draggable).toBeUndefined();
    // Original label data preserved.
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
    // Both inserted nodes have the same source, so they anchor to the same spot
    // and must be pushed apart.
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
});
