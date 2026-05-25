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
          const customItems =
            !isReadOnly && !hasBuiltInTaskActions
              ? (getTaskContextMenuItems?.({
                  task,
                  taskGroupType: 'adhoc',
                  isParallel: false,
                }) ?? [])
              : [];
          const hasMenu = !isReadOnly && (hasBuiltInTaskActions || customItems.length > 0);
          return (
            <AdhocTaskItem
              key={task.id}
              task={task}
              taskExecution={taskExecution}
              isSelected={selectedTaskId === task.id}
              onTaskClick={handleTaskClick}
              onTaskPlay={onTaskPlay}
              isTaskLoading={loadingTaskIds?.has(task.id)}
              {...(hasMenu && {
                getContextMenuItems: () => getAdhocContextMenuItems(task),
              })}
            />
          );
        })}
      </StageTaskList>
    </StageAdditionalTasksSection>
  );
};

export const StageNodeAdhocTaskGroups = memo(StageNodeAdhocTaskGroupsInner);
