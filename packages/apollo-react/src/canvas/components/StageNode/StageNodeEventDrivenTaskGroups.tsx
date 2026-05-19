import { memo, useCallback } from 'react';
import type { NodeMenuItem } from '../NodeContextMenu';
import { EventDrivenTaskItem } from './EventDrivenTask';
import {
  StageAdditionalTasksHeaderSection,
  StageAdditionalTasksSection,
  StageTaskList,
} from './StageNode.styles';
import type { StageNodeProps, StageTaskGroup } from './StageNode.types';
import { useStageNodeLabels } from './useStageNodeLabels';

const StageNodeEventDrivenTaskGroupsInner = ({
  props,
  eventDrivenTasks,
  isReadOnly,
  selectedTaskId,
  marginTop,
  handleTaskClick,
  generateReplaceTaskMenuItemForTask,
  generateDeleteTaskMenuItemForTask,
}: {
  props: StageNodeProps;
  eventDrivenTasks: StageTaskGroup[];
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
  const { execution, onTaskGroupModification, onReplaceTaskFromToolbox, loadingTaskIds } = props;
  const labels = useStageNodeLabels();

  /** Lazily builds context menu items for a task. Called only when the menu opens,
   * avoiding object allocation on every render for every task. */
  const getEventDrivenContextMenuItems = useCallback(
    (taskId: string): NodeMenuItem[] => {
      const items: NodeMenuItem[] = [];

      const replaceTaskMenuItem = generateReplaceTaskMenuItemForTask(taskId, false);
      if (replaceTaskMenuItem) {
        items.push(replaceTaskMenuItem);
      }

      const deleteTaskMenuItem = generateDeleteTaskMenuItemForTask(taskId);
      if (deleteTaskMenuItem) {
        items.push(deleteTaskMenuItem);
      }

      return items;
    },
    [generateReplaceTaskMenuItemForTask, generateDeleteTaskMenuItemForTask]
  );

  if (eventDrivenTasks.length === 0) {
    return null;
  }
  return (
    <StageAdditionalTasksSection style={{ marginTop }}>
      <StageAdditionalTasksHeaderSection>
        <span className="text-xs font-bold text-foreground-muted">{labels.eventDrivenTasks}</span>
      </StageAdditionalTasksHeaderSection>
      <StageTaskList>
        {eventDrivenTasks.map(({ task }) => {
          const taskExecution = execution?.taskStatus?.[task.id];
          return (
            <EventDrivenTaskItem
              key={task.id}
              task={task}
              taskExecution={taskExecution}
              isSelected={selectedTaskId === task.id}
              onTaskClick={handleTaskClick}
              isTaskLoading={loadingTaskIds?.has(task.id)}
              {...((onTaskGroupModification || onReplaceTaskFromToolbox) &&
                !isReadOnly && {
                  getContextMenuItems: () => getEventDrivenContextMenuItems(task.id),
                })}
            />
          );
        })}
      </StageTaskList>
    </StageAdditionalTasksSection>
  );
};

export const StageNodeEventDrivenTaskGroups = memo(StageNodeEventDrivenTaskGroupsInner);
