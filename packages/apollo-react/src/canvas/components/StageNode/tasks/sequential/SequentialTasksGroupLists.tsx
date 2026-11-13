import { memo, useCallback } from 'react';
import {
  GroupModificationType,
  moveGroupDown,
  moveGroupUp,
} from '../../../../utils/GroupModificationUtils';
import type { NodeMenuItem } from '../../../NodeContextMenu';
import { StageItemsList } from '../../StageNode.styles';
import type {
  StageNodeProps,
  StageNodeTaskExecutionsProps,
  StageTaskItem,
} from '../../StageNode.types';
import { useStageNodeLabels } from '../../useStageNodeLabels';
import { getContextMenuItems, getDivider } from '../shared/StageNodeTaskUtilities';
import { SequentialTasksGroup } from './SequentialTasksGroup';

interface SequentialTasksGroupListsInnerProps {
  id: string;
  allTasks: StageTaskItem[][];
  sequentialTaskGroups: StageTaskItem[][];
  taskExecutions?: StageNodeTaskExecutionsProps;
  hideParallelOptions?: boolean;
  loadingTaskIds?: ReadonlySet<string>;
  isReadOnly: boolean;
  hasBuiltInTaskActions: boolean;
  isDragDisabled: boolean;
  selectedTaskId?: string;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  onTaskGroupModification: StageNodeProps['onTaskGroupModification'];
  onTaskReorder: StageNodeProps['onTaskReorder'];
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  handleReorderSequentialTasks: (newTasks: StageTaskItem[][]) => void;
  generateReplaceTaskMenuItemForTask: (
    taskId: string,
    isParallel: boolean
  ) => NodeMenuItem | undefined;
}

export const SequentialTasksGroupListsInner = ({
  id,
  allTasks,
  sequentialTaskGroups,
  taskExecutions,
  hideParallelOptions,
  loadingTaskIds,
  isReadOnly,
  hasBuiltInTaskActions,
  isDragDisabled,
  selectedTaskId,
  onTaskGroupModification,
  onTaskReorder,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  handleTaskClick,
  handleReorderSequentialTasks,
  generateReplaceTaskMenuItemForTask,
}: SequentialTasksGroupListsInnerProps) => {
  const labels = useStageNodeLabels();

  const handleTaskRegroup = useCallback(
    (groupModificationType: GroupModificationType, groupIndex: number, taskIndex: number) => {
      if (
        onTaskReorder &&
        (groupModificationType === GroupModificationType.TASK_GROUP_UP ||
          groupModificationType === GroupModificationType.TASK_GROUP_DOWN)
      ) {
        const mover =
          groupModificationType === GroupModificationType.TASK_GROUP_UP
            ? moveGroupUp
            : moveGroupDown;
        const reordered = mover(sequentialTaskGroups, groupIndex, taskIndex);
        handleReorderSequentialTasks(reordered);
        return;
      }

      onTaskGroupModification?.(groupModificationType, groupIndex, taskIndex);
    },
    [onTaskReorder, handleReorderSequentialTasks, onTaskGroupModification, sequentialTaskGroups]
  );

  /** Lazily builds context menu items for a task. Called only when the menu opens,
   * avoiding object allocation on every render for every task, and shared as a single
   * stable reference across all tasks (per-task closures would defeat DraggableTask's memo). */
  const buildContextMenuItems = useCallback(
    (task: StageTaskItem) => {
      const groupIndex = sequentialTaskGroups.findIndex((group) =>
        group.some((t) => t.id === task.id)
      );
      const taskGroup = sequentialTaskGroups[groupIndex];
      if (!taskGroup) {
        return [];
      }
      const isParallel = taskGroup.length > 1;
      const items: NodeMenuItem[] = [];

      const replaceTaskMenuItem = generateReplaceTaskMenuItemForTask(task.id, isParallel);
      if (replaceTaskMenuItem) {
        items.push(replaceTaskMenuItem);
      }

      const additionalMenuItems =
        getTaskContextMenuItems?.({ task, taskGroupType: 'sequential', isParallel }) ?? [];
      items.push(...additionalMenuItems);

      let groupIndexInAllTasks: number | undefined;
      let taskIndexInAllTasks: number | undefined;
      for (const [allTasksGroupIndex, group] of allTasks.entries()) {
        for (const [allTasksTaskIndex, t] of group.entries()) {
          if (t.id === task.id) {
            groupIndexInAllTasks = allTasksGroupIndex;
            taskIndexInAllTasks = allTasksTaskIndex;
            break;
          }
        }
      }

      if (
        onTaskGroupModification &&
        groupIndexInAllTasks !== undefined &&
        taskIndexInAllTasks !== undefined
      ) {
        const reGroupOptions = getContextMenuItems({
          isParallelGroup: isParallel,
          groupIndex,
          tasksLength: sequentialTaskGroups.length,
          groupIndexInAllTasks,
          taskIndexInAllTasks,
          isAboveParallel: (sequentialTaskGroups[groupIndex - 1]?.length ?? 0) > 1,
          isBelowParallel: (sequentialTaskGroups[groupIndex + 1]?.length ?? 0) > 1,
          reGroupTaskFunction: handleTaskRegroup,
          hideParallelOptions,
          labels: labels.contextMenu,
        });
        return items.length > 0 ? [...items, getDivider(), ...reGroupOptions] : reGroupOptions;
      }

      return items;
    },
    [
      onTaskGroupModification,
      sequentialTaskGroups,
      hideParallelOptions,
      handleTaskRegroup,
      generateReplaceTaskMenuItemForTask,
      getTaskContextMenuItems,
      allTasks,
      labels.contextMenu,
    ]
  );

  // Swallow the canvas drag/pan only while these rows are drag handles.
  return (
    <StageItemsList data-testid={`sequential-tasks-list-${id}`} className="nodrag nopan">
      {sequentialTaskGroups.map((taskGroup, groupIndex) => {
        return (
          <SequentialTasksGroup
            key={`group-${groupIndex}`}
            taskGroup={taskGroup}
            groupIndex={groupIndex}
            taskExecutions={taskExecutions}
            loadingTaskIds={loadingTaskIds}
            onTaskBreakpointToggle={onTaskBreakpointToggle}
            getTaskContextMenuItems={getTaskContextMenuItems}
            isReadOnly={isReadOnly}
            hasBuiltInTaskActions={hasBuiltInTaskActions}
            isDragDisabled={isDragDisabled}
            selectedTaskId={selectedTaskId}
            handleTaskClick={handleTaskClick}
            getSequentialContextMenuItems={buildContextMenuItems}
          />
        );
      })}
    </StageItemsList>
  );
};

export const SequentialTasksGroupLists = memo(SequentialTasksGroupListsInner);
