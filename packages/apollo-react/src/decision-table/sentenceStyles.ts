import { cn } from '@uipath/apollo-wind';
import type { MarkTone } from './marks';

export const DECISION_TEXT_FRAME_CLASS = cn(
  'relative min-h-0 flex-1 overflow-auto bg-background-secondary future:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
  '[--sentence-output-hue:var(--color-purple-600)] dark:[--sentence-output-hue:var(--color-purple-300)]'
);

export const DECISION_TEXT_HEADER_CLASS =
  'sticky top-0 z-2 flex flex-wrap items-baseline gap-x-2 border-b border-b-border-de-emp bg-background px-4 py-2 text-xs leading-4 text-foreground-de-emp';

export const HEADER_LABEL_CLASS = 'font-semibold';

export const GUTTER_CLASS = 'pe-8 ps-[max(2rem,calc(var(--sentence-number-digits,0)*1ch+1.25rem))]';

export const DECISION_TEXT_BANDS_CLASS = cn(
  'grid grid-cols-[minmax(4rem,auto)_minmax(0,1fr)] items-start gap-2 pt-3 pb-6',
  GUTTER_CLASS
);

export const BAND_CAPTION_CLASS =
  'pt-1 text-[10px] leading-4 font-bold tracking-wider whitespace-nowrap text-foreground-de-emp uppercase';

export const BAND_COLUMNS_CLASS =
  'flex min-h-6 min-w-0 items-start gap-1.5 overflow-x-auto whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden';

export const MARKED_CHIP_CLASS = cn(
  'group-data-[dim=true]/row:text-foreground-de-emp',
  'data-[tone=success]:bg-[color-mix(in_srgb,var(--color-success-icon)_10%,var(--color-background))]',
  'data-[tone=error]:bg-[color-mix(in_srgb,var(--color-error-icon)_10%,var(--color-background))]',
  'data-[tone=warning]:bg-[color-mix(in_srgb,var(--color-warning-icon)_10%,var(--color-background))]',
  'forced-colors:data-[tone]:outline-1'
);

export const BAND_COLUMN_CLASS = cn(
  'inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-border-de-emp bg-background px-2 text-xs leading-4 font-medium text-foreground',
  MARKED_CHIP_CLASS
);

export const EMPTY_STATE_CLASS = 'rounded-lg border border-dashed border-border bg-background p-8';

export const RULE_CARD_CLASS = 'group/row pb-[var(--sentence-row-gap)] focus-visible:outline-none';

/** A selected stop's ring: an inset outline, so it never moves a line and forced colors keep it. */
const STOP_RING_CLASS = '-outline-offset-2 outline-primary';

export const DECISION_LINK_CLASS = cn(
  STOP_RING_CLASS,
  'cursor-pointer rounded underline decoration-dotted underline-offset-2 hover:decoration-solid focus-visible:outline-2'
);

export const SELECTED_CHIP_CLASS = cn(
  STOP_RING_CLASS,
  'data-[selected=true]:outline-2 focus-visible:outline-2 forced-colors:data-[tone]:data-[selected=true]:outline-2'
);

/** The card border's colour for each grid tone. */
const CARD_TONE_CLASS = {
  success: 'group-data-[tone=success]/row:border-success-icon',
  error: 'group-data-[tone=error]/row:border-error-icon',
  warning: 'group-data-[tone=warning]/row:border-warning-icon',
} satisfies Record<MarkTone, string>;

export const ROW_SURFACE_CLASS = cn(
  'relative flex flex-col rounded-lg border-[length:var(--sentence-row-border)] border-border-de-emp bg-background px-3 py-[var(--sentence-row-padding)] text-sm leading-[var(--sentence-line)] text-foreground shadow-sm not-group-data-[tone]/row:hover:border-border',
  Object.values(CARD_TONE_CLASS),
  'forced-colors:group-data-[tone]/row:border-s-4',
  'group-data-[dim=true]/row:text-foreground-de-emp',
  STOP_RING_CLASS,
  'data-[selected=true]:outline-2 group-focus-visible/row:outline-2 group-focus-visible/row:ring-2 group-focus-visible/row:ring-ring'
);

export const ROW_NUMBER_CLASS =
  'absolute end-[calc(100%+4px)] top-[9px] flex h-[22px] min-w-5 items-center justify-center rounded-md border border-border-de-emp bg-background px-1 text-xs leading-5 whitespace-nowrap text-foreground-de-emp tabular-nums shadow-sm';

export const LINE_CLASS = 'flex min-h-[var(--sentence-line)] items-start gap-2';

export const LINES_CLASS = 'mt-[var(--sentence-lines-gap)]';

export const LINE_TEXT_CLASS = 'min-w-0 break-words';

export const CLAMPED_LINE_CLASS = 'flex flex-wrap items-baseline gap-x-2';

export const HEADING_TEXT_CLASS = cn(LINE_TEXT_CLASS, 'py-px leading-[22px]');

export const MUTED_TEXT_CLASS =
  'text-foreground-de-emp group-data-[tone]/row:text-[color-mix(in_srgb,var(--color-foreground-de-emp)_80%,var(--color-foreground))]';

export const MORE_VALUES_CLASS = cn('shrink-0 font-medium whitespace-nowrap', MUTED_TEXT_CLASS);

export const LINE_BULLET_CLASS =
  'mt-2.5 size-1 shrink-0 rounded-full bg-foreground-disable forced-colors:bg-[CanvasText]';

export const LINE_VERDICT_CLASS = {
  matched: 'mt-[5px] size-3.5 shrink-0 text-success-icon forced-colors:text-[CanvasText]',
  unmatched: 'mt-[5px] size-3.5 shrink-0 text-error-icon forced-colors:text-[CanvasText]',
} as const;

export const MATCHED_LINE_CLASS =
  'rounded-md [&[data-matched]_[data-tone]]:bg-transparent data-[matched=true]:bg-[color-mix(in_srgb,var(--color-success-icon)_10%,transparent)] data-[matched=false]:bg-[color-mix(in_srgb,var(--color-error-icon)_10%,transparent)]';

export const TOKEN_KIND_CLASS = {
  input:
    'font-medium text-info-text group-data-[tone]/row:text-[color-mix(in_srgb,var(--color-info-text)_80%,var(--color-foreground))] group-data-[dim=true]/row:text-foreground-de-emp',
  output:
    'font-medium text-[var(--sentence-output-hue)] group-data-[dim=true]/row:text-foreground-de-emp',
  value: 'rounded font-medium text-foreground not-data-[tone]:hover:bg-background-hover',
} as const;

export const OUTPUT_VALUE_CLASS =
  'inline-flex items-center rounded-md border border-[color-mix(in_srgb,var(--sentence-output-hue)_35%,transparent)] bg-[color-mix(in_srgb,var(--sentence-output-hue)_8%,var(--color-background))] px-1.5 text-sm leading-[20px] font-medium text-[var(--sentence-output-hue)] hover:border-[var(--sentence-output-hue)]';

export const EMPTY_OUTPUT_VALUE_CLASS = '-mx-1 px-1 py-0.5 italic text-foreground-de-emp';

export const LINE_MARK_CLASS = 'inline-flex h-[var(--sentence-line)] shrink-0 items-center';

export const MARK_GLYPH_CLASS = 'size-3.5 forced-colors:text-[CanvasText]';

export const VALUE_EDITOR_CLASS =
  'absolute z-3 m-0 mt-1 w-64 min-w-0 max-w-full overflow-hidden rounded-md border border-border bg-background p-0 text-sm shadow-lg';

export const HEADING_ACTIONS_SPACE_CLASS = 'pe-18';

export const RULE_ACTIONS_CLASS =
  'absolute end-2 top-[calc(var(--sentence-row-padding)-var(--sentence-row-border))] flex h-[var(--sentence-line)] items-center gap-0.5';

export const RULE_ACTION_CLASS = 'size-6 text-foreground-de-emp hover:text-foreground';

/** Hidden until its card is hovered or holds the selection, or it has keyboard focus. */
const REVEALED_ACTION_CLASS =
  'opacity-0 group-hover/row:opacity-100 group-has-[[data-selected]]/row:opacity-100 focus-visible:opacity-100';

export const DELETE_RULE_CLASS = cn(
  RULE_ACTION_CLASS,
  'hover:text-error-text future:hover:text-error-text',
  REVEALED_ACTION_CLASS
);

export const REMOVE_CONDITION_CLASS = cn(
  'mt-0.5 size-5 shrink-0 text-foreground-de-emp hover:text-foreground',
  REVEALED_ACTION_CLASS
);

export const ADD_RULE_FOOTER_CLASS = cn('pb-4', GUTTER_CLASS);

export const POLICY_TRIGGER_CLASS = cn(
  HEADER_LABEL_CLASS,
  '-my-0.5 -ms-1 gap-1 text-foreground-de-emp future:text-foreground-de-emp'
);

export const POLICY_CODE_CLASS = 'font-mono text-foreground';

export const POLICY_MENU_CLASS = 'w-[380px] max-w-[calc(100vw-2rem)]';

export const POLICY_SUBMENU_CLASS = 'w-[320px] max-w-[calc(100vw-2rem)]';

/** An option without the radio dot: the picked one shows `POLICY_CHECK_CLASS` instead. */
export const POLICY_ITEM_CLASS = 'relative [&_.lucide-circle]:hidden';

export const POLICY_CHECK_CLASS =
  'absolute left-2 flex size-3.5 items-center justify-center [&_svg]:size-4';

export const POLICY_OPTION_CLASS = 'flex min-w-0 flex-1 flex-col gap-0.5 py-0.5';

export const POLICY_OPTION_TITLE_CLASS = 'flex items-center gap-1.5';

export const POLICY_OPTION_LABEL_CLASS = 'text-foreground';

export const POLICY_OPTION_CODE_CLASS =
  'shrink-0 px-1.5 py-0 font-mono leading-4 text-foreground-de-emp';

export const POLICY_HINT_CLASS = 'text-xs text-foreground-de-emp';
