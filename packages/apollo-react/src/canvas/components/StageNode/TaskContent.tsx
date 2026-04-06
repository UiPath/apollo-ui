import { FontVariantToken, Padding, Spacing } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import {
  ApBadge,
  ApCircularProgress,
  ApIconButton,
  ApTooltip,
  ApTypography,
  BadgeSize,
  type StatusTypes,
} from '@uipath/apollo-react/material';
import debounce from 'debounce';
import { memo, useCallback, useMemo, useState } from 'react';
import { PlayIcon } from '../../icons';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import { StageTaskIcon, StageTaskRetryDuration } from './StageNode.styles';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';

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

const TaskPlayButton = memo(
  ({
    taskId,
    onTaskPlay,
    small,
  }: {
    taskId: string;
    onTaskPlay: (taskId: string) => Promise<void>;
    small?: boolean;
  }) => {
    const [playLoading, setPlayLoading] = useState(false);

    const debouncedTaskPlay = useMemo(
      () =>
        debounce(
          async (id: string) => {
            setPlayLoading(true);
            try {
              await onTaskPlay(id);
            } catch {
              // Do nothing
            } finally {
              setPlayLoading(false);
            }
          },
          500,
          { immediate: true }
        ),
      [onTaskPlay]
    );

    const handlePlayClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        debouncedTaskPlay(taskId);
      },
      [debouncedTaskPlay, taskId]
    );

    const iconSize = small ? 16 : 20;
    const buttonSize = small ? '20px' : Spacing.SpacingL;

    return (
      <ApTooltip content="Trigger task" placement="top">
        <ApIconButton
          data-testid={`stage-task-play-${taskId}`}
          onClick={handlePlayClick}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
          className="task-menu-icon-button"
          sx={{
            color: 'var(--uix-canvas-primary) !important',
            minWidth: 'unset !important',
            width: `${buttonSize} !important`,
            height: `${buttonSize} !important`,
            padding: '0 !important',
            ...(small && { marginRight: '-2px' }),
          }}
        >
          {playLoading ? (
            <ApCircularProgress size={iconSize} />
          ) : (
            <PlayIcon w={iconSize} h={iconSize} />
          )}
        </ApIconButton>
      </ApTooltip>
    );
  }
);

export interface TaskContentProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isDragging?: boolean;
  onTaskPlay?: (taskId: string) => Promise<void>;
}

export const TaskContent = memo(
  ({ task, taskExecution, isDragging, onTaskPlay }: TaskContentProps) => {
    const hasExecutionStatus = !!taskExecution?.status;
    const hasSecondRowContent =
      taskExecution &&
      (taskExecution.duration || taskExecution.retryDuration || taskExecution.badge);
    const showPlayButtonSmall = onTaskPlay && hasExecutionStatus;

    return (
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
            <Row align="center" gap={Spacing.SpacingXs} style={{ flexShrink: 0 }}>
              {hasExecutionStatus &&
                (taskExecution.message ? (
                  <ApTooltip content={taskExecution.message} placement="top">
                    <ApIconButton size="small">
                      <ExecutionStatusIcon status={taskExecution.status} />
                    </ApIconButton>
                  </ApTooltip>
                ) : (
                  <ExecutionStatusIcon status={taskExecution.status} />
                ))}
              {showPlayButtonSmall && !hasSecondRowContent && (
                <TaskPlayButton taskId={task.id} onTaskPlay={onTaskPlay} small />
              )}
              {onTaskPlay && !hasExecutionStatus && (
                <TaskPlayButton taskId={task.id} onTaskPlay={onTaskPlay} />
              )}
            </Row>
          </Row>
          {taskExecution && hasSecondRowContent && (
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
              <Row align="center" gap={Spacing.SpacingXs}>
                {taskExecution?.badge && (
                  <ApBadge
                    size={BadgeSize.SMALL}
                    status={taskExecution.badgeStatus as StatusTypes}
                    label={generateBadgeText(taskExecution) ?? ''}
                  />
                )}
                {showPlayButtonSmall && (
                  <TaskPlayButton taskId={task.id} onTaskPlay={onTaskPlay} small />
                )}
              </Row>
            </Row>
          )}
        </Column>
      </>
    );
  }
);
