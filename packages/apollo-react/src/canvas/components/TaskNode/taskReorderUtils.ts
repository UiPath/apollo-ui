/**
 * Utility functions for reordering tasks within a stage using TaskNode approach
 * Mirrors the logic from StageNode.utils.ts but works with taskIds instead of task objects
 */

/**
 * Position for inserting a task
 */
export interface TaskInsertPosition {
  groupIndex: number;
  taskIndex: number;
  isParallel: boolean;
}

interface FlattenedTaskId {
  id: string;
  groupIndex: number;
  taskIndex: number;
  depth: number; // 0 = sequential, 1 = parallel
}

/**
 * Flatten taskIds array into a flat list with metadata
 */
export function flattenTaskIds(taskIds: string[][]): FlattenedTaskId[] {
  const flattened: FlattenedTaskId[] = [];

  for (const [groupIndex, group] of taskIds.entries()) {
    if (!group) continue;
    const depth = group.length > 1 ? 1 : 0;

    for (const [taskIndex, id] of group.entries()) {
      if (!id) continue;
      flattened.push({
        id,
        groupIndex,
        taskIndex,
        depth,
      });
    }
  }

  return flattened;
}

/**
 * Build taskIds array from flattened list
 */
export function buildTaskIdGroups(flattenedTaskIds: FlattenedTaskId[]): string[][] {
  const groups: string[][] = [];
  let currentGroup: string[] = [];
  let previousDepth: number | null = null;
  let previousGroupIndex: number | null = null;

  for (const item of flattenedTaskIds) {
    if (previousDepth === null) {
      currentGroup.push(item.id);
    } else if (item.depth === 1 && previousDepth === 1 && item.groupIndex === previousGroupIndex) {
      // Continue parallel group
      currentGroup.push(item.id);
    } else {
      // Start new group
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [item.id];
    }
    previousDepth = item.depth;
    previousGroupIndex = item.groupIndex;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Reorder task IDs within a stage
 *
 * IMPORTANT: targetGroupIndex and targetTaskIndex are relative to the FILTERED structure
 * (with activeId removed), matching how drop positions are calculated in calculateDropPosition.
 *
 * @param taskIds - Current task ID structure
 * @param activeId - ID of task being moved
 * @param targetGroupIndex - Target group index (relative to filtered structure)
 * @param targetTaskIndex - Target task index within group (relative to filtered structure)
 * @param projectedDepth - 0 for sequential, 1 for parallel
 */
export function reorderTaskIds(
  taskIds: string[][],
  activeId: string,
  targetGroupIndex: number,
  targetTaskIndex: number,
  projectedDepth: number
): string[][] {
  const flattened = flattenTaskIds(taskIds);

  const activeIndex = flattened.findIndex((t) => t.id === activeId);
  if (activeIndex === -1) return taskIds;

  // Create a filtered flattened list (without the active task) to match how positions are calculated
  const filteredFlattened = flattened.filter((t) => t.id !== activeId);

  // Rebuild group indices for filtered list
  const filteredTaskIds = taskIds
    .map((group) => group.filter((id) => id !== activeId))
    .filter((group) => group.length > 0);

  const filteredWithIndices = flattenTaskIds(filteredTaskIds);

  // Find the target position in the FILTERED flattened array
  let targetFilteredIndex = filteredWithIndices.length; // Default to end

  for (let i = 0; i < filteredWithIndices.length; i++) {
    const item = filteredWithIndices[i];
    if (!item) continue;

    if (item.groupIndex === targetGroupIndex && item.taskIndex === targetTaskIndex) {
      targetFilteredIndex = i;
      break;
    }

    // If we've passed the target group, insert at this position
    if (item.groupIndex > targetGroupIndex) {
      targetFilteredIndex = i;
      break;
    }
  }

  // Insert the active task at the target position in the filtered list
  const activeItem = flattened[activeIndex];
  if (!activeItem) return taskIds;

  // Determine the new depth and group index
  let newGroupIndex = targetGroupIndex;
  let newDepth = projectedDepth;

  if (projectedDepth === 1) {
    // Joining a parallel group - find which parallel group to join
    const prevItem = filteredFlattened[targetFilteredIndex - 1];

    if (prevItem) {
      // Check if previous item in filtered list was originally parallel
      const prevOriginal = filteredWithIndices[targetFilteredIndex - 1];
      const prevGroupLength = prevOriginal ? filteredTaskIds[prevOriginal.groupIndex]?.length : 0;
      if (prevOriginal && prevGroupLength && prevGroupLength > 0) {
        // Find original group for this task
        for (const originalGroup of taskIds) {
          if (originalGroup.includes(prevItem.id) && originalGroup.length > 1) {
            newGroupIndex = prevOriginal.groupIndex;
            break;
          }
        }
      }
    }
  }

  // Build the result by inserting into filtered list
  const result: FlattenedTaskId[] = [...filteredFlattened];
  result.splice(targetFilteredIndex, 0, {
    ...activeItem,
    depth: newDepth,
    groupIndex: newGroupIndex,
  });

  // Rebuild group structure
  return buildTaskIdGroupsFromReorder(result, projectedDepth, targetFilteredIndex);
}

/**
 * Build taskIds array from reordered flattened list
 * Handles proper grouping based on the moved item's depth
 */
function buildTaskIdGroupsFromReorder(
  flattenedTaskIds: FlattenedTaskId[],
  movedItemDepth: number,
  movedItemIndex: number
): string[][] {
  const groups: string[][] = [];
  let currentGroup: string[] = [];

  for (let i = 0; i < flattenedTaskIds.length; i++) {
    const item = flattenedTaskIds[i];
    if (!item) continue;

    const isMovedItem = i === movedItemIndex;
    const prevItem = flattenedTaskIds[i - 1];

    if (currentGroup.length === 0) {
      currentGroup.push(item.id);
    } else if (isMovedItem && movedItemDepth === 1) {
      // Moved item wants to be parallel - join current group
      currentGroup.push(item.id);
    } else if (isMovedItem && movedItemDepth === 0) {
      // Moved item wants to be sequential - start new group
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [item.id];
    } else if (item.depth === 1 && prevItem?.depth === 1 && !isMovedItem) {
      // Regular parallel continuation (not the moved item)
      // Check if they were in the same original group
      if (item.groupIndex === prevItem.groupIndex) {
        currentGroup.push(item.id);
      } else {
        groups.push(currentGroup);
        currentGroup = [item.id];
      }
    } else {
      // Start new group
      groups.push(currentGroup);
      currentGroup = [item.id];
    }
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * Remove a task from taskIds array
 * Returns a new array with the task removed and empty groups filtered out
 *
 * @param taskIds - Current task ID structure
 * @param taskId - ID of task to remove
 * @returns New taskIds array with task removed
 */
export function removeTaskFromTaskIds(taskIds: string[][], taskId: string): string[][] {
  return taskIds
    .map((group) => group.filter((id) => id !== taskId))
    .filter((group) => group.length > 0);
}

/**
 * Insert a task at a specific position in taskIds array
 * Handles both sequential and parallel insertions
 *
 * @param taskIds - Current task ID structure
 * @param taskId - ID of task to insert
 * @param position - Position to insert at (groupIndex, taskIndex, isParallel)
 * @returns New taskIds array with task inserted
 */
export function insertTaskAtPosition(
  taskIds: string[][],
  taskId: string,
  position: TaskInsertPosition
): string[][] {
  const { groupIndex, taskIndex, isParallel } = position;
  const newTaskIds = taskIds.map((group) => [...group]);

  if (groupIndex >= newTaskIds.length) {
    // Inserting at or beyond the end
    if (isParallel && newTaskIds.length > 0) {
      // Append to last group if parallel
      const lastGroup = newTaskIds[newTaskIds.length - 1];
      if (lastGroup && lastGroup.length > 0) {
        lastGroup.push(taskId);
      } else {
        newTaskIds.push([taskId]);
      }
    } else {
      // Add as new sequential group at end
      newTaskIds.push([taskId]);
    }
  } else if (isParallel) {
    // Insert into existing group as parallel
    const targetGroup = newTaskIds[groupIndex];
    if (targetGroup) {
      targetGroup.splice(taskIndex, 0, taskId);
    } else {
      newTaskIds.splice(groupIndex, 0, [taskId]);
    }
  } else {
    // Insert as new sequential group
    newTaskIds.splice(groupIndex, 0, [taskId]);
  }

  return newTaskIds;
}

/**
 * Move a task from one position to another within the same stage
 * Uses remove-then-insert approach to match placeholder logic exactly
 *
 * @param taskIds - Current task ID structure
 * @param taskId - ID of task to move
 * @param position - Target position (groupIndex, taskIndex, isParallel)
 * @returns New taskIds array with task moved
 */
export function moveTaskWithinStage(
  taskIds: string[][],
  taskId: string,
  position: TaskInsertPosition
): string[][] {
  // Remove the task first, then insert at new position
  // This matches exactly how placeholder positions are calculated
  const withoutTask = removeTaskFromTaskIds(taskIds, taskId);
  return insertTaskAtPosition(withoutTask, taskId, position);
}

/**
 * Move a task from one stage to another
 * Returns updated taskIds for both source and target stages
 *
 * @param sourceTaskIds - Task IDs in source stage
 * @param targetTaskIds - Task IDs in target stage
 * @param taskId - ID of task to move
 * @param position - Target position in target stage
 * @returns Object with new taskIds for both source and target
 */
export function moveTaskBetweenStages(
  sourceTaskIds: string[][],
  targetTaskIds: string[][],
  taskId: string,
  position: TaskInsertPosition
): { sourceTaskIds: string[][]; targetTaskIds: string[][] } {
  const newSourceTaskIds = removeTaskFromTaskIds(sourceTaskIds, taskId);
  const newTargetTaskIds = insertTaskAtPosition(targetTaskIds, taskId, position);

  return {
    sourceTaskIds: newSourceTaskIds,
    targetTaskIds: newTargetTaskIds,
  };
}
