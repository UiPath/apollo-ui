import { Padding, Spacing } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { Badge, Button, Spinner } from '@uipath/apollo-wind';
import debounce from 'debounce';
import { memo, useCallback, useMemo, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { TimelinePlayIcon } from '../../icons';
import { CanvasTooltip } from '../CanvasTooltip';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import { StageTaskIcon, StageTaskRetryDuration } from './StageNode.styles';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';
import { StageTaskEntryConditionIcon } from './StageTaskEntryConditionIcon';
import { useExecutionStatusLabel } from './useExecutionStatusLabel';

const ProcessCanvasIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

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

    return (
      <CanvasTooltip content="Trigger task" placement="top">
        <Button
          variant="ghost"
          size="icon"
          data-testid={`stage-task-play-${taskId}`}
          onClick={handlePlayClick}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
          aria-label="Trigger task"
          className={
            small
              ? 'task-menu-icon-button h-4 w-4 [&_svg]:size-3.5'
              : 'task-menu-icon-button h-4 w-4'
          }
          style={{
            color: 'var(--canvas-icon-default)',
            minWidth: 'unset',
            padding: 0,
          }}
        >
          {playLoading ? (
            <Spinner size="sm" />
          ) : (
            <TimelinePlayIcon />
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
    const { _ } = useSafeLingui();
    const getStatusName = useExecutionStatusLabel();
    const hasExecutionStatus = !!taskExecution?.status;
    const badgeText = useMemo(() => {
      if (!taskExecution?.badge) {
        return undefined;
      }
      if (taskExecution.retryCount && taskExecution.retryCount > 1) {
        if (taskExecution.status === 'InProgress') {
          return _({
            id: 'stage-node.task-badge.running-again',
            message: 'Running again',
          });
        }
        return _({
          id: 'stage-node.task-badge.ran-n-times',
          message: '{count, plural, one {Ran # time} other {Ran # times}}',
          values: { count: taskExecution.retryCount },
        });
      }
      return taskExecution.badge;
    }, [taskExecution?.badge, taskExecution?.retryCount, taskExecution?.status, _]);
    const hasSecondRowContent =
      taskExecution && (taskExecution.duration || taskExecution.retryDuration || badgeText);
    const showReplayButton = onTaskPlay && hasExecutionStatus;
    const taskStatusFallbackName = hasExecutionStatus ? getStatusName(taskExecution?.status) : '';
    const taskStatusTooltip = taskExecution?.message || taskStatusFallbackName;
    const durationLabel = useMemo(
      () =>
        taskExecution?.duration ? (
          <span className="text-xs text-foreground-muted">{taskExecution.duration}</span>
        ) : null,
      [taskExecution?.duration]
    );

    return (
      <Column
        flex={1}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        gap={Padding.PadXs}
      >
        <Row align="center" justify="space-between" gap={Spacing.SpacingXs}>
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
              <Row
                gap={Spacing.SpacingXs}
                align="center"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                <span className="text-sm truncate">{task.label}</span>
                {task.isRequired && (
                  <span className="text-sm" style={{ flexShrink: 0 }}>
                    {'*'}
                  </span>
                )}
              </Row>
            </CanvasTooltip>
          </Row>
          <Row align="center" gap={Spacing.SpacingXs} style={{ flexShrink: 0 }}>
            {hasExecutionStatus && (
              <CanvasTooltip content={taskStatusTooltip} placement="top">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  aria-label={taskStatusTooltip}
                >
                  <ExecutionStatusIcon status={taskExecution.status} />
                </Button>
              </CanvasTooltip>
            )}
            {!hasSecondRowContent && <StageTaskEntryConditionIcon task={task} />}
            {showReplayButton && !hasSecondRowContent && (
              <TaskPlayButton taskId={task.id} onTaskPlay={onTaskPlay} />
            )}
            {onTaskPlay && !hasExecutionStatus && (
              <TaskPlayButton taskId={task.id} onTaskPlay={onTaskPlay} />
            )}
          </Row>
        </Row>
        {taskExecution && hasSecondRowContent && (
          <Row align="center" justify="space-between">
            <Row gap={'2px'}>
              {durationLabel &&
                (taskExecution?.durationTooltip ? (
                  <CanvasTooltip
                    content={taskExecution.durationTooltip}
                    placement="top"
                    hide={isDragging}
                  >
                    {durationLabel}
                  </CanvasTooltip>
                ) : (
                  durationLabel
                ))}
              {taskExecution?.retryDuration && (
                <StageTaskRetryDuration status={taskExecution.badgeStatus ?? 'warning'}>
                  <span className="text-xs">{`(+${taskExecution.retryDuration})`}</span>
                </StageTaskRetryDuration>
              )}
            </Row>
            <Row align="center" gap={Spacing.SpacingXs}>
              {badgeText && <Badge variant={taskExecution.badgeStatus}>{badgeText}</Badge>}
              <StageTaskEntryConditionIcon task={task} small />
              {showReplayButton && (
                <TaskPlayButton taskId={task.id} onTaskPlay={onTaskPlay} small />
              )}
            </Row>
          </Row>
        )}
      </Column>
    );
  }
);
