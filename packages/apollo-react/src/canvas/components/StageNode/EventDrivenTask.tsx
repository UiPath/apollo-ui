import { memo, useCallback, useRef } from 'react';
import type { NodeMenuItem } from '../NodeContextMenu';
import { StageTask } from './StageNode.styles';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';
import { TaskContent } from './TaskContent';
import { TaskMenu, type TaskMenuHandle } from './TaskMenu';

interface EventDrivenTaskItemProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isSelected: boolean;
  getContextMenuItems?: () => NodeMenuItem[];
  onTaskClick: (e: React.MouseEvent, taskId: string) => void;
  isTaskLoading?: boolean;
}

const EventDrivenTaskItemComponent = ({
  task,
  taskExecution,
  isSelected,
  getContextMenuItems,
  onTaskClick,
  isTaskLoading,
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
    <StageTask
      ref={taskRef}
      data-testid={`stage-task-${task.id}`}
      selected={isSelected}
      status={taskExecution?.status}
      onClick={handleClick}
      {...(getContextMenuItems && !isTaskLoading && { onContextMenu: handleContextMenu })}
    >
      <TaskContent task={task} taskExecution={taskExecution} />

      {getContextMenuItems && (
        <TaskMenu
          ref={menuRef}
          taskId={task.id}
          getContextMenuItems={getContextMenuItems}
          disabled={isTaskLoading}
        />
      )}
    </StageTask>
  );
};

export const EventDrivenTaskItem = memo(EventDrivenTaskItemComponent);
