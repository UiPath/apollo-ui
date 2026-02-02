import { FontVariantToken, Padding, Spacing } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import {
  ApBadge,
  ApTooltip,
  ApTypography,
  BadgeSize,
  type StatusTypes,
} from '@uipath/apollo-react/material';
import { memo, useCallback, useState } from 'react';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import {
  StageTask,
  StageTaskIcon,
  StageTaskRetryDuration,
} from '../StageNode/StageNode.styles';
import type { StageTaskExecution } from '../StageNode/StageNode.types';
import { TaskMenu } from '../StageNode/TaskMenu';
import { useIsTaskParallel, useOptionalTaskNodeContext } from './TaskNodeContext';
import type { TaskNodeData, TaskNodeProps } from './TaskNode.types';

/**
 * Default icon for tasks without a custom icon
 */
const DefaultTaskIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

/**
 * Generate badge text with retry count
 */
const generateBadgeText = (taskExecution: StageTaskExecution) => {
  if (!taskExecution.badge) {
    return undefined;
  }
  if (taskExecution.retryCount && taskExecution.retryCount > 1) {
    return `${taskExecution.badge} x${taskExecution.retryCount}`;
  }
  return taskExecution.badge;
};

/**
 * Props for the task content component
 */
interface TaskContentProps {
  taskId: string;
  data: TaskNodeData;
  isDragging?: boolean;
  isHovered?: boolean;
}

/**
 * Inner content of a task node (label, icon, status, badges)
 */
export const TaskNodeContent = memo(({ taskId, data, isDragging, isHovered }: TaskContentProps) => {
  const { label, iconElement, execution, contextMenuItems, onMenuOpenChange } = data;
  const showMenu = isHovered && contextMenuItems && contextMenuItems.length > 0;

  return (
    <Column
      flex={1}
      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      gap={Padding.PadXs}
    >
      <Row align="center" justify="space-between">
        <Row
          gap={Spacing.SpacingXs}
          align="center"
          style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
        >
          <StageTaskIcon>{iconElement ?? <DefaultTaskIcon />}</StageTaskIcon>
          {/* Disable tooltip when dragging to avoid flickering */}
          <ApTooltip
            content={label}
            placement="top"
            smartTooltip
            {...(isDragging && { isOpen: false })}
          >
            <ApTypography
              variant={FontVariantToken.fontSizeM}
              color="var(--uix-canvas-foreground)"
              style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {label}
            </ApTypography>
          </ApTooltip>
        </Row>
        <Row align="center" gap={Spacing.SpacingXs}>
          {showMenu && contextMenuItems && (
            <TaskMenu
              taskId={taskId}
              contextMenuItems={contextMenuItems}
              onMenuOpenChange={onMenuOpenChange}
            />
          )}
          {execution?.status && execution.status !== 'NotExecuted' &&
            (execution.message ? (
              <ApTooltip content={execution.message} placement="top">
                <ExecutionStatusIcon status={execution.status} />
              </ApTooltip>
            ) : (
              <ExecutionStatusIcon status={execution.status} />
            ))}
        </Row>
      </Row>
      {execution && (
        <Row align="center" justify="space-between">
          <Row gap={'2px'}>
            {execution?.duration && (
              <ApTypography
                variant={FontVariantToken.fontSizeS}
                color="var(--uix-canvas-foreground-de-emp)"
              >
                {execution.duration}
              </ApTypography>
            )}
            {execution?.retryDuration && (
              <StageTaskRetryDuration status={execution.badgeStatus ?? 'warning'}>
                <ApTypography variant={FontVariantToken.fontSizeS} color="inherit">
                  {`(+${execution.retryDuration})`}
                </ApTypography>
              </StageTaskRetryDuration>
            )}
          </Row>
          {execution?.badge && (
            <ApBadge
              size={BadgeSize.SMALL}
              status={execution.badgeStatus as StatusTypes}
              label={generateBadgeText(execution) ?? ''}
            />
          )}
        </Row>
      )}
    </Column>
  );
});

TaskNodeContent.displayName = 'TaskNodeContent';

/**
 * TaskNode component for React Flow
 *
 * This component renders a task as a React Flow node. Tasks are child nodes
 * of stage nodes, with positions calculated based on order (not user drag position).
 *
 * Key features:
 * - Uses parentId to establish stage-task relationship
 * - Position is calculated by useTaskPositions, not dragged by user
 * - Reuses StageTask styled component for visual consistency
 * - Supports selection, hover, and drag states
 */
const TaskNodeComponent = ({ id, data, selected, dragging }: TaskNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get parallel status from context (if available)
  const isParallel = useIsTaskParallel(id);
  const context = useOptionalTaskNodeContext();

  // Tasks with execution status are not draggable
  const hasExecution = !!data.execution;

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const handleClick = useCallback(() => {
    // Use data.onTaskClick as fallback when context is null (React Flow renders nodes outside context)
    const clickHandler = context?.onTaskClick || data.onTaskClick;
    const selectHandler = context?.onTaskSelect || data.onTaskSelect;
    clickHandler?.(id);
    selectHandler?.(id);
  }, [context, id, data.onTaskClick, data.onTaskSelect]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Task node click handling
    <StageTask
      data-testid={`task-node-${id}`}
      selected={selected || isHovered}
      status={data.execution?.status}
      isParallel={isParallel}
      isDragEnabled={false} // TaskNode positions are calculated, not user-draggable
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        cursor: context?.isReadOnly ? 'default' : hasExecution ? 'default' : 'pointer',
        // Add visual feedback for selection using box-shadow (outline can cause shifts)
        boxShadow: selected ? '0 0 0 2px var(--uix-canvas-secondary-pressed)' : undefined,
        // Set explicit width (CSS variables don't cascade to React Flow nodes)
        width: data.width ? `${data.width}px` : undefined,
      }}
      className={hasExecution ? 'nodrag nopan' : 'nopan'} // Execution tasks not draggable
    >
      <TaskNodeContent taskId={id} data={data} isDragging={dragging} isHovered={isHovered} />
    </StageTask>
  );
};

export const TaskNode = memo(TaskNodeComponent);
TaskNode.displayName = 'TaskNode';
