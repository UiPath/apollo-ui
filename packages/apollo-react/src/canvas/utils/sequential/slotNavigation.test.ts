import { describe, expect, it } from 'vitest';
import type { GraphFixture } from './fixtures';
import {
  applyGraphChangeSet,
  CONTAINER_CHAIN_NODE_IDS,
  MERGED_BRANCH_BODY_NODE_IDS,
  makeContainerChainFixture,
  makeDeepNestingFixture,
  makeDiamondFixture,
  makeEmptyBranchFixture,
  makeMergedBranchBodyFixture,
  makeNestedBranchFixture,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from './fixtures';
import { moveSubtree } from './mutations';
import { projectSequence } from './projectSequence';
import type {
  InsertionSlot,
  SequenceConnector,
  SequenceProjection,
  SequenceRow,
} from './sequential.types';
import {
  findIndentSlot,
  findMoveDownSlot,
  findMoveUpSlot,
  findOutdentSlot,
} from './slotNavigation';

/**
 * Node-set-plus-parentId and edge source/target signature. Handles are excluded: a
 * round-trip through a synthetic slot falls back to the default source handle.
 */
function topologyKey(fixture: GraphFixture): string {
  const nodeKey = fixture.nodes
    .map((n) => `${n.id}@${n.parentId ?? ''}`)
    .sort()
    .join(',');
  const edgeKey = fixture.edges
    .map((e) => `${e.source}->${e.target}`)
    .sort()
    .join(',');
  return `${nodeKey} # ${edgeKey}`;
}

describe('slotNavigation', () => {
  describe('findMoveUpSlot', () => {
    it('returns undefined for the very first row', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findMoveUpSlot(projection, WIREFRAME_NODE_IDS.http)).toBeUndefined();
    });

    it('moves up and OUT when the row is first in its lane (was: disabled)', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      // If is the sole body entry of For Each, so it lands on the owner's incoming seam.
      const slot = findMoveUpSlot(projection, WIREFRAME_NODE_IDS.ifNode);
      expect(slot?.graphEdgeId).toBe('e-js-foreach');
      expect(slot?.source?.nodeId).toBe(WIREFRAME_NODE_IDS.javascript);
      expect(slot?.target?.nodeId).toBe(WIREFRAME_NODE_IDS.forEach);
    });

    it('moves a branch-lane row up and out to just before its branch owner', () => {
      // Lands inside For Each's body (the If's incoming seam), not at the top level.
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveUpSlot(projection, WIREFRAME_NODE_IDS.thenJs);
      expect(slot?.graphEdgeId).toBe('e-foreach-if');
      expect(slot?.containerId).toBe(WIREFRAME_NODE_IDS.forEach);
    });

    it('moves the first row of a container body up and out to before the container', () => {
      const ids = CONTAINER_CHAIN_NODE_IDS;
      const fixture = makeContainerChainFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveUpSlot(projection, ids.x);
      expect(slot?.graphEdgeId).toBe('chain-a-container');
      expect(slot?.source?.nodeId).toBe(ids.a);
      expect(slot?.target?.nodeId).toBe(ids.container);
      expect(slot?.containerId).toBeUndefined();
    });

    it('prepends before the owner when the owner is itself the first row of its scope', () => {
      // Container [ X ] -> B: the owner has no incoming seam to splice.
      const fixture: GraphFixture = {
        nodes: [
          { id: 'c', type: 'uipath.control-flow.foreach', position: { x: 0, y: 0 }, data: {} },
          { id: 'x', type: 'uipath.script', position: { x: 0, y: 0 }, parentId: 'c', data: {} },
          { id: 'b', type: 'uipath.script', position: { x: 0, y: 200 }, data: {} },
        ],
        edges: [
          { id: 'c-x', source: 'c', sourceHandle: 'start', target: 'x', targetHandle: 'input' },
          { id: 'c-b', source: 'c', sourceHandle: 'success', target: 'b', targetHandle: 'input' },
        ],
      };
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveUpSlot(projection, 'x');
      expect(slot?.target?.nodeId).toBe('c');
      expect(slot?.source).toBeUndefined();
      expect(slot?.containerId).toBeUndefined();

      const moved = applyGraphChangeSet(fixture, moveSubtree(projection, 'x', slot!, fixture));
      const movedProjection = projectSequence(moved.nodes, moved.edges);
      expect(movedProjection.rows.filter((r) => !r.lanePlaceholder).map((r) => r.nodeId)).toEqual([
        'x',
        'c',
        'b',
      ]);
      expect(moved.nodes.find((n) => n.id === 'x')?.parentId).toBeUndefined();
    });

    it('does not pull a merge node into a branch lane (regression: merge-back is not a sibling link)', () => {
      // D's only incomers are slot-bearing merge-backs; treating one as a sibling
      // link spliced D into the Then lane.
      const fixture = makeDiamondFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findMoveUpSlot(projection, 'd')).toBeUndefined();
    });

    it('does not pull a merge node up two levels out of a nested branch (regression)', () => {
      const fixture = makeNestedBranchFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      // M has three incoming seams; landing "before M" would splice only one of them.
      expect(findMoveUpSlot(projection, 'm')).toBeUndefined();
      expect(findMoveUpSlot(projection, 'z')).toBeUndefined();
    });

    it('does not pull the join of an empty branch into the populated lane (regression)', () => {
      const fixture = makeEmptyBranchFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findMoveUpSlot(projection, 'c')).toBeUndefined();
    });

    it('still treats a container’s own dashed continuation as a sibling link', () => {
      // For Each -> Send Message is a merge-back by kind but a genuine same-level link.
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveUpSlot(projection, WIREFRAME_NODE_IDS.sendMessage);
      expect(slot?.graphEdgeId).toBe('e-js-foreach');
      expect(slot?.source?.nodeId).toBe(WIREFRAME_NODE_IDS.javascript);
      expect(slot?.target?.nodeId).toBe(WIREFRAME_NODE_IDS.forEach);
    });

    it('finds the slot that swaps a plain step before its predecessor', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveUpSlot(projection, WIREFRAME_NODE_IDS.javascript);
      expect(slot).toBeDefined();
      expect(slot?.target?.nodeId).toBe(WIREFRAME_NODE_IDS.http);
      expect(slot?.source?.nodeId).toBeUndefined();

      const changeSet = moveSubtree(projection, WIREFRAME_NODE_IDS.javascript, slot!, fixture);
      const moved = applyGraphChangeSet(fixture, changeSet);
      const movedProjection = projectSequence(moved.nodes, moved.edges);
      const order = movedProjection.rows.filter((r) => r.depth === 0).map((r) => r.nodeId);
      expect(order.slice(0, 2)).toEqual([WIREFRAME_NODE_IDS.javascript, WIREFRAME_NODE_IDS.http]);
    });
  });

  describe('findMoveDownSlot', () => {
    it('returns undefined for the very last row', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findMoveDownSlot(projection, WIREFRAME_NODE_IDS.sendMessage)).toBeUndefined();
    });

    it('finds the slot that swaps a plain step after its successor, including past a container', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveDownSlot(projection, WIREFRAME_NODE_IDS.javascript);
      expect(slot).toBeDefined();
      // Lands on the container's own outgoing seam, not its body-start edge.
      expect(slot?.source?.nodeId).toBe(WIREFRAME_NODE_IDS.forEach);
      expect(slot?.target?.nodeId).toBe(WIREFRAME_NODE_IDS.sendMessage);

      const changeSet = moveSubtree(projection, WIREFRAME_NODE_IDS.javascript, slot!, fixture);
      const moved = applyGraphChangeSet(fixture, changeSet);
      const movedProjection = projectSequence(moved.nodes, moved.edges);
      const order = movedProjection.rows.filter((r) => r.depth === 0).map((r) => r.nodeId);
      expect(order).toEqual([
        WIREFRAME_NODE_IDS.http,
        WIREFRAME_NODE_IDS.forEach,
        WIREFRAME_NODE_IDS.javascript,
        WIREFRAME_NODE_IDS.sendMessage,
      ]);
    });

    it('returns undefined rather than an unsound slot when the next sibling is a bare branch owner', () => {
      // Appending via If's own source handle would inject A as a third branch.
      const fixture = makeDiamondFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findMoveDownSlot(projection, 'a')).toBeUndefined();
    });

    it('never steps a branch-lane row out to the top level through a merge-back (regression)', () => {
      // B's merge-back into D carries a slot and used to read as its next sibling.
      const fixture = makeDiamondFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveDownSlot(projection, 'b');
      expect(slot?.source?.nodeId).not.toBe('d');
      expect(slot).toEqual(findOutdentSlot(projection, 'b'));
    });

    it('never steps a doubly-nested branch row out two levels through a merge-back (regression)', () => {
      const fixture = makeNestedBranchFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveDownSlot(projection, 'b');
      expect(slot?.graphEdgeId).not.toBe('m-z');
      expect(slot).toEqual(findOutdentSlot(projection, 'b'));
    });

    it('moves the last row of a container body down and out to just after the container', () => {
      const ids = CONTAINER_CHAIN_NODE_IDS;
      const fixture = makeContainerChainFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveDownSlot(projection, ids.y);
      expect(slot?.graphEdgeId).toBe('chain-container-b');
      expect(slot).toEqual(findOutdentSlot(projection, ids.y));
    });

    it('appends after the owner when the owner has no forward continuation of its own', () => {
      // Each append lands in the owner's own scope: Leaf after C2 inside C1, C2 after C1 at top.
      const fixture = makeDeepNestingFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);

      const leafSlot = findMoveDownSlot(projection, 'leaf');
      expect(leafSlot?.source?.nodeId).toBe('c2');
      expect(leafSlot?.target).toBeUndefined();
      expect(leafSlot?.containerId).toBe('c1');

      const c2Slot = findMoveDownSlot(projection, 'c2');
      expect(c2Slot?.source?.nodeId).toBe('c1');
      expect(c2Slot?.containerId).toBeUndefined();
    });

    it('still steps past a container through its own dashed continuation', () => {
      const ids = CONTAINER_CHAIN_NODE_IDS;
      const fixture = makeContainerChainFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveDownSlot(projection, ids.a);
      expect(slot?.graphEdgeId).toBe('chain-container-b');
      expect(slot?.source?.nodeId).toBe(ids.container);
    });
  });

  describe('findOutdentSlot', () => {
    it('returns undefined for a top-level row', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findOutdentSlot(projection, WIREFRAME_NODE_IDS.http)).toBeUndefined();
    });

    it('lands on the container’s own outgoing seam when the owner has a real next step', () => {
      const ids = CONTAINER_CHAIN_NODE_IDS;
      const fixture = makeContainerChainFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findOutdentSlot(projection, ids.x);
      expect(slot?.source?.nodeId).toBe(ids.container);
      expect(slot?.target?.nodeId).toBe(ids.b);
      expect(slot?.graphEdgeId).toBe('chain-container-b');
    });
  });

  describe('findIndentSlot', () => {
    it('returns undefined when there is no previous sibling', () => {
      const fixture = makeContainerChainFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findIndentSlot(projection, CONTAINER_CHAIN_NODE_IDS.a)).toBeUndefined();
    });

    it('returns undefined when the previous sibling is not collapsible', () => {
      const ids = CONTAINER_CHAIN_NODE_IDS;
      const fixture = makeContainerChainFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findIndentSlot(projection, ids.y)).toBeUndefined();
    });

    it('finds the tail of the preceding container’s linear body', () => {
      const ids = CONTAINER_CHAIN_NODE_IDS;
      const fixture = makeContainerChainFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findIndentSlot(projection, ids.b);
      expect(slot).toBeDefined();
      expect(slot?.source?.nodeId).toBe(ids.y);
      expect(slot?.containerId).toBe(ids.container);

      const changeSet = moveSubtree(projection, ids.b, slot!, fixture);
      expect(changeSet.removeNodeIds).toEqual([ids.b]);
      expect(changeSet.addNodes[0]?.parentId).toBe(ids.container);

      const moved = applyGraphChangeSet(fixture, changeSet);
      const movedProjection = projectSequence(moved.nodes, moved.edges);
      const containerRow = movedProjection.rows.find((r) => r.nodeId === ids.container);
      const bRow = movedProjection.rows.find((r) => r.nodeId === ids.b);
      expect(bRow?.parentRowId).toBe(ids.container);
      expect(bRow?.depth).toBe((containerRow?.depth ?? 0) + 1);
    });

    it('resolves the tail ACROSS a branch that rejoins inside the body (regression)', () => {
      const ids = MERGED_BRANCH_BODY_NODE_IDS;
      const fixture = makeMergedBranchBodyFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);

      const slot = findIndentSlot(projection, ids.after);
      expect(slot?.source?.nodeId).toBe(ids.merge);
      expect(slot?.source?.nodeId).not.toBe(ids.ifNode);
      expect(slot?.containerId).toBe(ids.container);
      expect(slot?.id).toBe(`slot:indentTail:${ids.container}:${ids.merge}`);
    });

    it('excludes trailing add-step placeholder rows from tail selection', () => {
      const ids = MERGED_BRANCH_BODY_NODE_IDS;
      const fixture = makeMergedBranchBodyFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);

      // The append placeholder sits right after the tail at the same depth and owner.
      const mergeIndex = projection.rows.findIndex((row) => row.nodeId === ids.merge);
      const next = projection.rows[mergeIndex + 1];
      expect(next?.lanePlaceholder).toBeDefined();
      expect(next?.depth).toBe(projection.rows[mergeIndex]?.depth);
      expect(next?.parentRowId).toBe(ids.container);

      expect(findIndentSlot(projection, ids.after)?.source?.nodeId).toBe(ids.merge);
    });

    it('uses the FIRST lane’s tail for a multi-lane owner, even when the lanes share a handle', () => {
      // Two entry lanes [ X1 -> X2 ] and [ Y1 ] whose heads share the 'start' handle.
      const fixture: GraphFixture = {
        nodes: [
          { id: 'c', type: 'uipath.control-flow.foreach', position: { x: 0, y: 0 }, data: {} },
          { id: 'x1', type: 'uipath.script', position: { x: 0, y: 0 }, parentId: 'c', data: {} },
          { id: 'x2', type: 'uipath.script', position: { x: 0, y: 100 }, parentId: 'c', data: {} },
          { id: 'y1', type: 'uipath.script', position: { x: 0, y: 200 }, parentId: 'c', data: {} },
          { id: 'n', type: 'uipath.script', position: { x: 0, y: 400 }, data: {} },
        ],
        edges: [
          { id: 'c-x1', source: 'c', sourceHandle: 'start', target: 'x1', targetHandle: 'input' },
          {
            id: 'x1-x2',
            source: 'x1',
            sourceHandle: 'output',
            target: 'x2',
            targetHandle: 'input',
          },
          { id: 'c-n', source: 'c', sourceHandle: 'success', target: 'n', targetHandle: 'input' },
        ],
      };
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const laneHeads = projection.rows.filter((row) => row.branch !== undefined);
      expect(laneHeads.map((row) => row.nodeId)).toEqual(['x1', 'y1']);
      expect(new Set(laneHeads.map((row) => row.branch?.handleId))).toEqual(new Set(['start']));

      expect(findIndentSlot(projection, 'n')?.source?.nodeId).toBe('x2');
    });

    // Hand-built malformed projection with cycling body connectors, which
    // `projectSequence` cannot produce. The timeout makes a connector walk fail fast.
    it('resolves the tail from row order even when the lane body’s connectors cycle', () => {
      const row = (nodeId: string, extra: Partial<SequenceRow> = {}): SequenceRow => ({
        nodeId,
        depth: 0,
        collapsible: false,
        collapsed: false,
        visible: true,
        ...extra,
      });
      const slot = (id: string, sourceNodeId: string): InsertionSlot => ({
        id,
        source: { nodeId: sourceNodeId },
        containerId: 'container',
      });
      const connector = (
        id: string,
        kind: SequenceConnector['kind'],
        sourceRowId: string,
        targetRowId: string
      ): SequenceConnector => ({
        id,
        kind,
        sourceRowId,
        targetRowId,
        slot: slot(`slot:${id}`, sourceRowId),
      });

      const projection: SequenceProjection = {
        rows: [
          row('container', { collapsible: true }),
          row('body1', { depth: 1, parentRowId: 'container' }),
          row('body2', { depth: 1, parentRowId: 'container' }),
          row('target'),
        ],
        connectors: [
          connector('c-entry', 'branch-entry', 'container', 'body1'),
          connector('c-body1-body2', 'step', 'body1', 'body2'),
          connector('c-body2-body1', 'step', 'body2', 'body1'),
          connector('c-container-target', 'step', 'container', 'target'),
        ],
        slots: [],
      };

      const indentSlot = findIndentSlot(projection, 'target');
      expect(indentSlot?.source?.nodeId).toBe('body2');
      expect(indentSlot?.id).toBe('slot:indentTail:container:body2');
    }, 1000);
  });

  describe('round-trip: indent then outdent restores topology', () => {
    it('container chain fixture', () => {
      const ids = CONTAINER_CHAIN_NODE_IDS;
      const base = makeContainerChainFixture();
      const baseProjection = projectSequence(base.nodes, base.edges);

      const indentSlot = findIndentSlot(baseProjection, ids.b)!;
      const indented = applyGraphChangeSet(
        base,
        moveSubtree(baseProjection, ids.b, indentSlot, base)
      );
      const indentedProjection = projectSequence(indented.nodes, indented.edges);

      const outdentSlot = findOutdentSlot(indentedProjection, ids.b)!;
      const restored = applyGraphChangeSet(
        indented,
        moveSubtree(indentedProjection, ids.b, outdentSlot, indented)
      );

      expect(topologyKey(restored)).toBe(topologyKey(base));
    });
  });
});
