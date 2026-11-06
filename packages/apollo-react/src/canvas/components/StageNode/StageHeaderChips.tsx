import { Icon } from '@uipath/apollo-core';
import { cn } from '@uipath/apollo-wind';
import { Flag } from 'lucide-react';
import { memo } from 'react';
import { ChecklistIcon } from '../../../icons';
import { EntryConditionIcon, ExitConditionIcon, ReturnToOriginIcon } from '../../icons';
import { CanvasTooltip } from '../CanvasTooltip';
import { StageChip } from './StageNode.styles';
import type { StageHeaderChip } from './StageNode.types';
import { StageHeaderChipType } from './StageNode.types';
import { useStageNodeLabels } from './useStageNodeLabels';

const CHIP_ICONS: Record<StageHeaderChipType, React.ReactElement | null> = {
  [StageHeaderChipType.Entry]: <EntryConditionIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.Exit]: <ExitConditionIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.Completion]: <ChecklistIcon size={16} />,
  [StageHeaderChipType.ReturnToOrigin]: <ReturnToOriginIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.Milestone]: <Flag size={16} />,
  // Render as status pills (see STATUS_BADGE_CONFIG), never via CHIP_ICONS — listed for exhaustiveness.
  [StageHeaderChipType.Optional]: null,
  [StageHeaderChipType.EndsCase]: null,
};

/** Header-chip types that render as status pills (Optional / Ends case) instead of the icon-based {@link StageChip}. */
const STATUS_BADGE_CONFIG: Partial<
  Record<
    StageHeaderChipType,
    {
      className: string;
      hoverClassName: string;
      variants?: Partial<
        Record<'outline' | 'success', { className: string; hoverClassName: string }>
      >;
      testId: string;
      labelKey: 'optionalBadge' | 'endsCaseBadge';
    }
  >
> = {
  [StageHeaderChipType.Optional]: {
    className: 'border-transparent bg-background-secondary text-foreground-muted',
    hoverClassName: 'hover:bg-background-secondary/80',
    testId: 'optional',
    labelKey: 'optionalBadge',
  },
  [StageHeaderChipType.EndsCase]: {
    className: 'border-transparent bg-error-icon text-foreground-inverse',
    hoverClassName: 'hover:bg-error-icon/80',
    variants: {
      outline: {
        className: 'border-border bg-transparent text-foreground-muted',
        hoverClassName: 'hover:bg-surface-overlay',
      },
      success: {
        className: 'border-transparent bg-success-icon text-foreground-inverse',
        hoverClassName: 'hover:bg-success-icon/80',
      },
    },
    testId: 'ends-case',
    labelKey: 'endsCaseBadge',
  },
};

const STATUS_BADGE_BASE_CLASS =
  'inline-flex h-6 items-center justify-center whitespace-nowrap rounded-[10px] border px-2 text-xs font-normal';

/**
 * Status pill (e.g. "Optional", "Ends case"). Interactive when an `onClick` is supplied —
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

export interface StageHeaderChipsProps {
  /** Suffix of each chip's test id, such as the stage id. */
  id: string;
  chips: StageHeaderChip[];
  className?: string;
}

/** A stage header's rule, milestone and status chips, also usable on their own (e.g. a case header). */
const StageHeaderChipsInner = ({ id, chips, className }: StageHeaderChipsProps) => {
  const labels = useStageNodeLabels();

  if (chips.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-1 gap-y-2', className)}
      data-testid={`stage-header-chips-${id}`}
    >
      {chips.map((chip) => {
        const statusBadge = STATUS_BADGE_CONFIG[chip.type];
        if (statusBadge) {
          const variantStyle =
            chip.variant && chip.variant !== 'solid'
              ? statusBadge.variants?.[chip.variant]
              : undefined;
          return (
            <StageStatusBadge
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
  );
};

export const StageHeaderChips = memo(StageHeaderChipsInner);
