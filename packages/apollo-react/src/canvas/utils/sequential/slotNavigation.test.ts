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
  GraphChangeSet,
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
 * Node-set-plus-parentId and edge-endpoint (source/target only, NOT handles)
 * signature. Handles are deliberately excluded: an outdent/indent round-trip
 * can force a re-splice through a SYNTHETIC slot (no original edge left to
 * copy a handle from - see slotNavigation.ts's doc comment), which is a
 * documented best-effort default (`DEFAULT_SOURCE_HANDLE_ID`), not a
 * connectivity regression. `mutations.test.ts`'s own topologyKey compares
 * handles too, but its insertAtSlot/removeStep round-trip never hits that
 * synthetic path (removeStep's heal always copies the real neighboring
 * handles), so the two helpers are intentionally not identical.
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
      // "If" is the sole entry of For Each's body: its own incomer is a
      // branch-entry (container start), not a step, so it has no previous
      // SIBLING. That used to disable Move up outright; the row now moves up
      // and out instead, landing immediately before its owner (the For Each)
      // at the owner's own level, by splicing the owner's incoming seam.
      // (The view layer still disables all four directions for `If` itself,
      // since it is a bare branch owner - see sequentialMoveActions.ts.)
      const slot = findMoveUpSlot(projection, WIREFRAME_NODE_IDS.ifNode);
      expect(slot?.graphEdgeId).toBe('e-js-foreach');
      expect(slot?.source?.nodeId).toBe(WIREFRAME_NODE_IDS.javascript);
      expect(slot?.target?.nodeId).toBe(WIREFRAME_NODE_IDS.forEach);
    });

    it('moves a branch-lane row up and out to just before its branch owner', () => {
      // makeWireframeFixture: For Each [ If -> Then: Javascript 1 ]. Javascript 1
      // is first in the Then lane, so Move up exits the lane and lands before
      // the If, INSIDE For Each's body (the If's own incoming seam), not at the
      // top level.
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
      // The splice of A -> Container, i.e. "before the container, at the
      // container's own level".
      expect(slot?.graphEdgeId).toBe('chain-a-container');
      expect(slot?.source?.nodeId).toBe(ids.a);
      expect(slot?.target?.nodeId).toBe(ids.container);
      expect(slot?.containerId).toBeUndefined();
    });

    it('prepends before the owner when the owner is itself the first row of its scope', () => {
      // The only shape that reaches the up-and-out PREPEND fallback: the owner
      // has no incoming seam to splice, so there is nothing to insert into.
      // Container [ X ] -> B, with the container as the very first row.
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
      // Read off the owner's OUTGOING slot, the only one it has.
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
      // makeDiamondFixture: A -> If {true: B, false: C} -> D. D's only incomers
      // are the two lanes' merge-backs, which DO carry slots. Treating either as
      // a sibling link made Move up splice D into the Then lane (If -> D -> B),
      // stripping the lanes' merge and orphaning them. There is also no single
      // seam before a multi-incomer merge, so Move up is disabled.
      const fixture = makeDiamondFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findMoveUpSlot(projection, 'd')).toBeUndefined();
    });

    it('does not pull a merge node up two levels out of a nested branch (regression)', () => {
      const fixture = makeNestedBranchFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      // M merges If2's two lanes AND If1's Else edge (three incoming seams).
      expect(findMoveUpSlot(projection, 'm')).toBeUndefined();
      // Z follows M at the top level. Its lane predecessor IS M, but landing
      // "before M" would have to splice ONE of M's three incoming seams, which
      // would put Z on only one of the paths that reach M (the old behavior
      // spliced B -> Z -> M, dropping Z two levels down into If2's Then lane).
      expect(findMoveUpSlot(projection, 'z')).toBeUndefined();
    });

    it('does not pull the join of an empty branch into the populated lane (regression)', () => {
      const fixture = makeEmptyBranchFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findMoveUpSlot(projection, 'c')).toBeUndefined();
    });

    it('still treats a container’s own dashed continuation as a sibling link', () => {
      // The case that rules out fixing the leak by excluding `merge-back` by
      // kind: For Each -> Send Message is reclassified merge-back purely for
      // dashed rendering, but it is a genuine same-level spine link, so Send
      // Message's Move up must still swap it before the For Each.
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
      // http has no predecessor of its own: prepend directly before it
      // (target-only slot), not a source-based splice.
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
      // javascript's successor is the For Each container; moving past it
      // must land on the container's OWN outgoing seam (its "success" edge
      // to sendMessage), not its body-start edge.
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
      // makeDiamondFixture: A -> If {true: B, false: C} -> D. Moving A "down"
      // past If would require inserting at If's multi-incomer merge, which is
      // not a single-edge splice. The former fallback appended a new edge via
      // If's own source handle, injecting A as a THIRD branch of If and
      // orphaning it (the corruption browser QA caught). It must disable
      // instead.
      const fixture = makeDiamondFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      expect(findMoveDownSlot(projection, 'a')).toBeUndefined();
    });

    it('never steps a branch-lane row out to the top level through a merge-back (regression)', () => {
      // makeDiamondFixture: A -> If {true: B, false: C} -> D. B's only forward
      // connector is its lane's merge-back into D, which carries a slot: it read
      // as B's "next sibling", so Move down appended B after D at the ROOT
      // level, silently teleporting it out of the branch. B is now at the bottom
      // bound of its lane, so Move down resolves out of the lane (to after the
      // owner) instead, and the view layer refuses THAT because the owner is a
      // bare branch owner (see sequentialMoveActions.test.ts).
      const fixture = makeDiamondFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveDownSlot(projection, 'b');
      expect(slot?.source?.nodeId).not.toBe('d');
      expect(slot).toEqual(findOutdentSlot(projection, 'b'));
    });

    it('never steps a doubly-nested branch row out two levels through a merge-back (regression)', () => {
      // makeNestedBranchFixture: B sits at depth 2 in If2's Then lane, inside
      // If1's Then lane. Its merge-back into M read as a sibling link, so Move
      // down returned the top-level M -> Z splice: two levels out, skipping If1
      // entirely.
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
      // The splice of Container -> B, i.e. "after the container, at the
      // container's own level" - identical to Outdent, which it delegates to.
      expect(slot?.graphEdgeId).toBe('chain-container-b');
      expect(slot).toEqual(findOutdentSlot(projection, ids.y));
    });

    it('appends after the owner when the owner has no forward continuation of its own', () => {
      // makeDeepNestingFixture: Root -> C1 [ C2 [ Leaf ] ]. Neither container has
      // a next step, so both fall back to the append shape, each in ITS OWN
      // scope: Leaf lands after C2 inside C1, and C2 lands after C1 at the top.
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
      // The preserved counterpart of the merge-back leak: A's successor is the
      // container, and stepping past it must land on the container's OWN
      // outgoing seam (Container -> B), not inside its body.
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
      // Y's previous sibling is X, a plain leaf.
      expect(findIndentSlot(projection, ids.y)).toBeUndefined();
    });

    it('finds the tail of the preceding container’s linear body', () => {
      const ids = CONTAINER_CHAIN_NODE_IDS;
      const fixture = makeContainerChainFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findIndentSlot(projection, ids.b);
      expect(slot).toBeDefined();
      expect(slot?.source?.nodeId).toBe(ids.y); // the body's tail
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
      // makeMergedBranchBodyFixture: Container [ X -> If -> {P, Q} -> M ] -> N.
      // The body's last step is the merge M. The old connector walk could not
      // cross the branch - nothing but `branch-entry` is ever sourced at the If,
      // and the merge-backs into M are sourced at P/Q - so it stopped at the If
      // and appended from the If's OWN source handle, adding a third lane
      // instead of a step at the end of the body.
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

      // Pin the trap the row scan has to survive: the merge's trailing 'append'
      // placeholder is emitted at the SAME depth and owner as the real tail,
      // immediately after it, so an unfiltered scan would pick the placeholder.
      const mergeIndex = projection.rows.findIndex((row) => row.nodeId === ids.merge);
      const next = projection.rows[mergeIndex + 1];
      expect(next?.lanePlaceholder).toBeDefined();
      expect(next?.depth).toBe(projection.rows[mergeIndex]?.depth);
      expect(next?.parentRowId).toBe(ids.container);

      expect(findIndentSlot(projection, ids.after)?.source?.nodeId).toBe(ids.merge);
    });

    it('uses the FIRST lane’s tail for a multi-lane owner, even when the lanes share a handle', () => {
      // A container body with TWO entry lanes: [ X1 -> X2 ] and [ Y1 ]. Both
      // lanes' first rows carry `branch` metadata with the same 'start' handle
      // (the second entry has no start edge of its own), so the scan must end
      // the first lane on the PRESENCE of that metadata, not on a differing
      // handle id. Pins the documented first-lane-tail rule against the
      // row-order rewrite.
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
      // Premise: both lane heads really do share the 'start' handle.
      const laneHeads = projection.rows.filter((row) => row.branch !== undefined);
      expect(laneHeads.map((row) => row.nodeId)).toEqual(['x1', 'y1']);
      expect(new Set(laneHeads.map((row) => row.branch?.handleId))).toEqual(new Set(['start']));

      expect(findIndentSlot(projection, 'n')?.source?.nodeId).toBe('x2');
    });

    // A hand-built malformed projection whose body connectors CYCLE (body2 steps
    // back into body1), which `projectSequence` itself cannot produce (it turns a
    // cycle into a slot-less `goto`). The tail is now resolved from row order, so
    // cyclic connectors are simply irrelevant to it and the scan is a single
    // bounded pass over `rows` - strictly stronger than the seen-set guard the
    // old connector walk needed to avoid hanging the UI thread here. Retained,
    // with its explicit timeout, so a future reintroduction of a connector walk
    // fails fast instead of spinning on a keyboard/kebab code path.
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
          // The malformed part: body2 steps back into body1.
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
