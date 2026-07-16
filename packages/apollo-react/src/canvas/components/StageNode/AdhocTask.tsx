import { memo, useCallback, useRef } from 'react';
import type { NodeMenuItem } from '../NodeContextMenu';
import { StageTask } from './StageNode.styles';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';
import { TaskBreakpointDot } from './TaskBreakpointDot';
import { TaskContent } from './TaskContent';
import { TaskMenu, type TaskMenuHandle } from './TaskMenu';

interface AdhocTaskItemProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isSelected: boolean;
  /** Receives the task so parents can pass one stable function to every item
   * instead of a per-task closure (which would defeat the memo below). */
  getContextMenuItems?: (task: StageTaskItem) => NodeMenuItem[];
  onTaskClick: (e: React.MouseEvent, taskId: string) => void;
  onTaskPlay?: (taskId: string) => Promise<void>;
  isTaskLoading?: boolean;
}

const AdhocTaskItemComponent = ({
  task,
  taskExecution,
  isSelected,
  getContextMenuItems,
  onTaskClick,
  onTaskPlay,
  isTaskLoading,
}: AdhocTaskItemProps) => {
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
    <StageTask
      ref={taskRef}
      data-testid={`stage-task-${task.id}`}
      selected={isSelected}
      status={taskExecution?.status}
      isPlaceholder={task.isPlaceholder}
      onClick={handleClick}
      {...(getContextMenuItems && !isTaskLoading && { onContextMenu: handleContextMenu })}
    >
      <TaskBreakpointDot taskId={task.id} active={!!taskExecution?.breakpoint} />
      <TaskContent task={task} taskExecution={taskExecution} onTaskPlay={onTaskPlay} />
      {getContextMenuItems && (
        <TaskMenu
          ref={menuRef}
          task={task}
          getContextMenuItems={getContextMenuItems}
          disabled={isTaskLoading}
        />
      )}
    </StageTask>
  );
};

export const AdhocTaskItem = memo(AdhocTaskItemComponent);
