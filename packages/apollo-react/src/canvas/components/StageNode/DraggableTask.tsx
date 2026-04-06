import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ApTooltip } from '@uipath/apollo-react/material';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { EntryConditionIcon } from '../../icons';
import type { DraggableTaskProps } from './DraggableTask.types';
import {
  INDENTATION_WIDTH,
  StageTask,
  StageTaskDragPlaceholder,
  StageTaskDragPlaceholderWrapper,
  StageTaskWrapper,
} from './StageNode.styles';
import { TaskContent } from './TaskContent';
import { TaskMenu, type TaskMenuHandle } from './TaskMenu';

const DraggableTaskComponent = ({
  task,
  taskExecution,
  isSelected,
  isParallel,
  contextMenuItems,
  onTaskClick,
  onMenuOpen,
  isDragDisabled,
  projectedDepth,
  zoom = 1,
}: DraggableTaskProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const taskRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<TaskMenuHandle>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // If any menu is open, prevent task selection
      if (isMenuOpen) {
        return;
      }
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

  const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({
    id: task.id,
    disabled: isDragDisabled,
  });

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
      onClick={handleClick}
      {...(contextMenuItems.length > 0 && { onContextMenu: handleContextMenu })}
    >
      <TaskContent task={task} taskExecution={taskExecution} />

      {task.hasEntryCondition && (
        <ApTooltip content="Entry condition" placement="top">
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--color-icon-default)',
              flexShrink: 0,
            }}
          >
            <EntryConditionIcon w={20} h={20} />
          </span>
        </ApTooltip>
      )}
      {contextMenuItems.length > 0 && (
        <TaskMenu
          ref={menuRef}
          taskId={task.id}
          contextMenuItems={contextMenuItems}
          onMenuOpenChange={handleMenuOpenChange}
          onMenuOpen={onMenuOpen}
          taskRef={taskRef}
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
