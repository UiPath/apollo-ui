import { Padding, Spacing } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { Badge, Button, Spinner } from '@uipath/apollo-wind';
import debounce from 'debounce';
import { memo, useCallback, useMemo, useState } from 'react';
import { TimelinePlayIcon } from '../../icons';
import { CanvasTooltip } from '../CanvasTooltip';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import { StageTaskIcon, StageTaskRetryDuration } from './StageNode.styles';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';

const ProcessCanvasIcon = () => (
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

    const iconSize = small ? 18 : 22;
    const buttonSize = small ? '20px' : Spacing.SpacingL;

    return (
      <CanvasTooltip content="Trigger task" placement="top">
        <Button
          variant="ghost"
          size="icon"
          data-testid={`stage-task-play-${taskId}`}
          onClick={handlePlayClick}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
          className="task-menu-icon-button"
          style={{
            color: 'var(--canvas-icon-default)',
            minWidth: 'unset',
            width: buttonSize,
            height: buttonSize,
            padding: 0,
            ...(small && { marginRight: '-2px' }),
          }}
        >
          {playLoading ? (
            <Spinner size="sm" style={{ width: iconSize - 2, height: iconSize - 2 }} />
          ) : (
            <TimelinePlayIcon w={iconSize} h={iconSize} />
          )}
        </Button>
      </CanvasTooltip>
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
              <StageTaskIcon>{task.icon ?? <ProcessCanvasIcon />}</StageTaskIcon>
              <CanvasTooltip
                content={task.label}
                placement="top"
                smartTooltip
                {...(isDragging && { isOpen: false })}
              >
                <span className="text-sm truncate">{task.label}</span>
              </CanvasTooltip>
            </Row>
            <Row align="center" gap={Spacing.SpacingXs} style={{ flexShrink: 0 }}>
              {hasExecutionStatus &&
                (taskExecution.message ? (
                  <CanvasTooltip content={taskExecution.message} placement="top">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      aria-label={taskExecution.message}
                    >
                      <ExecutionStatusIcon status={taskExecution.status} />
                    </Button>
                  </CanvasTooltip>
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
                  <span className="text-xs text-foreground-muted">{taskExecution.duration}</span>
                )}
                {taskExecution?.retryDuration && (
                  <StageTaskRetryDuration status={taskExecution.badgeStatus ?? 'warning'}>
                    <span className="text-xs">{`(+${taskExecution.retryDuration})`}</span>
                  </StageTaskRetryDuration>
                )}
              </Row>
              <Row align="center" gap={Spacing.SpacingXs}>
                {taskExecution?.badge && (
                  <Badge variant={taskExecution.badgeStatus}>
                    {generateBadgeText(taskExecution) ?? ''}
                  </Badge>
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
