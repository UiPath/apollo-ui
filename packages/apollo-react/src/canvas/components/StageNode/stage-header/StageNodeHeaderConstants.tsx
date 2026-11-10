import { Icon } from '@uipath/apollo-core';
import { Flag } from 'lucide-react';
import { ChecklistIcon } from '../../../../icons';
import { EntryConditionIcon, ExitConditionIcon, ReturnToOriginIcon } from '../../../icons';
import { StageChip } from '../StageNode.styles';
import type { StageSlaIcon } from '../StageNode.types';
import { StageHeaderChipType } from '../StageNode.types';

export const SLA_ICON_CONFIG: Record<StageSlaIcon, { icon: string; iconColor: string }> = {
  warning: {
    icon: 'triangle-alert',
    iconColor: 'var(--canvas-warning-icon)',
  },
  error: {
    icon: 'circle-alert',
    iconColor: 'var(--canvas-error-icon)',
  },
};

export const CHIP_ICONS: Record<StageHeaderChipType, React.ReactElement | null> = {
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
export const STATUS_BADGE_CONFIG: Partial<
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
