import { Padding, Spacing } from '@uipath/apollo-core';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Button } from '@uipath/apollo-wind';
import { memo } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasIcon } from '../../utils/icon-registry';
import { CanvasTooltip } from '../CanvasTooltip';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import { getExecutionStatusColor } from '../ExecutionStatusIcon/ExecutionStatusIcon';
import { formatDurationMs, formatExactDurationMs, hasHiddenDurationParts } from './formatDuration';
import { StageHeaderChips } from './StageHeaderChips';
import { StageHeader } from './StageNode.styles';
import type { StageNodeProps, StageSlaIcon, StageStatus } from './StageNode.types';
import { StageTitleInput } from './StageTitleInput';
import { useExecutionStatusLabel } from './useExecutionStatusLabel';
import { useStageNodeLabels } from './useStageNodeLabels';

const SLA_ICON_CONFIG: Record<StageSlaIcon, { icon: string; iconColor: string }> = {
  warning: {
    icon: 'triangle-alert',
    iconColor: 'var(--canvas-warning-icon)',
  },
  error: {
    icon: 'circle-alert',
    iconColor: 'var(--canvas-error-icon)',
  },
};

const StageNodeHeaderInner = ({
  props,
  isReadOnly,
  isException,
  status,
  handleTaskAddClick,
}: {
  props: StageNodeProps;
  isReadOnly: boolean;
  isException?: boolean;
  status?: StageStatus;
  handleTaskAddClick: (event: React.MouseEvent) => void;
}) => {
  const labels = useStageNodeLabels();
  const { locale } = useSafeLingui();
  const getStatusName = useExecutionStatusLabel();
  const {
    id,
    stageDetails,
    execution,
    onStatusClick,
    onTaskAdd,
    onAddTaskFromToolbox,
    onStageTitleChange,
    loadingTaskIds,
  } = props;

  const isAddTaskDisabled = (loadingTaskIds?.size ?? 0) > 0;

  const icon = stageDetails?.icon;
  const statusLabel = execution?.stageStatus?.label;
  // `durationMs` wins: only the number can be shortened to its largest units. A legacy
  // pre-formatted string is rendered as the consumer supplied it.
  const stageDurationMs = execution?.stageStatus?.durationMs;
  const formattedStageDuration =
    stageDurationMs !== undefined
      ? formatDurationMs(stageDurationMs, locale)
      : execution?.stageStatus?.duration;
  // The label is the consumer's word, already localised — Apollo only decides that it sits in front
  // of the value. Joined with a plain space so the label carries its own punctuation ("Duration:").
  const stageDurationLabel = execution?.stageStatus?.durationLabel;
  const stageDuration =
    formattedStageDuration && stageDurationLabel
      ? `${stageDurationLabel} ${formattedStageDuration}`
      : formattedStageDuration;
  const exactStageDuration =
    stageDurationMs !== undefined && hasHiddenDurationParts(stageDurationMs)
      ? formatExactDurationMs(stageDurationMs, locale)
      : undefined;
  const slaText = execution?.stageStatus?.slaText;
  const slaIcon = execution?.stageStatus?.slaIcon;
  const slaIndicator = slaIcon ? SLA_ICON_CONFIG[slaIcon] : undefined;
  const statusFallbackName = status ? getStatusName(status) : '';
  const statusTooltip = statusLabel || statusFallbackName;

  return (
    <StageHeader isException={isException} data-testid={`stage-header-${id}`}>
      <div className="flex items-start justify-between gap-1">
        <Row gap={Spacing.SpacingMicro} align="center" flex={1} minW={0}>
          {icon}
          <StageTitleInput
            stageId={id}
            label={stageDetails.label}
            onChange={isReadOnly ? undefined : onStageTitleChange}
            className="flex-1 min-w-0"
          />
        </Row>
        <Row gap={Spacing.SpacingMicro} align="start" py={Padding.PadS}>
          {status && (
            <CanvasTooltip content={statusTooltip} placement="top">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label={statusTooltip}
                data-testid={`stage-status-${id}`}
                onClick={
                  onStatusClick
                    ? (e) => {
                        e.stopPropagation();
                        onStatusClick();
                      }
                    : undefined
                }
              >
                {status === 'NotExecuted' ? (
                  <CanvasIcon
                    icon="hourglass"
                    size={20}
                    color={getExecutionStatusColor('NotExecuted')}
                  />
                ) : (
                  <ExecutionStatusIcon status={status} size={20} />
                )}
              </Button>
            </CanvasTooltip>
          )}
          {(onTaskAdd || onAddTaskFromToolbox) && !isReadOnly && (
            <CanvasTooltip content={labels.addTask} placement="top">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleTaskAddClick}
                aria-label={labels.addTask}
                disabled={isAddTaskDisabled}
                data-testid={`add-task-button-${id}`}
              >
                <CanvasIcon icon="plus" size={20} />
              </Button>
            </CanvasTooltip>
          )}
        </Row>
      </div>
      {(slaText || (stageDetails.headerChips && stageDetails.headerChips.length > 0)) && (
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-2 gap-y-2">
          {slaText && (
            <span
              className="inline-flex items-center gap-1 text-xs text-foreground-muted"
              data-testid={`stage-sla-${id}`}
              data-sla-icon={slaIcon}
            >
              {slaIndicator && (
                <CanvasIcon icon={slaIndicator.icon} size={16} color={slaIndicator.iconColor} />
              )}
              {slaText}
            </span>
          )}
          {stageDetails.headerChips && stageDetails.headerChips.length > 0 && (
            <StageHeaderChips id={id} chips={stageDetails.headerChips} className="ml-auto" />
          )}
        </div>
      )}
      {stageDuration && (
        <CanvasTooltip content={exactStageDuration} placement="top">
          <span
            className="flex min-h-8 items-center text-xs text-foreground-muted"
            data-testid={`stage-duration-${id}`}
          >
            {stageDuration}
          </span>
        </CanvasTooltip>
      )}
    </StageHeader>
  );
};

export const StageNodeHeader = memo(StageNodeHeaderInner);
