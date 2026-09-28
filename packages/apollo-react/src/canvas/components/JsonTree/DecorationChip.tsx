import { cn } from '@uipath/apollo-wind';
import { CanvasTooltip } from '../CanvasTooltip';
import type { NodeDecoration, NodeDecorationTone } from './JsonTree.types';

const CHIP_TONE_TEXT_CLASS: Record<NodeDecorationTone, string> = {
  neutral: 'text-foreground-subtle',
  info: 'text-info',
  warning: 'text-warning',
  error: 'text-error',
};

const CHIP_TONE_BORDER_CLASS: Record<NodeDecorationTone, string> = {
  neutral: 'border-border',
  info: 'border-info/40',
  warning: 'border-warning/40',
  error: 'border-error/40',
};

export function DecorationChip({ decoration }: { decoration?: NodeDecoration }) {
  const chip = decoration?.chip;
  if (!chip || (chip.label == null && chip.icon == null)) return null;
  const tone = chip.tone ?? 'neutral';

  // A label gets the pill treatment; a bare icon renders unboxed.
  const content = chip.label ? (
    <span
      className={cn(
        'flex min-w-0 items-center gap-1 truncate rounded-full border px-1.5 py-px text-[10px] font-medium leading-none',
        CHIP_TONE_BORDER_CLASS[tone],
        CHIP_TONE_TEXT_CLASS[tone]
      )}
    >
      {chip.icon && <span className="shrink-0">{chip.icon}</span>}
      {chip.label}
    </span>
  ) : (
    <span
      className={cn('flex shrink-0 items-center', CHIP_TONE_TEXT_CLASS[tone])}
      // Only an element with an explicit role supports aria-label, so pair
      // them: a bare icon with a tooltip becomes a labelled `img`.
      {...(chip.tooltip ? { role: 'img' as const, 'aria-label': chip.tooltip } : {})}
    >
      {chip.icon}
    </span>
  );

  if (!chip.tooltip) return content;
  return (
    <CanvasTooltip placement="top" content={<span className="text-xs">{chip.tooltip}</span>}>
      {content}
    </CanvasTooltip>
  );
}
