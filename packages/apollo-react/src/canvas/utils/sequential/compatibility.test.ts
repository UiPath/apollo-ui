import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { analyzeSequentialCompatibility } from './compatibility';
import {
  makeCycleFixture,
  makeEmptyBranchFixture,
  makeMultiRootFixture,
  makeOrphanFixture,
  makeUnstructuredMergeFixture,
  makeWireframeFixture,
} from './fixtures';

describe('analyzeSequentialCompatibility', () => {
  it('marks structured sequences, branches, merges, and containers as exactly editable', () => {
    for (const fixture of [makeWireframeFixture(), makeEmptyBranchFixture()]) {
      const report = analyzeSequentialCompatibility(fixture.nodes, fixture.edges);
      expect(report.level).toBe('exact');
      expect(report.editable).toBe(true);
      expect(report.issues).toEqual([]);
    }
  });

  it('marks multiple roots, gotos, cycles, and orphans as degraded', () => {
    const cases = [
      [makeMultiRootFixture(), 'multiple-roots'],
      [makeUnstructuredMergeFixture(), 'unstructured-merge'],
      [makeCycleFixture(), 'cycle'],
      [makeOrphanFixture(), 'orphan'],
    ] as const;

    for (const [fixture, expectedIssue] of cases) {
      const report = analyzeSequentialCompatibility(fixture.nodes, fixture.edges);
      expect(report.level).toBe('degraded');
      expect(report.issues.some((issue) => issue.code === expectedIssue)).toBe(true);
    }
  });

  it('counts independently triggered terminal nodes as multiple roots', () => {
    const trigger: Node = {
      id: 'trigger',
      type: 'uipath.trigger',
      position: { x: 0, y: 0 },
      data: {},
    };
    const first: Node = {
      id: 'first',
      type: 'step',
      position: { x: 100, y: 0 },
      data: {},
    };
    const second: Node = {
      id: 'second',
      type: 'step',
      position: { x: 100, y: 100 },
      data: {},
    };
    const edges: Edge[] = [
      { id: 'trigger-first', source: trigger.id, target: first.id },
      { id: 'trigger-second', source: trigger.id, target: second.id },
    ];

    const report = analyzeSequentialCompatibility([trigger, first, second], edges, {
      isStartNode: (node) => node.id === trigger.id,
    });

    expect(report.level).toBe('degraded');
    expect(report.editable).toBe(true);
    expect(report.issues).toContainEqual({
      code: 'multiple-roots',
      severity: 'warning',
      nodeIds: ['first', 'second'],
      scopeId: undefined,
    });
  });

  it('preserves presentation-only nodes and edges without degrading control flow', () => {
    const { nodes, edges } = makeWireframeFixture();
    const sticky: Node = {
      id: 'note',
      type: 'stickyNote',
      position: { x: 100, y: 100 },
      data: { text: 'Remember this' },
    };
    const annotationEdge: Edge = {
      id: 'annotation-edge',
      source: 'note',
      target: 'http',
    };
    const report = analyzeSequentialCompatibility([...nodes, sticky], [...edges, annotationEdge], {
      isSequenceNode: (node) => node.type !== 'stickyNote',
    });

    expect(report.level).toBe('exact');
    expect(report.preservedOnlyNodeIds).toEqual(['note']);
    expect(report.preservedOnlyEdgeIds).toContain('annotation-edge');
    expect(report.projectedNodeIds).not.toContain('note');
  });

  it('rejects malformed containment in the unified graph', () => {
    const missingParent: Node = {
      id: 'child',
      type: 'step',
      parentId: 'missing',
      position: { x: 0, y: 0 },
      data: {},
    };
    const a: Node = {
      id: 'a',
      type: 'container',
      parentId: 'b',
      position: { x: 0, y: 0 },
      data: {},
    };
    const b: Node = {
      id: 'b',
      type: 'container',
      parentId: 'a',
      position: { x: 0, y: 0 },
      data: {},
    };

    const report = analyzeSequentialCompatibility([missingParent, a, b], []);

    expect(report.level).toBe('unsupported');
    expect(report.editable).toBe(false);
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['missing-parent', 'parent-cycle'])
    );
  });
});

describe('analyzeSequentialCompatibility editable policy', () => {
  it('keeps a multi-root graph degraded but editable', () => {
    const { nodes, edges } = makeMultiRootFixture();
    const report = analyzeSequentialCompatibility(nodes, edges);

    expect(report.level).toBe('degraded');
    expect(report.editable).toBe(true);
    expect(report.issues.map((issue) => issue.code)).toEqual(['multiple-roots']);
  });

  it('keeps an orphan graph degraded but editable', () => {
    const { nodes, edges } = makeOrphanFixture();
    const report = analyzeSequentialCompatibility(nodes, edges);

    expect(report.level).toBe('degraded');
    expect(report.editable).toBe(true);
    expect(report.issues.map((issue) => issue.code)).toEqual(['multiple-roots', 'orphan']);
  });

  it('locks a cycle read-only: a goto carries no slot to splice at', () => {
    const { nodes, edges } = makeCycleFixture();
    const report = analyzeSequentialCompatibility(nodes, edges);

    expect(report.level).toBe('degraded');
    expect(report.editable).toBe(false);
    expect(report.issues.some((issue) => issue.code === 'cycle')).toBe(true);
  });

  it('locks an unstructured merge read-only for the same reason', () => {
    const { nodes, edges } = makeUnstructuredMergeFixture();
    const report = analyzeSequentialCompatibility(nodes, edges);

    expect(report.level).toBe('degraded');
    expect(report.editable).toBe(false);
    expect(report.issues.some((issue) => issue.code === 'unstructured-merge')).toBe(true);
  });

  it('locks any error-severity issue read-only', () => {
    const child: Node = {
      id: 'child',
      type: 'step',
      parentId: 'missing',
      position: { x: 0, y: 0 },
      data: {},
    };
    const report = analyzeSequentialCompatibility([child], []);

    expect(report.level).toBe('unsupported');
    expect(report.editable).toBe(false);
    expect(report.issues.some((issue) => issue.code === 'missing-parent')).toBe(true);
  });
});

function plainNode(id: string, y: number, parentId?: string): Node {
  return {
    id,
    type: 'uipath.script',
    position: { x: 0, y },
    data: {},
    ...(parentId ? { parentId } : {}),
  };
}
function plainEdge(
  source: string,
  target: string,
  sourceHandle = 'output',
  targetHandle = 'input',
  id = `${source}-${target}`
): Edge {
  return { id, source, target, sourceHandle, targetHandle };
}

describe('analyzeSequentialCompatibility reports what the walk cannot place', () => {
  it('flags an edge crossing a container boundary as cross-scope-edge and locks editing', () => {
    const nodes = [
      plainNode('a', 0),
      plainNode('c', 100),
      plainNode('x', 0, 'c'),
      plainNode('b', 200),
    ];
    const edges = [
      plainEdge('a', 'c'),
      plainEdge('c', 'x', 'start'),
      plainEdge('c', 'b', 'success'),
      plainEdge('a', 'x', 'output', 'input', 'cross'),
    ];
    const report = analyzeSequentialCompatibility(nodes, edges);
    expect(report.level).toBe('degraded');
    expect(report.editable).toBe(false);
    expect(report.issues).toEqual([
      { code: 'cross-scope-edge', severity: 'warning', nodeIds: ['a', 'x'], edgeIds: ['cross'] },
    ]);
  });

  it("does not treat a container's entry seam or a body's closing edge as cross-scope", () => {
    const report = analyzeSequentialCompatibility(
      makeWireframeFixture().nodes,
      makeWireframeFixture().edges
    );
    expect(report.issues).toEqual([]);
  });

  it('flags duplicate wiring as duplicate-edge, naming both edge ids', () => {
    const nodes = [plainNode('a', 0), plainNode('b', 10), plainNode('c', 20)];
    const edges = [
      plainEdge('a', 'b', 'output', 'input', 'e1'),
      plainEdge('a', 'b', 'output', 'input', 'e2'),
      plainEdge('b', 'c'),
    ];
    const report = analyzeSequentialCompatibility(nodes, edges);
    expect(report.level).toBe('degraded');
    expect(report.editable).toBe(false);
    expect(report.issues).toEqual([
      { code: 'duplicate-edge', severity: 'warning', nodeIds: ['a', 'b'], edgeIds: ['e1', 'e2'] },
    ]);
  });

  it('degrades a declared branch node with two continuation edges instead of certifying it exact', () => {
    const nodes = [
      plainNode('a', 0),
      plainNode('if', 100),
      plainNode('p', 200),
      plainNode('q', 300),
      plainNode('t', 400),
    ];
    const edges = [
      plainEdge('a', 'if'),
      plainEdge('if', 't', 'true'),
      plainEdge('if', 'p'),
      plainEdge('if', 'q'),
    ];
    const report = analyzeSequentialCompatibility(nodes, edges, {
      getBranchHandles: (node) =>
        node.id === 'if'
          ? [
              { id: 'true', label: 'Then' },
              { id: 'false', label: 'Else' },
            ]
          : [],
    });
    expect(report.level).toBe('degraded');
    expect(report.editable).toBe(false);
    expect(report.issues.filter((issue) => issue.code === 'unstructured-merge')).toHaveLength(2);
  });

  it('reports a cycle inside a container body as cycle, not orphan', () => {
    const nodes = [
      plainNode('a', 0),
      plainNode('c', 100),
      plainNode('x', 0, 'c'),
      plainNode('y', 50, 'c'),
    ];
    const edges = [plainEdge('a', 'c'), plainEdge('x', 'y'), plainEdge('y', 'x')];
    const report = analyzeSequentialCompatibility(nodes, edges);
    expect(report.issues.map((issue) => issue.code)).toEqual(['cycle']);
    expect(report.editable).toBe(false);
  });
});
