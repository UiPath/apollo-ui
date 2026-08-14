import type { DragEndEvent } from '@dnd-kit/core';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { StageTaskItem } from '../StageNode.types';
import { useStageFlatSectionReorder } from './useStageFlatSectionReorder';

const task = (id: string): StageTaskItem => ({ id, label: id });

const dragEnd = (activeId: string, overId: string | null): DragEndEvent =>
  ({ active: { id: activeId }, over: overId ? { id: overId } : null }) as DragEndEvent;

const setup = (taskGroups: StageTaskItem[][], isDragDisabled = false) => {
  const onReorder = vi.fn();
  const tasks = taskGroups.flatMap((group, groupIndex) =>
    group.map((t, taskIndex) => ({ task: t, groupIndex, taskIndex }))
  );
  const { result } = renderHook(() =>
    useStageFlatSectionReorder({ taskGroups, tasks, isDragDisabled, onReorder })
  );
  return { result, onReorder };
};

const ids = (groups: StageTaskItem[][]) => groups.map((group) => group.map((t) => t.id));

describe('useStageFlatSectionReorder', () => {
  describe('handleDragEnd', () => {
    it('moves the whole group when the drop lands in another group', () => {
      const { result, onReorder } = setup([[task('a')], [task('b')], [task('c')]]);

      result.current.handleDragEnd(dragEnd('a', 'c'));

      expect(ids(onReorder.mock.calls[0][0])).toEqual([['b'], ['c'], ['a']]);
    });

    it('keeps a multi-task group together when it moves', () => {
      const { result, onReorder } = setup([[task('a'), task('b')], [task('c')]]);

      result.current.handleDragEnd(dragEnd('a', 'c'));

      expect(ids(onReorder.mock.calls[0][0])).toEqual([['c'], ['a', 'b']]);
    });

    it('reorders inside the group when both rows belong to it', () => {
      const { result, onReorder } = setup([[task('a'), task('b'), task('c')]]);

      result.current.handleDragEnd(dragEnd('c', 'a'));

      expect(ids(onReorder.mock.calls[0][0])).toEqual([['c', 'a', 'b']]);
    });

    it('ignores a drop that landed on nothing', () => {
      const { result, onReorder } = setup([[task('a')], [task('b')]]);

      result.current.handleDragEnd(dragEnd('a', null));

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('ignores a drop back onto the dragged row', () => {
      const { result, onReorder } = setup([[task('a')], [task('b')]]);

      result.current.handleDragEnd(dragEnd('a', 'a'));

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('ignores a drop referencing a row outside this section', () => {
      const { result, onReorder } = setup([[task('a')], [task('b')]]);

      result.current.handleDragEnd(dragEnd('a', 'from-another-section'));

      expect(onReorder).not.toHaveBeenCalled();
    });
  });

  describe('getMoveMenuItems', () => {
    it('offers nothing while the section cannot be reordered', () => {
      const { result } = setup([[task('a')], [task('b')]], true);

      expect(result.current.getMoveMenuItems(task('a'))).toEqual([]);
    });

    it('disables only at the true ends of the section', () => {
      const { result } = setup([[task('a'), task('b')], [task('c')]]);

      const [firstUp] = result.current.getMoveMenuItems(task('a'));
      const [secondUp] = result.current.getMoveMenuItems(task('b'));
      const [, lastDown] = result.current.getMoveMenuItems(task('c'));

      // 'a' is the very first row, 'b' sits below it inside the same group, 'c' is the last row.
      expect(firstUp).toMatchObject({ id: 'move-up', disabled: true });
      expect(secondUp).toMatchObject({ id: 'move-up', disabled: false });
      expect(lastDown).toMatchObject({ id: 'move-down', disabled: true });
    });
  });
});
