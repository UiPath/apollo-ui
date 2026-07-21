import type { Edge, Node, ReactFlowInstance } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SOURCE_HANDLE_ID,
  DEFAULT_TARGET_HANDLE_ID,
  SEQ_BAR_HEIGHT,
  SEQ_BAR_WIDTH,
  SEQ_PLACEHOLDER_NODE_TYPE,
  SEQ_START_NODE_TYPE,
} from '../../../constants';
import { SEQ_CONTINUATION_EDGE_KEY } from '../../../utils/sequential/graph-helpers';
import type { InsertionSlot } from '../../../utils/sequential/sequential.types';
import { SEQUENTIAL_BAR_HANDLE_IDS } from '../nodes';
import {
  buildSequentialPreviewOptions,
  getSequentialIgnoredNodeTypes,
  type PendingSequentialInsert,
  resolvePendingSequentialInsert,
  SEQ_INSERTED_FLAG,
  SEQUENTIAL_IGNORED_NODE_TYPES,
  sequentialOnBeforeNodeAdded,
} from './sequentialInsert';

const FAKE_UUID = '00000000-0000-0000-0000-000000000001';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SEQUENTIAL_IGNORED_NODE_TYPES', () => {
  it('lists exactly the synthetic sequential row types (clones keep real types)', () => {
    expect(SEQUENTIAL_IGNORED_NODE_TYPES).toEqual([SEQ_START_NODE_TYPE, SEQ_PLACEHOLDER_NODE_TYPE]);
  });

  it('merges host extras into a fresh array', () => {
    const merged = getSequentialIgnoredNodeTypes(['sticky']);
    expect(merged).toEqual([...SEQUENTIAL_IGNORED_NODE_TYPES, 'sticky']);
    expect(merged).not.toBe(SEQUENTIAL_IGNORED_NODE_TYPES);
  });
});

describe('sequentialOnBeforeNodeAdded', () => {
  const previousId = 'uipath.slack-1720000000000';

  const seedNode = (): Node =>
    ({
      id: previousId,
      type: 'uipath.slack',
      position: { x: 420, y: 96 },
      data: { label: 'Slack', display: { label: 'Send message' } },
    }) as Node;

  const seedEdges = (): Edge[] => [
    {
      id: `edge_srcA-output-${previousId}-input`,
      source: 'srcA',
      sourceHandle: 'output',
      target: previousId,
      targetHandle: 'input',
      type: 'default',
    } as Edge,
    {
      id: `edge_${previousId}-output-tgtB-input`,
      source: previousId,
      sourceHandle: 'output',
      target: 'tgtB',
      targetHandle: 'input',
      type: 'default',
    } as Edge,
  ];

  it('re-ids the node with crypto.randomUUID()', () => {
    const spy = vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
    const { newNode } = sequentialOnBeforeNodeAdded(seedNode(), seedEdges());
    expect(spy).toHaveBeenCalledTimes(1);
    expect(newNode.id).toBe(FAKE_UUID);
  });

  it('keeps the preview-derived position and does not force draggable false', () => {
    // The sequential clone derivation (useSequentialGraph) already stamps
    // draggable:false on every row unconditionally, so onBeforeNodeAdded must
    // not also write it into canonical state, or it leaks permanently once the
    // user toggles back to flow view (synthesizePositionsForFlow only clears it
    // on that boundary; nothing clears it while still in sequential view).
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
    const seed = seedNode();
    const { newNode } = sequentialOnBeforeNodeAdded(seed, seedEdges());
    expect(newNode.position).toEqual(seed.position);
    expect(newNode.draggable).toBeUndefined();
  });

  it('stamps seqInserted while preserving existing data and type', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
    const { newNode } = sequentialOnBeforeNodeAdded(seedNode(), seedEdges());
    expect(newNode.type).toBe('uipath.slack');
    expect((newNode.data as Record<string, unknown>)[SEQ_INSERTED_FLAG]).toBe(true);
    expect((newNode.data as Record<string, unknown>).label).toBe('Slack');
  });

  it('rewrites edges that reference the seed id and regenerates their ids', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
    const { newEdges } = sequentialOnBeforeNodeAdded(seedNode(), seedEdges());

    const incoming = newEdges.find((edge) => edge.source === 'srcA');
    const outgoing = newEdges.find((edge) => edge.target === 'tgtB');

    expect(incoming?.target).toBe(FAKE_UUID);
    expect(incoming?.id).toBe(`edge_srcA-output-${FAKE_UUID}-input`);
    expect(outgoing?.source).toBe(FAKE_UUID);
    expect(outgoing?.id).toBe(`edge_${FAKE_UUID}-output-tgtB-input`);
  });

  it('leaves an unrelated edge untouched by reference', () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
    const unrelated = {
      id: 'edge_x-output-y-input',
      source: 'x',
      target: 'y',
      type: 'default',
    } as Edge;
    const { newEdges } = sequentialOnBeforeNodeAdded(seedNode(), [unrelated]);
    expect(newEdges[0]).toBe(unrelated);
  });

  describe('with a pending slot (canonical handle/containment rewriting)', () => {
    const barEdges = (): Edge[] => [
      {
        id: `edge_srcA-${SEQUENTIAL_BAR_HANDLE_IDS.source}-${previousId}-${SEQUENTIAL_BAR_HANDLE_IDS.target}`,
        source: 'srcA',
        sourceHandle: SEQUENTIAL_BAR_HANDLE_IDS.source,
        target: previousId,
        targetHandle: SEQUENTIAL_BAR_HANDLE_IDS.target,
        type: 'default',
      } as Edge,
      {
        id: `edge_${previousId}-${SEQUENTIAL_BAR_HANDLE_IDS.source}-tgtB-${SEQUENTIAL_BAR_HANDLE_IDS.target}`,
        source: previousId,
        sourceHandle: SEQUENTIAL_BAR_HANDLE_IDS.source,
        target: 'tgtB',
        targetHandle: SEQUENTIAL_BAR_HANDLE_IDS.target,
        type: 'default',
      } as Edge,
    ];

    it('restores only the original nodes canonical handles', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
      const pending: PendingSequentialInsert = {
        sourceNodeId: 'srcA',
        targetNodeId: 'tgtB',
        sourceHandleId: 'true',
        targetHandleId: 'input',
      };
      const { newEdges } = sequentialOnBeforeNodeAdded(seedNode(), barEdges(), pending);

      const incoming = newEdges.find((edge) => edge.source === 'srcA');
      const outgoing = newEdges.find((edge) => edge.target === 'tgtB');

      expect(incoming?.sourceHandle).toBe('true');
      expect(outgoing?.targetHandle).toBe('input');
      // The inserted node's own handles are not replaced with handles that
      // belong to the original source/target nodes.
      expect(incoming?.targetHandle).toBe(SEQUENTIAL_BAR_HANDLE_IDS.target);
      expect(outgoing?.sourceHandle).toBe(SEQUENTIAL_BAR_HANDLE_IDS.source);
    });

    it('restores implicit defaults only on the original node endpoints', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
      const { newEdges } = sequentialOnBeforeNodeAdded(seedNode(), barEdges(), {
        sourceNodeId: 'srcA',
        targetNodeId: 'tgtB',
      });

      const incoming = newEdges.find((edge) => edge.source === 'srcA');
      const outgoing = newEdges.find((edge) => edge.target === 'tgtB');

      expect(incoming?.sourceHandle).toBeUndefined();
      expect(outgoing?.targetHandle).toBeUndefined();
      expect(incoming?.targetHandle).toBe(SEQUENTIAL_BAR_HANDLE_IDS.target);
      expect(outgoing?.sourceHandle).toBe(SEQUENTIAL_BAR_HANDLE_IDS.source);
    });

    it('regenerates the edge id from the rewritten handles so the id matches the fields', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
      const pending: PendingSequentialInsert = {
        sourceNodeId: 'srcA',
        targetNodeId: 'tgtB',
        sourceHandleId: 'true',
        targetHandleId: 'input',
      };
      const { newEdges } = sequentialOnBeforeNodeAdded(seedNode(), barEdges(), pending);
      const outgoing = newEdges.find((edge) => edge.source === FAKE_UUID);
      expect(outgoing?.id).toBe(`edge_${FAKE_UUID}-${SEQUENTIAL_BAR_HANDLE_IDS.source}-tgtB-input`);
    });

    it('tags both split halves with the exact canonical edge id', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
      const { newEdges } = sequentialOnBeforeNodeAdded(seedNode(), seedEdges(), {
        sourceNodeId: 'srcA',
        targetNodeId: 'tgtB',
        graphEdgeId: 'canonical-edge-7',
        sourceHandleId: 'output',
        targetHandleId: 'input',
      });

      expect(newEdges).toHaveLength(2);
      for (const edge of newEdges) {
        expect((edge.data as Record<string, unknown>).__sequentialSplitEdgeId).toBe(
          'canonical-edge-7'
        );
      }
    });

    it('marks the inserted-node-to-downstream half as a continuation', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
      const { newEdges } = sequentialOnBeforeNodeAdded(seedNode(), seedEdges(), {
        sourceNodeId: 'srcA',
        targetNodeId: 'tgtB',
        graphEdgeId: 'canonical-edge-7',
      });

      const incoming = newEdges.find((edge) => edge.target === FAKE_UUID);
      const outgoing = newEdges.find((edge) => edge.source === FAKE_UUID);
      expect(
        (incoming?.data as Record<string, unknown>)[SEQ_CONTINUATION_EDGE_KEY]
      ).toBeUndefined();
      expect((outgoing?.data as Record<string, unknown>)[SEQ_CONTINUATION_EDGE_KEY]).toBe(true);
    });

    it('preserves an existing continuation marker on the source half when splitting it again', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
      const { newEdges } = sequentialOnBeforeNodeAdded(seedNode(), seedEdges(), {
        sourceNodeId: 'srcA',
        targetNodeId: 'tgtB',
        graphEdgeId: 'canonical-edge-7',
        splitEdgeWasContinuation: true,
      });

      for (const edge of newEdges) {
        expect((edge.data as Record<string, unknown>)[SEQ_CONTINUATION_EDGE_KEY]).toBe(true);
      }
    });

    it('leaves non-bar handle ids untouched even when a pending value is present', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
      const pending: PendingSequentialInsert = {
        sourceNodeId: 'srcA',
        targetNodeId: 'tgtB',
        sourceHandleId: 'ignored',
        targetHandleId: 'ignored',
      };
      const { newEdges } = sequentialOnBeforeNodeAdded(seedNode(), seedEdges(), pending);
      const incoming = newEdges.find((edge) => edge.source === 'srcA');
      const outgoing = newEdges.find((edge) => edge.target === 'tgtB');
      expect(incoming?.sourceHandle).toBe('ignored');
      expect(outgoing?.targetHandle).toBe('ignored');
      expect(incoming?.targetHandle).toBe('input');
      expect(outgoing?.sourceHandle).toBe('output');
    });

    it('applies the slot containerId as canonical parentId/extent on the materialized node', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
      const { newNode } = sequentialOnBeforeNodeAdded(seedNode(), seedEdges(), {
        containerId: 'loop-1',
      });
      expect(newNode.parentId).toBe('loop-1');
      expect(newNode.extent).toBe('parent');
    });

    it('omits parentId/extent when the slot has no container', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(FAKE_UUID);
      const { newNode } = sequentialOnBeforeNodeAdded(seedNode(), seedEdges(), {});
      expect(newNode.parentId).toBeUndefined();
      expect(newNode.extent).toBeUndefined();
    });
  });
});

describe('resolvePendingSequentialInsert', () => {
  it('captures the slot canonical handle ids and containerId', () => {
    const slot: InsertionSlot = {
      id: 'slot-1',
      source: { nodeId: 'a', handleId: 'true' },
      target: { nodeId: 'b', handleId: 'input' },
      containerId: 'loop-1',
    };
    expect(resolvePendingSequentialInsert(slot)).toEqual({
      sourceNodeId: 'a',
      targetNodeId: 'b',
      graphEdgeId: undefined,
      sourceHandleId: 'true',
      targetHandleId: 'input',
      containerId: 'loop-1',
      splitEdgeWasContinuation: undefined,
    });
  });

  it('captures continuation semantics when inserting into an already-healed spine', () => {
    const pending = resolvePendingSequentialInsert({
      id: 'slot-1',
      source: { nodeId: 'a' },
      target: { nodeId: 'b' },
      continuation: true,
    });
    expect(pending.splitEdgeWasContinuation).toBe(true);
  });

  it('yields undefined handle ids (never a bar handle) when the slot endpoint omits one', () => {
    const slot: InsertionSlot = { id: 'slot-1', source: { nodeId: 'a' }, target: { nodeId: 'b' } };
    const pending = resolvePendingSequentialInsert(slot);
    expect(pending.sourceHandleId).toBeUndefined();
    expect(pending.targetHandleId).toBeUndefined();
  });

  it('yields no containerId when the slot is not scoped to a container', () => {
    const slot: InsertionSlot = { id: 'slot-1' };
    expect(resolvePendingSequentialInsert(slot).containerId).toBeUndefined();
  });
});

describe('buildSequentialPreviewOptions', () => {
  // The connector's rendered id deliberately DIFFERS from the canonical edge id
  // it wraps (as the projection's `conn:${edge.id}` scheme actually produces), proving the
  // lookup uses connectorEdgeId (the rendered id) and not slot.graphEdgeId (the
  // canonical id) — those live in different id spaces in sequential view, since
  // the store here only ever holds derived connector edges.
  const connectorEdge = {
    id: 'conn:e-1',
    source: 'row-a',
    sourceHandle: SEQUENTIAL_BAR_HANDLE_IDS.source,
    target: 'row-b',
    targetHandle: SEQUENTIAL_BAR_HANDLE_IDS.target,
    type: 'sequentialConnector',
  } as Edge;

  const makeInstance = (edges: Edge[] = [connectorEdge]) =>
    ({ getEdges: () => edges }) as unknown as ReactFlowInstance;

  const baseArgs = {
    source: 'a',
    sourceHandleId: SEQUENTIAL_BAR_HANDLE_IDS.source,
    target: 'b',
    targetHandleId: SEQUENTIAL_BAR_HANDLE_IDS.target,
    sourcePosition: Position.Bottom,
    position: { x: 100, y: 200 },
  };

  it('rides the existing pipeline with bar-sized preview + ignored sequential types', () => {
    const slot: InsertionSlot = { id: 'slot-1', graphEdgeId: 'e-1' };
    const options = buildSequentialPreviewOptions(makeInstance(), {
      ...baseArgs,
      slot,
      connectorEdgeId: 'conn:e-1',
    });

    expect(options.previewNodeSize).toEqual({ width: SEQ_BAR_WIDTH, height: SEQ_BAR_HEIGHT });
    expect(options.ignoredNodeTypes).toBe(SEQUENTIAL_IGNORED_NODE_TYPES);
    expect(options.positionMode).toBe('drop');
    expect(options.sourceHandleType).toBe('source');
    expect(options.handlePosition).toBe(Position.Bottom);
    expect(options.position).toEqual({ x: 100, y: 200 });
  });

  it('anchors preview edges on the slot canonical handle ids so connection filtering can resolve them', () => {
    const slot: InsertionSlot = {
      id: 'slot-1',
      source: { nodeId: 'container', handleId: 'true' },
      target: { nodeId: 'b', handleId: 'input' },
    };
    const options = buildSequentialPreviewOptions(makeInstance(), { ...baseArgs, slot });
    // Node id and handle id both come from the slot: bars now render an
    // invisible handle per manifest handle id (BaseNodeBar
    // manifestSource/TargetHandleIds), so the preview edge renders AND
    // usePreviewNode can resolve the existing node's handle manifest for the
    // Add Node connection filter (bar handle ids never appeared in the manifest).
    expect(options.source).toEqual({ nodeId: 'container', handleId: 'true' });
    expect(options.target).toEqual({ nodeId: 'b', handleId: 'input' });
  });

  it('falls back to the default handle ids when the slot omits them (tail append)', () => {
    const slot: InsertionSlot = { id: 'slot-tail', source: { nodeId: 'last' } };
    const options = buildSequentialPreviewOptions(makeInstance([]), {
      ...baseArgs,
      slot,
      target: '',
      targetHandleId: undefined,
    });
    expect(options.source).toEqual({ nodeId: 'last', handleId: DEFAULT_SOURCE_HANDLE_ID });
    expect('target' in options).toBe(false);
  });

  it('drives a head insertion from the first canonical target without using the synthetic start row', () => {
    const slot: InsertionSlot = { id: 'slot-head', target: { nodeId: 'first' } };
    const options = buildSequentialPreviewOptions(makeInstance(), {
      ...baseArgs,
      source: '__sequential-start__',
      target: 'first',
      slot,
    });

    expect(options.source).toEqual({ nodeId: 'first', handleId: DEFAULT_TARGET_HANDLE_ID });
    expect(options.sourceHandleType).toBe('target');
    expect(options.handlePosition).toBe(Position.Top);
    expect('target' in options).toBe(false);
  });

  it('stashes the split CONNECTOR edge (found by its own rendered id) on data.originalEdge', () => {
    const slot: InsertionSlot = { id: 'slot-1', graphEdgeId: 'e-1' };
    const options = buildSequentialPreviewOptions(makeInstance(), {
      ...baseArgs,
      slot,
      connectorEdgeId: 'conn:e-1',
    });
    expect(options.data).toEqual({ originalEdge: connectorEdge });
  });

  it('never finds an edge via slot.graphEdgeId alone (different id space)', () => {
    // Regression: slot.graphEdgeId ('e-1') is the CANONICAL edge id; the store
    // here only holds the derived connector edge ('conn:e-1'). Omitting
    // connectorEdgeId must not accidentally match by falling back to graphEdgeId.
    const slot: InsertionSlot = { id: 'slot-1', graphEdgeId: 'e-1' };
    const options = buildSequentialPreviewOptions(makeInstance(), { ...baseArgs, slot });
    expect(options.data).toEqual({});
  });

  it('omits originalEdge when the insert has no backing connector (tail append)', () => {
    const slot: InsertionSlot = { id: 'slot-1' };
    const options = buildSequentialPreviewOptions(makeInstance(), { ...baseArgs, slot });
    expect(options.data).toEqual({});
  });

  it('never forwards slot.containerId into the preview graph options', () => {
    // createPreviewGraph would reparent the preview onto the container's
    // rendered clone with extent:'parent'; in sequential view that clone is a
    // flattened bar, so the preview would clamp onto the container's own row.
    // Canonical containment is applied to the materialized node instead (see
    // resolvePendingSequentialInsert / sequentialOnBeforeNodeAdded).
    const withContainer = buildSequentialPreviewOptions(makeInstance(), {
      ...baseArgs,
      slot: { id: 'slot-1', containerId: 'loop-1' },
    });
    expect('containerId' in withContainer).toBe(false);

    const withoutContainer = buildSequentialPreviewOptions(makeInstance(), {
      ...baseArgs,
      slot: { id: 'slot-1' },
    });
    expect('containerId' in withoutContainer).toBe(false);
  });
});
