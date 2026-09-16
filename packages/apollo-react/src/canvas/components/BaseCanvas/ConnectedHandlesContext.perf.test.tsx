/**
 * ConnectedHandlesContext subscription-isolation regression tests at 500-node scale.
 *
 * BaseNode relies on this store for O(1) connected-handle lookups with granular
 * per-node notifications. If the store ever regressed to notifying all
 * subscribers (or the provider re-rendered its subtree on every edge change),
 * every edge edit would re-render all 500 nodes. These tests pin the contract:
 *
 * 1. An edge change notifies ONLY the nodes it touches.
 * 2. A new edges array with identical content notifies nobody (set reuse).
 * 3. Removing an edge notifies only the previously-connected nodes.
 */
import { render } from '@testing-library/react';
import type { Edge } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useMemo } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConnectedHandlesProvider, useConnectedHandles } from './ConnectedHandlesContext';

const N = 500;

const renderCounts = new Map<string, number>();
const snapshots = new Map<string, ReadonlySet<string>>();

const Probe = memo(({ nodeId }: { nodeId: string }) => {
  const handles = useConnectedHandles(nodeId);
  renderCounts.set(nodeId, (renderCounts.get(nodeId) ?? 0) + 1);
  snapshots.set(nodeId, handles);
  return null;
});

// The probes subtree is memoized so provider re-renders (new edges prop) reach
// subscribers only through the store, mirroring how memoized BaseNodes behave
// inside ReactFlow.
const Harness = ({ edges }: { edges: Edge[] }) => {
  const probes = useMemo(
    () => Array.from({ length: N }, (_, i) => <Probe key={`node-${i}`} nodeId={`node-${i}`} />),
    []
  );
  return <ConnectedHandlesProvider edges={edges}>{probes}</ConnectedHandlesProvider>;
};

/** Chain edges: node-i.out → node-(i+1).in for the first `count` nodes. */
const makeChainEdges = (count: number): Edge[] =>
  Array.from({ length: count - 1 }, (_, i) => ({
    id: `e${i}`,
    source: `node-${i}`,
    sourceHandle: 'out',
    target: `node-${i + 1}`,
    targetHandle: 'in',
  }));

const countOf = (i: number) => renderCounts.get(`node-${i}`) ?? 0;
const totalRenders = () => [...renderCounts.values()].reduce((a, b) => a + b, 0);

describe('ConnectedHandlesContext @ 500 nodes: granular notification guards', () => {
  beforeEach(() => {
    renderCounts.clear();
    snapshots.clear();
  });

  it('adding one edge notifies only the two nodes it connects', () => {
    const edges = makeChainEdges(N);
    const { rerender } = render(<Harness edges={edges} />);
    const baseline = totalRenders();
    const node0Before = countOf(0);
    const node499Before = countOf(499);

    // Connect node-0 and node-499 with fresh handle ids so both sets change.
    const added: Edge[] = [
      ...edges,
      {
        id: 'e-new',
        source: 'node-0',
        sourceHandle: 'out-secondary',
        target: 'node-499',
        targetHandle: 'in-secondary',
      },
    ];
    rerender(<Harness edges={added} />);

    expect(countOf(0)).toBe(node0Before + 1);
    expect(countOf(499)).toBe(node499Before + 1);
    // Exactly two subscribers re-rendered; the other 498 were untouched.
    expect(totalRenders()).toBe(baseline + 2);
  });

  it('a new edges array with identical content notifies nobody', () => {
    const edges = makeChainEdges(N);
    const { rerender } = render(<Harness edges={edges} />);
    const baseline = totalRenders();

    rerender(<Harness edges={edges.map((e) => ({ ...e }))} />);

    expect(totalRenders()).toBe(baseline);
  });

  it('removing one edge notifies only the nodes that lose a connection', () => {
    const edges = makeChainEdges(N);
    const { rerender } = render(<Harness edges={edges} />);
    const baseline = totalRenders();
    const node250Before = countOf(250);
    const node251Before = countOf(251);

    // Drop e250 (node-250.out → node-251.in). Both endpoints lose a handle.
    rerender(<Harness edges={edges.filter((e) => e.id !== 'e250')} />);

    expect(countOf(250)).toBe(node250Before + 1);
    expect(countOf(251)).toBe(node251Before + 1);
    expect(totalRenders()).toBe(baseline + 2);
    expect(snapshots.get('node-250')?.has('out')).toBe(false);
    // node-250 still receives via its `in` handle from e249.
    expect(snapshots.get('node-250')?.has('in')).toBe(true);
  });

  it('snapshot identity is stable for untouched nodes across edge updates', () => {
    const edges = makeChainEdges(N);
    const { rerender } = render(<Harness edges={edges} />);
    const before = snapshots.get('node-100');

    rerender(
      <Harness
        edges={[
          ...edges,
          { id: 'x', source: 'node-1', sourceHandle: 's2', target: 'node-2', targetHandle: 't2' },
        ]}
      />
    );

    // Even if node-100 re-rendered for some other reason, its snapshot must be
    // the exact same Set instance (useSyncExternalStore identity guarantee).
    expect(snapshots.get('node-100')).toBe(before);
  });
});
