import { renderHook } from '@testing-library/react';
import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { InsertionSlot } from '../../../utils/sequential/sequential.types';
import { SequentialInsertGapProvider } from '../SequentialInsertGapContext';
import { SequentialInsertStateProvider } from '../SequentialInsertStateContext';
import { useSequentialInsert } from './useSequentialInsert';

// The preview pipeline needs a live RF store; this hook test only exercises the
// pending-slot bookkeeping, so stub the side effect out.
vi.mock('../../../utils/createPreviewGraph', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../utils/createPreviewGraph')>()),
  showPreviewGraph: vi.fn(),
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
    // Regression: the connector plus (startInsert) and AddNodeManager's
    // onBeforeNodeAdded are DIFFERENT useSequentialInsert instances. A
    // per-instance ref left the commit side blind to the slot's containerId, so
    // inserts into a For Each body / branch lane dropped parentId and orphaned
    // the node. Both hook instances share one per-canvas provider.
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

    // The other instance's commit sees the opener's slot: container parent is
    // stamped so the node splices into the lane rather than orphaning at the end.
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
});
