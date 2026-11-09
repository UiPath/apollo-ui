import { cn } from '@uipath/apollo-wind';
import { CELL_MARK_CLASS, ROW_MARK_OVERLAY_CLASS } from './gridStyles';
import type { MarkTone } from './marks';

export const DECISION_TEXT_FRAME_CLASS = cn(
  'relative min-h-0 flex-1 overflow-auto bg-background-secondary future:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
  '[--sentence-output-hue:var(--color-purple-600)] dark:[--sentence-output-hue:var(--color-purple-300)]'
);

export const DECISION_TEXT_HEADER_CLASS =
  'sticky top-0 z-2 flex flex-wrap items-baseline gap-x-2 border-b border-b-border-de-emp bg-background px-4 py-2 text-xs leading-4 text-foreground-de-emp';

export const HEADER_LABEL_CLASS = 'font-semibold';

const GUTTER_CLASS = 'pe-8 ps-[max(2rem,calc(var(--sentence-number-digits,0)*1ch+1.25rem))]';

export const DECISION_TEXT_BANDS_CLASS = cn(
  'grid grid-cols-[minmax(4rem,auto)_minmax(0,1fr)] items-start gap-2 pt-3 pb-6',
  GUTTER_CLASS
);

export const BAND_CAPTION_CLASS =
  'pt-1 text-[10px] leading-4 font-bold tracking-wider whitespace-nowrap text-foreground-de-emp uppercase';

export const BAND_COLUMNS_CLASS =
  'flex min-h-6 min-w-0 items-start gap-1.5 overflow-x-auto whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden';

export const MARKED_CHIP_CLASS = cn(CELL_MARK_CLASS, 'forced-colors:data-[tone]:outline-1');

export const BAND_COLUMN_CLASS = cn(
  'inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-border-de-emp bg-background px-2 text-xs leading-4 font-medium text-foreground',
  MARKED_CHIP_CLASS
);

export const EMPTY_STATE_FRAME_CLASS = GUTTER_CLASS;

export const EMPTY_STATE_CLASS = 'rounded-lg border border-dashed border-border bg-background p-8';

export const DECISION_TEXT_LIST_CLASS = GUTTER_CLASS;

export const RULE_CARD_CLASS = 'group/row pb-[var(--sentence-row-gap)]';

/** The card border's colour for each grid tone. */
const CARD_TONE_CLASS = {
  success: 'group-data-[tone=success]/row:border-success',
  error: 'group-data-[tone=error]/row:border-error',
  warning: 'group-data-[tone=warning]/row:border-warning',
} satisfies Record<MarkTone, string>;

export const ROW_SURFACE_CLASS = cn(
  'relative flex flex-col rounded-lg border-[length:var(--sentence-row-border)] border-border-de-emp bg-background px-3 py-[var(--sentence-row-padding)] text-sm leading-[var(--sentence-line)] text-foreground shadow-sm not-group-data-[tone]/row:hover:border-border',
  ROW_MARK_OVERLAY_CLASS,
  Object.values(CARD_TONE_CLASS),
  'forced-colors:group-data-[tone]/row:border-s-4',
  'group-data-[dim=true]/row:text-foreground-de-emp'
);

export const ROW_NUMBER_CLASS =
  'absolute end-[calc(100%+4px)] top-[9px] flex h-[22px] min-w-5 items-center justify-center rounded-md border border-border-de-emp bg-background px-1 text-xs leading-5 whitespace-nowrap text-foreground-de-emp tabular-nums shadow-sm';

export const LINE_CLASS = 'flex h-[var(--sentence-line)] items-center gap-2';

export const LINES_CLASS = 'mt-[var(--sentence-lines-gap)]';

export const LINE_FILL_CLASS = 'flex-1';

export const LINE_TEXT_CLASS = 'min-w-0 truncate';

export const CLAMPED_LINE_CLASS = 'flex items-center gap-2';

export const HEADING_TEXT_CLASS = cn(LINE_TEXT_CLASS, 'self-baseline py-[2px] leading-[20px]');

const MUTED_TEXT_CLASS =
  'text-foreground-de-emp group-data-[tone]/row:text-[color-mix(in_srgb,var(--color-foreground-de-emp)_80%,var(--color-foreground))]';

export const MORE_VALUES_CLASS = cn('shrink-0 font-medium whitespace-nowrap', MUTED_TEXT_CLASS);

export const LINE_BULLET_CLASS =
  'size-1 shrink-0 rounded-full bg-foreground-disable forced-colors:bg-[CanvasText]';

export const WORD_CLASS = MUTED_TEXT_CLASS;

export const TOKEN_KIND_CLASS = {
  input:
    'font-medium text-info-text group-data-[tone]/row:text-[color-mix(in_srgb,var(--color-info-text)_80%,var(--color-foreground))]',
  output: 'font-medium text-[var(--sentence-output-hue)]',
  value: 'rounded font-medium text-foreground not-data-[tone]:hover:bg-background-hover',
} as const;

export const OUTPUT_VALUE_CLASS =
  'inline-flex items-center rounded-md border border-[color-mix(in_srgb,var(--sentence-output-hue)_35%,transparent)] bg-[color-mix(in_srgb,var(--sentence-output-hue)_8%,var(--color-background))] px-1.5 text-sm leading-[20px] font-medium text-[var(--sentence-output-hue)] hover:border-[var(--sentence-output-hue)]';

export const EMPTY_OUTPUT_VALUE_CLASS = 'italic text-foreground-de-emp';

export const LINE_MARK_CLASS = 'inline-flex shrink-0 items-center';

export const MARK_GLYPH_CLASS = 'size-3.5 forced-colors:text-[CanvasText]';
