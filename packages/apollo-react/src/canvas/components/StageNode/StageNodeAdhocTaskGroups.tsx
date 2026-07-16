import { memo, useCallback } from 'react';
import type { NodeMenuItem } from '../NodeContextMenu';
import { AdhocTaskItem } from './AdhocTask';
import {
  StageAdditionalTasksHeaderSection,
  StageAdditionalTasksSection,
  StageTaskList,
} from './StageNode.styles';
import type { StageNodeProps, StageTaskGroup, StageTaskItem } from './StageNode.types';
import { useStageNodeLabels } from './useStageNodeLabels';

const StageNodeAdhocTaskGroupsInner = ({
  props,
  adhocTasks,
  isReadOnly,
  selectedTaskId,
  marginTop,
  handleTaskClick,
  generateReplaceTaskMenuItemForTask,
  generateDeleteTaskMenuItemForTask,
}: {
  props: StageNodeProps;
  adhocTasks: StageTaskGroup[];
  isReadOnly: boolean;
  selectedTaskId?: string;
  marginTop: string;
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  generateReplaceTaskMenuItemForTask: (
    taskId: string,
    isParallel: boolean
  ) => NodeMenuItem | undefined;
  generateDeleteTaskMenuItemForTask: (taskId: string) => NodeMenuItem | undefined;
}) => {
  const {
    execution,
    onTaskGroupModification,
    onReplaceTaskFromToolbox,
    onTaskPlay,
    loadingTaskIds,
    getTaskContextMenuItems,
  } = props;
  const hasBuiltInTaskActions = !!(onReplaceTaskFromToolbox || onTaskGroupModification);
  const labels = useStageNodeLabels();

  /** Lazily builds context menu items for a task. Called only when the menu opens,
   * avoiding object allocation on every render for every task. */
  const getAdhocContextMenuItems = useCallback(
    (task: StageTaskItem): NodeMenuItem[] => {
      const items: NodeMenuItem[] = [];

      const replaceTaskMenuItem = generateReplaceTaskMenuItemForTask(task.id, false);
      if (replaceTaskMenuItem) {
        items.push(replaceTaskMenuItem);
      }

      const additionalMenuItems =
        getTaskContextMenuItems?.({ task, taskGroupType: 'adhoc', isParallel: false }) ?? [];
      items.push(...additionalMenuItems);

      const deleteTaskMenuItem = generateDeleteTaskMenuItemForTask(task.id);
      if (deleteTaskMenuItem) {
        items.push(deleteTaskMenuItem);
      }

      return items;
    },
    [generateReplaceTaskMenuItemForTask, getTaskContextMenuItems, generateDeleteTaskMenuItemForTask]
  );

  if (adhocTasks.length === 0) {
    return null;
  }
  return (
    <StageAdditionalTasksSection style={{ marginTop }}>
      <StageAdditionalTasksHeaderSection>
        <span className="text-xs font-bold text-foreground-muted">{labels.adhocTasks}</span>
      </StageAdditionalTasksHeaderSection>
      <StageTaskList>
        {adhocTasks.map(({ task }) => {
          const taskExecution = execution?.taskStatus?.[task.id];
          // Consumer items (e.g. breakpoints) are allowed even in read-only/Debug view;
          // only the built-in edit actions are gated on !isReadOnly. When built-in actions
          // already guarantee a menu we skip the eager consumer call; otherwise we ask the
          // consumer whether it contributes any items.
          const hasMenu =
            (!isReadOnly && hasBuiltInTaskActions) ||
            (getTaskContextMenuItems?.({ task, taskGroupType: 'adhoc', isParallel: false })
              ?.length ?? 0) > 0;
          return (
            <AdhocTaskItem
              key={task.id}
              task={task}
              taskExecution={taskExecution}
              isSelected={selectedTaskId === task.id}
              onTaskClick={handleTaskClick}
              onTaskPlay={onTaskPlay}
              isTaskLoading={loadingTaskIds?.has(task.id)}
              getContextMenuItems={hasMenu ? getAdhocContextMenuItems : undefined}
            />
          );
        })}
      </StageTaskList>
    </StageAdditionalTasksSection>
  );
};

export const StageNodeAdhocTaskGroups = memo(StageNodeAdhocTaskGroupsInner);
