import { describe, expect, it } from 'vitest';
import {
  CONTAINER_CHAIN_NODE_IDS,
  CROSS_CONTAINER_BRANCH_NODE_IDS,
  MERGED_BRANCH_BODY_NODE_IDS,
  makeContainerChainFixture,
  makeCrossContainerBranchFixture,
  makeDiamondFixture,
  makeEmptyBranchFixture,
  makeMergedBranchBodyFixture,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from '../../utils/sequential/fixtures';
import { projectSequence } from '../../utils/sequential/projectSequence';
import {
  appendSourceNodeId,
  findIndentSlot,
  findMoveUpSlot,
} from '../../utils/sequential/slotNavigation';
import {
  closesLoopToOwner,
  computeSequentialMoveOptions,
  getSequentialMoveSlot,
  isBareBranchOwner,
  resolveSlotForCommit,
  resolveTailInsertionSlot,
} from './sequentialMoveActions';

// Every fixture here uses `uipath.control-flow.foreach` for containers and
// `uipath.control-flow.decision` for branch owners (If/Switch); this stand-in
// registry check matches that convention rather than a real manifest lookup,
// since this module only needs a `nodeId => boolean` predicate.
const isForEachContainer = (nodeId: string, nodes: { id: string; type?: string }[]) =>
  nodes.find((n) => n.id === nodeId)?.type === 'uipath.control-flow.foreach';

describe('isBareBranchOwner', () => {
  it('is true for a Decision (branch owner, not a container)', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    expect(
      isBareBranchOwner(projection, WIREFRAME_NODE_IDS.ifNode, (id) =>
        isForEachContainer(id, nodes)
      )
    ).toBe(true);
  });

  it('is false for a For Each (container)', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    expect(
      isBareBranchOwner(projection, WIREFRAME_NODE_IDS.forEach, (id) =>
        isForEachContainer(id, nodes)
      )
    ).toBe(false);
  });

  it('is false for a plain leaf step', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    expect(
      isBareBranchOwner(projection, WIREFRAME_NODE_IDS.javascript, (id) =>
        isForEachContainer(id, nodes)
      )
    ).toBe(false);
  });
});

describe('computeSequentialMoveOptions', () => {
  it('disables ALL FOUR directions for a bare branch owner (If/Switch) that is the sole/first child of its container (wireframe)', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    const isContainerNode = (id: string) => isForEachContainer(id, nodes);

    const options = computeSequentialMoveOptions(
      projection,
      WIREFRAME_NODE_IDS.ifNode,
      isContainerNode
    );
    expect(options).toEqual({
      up: undefined,
      down: undefined,
      indent: undefined,
      outdent: undefined,
    });
  });

  it('disables ALL FOUR directions for a top-level bare branch owner, even though findMoveUpSlot ALONE would return a defined (unsound) slot', () => {
    // makeDiamondFixture: A -> If {true: B, false: C} -> D. A->If is a genuine
    // 'step' connector (A has a single outgoing edge), so `findMoveUpSlot`
    // does NOT naturally return undefined for `If` here the way it does for
    // the wireframe's `ifNode` (which is the FIRST/only child of its
    // container, reached only via a 'branch-entry' connector) -- this is
    // exactly the premise that makes this module's extra gate load-bearing
    // for Move Up (see isBareBranchOwner's doc comment).
    const { nodes, edges } = makeDiamondFixture();
    const projection = projectSequence(nodes, edges);
    const isContainerNode = (id: string) => isForEachContainer(id, nodes);

    expect(findMoveUpSlot(projection, 'if')).toBeDefined();

    const options = computeSequentialMoveOptions(projection, 'if', isContainerNode);
    expect(options).toEqual({
      up: undefined,
      down: undefined,
      indent: undefined,
      outdent: undefined,
    });
  });

  it('does not gate a container (For Each): outdent works normally for its body children', () => {
    const { nodes, edges } = makeContainerChainFixture();
    const projection = projectSequence(nodes, edges);
    const ids = CONTAINER_CHAIN_NODE_IDS;
    const isContainerNode = (id: string) => isForEachContainer(id, nodes);

    const options = computeSequentialMoveOptions(projection, ids.y, isContainerNode);
    expect(options.outdent).toBeDefined();
  });

  it('allows move up/down for a plain leaf step (javascript in the wireframe)', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    const isContainerNode = (id: string) => isForEachContainer(id, nodes);

    const options = computeSequentialMoveOptions(
      projection,
      WIREFRAME_NODE_IDS.javascript,
      isContainerNode
    );
    expect(options.up).toBeDefined();
    expect(options.down).toBeDefined();
  });

  it('does not synthesize an outdent seam for a branch-lane child', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    const options = computeSequentialMoveOptions(projection, WIREFRAME_NODE_IDS.thenJs, (id) =>
      isForEachContainer(id, nodes)
    );
    expect(options.outdent).toBeUndefined();
  });

  it('refuses an out-of-lane Move down under a bare branch owner, exactly as it refuses Outdent', () => {
    // makeDiamondFixture: A -> If {true: B, false: C} -> D. B is the sole row of
    // the Then lane, so BOTH "move down and out" and "move out" mean the same
    // thing: after the If. The If is a bare branch owner with no forward
    // continuation, so that seam has to be synthesized from its own source
    // handle, which reads as a THIRD LANE. `outdent` was already gated on this;
    // `down` was not, so Move down was a backdoor around the same guard (it
    // additionally used to teleport B to the top level - see
    // slotNavigation.test.ts). Both must now be disabled, together.
    const { nodes, edges } = makeDiamondFixture();
    const projection = projectSequence(nodes, edges);
    const options = computeSequentialMoveOptions(projection, 'b', (id) =>
      isForEachContainer(id, nodes)
    );
    expect(options.down).toBeUndefined();
    expect(options.outdent).toBeUndefined();
    // Move up is NOT gated: it splices the OWNER'S INCOMING seam (A -> If), so
    // the If only ever gains an incoming edge, never a competing lane.
    expect(options.up?.graphEdgeId).toBe('a-if');
  });

  it('keeps an in-lane Move down enabled even when the lane owner is a bare branch owner', () => {
    // The "when (and only when)" half of the gate: the owner being a bare branch
    // owner says nothing about a reorder BETWEEN two rows of its lane, which
    // never touches the owner's handles. A -> If {true: B1 -> B2, false: C} -> D.
    const nodes = [
      { id: 'a', type: 'uipath.script', position: { x: 0, y: 0 }, data: {} },
      { id: 'if', type: 'uipath.control-flow.decision', position: { x: 0, y: 100 }, data: {} },
      { id: 'b1', type: 'uipath.script', position: { x: 0, y: 200 }, data: {} },
      { id: 'b2', type: 'uipath.script', position: { x: 0, y: 300 }, data: {} },
      { id: 'c', type: 'uipath.script', position: { x: 0, y: 400 }, data: {} },
      { id: 'd', type: 'uipath.script', position: { x: 0, y: 500 }, data: {} },
    ];
    const edges = [
      { id: 'a-if', source: 'a', sourceHandle: 'output', target: 'if', targetHandle: 'input' },
      { id: 'if-b1', source: 'if', sourceHandle: 'true', target: 'b1', targetHandle: 'input' },
      { id: 'b1-b2', source: 'b1', sourceHandle: 'output', target: 'b2', targetHandle: 'input' },
      { id: 'b2-d', source: 'b2', sourceHandle: 'output', target: 'd', targetHandle: 'input' },
      { id: 'if-c', source: 'if', sourceHandle: 'false', target: 'c', targetHandle: 'input' },
      { id: 'c-d', source: 'c', sourceHandle: 'output', target: 'd', targetHandle: 'input' },
    ];
    const projection = projectSequence(nodes, edges);
    const isContainerNode = (id: string) => isForEachContainer(id, nodes);

    // B1 and B2 are genuine lane siblings (depth 1, both owned by the If).
    const b1 = computeSequentialMoveOptions(projection, 'b1', isContainerNode);
    expect(b1.down?.graphEdgeId).toBe('b2-d'); // swap to the end of the lane
    expect(b1.outdent).toBeUndefined(); // ...while leaving the lane is still refused

    const b2 = computeSequentialMoveOptions(projection, 'b2', isContainerNode);
    expect(b2.up?.graphEdgeId).toBe('if-b1'); // swap to the head of the lane
    expect(b2.down).toBeUndefined(); // bottom of the lane: out-of-lane, gated
  });

  it('allows Move down out of a REAL container body (the owner gate is bare-branch-only)', () => {
    const { nodes, edges } = makeContainerChainFixture();
    const projection = projectSequence(nodes, edges);
    const ids = CONTAINER_CHAIN_NODE_IDS;
    const options = computeSequentialMoveOptions(projection, ids.y, (id) =>
      isForEachContainer(id, nodes)
    );
    // Y is last in the body, so Move down leaves the lane - allowed here,
    // because a container HAS a real forward seam (Container -> B) to splice.
    expect(options.down?.graphEdgeId).toBe('chain-container-b');
    expect(options.down).toEqual(options.outdent);
  });

  it('offers Move up out of a branch lane while refusing Move down out of it', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    const options = computeSequentialMoveOptions(projection, WIREFRAME_NODE_IDS.thenJs, (id) =>
      isForEachContainer(id, nodes)
    );
    // Up lands before the If, inside For Each's body.
    expect(options.up?.graphEdgeId).toBe('e-foreach-if');
    expect(options.up?.containerId).toBe(WIREFRAME_NODE_IDS.forEach);
    // Down would have to synthesize a seam from the If's own source handle.
    expect(options.down).toBeUndefined();
    expect(options.outdent).toBeUndefined();
  });

  it('disables Indent when the target body’s tail is a bare branch owner', () => {
    // makeWireframeFixture: For Each's body ends with an `If` whose two lanes
    // dead-end at the container boundary (the loop-continue idiom), so the body
    // has no "after the If" position. `findIndentSlot` still resolves that tail
    // and returns an append from the If's own source handle; committing it adds a
    // THIRD LANE to the If rather than a step at the end of the body, so the view
    // layer refuses it. (With a registry-supplied `getBranchHandles` the same
    // edge WOULD be classified as the If's continuation, but only if the node
    // actually has a continuation handle, which a bare branch owner does not -
    // see computeSequentialMoveOptions' doc comment.)
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);

    const raw = findIndentSlot(projection, WIREFRAME_NODE_IDS.sendMessage);
    expect(raw?.source?.nodeId).toBe(WIREFRAME_NODE_IDS.ifNode);
    expect(raw?.graphEdgeId).toBeUndefined(); // append shape, not a splice

    const options = computeSequentialMoveOptions(projection, WIREFRAME_NODE_IDS.sendMessage, (id) =>
      isForEachContainer(id, nodes)
    );
    expect(options.indent).toBeUndefined();
  });

  it('allows Indent when the body’s branch REJOINS, landing after the merge', () => {
    // makeMergedBranchBodyFixture: Container [ X -> If -> {P, Q} -> M ] -> N.
    // The tail is the merge M, a plain step with a real forward handle, so the
    // append is sound and Indent stays enabled. This is the case the gate must
    // NOT swallow.
    const ids = MERGED_BRANCH_BODY_NODE_IDS;
    const { nodes, edges } = makeMergedBranchBodyFixture();
    const projection = projectSequence(nodes, edges);

    const options = computeSequentialMoveOptions(projection, ids.after, (id) =>
      isForEachContainer(id, nodes)
    );
    expect(options.indent?.source?.nodeId).toBe(ids.merge);
    expect(options.indent?.containerId).toBe(ids.container);
  });

  it('keys the Indent gate on the slot SHAPE, so a splice off a branch owner stays allowed', () => {
    // Only an append hands the source node a brand-new outgoing edge. A splice
    // reuses an edge that already leaves it, which is why the empty-lane indent
    // shape (the lane's own branch-entry edge, sourced at the branch owner) is
    // sound and must not be caught by the gate.
    const { nodes, edges } = makeEmptyBranchFixture();
    const projection = projectSequence(nodes, edges);
    const laneEdgeSlot = projection.connectors.find(
      (connector) => connector.kind === 'branch-entry' && connector.sourceRowId === 'if'
    )?.slot;
    expect(laneEdgeSlot?.source?.nodeId).toBe('if');
    expect(laneEdgeSlot?.graphEdgeId).toBeDefined();
    expect(appendSourceNodeId(laneEdgeSlot!)).toBeUndefined();

    // ...versus the two shapes the predicate does and does not claim.
    expect(appendSourceNodeId({ id: 's', source: { nodeId: 'n1' } })).toBe('n1');
    expect(appendSourceNodeId({ id: 's', target: { nodeId: 'n1' } })).toBeUndefined();
  });

  it('disables ALL FOUR directions for a bare branch owner nested across a container boundary (cross-container fixture)', () => {
    const { nodes, edges } = makeCrossContainerBranchFixture();
    const projection = projectSequence(nodes, edges);
    const ids = CROSS_CONTAINER_BRANCH_NODE_IDS;
    const isContainerNode = (id: string) => isForEachContainer(id, nodes);

    const options = computeSequentialMoveOptions(projection, ids.ifNode, isContainerNode);
    expect(options).toEqual({
      up: undefined,
      down: undefined,
      indent: undefined,
      outdent: undefined,
    });
  });
});

describe('closesLoopToOwner', () => {
  it('identifies the raw continue edge from a body tail back to its owner', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    expect(closesLoopToOwner(projection, WIREFRAME_NODE_IDS.thenJs, edges)).toBe(false);
    // The projected owner of Then is the If branch, not the For Each container;
    // branch protection above handles this shape. Verify the helper on a small
    // direct loop body where the row owner and close-edge target are identical.
    const directProjection = {
      ...projection,
      rows: projection.rows.map((row) =>
        row.nodeId === WIREFRAME_NODE_IDS.thenJs
          ? { ...row, parentRowId: WIREFRAME_NODE_IDS.forEach }
          : row
      ),
    };
    expect(closesLoopToOwner(directProjection, WIREFRAME_NODE_IDS.thenJs, edges)).toBe(true);
  });
});

describe('getSequentialMoveSlot', () => {
  it('reads the matching direction from a SequentialMoveOptions bag', () => {
    const options = {
      up: { id: 'up' },
      down: undefined,
      indent: { id: 'indent' },
      outdent: undefined,
    } as const;
    expect(getSequentialMoveSlot(options, 'up')).toEqual({ id: 'up' });
    expect(getSequentialMoveSlot(options, 'down')).toBeUndefined();
    expect(getSequentialMoveSlot(options, 'indent')).toEqual({ id: 'indent' });
    expect(getSequentialMoveSlot(options, 'outdent')).toBeUndefined();
  });
});

describe('resolveSlotForCommit', () => {
  const nodesById = new Map([
    ['n1', { id: 'n1', type: 'uipath.script', position: { x: 0, y: 0 } }],
  ]);

  it('replaces a synthesized DEFAULT_SOURCE_HANDLE_ID with the registry-resolved default source handle', () => {
    const slot = { id: 'slot', source: { nodeId: 'n1', handleId: 'output' } };
    const resolved = resolveSlotForCommit(slot, nodesById, () => 'real-output-handle');
    expect(resolved.source?.handleId).toBe('real-output-handle');
  });

  it('leaves the slot unchanged when the source handle is not the synthesized default', () => {
    const slot = { id: 'slot', source: { nodeId: 'n1', handleId: 'custom-handle' } };
    const resolved = resolveSlotForCommit(slot, nodesById, () => 'real-output-handle');
    expect(resolved).toBe(slot);
  });

  it('leaves the slot unchanged when the registry has nothing better to offer', () => {
    const slot = { id: 'slot', source: { nodeId: 'n1', handleId: 'output' } };
    const resolved = resolveSlotForCommit(slot, nodesById, () => undefined);
    expect(resolved).toBe(slot);
  });

  it('leaves a target-only slot (no source) unchanged', () => {
    const slot = { id: 'slot', target: { nodeId: 'n1' } };
    const resolved = resolveSlotForCommit(slot, nodesById, () => 'real-output-handle');
    expect(resolved).toBe(slot);
  });
});

describe('resolveTailInsertionSlot', () => {
  it('uses the terminal manifest default source handle and skips trailing orphans', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    projection.rows.push({
      nodeId: 'orphan',
      depth: 0,
      collapsible: false,
      collapsed: false,
      visible: true,
      orphan: true,
    });
    const slot = resolveTailInsertionSlot(
      projection,
      [...nodes, { id: 'orphan', type: 'orphan', position: { x: 0, y: 0 }, data: {} }],
      (type) => (type === 'uipath.send-message' ? 'success-port' : undefined)
    );
    expect(slot).toEqual({
      id: `slot:tail:${WIREFRAME_NODE_IDS.sendMessage}`,
      source: { nodeId: WIREFRAME_NODE_IDS.sendMessage, handleId: 'success-port' },
    });
  });

  it('uses the lone start node when the projected sequence is empty', () => {
    const start = {
      id: 'start',
      type: 'uipath.trigger.manual',
      position: { x: 0, y: 0 },
      data: {},
    };
    const projection = projectSequence([start], [], { isStartNode: () => true });

    const slot = resolveTailInsertionSlot(
      projection,
      [start],
      () => 'trigger-output',
      (node) => node.id === start.id
    );

    expect(slot).toEqual({
      id: 'slot:tail:start',
      source: { nodeId: 'start', handleId: 'trigger-output' },
    });
  });
});
