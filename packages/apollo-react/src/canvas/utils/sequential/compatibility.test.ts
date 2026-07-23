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

  it('marks multiple roots, gotos, cycles, and orphans as degraded and read-only', () => {
    const cases = [
      [makeMultiRootFixture(), 'multiple-roots'],
      [makeUnstructuredMergeFixture(), 'unstructured-merge'],
      [makeCycleFixture(), 'cycle'],
      [makeOrphanFixture(), 'orphan'],
    ] as const;

    for (const [fixture, expectedIssue] of cases) {
      const report = analyzeSequentialCompatibility(fixture.nodes, fixture.edges);
      expect(report.level).toBe('degraded');
      expect(report.editable).toBe(false);
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
    expect(report.editable).toBe(false);
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
      type: 'sticky-note',
      position: { x: 100, y: 100 },
      data: { text: 'Remember this' },
    };
    const annotationEdge: Edge = {
      id: 'annotation-edge',
      source: 'note',
      target: 'http',
    };
    const report = analyzeSequentialCompatibility([...nodes, sticky], [...edges, annotationEdge], {
      isSequenceNode: (node) => node.type !== 'sticky-note',
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
