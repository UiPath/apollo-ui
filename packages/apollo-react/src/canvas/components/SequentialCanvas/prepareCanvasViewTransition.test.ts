import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AGENT_RESOURCES_NODE_IDS,
  makeAgentWithResourcesFixture,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from '../../utils/sequential/fixtures';
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

describe('prepareCanvasViewTransition: nested containers', () => {
  // A for-each inside a for-each with an empty inner body: the case `isContainerNode` exists for.
  const FOREACH = 'uipath.control-flow.foreach';
  const nested = (): { nodes: Node[]; edges: Edge[] } => ({
    nodes: [
      { id: 'outer', type: FOREACH, position: { x: 0, y: 0 }, data: {} },
      {
        id: 'inner',
        type: FOREACH,
        parentId: 'outer',
        extent: 'parent',
        position: { x: 0, y: 0 },
        data: {},
      },
    ],
    edges: [{ id: 'outer-inner', source: 'outer', target: 'inner' }],
  });
  const isContainerNode = (item: Node) => item.type === FOREACH;

  it('sizes an EMPTY inner container to fit inside its parent', () => {
    const { nodes, edges } = nested();

    const result = prepareCanvasViewTransition('flow', nodes, edges, { isContainerNode });

    const outer = result.nodes.find((item) => item.id === 'outer')!;
    const inner = result.nodes.find((item) => item.id === 'inner')!;
    // Without the predicate `inner.width` / `inner.height` stay undefined.
    expect(inner.width).toBeGreaterThan(0);
    expect(inner.height).toBeGreaterThan(0);
    // The inner box must fit inside the outer box, or xyflow clamps it outside `outer`'s origin.
    expect(inner.position.x + inner.width!).toBeLessThanOrEqual(outer.width!);
    expect(inner.position.y + inner.height!).toBeLessThanOrEqual(outer.height!);
    expect(inner.position.x).toBeGreaterThanOrEqual(0);
    expect(inner.position.y).toBeGreaterThanOrEqual(0);
  });

  it('routes the shared predicate to the sequential half', () => {
    // The sequential half forwards to projectSequence, so only the wiring is asserted here.
    const { nodes, edges } = nested();
    const spy = vi.fn(isContainerNode);

    prepareCanvasViewTransition('sequential', nodes, edges, { isContainerNode: spy });

    expect(spy.mock.calls.map(([item]) => item.id)).toContain('inner');
  });

  it('lets a per-half override still win over the shared predicate', () => {
    const { nodes, edges } = nested();

    const result = prepareCanvasViewTransition('flow', nodes, edges, {
      isContainerNode,
      flowLayout: { isContainerNode: () => false },
    });

    // Opting the flow half out reverts to child-count inference, so the inner is sized as a leaf.
    expect(result.nodes.find((item) => item.id === 'inner')?.width).toBeUndefined();
  });

  it('routes the shared sequence predicate to the sequential half', () => {
    const ids = AGENT_RESOURCES_NODE_IDS;
    const { nodes, edges } = makeAgentWithResourcesFixture();
    const steps = new Set<string>([ids.agent, ids.after]);

    const result = prepareCanvasViewTransition('sequential', nodes, edges, {
      isSequenceNode: (node) => steps.has(node.id),
    });

    const report = result.sequentialCompatibility!;
    expect(report.level).toBe('exact');
    expect(report.projectedNodeIds).toEqual([ids.agent, ids.after]);
    expect(report.preservedOnlyNodeIds).toEqual([ids.context, ids.memory, ids.tool]);
  });

  it('still lays out a nested container whose body is NOT empty', () => {
    // The case that already worked, kept so the fix cannot regress it.
    const { nodes, edges } = nested();
    const withLeaf: Node[] = [
      ...nodes,
      {
        id: 'leaf',
        type: 'task',
        parentId: 'inner',
        extent: 'parent',
        position: { x: 0, y: 0 },
        width: 288,
        height: 96,
        data: {},
      },
    ];

    const result = prepareCanvasViewTransition(
      'flow',
      withLeaf,
      [...edges, { id: 'inner-leaf', source: 'inner', target: 'leaf' }],
      { isContainerNode }
    );

    const byId = new Map(result.nodes.map((item) => [item.id, item]));
    for (const [childId, parentId] of [
      ['inner', 'outer'],
      ['leaf', 'inner'],
    ]) {
      const child = byId.get(childId)!;
      const parent = byId.get(parentId)!;
      expect(child.position.x + child.width!).toBeLessThanOrEqual(parent.width!);
      expect(child.position.y + child.height!).toBeLessThanOrEqual(parent.height!);
    }
  });

  it('never rewrites containment, only geometry', () => {
    const { nodes, edges } = nested();

    const result = prepareCanvasViewTransition('flow', nodes, edges, { isContainerNode });

    expect(result.nodes.map((item) => `${item.id}^${item.parentId ?? '-'}`)).toEqual([
      'outer^-',
      'inner^outer',
    ]);
  });

  it('puts a parent back in front of its child when the graph arrives mis-ordered', () => {
    // React Flow only warns and leaves the child unparented; neither the projection nor the
    // layout notices because both bucket by `parentId`.
    const { nodes, edges } = nested();
    const misordered = [nodes.find((n) => n.id === 'inner')!, nodes.find((n) => n.id === 'outer')!];

    const result = prepareCanvasViewTransition('flow', misordered, edges, { isContainerNode });

    expect(result.nodes.map((item) => item.id)).toEqual(['outer', 'inner']);
    // Containment itself is still never rewritten, only the array order.
    expect(result.nodes.find((item) => item.id === 'inner')?.parentId).toBe('outer');
  });
});

function node(id: string, x: number): Node {
  return { id, type: 'task', position: { x, y: 0 }, data: {} };
}

function edge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target };
}
