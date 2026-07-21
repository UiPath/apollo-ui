import { describe, expect, it } from 'vitest';
import {
  CONTAINER_CHAIN_NODE_IDS,
  CROSS_CONTAINER_BRANCH_NODE_IDS,
  makeContainerChainFixture,
  makeCrossContainerBranchFixture,
  makeDiamondFixture,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from '../../utils/sequential/fixtures';
import { projectSequence } from '../../utils/sequential/projectSequence';
import { findMoveUpSlot } from '../../utils/sequential/slotNavigation';
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
