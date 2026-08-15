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

const { rfNodeStore, rfState, mockUpdateNode, mockGetNode, mockUpdateNodeInternals, labelRenders } =
  vi.hoisted(() => {
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

import { makeNodeProps, makeNodes, NodeGrid, PERF_NODE_HEIGHT } from './BaseNode.perf-fixtures';

const N = 500;

const rendersOf = (i: number) => labelRenders.get(`Node ${i}`) ?? 0;
const totalRenders = () => [...labelRenders.values()].reduce((a, b) => a + b, 0);

describe('BaseNode @ 500 nodes: render isolation regression guards', () => {
  beforeEach(() => {
    labelRenders.clear();
    rfNodeStore.clear();
    rfState.current = { connection: { inProgress: false } };
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
