import { memo, RefObject, useCallback } from 'react';
import { GroupModificationType } from '../../utils/GroupModificationUtils';
import type { NodeMenuItem } from '../NodeContextMenu';
import { EventDrivenTaskItem } from './EventDrivenTask';
import {
  StageAdditionalTasksHeaderSection,
  StageAdditionalTasksSection,
  StageTaskList,
} from './StageNode.styles';
import type { StageNodeProps, StageTaskGroup, TaskStateReference } from './StageNode.types';
import { getDivider, getMenuItem } from './StageNodeTaskUtilities';

const StageNodeEventDrivenTaskGroupsInner = ({
  props,
  eventDrivenTasks,
  isReadOnly,
  selectedTaskId,
  taskStateReference,
  marginTop,
  handleTaskClick,
  setIsReplacingTask,
}: {
  props: StageNodeProps;
  eventDrivenTasks: StageTaskGroup[];
  isReadOnly: boolean;
  selectedTaskId?: string;
  taskStateReference: RefObject<TaskStateReference>;
  marginTop: string;
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  setIsReplacingTask: (isReplacingTask: boolean) => void;
}) => {
  const {
    execution,
    onTaskClick,
    onTaskGroupModification,
    onReplaceTaskFromToolbox,
    loadingTaskIds,
  } = props;

  /** Lazily builds context menu items for a task. Called only when the menu opens,
   * avoiding object allocation on every render for every task. */
  const getEventDrivenContextMenuItems = useCallback(
    (groupIndex: number, taskIndex: number, taskId: string): NodeMenuItem[] => {
      const items: NodeMenuItem[] = [];

      if (onReplaceTaskFromToolbox) {
        items.push(
          getMenuItem('replace-task', 'Replace task', () => {
            taskStateReference.current = {
              isParallel: false,
              groupIndex,
              taskIndex,
            };
            onTaskClick?.(taskId);
            setIsReplacingTask(true);
          })
        );
      }

      if (onTaskGroupModification) {
        if (items.length > 0) items.push(getDivider());
        items.push(
          getMenuItem('remove-task', 'Delete task', () =>
            onTaskGroupModification(GroupModificationType.REMOVE_TASK, groupIndex, taskIndex)
          )
        );
      }

      return items;
    },
    [
      onReplaceTaskFromToolbox,
      onTaskClick,
      onTaskGroupModification,
      setIsReplacingTask,
      taskStateReference,
    ]
  );

  if (eventDrivenTasks.length === 0) {
    return null;
  }
  return (
    <StageAdditionalTasksSection style={{ marginTop }}>
      <StageAdditionalTasksHeaderSection>
        <span className="text-xs font-bold text-foreground-muted">Event-driven tasks</span>
      </StageAdditionalTasksHeaderSection>
      <StageTaskList>
        {eventDrivenTasks.map(({ task, groupIndex, taskIndex }) => {
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
                  getContextMenuItems: () =>
                    getEventDrivenContextMenuItems(groupIndex, taskIndex, task.id),
                })}
            />
          );
        })}
      </StageTaskList>
    </StageAdditionalTasksSection>
  );
};

export const StageNodeEventDrivenTaskGroups = memo(StageNodeEventDrivenTaskGroupsInner);
