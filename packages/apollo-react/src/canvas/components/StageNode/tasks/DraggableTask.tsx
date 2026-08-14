import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useRef } from 'react';
import { StageItemPill, StageTaskWrapper } from '../StageNode.styles';
import type { DraggableTaskProps } from './DraggableTask.types';
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

  const { attributes, listeners, setNodeRef, transition, transform } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
  });

  // Zoom is only needed to scale an active drag transform. The selector resolves
  // a constant while idle, so canvas zoom changes don't re-render every task —
  // but an active drag still tracks zoom reactively (e.g. pinch mid-drag).
  const zoom = useStore((s) => (transform ? s.transform[2] : 1));

  const style = useMemo<React.CSSProperties>(
    () => ({
      transition,
      transform: CSS.Transform.toString(
        transform ? { ...transform, x: transform.x / zoom, y: transform.y / zoom } : null
      ),
    }),
    [transform, zoom, transition]
  );

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
    <StageTaskWrapper
      ref={setNodeRef}
      style={style}
      isParallel={isParallel}
      {...attributes}
      {...listeners}
    >
      {taskElement}
    </StageTaskWrapper>
  );
};

export const DraggableTask = memo(DraggableTaskComponent);
