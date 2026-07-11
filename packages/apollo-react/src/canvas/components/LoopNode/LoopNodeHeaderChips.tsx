import { Icon } from '@uipath/apollo-core';
import { cn } from '@uipath/apollo-wind';
import { memo } from 'react';
import { useSafeLingui } from '../../../i18n';
import { ChecklistIcon } from '../../../icons';
import { EntryConditionIcon, ExitConditionIcon, ReturnToOriginIcon } from '../../icons';
import { CanvasTooltip } from '../CanvasTooltip';
import type { StageHeaderChip } from '../StageNode/StageNode.types';
import { StageHeaderChipType } from '../StageNode/StageNode.types';

/**
 * Rule chips rendered in the LoopNode header. Reuses the StageNode chip model
 * (`StageHeaderChip` / `StageHeaderChipType`) so stage-style consumers (e.g. the
 * case-management "stage" flavor of the loop container) surface entry / complete /
 * exit rule summaries with the exact taxonomy the legacy StageNode uses, but with
 * Tailwind styling that matches the LoopNode pill idiom.
 */
export type LoopNodeHeaderChip = StageHeaderChip;

const CHIP_ICONS: Partial<Record<StageHeaderChipType, React.ReactElement>> = {
  [StageHeaderChipType.Entry]: <EntryConditionIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.Exit]: <ExitConditionIcon w={Icon.IconXs} h={Icon.IconXs} />,
  [StageHeaderChipType.Completion]: <ChecklistIcon size={16} />,
  [StageHeaderChipType.ReturnToOrigin]: <ReturnToOriginIcon w={Icon.IconXs} h={Icon.IconXs} />,
};

/** Chip types rendered as filled status pills with a text label instead of an icon chip. */
const STATUS_PILL_CLASSES: Partial<Record<StageHeaderChipType, string>> = {
  [StageHeaderChipType.Optional]: 'bg-background-secondary text-foreground-muted',
  [StageHeaderChipType.EndsCase]: 'bg-error-icon text-foreground-inverse',
};

const ICON_CHIP_BASE_CLASS =
  'flex h-6 items-center gap-1 rounded-full border border-border bg-surface px-2 text-[11px] font-semibold leading-4 text-foreground shadow-sm';
const STATUS_PILL_BASE_CLASS =
  'inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full border border-transparent px-2.5 text-[11px] font-semibold leading-4';
const INTERACTIVE_CLASS =
  'nodrag nopan cursor-pointer transition-colors hover:border-border-hover focus-visible:outline-2 focus-visible:outline-offset-2';

function useDefaultChipLabel(type: StageHeaderChipType): string | undefined {
  const { _ } = useSafeLingui();
  switch (type) {
    case StageHeaderChipType.Optional:
      return _({ id: 'loop-node.chip.optional', message: 'Optional' });
    case StageHeaderChipType.EndsCase:
      return _({ id: 'loop-node.chip.ends-case', message: 'Ends case' });
    default:
      return undefined;
  }
}

function HeaderChip({ chip }: { chip: LoopNodeHeaderChip }) {
  const defaultLabel = useDefaultChipLabel(chip.type);
  const statusPillClass = STATUS_PILL_CLASSES[chip.type];
  const icon = CHIP_ICONS[chip.type];
  const label = chip.label ?? defaultLabel;
  const isStatusPill = !!statusPillClass;
  const testId = `loop-header-chip-${chip.type}`;
  const ariaLabel =
    (typeof chip.tooltip === 'string' ? chip.tooltip : undefined) ?? label ?? chip.type;

  const content = (
    <>
      {!isStatusPill && icon ? (
        <span className="flex shrink-0" aria-hidden>
          {icon}
        </span>
      ) : null}
      {isStatusPill ? label : null}
      {chip.count !== undefined ? <span className="text-xs">{chip.count}</span> : null}
    </>
  );

  const className = cn(
    isStatusPill ? STATUS_PILL_BASE_CLASS : ICON_CHIP_BASE_CLASS,
    statusPillClass,
    chip.onClick && INTERACTIVE_CLASS
  );

  const rendered = chip.onClick ? (
    <button
      type="button"
      data-testid={testId}
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        chip.onClick?.();
      }}
    >
      {content}
    </button>
  ) : (
    <span data-testid={testId} role="img" aria-label={ariaLabel} className={className}>
      {content}
    </span>
  );

  if (chip.tooltip) {
    return (
      <CanvasTooltip placement="bottom" content={chip.tooltip}>
        {rendered}
      </CanvasTooltip>
    );
  }
  return rendered;
}

export const LoopNodeHeaderChips = memo(function LoopNodeHeaderChips({
  chips,
}: {
  chips: LoopNodeHeaderChip[];
}) {
  if (chips.length === 0) return null;

  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1"
      data-testid="loop-header-chips"
    >
      {chips.map((chip) => (
        <HeaderChip key={chip.type} chip={chip} />
      ))}
    </div>
  );
});
