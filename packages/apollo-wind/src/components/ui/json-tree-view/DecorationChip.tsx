import { cn } from '@/lib';
import { JsonTreeTooltip } from './JsonTreeTooltip';
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
  const hasTooltip = chip.tooltip != null && chip.tooltip !== false && chip.tooltip !== '';
  const iconName = chip.ariaLabel ?? (typeof chip.tooltip === 'string' ? chip.tooltip : undefined);

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
      // them: a named bare icon becomes a labelled `img`.
      {...(iconName ? { role: 'img' as const, 'aria-label': iconName } : {})}
    >
      {chip.icon}
    </span>
  );

  if (!hasTooltip) return content;
  return (
    // A div, since rich content (lists and other blocks) can't sit in a span.
    <JsonTreeTooltip placement="top" content={<div className="text-xs">{chip.tooltip}</div>}>
      {content}
    </JsonTreeTooltip>
  );
}
