import { memo, useCallback, useRef } from 'react';
import type { NodeMenuItem } from '../../NodeContextMenu';
import { StageItemPill } from '../StageNode.styles';
import type { StageTaskExecution, StageTaskItem } from '../StageNode.types';
import { TaskBreakpointDot } from './TaskBreakpointDot';
import { TaskContent } from './TaskContent';
import { TaskMenu, type TaskMenuHandle } from './TaskMenu';

interface EventDrivenTaskItemProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isSelected: boolean;
  /** Receives the task so parents can pass one stable function to every item
   * instead of a per-task closure (which would defeat the memo below). */
  getContextMenuItems?: (task: StageTaskItem) => NodeMenuItem[];
  onTaskClick: (e: React.MouseEvent, taskId: string) => void;
  isTaskLoading?: boolean;
  /** Read-only (Debug) view: the task's "⋮" button is dropped, right-click still opens the menu. */
  isReadOnly?: boolean;
  /** Makes the breakpoint gutter interactive. Passed only in the Debug view. */
  onToggleBreakpoint?: (taskId: string) => void;
}

const EventDrivenTaskItemComponent = ({
  task,
  taskExecution,
  isSelected,
  getContextMenuItems,
  onTaskClick,
  isTaskLoading,
  isReadOnly,
  onToggleBreakpoint,
}: EventDrivenTaskItemProps) => {
  const taskRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<TaskMenuHandle>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onTaskClick(e, task.id);
    },
    [onTaskClick, task.id]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    menuRef.current?.handleContextMenu(e);
  }, []);

  return (
    <StageItemPill
      ref={taskRef}
      data-testid={`stage-task-card-${task.id}`}
      selected={isSelected}
      status={taskExecution?.status}
      isPlaceholder={task.isPlaceholder}
      onClick={handleClick}
      {...(getContextMenuItems && !isTaskLoading && { onContextMenu: handleContextMenu })}
    >
      <TaskBreakpointDot
        taskId={task.id}
        active={!!taskExecution?.breakpoint}
        paused={taskExecution?.status === 'Paused'}
        onToggle={onToggleBreakpoint}
      />
      <TaskContent task={task} taskExecution={taskExecution} />

      {getContextMenuItems && (
        <TaskMenu
          ref={menuRef}
          task={task}
          getContextMenuItems={getContextMenuItems}
          disabled={isTaskLoading}
          hideTrigger={isReadOnly}
        />
      )}
    </StageItemPill>
  );
};

export const EventDrivenTaskItem = memo(EventDrivenTaskItemComponent);
