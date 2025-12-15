import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ApBadge, ApIcon, ApTooltip, ApTypography } from "@uipath/portal-shell-react";
import { Column, FontVariantToken, Row } from "@uipath/uix/core";
import { memo, useCallback, useMemo } from "react";
import { ExecutionStatusIcon } from "../ExecutionStatusIcon";
import type { DraggableTaskProps, TaskContentProps } from "./DraggableTask.types";
import {
  INDENTATION_WIDTH,
  StageTask,
  StageTaskDragPlaceholder,
  StageTaskDragPlaceholderWrapper,
  StageTaskIcon,
  StageTaskRemoveButton,
  StageTaskRetryDuration,
  StageTaskWrapper,
} from "./StageNode.styles";
import type { StageTaskExecution } from "./StageNode.types";
import { TaskContextMenu } from "./TaskContextMenu";

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
    <StageTaskIcon>{task.icon ?? <ProcessNodeIcon />}</StageTaskIcon>
    <Column flex={1} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      <Row align="center" justify="space-between">
        {/* disable tooltip when dragging to avoid tooltip flickering */}
        <ApTooltip content={task.label} placement="top" smartTooltip {...(isDragging && { isOpen: false })}>
          <ApTypography
            variant={FontVariantToken.fontSizeM}
            color="var(--uix-canvas-foreground)"
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {task.label}
          </ApTypography>
        </ApTooltip>
        {taskExecution?.status &&
          (taskExecution.message ? (
            <ApTooltip content={taskExecution.message} placement="top">
              <ExecutionStatusIcon status={taskExecution.status} />
            </ApTooltip>
          ) : (
            <ExecutionStatusIcon status={taskExecution.status} />
          ))}
      </Row>
      <Row align="center" justify="space-between">
        <Row gap={"2px"}>
          {taskExecution?.duration && (
            <ApTypography variant={FontVariantToken.fontSizeS} color="var(--uix-canvas-foreground-de-emp)">
              {taskExecution.duration}
            </ApTypography>
          )}
          {taskExecution?.retryDuration && (
            <StageTaskRetryDuration status={taskExecution.badgeStatus ?? "warning"}>
              <ApTypography variant={FontVariantToken.fontSizeS} color="inherit">
                {`(+${taskExecution.retryDuration})`}
              </ApTypography>
            </StageTaskRetryDuration>
          )}
        </Row>
        {taskExecution?.badge && (
          <ApBadge size="small" status={taskExecution.badgeStatus ?? "warning"} label={generateBadgeText(taskExecution)} />
        )}
      </Row>
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
  onRemove,
  isDragDisabled,
  projectedDepth,
  zoom = 1,
}: DraggableTaskProps) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onTaskClick(e, task.id);
    },
    [onTaskClick, task.id]
  );

  const { attributes, listeners, setNodeRef, transition, transform, isDragging } = useSortable({ id: task.id, disabled: isDragDisabled });

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
      onClick={handleClick}
      {...(onContextMenu && { onContextMenu })}
    >
      <TaskContent task={task} taskExecution={taskExecution} />
      <TaskContextMenu isVisible={isContextMenuVisible} menuItems={contextMenuItems} refTask={contextMenuAnchor} />
      {onRemove && (
        <StageTaskRemoveButton className="task-remove-button" data-testid={`stage-task-remove-${task.id}`} onClick={onRemove}>
          <ApIcon name="close" size="16px" />
        </StageTaskRemoveButton>
      )}
    </StageTask>
  );

  if (isDragDisabled) {
    return taskElement;
  }

  return (
    <StageTaskWrapper ref={setNodeRef} style={style} isParallel={isParallel} {...attributes} {...listeners}>
      {taskElement}
    </StageTaskWrapper>
  );
};

export const DraggableTask = memo(DraggableTaskComponent);
