import { cn } from '@uipath/apollo-wind';
import { CELL_MARK_CLASS, ROW_MARK_OVERLAY_CLASS } from './gridStyles';
import type { MarkTone } from './marks';

export const SENTENCES_FRAME_CLASS = cn(
  'relative min-h-0 flex-1 overflow-auto bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
  '[--sentence-output-hue:var(--color-purple-600)] dark:[--sentence-output-hue:var(--color-purple-300)]'
);

export const SENTENCES_HEADER_CLASS =
  'sticky top-0 z-2 flex flex-wrap items-baseline gap-x-2 border-b border-b-border-de-emp bg-background px-4 py-2 text-xs leading-4 text-foreground-de-emp';

export const HEADER_LABEL_CLASS = 'font-semibold';

export const SENTENCES_BANDS_CLASS =
  'grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-2 px-4 pt-3 pb-3';

export const BAND_CAPTION_CLASS =
  'text-[10px] leading-4 font-bold tracking-wider whitespace-nowrap text-foreground-de-emp uppercase';

export const BAND_COLUMNS_CLASS =
  'flex min-h-6 min-w-0 items-start gap-1.5 overflow-x-auto whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden';

export const MARKED_CHIP_CLASS = cn(CELL_MARK_CLASS, 'forced-colors:data-[tone]:outline-1');

export const BAND_COLUMN_CLASS = cn(
  'inline-flex shrink-0 items-center gap-1 rounded px-1 text-xs leading-6 font-medium text-foreground',
  MARKED_CHIP_CLASS
);

export const EMPTY_STATE_CLASS =
  'flex flex-col items-start gap-2 px-4 py-6 text-sm text-foreground-de-emp';

export const SENTENCES_LIST_CLASS =
  'pe-4 ps-[max(2.25rem,calc(var(--sentence-number-digits,0)*1ch+1.25rem))]';

export const ROW_CARD_CLASS = 'group/row pb-[var(--sentence-row-gap)]';

/** The row rail's colour for each grid tone; a tone added to `MarkTone` fails to compile here until it has one. */
const RAIL_TONE_CLASS = {
  success: 'group-data-[tone=success]/row:border-s-success',
  error: 'group-data-[tone=error]/row:border-s-error',
  warning: 'group-data-[tone=warning]/row:border-s-warning',
} satisfies Record<MarkTone, string>;

export const ROW_SURFACE_CLASS = cn(
  'relative flex flex-col border-s-2 border-s-border-de-emp py-[var(--sentence-row-padding)] ps-2.5 text-sm leading-[var(--sentence-line)] text-foreground',
  ROW_MARK_OVERLAY_CLASS,
  Object.values(RAIL_TONE_CLASS),
  'forced-colors:group-data-[tone]/row:border-s-4',
  'group-data-[dim=true]/row:text-foreground-de-emp'
);

export const ROW_HEADING_CLASS = 'flex h-[var(--sentence-line)] items-center gap-1 font-semibold';

export const ROW_NUMBER_CLASS =
  'flex w-0 -ms-6 me-5 justify-end self-baseline text-xs leading-[20px] font-normal whitespace-nowrap text-foreground-de-emp tabular-nums';

export const LINE_CLASS = 'flex h-[var(--sentence-line)] items-center gap-2';

export const LINE_TEXT_CLASS = 'min-w-0 truncate';

export const CLAMPED_LINE_CLASS = 'flex items-center gap-2';

export const HEADING_TEXT_CLASS = cn(LINE_TEXT_CLASS, 'self-baseline py-[2px] leading-[20px]');

const MUTED_TEXT_CLASS =
  'text-foreground-de-emp group-data-[tone]/row:text-[color-mix(in_srgb,var(--color-foreground-de-emp)_80%,var(--color-foreground))]';

export const MORE_VALUES_CLASS = cn('shrink-0 font-medium whitespace-nowrap', MUTED_TEXT_CLASS);

export const LINE_BULLET_CLASS =
  'size-1.5 shrink-0 rounded-full bg-foreground-disable forced-colors:bg-[CanvasText]';

export const WORD_CLASS = MUTED_TEXT_CLASS;

export const TOKEN_KIND_CLASS = {
  input:
    'font-medium text-info-text group-data-[tone]/row:text-[color-mix(in_srgb,var(--color-info-text)_80%,var(--color-foreground))]',
  output: 'font-medium text-[var(--sentence-output-hue)]',
  value: 'rounded font-medium text-foreground not-data-[tone]:hover:bg-background-hover',
} as const;

export const OUTPUT_VALUE_CLASS =
  'inline-flex items-center rounded-md border border-[color-mix(in_srgb,var(--sentence-output-hue)_35%,transparent)] bg-[color-mix(in_srgb,var(--sentence-output-hue)_8%,var(--color-background))] px-1.5 text-sm leading-[20px] font-medium text-[var(--sentence-output-hue)] hover:border-[var(--sentence-output-hue)]';

export const LINE_MARK_CLASS = 'inline-flex shrink-0 items-center';

export const MARK_GLYPH_CLASS = 'forced-colors:text-[CanvasText]';
