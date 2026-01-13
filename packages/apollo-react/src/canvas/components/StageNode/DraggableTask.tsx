import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FontVariantToken, Padding, Spacing } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import {
  ApBadge,
  ApTooltip,
  ApTypography,
  BadgeSize,
  type StatusTypes,
} from '@uipath/apollo-react/material';
import { memo, useCallback, useMemo, useState } from 'react';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import type { DraggableTaskProps, TaskContentProps } from './DraggableTask.types';
import {
  INDENTATION_WIDTH,
  StageTask,
  StageTaskDragPlaceholder,
  StageTaskDragPlaceholderWrapper,
  StageTaskIcon,
  StageTaskRetryDuration,
  StageTaskWrapper,
} from './StageNode.styles';
import type { StageTaskExecution } from './StageNode.types';
import { TaskContextMenu } from './TaskContextMenu';
import { TaskMenu } from './TaskMenu';

const ProcessNodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const generateBadgeText = (taskExecution: StageTaskExecution) => {
  if (!taskExecution.badge) {
    return undefined;
  }
  if (taskExecution.retryCount && taskExecution.retryCount > 1) {
    return `${taskExecution.badge} x${taskExecution.retryCount}`;
  }
  return taskExecution.badge;
};

export const TaskContent = memo(({ task, taskExecution, isDragging }: TaskContentProps) => (
  <>
    <Column
      flex={1}
      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      gap={Padding.PadXs}
    >
      <Row align="center" justify="space-between">
        {/* disable tooltip when dragging to avoid tooltip flickering */}
        <Row
          gap={Spacing.SpacingXs}
          align="center"
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          <StageTaskIcon>{task.icon ?? <ProcessNodeIcon />}</StageTaskIcon>
          <ApTooltip
            content={task.label}
            placement="top"
            smartTooltip
            {...(isDragging && { isOpen: false })}
          >
            <ApTypography
              variant={FontVariantToken.fontSizeM}
              color="var(--uix-canvas-foreground)"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {task.label}
            </ApTypography>
          </ApTooltip>
        </Row>
        {taskExecution?.status &&
          (taskExecution.message ? (
            <ApTooltip content={taskExecution.message} placement="top">
              <ExecutionStatusIcon status={taskExecution.status} />
            </ApTooltip>
          ) : (
            <ExecutionStatusIcon status={taskExecution.status} />
          ))}
      </Row>
      {taskExecution && (
        <Row align="center" justify="space-between">
          <Row gap={'2px'}>
            {taskExecution?.duration && (
              <ApTypography
                variant={FontVariantToken.fontSizeS}
                color="var(--uix-canvas-foreground-de-emp)"
              >
                {taskExecution.duration}
              </ApTypography>
            )}
            {taskExecution?.retryDuration && (
              <StageTaskRetryDuration status={taskExecution.badgeStatus ?? 'warning'}>
                <ApTypography variant={FontVariantToken.fontSizeS} color="inherit">
                  {`(+${taskExecution.retryDuration})`}
                </ApTypography>
              </StageTaskRetryDuration>
            )}
          </Row>
          {taskExecution?.badge && (
            <ApBadge
              size={BadgeSize.SMALL}
              status={taskExecution.badgeStatus as StatusTypes}
              label={generateBadgeText(taskExecution) ?? ''}
            />
          )}
        </Row>
      )}
    </Column>
  </>
));

const DraggableTaskComponent = ({
  task,
  taskExecution,
  isSelected,
  isParallel,
  isContextMenuVisible,
  contextMenuItems,
  contextMenuAnchor,
  onTaskClick,
  onContextMenu,
  isDragDisabled,
  projectedDepth,
  zoom = 1,
}: DraggableTaskProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // If any menu is open, prevent task selection
      if (isMenuOpen || isContextMenuVisible) {
        return;
      }
      onTaskClick(e, task.id);
    },
    [isMenuOpen, isContextMenuVisible, onTaskClick, task.id]
  );

  const handleMenuOpenChange = useCallback((isOpen: boolean) => {
    setIsMenuOpen(isOpen);
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
      data-testid={`stage-task-${task.id}`}
      selected={isSelected}
      status={taskExecution?.status}
      isParallel={isParallel}
      isDragEnabled={!isDragDisabled}
      isMenuOpen={isMenuOpen}
      onClick={handleClick}
      {...(onContextMenu && { onContextMenu })}
    >
      <TaskContent task={task} taskExecution={taskExecution} />
      {onContextMenu && (
        <>
          <TaskContextMenu
            isVisible={isContextMenuVisible}
            menuItems={contextMenuItems}
            refTask={contextMenuAnchor}
          />
          <TaskMenu
            taskId={task.id}
            contextMenuItems={contextMenuItems}
            onMenuOpenChange={handleMenuOpenChange}
          />
        </>
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
