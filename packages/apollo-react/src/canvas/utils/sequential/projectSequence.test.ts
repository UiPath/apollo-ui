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
      // Branch-lane terminals and the top-level tail are leaves.
      expect(rowById(projection, ids.thenJs).isLeaf).toBe(true);
      expect(rowById(projection, ids.elseHttp).isLeaf).toBe(true);
      expect(rowById(projection, ids.sendMessage).isLeaf).toBe(true);
      // Mid-chain rows, containers, and branch sources are never leaves.
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

    it('renders the container-continuation out of For Each as a dashed merge-back that still carries an insertable slot', () => {
      // Per the concept wireframe, the edge leaving a container AFTER its
      // indented body (here: For Each -> Send Message) visually rejoins the
      // spine from the body, exactly like a branch lane's merge-back - so it
      // must be classified 'merge-back' (dashed), NOT 'step' (solid), even
      // though it is still a genuine single-edge spine continuation and so,
      // unlike an ordinary branch merge-back, keeps its InsertionSlot.
      const forEachToSend = connector(projection, ids.forEach, ids.sendMessage);
      expect(forEachToSend.kind).toBe('merge-back');
      expect(forEachToSend.slot).toBeDefined();
      expect(forEachToSend.slot?.graphEdgeId).toBe('e-foreach-send');

      // A plain step between two non-container same-depth rows is untouched:
      // http -> javascript stays 'step'.
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
      // Container start handle resolves through the resolver too.
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
      // Numbering is unchanged from the expanded projection (D7).
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

    it('draws merge-back connectors from both lane tails into the join', () => {
      expect(connector(projection, 'b', 'd').kind).toBe('merge-back');
      expect(connector(projection, 'c', 'd').kind).toBe('merge-back');
      expect(connector(projection, 'b', 'd').slot).toBeUndefined();
    });
  });

  describe('empty branch body', () => {
    const projection = projectSequence(...toArgs(makeEmptyBranchFixture()));

    it('produces an empty-branch-body insertion slot for the empty lane', () => {
      // Id is disambiguated with the edge id (F12) so two default-handle
      // branches from the same owner can never collide on one slot.
      const emptySlot = projection.slots.find((s) => s.id === 'slot:empty:if:false:if-c');
      expect(emptySlot).toBeDefined();
      expect(emptySlot?.source).toEqual({ nodeId: 'if', handleId: 'false' });
      // Target is built from the edge itself, so it always carries the split
      // edge's own targetHandle ('input' here) rather than being dropped
      // whenever the merge happens to be undefined.
      expect(emptySlot?.target).toEqual({ nodeId: 'c', handleId: 'input' });
    });

    it('still draws a labeled branch-entry connector to the join for the empty lane', () => {
      expect(connector(projection, 'if', 'c').kind).toBe('branch-entry');
      expect(connector(projection, 'if', 'c').label).toBe('Else');
    });

    it('preserves the split edge target handle in the empty-lane slot', () => {
      // Regression for F4: the slot must come from the edge, not from
      // `merge`, so a targetHandle on the branch edge survives.
      const { nodes, edges } = makeEmptyBranchFixture();
      const withHandle = edges.map((e) =>
        e.id === 'if-c' ? { ...e, targetHandle: 'special-in' } : e
      );
      const withHandleProjection = projectSequence(nodes, withHandle);
      const emptySlot = withHandleProjection.slots.find((s) => s.id === 'slot:empty:if:false:if-c');
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
      // The empty body is a "+ Add step" lane placeholder row entered mid-left.
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
      // The If is a branch parent, never a leaf.
      expect(rowById(projection, 'if').isLeaf).toBeFalsy();
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
      // The sibling branch that doesn't close a cycle still renders normally.
      expect(connector(projection, 'b', 'd').kind).toBe('branch-entry');
    });

    it('renders a branch edge into an already-visited node as goto, never an insertable branch-entry', () => {
      const projection = projectSequence(...toArgs(makeBranchVisitedTargetFixture()));
      expect(connector(projection, 'y', 'm').kind).toBe('goto');
      expect(connector(projection, 'y', 'm').slot).toBeUndefined();
      // The lane that legitimately reaches M first still renders normally.
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
      expect(canonicalRowIds).toEqual(new Set(nodes.map((node) => node.id)));
    });
  });
});

/** Spreads a fixture into positional projectSequence args. */
function toArgs(
  fixture: ReturnType<typeof makeWireframeFixture>
): [typeof fixture.nodes, typeof fixture.edges] {
  return [fixture.nodes, fixture.edges];
}
