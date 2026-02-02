/**
 * Calculate drop position for task drag operations
 *
 * Simplified position calculation using bucket-based approach:
 * - Y position determined by which "bucket" the dragged task falls into
 * - X position determines parallel vs sequential based on stage midpoint
 */

import { DEFAULT_TASK_POSITION_CONFIG } from '../components/TaskNode/useTaskPositions';

export interface DropPosition {
  /** Flat index (0, 1, 2, ...) for insertion position */
  index: number;
  /** Whether dropping as parallel (depth=1) or sequential (depth=0) */
  isParallel: boolean;
  /** Dragged task's Y center relative to content area (for group boundary resolution) */
  draggedYCenter: number;
}

/**
 * Get the bottom Y position of a task at a given flat index (relative to content area)
 */
function getTaskBottom(flatIndex: number, taskIds: string[][]): number {
  const config = DEFAULT_TASK_POSITION_CONFIG;
  let currentY = config.contentPaddingTop;
  let currentIndex = 0;

  for (const group of taskIds) {
    for (let i = 0; i < group.length; i++) {
      if (currentIndex === flatIndex) {
        return currentY + config.taskHeight;
      }
      currentY += config.taskHeight;
      if (i < group.length - 1) {
        currentY += config.taskGap;
      }
      currentIndex++;
    }
    currentY += config.taskGap;
  }

  return currentY;
}

/**
 * Get the top Y position of a task at a given flat index (relative to content area)
 */
function getTaskTop(flatIndex: number, taskIds: string[][]): number {
  const config = DEFAULT_TASK_POSITION_CONFIG;
  let currentY = config.contentPaddingTop;
  let currentIndex = 0;

  for (const group of taskIds) {
    for (let i = 0; i < group.length; i++) {
      if (currentIndex === flatIndex) {
        return currentY;
      }
      currentY += config.taskHeight;
      if (i < group.length - 1) {
        currentY += config.taskGap;
      }
      currentIndex++;
    }
    currentY += config.taskGap;
  }

  return currentY;
}

/**
 * Get total number of tasks (flat count)
 */
function getTotalTaskCount(taskIds: string[][]): number {
  return taskIds.reduce((sum, group) => sum + group.length, 0);
}

/**
 * Check if a flat index is within an existing parallel group (group.length > 1)
 * Returns false for sequential groups and for positions at/beyond the end
 */
function isIndexInParallelGroup(flatIndex: number, taskIds: string[][]): boolean {
  let currentIndex = 0;

  for (const group of taskIds) {
    for (let taskIndex = 0; taskIndex < group.length; taskIndex++) {
      if (currentIndex === flatIndex) {
        return group.length > 1;
      }
      currentIndex++;
    }
  }

  // Out of bounds - not in any parallel group
  return false;
}

/**
 * Check if a task at given flat index is at the edge of a parallel group
 * (first or last position in a parallel group)
 */
function isAtParallelGroupEdge(flatIndex: number, taskIds: string[][]): boolean {
  let currentIndex = 0;

  for (const group of taskIds) {
    for (let taskIndex = 0; taskIndex < group.length; taskIndex++) {
      if (currentIndex === flatIndex) {
        if (group.length <= 1) return false;
        return taskIndex === 0 || taskIndex === group.length - 1;
      }
      currentIndex++;
    }
  }

  return false;
}

/**
 * Calculate drop position using simplified bucket-based approach
 *
 * @param nodeY - The dragged task node's Y position relative to stage (absolute from stage top)
 * @param nodeHeight - The height of the dragged task node
 * @param nodeX - The dragged task node's X position relative to stage
 * @param nodeWidth - The width of the dragged task node
 * @param stageWidth - The width of the target stage
 * @param taskIds - 2D array of task IDs in the target stage
 * @param draggedTaskId - ID of the task being dragged (to exclude from calculations)
 * @returns DropPosition with index and isParallel
 */
export function calculateDropPosition(
  nodeY: number,
  nodeHeight: number,
  nodeX: number,
  nodeWidth: number,
  stageWidth: number,
  taskIds: string[][],
  draggedTaskId: string
): DropPosition {
  const config = DEFAULT_TASK_POSITION_CONFIG;
  const halfTaskGap = config.taskGap / 2;

  // Filter out the dragged task from taskIds for position calculation
  const filteredTaskIds = taskIds
    .map((group) => group.filter((id) => id !== draggedTaskId))
    .filter((group) => group.length > 0);

  const totalTasks = getTotalTaskCount(filteredTaskIds);

  // Calculate PY: center point of dragged node relative to CONTENT area
  // nodeY is relative to stage, subtract header to get content-relative
  const PY = nodeY - config.headerHeight + nodeHeight / 2;

  // Calculate PX: center point of dragged node
  const PX = nodeX + nodeWidth / 2;

  // Calculate index using bucket rules
  let index = 0;

  if (totalTasks === 0) {
    // Empty stage, drop at index 0
    index = 0;
  } else {
    // Rule 1: PY <= bottom of index 0 + 1/2 task gap → index 0
    const bottomOfFirst = getTaskBottom(0, filteredTaskIds);
    if (PY <= bottomOfFirst + halfTaskGap) {
      index = 0;
    } else {
      // Rule 3: PY > bottom of last task + 1/2 task gap → insert after all tasks
      const lastIndex = totalTasks - 1;
      const bottomOfLast = getTaskBottom(lastIndex, filteredTaskIds);
      if (PY > bottomOfLast + halfTaskGap) {
        index = totalTasks; // Insert after last task
      } else {
        // Rule 2: Find the bucket N where:
        // bottom(N-1) + halfGap < PY <= bottom(N) + halfGap
        for (let n = 1; n < totalTasks; n++) {
          const bottomOfPrev = getTaskBottom(n - 1, filteredTaskIds);
          const bottomOfCurrent = getTaskBottom(n, filteredTaskIds);
          if (PY > bottomOfPrev + halfTaskGap && PY <= bottomOfCurrent + halfTaskGap) {
            index = n;
            break;
          }
        }
      }
    }
  }

  // Determine isParallel based on whether target position is in a parallel group
  // RULE: Never group with sequential tasks - only allow parallel if target is already in a parallel group
  // NOTE: We check ORIGINAL taskIds to handle the case where removing dragged task makes a parallel group appear sequential
  const inParallelGroup = isIndexInParallelGroup(index, filteredTaskIds);
  const isLeftHalf = PX < stageWidth / 2;

  // Helper: check if a group in ORIGINAL taskIds was parallel (before filtering)
  const wasOriginalGroupParallel = (filteredGroupIndex: number): boolean => {
    if (filteredGroupIndex < 0 || filteredGroupIndex >= filteredTaskIds.length) return false;
    const filteredGroup = filteredTaskIds[filteredGroupIndex];
    if (!filteredGroup || filteredGroup.length === 0) return false;
    // Find this group in original taskIds by checking if any task from filteredGroup is in an original parallel group
    const firstTaskId = filteredGroup[0];
    for (const originalGroup of taskIds) {
      if (originalGroup.includes(firstTaskId!)) {
        return originalGroup.length > 1;
      }
    }
    return false;
  };

  // Helper: find which group index and task index within group for a flat index
  const getGroupAndTaskIndex = (flatIndex: number): { groupIndex: number; taskIndex: number } | null => {
    let currentIndex = 0;
    for (let gi = 0; gi < filteredTaskIds.length; gi++) {
      const group = filteredTaskIds[gi];
      if (!group) continue;
      if (currentIndex + group.length > flatIndex) {
        return { groupIndex: gi, taskIndex: flatIndex - currentIndex };
      }
      currentIndex += group.length;
    }
    return null;
  };

  let isParallel = false;
  if (inParallelGroup) {
    // Target is in a parallel group - use X position to determine if staying parallel or breaking out
    const atEdge = isAtParallelGroupEdge(index, filteredTaskIds);
    // Can only break out to sequential if at edge AND on left half
    isParallel = !(atEdge && isLeftHalf);
  } else if (index >= totalTasks && filteredTaskIds.length > 0) {
    // Special case: dropping at end - can join last group if it was originally parallel and X is in right half
    const lastFilteredGroup = filteredTaskIds[filteredTaskIds.length - 1];
    const lastGroupWasParallel = wasOriginalGroupParallel(filteredTaskIds.length - 1);
    if (lastFilteredGroup && lastGroupWasParallel && !isLeftHalf) {
      isParallel = true;
    }
  } else if (!inParallelGroup && index < totalTasks) {
    // Not in a parallel group - check two cases:
    // 1. The current position's group was originally parallel (dragged task removed from it)
    // 2. We're at the START of a sequential group and the PREVIOUS group is parallel
    const posInfo = getGroupAndTaskIndex(index);
    if (posInfo) {
      const { groupIndex, taskIndex } = posInfo;

      // Case 1: Current group was originally parallel
      if (wasOriginalGroupParallel(groupIndex) && !isLeftHalf) {
        isParallel = true;
      }
      // Case 2: At start of a sequential group, previous group is parallel
      else if (taskIndex === 0 && groupIndex > 0) {
        const currentGroup = filteredTaskIds[groupIndex];
        const prevGroupWasParallel = wasOriginalGroupParallel(groupIndex - 1);
        // Only join previous parallel group if current group is sequential (single element) and X is in right half
        if (currentGroup && currentGroup.length === 1 && prevGroupWasParallel && !isLeftHalf) {
          isParallel = true;
        }
      }
    }
  }
  // If none of the above conditions are met, isParallel stays false

  return { index, isParallel, draggedYCenter: PY };
}

/**
 * Get the Y center of a task position at a given flat index (relative to content area)
 */
function getTaskYCenter(flatIndex: number, taskIds: string[][]): number {
  const top = getTaskTop(flatIndex, taskIds);
  return top + DEFAULT_TASK_POSITION_CONFIG.taskHeight / 2;
}

/**
 * Get info about which group a flat index falls into
 */
function getGroupInfoAtIndex(
  flatIndex: number,
  taskIds: string[][]
): { groupIndex: number; taskIndex: number; isFirstInGroup: boolean } | null {
  let currentIndex = 0;

  for (let groupIndex = 0; groupIndex < taskIds.length; groupIndex++) {
    const group = taskIds[groupIndex];
    if (!group) continue;

    for (let taskIndex = 0; taskIndex < group.length; taskIndex++) {
      if (currentIndex === flatIndex) {
        return { groupIndex, taskIndex, isFirstInGroup: taskIndex === 0 };
      }
      currentIndex++;
    }
  }

  return null;
}

/**
 * Convert flat index and isParallel to groupIndex and taskIndex
 * Used to insert the task into the correct position in taskIds
 *
 * @param index - Flat index for insertion
 * @param isParallel - Whether to insert as parallel
 * @param taskIds - Current task structure (with dragged task already filtered out)
 * @param draggedYCenter - Dragged task's Y center for group boundary resolution
 * @param originalTaskIds - Original task structure before filtering (used to detect originally-parallel groups)
 */
export function convertToGroupPosition(
  index: number,
  isParallel: boolean,
  taskIds: string[][],
  draggedYCenter?: number,
  originalTaskIds?: string[][]
): { groupIndex: number; taskIndex: number } {
  if (taskIds.length === 0) {
    return { groupIndex: 0, taskIndex: 0 };
  }

  // Helper to check if a group in filtered taskIds was originally parallel
  const wasOriginallyParallel = (filteredGroupIndex: number): boolean => {
    if (!originalTaskIds || filteredGroupIndex < 0 || filteredGroupIndex >= taskIds.length) {
      return false;
    }
    const filteredGroup = taskIds[filteredGroupIndex];
    if (!filteredGroup || filteredGroup.length === 0) return false;
    // If the filtered group already has > 1, it's parallel
    if (filteredGroup.length > 1) return true;
    // Otherwise check if any task from this group was in an original parallel group
    const firstTaskId = filteredGroup[0];
    for (const originalGroup of originalTaskIds) {
      if (originalGroup.includes(firstTaskId!)) {
        return originalGroup.length > 1;
      }
    }
    return false;
  };

  const groupInfo = getGroupInfoAtIndex(index, taskIds);

  if (groupInfo) {
    const { groupIndex, taskIndex, isFirstInGroup } = groupInfo;

    if (isParallel) {
      // Inserting as parallel
      const currentGroup = taskIds[groupIndex];
      const currentGroupIsSequential = currentGroup && currentGroup.length === 1;
      const currentGroupWasParallel = wasOriginallyParallel(groupIndex);

      // If current group was originally parallel (we removed a task from it),
      // always join the current group - don't look at previous group
      if (currentGroupIsSequential && currentGroupWasParallel) {
        // Join current group (which was originally parallel)
        return { groupIndex, taskIndex };
      }

      // If at first position of a truly SEQUENTIAL group (not originally parallel)
      // that follows a parallel group, join the previous parallel group
      if (isFirstInGroup && groupIndex > 0 && currentGroupIsSequential && !currentGroupWasParallel) {
        const prevGroup = taskIds[groupIndex - 1];
        const prevGroupWasParallel = wasOriginallyParallel(groupIndex - 1);
        if (prevGroup && (prevGroup.length > 1 || prevGroupWasParallel)) {
          // Join the previous parallel group at the end
          return { groupIndex: groupIndex - 1, taskIndex: prevGroup.length };
        }
      }

      // If at first position in a parallel group, use Y position to decide between
      // joining previous parallel group or current group
      if (isFirstInGroup && groupIndex > 0 && !currentGroupIsSequential && draggedYCenter !== undefined) {
        const prevGroup = taskIds[groupIndex - 1];
        const prevGroupWasParallel = wasOriginallyParallel(groupIndex - 1);
        if (prevGroup && (prevGroup.length > 1 || prevGroupWasParallel)) {
          const placeholderYCenter = getTaskYCenter(index, taskIds);
          // If dragged task is above the placeholder position, prefer previous group
          if (draggedYCenter < placeholderYCenter) {
            return { groupIndex: groupIndex - 1, taskIndex: prevGroup.length };
          }
        }
      }

      // Insert into current group at this position
      return { groupIndex, taskIndex };
    } else {
      // Insert as new sequential group before this one
      return { groupIndex, taskIndex: 0 };
    }
  }

  // Index is at or beyond the end - insert at end
  if (isParallel && taskIds.length > 0) {
    // Try to append to last group if it's already parallel (check original too)
    const lastGroup = taskIds[taskIds.length - 1];
    const lastGroupWasParallel = wasOriginallyParallel(taskIds.length - 1);
    if (lastGroup && (lastGroup.length > 1 || lastGroupWasParallel)) {
      return { groupIndex: taskIds.length - 1, taskIndex: lastGroup.length };
    }
  }

  // Add as new group at the end
  return { groupIndex: taskIds.length, taskIndex: 0 };
}
