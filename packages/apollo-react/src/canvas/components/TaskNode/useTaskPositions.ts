import { useCallback, useMemo } from 'react';
import type { TaskPosition, TaskPositionConfig } from './TaskNode.types';

/**
 * Calculate extra height needed for a task based on its execution content
 */
function calculateExecutionExtraHeight(execution: Record<string, unknown>): number {
  if (execution.duration || execution.retryDuration || execution.badge) {
    // Has content in second row
    if (execution.retryDuration || execution.badge) {
      return 26; // Taller for retry/badge content (62px total)
    } else {
      return 18; // Normal for just duration (54px total)
    }
  } else {
    return 2; // Minimal for status icon only (38px total)
  }
}

/**
 * Default configuration for task positioning
 * Values match the existing StageNode implementation
 */
export const DEFAULT_TASK_POSITION_CONFIG: TaskPositionConfig = {
  stageBorderThickness: 2, // 2px border thickness
  taskHeight: 36, // Base DOM height of task element (matches Figma h-[36px])
  taskGap: 12, // Gap between tasks (matches Figma gap-[12px] for 16px grid system)
  parallelIndent: 30, // INDENTATION_WIDTH from StageNode.styles
  contentPaddingTop: 16, // Content padding top
  contentPaddingBottom: 16, // Content padding bottom
  contentPaddingX: 14, // Matches Figma px-[14px]
  headerHeight: 56, // Base header height
  headerExecutionDescriptionHeight: 16, // Extra height when stage has execution with duration
};

/**
 * Calculate positions for all tasks within a stage based on their order and grouping.
 * Tasks are positioned based on their groupIndex and taskIndex, NOT by user drag position.
 *
 * @param taskIds - 2D array of task IDs. Inner arrays with length > 1 are parallel groups.
 * @param stageWidth - Width of the stage container
 * @param config - Position configuration (optional, uses defaults)
 * @param taskData - Map of taskId to task data (with optional execution property) or nodes array
 * @param stageExecution - Stage execution data (adds +16px to header if has duration)
 * @returns Map of taskId -> TaskPosition
 */
export function calculateTaskPositions(
  taskIds: string[][],
  stageWidth: number,
  taskData?:
    | Record<string, { execution?: Record<string, unknown> }>
    | Array<{ id: string; data?: { execution?: Record<string, unknown> } }>,
  stageExecution?: Record<string, unknown>
): Map<string, TaskPosition> {
  const positions = new Map<string, TaskPosition>();

  // Convert taskData to Record for uniform access
  const taskRecord: Record<string, { execution?: Record<string, unknown> }> = {};
  if (taskData) {
    if (Array.isArray(taskData)) {
      // Extract from nodes array
      taskData.forEach((node) => {
        taskRecord[node.id] = { execution: node.data?.execution };
      });
    } else {
      // Already a Record
      Object.assign(taskRecord, taskData);
    }
  }

  const taskWidth = stageWidth - DEFAULT_TASK_POSITION_CONFIG.contentPaddingX * 2;
  const parallelTaskWidth = taskWidth - DEFAULT_TASK_POSITION_CONFIG.parallelIndent;

  // Add extra header height if stage has execution with duration
  const headerHeight = stageExecution?.duration
    ? DEFAULT_TASK_POSITION_CONFIG.headerHeight +
      DEFAULT_TASK_POSITION_CONFIG.headerExecutionDescriptionHeight
    : DEFAULT_TASK_POSITION_CONFIG.headerHeight;

  let currentY =
    headerHeight +
    DEFAULT_TASK_POSITION_CONFIG.contentPaddingTop +
    DEFAULT_TASK_POSITION_CONFIG.stageBorderThickness;

  for (const group of taskIds) {
    const isParallel = group.length > 1;

    for (let taskIndex = 0; taskIndex < group.length; taskIndex++) {
      const taskId = group[taskIndex];
      if (!taskId) continue;

      // Calculate task height based on execution content
      const execution = taskRecord[taskId]?.execution;
      const taskHeight = execution
        ? DEFAULT_TASK_POSITION_CONFIG.taskHeight + calculateExecutionExtraHeight(execution)
        : DEFAULT_TASK_POSITION_CONFIG.taskHeight;

      positions.set(taskId, {
        x: isParallel
          ? DEFAULT_TASK_POSITION_CONFIG.contentPaddingX +
            DEFAULT_TASK_POSITION_CONFIG.parallelIndent
          : DEFAULT_TASK_POSITION_CONFIG.contentPaddingX,
        y: currentY,
        width: isParallel ? parallelTaskWidth : taskWidth,
      });

      currentY += taskHeight;
      if (taskIndex < group.length - 1) {
        currentY += DEFAULT_TASK_POSITION_CONFIG.taskGap;
      }
    }

    currentY += DEFAULT_TASK_POSITION_CONFIG.taskGap;
  }

  return positions;
}

/**
 * Calculate the total height needed for the stage content based on tasks
 *
 * @param taskIds - 2D array of task IDs
 * @param config - Position configuration (optional)
 * @param taskData - Map of taskId to task data (with optional execution property) or nodes array
 * @param stageExecution - Stage execution data (adds +16px to header if has duration)
 * @returns Total height in pixels
 */
export function calculateStageContentHeight(
  taskIds: string[][],
  taskData?:
    | Record<string, { execution?: Record<string, unknown> }>
    | Array<{ id: string; data?: { execution?: Record<string, unknown> } }>
): number {
  // Convert taskData to Record for uniform access
  const taskRecord: Record<string, { execution?: Record<string, unknown> }> = {};
  if (taskData) {
    if (Array.isArray(taskData)) {
      taskData.forEach((node) => {
        taskRecord[node.id] = { execution: node.data?.execution };
      });
    } else {
      Object.assign(taskRecord, taskData);
    }
  }

  let height = DEFAULT_TASK_POSITION_CONFIG.contentPaddingTop;

  for (const group of taskIds) {
    // Calculate height for each task in the group
    for (const taskId of group) {
      const execution = taskRecord[taskId]?.execution;
      const taskHeight = execution
        ? DEFAULT_TASK_POSITION_CONFIG.taskHeight + calculateExecutionExtraHeight(execution)
        : DEFAULT_TASK_POSITION_CONFIG.taskHeight;
      height += taskHeight + DEFAULT_TASK_POSITION_CONFIG.taskGap;
    }
  }

  // Remove the last gap
  if (taskIds.length > 0) {
    height -= DEFAULT_TASK_POSITION_CONFIG.taskGap;
    height += DEFAULT_TASK_POSITION_CONFIG.contentPaddingBottom;
  }

  return height;
}

/**
 * Hook to calculate task positions for a stage
 *
 * @param taskIds - 2D array of task IDs
 * @param stageWidth - Width of the stage
 * @param config - Position configuration (optional)
 * @returns Object with positions map and helper functions
 */
export function useTaskPositions(
  taskIds: string[][],
  stageWidth: number,
  stageExecution?: Record<string, unknown>
) {
  const positions = useMemo(
    () => calculateTaskPositions(taskIds, stageWidth, undefined, stageExecution),
    [taskIds, stageWidth, stageExecution]
  );

  const contentHeight = useMemo(() => calculateStageContentHeight(taskIds, undefined), [taskIds]);

  const getPosition = useCallback(
    (taskId: string): TaskPosition | undefined => positions.get(taskId),
    [positions]
  );

  const isParallel = useCallback(
    (taskId: string): boolean => {
      for (const group of taskIds) {
        if (group.includes(taskId)) {
          return group.length > 1;
        }
      }
      return false;
    },
    [taskIds]
  );

  const getGroupInfo = useCallback(
    (taskId: string): { groupIndex: number; taskIndex: number } | null => {
      for (let groupIndex = 0; groupIndex < taskIds.length; groupIndex++) {
        const group = taskIds[groupIndex];
        if (!group) continue;
        const taskIndex = group.indexOf(taskId);
        if (taskIndex !== -1) {
          return { groupIndex, taskIndex };
        }
      }
      return null;
    },
    [taskIds]
  );

  return {
    positions,
    contentHeight,
    getPosition,
    isParallel,
    getGroupInfo,
  };
}
