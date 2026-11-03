import { renderHook } from '@testing-library/react';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { applyPreviewGraphToReactFlow, showPreviewGraph } from '../../../utils/createPreviewGraph';
import type { InsertionSlot } from '../../../utils/sequential/sequential.types';
import { SequentialInsertGapProvider } from '../SequentialInsertGapContext';
import { SequentialInsertStateProvider } from '../SequentialInsertStateContext';
import { useSequentialInsert } from './useSequentialInsert';

// The preview pipeline needs a live RF store; only the pending-slot bookkeeping is under test.
vi.mock('../../../utils/createPreviewGraph', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../utils/createPreviewGraph')>()),
  showPreviewGraph: vi.fn(),
  createPreviewGraph: vi.fn(() => ({
    node: { id: 'preview-node-id', position: { x: 0, y: 0 }, data: { unconnected: true } },
    edges: [{ id: 'preview-edge', source: 'api', target: 'preview-node-id' }],
  })),
  applyPreviewGraphToReactFlow: vi.fn(),
}));

describe('useSequentialInsert', () => {
  it('publishes the clicked slot so the placeholder is swapped for the preview row', () => {
    const setGapSlot = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SequentialInsertStateProvider>
        <SequentialInsertGapProvider value={setGapSlot}>{children}</SequentialInsertGapProvider>
      </SequentialInsertStateProvider>
    );
    const hook = renderHook(() => useSequentialInsert(), { wrapper });
    const slot: InsertionSlot = { id: 'tail', source: { nodeId: 'last-step' } };

    hook.result.current.startInsert({
      slot,
      source: 'last-step',
      target: '',
      sourcePosition: Position.Bottom,
      position: { x: 0, y: 72 },
    });

    expect(setGapSlot).toHaveBeenCalledWith(slot);
  });

  it('shares the pending slot across separate hook instances so container parenting survives commit', () => {
    // Regression: the ⊕ (startInsert) and AddNodeManager's onBeforeNodeAdded are
    // different hook instances; a per-instance ref dropped the slot's containerId on commit.
    const hooks = renderHook(
      () => ({ opener: useSequentialInsert(), committer: useSequentialInsert() }),
      { wrapper: SequentialInsertStateProvider }
    );

    const slot: InsertionSlot = {
      id: 'slot-then',
      source: { nodeId: 'if', handleId: 'true' },
      target: { nodeId: 'javascript-1', handleId: 'input' },
      graphEdgeId: 'e-if-then',
      containerId: 'for-each',
    };

    hooks.result.current.opener.startInsert({
      slot,
      source: 'if',
      target: 'javascript-1',
      sourcePosition: Position.Bottom,
      position: { x: 0, y: 0 },
    });

    const previewNode: Node = {
      id: 'preview-node-id',
      type: 'uipath.blank-node',
      position: { x: 0, y: 0 },
      data: {},
    };
    const { newNode } = hooks.result.current.committer.onBeforeNodeAdded(previewNode, []);

    expect(newNode.parentId).toBe('for-each');
    expect(newNode.extent).toBe('parent');
  });

  it('isolates pending inserts between canvas providers', () => {
    const canvasA = renderHook(() => useSequentialInsert(), {
      wrapper: SequentialInsertStateProvider,
    });
    const canvasB = renderHook(() => useSequentialInsert(), {
      wrapper: SequentialInsertStateProvider,
    });
    canvasA.result.current.startInsert({
      slot: { id: 'a', source: { nodeId: 'a' }, containerId: 'container-a' },
      source: 'a',
      target: '',
      sourcePosition: Position.Bottom,
      position: { x: 0, y: 0 },
    });
    canvasB.result.current.startInsert({
      slot: { id: 'b', source: { nodeId: 'b' }, containerId: 'container-b' },
      source: 'b',
      target: '',
      sourcePosition: Position.Bottom,
      position: { x: 0, y: 0 },
    });
    const seed: Node = { id: 'preview-node-id', position: { x: 0, y: 0 }, data: {} };
    expect(canvasA.result.current.onBeforeNodeAdded(seed, []).newNode.parentId).toBe('container-a');
    expect(canvasB.result.current.onBeforeNodeAdded(seed, []).newNode.parentId).toBe('container-b');
  });

  it('applies an unconnected insert as the preview node alone, then parents it on commit', () => {
    vi.mocked(showPreviewGraph).mockClear();
    const hook = renderHook(() => useSequentialInsert(), {
      wrapper: SequentialInsertStateProvider,
    });
    hook.result.current.startInsert({
      slot: { id: 'slot:lane:api:body', containerId: 'api', unconnected: true },
      source: 'api',
      target: '',
      sourcePosition: Position.Bottom,
      position: { x: 0, y: 0 },
    });

    expect(showPreviewGraph).not.toHaveBeenCalled();
    expect(vi.mocked(applyPreviewGraphToReactFlow).mock.calls[0]?.[0].edges).toEqual([]);
    const seed: Node = { id: 'preview-node-id', position: { x: 0, y: 0 }, data: {} };
    const { newNode, newEdges } = hook.result.current.onBeforeNodeAdded(seed, []);
    expect(newNode.parentId).toBe('api');
    expect(newEdges).toEqual([]);
  });

  it('returns an add untouched when no insert is pending (an ordinary flow-view add)', () => {
    const hook = renderHook(() => useSequentialInsert(), {
      wrapper: SequentialInsertStateProvider,
    });
    const node = { id: 'step-1700000000000', type: 'step', position: { x: 4, y: 8 }, data: {} };
    const edges = [{ id: 'e', source: 'a', target: node.id }];

    const result = hook.result.current.onBeforeNodeAdded(node as Node, edges);

    expect(result.sequenceInsert).toBe(false);
    // Same objects: no re-id, no `seqInserted` flag, no container parenting.
    expect(result.newNode).toBe(node);
    expect(result.newEdges).toBe(edges);
  });

  it('consumes the pending slot once, so a later add is not treated as that insert', () => {
    const hook = renderHook(() => useSequentialInsert(), {
      wrapper: SequentialInsertStateProvider,
    });
    hook.result.current.startInsert({
      slot: { id: 'slot', source: { nodeId: 'a' }, containerId: 'loop' },
      source: 'a',
      target: '',
      sourcePosition: Position.Bottom,
      position: { x: 0, y: 0 },
    });
    const node = () =>
      ({ id: 'step-1700000000000', type: 'step', position: { x: 0, y: 0 }, data: {} }) as Node;

    const first = hook.result.current.onBeforeNodeAdded(node(), []);
    const second = hook.result.current.onBeforeNodeAdded(node(), []);

    expect(first.sequenceInsert).toBe(true);
    expect(first.newNode.parentId).toBe('loop');
    expect(second.sequenceInsert).toBe(false);
    expect(second.newNode.parentId).toBeUndefined();
  });
});
