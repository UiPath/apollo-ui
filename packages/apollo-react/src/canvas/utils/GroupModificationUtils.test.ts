import { describe, expect, it } from 'vitest';
import {
  createGroupModificationHandlers,
  GroupModificationType,
  getHandlerForModificationType,
  mergeGroupDown,
  mergeGroupUp,
  moveGroupDown,
  moveGroupUp,
  removeGroup,
  removeTask,
  splitGroup,
  ungroupAllTasks,
} from './GroupModificationUtils';

type TestItem = { id: string; label?: string };

const createItem = (id: string, label?: string): TestItem => ({ id, label });

describe('GroupModificationUtils', () => {
  it('moveGroupUp: should swap group with previous group', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = moveGroupUp(tasks, 1, 0);
    expect(result).toEqual([[createItem('2')], [createItem('1')], [createItem('3')]]);
  });

  it('moveGroupUp: should return original array if groupIndex is 0 (already at top)', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = moveGroupUp(tasks, 0, 0);
    expect(result).toBe(tasks);
  });

  it('moveGroupUp: should return original array if groupIndex is negative', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = moveGroupUp(tasks, -1, 0);
    expect(result).toBe(tasks);
  });

  it('moveGroupUp: should return original array if groupIndex is out of bounds', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = moveGroupUp(tasks, 5, 0);
    expect(result).toBe(tasks);
  });

  it('moveGroupUp: should return original array if taskIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = moveGroupUp(tasks, 1, 5);
    expect(result).toBe(tasks);
  });

  it('moveGroupUp: should handle parallel groups correctly', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3')],
      [createItem('4')],
    ];
    const result = moveGroupUp(tasks, 2, 0);
    expect(result).toEqual([
      [createItem('1')],
      [createItem('4')],
      [createItem('2'), createItem('3')],
    ]);
  });

  it('moveGroupDown: should swap group with next group', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = moveGroupDown(tasks, 1, 0);
    expect(result).toEqual([[createItem('1')], [createItem('3')], [createItem('2')]]);
  });

  it('moveGroupDown: should return original array if groupIndex is last (already at bottom)', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = moveGroupDown(tasks, 1, 0);
    expect(result).toBe(tasks);
  });

  it('moveGroupDown: should return original array if groupIndex is negative', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = moveGroupDown(tasks, -1, 0);
    expect(result).toBe(tasks);
  });

  it('moveGroupDown: should return original array if groupIndex is out of bounds', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = moveGroupDown(tasks, 5, 0);
    expect(result).toBe(tasks);
  });

  it('moveGroupDown: should return original array if taskIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = moveGroupDown(tasks, 0, 5);
    expect(result).toBe(tasks);
  });

  it('moveGroupDown: should handle parallel groups correctly', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3')],
      [createItem('4')],
    ];
    const result = moveGroupDown(tasks, 0, 0);
    expect(result).toEqual([
      [createItem('2'), createItem('3')],
      [createItem('1')],
      [createItem('4')],
    ]);
  });

  it('ungroupAllTasks: should split parallel group into individual sequential groups', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3'), createItem('4')],
      [createItem('5')],
    ];
    const result = ungroupAllTasks(tasks, 1, 0);
    expect(result).toEqual([
      [createItem('1')],
      [createItem('2')],
      [createItem('3')],
      [createItem('4')],
      [createItem('5')],
    ]);
  });

  it('ungroupAllTasks: should return original array if group has only one task', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = ungroupAllTasks(tasks, 0, 0);
    expect(result).toBe(tasks);
  });

  it('ungroupAllTasks: should return original array if groupIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = ungroupAllTasks(tasks, 5, 0);
    expect(result).toBe(tasks);
  });

  it('ungroupAllTasks: should return original array if taskIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1'), createItem('2')]];
    const result = ungroupAllTasks(tasks, 0, 5);
    expect(result).toBe(tasks);
  });

  it('ungroupAllTasks: should handle ungrouping at the beginning', () => {
    const tasks: TestItem[][] = [[createItem('1'), createItem('2')], [createItem('3')]];
    const result = ungroupAllTasks(tasks, 0, 0);
    expect(result).toEqual([[createItem('1')], [createItem('2')], [createItem('3')]]);
  });

  it('ungroupAllTasks: should handle ungrouping at the end', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2'), createItem('3')]];
    const result = ungroupAllTasks(tasks, 1, 0);
    expect(result).toEqual([[createItem('1')], [createItem('2')], [createItem('3')]]);
  });

  it('splitGroup: should remove task from parallel group and create new sequential group', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3'), createItem('4')],
      [createItem('5')],
    ];
    const result = splitGroup(tasks, 1, 1);
    expect(result).toEqual([
      [createItem('1')],
      [createItem('2'), createItem('4')],
      [createItem('3')],
      [createItem('5')],
    ]);
  });

  it('splitGroup: should handle splitting first task in parallel group', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3')],
      [createItem('4')],
    ];
    const result = splitGroup(tasks, 1, 0);
    expect(result).toEqual([
      [createItem('1')],
      [createItem('3')],
      [createItem('2')],
      [createItem('4')],
    ]);
  });

  it('splitGroup: should handle splitting last task in parallel group', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3')],
      [createItem('4')],
    ];
    const result = splitGroup(tasks, 1, 1);
    expect(result).toEqual([
      [createItem('1')],
      [createItem('2')],
      [createItem('3')],
      [createItem('4')],
    ]);
  });

  it('splitGroup: should replace group with single task if only one task remains', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3')],
      [createItem('4')],
    ];
    const result = splitGroup(tasks, 1, 0);
    // After removing '2', group becomes [createItem('3')]
    // Then '2' is inserted after
    expect(result[1]).toEqual([createItem('3')]);
    expect(result[2]).toEqual([createItem('2')]);
  });

  it('splitGroup: should return original array if group has only one task', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = splitGroup(tasks, 0, 0);
    expect(result).toBe(tasks);
  });

  it('splitGroup: should return original array if groupIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1'), createItem('2')]];
    const result = splitGroup(tasks, 5, 0);
    expect(result).toBe(tasks);
  });

  it('splitGroup: should return original array if taskIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1'), createItem('2')]];
    const result = splitGroup(tasks, 0, 5);
    expect(result).toBe(tasks);
  });

  it('mergeGroupUp: should merge task with group above', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = mergeGroupUp(tasks, 1, 0);
    expect(result).toEqual([[createItem('1'), createItem('2')], [createItem('3')]]);
  });

  it('mergeGroupUp: should remove group if it becomes empty after merge', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = mergeGroupUp(tasks, 1, 0);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([createItem('1'), createItem('2')]);
  });

  it('mergeGroupUp: should merge into existing parallel group above', () => {
    const tasks: TestItem[][] = [
      [createItem('1'), createItem('2')],
      [createItem('3')],
      [createItem('4')],
    ];
    const result = mergeGroupUp(tasks, 1, 0);
    expect(result).toEqual([
      [createItem('1'), createItem('2'), createItem('3')],
      [createItem('4')],
    ]);
  });

  it('mergeGroupUp: should return original array if groupIndex is 0 (no group above)', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = mergeGroupUp(tasks, 0, 0);
    expect(result).toBe(tasks);
  });

  it('mergeGroupUp: should return original array if groupIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = mergeGroupUp(tasks, 5, 0);
    expect(result).toBe(tasks);
  });

  it('mergeGroupUp: should return original array if taskIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = mergeGroupUp(tasks, 1, 5);
    expect(result).toBe(tasks);
  });

  it('mergeGroupUp: should keep remaining tasks in current group after merge', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3')],
      [createItem('4')],
    ];
    const result = mergeGroupUp(tasks, 1, 0);
    expect(result).toEqual([
      [createItem('1'), createItem('2')],
      [createItem('3')],
      [createItem('4')],
    ]);
  });

  it('mergeGroupDown: should merge task with group below', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = mergeGroupDown(tasks, 1, 0);
    expect(result).toEqual([[createItem('1')], [createItem('3'), createItem('2')]]);
  });

  it('mergeGroupDown: should remove group if it becomes empty after merge', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = mergeGroupDown(tasks, 1, 0);
    expect(result).toHaveLength(2);
    expect(result[1]).toEqual([createItem('3'), createItem('2')]);
  });

  it('mergeGroupDown: should merge into existing parallel group below', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2')],
      [createItem('3'), createItem('4')],
    ];
    const result = mergeGroupDown(tasks, 1, 0);
    expect(result).toEqual([
      [createItem('1')],
      [createItem('3'), createItem('4'), createItem('2')],
    ]);
  });

  it('mergeGroupDown: should return original array if groupIndex is last (no group below)', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = mergeGroupDown(tasks, 1, 0);
    expect(result).toBe(tasks);
  });

  it('mergeGroupDown: should return original array if groupIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = mergeGroupDown(tasks, 5, 0);
    expect(result).toBe(tasks);
  });

  it('mergeGroupDown: should return original array if taskIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = mergeGroupDown(tasks, 0, 5);
    expect(result).toBe(tasks);
  });

  it('mergeGroupDown: should keep remaining tasks in current group after merge', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3')],
      [createItem('4')],
    ];
    const result = mergeGroupDown(tasks, 1, 0);
    expect(result).toEqual([
      [createItem('1')],
      [createItem('3')],
      [createItem('4'), createItem('2')],
    ]);
  });

  it('removeTask: should remove task from group', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3'), createItem('4')],
      [createItem('5')],
    ];
    const result = removeTask(tasks, 1, 1);
    expect(result).toEqual([
      [createItem('1')],
      [createItem('2'), createItem('4')],
      [createItem('5')],
    ]);
  });

  it('removeTask: should remove entire group if it becomes empty', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = removeTask(tasks, 1, 0);
    expect(result).toEqual([[createItem('1')], [createItem('3')]]);
  });

  it('removeTask: should return original array if groupIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = removeTask(tasks, 5, 0);
    expect(result).toBe(tasks);
  });

  it('removeTask: should return original array if taskIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = removeTask(tasks, 0, 5);
    expect(result).toBe(tasks);
  });

  it('removeTask: should handle removing first task in group', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3')],
      [createItem('4')],
    ];
    const result = removeTask(tasks, 1, 0);
    expect(result).toEqual([[createItem('1')], [createItem('3')], [createItem('4')]]);
  });

  it('removeTask: should handle removing last task in group', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3')],
      [createItem('4')],
    ];
    const result = removeTask(tasks, 1, 1);
    expect(result).toEqual([[createItem('1')], [createItem('2')], [createItem('4')]]);
  });

  it('removeGroup: should remove entire group', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3')],
      [createItem('4')],
    ];
    const result = removeGroup(tasks, 1, 0);
    expect(result).toEqual([[createItem('1')], [createItem('4')]]);
  });

  it('removeGroup: should handle removing first group', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = removeGroup(tasks, 0, 0);
    expect(result).toEqual([[createItem('2')], [createItem('3')]]);
  });

  it('removeGroup: should handle removing last group', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = removeGroup(tasks, 2, 0);
    expect(result).toEqual([[createItem('1')], [createItem('2')]]);
  });

  it('removeGroup: should return original array if groupIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = removeGroup(tasks, 5, 0);
    expect(result).toBe(tasks);
  });

  it('removeGroup: should return original array if taskIndex is invalid', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')]];
    const result = removeGroup(tasks, 0, 5);
    expect(result).toBe(tasks);
  });

  it('removeGroup: should handle removing group with multiple tasks', () => {
    const tasks: TestItem[][] = [
      [createItem('1')],
      [createItem('2'), createItem('3'), createItem('4')],
      [createItem('5')],
    ];
    const result = removeGroup(tasks, 1, 0);
    expect(result).toEqual([[createItem('1')], [createItem('5')]]);
  });

  it('createGroupModificationHandlers: should return all handler methods', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    expect(handlers).toHaveProperty('moveGroupUp');
    expect(handlers).toHaveProperty('moveGroupDown');
    expect(handlers).toHaveProperty('ungroupAll');
    expect(handlers).toHaveProperty('splitGroup');
    expect(handlers).toHaveProperty('mergeGroupUp');
    expect(handlers).toHaveProperty('mergeGroupDown');
    expect(handlers).toHaveProperty('removeTask');
    expect(handlers).toHaveProperty('removeGroup');
  });

  it('createGroupModificationHandlers: should return handlers that work correctly', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = handlers.moveGroupUp(tasks, 1, 0);
    expect(result).toEqual([[createItem('2')], [createItem('1')], [createItem('3')]]);
  });

  it('createGroupModificationHandlers: should work with different generic types', () => {
    type NumberItem = { value: number };
    const handlers = createGroupModificationHandlers<NumberItem>();
    const tasks: NumberItem[][] = [[{ value: 1 }], [{ value: 2 }]];
    const result = handlers.moveGroupUp(tasks, 1, 0);
    expect(result).toEqual([[{ value: 2 }], [{ value: 1 }]]);
  });

  it('getHandlerForModificationType: should return correct handler for TASK_GROUP_UP', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    const handler = getHandlerForModificationType(handlers, GroupModificationType.TASK_GROUP_UP);
    expect(handler).toBe(handlers.moveGroupUp);
  });

  it('getHandlerForModificationType: should return correct handler for TASK_GROUP_DOWN', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    const handler = getHandlerForModificationType(handlers, GroupModificationType.TASK_GROUP_DOWN);
    expect(handler).toBe(handlers.moveGroupDown);
  });

  it('getHandlerForModificationType: should return correct handler for UNGROUP_ALL_TASKS', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    const handler = getHandlerForModificationType(
      handlers,
      GroupModificationType.UNGROUP_ALL_TASKS
    );
    expect(handler).toBe(handlers.ungroupAll);
  });

  it('getHandlerForModificationType: should return correct handler for SPLIT_GROUP', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    const handler = getHandlerForModificationType(handlers, GroupModificationType.SPLIT_GROUP);
    expect(handler).toBe(handlers.splitGroup);
  });

  it('getHandlerForModificationType: should return correct handler for MERGE_GROUP_UP', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    const handler = getHandlerForModificationType(handlers, GroupModificationType.MERGE_GROUP_UP);
    expect(handler).toBe(handlers.mergeGroupUp);
  });

  it('getHandlerForModificationType: should return correct handler for MERGE_GROUP_DOWN', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    const handler = getHandlerForModificationType(handlers, GroupModificationType.MERGE_GROUP_DOWN);
    expect(handler).toBe(handlers.mergeGroupDown);
  });

  it('getHandlerForModificationType: should return correct handler for REMOVE_TASK', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    const handler = getHandlerForModificationType(handlers, GroupModificationType.REMOVE_TASK);
    expect(handler).toBe(handlers.removeTask);
  });

  it('getHandlerForModificationType: should return correct handler for REMOVE_GROUP', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    const handler = getHandlerForModificationType(handlers, GroupModificationType.REMOVE_GROUP);
    expect(handler).toBe(handlers.removeGroup);
  });

  it('getHandlerForModificationType: should work with returned handler', () => {
    const handlers = createGroupModificationHandlers<TestItem>();
    const handler = getHandlerForModificationType(handlers, GroupModificationType.TASK_GROUP_UP);
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const result = handler(tasks, 1, 0);
    expect(result).toEqual([[createItem('2')], [createItem('1')], [createItem('3')]]);
  });

  it('edge cases: should not mutate original array', () => {
    const tasks: TestItem[][] = [[createItem('1')], [createItem('2')], [createItem('3')]];
    const original = JSON.parse(JSON.stringify(tasks));
    moveGroupUp(tasks, 1, 0);
    expect(tasks).toEqual(original);
  });

  it('edge cases: should handle empty arrays', () => {
    const tasks: TestItem[][] = [];
    const result = moveGroupUp(tasks, 0, 0);
    expect(result).toBe(tasks);
  });

  it('edge cases: should handle arrays with empty groups', () => {
    const tasks: TestItem[][] = [[], [createItem('1')]];
    const result = moveGroupUp(tasks, 1, 0);
    expect(result).toEqual([[createItem('1')], []]);
  });

  it('edge cases: should handle single group', () => {
    const tasks: TestItem[][] = [[createItem('1'), createItem('2')]];
    const result = ungroupAllTasks(tasks, 0, 0);
    expect(result).toEqual([[createItem('1')], [createItem('2')]]);
  });
});
