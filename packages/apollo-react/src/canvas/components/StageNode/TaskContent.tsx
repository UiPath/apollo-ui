import { Spacing } from '@uipath/apollo-core';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Badge, Button, Spinner } from '@uipath/apollo-wind';
import debounce from 'debounce';
import { CirclePlay, Redo2, RotateCcw } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasTooltip } from '../CanvasTooltip';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import { StageTaskIcon } from './StageNode.styles';
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
  ({ taskId, onTaskPlay }: { taskId: string; onTaskPlay: (taskId: string) => Promise<void> }) => {
    const [playLoading, setPlayLoading] = useState(false);
    const { _ } = useSafeLingui();
    const triggerTaskLabel = _({ id: 'stage-node.trigger-task', message: 'Trigger task' });

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
      <CanvasTooltip content={triggerTaskLabel} placement="top">
        <Button
          variant="ghost"
          size="icon"
          data-testid={`stage-task-play-${taskId}`}
          onClick={handlePlayClick}
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
          aria-label={triggerTaskLabel}
          className="task-menu-icon-button h-4 w-4 rounded-sm"
          style={{
            color: 'var(--canvas-icon-default)',
            minWidth: 'unset',
            padding: 0,
          }}
        >
          {playLoading ? <Spinner size="sm" /> : <CirclePlay />}
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
    // Runs and rework collapse to two compact amber icon-chips (per design): a "runs" chip
    // (↱ + total-run count) driven by retryCount, and a "rework" chip (↺) driven by the
    // rework duration. The localised phrasing lives in each chip's tooltip so the row stays
    // on one line and still reads for screen readers. retryCount is the number of re-runs, so
    // the total-run count shown is retryCount + 1.
    const retries = taskExecution?.retryCount ?? 0;
    const hasRuns = retries > 0;
    const totalRuns = retries + 1;
    const runsTooltip =
      taskExecution?.status === 'InProgress'
        ? _({ id: 'stage-node.task-badge.running-again', message: 'Running again' })
        : _({
            id: 'stage-node.task-badge.ran-n-times',
            message: '{count, plural, one {Ran # time} other {Ran # times}}',
            values: { count: totalRuns },
          });
    const hasRework = !!taskExecution?.retryDuration;
    const reworkTooltip = _({
      id: 'stage-node.task-badge.rework-time',
      message: 'Reworked (+{duration})',
      values: { duration: taskExecution?.retryDuration ?? '' },
    });
    const taskStatusFallbackName = hasExecutionStatus ? getStatusName(taskExecution?.status) : '';
    const taskStatusTooltip = taskExecution?.message || taskStatusFallbackName;
    // Ad hoc tasks are by definition not required, so never show the "*" marker on them.
    const showRequiredMarker = task.isRequired && !task.isAdhoc && task.taskGroupType !== 'adhoc';
    const durationLabel = taskExecution?.duration ? (
      <span className="text-xs text-foreground-muted">{taskExecution.duration}</span>
    ) : null;

    return (
      <Row
        flex={1}
        align="center"
        justify="space-between"
        gap={Spacing.SpacingXs}
        style={{ overflow: 'hidden' }}
      >
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
              gap={'2px'}
              align="center"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <span className="text-sm truncate" style={{ minWidth: 0 }}>
                {task.label}
              </span>
              {showRequiredMarker && (
                <span className="text-sm" style={{ flexShrink: 0 }}>
                  {'*'}
                </span>
              )}
            </Row>
          </CanvasTooltip>
        </Row>
        <Row align="center" gap={Spacing.SpacingXs} style={{ flexShrink: 0 }}>
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
          {hasRuns && (
            <CanvasTooltip content={runsTooltip} placement="top" hide={isDragging}>
              <Badge
                variant="warning"
                className="h-[14px] gap-px rounded-full px-1 py-0 text-[11px] leading-none [&>svg]:size-3"
              >
                <Redo2 aria-hidden />
                {totalRuns}
              </Badge>
            </CanvasTooltip>
          )}
          {hasRework && (
            <CanvasTooltip content={reworkTooltip} placement="top" hide={isDragging}>
              <Badge
                variant="warning"
                aria-label={reworkTooltip}
                className="h-[14px] rounded-full px-1 py-0 [&>svg]:size-3"
              >
                <RotateCcw aria-hidden />
              </Badge>
            </CanvasTooltip>
          )}
          <StageTaskEntryConditionIcon task={task} />
          {hasExecutionStatus && (
            <CanvasTooltip content={taskStatusTooltip} placement="top">
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-sm"
                aria-label={taskStatusTooltip}
              >
                <ExecutionStatusIcon status={taskExecution.status} />
              </Button>
            </CanvasTooltip>
          )}
          {onTaskPlay && <TaskPlayButton taskId={task.id} onTaskPlay={onTaskPlay} />}
        </Row>
      </Row>
    );
  }
);
