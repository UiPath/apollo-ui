import { arrayMove } from "@dnd-kit/sortable";
import type { StageTaskItem } from "./StageNode.types";
import { INDENTATION_WIDTH } from "./StageNode.styles";

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

  for (const item of flattenedTasks) {
    if (previousDepth === null) {
      currentGroup.push(item.task);
    } else if (item.depth === 1 && previousDepth === 1) {
      currentGroup.push(item.task);
    } else {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [item.task];
    }
    previousDepth = item.depth;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

export function reorderTasks(tasks: StageTaskItem[][], activeId: string, overId: string, projectedDepth: number): StageTaskItem[][] {
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
    reordered[overIndex] = { ...movedItem, depth: projectedDepth };
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

export function getProjection(tasks: StageTaskItem[][], activeId: string, overId: string, offsetLeft: number): ProjectionResult | null {
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
    const isEdgeInsertion = (isDraggingUp && overInfo.isFirstItem) || (isDraggingDown && overInfo.isLastItem);

    if (isEdgeInsertion) {
      depth = Math.max(minDepth, Math.min(maxDepth, dragDepth));
    } else {
      depth = maxDepth;
    }
  } else {
    const nextTask = flattened[overIndex + 1];
    const prevTask = flattened[overIndex - 1];
    const isAdjacentToParallel = (isDraggingDown && nextTask?.depth === 1) || (isDraggingUp && prevTask?.depth === 1);

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
