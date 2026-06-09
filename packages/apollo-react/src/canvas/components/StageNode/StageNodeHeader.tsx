import { Icon, Padding, Spacing } from '@uipath/apollo-core';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { Button } from '@uipath/apollo-wind';
import { memo } from 'react';
import { ChecklistIcon } from '../../../icons';
import { EntryConditionIcon, ExitConditionIcon, ReturnToOriginIcon } from '../../icons';
import { CanvasIcon } from '../../utils/icon-registry';
import { CanvasTooltip } from '../CanvasTooltip';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import { getExecutionStatusColor } from '../ExecutionStatusIcon/ExecutionStatusIcon';
import { StageChip, StageHeader } from './StageNode.styles';
import type { StageNodeProps, StageSlaIcon, StageStatus } from './StageNode.types';
import { StageHeaderChipType } from './StageNode.types';
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

const CHIP_ICONS: Partial<Record<StageHeaderChipType, React.ReactElement>> = {
  [StageHeaderChipType.Entry]: <EntryConditionIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.Exit]: <ExitConditionIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.Completion]: <ChecklistIcon size={16} />,
  [StageHeaderChipType.ReturnToOrigin]: <ReturnToOriginIcon w={Icon.IconXs} h={Icon.IconXs} />,
};

/** Header-chip types that render as non-interactive status pills instead of the interactive {@link StageChip}. */
const STATUS_BADGE_CONFIG: Partial<
  Record<
    StageHeaderChipType,
    { className: string; testId: string; labelKey: 'optionalBadge' | 'endsCaseBadge' }
  >
> = {
  [StageHeaderChipType.Optional]: {
    className: 'bg-background-secondary text-foreground-muted',
    testId: 'optional',
    labelKey: 'optionalBadge',
  },
  [StageHeaderChipType.EndsCase]: {
    className: 'bg-error-icon text-foreground-inverse',
    testId: 'ends-case',
    labelKey: 'endsCaseBadge',
  },
};

/** Non-interactive status pill (no count/click); focusable only when a tooltip is supplied so it's reachable via keyboard. */
const StageStatusBadge = ({
  label,
  tooltip,
  className,
  testId,
}: {
  label: string;
  tooltip?: React.ReactNode;
  className: string;
  testId: string;
}) => {
  const badge = (
    <span
      data-testid={testId}
      tabIndex={tooltip ? 0 : undefined}
      className={`inline-flex h-6 items-center justify-center whitespace-nowrap rounded-[10px] border border-transparent px-2 text-xs font-normal ${className}`}
    >
      {label}
    </span>
  );

  if (tooltip) {
    return (
      <CanvasTooltip placement="bottom" content={tooltip}>
        {badge}
      </CanvasTooltip>
    );
  }
  return badge;
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
  const getStatusName = useExecutionStatusLabel();
  const {
    id,
    stageDetails,
    execution,
    onTaskAdd,
    onAddTaskFromToolbox,
    onStageTitleChange,
    loadingTaskIds,
  } = props;

  const isAddTaskDisabled = (loadingTaskIds?.size ?? 0) > 0;

  const icon = stageDetails?.icon;
  const statusLabel = execution?.stageStatus?.label;
  const stageDuration = execution?.stageStatus?.duration;
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
              <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={statusTooltip}>
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
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
              {stageDetails.headerChips.map((chip) => {
                const statusBadge = STATUS_BADGE_CONFIG[chip.type];
                if (statusBadge) {
                  return (
                    <StageStatusBadge
                      key={chip.type}
                      testId={`stage-${statusBadge.testId}-badge-${id}`}
                      className={statusBadge.className}
                      label={chip.label || labels[statusBadge.labelKey]}
                      tooltip={chip.tooltip}
                    />
                  );
                }

                const button = (
                  <StageChip
                    key={chip.type}
                    type="button"
                    aria-label={typeof chip.tooltip === 'string' ? chip.tooltip : chip.type}
                    onClick={(e) => {
                      e.stopPropagation();
                      chip.onClick?.();
                    }}
                  >
                    {CHIP_ICONS[chip.type]}
                    {chip.count !== undefined && <span className="text-xs">{chip.count}</span>}
                  </StageChip>
                );
                if (chip.tooltip) {
                  return (
                    <CanvasTooltip key={chip.type} placement="bottom" content={chip.tooltip}>
                      {button}
                    </CanvasTooltip>
                  );
                }
                return button;
              })}
            </div>
          )}
        </div>
      )}
      {stageDuration && (
        <span className="flex min-h-8 items-center text-xs text-foreground-muted">
          {stageDuration}
        </span>
      )}
    </StageHeader>
  );
};

export const StageNodeHeader = memo(StageNodeHeaderInner);
