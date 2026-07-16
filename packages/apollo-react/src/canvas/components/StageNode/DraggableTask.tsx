import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useRef } from 'react';
import type { DraggableTaskProps } from './DraggableTask.types';
import {
  INDENTATION_WIDTH,
  StageTask,
  StageTaskDragPlaceholder,
  StageTaskDragPlaceholderWrapper,
  StageTaskWrapper,
} from './StageNode.styles';
import { TaskBreakpointDot } from './TaskBreakpointDot';
import { TaskContent } from './TaskContent';
import { TaskMenu, type TaskMenuHandle } from './TaskMenu';

const DraggableTaskComponent = ({
  task,
  taskExecution,
  isSelected,
  isParallel,
  getContextMenuItems,
  onTaskClick,
  isDragDisabled,
  projectedDepth,
  isTaskLoading,
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

  const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
  });

  // Zoom is only needed to scale an active drag transform. The selector resolves
  // a constant while idle, so canvas zoom changes don't re-render every task —
  // but an active drag still tracks zoom reactively (e.g. pinch mid-drag).
  const zoom = useStore((s) => (transform ? s.transform[2] : 1));

  const style = useMemo<React.CSSProperties>(() => {
    const scaledTransform = transform
      ? {
          ...transform,
          x: transform.x / zoom,
          y: transform.y / zoom,
        }
      : null;

    let marginLeft: string | undefined;
    if (isDragging && projectedDepth !== undefined) {
      if (projectedDepth === 1 && !isParallel) marginLeft = `${INDENTATION_WIDTH}px`;
      else if (projectedDepth === 0 && isParallel) marginLeft = `-${INDENTATION_WIDTH}px`;
    }

    return {
      transition,
      transform: CSS.Transform.toString(scaledTransform),
      marginLeft,
    };
  }, [transform, zoom, transition, isDragging, projectedDepth, isParallel]);

  if (isDragging) {
    const isTargetParallel = projectedDepth === 1;
    return (
      <StageTaskDragPlaceholderWrapper ref={setNodeRef} style={style}>
        <StageTaskDragPlaceholder isTargetParallel={isTargetParallel} />
      </StageTaskDragPlaceholderWrapper>
    );
  }

  const taskElement = (
    <StageTask
      ref={taskRef}
      data-testid={`stage-task-${task.id}`}
      selected={isSelected}
      status={taskExecution?.status}
      isParallel={isParallel}
      isDragEnabled={!isDragDisabled}
      isPlaceholder={task.isPlaceholder}
      onClick={handleClick}
      {...(getContextMenuItems && !isTaskLoading && { onContextMenu: handleContextMenu })}
    >
      <TaskBreakpointDot taskId={task.id} active={!!taskExecution?.breakpoint} />
      <TaskContent task={task} taskExecution={taskExecution} />

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
