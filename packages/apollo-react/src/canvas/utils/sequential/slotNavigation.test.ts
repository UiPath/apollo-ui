import { describe, expect, it } from 'vitest';
import type { GraphFixture } from './fixtures';
import {
  CONTAINER_CHAIN_NODE_IDS,
  makeContainerChainFixture,
  makeDiamondFixture,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from './fixtures';
import { moveSubtree } from './mutations';
import { projectSequence } from './projectSequence';
import type { GraphChangeSet } from './sequential.types';
import {
  findIndentSlot,
  findMoveDownSlot,
  findMoveUpSlot,
  findOutdentSlot,
} from './slotNavigation';

function applyChangeSet(fixture: GraphFixture, changeSet: GraphChangeSet): GraphFixture {
  const removeNodes = new Set(changeSet.removeNodeIds);
  const removeEdges = new Set(changeSet.removeEdgeIds);
  return {
    nodes: [...fixture.nodes.filter((n) => !removeNodes.has(n.id)), ...changeSet.addNodes],
    edges: [...fixture.edges.filter((e) => !removeEdges.has(e.id)), ...changeSet.addEdges],
  };
}

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

    it('returns undefined when the row has no step-connected predecessor (first-in-lane)', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      // "If" is the sole entry of For Each's body: its own incomer is a
      // branch-entry (container start), not a step - it has no "previous
      // sibling" to move above.
      expect(findMoveUpSlot(projection, WIREFRAME_NODE_IDS.ifNode)).toBeUndefined();
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
      const moved = applyChangeSet(fixture, changeSet);
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
      const moved = applyChangeSet(fixture, changeSet);
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

      const moved = applyChangeSet(fixture, changeSet);
      const movedProjection = projectSequence(moved.nodes, moved.edges);
      const containerRow = movedProjection.rows.find((r) => r.nodeId === ids.container);
      const bRow = movedProjection.rows.find((r) => r.nodeId === ids.b);
      expect(bRow?.parentRowId).toBe(ids.container);
      expect(bRow?.depth).toBe((containerRow?.depth ?? 0) + 1);
    });
  });

  describe('round-trip: indent then outdent restores topology', () => {
    it('container chain fixture', () => {
      const ids = CONTAINER_CHAIN_NODE_IDS;
      const base = makeContainerChainFixture();
      const baseProjection = projectSequence(base.nodes, base.edges);

      const indentSlot = findIndentSlot(baseProjection, ids.b)!;
      const indented = applyChangeSet(base, moveSubtree(baseProjection, ids.b, indentSlot, base));
      const indentedProjection = projectSequence(indented.nodes, indented.edges);

      const outdentSlot = findOutdentSlot(indentedProjection, ids.b)!;
      const restored = applyChangeSet(
        indented,
        moveSubtree(indentedProjection, ids.b, outdentSlot, indented)
      );

      expect(topologyKey(restored)).toBe(topologyKey(base));
    });
  });
});
