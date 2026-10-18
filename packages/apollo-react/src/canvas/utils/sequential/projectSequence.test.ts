import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import {
  makeBranchCycleFixture,
  makeBranchVisitedTargetFixture,
  makeCycleFixture,
  makeDeepNestingFixture,
  makeDiamondFixture,
  makeEmptyBranchFixture,
  makeInterleavedOrphanFixture,
  makeLoopBackFixture,
  makeMultiRootFixture,
  makeNestedBranchFixture,
  makeOrphanFixture,
  makeSingleNodeFixture,
  makeUnstructuredMergeFixture,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from './fixtures';
import { SEQ_CONTINUATION_EDGE_KEY } from './graph-helpers';
import { projectSequence } from './projectSequence';
import type { SequenceConnector, SequenceProjection, SequenceRow } from './sequential.types';

function rowById(projection: SequenceProjection, nodeId: string): SequenceRow {
  const row = projection.rows.find((r) => r.nodeId === nodeId);
  if (!row) throw new Error(`row ${nodeId} not found`);
  return row;
}

function connector(
  projection: SequenceProjection,
  source: string,
  target: string
): SequenceConnector {
  const found = projection.connectors.find(
    (c) => c.sourceRowId === source && c.targetRowId === target
  );
  if (!found) throw new Error(`connector ${source}->${target} not found`);
  return found;
}

describe('projectSequence', () => {
  describe('wireframe fixture', () => {
    const projection = projectSequence(...toArgs(makeWireframeFixture()));
    const ids = WIREFRAME_NODE_IDS;

    it('emits seven numbered rows in pre-order with unnumbered branch-tail placeholders', () => {
      const numberedRows = projection.rows.filter((row) => row.stepNumber !== undefined);
      expect(numberedRows.map((r) => r.nodeId)).toEqual([
        ids.http,
        ids.javascript,
        ids.forEach,
        ids.ifNode,
        ids.thenJs,
        ids.elseHttp,
        ids.sendMessage,
      ]);
      expect(numberedRows.map((r) => r.stepNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(projection.rows.filter((row) => row.lanePlaceholder)).toHaveLength(2);
    });

    it('assigns depths from container and branch nesting', () => {
      expect(rowById(projection, ids.http).depth).toBe(0);
      expect(rowById(projection, ids.forEach).depth).toBe(0);
      expect(rowById(projection, ids.ifNode).depth).toBe(1);
      expect(rowById(projection, ids.thenJs).depth).toBe(2);
      expect(rowById(projection, ids.elseHttp).depth).toBe(2);
      expect(rowById(projection, ids.sendMessage).depth).toBe(0);
    });

    it('marks containers and branch owners collapsible, leaves others not', () => {
      expect(rowById(projection, ids.forEach).collapsible).toBe(true);
      expect(rowById(projection, ids.ifNode).collapsible).toBe(true);
      expect(rowById(projection, ids.http).collapsible).toBe(false);
      expect(rowById(projection, ids.thenJs).collapsible).toBe(false);
    });

    it('marks terminal non-container rows as leaves', () => {
      expect(rowById(projection, ids.thenJs).isLeaf).toBe(true);
      expect(rowById(projection, ids.elseHttp).isLeaf).toBe(true);
      expect(rowById(projection, ids.sendMessage).isLeaf).toBe(true);
      expect(rowById(projection, ids.http).isLeaf).toBeFalsy();
      expect(rowById(projection, ids.forEach).isLeaf).toBeFalsy();
      expect(rowById(projection, ids.ifNode).isLeaf).toBeFalsy();
    });

    it('carries branch metadata on the first row of each lane', () => {
      expect(rowById(projection, ids.ifNode).branch?.label).toBe('Body');
      expect(rowById(projection, ids.thenJs).branch?.label).toBe('Then');
      expect(rowById(projection, ids.elseHttp).branch?.label).toBe('Else');
      expect(rowById(projection, ids.http).branch).toBeUndefined();
    });

    it('emits workflow connectors plus one placeholder connector per populated branch tail', () => {
      const kinds = projection.connectors.map((c) => c.kind).sort();
      expect(kinds).toEqual([
        'branch-entry',
        'branch-entry',
        'branch-entry',
        'merge-back',
        'step',
        'step',
        'step',
        'step',
      ]);
      expect(connector(projection, ids.forEach, ids.ifNode).label).toBe('Body');
      expect(connector(projection, ids.ifNode, ids.thenJs).label).toBe('Then');
      expect(connector(projection, ids.ifNode, ids.elseHttp).label).toBe('Else');
      expect(projection.connectors.some((c) => c.kind === 'goto')).toBe(false);
    });

    it('renders the container-continuation out of For Each as a merge-back that still carries an insertable slot', () => {
      const forEachToSend = connector(projection, ids.forEach, ids.sendMessage);
      expect(forEachToSend.kind).toBe('merge-back');
      expect(forEachToSend.slot).toBeDefined();
      expect(forEachToSend.slot?.graphEdgeId).toBe('e-foreach-send');

      expect(connector(projection, ids.http, ids.javascript).kind).toBe('step');
    });

    it('keeps real connectors insertable and gives branch-tail placeholders their own slots', () => {
      const placeholderNodeIds = new Set(
        projection.rows.filter((row) => row.lanePlaceholder).map((row) => row.nodeId)
      );
      for (const c of projection.connectors.filter(
        (connector) => !placeholderNodeIds.has(connector.targetRowId)
      )) {
        expect(c.slot, `${c.kind} ${c.sourceRowId}->${c.targetRowId}`).toBeDefined();
      }
      expect(projection.slots).toHaveLength(8);
      expect(projection.slots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: `slot:leaf:${ids.thenJs}` }),
          expect.objectContaining({ id: `slot:leaf:${ids.elseHttp}` }),
        ])
      );
    });

    it('resolves branch labels via the resolver option ahead of edge data', () => {
      const { nodes, edges } = makeWireframeFixture();
      const withResolver = projectSequence(nodes, edges, {
        resolveBranchLabel: (nodeId, handleId) =>
          nodeId === ids.ifNode && handleId === 'true' ? 'Yes' : `${handleId}`,
      });
      expect(rowById(withResolver, ids.thenJs).branch?.label).toBe('Yes');
      expect(rowById(withResolver, ids.ifNode).branch?.label).toBe('start');
    });
  });

  describe('collapse', () => {
    const ids = WIREFRAME_NODE_IDS;

    it('hides descendants of a collapsed container but keeps numbers stable', () => {
      const { nodes, edges } = makeWireframeFixture();
      const collapsed = projectSequence(nodes, edges, { collapsedStepIds: new Set([ids.forEach]) });
      expect(rowById(collapsed, ids.forEach).collapsed).toBe(true);
      expect(rowById(collapsed, ids.forEach).visible).toBe(true);
      expect(rowById(collapsed, ids.ifNode).visible).toBe(false);
      expect(rowById(collapsed, ids.thenJs).visible).toBe(false);
      expect(rowById(collapsed, ids.sendMessage).visible).toBe(true);
      expect(rowById(collapsed, ids.forEach).stepNumber).toBe(3);
      expect(rowById(collapsed, ids.ifNode).stepNumber).toBe(4);
      expect(rowById(collapsed, ids.sendMessage).stepNumber).toBe(7);
    });

    it('collapsing a branch owner hides its lanes but not the owner', () => {
      const { nodes, edges } = makeWireframeFixture();
      const collapsed = projectSequence(nodes, edges, { collapsedStepIds: new Set([ids.ifNode]) });
      expect(rowById(collapsed, ids.ifNode).visible).toBe(true);
      expect(rowById(collapsed, ids.ifNode).collapsed).toBe(true);
      expect(rowById(collapsed, ids.thenJs).visible).toBe(false);
      expect(rowById(collapsed, ids.elseHttp).visible).toBe(false);
    });
  });

  describe('diamond merge (structured post-dominator)', () => {
    const projection = projectSequence(...toArgs(makeDiamondFixture()));

    it('emits the join node once at the branch owner depth', () => {
      expect(rowById(projection, 'd').depth).toBe(0);
      expect(projection.rows.filter((r) => r.nodeId === 'd')).toHaveLength(1);
      expect(rowById(projection, 'b').depth).toBe(1);
      expect(rowById(projection, 'c').depth).toBe(1);
    });

    it('draws merge-back connectors from both lane tails into the join, each still insertable', () => {
      expect(connector(projection, 'b', 'd').kind).toBe('merge-back');
      expect(connector(projection, 'c', 'd').kind).toBe('merge-back');
      expect(connector(projection, 'b', 'd').slot?.graphEdgeId).toBe('b-d');
      expect(connector(projection, 'c', 'd').slot?.graphEdgeId).toBe('c-d');
    });
  });

  describe('empty branch body', () => {
    const projection = projectSequence(...toArgs(makeEmptyBranchFixture()));

    it('produces exactly one insertion slot for the empty lane, carried by its connector', () => {
      const emptySlot = projection.slots.find((s) => s.id === 'slot:edge:if-c');
      expect(emptySlot).toBeDefined();
      expect(connector(projection, 'if', 'c').slot).toBe(emptySlot);
      expect(projection.slots.filter((s) => s.graphEdgeId === 'if-c')).toHaveLength(1);
      expect(emptySlot?.source).toEqual({ nodeId: 'if', handleId: 'false' });
      expect(emptySlot?.target).toEqual({ nodeId: 'c', handleId: 'input' });
    });

    it('still draws a labeled branch-entry connector to the join for the empty lane', () => {
      expect(connector(projection, 'if', 'c').kind).toBe('branch-entry');
      expect(connector(projection, 'if', 'c').label).toBe('Else');
    });

    it('preserves the split edge target handle in the empty-lane slot', () => {
      const { nodes, edges } = makeEmptyBranchFixture();
      const withHandle = edges.map((e) =>
        e.id === 'if-c' ? { ...e, targetHandle: 'special-in' } : e
      );
      const withHandleProjection = projectSequence(nodes, withHandle);
      const emptySlot = withHandleProjection.slots.find((s) => s.id === 'slot:edge:if-c');
      expect(emptySlot?.target).toEqual({ nodeId: 'c', handleId: 'special-in' });
    });
  });

  describe('empty manifest container', () => {
    it('renders an insertable Body lane placeholder when no structural child remains', () => {
      const container = {
        id: 'loop',
        type: 'uipath.control-flow.foreach',
        position: { x: 0, y: 0 },
        data: {},
      };
      const projection = projectSequence([container], [], {
        isContainerNode: (node) => node.id === 'loop',
      });
      expect(rowById(projection, 'loop').collapsible).toBe(true);
      const laneRow = projection.rows.find(
        (row) => row.lanePlaceholder?.id === 'slot:lane:loop:start'
      );
      expect(laneRow?.depth).toBe(1);
      expect(laneRow?.lanePlaceholder).toEqual({
        id: 'slot:lane:loop:start',
        source: { nodeId: 'loop', handleId: 'start' },
        containerId: 'loop',
      });
      expect(projection.slots).toContainEqual(laneRow?.lanePlaceholder);
      expect(connector(projection, 'loop', laneRow?.nodeId ?? '').kind).toBe('branch-entry');
    });
  });

  describe('declared branch lanes (getBranchHandles)', () => {
    const ifBranches = (node: { id: string }) =>
      node.id === 'if'
        ? [
            { id: 'true', label: 'Then' },
            { id: 'false', label: 'Else' },
          ]
        : [];

    it('renders every declared lane as a placeholder for a childless parent', () => {
      const ifNode = { id: 'if', type: 'if', position: { x: 0, y: 0 }, data: {} };
      const projection = projectSequence([ifNode], [], { getBranchHandles: ifBranches });
      const laneRows = projection.rows.filter((row) => row.lanePlaceholder);
      expect(laneRows.map((row) => row.lanePlaceholder?.id)).toEqual([
        'slot:lane:if:true',
        'slot:lane:if:false',
      ]);
      expect(laneRows.every((row) => row.depth === 1)).toBe(true);
      expect(laneRows.map((row) => row.branch?.label)).toEqual(['Then', 'Else']);
      expect(connector(projection, 'if', laneRows[0]?.nodeId ?? '').kind).toBe('branch-entry');
      expect(rowById(projection, 'if').isLeaf).toBeFalsy();
      expect(rowById(projection, 'if').collapsible).toBe(true);
    });

    it('makes every nested declared branch owner collapsible and hides only its descendants', () => {
      const nodes = [
        { id: 'outer', type: 'if', position: { x: 0, y: 0 }, data: {} },
        { id: 'middle', type: 'if', position: { x: 0, y: 100 }, data: {} },
        { id: 'inner', type: 'if', position: { x: 0, y: 200 }, data: {} },
      ];
      const edges = [
        { id: 'outer-middle', source: 'outer', sourceHandle: 'true', target: 'middle' },
        { id: 'middle-inner', source: 'middle', sourceHandle: 'true', target: 'inner' },
      ];
      const getBranchHandles = (node: Node) =>
        node.type === 'if'
          ? [
              { id: 'true', label: 'True' },
              { id: 'false', label: 'False' },
            ]
          : [];
      const projection = projectSequence(nodes, edges, {
        getBranchHandles,
        collapsedStepIds: new Set(['middle']),
      });

      expect(['outer', 'middle', 'inner'].map((id) => rowById(projection, id).collapsible)).toEqual(
        [true, true, true]
      );
      expect(rowById(projection, 'inner').visible).toBe(false);
      expect(
        projection.rows.find((row) => row.nodeId === '__sequential-lane__middle::false')?.visible
      ).toBe(false);
      expect(
        projection.rows.find((row) => row.nodeId === '__sequential-lane__outer::false')?.visible
      ).toBe(true);
    });

    it('uses bottom-anchored continuation geometry after a declared body lane', () => {
      const nodes = [
        { id: 'while', type: 'while', position: { x: 0, y: 0 }, data: {} },
        { id: 'next', position: { x: 0, y: 100 }, data: {} },
      ];
      const edges = [
        { id: 'while-next', source: 'while', sourceHandle: 'success', target: 'next' },
      ];
      const projection = projectSequence(nodes, edges, {
        getBranchHandles: (node) => (node.id === 'while' ? [{ id: 'body', label: 'Body' }] : []),
      });

      expect(projection.rows.map((row) => row.nodeId)).toEqual([
        'while',
        '__sequential-lane__while::body',
        'next',
      ]);
      expect(connector(projection, 'while', 'next').kind).toBe('merge-back');
    });

    it('walks a populated lane and adds the same placeholder after it as the empty lane', () => {
      const nodes = [
        { id: 'if', type: 'if', position: { x: 0, y: 0 }, data: {} },
        { id: 'x', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges = [{ id: 'e1', source: 'if', target: 'x', sourceHandle: 'true' }];
      const projection = projectSequence(nodes, edges, { getBranchHandles: ifBranches });
      expect(projection.rows.some((row) => row.nodeId === 'x')).toBe(true);
      const laneRows = projection.rows.filter((row) => row.lanePlaceholder);
      expect(laneRows.map((row) => row.lanePlaceholder?.id)).toEqual([
        'slot:leaf:x',
        'slot:lane:if:false',
      ]);
    });

    it('keeps an empty lane before a populated lane when that is the declared order', () => {
      const nodes = [
        { id: 'if', type: 'if', position: { x: 0, y: 0 }, data: {} },
        { id: 'x', position: { x: 0, y: 0 }, data: {} },
      ];
      const edges = [{ id: 'e1', source: 'if', target: 'x', sourceHandle: 'false' }];
      const projection = projectSequence(nodes, edges, { getBranchHandles: ifBranches });

      expect(projection.rows.map((row) => row.nodeId)).toEqual([
        'if',
        '__sequential-lane__if::true',
        'x',
        '__sequential-lane__x::__tail__',
      ]);
    });

    it('keeps an inserted decision downstream edge on the spine while every branch stays empty', () => {
      const nodes = [
        { id: 'a', position: { x: 0, y: 0 }, data: {} },
        { id: 'if', type: 'if', position: { x: 0, y: 100 }, data: {} },
        { id: 'b', position: { x: 0, y: 200 }, data: {} },
      ];
      const edges = [
        { id: 'a-if', source: 'a', target: 'if' },
        {
          id: 'if-b',
          source: 'if',
          sourceHandle: 'true',
          target: 'b',
          data: { [SEQ_CONTINUATION_EDGE_KEY]: true },
        },
      ];
      const projection = projectSequence(nodes, edges, { getBranchHandles: ifBranches });

      expect(projection.rows.map((row) => row.nodeId)).toEqual([
        'a',
        'if',
        '__sequential-lane__if::true',
        '__sequential-lane__if::false',
        'b',
      ]);
      expect(rowById(projection, 'b')).toMatchObject({ depth: 0, parentRowId: undefined });
      expect(connector(projection, 'if', 'b')).toMatchObject({
        kind: 'merge-back',
        slot: { continuation: true },
      });
    });

    it('keeps downstream nodes at the insertion level when adding a decision inside a branch', () => {
      const nodes = [
        { id: 'outer', type: 'if', position: { x: 0, y: 0 }, data: {} },
        { id: 'inserted', type: 'if', position: { x: 0, y: 100 }, data: {} },
        { id: 'downstream', position: { x: 0, y: 200 }, data: {} },
      ];
      const edges = [
        { id: 'outer-inserted', source: 'outer', sourceHandle: 'true', target: 'inserted' },
        {
          id: 'inserted-downstream',
          source: 'inserted',
          sourceHandle: 'true',
          target: 'downstream',
          data: { [SEQ_CONTINUATION_EDGE_KEY]: true },
        },
      ];
      const projection = projectSequence(nodes, edges, {
        getBranchHandles: (node) =>
          node.type === 'if'
            ? [
                { id: 'true', label: 'Then' },
                { id: 'false', label: 'Else' },
              ]
            : [],
      });

      expect(rowById(projection, 'inserted')).toMatchObject({ depth: 1, parentRowId: 'outer' });
      expect(rowById(projection, 'downstream')).toMatchObject({
        depth: 1,
        parentRowId: 'outer',
      });
      expect(projection.rows.filter((row) => row.parentRowId === 'inserted')).toEqual([
        expect.objectContaining({
          placeholderKind: 'lane',
          branch: expect.objectContaining({ handleId: 'true' }),
        }),
        expect.objectContaining({
          placeholderKind: 'lane',
          branch: expect.objectContaining({ handleId: 'false' }),
        }),
      ]);
    });
  });

  describe('nested branch merge detection (F1)', () => {
    const projection = projectSequence(...toArgs(makeNestedBranchFixture()));

    it('resolves the outer merge through the nested branch and emits it once at the owner depth', () => {
      expect(projection.rows.map((r) => r.nodeId)).toEqual(['a', 'if1', 'if2', 'b', 'c', 'm', 'z']);
      expect(rowById(projection, 'm').depth).toBe(0);
      expect(rowById(projection, 'm').parentRowId).toBeUndefined();
      expect(projection.rows.filter((r) => r.nodeId === 'm')).toHaveLength(1);
      expect(rowById(projection, 'z').depth).toBe(0);
    });

    it('draws merge-back connectors from both inner lane tails into the shared merge', () => {
      expect(connector(projection, 'b', 'm').kind).toBe('merge-back');
      expect(connector(projection, 'c', 'm').kind).toBe('merge-back');
    });

    it('renders the outer empty else lane as a legitimate branch-entry into the resolved merge', () => {
      expect(connector(projection, 'if1', 'm').kind).toBe('branch-entry');
    });

    it('continues the outer spine past the resolved merge instead of hiding it', () => {
      expect(connector(projection, 'm', 'z').kind).toBe('step');
    });

    it('keeps collapsing the outer branch owner from hiding the merge and downstream flow', () => {
      const { nodes, edges } = makeNestedBranchFixture();
      const collapsed = projectSequence(nodes, edges, { collapsedStepIds: new Set(['if1']) });
      expect(rowById(collapsed, 'm').visible).toBe(true);
      expect(rowById(collapsed, 'z').visible).toBe(true);
      expect(rowById(collapsed, 'if2').visible).toBe(false);
    });
  });

  describe('branch edge classification before rendering (F2/F9)', () => {
    it('renders a cycle closed through a branch out-edge as goto, never an insertable branch-entry', () => {
      const projection = projectSequence(...toArgs(makeBranchCycleFixture()));
      expect(connector(projection, 'b', 'a').kind).toBe('goto');
      expect(connector(projection, 'b', 'a').slot).toBeUndefined();
      expect(connector(projection, 'b', 'd').kind).toBe('branch-entry');
    });

    it('renders a branch edge into an already-visited node as goto, never an insertable branch-entry', () => {
      const projection = projectSequence(...toArgs(makeBranchVisitedTargetFixture()));
      expect(connector(projection, 'y', 'm').kind).toBe('goto');
      expect(connector(projection, 'y', 'm').slot).toBeUndefined();
      expect(connector(projection, 'if', 'm').kind).toBe('branch-entry');
    });
  });

  describe('multi-root', () => {
    const projection = projectSequence(...toArgs(makeMultiRootFixture()));

    it('stacks disconnected components ordered by flow y', () => {
      expect(projection.rows.map((r) => r.nodeId)).toEqual(['a', 'b', 'c', 'd']);
    });
  });

  describe('unstructured merge', () => {
    const projection = projectSequence(...toArgs(makeUnstructuredMergeFixture()));

    it('places the merge under the first incomer and gotos the rest', () => {
      expect(projection.rows.filter((r) => r.nodeId === 'm')).toHaveLength(1);
      expect(connector(projection, 'x', 'm').kind).toBe('step');
      expect(connector(projection, 'y', 'm').kind).toBe('goto');
      expect(connector(projection, 'y', 'm').slot).toBeUndefined();
    });
  });

  describe('cycles', () => {
    it('breaks a non-loopBack cycle with a goto', () => {
      const projection = projectSequence(...toArgs(makeCycleFixture()));
      expect(projection.rows.map((r) => r.nodeId)).toEqual(['a', 'b', 'c']);
      expect(connector(projection, 'c', 'a').kind).toBe('goto');
    });

    it('consumes a loopBack edge as loop closure, not a cycle', () => {
      const projection = projectSequence(...toArgs(makeLoopBackFixture()));
      expect(projection.rows.map((r) => r.nodeId)).toEqual(['a', 'b']);
      expect(projection.connectors.some((c) => c.kind === 'goto')).toBe(false);
    });
  });

  describe('orphans', () => {
    const projection = projectSequence(...toArgs(makeOrphanFixture()));

    it('appends disconnected nodes as de-emphasized trailing rows', () => {
      expect(projection.rows.map((r) => r.nodeId)).toEqual(['a', 'b', 'z']);
      expect(rowById(projection, 'z').depth).toBe(0);
      expect(rowById(projection, 'z').orphan).toBe(true);
    });
  });

  describe('deep nesting', () => {
    const projection = projectSequence(...toArgs(makeDeepNestingFixture()));

    it('accumulates depth across nested containers', () => {
      expect(rowById(projection, 'root').depth).toBe(0);
      expect(rowById(projection, 'c1').depth).toBe(0);
      expect(rowById(projection, 'c2').depth).toBe(1);
      expect(rowById(projection, 'leaf').depth).toBe(2);
      expect(rowById(projection, 'c1').collapsible).toBe(true);
      expect(rowById(projection, 'c2').collapsible).toBe(true);
      expect(rowById(projection, 'leaf').collapsible).toBe(false);
    });
  });

  describe('single-node graph is a trivial entry, not an orphan (F8)', () => {
    it('reports a single edge-less node as one numbered, non-orphan row', () => {
      const projection = projectSequence(...toArgs(makeSingleNodeFixture()));
      expect(projection.rows).toHaveLength(1);
      expect(projection.rows[0]?.nodeId).toBe('only');
      expect(projection.rows[0]?.stepNumber).toBe(1);
    });
  });

  describe('synthetic start ownership', () => {
    const trigger = {
      id: 'trigger',
      type: 'uipath.first-run',
      position: { x: 0, y: 0 },
      data: {},
    };
    const step = {
      id: 'step',
      type: 'uipath.script',
      position: { x: 0, y: 100 },
      data: {},
    };
    const edge = { id: 'trigger-step', source: 'trigger', target: 'step' };

    it('omits the canonical first-run node and its incident edge', () => {
      const projection = projectSequence([trigger, step], [edge]);
      expect(projection.rows.map((row) => row.nodeId)).toEqual(['step']);
      expect(projection.rows[0]?.stepNumber).toBe(1);
      expect(projection.connectors).toEqual([]);
    });

    it('supports host-defined trigger manifests without schema coupling', () => {
      const customTrigger = { ...trigger, id: 'custom', type: 'acme.trigger' };
      const projection = projectSequence([customTrigger, step], [{ ...edge, source: 'custom' }], {
        isStartNode: (node) => node.type === 'acme.trigger',
      });
      expect(projection.rows.map((row) => row.nodeId)).toEqual(['step']);
    });
  });

  describe('orphans form a trailing section (F11)', () => {
    it('never interleaves an orphan between two components ordered by flow y', () => {
      const projection = projectSequence(...toArgs(makeInterleavedOrphanFixture()));
      expect(projection.rows.map((r) => r.nodeId)).toEqual(['p1', 'p2', 'q1', 'q2', 'orphan']);
    });
  });

  describe('robustness', () => {
    it('returns an empty projection for an empty graph', () => {
      const projection = projectSequence([], []);
      expect(projection).toEqual({ rows: [], connectors: [], slots: [] });
    });

    it('never drops a node even when unreachable', () => {
      const { nodes, edges } = makeWireframeFixture();
      const projection = projectSequence(nodes, edges);
      const canonicalRowIds = new Set(
        projection.rows.filter((row) => !row.lanePlaceholder).map((row) => row.nodeId)
      );
      expect(canonicalRowIds).toEqual(
        new Set(nodes.filter((node) => node.type !== 'uipath.first-run').map((node) => node.id))
      );
    });
  });
});

/** Spreads a fixture into positional projectSequence args. */
function toArgs(
  fixture: ReturnType<typeof makeWireframeFixture>
): [typeof fixture.nodes, typeof fixture.edges] {
  return [fixture.nodes, fixture.edges];
}

function plain(id: string, y: number, parentId?: string): Node {
  return {
    id,
    type: 'uipath.script',
    position: { x: 0, y },
    data: {},
    ...(parentId ? { parentId } : {}),
  };
}
function wire(
  source: string,
  target: string,
  sourceHandle = 'output',
  targetHandle = 'input',
  id = `${source}-${target}`
) {
  return { id, source, target, sourceHandle, targetHandle };
}
const rowSummary = (projection: SequenceProjection): string =>
  projection.rows
    .map(
      (row) => `${row.nodeId}@${row.depth}${row.orphan ? '!' : ''}${row.lanePlaceholder ? '?' : ''}`
    )
    .join(' ');
const connectorSummary = (projection: SequenceProjection): string =>
  projection.connectors.map((c) => `${c.kind}:${c.sourceRowId}->${c.targetRowId}`).join(' ');

describe('projectSequence never silently drops a sequence edge', () => {
  it("draws a declared branch node's extra continuation edges as gotos instead of dropping them", () => {
    const nodes = [
      plain('a', 0),
      plain('if', 100),
      plain('p', 200),
      plain('q', 300),
      plain('t', 400),
    ];
    const edges = [wire('a', 'if'), wire('if', 't', 'true'), wire('if', 'p'), wire('if', 'q')];
    const projection = projectSequence(nodes, edges, {
      getBranchHandles: (node) =>
        node.id === 'if'
          ? [
              { id: 'true', label: 'Then' },
              { id: 'false', label: 'Else' },
            ]
          : [],
    });
    expect(connectorSummary(projection)).toContain('goto:if->p');
    expect(connectorSummary(projection)).toContain('goto:if->q');
    expect(projection.rows.map((row) => row.nodeId)).toEqual(
      expect.arrayContaining(['a', 'if', 't', 'p', 'q'])
    );
  });

  it('draws an edge crossing a container boundary as a goto', () => {
    const nodes = [plain('a', 0), plain('c', 100), plain('x', 0, 'c'), plain('b', 200)];
    const edges = [
      wire('a', 'c'),
      wire('c', 'x', 'start'),
      wire('c', 'b', 'success'),
      wire('a', 'x', 'output', 'input', 'cross'),
    ];
    const projection = projectSequence(nodes, edges);
    expect(connectorSummary(projection)).toContain('goto:a->x');
    expect(projection.connectors.find((c) => c.id === 'conn:goto:cross')?.slot).toBeUndefined();
  });

  it('does not draw a loop body\'s container-closing "continue" edge as a goto', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    expect(projection.connectors.some((c) => c.kind === 'goto')).toBe(false);
  });
});

describe('projectSequence container body with no entry (in-body cycle)', () => {
  it('walks the body from its first child in flow order and closes the cycle with a goto', () => {
    const nodes = [plain('a', 0), plain('c', 100), plain('x', 0, 'c'), plain('y', 50, 'c')];
    const edges = [wire('a', 'c'), wire('x', 'y'), wire('y', 'x')];
    const projection = projectSequence(nodes, edges);
    expect(rowSummary(projection)).toBe('a@0 c@0 x@1 y@1');
    expect(connectorSummary(projection)).toContain('branch-entry:c->x');
    expect(connectorSummary(projection)).toContain('goto:y->x');
    expect(projection.rows.some((row) => row.lanePlaceholder)).toBe(false);
  });
});

describe('projectSequence lane order is stable under editing', () => {
  it('keeps the Then lane above Else after an insert into the Then lane (no declared handles)', () => {
    const fixture = makeDiamondFixture();
    const before = projectSequence(fixture.nodes, fixture.edges);
    expect(before.rows.map((row) => row.nodeId)).toEqual(['a', 'if', 'b', 'c', 'd']);

    // An insert re-forms the Then edges and appends them to the array.
    const inserted = plain('new', 150);
    const edges = [
      ...fixture.edges.filter((edge) => edge.id !== 'if-b'),
      wire('if', 'new', 'true'),
      wire('new', 'b', 'output', 'input'),
    ];
    const after = projectSequence([...fixture.nodes, inserted], edges);
    expect(after.rows.map((row) => row.nodeId)).toEqual(['a', 'if', 'new', 'b', 'c', 'd']);
  });

  it('orders lanes by target flow position, then source handle, then edge id', () => {
    const nodes = [plain('if', 0), plain('low', 300), plain('high', 100)];
    const edges = [wire('if', 'low', 'x'), wire('if', 'high', 'y')];
    const projection = projectSequence(nodes, edges);
    const numbered = projection.rows.filter((row) => row.stepNumber !== undefined);
    expect(numbered.map((row) => row.nodeId)).toEqual(['if', 'high', 'low']);
  });
});

describe('projectSequence duplicate edges', () => {
  it('treats two edges over the same handles as one step, not two lanes', () => {
    const nodes = [plain('a', 0), plain('b', 10), plain('c', 20)];
    const edges = [
      wire('a', 'b', 'output', 'input', 'e1'),
      wire('a', 'b', 'output', 'input', 'e2'),
      wire('b', 'c'),
    ];
    const projection = projectSequence(nodes, edges);
    expect(rowSummary(projection)).toBe('a@0 b@0 c@0');
    expect(connectorSummary(projection)).toBe('step:a->b step:b->c');
    expect(rowById(projection, 'a').collapsible).toBe(false);
  });
});
