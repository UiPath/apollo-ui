import { memo, useCallback } from 'react';
import type { NodeMenuItem } from '../../NodeContextMenu';
import { StageItemsList, StageItemsSection } from '../StageNode.styles';
import type { StageNodeProps, StageTaskGroup, StageTaskItem } from '../StageNode.types';
import { StageItemsHeaderTitle } from '../shared/StageItemsHeaderTitle';
import { useStageNodeLabels } from '../useStageNodeLabels';
import { EventDrivenTaskItem } from './EventDrivenTask';

const StageNodeEventDrivenTaskGroupsInner = ({
  props,
  eventDrivenTasks,
  isReadOnly,
  selectedTaskId,
  handleTaskClick,
  generateReplaceTaskMenuItemForTask,
  generateDeleteTaskMenuItemForTask,
}: {
  props: StageNodeProps;
  eventDrivenTasks: StageTaskGroup[];
  isReadOnly: boolean;
  selectedTaskId?: string;
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  generateReplaceTaskMenuItemForTask: (
    taskId: string,
    isParallel: boolean
  ) => NodeMenuItem | undefined;
  generateDeleteTaskMenuItemForTask: (taskId: string) => NodeMenuItem | undefined;
}) => {
  const {
    id,
    execution,
    onTaskGroupModification,
    onReplaceTaskFromToolbox,
    loadingTaskIds,
    getTaskContextMenuItems,
  } = props;
  const hasBuiltInTaskActions = !!(onReplaceTaskFromToolbox || onTaskGroupModification);
  const labels = useStageNodeLabels();

  /** Lazily builds context menu items for a task. Called only when the menu opens,
   * avoiding object allocation on every render for every task. */
  const getEventDrivenContextMenuItems = useCallback(
    (task: StageTaskItem): NodeMenuItem[] => {
      const items: NodeMenuItem[] = [];

      const replaceTaskMenuItem = generateReplaceTaskMenuItemForTask(task.id, false);
      if (replaceTaskMenuItem) {
        items.push(replaceTaskMenuItem);
      }

      const additionalMenuItems =
        getTaskContextMenuItems?.({ task, taskGroupType: 'event-driven', isParallel: false }) ?? [];
      items.push(...additionalMenuItems);

      const deleteTaskMenuItem = generateDeleteTaskMenuItemForTask(task.id);
      if (deleteTaskMenuItem) {
        items.push(deleteTaskMenuItem);
      }

      return items;
    },
    [generateReplaceTaskMenuItemForTask, getTaskContextMenuItems, generateDeleteTaskMenuItemForTask]
  );

  if (eventDrivenTasks.length === 0) {
    return null;
  }
  return (
    <StageItemsSection>
      <StageItemsHeaderTitle
        title={labels.eventDrivenTasks}
        testId={`event-driven-tasks-header-${id}`}
      />
      <StageItemsList data-testid={`event-driven-tasks-list-${id}`}>
        {eventDrivenTasks.map(({ task }) => {
          const taskExecution = execution?.taskStatus?.[task.id];
          // Consumer items (e.g. breakpoints) are allowed even in read-only/Debug view;
          // only the built-in edit actions are gated on !isReadOnly. When built-in actions
          // already guarantee a menu we skip the eager consumer call; otherwise we ask the
          // consumer whether it contributes any items.
          const hasMenu =
            (!isReadOnly && hasBuiltInTaskActions) ||
            (getTaskContextMenuItems?.({ task, taskGroupType: 'event-driven', isParallel: false })
              ?.length ?? 0) > 0;
          return (
            <EventDrivenTaskItem
              key={task.id}
              task={task}
              taskExecution={taskExecution}
              isSelected={selectedTaskId === task.id}
              onTaskClick={handleTaskClick}
              isTaskLoading={loadingTaskIds?.has(task.id)}
              getContextMenuItems={hasMenu ? getEventDrivenContextMenuItems : undefined}
            />
          );
        })}
      </StageItemsList>
    </StageItemsSection>
  );
};

export const StageNodeEventDrivenTaskGroups = memo(StageNodeEventDrivenTaskGroupsInner);
