import type { DragEndEvent } from '@dnd-kit/core';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { StageTaskItem } from '../StageNode.types';
import { useStageTaskDragHandler } from './useStageTaskDragHandler';

vi.mock('@xyflow/react', () => ({
  useStoreApi: () => ({ getState: () => ({ transform: [0, 0, 1] }) }),
}));

const task = (id: string): StageTaskItem => ({ id, label: id });
const ids = (groups: StageTaskItem[][]) => groups.map((group) => group.map((t) => t.id));
const dragEnd = (activeId: string, overId: string | null): DragEndEvent =>
  ({ active: { id: activeId }, over: overId ? { id: overId } : null }) as DragEndEvent;

const setup = (taskGroups: StageTaskItem[][], allowRegrouping = true) => {
  const onTaskReorder = vi.fn();
  const { result } = renderHook(() =>
    useStageTaskDragHandler({ taskGroups, onTaskReorder, allowRegrouping })
  );
  return { result, onTaskReorder };
};

describe('useStageTaskDragHandler', () => {
  describe('allowRegrouping: false (event-triggered / ad hoc sections)', () => {
    it('reorders rows without nesting them', () => {
      const { result, onTaskReorder } = setup([[task('a')], [task('b')], [task('c')]], false);

      result.current.handleDragEnd(dragEnd('a', 'c'));

      expect(ids(onTaskReorder.mock.calls[0][0])).toEqual([['b'], ['c'], ['a']]);
    });

    it('never produces a parallel group, however far the drag travelled sideways', () => {
      const { result, onTaskReorder } = setup([[task('a')], [task('b')]], false);

      // A large horizontal delta would project depth 1 in the sequential section.
      result.current.handleDragMove({ delta: { x: 500, y: 0 } } as never);
      result.current.handleDragEnd(dragEnd('a', 'b'));

      const next = onTaskReorder.mock.calls[0][0];
      expect(next.every((group: StageTaskItem[]) => group.length === 1)).toBe(true);
    });

    it('ignores a drop outside any row', () => {
      const { result, onTaskReorder } = setup([[task('a')], [task('b')]], false);

      result.current.handleDragEnd(dragEnd('a', null));

      expect(onTaskReorder).not.toHaveBeenCalled();
    });

    // The sequential section keeps allowRegrouping: true (the default) and is unchanged by this
    // flag — its nesting behaviour stays covered by the StageNode suite.
    it('ignores a drop back onto the dragged row', () => {
      const { result, onTaskReorder } = setup([[task('a')], [task('b')]], false);

      result.current.handleDragEnd(dragEnd('a', 'a'));

      expect(onTaskReorder).not.toHaveBeenCalled();
    });
  });
});
