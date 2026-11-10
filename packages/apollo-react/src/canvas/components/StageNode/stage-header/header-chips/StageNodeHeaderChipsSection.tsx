import { memo } from 'react';
import { CanvasIcon } from '../../../../utils/icon-registry';
import { CanvasTooltip } from '../../../CanvasTooltip';
import { StageChip } from '../../StageNode.styles';
import type { StageHeaderChip, StageSlaIcon } from '../../StageNode.types';
import { useStageNodeLabels } from '../../useStageNodeLabels';
import { CHIP_ICONS, SLA_ICON_CONFIG, STATUS_BADGE_CONFIG } from '../StageNodeHeaderConstants';
import { StageNodeHeaderStatusBadge } from './StageNodeHeaderStatusBadge';

interface StageNodeHeaderChipsSectionInnerProps {
  id: string;
  headerChips?: StageHeaderChip[];
  slaText?: string;
  slaIcon?: StageSlaIcon;
}

const StageNodeHeaderChipsSectionInner = ({
  id,
  headerChips,
  slaText,
  slaIcon,
}: StageNodeHeaderChipsSectionInnerProps) => {
  const labels = useStageNodeLabels();
  const slaIndicator = slaIcon ? SLA_ICON_CONFIG[slaIcon] : undefined;

  if (!slaText && !headerChips?.length) {
    return null;
  }
  return (
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
      {headerChips && headerChips.length > 0 && (
        <div
          className="ml-auto flex flex-wrap items-center gap-x-1 gap-y-2"
          data-testid={`stage-header-chips-${id}`}
        >
          {headerChips.map((chip) => {
            const statusBadge = STATUS_BADGE_CONFIG[chip.type];
            if (statusBadge) {
              const variantStyle =
                chip.variant && chip.variant !== 'solid'
                  ? statusBadge.variants?.[chip.variant]
                  : undefined;
              return (
                <StageNodeHeaderStatusBadge
                  key={chip.type}
                  testId={`stage-${statusBadge.testId}-badge-${id}`}
                  className={variantStyle?.className ?? statusBadge.className}
                  hoverClassName={variantStyle?.hoverClassName ?? statusBadge.hoverClassName}
                  label={chip.label || labels[statusBadge.labelKey]}
                  tooltip={chip.tooltip}
                  onClick={chip.onClick}
                />
              );
            }

            const button = (
              <StageChip
                key={chip.type}
                data-testid={`stage-${chip.type}-chip-${id}`}
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
  );
};

export const StageNodeHeaderChipsSection = memo(StageNodeHeaderChipsSectionInner);
