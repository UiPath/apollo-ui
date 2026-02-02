/**
 * DropPlaceholder - Visual indicator showing where a dragged task will drop
 */

import { Spacing } from '@uipath/apollo-core';
import { DEFAULT_TASK_POSITION_CONFIG } from '../TaskNode/useTaskPositions';

interface DropPlaceholderProps {
  /** Group index where task will drop */
  groupIndex: number;
  /** Task index within group */
  taskIndex: number;
  /** Current task structure */
  taskIds: string[][];
  /** Whether dropping as parallel */
  isParallel: boolean;
  /** ID of dragged task (to adjust position calculation) */
  draggedTaskId?: string | null;
}

/**
 * Calculate Y position for the drop placeholder
 */
function calculatePlaceholderY(groupIndex: number, taskIndex: number, taskIds: string[][]): number {
  const config = DEFAULT_TASK_POSITION_CONFIG;
  let y = config.headerHeight + config.contentPaddingTop;

  for (let gi = 0; gi < taskIds.length; gi++) {
    const group = taskIds[gi];
    if (!group) continue;

    // If this is the target group
    if (gi === groupIndex) {
      // Add offset for tasks before the drop position
      for (let ti = 0; ti < taskIndex && ti < group.length; ti++) {
        y += config.taskHeight;
        if (ti < group.length - 1) {
          y += config.taskGap;
        }
      }
      return y;
    }

    // Add height of this entire group
    y += group.length * config.taskHeight;
    y += (group.length - 1) * config.taskGap;
    y += config.taskGap; // Gap after group
  }

  // Dropping after all groups
  return y;
}

export const DropPlaceholder = ({
  groupIndex,
  taskIndex,
  taskIds,
  isParallel,
  draggedTaskId,
}: DropPlaceholderProps) => {
  // Adjust taskIds by removing dragged task (matches what task shifting does)
  let adjustedTaskIds = taskIds;
  let adjustedGroupIndex = groupIndex;

  if (draggedTaskId) {
    const tempTaskIds = taskIds.map((group) => [...group]);

    // Remove dragged task
    for (let gi = 0; gi < tempTaskIds.length; gi++) {
      const group = tempTaskIds[gi];
      if (!group) continue;
      const index = group.indexOf(draggedTaskId);
      if (index !== -1) {
        group.splice(index, 1);
        // If removed task was before our target group, adjust groupIndex
        if (gi < groupIndex) {
          adjustedGroupIndex--;
        }
        break;
      }
    }

    // Filter empty groups
    adjustedTaskIds = tempTaskIds.filter((g) => g && g.length > 0);
  }

  const y = calculatePlaceholderY(adjustedGroupIndex, taskIndex, adjustedTaskIds);
  const x = isParallel
    ? DEFAULT_TASK_POSITION_CONFIG.contentPaddingX + DEFAULT_TASK_POSITION_CONFIG.parallelIndent
    : DEFAULT_TASK_POSITION_CONFIG.contentPaddingX;

  const width = isParallel
    ? `var(--stage-task-width-parallel, 216px)`
    : `var(--stage-task-width, 246px)`;

  console.log('[DropPlaceholder] Rendering at', {
    x,
    y,
    groupIndex: adjustedGroupIndex,
    taskIndex,
    isParallel,
    draggedTaskId,
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: x,
        width,
        height: 36,
        border: '2px dashed rgba(100, 150, 255, 0.8)', // More visible blue dashed border
        borderRadius: Spacing.SpacingXs,
        backgroundColor: 'rgba(100, 150, 255, 0.1)', // Light blue background
        opacity: 1, // Full opacity
        pointerEvents: 'none',
        zIndex: 100, // Way above everything
        boxSizing: 'border-box',
      }}
      data-testid="drop-placeholder"
    />
  );
};
