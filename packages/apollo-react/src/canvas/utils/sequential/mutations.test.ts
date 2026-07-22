import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import type { GraphFixture } from './fixtures';
import {
  CONTAINER_CHAIN_NODE_IDS,
  CROSS_CONTAINER_BRANCH_NODE_IDS,
  makeContainerChainFixture,
  makeCrossContainerBranchFixture,
  makeDiamondFixture,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from './fixtures';
import { SEQ_CONTINUATION_EDGE_KEY } from './graph-helpers';
import { insertAtSlot, moveStep, moveSubtree, removeStep } from './mutations';
import { projectSequence } from './projectSequence';
import type { GraphChangeSet, InsertionSlot } from './sequential.types';
import { findMoveDownSlot, findMoveUpSlot, findOutdentSlot } from './slotNavigation';

function applyChangeSet(fixture: GraphFixture, changeSet: GraphChangeSet): GraphFixture {
  const removeNodes = new Set(changeSet.removeNodeIds);
  const removeEdges = new Set(changeSet.removeEdgeIds);
  return {
    nodes: [...fixture.nodes.filter((n) => !removeNodes.has(n.id)), ...changeSet.addNodes],
    edges: [...fixture.edges.filter((e) => !removeEdges.has(e.id)), ...changeSet.addEdges],
  };
}

/** Endpoint-and-node-set signature, ignoring edge ids and ordering. */
function topologyKey(fixture: GraphFixture): string {
  const nodeKey = fixture.nodes
    .map((n) => n.id)
    .sort()
    .join(',');
  const edgeKey = fixture.edges
    .map((e) => `${e.source}|${e.sourceHandle ?? ''}->${e.target}|${e.targetHandle ?? ''}`)
    .sort()
    .join(',');
  return `${nodeKey} # ${edgeKey}`;
}

/**
 * Node-set-plus-parentId and edge SOURCE/TARGET (no handles) signature, for
 * moveSubtree round-trips specifically: `moveStep`/`moveSubtree`'s splice
 * never preserves the MOVED node's own handle on a re-spliced edge (only the
 * OTHER endpoint's handle, copied from the target slot, survives - the
 * engine has no manifest access to know what the moved node's real handle
 * should be), so a moveDown-then-moveUp round-trip legitimately changes the
 * moved node's OWN handles even though connectivity is fully restored.
 */
function connectivityKey(fixture: GraphFixture): string {
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

function makeNode(id: string): Node {
  return { id, type: 'uipath.script', position: { x: 0, y: 0 }, data: {} };
}

function absolutePosition(node: Node, nodes: readonly Node[]): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  while (parentId) {
    const parent = nodes.find((candidate) => candidate.id === parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }
  return { x, y };
}

function firstStepSlot(fixture: GraphFixture): InsertionSlot {
  const projection = projectSequence(fixture.nodes, fixture.edges);
  const stepConnector = projection.connectors.find((c) => c.kind === 'step');
  if (!stepConnector?.slot) throw new Error('no step slot found');
  return stepConnector.slot;
}

describe('mutations', () => {
  describe('insertAtSlot', () => {
    it('splits the slot edge into two around the new node', () => {
      const fixture = makeWireframeFixture();
      const slot = firstStepSlot(fixture); // http -> javascript
      const changeSet = insertAtSlot(
        projectSequence(fixture.nodes, fixture.edges),
        slot,
        makeNode('new')
      );

      expect(changeSet.addNodes.map((n) => n.id)).toEqual(['new']);
      expect(changeSet.removeEdgeIds).toEqual([slot.graphEdgeId]);
      expect(changeSet.addEdges).toHaveLength(2);
      const [incoming, outgoing] = changeSet.addEdges as [Edge, Edge];
      expect(incoming.source).toBe(slot.source?.nodeId);
      expect(incoming.target).toBe('new');
      expect(outgoing.source).toBe('new');
      expect(outgoing.target).toBe(slot.target?.nodeId);
      expect(
        (incoming.data as Record<string, unknown> | undefined)?.[SEQ_CONTINUATION_EDGE_KEY]
      ).toBeUndefined();
      expect((outgoing.data as Record<string, unknown>)[SEQ_CONTINUATION_EDGE_KEY]).toBe(true);
    });

    it('preserves continuation semantics on both halves when splitting an existing continuation', () => {
      const fixture = makeWireframeFixture();
      const slot = { ...firstStepSlot(fixture), continuation: true };
      const changeSet = insertAtSlot(
        projectSequence(fixture.nodes, fixture.edges),
        slot,
        makeNode('new')
      );

      expect(changeSet.addEdges).toHaveLength(2);
      for (const edge of changeSet.addEdges) {
        expect((edge.data as Record<string, unknown>)[SEQ_CONTINUATION_EDGE_KEY]).toBe(true);
      }
    });

    it('stamps the container id as parentId when the slot is inside a container', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const branchSlot = projection.connectors.find((c) => c.kind === 'branch-entry')?.slot;
      expect(branchSlot?.containerId).toBe(WIREFRAME_NODE_IDS.forEach);
      const changeSet = insertAtSlot(projection, branchSlot!, makeNode('inserted'));
      expect(changeSet.addNodes[0]?.parentId).toBe(WIREFRAME_NODE_IDS.forEach);
    });

    it('appends with a single edge when the slot has no target', () => {
      const fixture = makeWireframeFixture();
      const slot: InsertionSlot = {
        id: 'append',
        source: { nodeId: 'send-message', handleId: 'output' },
      };
      const changeSet = insertAtSlot(
        projectSequence(fixture.nodes, fixture.edges),
        slot,
        makeNode('tail')
      );
      expect(changeSet.removeEdgeIds).toEqual([]);
      expect(changeSet.addEdges).toHaveLength(1);
      expect(changeSet.addEdges[0]?.source).toBe('send-message');
      expect(changeSet.addEdges[0]?.target).toBe('tail');
    });
  });

  describe('removeStep', () => {
    it('heals the seam by reconnecting the incomer to the outgoer', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const changeSet = removeStep(projection, WIREFRAME_NODE_IDS.javascript);

      expect(changeSet.removeNodeIds).toEqual([WIREFRAME_NODE_IDS.javascript]);
      expect(changeSet.addEdges).toHaveLength(1);
      expect(changeSet.addEdges[0]?.source).toBe(WIREFRAME_NODE_IDS.http);
      expect(changeSet.addEdges[0]?.target).toBe(WIREFRAME_NODE_IDS.forEach);
    });

    it('adds no healing edge when removing a terminal node', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const changeSet = removeStep(projection, WIREFRAME_NODE_IDS.sendMessage);
      expect(changeSet.addEdges).toEqual([]);
      expect(changeSet.removeNodeIds).toEqual([WIREFRAME_NODE_IDS.sendMessage]);
    });

    it('cascades a container removal to its descendants and every incident raw edge (F3)', () => {
      // Removing the wireframe's "for-each" container without passing the raw
      // graph must still be well-defined for the single-node case, but its
      // descendants (if / javascript-1 / http-request-1) and the body-internal
      // "continue" edges (which never became connectors at all, since
      // forwardOut filters them out of the forward walk) can only be cleaned
      // up when the raw graph is supplied.
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const changeSet = removeStep(projection, WIREFRAME_NODE_IDS.forEach, fixture);

      expect(new Set(changeSet.removeNodeIds)).toEqual(
        new Set([
          WIREFRAME_NODE_IDS.forEach,
          WIREFRAME_NODE_IDS.ifNode,
          WIREFRAME_NODE_IDS.thenJs,
          WIREFRAME_NODE_IDS.elseHttp,
        ])
      );
      // Every raw edge touching the container or a descendant is removed,
      // including the "continue" edges that never appeared as connectors.
      expect(new Set(changeSet.removeEdgeIds)).toEqual(
        new Set([
          'e-js-foreach',
          'e-foreach-if',
          'e-if-then',
          'e-if-else',
          'e-then-continue',
          'e-else-continue',
          'e-foreach-send',
        ])
      );
      // Only the container's own incomer/outgoer seam is healed.
      expect(changeSet.addEdges).toHaveLength(1);
      expect(changeSet.addEdges[0]?.source).toBe(WIREFRAME_NODE_IDS.javascript);
      expect(changeSet.addEdges[0]?.target).toBe(WIREFRAME_NODE_IDS.sendMessage);

      // The resulting graph is a clean, valid, fully-connected sequence with
      // no dangling parentId references or edges pointing at removed nodes.
      const healed = applyChangeSet(fixture, changeSet);
      const survivingIds = new Set(healed.nodes.map((n) => n.id));
      expect(survivingIds).toEqual(
        new Set([
          WIREFRAME_NODE_IDS.http,
          WIREFRAME_NODE_IDS.javascript,
          WIREFRAME_NODE_IDS.sendMessage,
        ])
      );
      for (const node of healed.nodes) {
        expect(node.parentId === undefined || survivingIds.has(node.parentId)).toBe(true);
      }
      for (const edge of healed.edges) {
        expect(survivingIds.has(edge.source)).toBe(true);
        expect(survivingIds.has(edge.target)).toBe(true);
      }
    });

    it('removes a branch owner with its projected lanes and heals to the merge', () => {
      const fixture = makeDiamondFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const changeSet = removeStep(projection, 'if', fixture);

      expect(new Set(changeSet.removeNodeIds)).toEqual(new Set(['if', 'b', 'c']));
      expect(new Set(changeSet.removeEdgeIds)).toEqual(
        new Set(['a-if', 'if-b', 'if-c', 'b-d', 'c-d'])
      );
      expect(changeSet.addEdges).toHaveLength(1);
      expect(changeSet.addEdges[0]).toMatchObject({
        source: 'a',
        sourceHandle: 'output',
        target: 'd',
        targetHandle: 'input',
      });

      const healed = applyChangeSet(fixture, changeSet);
      expect(healed.nodes.map((node) => node.id).sort()).toEqual(['a', 'd']);
      expect(healed.edges).toHaveLength(1);
    });

    it('never emits synthetic empty-lane placeholder ids as canonical removals', () => {
      const branch = { id: 'if', type: 'if', position: { x: 0, y: 0 }, data: {} };
      const projection = projectSequence([branch], [], {
        getBranchHandles: () => [
          { id: 'true', label: 'Then' },
          { id: 'false', label: 'Else' },
        ],
      });

      expect(removeStep(projection, 'if').removeNodeIds).toEqual(['if']);
    });

    it('does not create a container self-loop when removing a branch that closes to its owner', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const changeSet = removeStep(projection, WIREFRAME_NODE_IDS.ifNode, fixture);

      expect(new Set(changeSet.removeNodeIds)).toEqual(
        new Set([WIREFRAME_NODE_IDS.ifNode, WIREFRAME_NODE_IDS.thenJs, WIREFRAME_NODE_IDS.elseHttp])
      );
      expect(changeSet.addEdges).toEqual([]);
      const healed = applyChangeSet(fixture, changeSet);
      expect(healed.edges.some((edge) => edge.source === edge.target)).toBe(false);
      expect(healed.nodes.some((node) => node.id === WIREFRAME_NODE_IDS.forEach)).toBe(true);
      const reprojected = projectSequence(healed.nodes, healed.edges, {
        isContainerNode: (node) => node.id === WIREFRAME_NODE_IDS.forEach,
      });
      // The now-empty container body renders a "+ Add step" lane placeholder row
      // carrying the insert slot (replacing the old bare slot:empty).
      const laneRow = reprojected.rows.find(
        (row) => row.lanePlaceholder?.id === `slot:lane:${WIREFRAME_NODE_IDS.forEach}:start`
      );
      expect(laneRow?.lanePlaceholder).toEqual({
        id: `slot:lane:${WIREFRAME_NODE_IDS.forEach}:start`,
        source: { nodeId: WIREFRAME_NODE_IDS.forEach, handleId: 'start' },
        containerId: WIREFRAME_NODE_IDS.forEach,
      });
    });
  });

  describe('moveStep', () => {
    it('preserves the node set (adds and removes no nodes)', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const target = firstStepSlot(fixture);
      const changeSet = moveStep(projection, WIREFRAME_NODE_IDS.sendMessage, target);
      expect(changeSet.addNodes).toEqual([]);
      expect(changeSet.removeNodeIds).toEqual([]);
      const next = applyChangeSet(fixture, changeSet);
      expect(next.nodes.map((n) => n.id).sort()).toEqual(fixture.nodes.map((n) => n.id).sort());
    });

    it('no-ops instead of creating a self-loop when the target slot is the node own incoming edge (F7)', () => {
      // X -> A -> B -> C; moveStep(B, slot of edge A->B) is a degenerate
      // "move to where it already is" (reachable from Move Up at the top of a
      // lane). It must not splice a b->b self-loop or orphan C.
      const nodes = ['x', 'a', 'b', 'c'].map(makeNode);
      const edges: Edge[] = [
        { id: 'x-a', source: 'x', target: 'a', type: 'default' },
        { id: 'a-b', source: 'a', target: 'b', type: 'default' },
        { id: 'b-c', source: 'b', target: 'c', type: 'default' },
      ];
      const projection = projectSequence(nodes, edges);
      const ownSlot = projection.connectors.find(
        (c) => c.sourceRowId === 'a' && c.targetRowId === 'b'
      )?.slot;
      expect(ownSlot).toBeDefined();

      const changeSet = moveStep(projection, 'b', ownSlot!);
      expect(changeSet).toEqual({
        addNodes: [],
        addEdges: [],
        removeNodeIds: [],
        removeEdgeIds: [],
      });
    });

    it('no-ops when the target slot references the moved node directly', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const selfTargetSlot: InsertionSlot = {
        id: 'probe',
        source: { nodeId: WIREFRAME_NODE_IDS.javascript },
        target: { nodeId: WIREFRAME_NODE_IDS.javascript },
      };
      const changeSet = moveStep(projection, WIREFRAME_NODE_IDS.javascript, selfTargetSlot);
      expect(changeSet).toEqual({
        addNodes: [],
        addEdges: [],
        removeNodeIds: [],
        removeEdgeIds: [],
      });
    });
  });

  describe('moveSubtree', () => {
    it('moves a For Each with its whole body up past a preceding sibling (topology, seam, subtree intact)', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveUpSlot(projection, WIREFRAME_NODE_IDS.forEach);
      expect(slot).toBeDefined(); // http -> javascript, javascript's own incoming slot

      const changeSet = moveSubtree(projection, WIREFRAME_NODE_IDS.forEach, slot!, fixture);
      // The container node itself is untouched (no parentId change: it was
      // and remains top-level), and none of its descendants are touched.
      expect(changeSet.removeNodeIds).toEqual([]);
      expect(changeSet.addNodes).toEqual([]);
      // Origin seam healed (javascript now feeds directly into sendMessage)
      // and target seam spliced (http -> forEach -> javascript).
      expect(new Set(changeSet.removeEdgeIds)).toEqual(
        new Set(['e-js-foreach', 'e-foreach-send', 'e-http-js'])
      );
      const bySignature = (e: Edge): string => `${e.source}->${e.target}`;
      expect(new Set(changeSet.addEdges.map(bySignature))).toEqual(
        new Set([
          `${WIREFRAME_NODE_IDS.javascript}->${WIREFRAME_NODE_IDS.sendMessage}`,
          `${WIREFRAME_NODE_IDS.http}->${WIREFRAME_NODE_IDS.forEach}`,
          `${WIREFRAME_NODE_IDS.forEach}->${WIREFRAME_NODE_IDS.javascript}`,
        ])
      );

      const moved = applyChangeSet(fixture, changeSet);
      const movedProjection = projectSequence(moved.nodes, moved.edges);
      const rowOrder = movedProjection.rows.filter((r) => r.visible).map((r) => r.nodeId);
      expect(rowOrder.slice(0, 2)).toEqual([WIREFRAME_NODE_IDS.http, WIREFRAME_NODE_IDS.forEach]);
      expect(rowOrder).toContain(WIREFRAME_NODE_IDS.javascript);
      expect(rowOrder).toContain(WIREFRAME_NODE_IDS.sendMessage);
      // Descendants and body-internal branch-entry connectors are intact,
      // and every descendant's parentId is unchanged (still forEach).
      expect(rowOrder).toEqual(
        expect.arrayContaining([
          WIREFRAME_NODE_IDS.ifNode,
          WIREFRAME_NODE_IDS.thenJs,
          WIREFRAME_NODE_IDS.elseHttp,
        ])
      );
      for (const id of [
        WIREFRAME_NODE_IDS.ifNode,
        WIREFRAME_NODE_IDS.thenJs,
        WIREFRAME_NODE_IDS.elseHttp,
      ]) {
        expect(moved.nodes.find((n) => n.id === id)?.parentId).toBe(WIREFRAME_NODE_IDS.forEach);
      }
      // D7: renumbered in the new pre-order.
      const stepNumberOf = (id: string): number | undefined =>
        movedProjection.rows.find((r) => r.nodeId === id)?.stepNumber;
      expect(stepNumberOf(WIREFRAME_NODE_IDS.http)).toBe(1);
      expect(stepNumberOf(WIREFRAME_NODE_IDS.forEach)).toBe(2);
      expect(stepNumberOf(WIREFRAME_NODE_IDS.javascript)).toBeGreaterThan(
        stepNumberOf(WIREFRAME_NODE_IDS.forEach)!
      );
    });

    it('moves a For Each with its whole body down past a following sibling', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveDownSlot(projection, WIREFRAME_NODE_IDS.forEach);
      expect(slot).toBeDefined();

      const changeSet = moveSubtree(projection, WIREFRAME_NODE_IDS.forEach, slot!, fixture);
      expect(changeSet.removeNodeIds).toEqual([]);
      const moved = applyChangeSet(fixture, changeSet);
      const movedProjection = projectSequence(moved.nodes, moved.edges);

      const order = movedProjection.rows.filter((r) => r.depth === 0).map((r) => r.nodeId);
      expect(order.indexOf(WIREFRAME_NODE_IDS.sendMessage)).toBeLessThan(
        order.indexOf(WIREFRAME_NODE_IDS.forEach)
      );
      for (const id of [
        WIREFRAME_NODE_IDS.ifNode,
        WIREFRAME_NODE_IDS.thenJs,
        WIREFRAME_NODE_IDS.elseHttp,
      ]) {
        expect(moved.nodes.find((n) => n.id === id)?.parentId).toBe(WIREFRAME_NODE_IDS.forEach);
      }
    });

    it('round-trips: moveDown then moveUp restores the original topology', () => {
      const base = makeWireframeFixture();
      const baseProjection = projectSequence(base.nodes, base.edges);
      const downSlot = findMoveDownSlot(baseProjection, WIREFRAME_NODE_IDS.forEach);
      const down = applyChangeSet(
        base,
        moveSubtree(baseProjection, WIREFRAME_NODE_IDS.forEach, downSlot!, base)
      );

      const downProjection = projectSequence(down.nodes, down.edges);
      const upSlot = findMoveUpSlot(downProjection, WIREFRAME_NODE_IDS.forEach);
      const restored = applyChangeSet(
        down,
        moveSubtree(downProjection, WIREFRAME_NODE_IDS.forEach, upSlot!, down)
      );

      expect(connectivityKey(restored)).toBe(connectivityKey(base));
    });

    it('no-ops when the target slot is inside the moved container’s own subtree', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const innerSlot = projection.connectors.find(
        (c) => c.kind === 'branch-entry' && c.sourceRowId === WIREFRAME_NODE_IDS.ifNode
      )?.slot;
      expect(innerSlot?.containerId).toBe(WIREFRAME_NODE_IDS.forEach);

      const changeSet = moveSubtree(projection, WIREFRAME_NODE_IDS.forEach, innerSlot!, fixture);
      expect(changeSet).toEqual({
        addNodes: [],
        addEdges: [],
        removeNodeIds: [],
        removeEdgeIds: [],
      });
    });

    it('no-ops when the target references the moved node directly', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const selfSlot: InsertionSlot = {
        id: 'probe',
        source: { nodeId: WIREFRAME_NODE_IDS.forEach },
      };
      const changeSet = moveSubtree(projection, WIREFRAME_NODE_IDS.forEach, selfSlot, fixture);
      expect(changeSet).toEqual({
        addNodes: [],
        addEdges: [],
        removeNodeIds: [],
        removeEdgeIds: [],
      });
    });

    it('outdents a step out of a container body to just after the container', () => {
      const ids = CONTAINER_CHAIN_NODE_IDS;
      const fixture = makeContainerChainFixture();
      fixture.nodes = fixture.nodes.map((node) => {
        if (node.id === ids.container) return { ...node, position: { x: 100, y: 200 } };
        if (node.id === ids.y) {
          return {
            ...node,
            position: { x: 25, y: 75 },
            extent: 'parent' as const,
            expandParent: true,
          };
        }
        return node;
      });
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findOutdentSlot(projection, ids.y);
      expect(slot).toBeDefined();

      const changeSet = moveSubtree(projection, ids.y, slot!, fixture);
      expect(changeSet.removeNodeIds).toEqual([ids.y]);
      expect(changeSet.addNodes[0]).toMatchObject({ position: { x: 125, y: 275 } });
      expect(changeSet.addNodes[0]?.parentId).toBeUndefined();
      expect(changeSet.addNodes[0]?.extent).toBeUndefined();
      expect(changeSet.addNodes[0]?.expandParent).toBeUndefined();

      const moved = applyChangeSet(fixture, changeSet);
      const movedProjection = projectSequence(moved.nodes, moved.edges);
      const order = movedProjection.rows.map((r) => r.nodeId);
      expect(order.indexOf(ids.container)).toBeLessThan(order.indexOf(ids.y));
      expect(order.indexOf(ids.y)).toBeLessThan(order.indexOf(ids.b));
      expect(moved.nodes.find((n) => n.id === ids.x)?.parentId).toBe(ids.container);
    });

    it('relocates a bare branch owner WITH its lane content across a container boundary', () => {
      const ids = CROSS_CONTAINER_BRANCH_NODE_IDS;
      const fixture = makeCrossContainerBranchFixture();
      fixture.nodes = fixture.nodes.map((node) => {
        if (node.id === ids.c1) return { ...node, position: { x: 100, y: 200 } };
        if (node.id === ids.c2) return { ...node, position: { x: 500, y: 700 } };
        if (node.id === ids.ifNode) return { ...node, expandParent: true };
        return node;
      });
      const absoluteBefore = new Map(
        [ids.ifNode, ids.thenLeaf, ids.elseLeaf].map((id) => {
          const node = fixture.nodes.find((candidate) => candidate.id === id)!;
          return [id, absolutePosition(node, fixture.nodes)] as const;
        })
      );
      const projection = projectSequence(fixture.nodes, fixture.edges);
      // Append after C2's Filler: a source-only slot, so the splice only ADDS
      // an incoming edge to `If` and never a competing outgoing one.
      const appendAfterFiller: InsertionSlot = {
        id: 'probe',
        source: { nodeId: ids.filler, handleId: 'output' },
        containerId: ids.c2,
      };

      const changeSet = moveSubtree(projection, ids.ifNode, appendAfterFiller, fixture);
      expect(new Set(changeSet.removeNodeIds)).toEqual(
        new Set([ids.ifNode, ids.thenLeaf, ids.elseLeaf])
      );
      const moved = applyChangeSet(fixture, changeSet);
      for (const node of changeSet.addNodes) {
        expect(node.parentId).toBe(ids.c2);
        expect(node.extent).toBe('parent');
        expect(absolutePosition(node, moved.nodes)).toEqual(absoluteBefore.get(node.id));
      }
      expect(changeSet.addNodes.find((node) => node.id === ids.ifNode)?.expandParent).toBe(true);

      const movedProjection = projectSequence(moved.nodes, moved.edges);
      expect(moved.nodes.find((n) => n.id === ids.thenLeaf)?.parentId).toBe(ids.c2);
      expect(moved.nodes.find((n) => n.id === ids.elseLeaf)?.parentId).toBe(ids.c2);
      const c1Row = movedProjection.rows.find((r) => r.nodeId === ids.c1);
      expect(c1Row?.collapsible).toBe(false); // c1's body is now empty
    });

    it('moveStep delegates to moveSubtree for a collapsible node, producing an identical result', () => {
      const fixture = makeWireframeFixture();
      const projection = projectSequence(fixture.nodes, fixture.edges);
      const slot = findMoveUpSlot(projection, WIREFRAME_NODE_IDS.forEach)!;
      const viaMoveStep = moveStep(projection, WIREFRAME_NODE_IDS.forEach, slot, fixture);
      const viaMoveSubtree = moveSubtree(projection, WIREFRAME_NODE_IDS.forEach, slot, fixture);
      expect(viaMoveStep).toEqual(viaMoveSubtree);
    });
  });

  describe('property: insertAtSlot then removeStep is a topology identity', () => {
    for (const [name, factory] of [
      ['wireframe', makeWireframeFixture],
      ['diamond', makeDiamondFixture],
    ] as const) {
      it(`${name}: every step/merge-back slot round-trips`, () => {
        const base = factory();
        const baseProjection = projectSequence(base.nodes, base.edges);
        // Includes 'merge-back': the wireframe's For Each -> Send Message
        // container-continuation carries a real slot (defect 5), so it must
        // round-trip identically to a plain 'step' slot. Diamond's own
        // merge-backs (b->d, c->d) carry no slot and are excluded by the
        // `c.slot` check regardless, unaffected by widening past 'step'.
        const stepSlots = baseProjection.connectors
          .filter((c) => c.kind !== 'branch-entry' && c.kind !== 'goto' && c.slot)
          .map((c) => c.slot as InsertionSlot);
        expect(stepSlots.length).toBeGreaterThan(0);

        for (const slot of stepSlots) {
          const inserted = applyChangeSet(
            base,
            insertAtSlot(baseProjection, slot, makeNode('probe'))
          );
          const insertedProjection = projectSequence(inserted.nodes, inserted.edges);
          const healed = applyChangeSet(inserted, removeStep(insertedProjection, 'probe'));
          expect(topologyKey(healed), `slot ${slot.id}`).toBe(topologyKey(base));
        }
      });
    }
  });
});
