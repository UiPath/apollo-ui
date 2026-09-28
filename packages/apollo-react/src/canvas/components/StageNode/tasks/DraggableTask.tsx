import { memo, useCallback, useRef } from 'react';
import { StageItemPill } from '../StageNode.styles';
import type { DraggableTaskProps } from './DraggableTask.types';
import { SortableTaskRow } from './SortableTaskRow';
import { TaskBreakpointDot } from './TaskBreakpointDot';
import { TaskContent } from './TaskContent';
import { TaskMenu, type TaskMenuHandle } from './TaskMenu';
import { TaskMockedChip } from './TaskMockedChip';

const DraggableTaskComponent = ({
  task,
  taskExecution,
  isSelected,
  isParallel,
  getContextMenuItems,
  onTaskClick,
  isDragDisabled,
  isTaskLoading,
  isReadOnly,
  onToggleBreakpoint,
}: DraggableTaskProps) => {
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

  const taskElement = (
    <StageItemPill
      ref={taskRef}
      data-testid={`stage-task-card-${task.id}`}
      selected={isSelected}
      status={taskExecution?.status}
      isParallel={isParallel}
      isDragEnabled={!isDragDisabled}
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
      <TaskMockedChip taskId={task.id} mocked={!!task.isMocked} />
      <TaskContent
        task={task}
        taskExecution={taskExecution}
        trailingContent={
          getContextMenuItems ? (
            <TaskMenu
              ref={menuRef}
              task={task}
              getContextMenuItems={getContextMenuItems}
              disabled={isTaskLoading}
              hideTrigger={isReadOnly}
            />
          ) : undefined
        }
      />
    </StageItemPill>
  );

  if (isDragDisabled) {
    return taskElement;
  }

  return (
    <SortableTaskRow taskId={task.id} isParallel={isParallel}>
      {taskElement}
    </SortableTaskRow>
  );
};

export const DraggableTask = memo(DraggableTaskComponent);
