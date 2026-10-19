import { renderHook } from '@testing-library/react';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { SEQ_BAR_HEIGHT, SEQ_ROW_GAP } from '../../constants';
import { getContainerSafeArea } from '../../utils/container';
import {
  makeRuntimeContainerFixture,
  makeSequencedContainerFixture,
  RUNTIME_CONTAINER_NODE_IDS,
  SEQUENCED_CONTAINER_NODE_IDS,
} from '../../utils/sequential/fixtures';
import type { SequentialConnectorData } from './edges/SequentialConnectorEdge.types';
import { SEQ_GUTTER_WIDTH_PX } from './SequentialGutter';
import {
  SEQ_CONNECTOR_EDGE_TYPE,
  SEQ_PLACEHOLDER_ROW_ID,
  SEQ_START_ROW_ID,
} from './sequentialGraph.constants';
import {
  CONTAINER_BAR_WIDTH,
  type UseContainerSequencesArgs,
  useContainerSequences,
} from './useContainerSequences';

const ids = SEQUENCED_CONTAINER_NODE_IDS;
const DECISION_LANES = [
  { id: 'true', label: 'True' },
  { id: 'false', label: 'False' },
];

function argsFor(
  nodes: Node[],
  edges: Edge[],
  overrides: Partial<UseContainerSequencesArgs<Node, Edge>> = {}
): UseContainerSequencesArgs<Node, Edge> {
  return {
    nodes,
    edges,
    nodesById: new Map(nodes.map((node) => [node.id, node])),
    enabled: true,
    sequencedContainerIds: new Set([ids.container]),
    isSequenceNode: () => true,
    isSequenceEdge: () => true,
    isContainerNode: (node) => node.type === 'uipath.control-flow.foreach',
    resolveBranchLabel: (_nodeId, handleId) => (handleId === 'true' ? 'True' : 'False'),
    getBranchHandles: (node) => (node.id === ids.decision ? DECISION_LANES : []),
    getDefaultSourceHandleId: () => 'output',
    canAddToLane: true,
    ...overrides,
  };
}

describe('useContainerSequences', () => {
  it('overrides a stale flow-mode measurement on the frame and its children', () => {
    const fixture = makeSequencedContainerFixture();
    const stale = { width: 912, height: 336 };
    const nodes = fixture.nodes.map((node) =>
      node.id === ids.container || node.parentId === ids.container
        ? { ...node, measured: stale }
        : node
    );
    const { result } = renderHook(() => useContainerSequences(argsFor(nodes, fixture.edges)));

    const frame = result.current.nodes.find((node) => node.id === ids.container);
    expect(frame?.measured).not.toEqual(stale);
    expect(frame?.measured).toEqual({ width: frame?.width, height: frame?.height });
    const bar = result.current.nodes.find((node) => node.id === ids.validate);
    expect(bar?.measured).toEqual({ width: CONTAINER_BAR_WIDTH, height: bar?.height });
  });

  it('renders the body as bars parented to the frame, non-draggable, with the frame sized to the stack', () => {
    const { nodes, edges } = makeSequencedContainerFixture();
    const { result } = renderHook(() => useContainerSequences(argsFor(nodes, edges)));
    const out = result.current;

    expect(out.active).toBe(true);
    expect([...out.sequencedIds]).toEqual([ids.container]);
    for (const id of [ids.validate, ids.decision, ids.reserve, ids.transform]) {
      const bar = out.nodes.find((node) => node.id === id);
      expect(bar?.parentId).toBe(ids.container);
      expect(bar?.extent).toBe('parent');
      expect(bar?.draggable).toBe(false);
      expect(bar?.width).toBe(CONTAINER_BAR_WIDTH);
      expect(out.barNodeIds.has(id)).toBe(true);
    }
    const frame = out.nodes.find((node) => node.id === ids.container);
    expect(frame?.width).toBeGreaterThan(CONTAINER_BAR_WIDTH);
    // Declared and measured sizes must agree, or xyflow re-adopts a stale measurement from
    // the canonical node on every drag frame and the frame flips between the two sizes.
    expect(frame?.measured).toEqual({ width: frame?.width, height: frame?.height });
    for (const id of [ids.validate, ids.decision, ids.reserve, ids.transform]) {
      const bar = out.nodes.find((node) => node.id === id);
      expect(bar?.measured).toEqual({ width: bar?.width, height: bar?.height });
    }
    const lowestBar = Math.max(
      ...out.nodes
        .filter((node) => node.parentId === ids.container)
        .map((node) => node.position.y + (node.height ?? 0))
    );
    expect(frame?.height).toBeGreaterThan(lowestBar);
    // Canonical objects are untouched.
    expect(nodes.find((node) => node.id === ids.validate)?.draggable).toBeUndefined();
  });

  it('suffixes synthetic placeholder ids per container and parents them', () => {
    const { nodes, edges } = makeSequencedContainerFixture();
    const { result } = renderHook(() => useContainerSequences(argsFor(nodes, edges)));
    const placeholders = result.current.nodes.filter((node) =>
      result.current.placeholderIds.has(node.id)
    );
    expect(placeholders.length).toBeGreaterThan(0);
    expect(
      placeholders.some((node) => node.id === `${SEQ_PLACEHOLDER_ROW_ID}:${ids.container}`)
    ).toBe(true);
    for (const placeholder of placeholders) expect(placeholder.parentId).toBe(ids.container);
    expect(result.current.nodes.some((node) => node.id === SEQ_PLACEHOLDER_ROW_ID)).toBe(false);
  });

  it('offsets connector waypoints by the frame position and consumes the body edges', () => {
    const { nodes, edges } = makeSequencedContainerFixture();
    const moved = nodes.map((node) =>
      node.id === ids.container ? { ...node, position: { x: 1000, y: 2000 } } : node
    );
    const { result } = renderHook(() => useContainerSequences(argsFor(moved, edges)));
    const connectors = result.current.edges.filter((edge) => edge.type === SEQ_CONNECTOR_EDGE_TYPE);
    expect(connectors.length).toBeGreaterThan(0);
    const withWaypoints = connectors.flatMap(
      (edge) => (edge.data as SequentialConnectorData | undefined)?.waypoints ?? []
    );
    expect(withWaypoints.length).toBeGreaterThan(0);
    for (const wp of withWaypoints) {
      expect(wp.x).toBeGreaterThan(1000);
      expect(wp.y).toBeGreaterThan(2000);
    }
    const edgeIds = result.current.edges.map((edge) => edge.id);
    expect(edgeIds).not.toContain('sc-validate-decision');
    expect(edgeIds).toContain('sc-container-validate');
    expect(edgeIds).toContain('sc-transform-continue');
    expect(
      result.current.edges.find((edge) => edge.id === 'sc-container-validate')?.targetHandle
    ).toBe('seq-branch-target');
  });

  it('renders a nested container and its body as bars of the outer frame', () => {
    const { nodes, edges } = makeSequencedContainerFixture();
    const nested: Node[] = [
      ...nodes,
      {
        id: 'inner',
        type: 'uipath.control-flow.foreach',
        position: { x: 0, y: 0 },
        parentId: ids.container,
        data: {},
      },
      {
        id: 'inner-step',
        type: 'uipath.script',
        position: { x: 0, y: 0 },
        parentId: 'inner',
        data: {},
      },
    ];
    const { result } = renderHook(() => useContainerSequences(argsFor(nested, edges)));
    expect(result.current.active).toBe(true);
    for (const id of ['inner', 'inner-step']) {
      expect(result.current.barNodeIds.has(id)).toBe(true);
      expect(result.current.nodes.find((node) => node.id === id)?.parentId).toBe(ids.container);
    }
  });

  it('passes the canonical graph through when disabled', () => {
    const { nodes, edges } = makeSequencedContainerFixture();
    const { result } = renderHook(() =>
      useContainerSequences(argsFor(nodes, edges, { enabled: false }))
    );
    expect(result.current.active).toBe(false);
    expect(result.current.nodes).toBe(nodes);
    expect(result.current.edges).toBe(edges);
  });

  it('reuses bar objects across a data-only rename of another node', () => {
    const { nodes, edges } = makeSequencedContainerFixture();
    const { result, rerender } = renderHook(
      (props: { nodes: Node[] }) => useContainerSequences(argsFor(props.nodes, edges)),
      { initialProps: { nodes } }
    );
    const before = result.current.nodes.find((node) => node.id === ids.transform);
    const renamed = nodes.map((node) =>
      node.id === ids.http ? { ...node, data: { display: { label: 'Renamed' } } } : node
    );
    rerender({ nodes: renamed });
    expect(result.current.nodes.find((node) => node.id === ids.transform)).toBe(before);
  });

  it('exposes lane and tail slots stamped with the container, and an absolute preview position for an active slot', () => {
    const { nodes, edges } = makeSequencedContainerFixture();
    const first = renderHook(() => useContainerSequences(argsFor(nodes, edges)));
    const slots = [...first.result.current.slotsById.values()];
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) expect(slot.containerId).toBe(ids.container);
    const tail = first.result.current.slotsById.get(`slot:tail:${ids.container}`);
    expect(tail?.source?.nodeId).toBe(ids.transform);

    const connector = first.result.current.layerEdges.find(
      (edge) => (edge.data as SequentialConnectorData | undefined)?.slot
    );
    const slot = (connector?.data as SequentialConnectorData).slot!;
    const second = renderHook(() =>
      useContainerSequences(argsFor(nodes, edges, { insertSlot: slot }))
    );
    expect(second.result.current.previewPlacement?.parentId).toBe(ids.container);
    expect(second.result.current.previewPlacement!.position.y).toBeGreaterThan(0);
  });
});

describe('useContainerSequences: runtime containers', () => {
  const rc = RUNTIME_CONTAINER_NODE_IDS;
  const isRuntime = (node: Node) => node.type === 'uipath.runtime-container';
  const isContainer = (node: Node) =>
    node.type === 'uipath.control-flow.foreach' || isRuntime(node);

  function runtimeArgs(
    nodes: Node[],
    edges: Edge[],
    overrides: Partial<UseContainerSequencesArgs<Node, Edge>> = {}
  ): UseContainerSequencesArgs<Node, Edge> {
    return argsFor(nodes, edges, {
      sequencedContainerIds: new Set([rc.container]),
      isContainerNode: isContainer,
      isSelfContained: isRuntime,
      getBranchHandles: () => [],
      ...overrides,
    });
  }
  const find = (nodes: readonly Node[], id: string) => nodes.find((node) => node.id === id);

  it('opens a self-contained body with its own start row and grows the frame for it', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const withStart = renderHook(() => useContainerSequences(runtimeArgs(nodes, edges))).result
      .current;
    const withoutStart = renderHook(() =>
      useContainerSequences(runtimeArgs(nodes, edges, { isSelfContained: () => false }))
    ).result.current;

    const start = find(withStart.nodes, `${SEQ_START_ROW_ID}:${rc.container}`);
    expect(start?.parentId).toBe(rc.container);
    expect(withStart.placeholderIds.has(start!.id)).toBe(true);
    const http = find(withStart.nodes, rc.http)!;
    expect(http.position.y - start!.position.y).toBe(SEQ_BAR_HEIGHT + SEQ_ROW_GAP);
    expect(
      withStart.edges.some((edge) => edge.source === start!.id && edge.target === rc.http)
    ).toBe(true);
    const grown = find(withStart.nodes, rc.container)!.height!;
    expect(grown - find(withoutStart.nodes, rc.container)!.height!).toBe(
      SEQ_BAR_HEIGHT + SEQ_ROW_GAP
    );
    // A container with an inner rail keeps no start row.
    expect(find(withoutStart.nodes, `${SEQ_START_ROW_ID}:${rc.container}`)).toBeUndefined();
  });

  it('opens the insert gap for a slot inside a nested For Each and seats the ghost in its lane', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const before = renderHook(() => useContainerSequences(runtimeArgs(nodes, edges))).result
      .current;
    const connector = before.layerEdges.find((edge) => {
      const slot = (edge.data as SequentialConnectorData | undefined)?.slot;
      return slot?.source?.nodeId === rc.step4 && slot?.target?.nodeId === rc.step5;
    });
    const slot = (connector?.data as SequentialConnectorData).slot!;
    // The nested slot belongs to the For Each, not to the runtime container being sequenced.
    expect(slot.containerId).toBe(rc.forEach);

    const during = renderHook(() =>
      useContainerSequences(runtimeArgs(nodes, edges, { insertSlot: slot }))
    ).result.current;

    const placement = during.previewPlacement;
    expect(placement?.parentId).toBe(rc.container);
    const step4 = find(during.nodes, rc.step4)!;
    // Indented with the For Each body, one pitch below Step 4.
    expect(placement!.position.x).toBe(step4.position.x);
    expect(placement!.position.y - step4.position.y).toBe(SEQ_BAR_HEIGHT + SEQ_ROW_GAP);
    // Step 5 moves down one pitch to open the gap, and the frame grows by the same amount.
    expect(
      find(during.nodes, rc.step5)!.position.y - find(before.nodes, rc.step5)!.position.y
    ).toBe(SEQ_BAR_HEIGHT + SEQ_ROW_GAP);
    expect(
      find(during.nodes, rc.container)!.height! - find(before.nodes, rc.container)!.height!
    ).toBe(SEQ_BAR_HEIGHT + SEQ_ROW_GAP);
  });

  it('puts the step-number gutter in the rail reservation of a self-contained frame', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const out = renderHook(() => useContainerSequences(runtimeArgs(nodes, edges))).result.current;
    const container = find(nodes, rc.container)!;
    const padLeft = getContainerSafeArea(container).padding?.left ?? 0;
    // The reservation is at least the gutter's width, so numbers stay inside the frame.
    expect(padLeft).toBeGreaterThanOrEqual(SEQ_GUTTER_WIDTH_PX);
    expect(find(out.nodes, rc.http)?.position.x).toBe(padLeft);

    expect(out.gutters).toHaveLength(1);
    const gutter = out.gutters[0]!;
    expect(gutter.containerId).toBe(rc.container);
    expect(gutter.rows.map((row) => row.stepNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // Absolute: the frame's position plus the bar's frame-relative position.
    expect(gutter.positions.get(rc.http)).toEqual({
      x: container.position.x + padLeft,
      y: container.position.y + find(out.nodes, rc.http)!.position.y,
    });
  });

  it('puts the gutter beside the rail of a container that has one', () => {
    const { nodes, edges } = makeSequencedContainerFixture();
    const out = renderHook(() => useContainerSequences(argsFor(nodes, edges))).result.current;
    const container = find(nodes, ids.container)!;
    const padLeft = getContainerSafeArea(container).padding?.left ?? 0;
    expect(find(out.nodes, ids.validate)?.position.x).toBe(padLeft + SEQ_GUTTER_WIDTH_PX);
  });

  it('renders nested steps as bars of the outer frame and skips the nested container', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const out = renderHook(() =>
      useContainerSequences(
        runtimeArgs(nodes, edges, { sequencedContainerIds: new Set([rc.container, rc.forEach]) })
      )
    ).result.current;

    expect([...out.sequencedIds]).toEqual([rc.container]);
    for (const id of [rc.forEach, rc.step4, rc.step5, rc.step6, rc.step7]) {
      expect(out.barNodeIds.has(id)).toBe(true);
      expect(find(out.nodes, id)?.parentId).toBe(rc.container);
      expect(find(out.nodes, id)?.draggable).toBe(false);
    }
    // The For Each body is indented under its row.
    expect(find(out.nodes, rc.step4)!.position.x).toBeGreaterThan(
      find(out.nodes, rc.forEach)!.position.x
    );
    expect(out.edges.some((edge) => edge.id === 'rc-4-5')).toBe(false);
  });

  it('hides a collapsed step body, keeps its numbering, and shrinks the frame', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const expanded = renderHook(() => useContainerSequences(runtimeArgs(nodes, edges))).result
      .current;
    const collapsed = renderHook(() =>
      useContainerSequences(runtimeArgs(nodes, edges, { collapsedStepIds: new Set([rc.forEach]) }))
    ).result.current;

    for (const id of [rc.step4, rc.step5, rc.step6, rc.step7]) {
      expect(find(collapsed.nodes, id)?.hidden).toBe(true);
    }
    expect(collapsed.gutters[0]!.rows.map((row) => row.stepNumber)).toEqual([1, 2, 3, 8]);
    expect(collapsed.gutters[0]!.rows.find((row) => row.nodeId === rc.forEach)?.collapsible).toBe(
      true
    );
    expect(find(collapsed.nodes, rc.container)!.height!).toBeLessThan(
      find(expanded.nodes, rc.container)!.height!
    );
  });

  it('folds a trigger inside a self-contained body into the start row', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const trigger: Node = {
      id: 'rc-trigger',
      type: 'uipath.first-run',
      position: { x: 0, y: 0 },
      parentId: rc.container,
      data: {},
    };
    const withTrigger = [...nodes, trigger];
    const withTriggerEdges: Edge[] = [
      ...edges,
      { id: 'rc-trigger-http', source: trigger.id, target: rc.http },
    ];
    const out = renderHook(() =>
      useContainerSequences(
        runtimeArgs(withTrigger, withTriggerEdges, {
          isStartNode: (node) => node.type === 'uipath.first-run',
        })
      )
    ).result.current;

    expect(find(out.nodes, trigger.id)).toBeUndefined();
    expect(out.edges.some((edge) => edge.id === 'rc-trigger-http')).toBe(false);
    expect(out.gutters[0]!.rows[0]?.nodeId).toBe(rc.http);
  });

  it('wires Add trigger to the container id with a callback that keeps its identity', () => {
    const { nodes, edges } = makeRuntimeContainerFixture();
    const onAddTrigger = vi.fn();
    const hook = renderHook(
      ({ handler }: { handler: (containerId: string) => void }) =>
        useContainerSequences(runtimeArgs(nodes, edges, { onAddTrigger: handler })),
      { initialProps: { handler: onAddTrigger } }
    );
    const startId = `${SEQ_START_ROW_ID}:${rc.container}`;
    const first = find(hook.result.current.nodes, startId)!;
    (first.data as { onAddTrigger: () => void }).onAddTrigger();
    expect(onAddTrigger).toHaveBeenCalledWith(rc.container);

    // A host passing a fresh handler each render does not churn the start row.
    const next = vi.fn();
    hook.rerender({ handler: next });
    const second = find(hook.result.current.nodes, startId)!;
    expect(second.data).toBe(first.data);
    (second.data as { onAddTrigger: () => void }).onAddTrigger();
    expect(next).toHaveBeenCalledWith(rc.container);
  });
});
