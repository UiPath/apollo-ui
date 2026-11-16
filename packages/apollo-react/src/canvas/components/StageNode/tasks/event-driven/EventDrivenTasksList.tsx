import { memo, useCallback } from 'react';
import type { NodeMenuItem } from '../../../NodeContextMenu';
import { StageItemsList } from '../../StageNode.styles';
import type {
  StageNodeProps,
  StageNodeTaskExecutionsProps,
  StageTaskItem,
} from '../../StageNode.types';
import { getDivider } from '../shared/StageNodeTaskUtilities';
import { EventDrivenTaskRow } from './EventDrivenTaskRow';

interface EventDrivenTasksListInnerProps {
  id: string;
  tasks: StageTaskItem[];
  taskExecutions?: StageNodeTaskExecutionsProps;
  loadingTaskIds?: ReadonlySet<string>;
  isReadOnly: boolean;
  selectedTaskId?: string;
  hasBuiltInTaskActions: boolean;
  isDragDisabled: boolean;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  generateReplaceTaskMenuItemForTask: (
    taskId: string,
    isParallel: boolean
  ) => NodeMenuItem | undefined;
  generateDeleteTaskMenuItemForTask: (taskId: string) => NodeMenuItem | undefined;
}

const EventDrivenTasksListInner = ({
  id,
  tasks,
  taskExecutions,
  loadingTaskIds,
  isReadOnly,
  selectedTaskId,
  hasBuiltInTaskActions,
  isDragDisabled,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  handleTaskClick,
  generateReplaceTaskMenuItemForTask,
  generateDeleteTaskMenuItemForTask,
}: EventDrivenTasksListInnerProps) => {
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
        if (items.length) {
          items.push(getDivider());
        }
        items.push(deleteTaskMenuItem);
      }

      return items;
    },
    [generateReplaceTaskMenuItemForTask, getTaskContextMenuItems, generateDeleteTaskMenuItemForTask]
  );

  // Swallow the canvas drag/pan only while these rows are drag handles.
  return (
    <StageItemsList
      data-testid={`event-driven-tasks-list-${id}`}
      className={isDragDisabled ? undefined : 'nodrag nopan'}
    >
      {tasks.map((task) => {
        const taskExecution = taskExecutions?.[task.id];
        return (
          <EventDrivenTaskRow
            key={task.id}
            task={task}
            taskExecution={taskExecution}
            isTaskLoading={loadingTaskIds?.has(task.id)}
            isReadOnly={isReadOnly}
            selectedTaskId={selectedTaskId}
            hasBuiltInTaskActions={hasBuiltInTaskActions}
            isDragDisabled={isDragDisabled}
            onTaskBreakpointToggle={onTaskBreakpointToggle}
            getTaskContextMenuItems={getTaskContextMenuItems}
            handleTaskClick={handleTaskClick}
            getEventDrivenContextMenuItems={getEventDrivenContextMenuItems}
          />
        );
      })}
    </StageItemsList>
  );
};

export const EventDrivenTasksList = memo(EventDrivenTasksListInner);
