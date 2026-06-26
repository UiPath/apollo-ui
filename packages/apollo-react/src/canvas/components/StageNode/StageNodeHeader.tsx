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

const CHIP_ICONS: Record<StageHeaderChipType, React.ReactElement | null> = {
  [StageHeaderChipType.Entry]: <EntryConditionIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.Exit]: <ExitConditionIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.Completion]: <ChecklistIcon size={16} />,
  [StageHeaderChipType.ReturnToOrigin]: <ReturnToOriginIcon w={Icon.IconXs} h={Icon.IconXs} />,
  // Render as status pills (see STATUS_BADGE_CONFIG), never via CHIP_ICONS — listed for exhaustiveness.
  [StageHeaderChipType.Optional]: null,
  [StageHeaderChipType.EndsCase]: null,
};

/** Header-chip types that render as filled status pills (Optional / Ends case) instead of the icon-based {@link StageChip}. */
const STATUS_BADGE_CONFIG: Partial<
  Record<
    StageHeaderChipType,
    {
      className: string;
      hoverClassName: string;
      testId: string;
      labelKey: 'optionalBadge' | 'endsCaseBadge';
    }
  >
> = {
  [StageHeaderChipType.Optional]: {
    className: 'bg-background-secondary text-foreground-muted',
    hoverClassName: 'hover:bg-background-secondary/80',
    testId: 'optional',
    labelKey: 'optionalBadge',
  },
  [StageHeaderChipType.EndsCase]: {
    className: 'bg-error-icon text-foreground-inverse',
    hoverClassName: 'hover:bg-error-icon/80',
    testId: 'ends-case',
    labelKey: 'endsCaseBadge',
  },
};

const STATUS_BADGE_BASE_CLASS =
  'inline-flex h-6 items-center justify-center whitespace-nowrap rounded-[10px] border border-transparent px-2 text-xs font-normal';

/**
 * Filled status pill (e.g. "Optional", "Ends case"). Interactive when an `onClick` is supplied —
 * it then renders a focusable button with hover that navigates the consumer to the related control;
 * otherwise it renders a plain, non-interactive label.
 */
const StageStatusBadge = ({
  label,
  tooltip,
  className,
  hoverClassName,
  testId,
  onClick,
}: {
  label: string;
  tooltip?: React.ReactNode;
  className: string;
  hoverClassName: string;
  testId: string;
  onClick?: () => void;
}) => {
  const badge = onClick ? (
    <button
      type="button"
      data-testid={testId}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${STATUS_BADGE_BASE_CLASS} ${className} ${hoverClassName} cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2`}
    >
      {label}
    </button>
  ) : (
    <span data-testid={testId} className={`${STATUS_BADGE_BASE_CLASS} ${className}`}>
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
    onStatusClick,
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
                      hoverClassName={statusBadge.hoverClassName}
                      label={chip.label || labels[statusBadge.labelKey]}
                      tooltip={chip.tooltip}
                      onClick={chip.onClick}
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
