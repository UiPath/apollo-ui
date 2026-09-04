/**
 * BaseNode render-count regression tests at 500-node scale.
 *
 * These tests guard the render-isolation invariants that make a 500-node
 * canvas viable. They intentionally assert render COUNTS (deterministic)
 * rather than wall-clock time (flaky in CI); timing lives in BaseNode.bench.tsx.
 *
 * Invariants guarded:
 * 1. Mounting N nodes renders each node body exactly once (no cascades).
 * 2. Absolute-position-only prop changes never re-render the node body
 *    (areNodePropsEqualIgnoringPosition wiring on the memo export).
 * 3. Selecting / hovering / editing one node re-renders only that node.
 * 4. The height write-back effect performs at most one store write per node
 *    and none when node.height is already correct (no write storms, no loops).
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  rfNodeStore,
  rfState,
  mockUpdateNode,
  mockGetNode,
  mockUpdateNodeInternals,
  labelRenders,
  resolveHandlesSpy,
  toolbarCalls,
} = vi.hoisted(() => {
  const rfNodeStore = new Map<string, { height?: number }>();
  return {
    rfNodeStore,
    rfState: { current: { connection: { inProgress: false } } },
    mockUpdateNode: vi.fn((id: string, patch: { height?: number }) => {
      rfNodeStore.set(id, { ...rfNodeStore.get(id), ...patch });
    }),
    mockGetNode: vi.fn((id: string) => rfNodeStore.get(id)),
    mockUpdateNodeInternals: vi.fn(),
    /** Render counter per node label — bumped by the NodeLabel stub below. */
    labelRenders: new Map<string, number>(),
    /** Holds the spy wrapping the REAL resolveHandles (installed by the mock below). */
    resolveHandlesSpy: { current: undefined as ReturnType<typeof vi.fn> | undefined },
    /** Props captured from every NodeToolbar render. */
    // biome-ignore lint/suspicious/noExplicitAny: captured toolbar props for assertions
    toolbarCalls: [] as any[],
  };
});

// Selector-aware xyflow mock: BaseNode reads `useStore(selectIsConnecting)` and
// the store node via `getNode`/`updateNode`. The global canvas-mocks version is
// not selector-aware, so override it here.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>();
  return {
    ...actual,
    // Real xyflow Handle requires a zustand store; a stub keeps ButtonHandles real
    // while avoiding a full ReactFlow instance.
    Handle: ({ id, type }: { id?: string; type?: string }) => (
      <div data-handleid={id} data-handletype={type} />
    ),
    useStore: (selector: (s: unknown) => unknown) => selector(rfState.current),
    useUpdateNodeInternals: () => mockUpdateNodeInternals,
    useReactFlow: () => ({
      updateNodeData: vi.fn(),
      updateNode: mockUpdateNode,
      getNode: mockGetNode,
    }),
  };
});

// useButtonHandles reads node data through the real @xyflow/react store hook;
// there is no ReactFlow store in these tests, so return null (hook falls back to {}).
vi.mock('@xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@xyflow/react')>()),
  useNodesData: () => null,
}));

// Replace the memoized NodeLabel with a counting stub: it renders exactly once
// per BaseNode body render, giving a per-node render counter keyed by label.
vi.mock('./NodeLabel', () => ({
  NodeLabel: ({ label }: { label?: string }) => {
    const key = label ?? '';
    labelRenders.set(key, (labelRenders.get(key) ?? 0) + 1);
    return <div data-testid="node-label">{label}</div>;
  },
}));

// Wrap the REAL resolveHandles with a counting spy so tests can assert how many
// resolution passes a mount performs (guards against double resolution).
vi.mock('../../utils/manifest-resolver', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/manifest-resolver')>();
  const spy = vi.fn(actual.resolveHandles);
  resolveHandlesSpy.current = spy;
  return { ...actual, resolveHandles: spy };
});

// Capture NodeToolbar props to assert toolbar-config identity stability.
vi.mock('../Toolbar', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: captured toolbar props for assertions
  NodeToolbar: (props: any) => {
    toolbarCalls.push(props);
    return null;
  },
}));

import { makeNodeProps, makeNodes, NodeGrid, PERF_NODE_HEIGHT } from './BaseNode.perf-fixtures';

const N = 500;

// Reference-stable empty overrides: lets the manifest-default toolbar resolve.
const EMPTY_OVERRIDES = {};

const rendersOf = (i: number) => labelRenders.get(`Node ${i}`) ?? 0;
const totalRenders = () => [...labelRenders.values()].reduce((a, b) => a + b, 0);

describe('BaseNode @ 500 nodes: render isolation regression guards', () => {
  beforeEach(() => {
    labelRenders.clear();
    rfNodeStore.clear();
    rfState.current = { connection: { inProgress: false } };
    toolbarCalls.length = 0;
    resolveHandlesSpy.current?.mockClear();
  });

  afterEach(() => {
    mockUpdateNode.mockClear();
    mockGetNode.mockClear();
    mockUpdateNodeInternals.mockClear();
  });

  it('mounts 500 nodes with exactly one body render per node (no render cascades)', () => {
    render(<NodeGrid nodes={makeNodes(N)} />);

    expect(totalRenders()).toBe(N);
    expect(screen.getAllByTestId('base-container')).toHaveLength(N);
  });

  it('height write-back performs exactly one store write per node on first mount', () => {
    render(<NodeGrid nodes={makeNodes(N)} />);

    // One write per node (height undefined → computed), never more. A second
    // write for the same node would indicate the measure→write loop regressed.
    expect(mockUpdateNode).toHaveBeenCalledTimes(N);
    const writesPerNode = new Map<string, number>();
    for (const [id] of mockUpdateNode.mock.calls) {
      writesPerNode.set(id as string, (writesPerNode.get(id as string) ?? 0) + 1);
    }
    for (const [id, count] of writesPerNode) {
      expect({ id, count }).toEqual({ id, count: 1 });
    }
    // One internals recalculation per node on mount.
    expect(mockUpdateNodeInternals).toHaveBeenCalledTimes(N);
  });

  it('performs zero height writes when node.height is already correct (seeded nodes)', () => {
    for (let i = 0; i < N; i++) {
      rfNodeStore.set(`node-${i}`, { height: PERF_NODE_HEIGHT });
    }
    render(<NodeGrid nodes={makeNodes(N)} />);

    expect(mockUpdateNode).not.toHaveBeenCalled();
  });

  it('does not re-render any node body on absolute-position-only changes (container drag)', () => {
    const nodes = makeNodes(N);
    const { rerender } = render(<NodeGrid nodes={nodes} />);
    expect(totalRenders()).toBe(N);

    // Simulate a container drag frame: every node gets a new absolute position.
    const moved = nodes.map((p) => ({
      ...p,
      positionAbsoluteX: p.positionAbsoluteX + 40,
      positionAbsoluteY: p.positionAbsoluteY + 24,
    }));
    rerender(<NodeGrid nodes={moved} />);

    // areNodePropsEqualIgnoringPosition must swallow all 500 updates.
    expect(totalRenders()).toBe(N);
  });

  it('does not re-render any node body when props are value-identical', () => {
    const nodes = makeNodes(N);
    const { rerender } = render(<NodeGrid nodes={nodes} />);

    rerender(<NodeGrid nodes={[...nodes]} />);

    expect(totalRenders()).toBe(N);
  });

  it('selecting one node re-renders exactly that node', () => {
    const nodes = makeNodes(N);
    const { rerender } = render(<NodeGrid nodes={nodes} />);

    const next = [...nodes];
    next[7] = { ...nodes[7]!, selected: true };
    rerender(<NodeGrid nodes={next} />);

    expect(rendersOf(7)).toBe(2);
    expect(totalRenders()).toBe(N + 1);
  });

  it('updating one node’s data re-renders exactly that node', () => {
    const nodes = makeNodes(N);
    const { rerender } = render(<NodeGrid nodes={nodes} />);

    const next = [...nodes];
    next[3] = makeNodeProps(3, {
      data: { nodeType: nodes[3]!.type, display: { label: 'Node 3', subLabel: 'edited' } },
    });
    rerender(<NodeGrid nodes={next} />);

    expect(rendersOf(3)).toBe(2);
    expect(totalRenders()).toBe(N + 1);
  });

  it('hovering one node re-renders exactly that node', () => {
    render(<NodeGrid nodes={makeNodes(N)} />);

    const wrapper = screen.getAllByTestId('base-container')[11]!.parentElement!;
    act(() => {
      fireEvent.mouseEnter(wrapper);
    });

    expect(rendersOf(11)).toBe(2);
    expect(totalRenders()).toBe(N + 1);

    act(() => {
      fireEvent.mouseLeave(wrapper);
    });
    expect(rendersOf(11)).toBe(3);
    expect(totalRenders()).toBe(N + 2);
  });

  it('resolves handle configurations exactly once per node on mount (no double resolution)', () => {
    render(<NodeGrid nodes={makeNodes(N)} />);

    // One resolveHandles pass per node: BaseNode resolves and useButtonHandles
    // consumes the pre-resolved output. 2N here means resolution regressed to
    // running twice per node.
    expect(resolveHandlesSpy.current).toHaveBeenCalledTimes(N);
  });

  it('starting a connect gesture does not re-resolve the toolbar config', () => {
    // Manifest-default toolbar (design mode): pass empty overrides instead of
    // the default toolbar-suppressing ones.
    const nodes = [makeNodeProps(0, { selected: true })];
    render(<NodeGrid nodes={nodes} overrides={EMPTY_OVERRIDES} />);

    const configBefore = toolbarCalls.at(-1)?.config;
    expect(configBefore).toBeTruthy();

    // Connect gesture starts; the hover forces the node to re-render and read
    // the new store state.
    rfState.current = { connection: { inProgress: true } };
    act(() => {
      fireEvent.mouseEnter(screen.getByTestId('base-container').parentElement!);
    });

    expect(toolbarCalls.length).toBeGreaterThan(1);
    // Same resolved config object: resolveToolbar must not re-run (it allocates
    // fresh action objects and icon elements per node per call).
    expect(toolbarCalls.at(-1)?.config).toBe(configBefore);
  });

  it('a label-only data edit keeps handle config identity: no re-measure, no height write', () => {
    const nodes = makeNodes(N);
    const { rerender } = render(<NodeGrid nodes={nodes} />);
    mockUpdateNode.mockClear();
    mockUpdateNodeInternals.mockClear();

    const next = [...nodes];
    next[3] = makeNodeProps(3, {
      data: { nodeType: nodes[3]!.type, display: { label: 'Renamed' } },
    });
    rerender(<NodeGrid nodes={next} />);

    // The node re-rendered with its new label...
    expect(labelRenders.get('Renamed')).toBe(1);
    // ...but resolution output was value-identical, so the stable-identity
    // guard must prevent the DOM re-measure and any height write.
    expect(mockUpdateNodeInternals).not.toHaveBeenCalled();
    expect(mockUpdateNode).not.toHaveBeenCalled();
  });

  it('dragging one node re-renders only that node (dragging prop) and never loops', () => {
    const nodes = makeNodes(N);
    const { rerender } = render(<NodeGrid nodes={nodes} />);
    mockUpdateNode.mockClear();

    // Drag start: dragging=true on one node; every frame moves absolute positions.
    let current = [...nodes];
    current[42] = { ...nodes[42]!, dragging: true };
    rerender(<NodeGrid nodes={current} />);

    for (let frame = 1; frame <= 5; frame++) {
      current = current.map((p) => ({
        ...p,
        positionAbsoluteX: p.positionAbsoluteX + frame,
      }));
      rerender(<NodeGrid nodes={current} />);
    }

    // Only the drag-start transition renders (1), position frames are swallowed.
    expect(rendersOf(42)).toBe(2);
    expect(totalRenders()).toBe(N + 1);
    // Height is a pure function of handles/footer: dragging must not write.
    expect(mockUpdateNode).not.toHaveBeenCalled();
  });
});
