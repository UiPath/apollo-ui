import { renderHook } from '@testing-library/react';
import type { Edge, Node, OnBeforeDelete } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { useReadOnlyBeforeDelete, useReadOnlyEdgeIds } from './BaseCanvas.hooks';

const node = (id: string): Node => ({ id, position: { x: 0, y: 0 }, data: {} });
const edge = (id: string, source: string, target: string): Edge => ({ id, source, target });

// a -> b entirely inside the lockable region; b -> c reaches outside it.
const makeEdges = (): Edge[] => [
  { id: 'a-b', source: 'a', target: 'b' },
  { id: 'b-c', source: 'b', target: 'c' },
];

const EMPTY: ReadonlySet<string> = new Set();

/** Renders the hook and calls the composed guard with a delete set. */
const guardWith = (
  locked: ReadonlySet<string>,
  consumer?: OnBeforeDelete,
  { nodes = [] as Node[], edges = [] as Edge[] } = {}
) => {
  const { result } = renderHook(() => useReadOnlyBeforeDelete(locked, consumer));
  return { guard: result.current, run: () => result.current?.({ nodes, edges }) };
};

describe('useReadOnlyBeforeDelete', () => {
  it('passes the consumer handler straight through when nothing is locked', () => {
    const consumer = vi.fn();
    const { guard } = guardWith(EMPTY, consumer);
    expect(guard).toBe(consumer);
  });

  it('stays undefined when nothing is locked and the consumer has no handler', () => {
    const { guard } = guardWith(EMPTY);
    expect(guard).toBeUndefined();
  });

  it('drops a locked node from the delete set and keeps the rest', async () => {
    const { run } = guardWith(new Set(['a']), undefined, { nodes: [node('a'), node('b')] });

    await expect(run()).resolves.toEqual({ nodes: [node('b')], edges: [] });
  });

  // React Flow gathers the edges of every node in the delete set, so a veto has
  // to take the vetoed node's own edges back out or it survives with no
  // connections.
  it('keeps the edges of a node it vetoed', async () => {
    const { run } = guardWith(new Set(['a']), undefined, {
      nodes: [node('a')],
      edges: [edge('a-c', 'a', 'c')],
    });

    await expect(run()).resolves.toEqual({ nodes: [], edges: [] });
  });

  // The other half: an edge between a vetoed node and one that really is being
  // deleted would be left dangling, so it still goes.
  it('deletes an edge from a vetoed node to a node that is being deleted', async () => {
    const { run } = guardWith(new Set(['a']), undefined, {
      nodes: [node('a'), node('b')],
      edges: [edge('a-b', 'a', 'b'), edge('a-c', 'a', 'c')],
    });

    await expect(run()).resolves.toEqual({
      nodes: [node('b')],
      edges: [edge('a-b', 'a', 'b')],
    });
  });

  it('leaves an explicitly selected edge alone when no node is vetoed', async () => {
    const { run } = guardWith(new Set(['a']), undefined, { edges: [edge('a-c', 'a', 'c')] });

    await expect(run()).resolves.toEqual({ nodes: [], edges: [edge('a-c', 'a', 'c')] });
  });

  // A frozen connection (both endpoints locked) is undeletable in its own right,
  // not just as a side effect of its nodes being vetoed.
  it('vetoes an explicitly selected frozen edge', async () => {
    const { run } = guardWith(new Set(['a', 'b']), undefined, { edges: [edge('a-b', 'a', 'b')] });

    await expect(run()).resolves.toEqual({ nodes: [], edges: [] });
  });

  it('leaves an edge with one locked endpoint deletable', async () => {
    const { run } = guardWith(new Set(['a']), undefined, { edges: [edge('a-b', 'a', 'b')] });

    await expect(run()).resolves.toEqual({ nodes: [], edges: [edge('a-b', 'a', 'b')] });
  });

  it('honors a consumer veto of the whole deletion', async () => {
    const consumer = vi.fn().mockResolvedValue(false);
    const { run } = guardWith(new Set(['a']), consumer, { nodes: [node('a'), node('b')] });

    await expect(run()).resolves.toBe(false);
  });

  it('applies the lock to whatever the consumer allowed', async () => {
    const consumer = vi.fn().mockResolvedValue({ nodes: [node('a')], edges: [] });
    const { run } = guardWith(new Set(['a']), consumer, { nodes: [node('a'), node('b')] });

    await expect(run()).resolves.toEqual({ nodes: [], edges: [] });
    expect(consumer).toHaveBeenCalledWith({ nodes: [node('a'), node('b')], edges: [] });
  });

  it('reuses the guard when the locks and handler do not change', () => {
    const locked: ReadonlySet<string> = new Set(['a']);
    const { result, rerender } = renderHook(({ s }) => useReadOnlyBeforeDelete(s, undefined), {
      initialProps: { s: locked },
    });
    const first = result.current;
    rerender({ s: locked });
    expect(result.current).toBe(first);
  });
});

describe('useReadOnlyEdgeIds', () => {
  it('returns no frozen edges when no nodes are locked', () => {
    const { result } = renderHook(() => useReadOnlyEdgeIds(makeEdges(), EMPTY));
    expect(result.current.size).toBe(0);
  });

  it('freezes an edge when both connected nodes are locked', () => {
    const { result } = renderHook(() => useReadOnlyEdgeIds(makeEdges(), new Set(['a', 'b'])));
    expect([...result.current]).toEqual(['a-b']);
  });

  it('keeps an edge editable when either connected node is unlocked', () => {
    const { result } = renderHook(() => useReadOnlyEdgeIds(makeEdges(), new Set(['a'])));
    expect(result.current.size).toBe(0);
  });
});
