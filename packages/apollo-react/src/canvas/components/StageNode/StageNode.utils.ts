import { arrayMove } from '@dnd-kit/sortable';
import { INDENTATION_WIDTH } from './StageNode.styles';
import type { StageTaskItem } from './StageNode.types';

/**
 * ID generator function type used by duplicateStageData.
 * Takes the original task ID and returns a new unique ID.
 */
export type IdGenerator = (originalId: string) => string;

/**
 * Result of duplicating stage data, containing the cloned tasks
 * with new IDs and a mapping from old IDs to new IDs.
 */
export interface DuplicateStageDataResult {
  /** Deep-cloned tasks with new IDs */
  tasks: StageTaskItem[][];
  /** Mapping from original task IDs to new task IDs */
  idMap: Record<string, string>;
}

/**
 * Duplicates stage task data with new unique IDs and returns a mapping
 * from old IDs to new IDs. Consumers should use the returned `idMap`
 * to remap any external references to task IDs (e.g., `selectedTasksIds`
 * in exit/entry conditions).
 *
 * @param tasks - The original stage tasks (array of task groups)
 * @param generateId - Function to generate a new unique ID for each task
 * @returns Object containing the cloned tasks and the old-to-new ID mapping
 *
 * @example
 * ```ts
 * import { nanoid } from 'nanoid';
 *
 * const { tasks: newTasks, idMap } = duplicateStageData(
 *   originalStage.tasks,
 *   () => nanoid()
 * );
 *
 * // Remap selectedTasksIds in exit conditions
 * const remappedConditions = exitConditions.map(condition => ({
 *   ...condition,
 *   selectedTasksIds: remapIds(condition.selectedTasksIds, idMap),
 * }));
 * ```
 */
export function duplicateStageData(
  tasks: StageTaskItem[][],
  generateId: IdGenerator
): DuplicateStageDataResult {
  const idMap: Record<string, string> = {};

  const clonedTasks = tasks.map((group) =>
    group.map((task) => {
      const newId = generateId(task.id);
      idMap[task.id] = newId;
      return { ...task, id: newId };
    })
  );

  return { tasks: clonedTasks, idMap };
}

/**
 * Remaps an array of IDs using the provided old-to-new ID mapping.
 * IDs not found in the mapping are preserved as-is.
 *
 * @param ids - Array of IDs to remap
 * @param idMap - Mapping from old IDs to new IDs
 * @returns New array with remapped IDs
 *
 * @example
 * ```ts
 * const remapped = remapIds(['task-1', 'task-2'], { 'task-1': 'task-new-1' });
 * // Result: ['task-new-1', 'task-2']
 * ```
 */
export function remapIds(ids: string[], idMap: Record<string, string>): string[] {
  return ids.map((id) => idMap[id] ?? id);
}

export interface FlattenedTask {
  id: string;
  task: StageTaskItem;
  groupIndex: number;
  taskIndex: number;
  depth: number;
}

export interface ProjectionResult {
  depth: number;
  maxDepth: number;
  groupIndex: number;
  taskIndex: number;
}

export function flattenTasks(tasks: StageTaskItem[][]): FlattenedTask[] {
  const flattened: FlattenedTask[] = [];

  for (const [groupIndex, group] of tasks.entries()) {
    if (!group) continue;
    const depth = group.length > 1 ? 1 : 0;

    for (const [taskIndex, task] of group.entries()) {
      if (!task) continue;
      flattened.push({
        id: task.id,
        task,
        groupIndex,
        taskIndex,
        depth,
      });
    }
  }

  return flattened;
}

export function buildTaskGroups(flattenedTasks: FlattenedTask[]): StageTaskItem[][] {
  const groups: StageTaskItem[][] = [];
  let currentGroup: StageTaskItem[] = [];
  let previousDepth: number | null = null;
  let previousGroupIndex: number | null = null;

  for (const item of flattenedTasks) {
    if (previousDepth === null) {
      currentGroup.push(item.task);
    } else if (item.depth === 1 && previousDepth === 1 && item.groupIndex === previousGroupIndex) {
      currentGroup.push(item.task);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [item.task];
    }
    previousDepth = item.depth;
    previousGroupIndex = item.groupIndex;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export function reorderTasks(
  tasks: StageTaskItem[][],
  activeId: string,
  overId: string,
  projectedDepth: number
): StageTaskItem[][] {
  const flattened = flattenTasks(tasks);

  const activeIndex = flattened.findIndex((t) => t.id === activeId);
  const overIndex = flattened.findIndex((t) => t.id === overId);

  if (activeIndex === -1 || overIndex === -1) {
    return tasks;
  }

  const activeTask = flattened[activeIndex];
  if (!activeTask) {
    return tasks;
  }

  const reordered = arrayMove(flattened, activeIndex, overIndex);
  const movedItem = reordered[overIndex];
  if (movedItem) {
    let newGroupIndex = movedItem.groupIndex;

    if (projectedDepth === 1) {
      const prevItem = reordered[overIndex - 1];
      const nextItem = reordered[overIndex + 1];
      if (prevItem?.depth === 1) {
        newGroupIndex = prevItem.groupIndex;
      } else if (nextItem?.depth === 1) {
        newGroupIndex = nextItem.groupIndex;
      }
    }

    reordered[overIndex] = { ...movedItem, depth: projectedDepth, groupIndex: newGroupIndex };
  }

  return buildTaskGroups(reordered);
}

function getDragDepth(offsetLeft: number): number {
  return Math.round(offsetLeft / INDENTATION_WIDTH);
}

function getParallelGroupInfo(
  tasks: StageTaskItem[][],
  groupIndex: number,
  taskIndex: number
): { isParallel: boolean; isFirstItem: boolean; isLastItem: boolean } {
  const group = tasks[groupIndex];
  if (!group || group.length <= 1) {
    return { isParallel: false, isFirstItem: false, isLastItem: false };
  }
  return {
    isParallel: true,
    isFirstItem: taskIndex === 0,
    isLastItem: taskIndex === group.length - 1,
  };
}

export function getProjection(
  tasks: StageTaskItem[][],
  activeId: string,
  overId: string,
  offsetLeft: number
): ProjectionResult | null {
  const flattened = flattenTasks(tasks);

  const activeIndex = flattened.findIndex((t) => t.id === activeId);
  const overIndex = flattened.findIndex((t) => t.id === overId);

  if (activeIndex === -1 || overIndex === -1) {
    return null;
  }

  const activeTask = flattened[activeIndex];
  const overTask = flattened[overIndex];

  if (!activeTask || !overTask) {
    return null;
  }

  const overInfo = getParallelGroupInfo(tasks, overTask.groupIndex, overTask.taskIndex);

  const minDepth = 0;
  const maxDepth = 1;
  let depth = 0;

  const isActiveParallel = activeTask.depth === 1;
  const dragDepth = isActiveParallel ? (offsetLeft > 0 ? 1 : 0) : getDragDepth(offsetLeft);

  const isDraggingDown = activeIndex < overIndex;
  const isDraggingUp = activeIndex > overIndex;
  const isDraggingInPlace = activeIndex === overIndex;

  if (isDraggingInPlace) {
    if (overInfo.isParallel) {
      const isOnBorder = overInfo.isFirstItem || overInfo.isLastItem;
      if (isOnBorder) {
        depth = Math.max(minDepth, Math.min(maxDepth, dragDepth));
      } else {
        depth = maxDepth;
      }
    } else {
      const nextTask = flattened[overIndex + 1];
      const prevTask = flattened[overIndex - 1];
      const isAdjacentToParallel = nextTask?.depth === 1 || prevTask?.depth === 1;
      if (isAdjacentToParallel) {
        depth = Math.max(minDepth, Math.min(maxDepth, dragDepth));
      }
    }
  } else if (overInfo.isParallel) {
    const isEdgeInsertion =
      (isDraggingUp && overInfo.isFirstItem) || (isDraggingDown && overInfo.isLastItem);

    if (isEdgeInsertion) {
      depth = Math.max(minDepth, Math.min(maxDepth, dragDepth));
    } else {
      depth = maxDepth;
    }
  } else {
    const nextTask = flattened[overIndex + 1];
    const prevTask = flattened[overIndex - 1];
    const isAdjacentToParallel =
      (isDraggingDown && nextTask?.depth === 1) || (isDraggingUp && prevTask?.depth === 1);

    if (isAdjacentToParallel) {
      depth = Math.max(minDepth, Math.min(maxDepth, dragDepth));
    }
  }

  return {
    depth,
    maxDepth,
    groupIndex: overTask.groupIndex,
    taskIndex: overTask.taskIndex,
  };
}
