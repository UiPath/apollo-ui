import { act, render } from '@testing-library/react';
import { ReactFlowProvider, useStoreApi } from '@uipath/apollo-react/canvas/xyflow/react';
import type { UpdateNodeInternals } from '@uipath/apollo-react/canvas/xyflow/system';
import { StrictMode, useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBatchedUpdateNodeInternals } from './useBatchedUpdateNodeInternals';

interface InternalsUpdate {
  store: unknown;
  ids: string[];
}

const { updates } = vi.hoisted(() => ({ updates: [] as InternalsUpdate[] }));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>();
  const { useCallback } = await import('react');
  return {
    ...actual,
    useUpdateNodeInternals: () => {
      const { getState } = actual.useStoreApi();
      return useCallback<UpdateNodeInternals>(
        (ids) => {
          updates.push({ store: getState, ids: [ids].flat() });
        },
        [getState]
      );
    },
  };
});

interface NodeProbeProps {
  id: string;
}

function NodeProbe({ id }: NodeProbeProps) {
  const updateNodeInternals = useBatchedUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);
  return null;
}

interface StoreProbeProps {
  stores: unknown[];
}

function StoreProbe({ stores }: StoreProbeProps) {
  stores.push(useStoreApi().getState);
  return null;
}

const flushMicrotasks = () => act(async () => {});

describe('useBatchedUpdateNodeInternals', () => {
  afterEach(() => {
    updates.length = 0;
  });

  it('sends the ids of nodes mounted together to the store in one update', async () => {
    render(
      <ReactFlowProvider>
        <NodeProbe id="a" />
        <NodeProbe id="b" />
        <NodeProbe id="c" />
      </ReactFlowProvider>
    );
    await flushMicrotasks();

    expect(updates).toHaveLength(1);
    expect(updates[0]?.ids).toEqual(['a', 'b', 'c']);
  });

  it('sends one update to each store when two canvases mount together', async () => {
    const stores: unknown[] = [];
    render(
      <>
        <ReactFlowProvider>
          <StoreProbe stores={stores} />
          <NodeProbe id="a" />
          <NodeProbe id="b" />
        </ReactFlowProvider>
        <ReactFlowProvider>
          <StoreProbe stores={stores} />
          <NodeProbe id="a" />
          <NodeProbe id="c" />
        </ReactFlowProvider>
      </>
    );
    await flushMicrotasks();

    expect(stores[0]).not.toBe(stores[1]);
    expect(updates).toEqual([
      { store: stores[0], ids: ['a', 'b'] },
      { store: stores[1], ids: ['a', 'c'] },
    ]);
  });

  it('sends each id once when StrictMode runs the effects twice', async () => {
    render(
      <StrictMode>
        <ReactFlowProvider>
          <NodeProbe id="a" />
          <NodeProbe id="b" />
        </ReactFlowProvider>
      </StrictMode>
    );
    await flushMicrotasks();

    expect(updates).toHaveLength(1);
    expect(updates[0]?.ids).toEqual(['a', 'b']);
  });

  it('sends a new update when a node calls again after the first update', async () => {
    const { rerender } = render(
      <ReactFlowProvider>
        <NodeProbe key="a" id="a" />
        <NodeProbe key="b" id="b" />
      </ReactFlowProvider>
    );
    await flushMicrotasks();

    rerender(
      <ReactFlowProvider>
        <NodeProbe key="a" id="a" />
        <NodeProbe key="b-again" id="b" />
      </ReactFlowProvider>
    );
    await flushMicrotasks();

    expect(updates.map((update) => update.ids)).toEqual([['a', 'b'], ['b']]);
  });
});
