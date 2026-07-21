import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { makeWireframeFixture, WIREFRAME_NODE_IDS } from '../../utils/sequential/fixtures';
import { SEQ_INSERTED_FLAG } from './edges/sequentialInsert';
import { prepareCanvasViewTransition } from './prepareCanvasViewTransition';

describe('prepareCanvasViewTransition', () => {
  it('keeps the canonical trigger for Flow while Sequential projects it into the start row', () => {
    const fixture = makeWireframeFixture();

    const flow = prepareCanvasViewTransition('flow', fixture.nodes, fixture.edges);
    const sequential = prepareCanvasViewTransition('sequential', flow.nodes, fixture.edges);

    expect(flow.nodes.find((item) => item.id === WIREFRAME_NODE_IDS.trigger)?.type).toBe(
      'uipath.first-run'
    );
    expect(
      sequential.sequentialCompatibility?.projectedNodeIds.includes(WIREFRAME_NODE_IDS.trigger)
    ).toBe(false);
    expect(sequential.sequentialCompatibility?.projectedNodeIds[0]).toBe(WIREFRAME_NODE_IDS.http);
  });

  it('applies a full left-to-right layout when entering flow', () => {
    const nodes = [node('a', 800), node('b', 0), node('c', 400)];
    const edges = [edge('a', 'b'), edge('b', 'c')];

    const result = prepareCanvasViewTransition('flow', nodes, edges, {
      flowLayout: {
        rankGap: 40,
        getNodeDimensions: () => ({ width: 100, height: 60 }),
      },
    });

    expect(result.nodes.map((item) => item.position)).toEqual([
      { x: 0, y: 0 },
      { x: 140, y: 0 },
      { x: 280, y: 0 },
    ]);
    expect(result.flowLayout).toBeDefined();
  });

  it('clears sequential insert markers as part of the flow transition', () => {
    const inserted: Node = {
      ...node('inserted', 0),
      draggable: false,
      data: { [SEQ_INSERTED_FLAG]: true },
    };

    const result = prepareCanvasViewTransition(
      'flow',
      [node('a', 0), inserted],
      [edge('a', 'inserted')]
    );

    expect(result.nodes[1]!.data).not.toHaveProperty(SEQ_INSERTED_FLAG);
    expect(result.nodes[1]!.draggable).toBeUndefined();
  });

  it('analyzes sequential compatibility without changing canonical nodes', () => {
    const nodes = [node('a', 0), node('b', 100), node('c', 200)];
    const edges = [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')];

    const result = prepareCanvasViewTransition('sequential', nodes, edges);

    expect(result.nodes).toBe(nodes);
    expect(result.sequentialCompatibility?.level).toBe('degraded');
    expect(result.sequentialCompatibility?.editable).toBe(false);
    expect(result.flowLayout).toBeUndefined();
  });

  it('preserves sticky-note geometry in both transitions by default', () => {
    const sticky: Node = {
      ...node('note', 900),
      type: 'stickyNote',
      position: { x: 900, y: 700 },
    };
    const nodes = [node('a', 100), node('b', 200), sticky];
    const edges = [edge('a', 'b'), edge('note', 'a')];

    const flow = prepareCanvasViewTransition('flow', nodes, edges);
    const sequential = prepareCanvasViewTransition('sequential', flow.nodes, edges);

    expect(flow.nodes.find((item) => item.id === sticky.id)?.position).toEqual({ x: 900, y: 700 });
    expect(sequential.sequentialCompatibility?.preservedOnlyNodeIds).toEqual(['note']);
    expect(sequential.sequentialCompatibility?.preservedOnlyEdgeIds).toContain('note-a');
  });
});

function node(id: string, x: number): Node {
  return { id, type: 'task', position: { x, y: 0 }, data: {} };
}

function edge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target };
}
