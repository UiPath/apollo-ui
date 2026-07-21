import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BaseCanvasModeProvider } from '../../BaseCanvas/BaseCanvasModeProvider';
import type { NodeMenuAction } from '../../NodeContextMenu';
import {
  type SequentialMoveActionsContextValue,
  SequentialMoveActionsProvider,
} from '../SequentialMoveActionsContext';
import type { SequentialMoveOptions } from '../sequentialMoveActions';
import { useSequentialMoveMenuItems } from './useSequentialMoveMenuItems';

function makeMoveActions(
  overrides: Partial<SequentialMoveActionsContextValue> = {}
): SequentialMoveActionsContextValue {
  return {
    getMoveOptions: () => ({
      up: undefined,
      down: undefined,
      indent: undefined,
      outdent: undefined,
    }),
    commitMove: vi.fn(),
    centerOnNode: vi.fn(),
    ...overrides,
  };
}

function wrapper(
  mode: 'design' | 'view' | 'readonly',
  moveActions?: SequentialMoveActionsContextValue
) {
  return ({ children }: { children: ReactNode }) => (
    <BaseCanvasModeProvider mode={mode}>
      {moveActions ? (
        <SequentialMoveActionsProvider value={moveActions}>
          {children}
        </SequentialMoveActionsProvider>
      ) : (
        children
      )}
    </BaseCanvasModeProvider>
  );
}

describe('useSequentialMoveMenuItems', () => {
  it('returns an empty array outside a SequentialMoveActionsContext provider', () => {
    const { result } = renderHook(() => useSequentialMoveMenuItems('a'), {
      wrapper: wrapper('design'),
    });
    expect(result.current).toEqual([]);
  });

  it('returns an empty array outside design mode, even with a provider', () => {
    const moveActions = makeMoveActions();
    const { result } = renderHook(() => useSequentialMoveMenuItems('a'), {
      wrapper: wrapper('view', moveActions),
    });
    expect(result.current).toEqual([]);
  });

  it('builds four items with localized labels, in design mode with a provider', () => {
    const moveActions = makeMoveActions();
    const { result } = renderHook(() => useSequentialMoveMenuItems('a'), {
      wrapper: wrapper('design', moveActions),
    });

    expect(result.current).toHaveLength(4);
    const labels = (result.current as NodeMenuAction[]).map((item) => item.label);
    expect(labels).toEqual(['Move up', 'Move down', 'Move into previous step', 'Move out']);
  });

  it('disables an item when its direction has no slot, and enables it otherwise', () => {
    const options: SequentialMoveOptions = {
      up: { id: 'up-slot', source: { nodeId: 'prev' } },
      down: undefined,
      indent: undefined,
      outdent: undefined,
    };
    const moveActions = makeMoveActions({ getMoveOptions: () => options });
    const { result } = renderHook(() => useSequentialMoveMenuItems('a'), {
      wrapper: wrapper('design', moveActions),
    });

    const items = result.current as NodeMenuAction[];
    expect(items.find((item) => item.label === 'Move up')?.disabled).toBe(false);
    expect(items.find((item) => item.label === 'Move down')?.disabled).toBe(true);
  });

  it('clicking an enabled item calls commitMove with the node id and the resolved slot', () => {
    const slot = { id: 'up-slot', source: { nodeId: 'prev' } };
    const commitMove = vi.fn();
    const moveActions = makeMoveActions({
      getMoveOptions: () => ({ up: slot, down: undefined, indent: undefined, outdent: undefined }),
      commitMove,
    });
    const { result } = renderHook(() => useSequentialMoveMenuItems('node-a'), {
      wrapper: wrapper('design', moveActions),
    });

    const upItem = (result.current as NodeMenuAction[]).find((item) => item.label === 'Move up')!;
    upItem.onClick();
    expect(commitMove).toHaveBeenCalledWith('node-a', slot);
  });

  it('clicking a disabled item does not call commitMove', () => {
    const commitMove = vi.fn();
    const moveActions = makeMoveActions({ commitMove });
    const { result } = renderHook(() => useSequentialMoveMenuItems('node-a'), {
      wrapper: wrapper('design', moveActions),
    });

    const downItem = (result.current as NodeMenuAction[]).find(
      (item) => item.label === 'Move down'
    )!;
    downItem.onClick();
    expect(commitMove).not.toHaveBeenCalled();
  });
});
