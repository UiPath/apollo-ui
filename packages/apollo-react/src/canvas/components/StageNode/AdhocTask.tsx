import { memo, useCallback, useRef, useState } from 'react';
import type { NodeMenuItem } from '../NodeContextMenu';
import { StageTask } from './StageNode.styles';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';
import { TaskContent } from './TaskContent';
import { TaskMenu, type TaskMenuHandle } from './TaskMenu';

interface AdhocTaskItemProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isSelected: boolean;
  getContextMenuItems?: () => NodeMenuItem[];
  onTaskClick: (e: React.MouseEvent, taskId: string) => void;
  onTaskPlay?: (taskId: string) => Promise<void>;
}

const AdhocTaskItemComponent = ({
  task,
  taskExecution,
  isSelected,
  getContextMenuItems,
  onTaskClick,
  onTaskPlay,
}: AdhocTaskItemProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const taskRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<TaskMenuHandle>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMenuOpen) return;
      onTaskClick(e, task.id);
    },
    [isMenuOpen, onTaskClick, task.id]
  );

  const handleMenuOpenChange = useCallback((isOpen: boolean) => {
    setIsMenuOpen(isOpen);
  }, []);

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
      {...(getContextMenuItems && { onContextMenu: handleContextMenu })}
    >
      <TaskContent task={task} taskExecution={taskExecution} onTaskPlay={onTaskPlay} />
      {getContextMenuItems && (
        <TaskMenu
          ref={menuRef}
          taskId={task.id}
          getContextMenuItems={getContextMenuItems}
          onMenuOpenChange={handleMenuOpenChange}
          taskRef={taskRef}
        />
      )}
    </StageTask>
  );
};

export const AdhocTaskItem = memo(AdhocTaskItemComponent);
