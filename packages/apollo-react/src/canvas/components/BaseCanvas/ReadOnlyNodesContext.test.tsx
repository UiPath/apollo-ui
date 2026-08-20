import { render, renderHook, screen } from '@testing-library/react';
import { memo, type PropsWithChildren } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ReadOnlyNodesProvider,
  useIsConnectionReadOnly,
  useIsNodeReadOnly,
  useStableNodeIdSet,
} from './ReadOnlyNodesContext';

function wrapperWith(ids?: ReadonlySet<string>) {
  return ({ children }: PropsWithChildren) => (
    <ReadOnlyNodesProvider readOnlyNodeIds={ids}>{children}</ReadOnlyNodesProvider>
  );
}

function ConnectionProbe({ source, target }: { source: string; target: string }) {
  return <span data-frozen={String(useIsConnectionReadOnly(source, target))} />;
}

describe('useIsNodeReadOnly', () => {
  it('reports nodes as editable when used outside a provider', () => {
    const { result } = renderHook(() => useIsNodeReadOnly('a'));
    expect(result.current).toBe(false);
  });

  it('reports only listed nodes as locked', () => {
    const wrapper = wrapperWith(new Set(['a', 'b']));
    const { result: a } = renderHook(() => useIsNodeReadOnly('a'), { wrapper });
    const { result: c } = renderHook(() => useIsNodeReadOnly('c'), { wrapper });
    expect(a.current).toBe(true);
    expect(c.current).toBe(false);
  });

  it('reports nodes as editable when no lock list is provided', () => {
    const { result } = renderHook(() => useIsNodeReadOnly('a'), {
      wrapper: wrapperWith(undefined),
    });
    expect(result.current).toBe(false);
  });
});

describe('useStableNodeIdSet', () => {
  it('reuses the lock set when its ids do not change', () => {
    const { result, rerender } = renderHook(({ ids }) => useStableNodeIdSet(ids), {
      initialProps: { ids: new Set(['a', 'b']) as ReadonlySet<string> },
    });
    const first = result.current;
    rerender({ ids: new Set(['a', 'b']) });
    expect(result.current).toBe(first);
  });

  it('creates a new lock set when its ids change', () => {
    const { result, rerender } = renderHook(({ ids }) => useStableNodeIdSet(ids), {
      initialProps: { ids: new Set(['a']) as ReadonlySet<string> },
    });
    const first = result.current;
    rerender({ ids: new Set(['a', 'b']) });
    expect(result.current).not.toBe(first);
    expect(result.current.has('b')).toBe(true);
  });

  // Arrays are a supported input, so the normalization has to hold the
  // stability guarantee on its own: `setsEqual` would read every array as
  // unequal.
  it('keeps the same lock set when the ids arrive as an array', () => {
    const { result, rerender } = renderHook(({ ids }) => useStableNodeIdSet(ids), {
      initialProps: { ids: ['a', 'b'] as readonly string[] },
    });
    const first = result.current;
    expect(first.has('a')).toBe(true);
    rerender({ ids: ['a', 'b'] });
    expect(result.current).toBe(first);
    rerender({ ids: ['a', 'b', 'c'] });
    expect(result.current).not.toBe(first);
    expect(result.current.has('c')).toBe(true);
  });

  it('reuses an empty lock set when no ids are provided', () => {
    const { result, rerender } = renderHook(({ ids }) => useStableNodeIdSet(ids), {
      initialProps: { ids: undefined as ReadonlySet<string> | undefined },
    });
    const first = result.current;
    expect(first.size).toBe(0);
    rerender({ ids: undefined });
    expect(result.current).toBe(first);
  });
});

describe('ReadOnlyNodesProvider updates', () => {
  // The reason this is a store and not a plain context value: locking one node
  // must not re-render every other node on the canvas. Probe is memoized (as
  // BaseNode is) so a parent re-render alone cannot explain a re-render here.
  const Probe = memo(function Probe({
    id,
    counts,
  }: {
    id: string;
    counts: Record<string, number>;
  }) {
    const readOnly = useIsNodeReadOnly(id);
    counts[id] = (counts[id] ?? 0) + 1;
    return <span data-testid={`probe-${id}`}>{String(readOnly)}</span>;
  });

  it('starts with a frozen connection when both endpoints are locked', () => {
    const markup = renderToString(
      <ReadOnlyNodesProvider readOnlyNodeIds={new Set(['a', 'b'])}>
        <ConnectionProbe source="a" target="b" />
      </ReadOnlyNodesProvider>
    );

    expect(markup).toContain('data-frozen="true"');
  });

  it('re-renders only the nodes whose lock state changed', () => {
    const counts: Record<string, number> = {};
    const tree = (ids: ReadonlySet<string>) => (
      <ReadOnlyNodesProvider readOnlyNodeIds={ids}>
        <Probe id="a" counts={counts} />
        <Probe id="b" counts={counts} />
      </ReadOnlyNodesProvider>
    );

    const { rerender } = render(tree(new Set()));
    const before = { ...counts };

    rerender(tree(new Set(['a'])));

    expect(screen.getByTestId('probe-a')).toHaveTextContent('true');
    expect(screen.getByTestId('probe-b')).toHaveTextContent('false');
    expect(counts.a ?? 0).toBeGreaterThan(before.a ?? 0);
    expect(counts.b).toBe(before.b);
  });

  it('updates a node when it becomes unlocked', () => {
    const counts: Record<string, number> = {};
    const tree = (ids: ReadonlySet<string>) => (
      <ReadOnlyNodesProvider readOnlyNodeIds={ids}>
        <Probe id="a" counts={counts} />
      </ReadOnlyNodesProvider>
    );

    const { rerender } = render(tree(new Set(['a'])));
    expect(screen.getByTestId('probe-a')).toHaveTextContent('true');

    rerender(tree(new Set()));
    expect(screen.getByTestId('probe-a')).toHaveTextContent('false');
  });
});
