/**
 * Group Modification Utilities
 *
 * Provides generic functions and handlers for modifying grouped task arrays.
 * These utilities are generic over item type `<T>` and can be used with any
 * array-of-arrays structure.
 */

export enum GroupModificationType {
  TASK_GROUP_UP = 'task_group_up',
  TASK_GROUP_DOWN = 'task_group_down',
  UNGROUP_ALL_TASKS = 'ungroup_all_tasks',
  SPLIT_GROUP = 'split_group',
  MERGE_GROUP_UP = 'merge_group_up',
  MERGE_GROUP_DOWN = 'merge_group_down',
  REMOVE_TASK = 'remove_task',
  REMOVE_GROUP = 'remove_group',
}

/**
 * Pure function to move a task group up (swap with previous group)
 */
export function moveGroupUp<T>(tasks: T[][], groupIndex: number, taskIndex: number): T[][] {
  // Validation
  if (groupIndex < 0 || groupIndex >= tasks.length || groupIndex === 0) {
    return tasks;
  }

  const currentGroup = tasks[groupIndex];
  if (!currentGroup || taskIndex < 0 || taskIndex >= currentGroup.length) {
    return tasks;
  }

  // Move task group up (swap with previous group)
  const updatedTasks = [...tasks];
  const prevGroup = updatedTasks[groupIndex - 1];
  const currentGroupItem = updatedTasks[groupIndex];
  if (prevGroup && currentGroupItem) {
    updatedTasks[groupIndex - 1] = currentGroupItem;
    updatedTasks[groupIndex] = prevGroup;
  }
  return updatedTasks;
}

/**
 * Pure function to move a task group down (swap with next group)
 */
export function moveGroupDown<T>(tasks: T[][], groupIndex: number, taskIndex: number): T[][] {
  // Validation
  if (groupIndex < 0 || groupIndex >= tasks.length || groupIndex >= tasks.length - 1) {
    return tasks;
  }

  const currentGroup = tasks[groupIndex];
  if (!currentGroup || taskIndex < 0 || taskIndex >= currentGroup.length) {
    return tasks;
  }

  // Move task group down (swap with next group)
  const updatedTasks = [...tasks];
  const currentGroupItem = updatedTasks[groupIndex];
  const nextGroup = updatedTasks[groupIndex + 1];
  if (currentGroupItem && nextGroup) {
    updatedTasks[groupIndex] = nextGroup;
    updatedTasks[groupIndex + 1] = currentGroupItem;
  }
  return updatedTasks;
}

/**
 * Pure function to ungroup parallel tasks - split into individual sequential groups
 */
export function ungroupAllTasks<T>(tasks: T[][], groupIndex: number, taskIndex: number): T[][] {
  // Validation
  if (groupIndex < 0 || groupIndex >= tasks.length) {
    return tasks;
  }

  const currentGroup = tasks[groupIndex];
  if (!currentGroup || taskIndex < 0 || taskIndex >= currentGroup.length) {
    return tasks;
  }

  // Ungroup parallel tasks - split into individual sequential groups
  if (currentGroup.length > 1) {
    const updatedTasks = [...tasks];
    const ungroupedTasks = currentGroup.map((t) => [t]);
    updatedTasks.splice(groupIndex, 1, ...ungroupedTasks);
    return updatedTasks;
  }
  return tasks;
}

/**
 * Pure function to remove task from parallel group
 */
export function splitGroup<T>(tasks: T[][], groupIndex: number, taskIndex: number): T[][] {
  // Validation
  if (groupIndex < 0 || groupIndex >= tasks.length) {
    return tasks;
  }

  const currentGroup = tasks[groupIndex];
  if (!currentGroup || taskIndex < 0 || taskIndex >= currentGroup.length) {
    return tasks;
  }

  const task = currentGroup[taskIndex];
  if (!task) {
    return tasks;
  }

  // Remove task from parallel group
  if (currentGroup.length > 1) {
    const updatedTasks = [...tasks];
    const remainingTasks = currentGroup.filter((_, idx) => idx !== taskIndex);
    const splitTask: T[] = [task];
    if (remainingTasks.length > 0) {
      updatedTasks[groupIndex] = remainingTasks;
      updatedTasks.splice(groupIndex + 1, 0, splitTask);
    } else {
      updatedTasks[groupIndex] = splitTask;
    }
    return updatedTasks;
  }
  return tasks;
}

/**
 * Pure function to merge task with group above (create or add to parallel group)
 */
export function mergeGroupUp<T>(tasks: T[][], groupIndex: number, taskIndex: number): T[][] {
  // Validation
  if (groupIndex < 0 || groupIndex >= tasks.length || groupIndex === 0) {
    return tasks;
  }

  const currentGroup = tasks[groupIndex];
  if (!currentGroup || taskIndex < 0 || taskIndex >= currentGroup.length) {
    return tasks;
  }

  const task = currentGroup[taskIndex];
  if (!task) {
    return tasks;
  }

  // Merge with group above (create or add to parallel group)
  const updatedTasks = [...tasks];
  const aboveGroup = updatedTasks[groupIndex - 1];
  const currentGroupWithoutTask = currentGroup.filter((_, idx) => idx !== taskIndex);

  if (aboveGroup) {
    // Add task to the group above
    updatedTasks[groupIndex - 1] = [...aboveGroup, task];

    // Remove task from current group or remove group if empty
    if (currentGroupWithoutTask.length > 0) {
      updatedTasks[groupIndex] = currentGroupWithoutTask;
    } else {
      updatedTasks.splice(groupIndex, 1);
    }
  }
  return updatedTasks;
}

/**
 * Pure function to merge task with group below (create or add to parallel group)
 */
export function mergeGroupDown<T>(tasks: T[][], groupIndex: number, taskIndex: number): T[][] {
  // Validation
  if (groupIndex < 0 || groupIndex >= tasks.length || groupIndex >= tasks.length - 1) {
    return tasks;
  }

  const currentGroup = tasks[groupIndex];
  if (!currentGroup || taskIndex < 0 || taskIndex >= currentGroup.length) {
    return tasks;
  }

  const task = currentGroup[taskIndex];
  if (!task) {
    return tasks;
  }

  // Merge with group below (create or add to parallel group)
  const updatedTasks = [...tasks];
  const belowGroup = updatedTasks[groupIndex + 1];
  const currentGroupWithoutTask = currentGroup.filter((_, idx) => idx !== taskIndex);

  if (belowGroup) {
    // Add task to the group below
    updatedTasks[groupIndex + 1] = [...belowGroup, task];

    // Remove task from current group or remove group if empty
    if (currentGroupWithoutTask.length > 0) {
      updatedTasks[groupIndex] = currentGroupWithoutTask;
    } else {
      updatedTasks.splice(groupIndex, 1);
    }
  }
  return updatedTasks;
}

/**
 * Pure function to remove task from group
 */
export function removeTask<T>(tasks: T[][], groupIndex: number, taskIndex: number): T[][] {
  // Validation
  if (groupIndex < 0 || groupIndex >= tasks.length) {
    return tasks;
  }

  const currentGroup = tasks[groupIndex];
  if (!currentGroup || taskIndex < 0 || taskIndex >= currentGroup.length) {
    return tasks;
  }

  // Remove task from group
  const updatedTasks = [...tasks];
  const groupWithoutTask = currentGroup.filter((_, idx) => idx !== taskIndex);
  if (groupWithoutTask.length > 0) {
    updatedTasks[groupIndex] = groupWithoutTask;
  } else {
    updatedTasks.splice(groupIndex, 1);
  }
  return updatedTasks;
}

/**
 * Pure function to remove entire group
 */
export function removeGroup<T>(tasks: T[][], groupIndex: number, taskIndex: number): T[][] {
  // Validation
  if (groupIndex < 0 || groupIndex >= tasks.length) {
    return tasks;
  }

  const currentGroup = tasks[groupIndex];
  if (!currentGroup || taskIndex < 0 || taskIndex >= currentGroup.length) {
    return tasks;
  }

  // Remove entire group
  const updatedTasks = [...tasks];
  updatedTasks.splice(groupIndex, 1);
  return updatedTasks;
}

/**
 * Handler factory that returns an object with methods for each modification type.
 * Each method takes tasks as first parameter and returns the modified array.
 */
export function createGroupModificationHandlers<T>() {
  return {
    moveGroupUp: (tasks: T[][], groupIndex: number, taskIndex: number) =>
      moveGroupUp(tasks, groupIndex, taskIndex),
    moveGroupDown: (tasks: T[][], groupIndex: number, taskIndex: number) =>
      moveGroupDown(tasks, groupIndex, taskIndex),
    ungroupAll: (tasks: T[][], groupIndex: number, taskIndex: number) =>
      ungroupAllTasks(tasks, groupIndex, taskIndex),
    splitGroup: (tasks: T[][], groupIndex: number, taskIndex: number) =>
      splitGroup(tasks, groupIndex, taskIndex),
    mergeGroupUp: (tasks: T[][], groupIndex: number, taskIndex: number) =>
      mergeGroupUp(tasks, groupIndex, taskIndex),
    mergeGroupDown: (tasks: T[][], groupIndex: number, taskIndex: number) =>
      mergeGroupDown(tasks, groupIndex, taskIndex),
    removeTask: (tasks: T[][], groupIndex: number, taskIndex: number) =>
      removeTask(tasks, groupIndex, taskIndex),
    removeGroup: (tasks: T[][], groupIndex: number, taskIndex: number) =>
      removeGroup(tasks, groupIndex, taskIndex),
  };
}

/**
 * Type for the handler object returned by createGroupModificationHandlers
 */
export type GroupModificationHandlers<T> = ReturnType<typeof createGroupModificationHandlers<T>>;

/**
 * Maps GroupModificationType enum to the corresponding handler function.
 * Throws an error if the type doesn't have a corresponding handler (exhaustiveness check).
 */
export function getHandlerForModificationType<T>(
  handlers: GroupModificationHandlers<T>,
  type: GroupModificationType
): (tasks: T[][], groupIndex: number, taskIndex: number) => T[][] {
  switch (type) {
    case GroupModificationType.TASK_GROUP_UP:
      return handlers.moveGroupUp;
    case GroupModificationType.TASK_GROUP_DOWN:
      return handlers.moveGroupDown;
    case GroupModificationType.UNGROUP_ALL_TASKS:
      return handlers.ungroupAll;
    case GroupModificationType.SPLIT_GROUP:
      return handlers.splitGroup;
    case GroupModificationType.MERGE_GROUP_UP:
      return handlers.mergeGroupUp;
    case GroupModificationType.MERGE_GROUP_DOWN:
      return handlers.mergeGroupDown;
    case GroupModificationType.REMOVE_TASK:
      return handlers.removeTask;
    case GroupModificationType.REMOVE_GROUP:
      return handlers.removeGroup;
    default: {
      // Exhaustiveness check - TypeScript will error if a case is missing
      const _exhaustive: never = type;
      throw new Error(`Unknown GroupModificationType: ${_exhaustive}`);
    }
  }
}
