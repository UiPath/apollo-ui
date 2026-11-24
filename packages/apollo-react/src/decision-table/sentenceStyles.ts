import { cn } from '@uipath/apollo-wind';
import type { MarkTone } from './marks';

const DECISION_TEXT_SURFACE_CLASS = cn(
  'relative bg-background-secondary future:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden',
  '[--sentence-output-hue:var(--color-purple-600)] dark:[--sentence-output-hue:var(--color-purple-300)]'
);

export const TEXT_COLUMN_CLASS = 'mx-auto w-full max-w-3xl';

export const NUMBER_MARGIN_CLASS = 'px-[calc(var(--sentence-number-digits,1)*1ch+1.75rem)]';

export const DECISION_TEXT_FRAME_CLASS = cn(
  'min-h-0 flex-1 overflow-auto',
  DECISION_TEXT_SURFACE_CLASS
);

/** The view sized to its rules, inside an ancestor that scrolls. */
export const DECISION_TEXT_INLINE_FRAME_CLASS = DECISION_TEXT_SURFACE_CLASS;

export const DECISION_TEXT_HEADER_CLASS =
  'group/header sticky top-0 z-2 flex flex-wrap items-center gap-x-2 rounded-t-[9px] border-b border-b-border-de-emp bg-background px-4 py-2 text-xs leading-4 text-foreground-de-emp';

export const HEADER_LABEL_CLASS = 'font-semibold';

export const GUTTER_CLASS = 'px-[var(--sentence-gutter,0.875rem)]';

export const DECISION_TEXT_BANDS_CLASS = cn(
  'grid grid-cols-[4rem_minmax(0,1fr)] items-start gap-x-2 gap-y-2 pt-3.5 pb-4',
  GUTTER_CLASS
);

export const BAND_CAPTION_CLASS =
  'pt-1 text-[10px] leading-4 font-bold tracking-[0.4px] whitespace-nowrap text-foreground-de-emp uppercase';

export const BAND_COLUMNS_CLASS = 'flex min-h-6 min-w-0 flex-wrap items-start gap-1.5';

export const BAND_MORE_LINK_CLASS =
  'inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-md px-1 text-xs leading-4 font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary';

export const BAND_ADD_BUTTON_CLASS =
  'inline-flex size-6 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-foreground-de-emp hover:bg-background-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary';

export const BAND_MORE_DOT_CLASS = 'size-1.5 rounded-full bg-[var(--color-error-icon)]';

export const BAND_MORE_LIST_CLASS =
  'flex min-h-0 max-h-72 flex-col items-start gap-1.5 overflow-y-auto p-2';

export const MARKED_CHIP_CLASS = cn(
  'group-data-[dim=true]/row:text-foreground-de-emp',
  'data-[tone=success]:bg-[color-mix(in_srgb,var(--color-success-icon)_10%,var(--color-background))]',
  'data-[tone=error]:bg-[color-mix(in_srgb,var(--color-error-icon)_10%,var(--color-background))]',
  'data-[tone=warning]:bg-[color-mix(in_srgb,var(--color-warning-icon)_10%,var(--color-background))]',
  'forced-colors:data-[tone]:outline-1'
);

export const BAND_COLUMN_CLASS = cn(
  'inline-flex h-6 min-w-0 max-w-full shrink-0 items-center gap-1 rounded-md border border-border-de-emp bg-background px-2 text-xs leading-4 font-medium text-foreground',
  MARKED_CHIP_CLASS
);

export const BAND_COLUMN_ITEM_CLASS = 'flex min-w-0 max-w-full shrink-0';

export const BAND_COLUMN_NAME_CLASS = 'min-w-0 truncate';

export const EMPTY_STATE_CLASS = 'rounded-lg border border-dashed border-border bg-background p-8';

export const RULE_CARD_CLASS = 'group/row pb-[var(--sentence-row-gap)] focus-visible:outline-none';

/** A selected stop's ring: an inset outline, so it never moves a line and forced colors keep it. */
const STOP_RING_CLASS = '-outline-offset-2 outline-primary';

export const DECISION_LINK_CLASS = cn(
  STOP_RING_CLASS,
  'cursor-pointer rounded hover:bg-background-hover focus-visible:outline-2'
);

export const BAND_COLUMN_BUTTON_CLASS = cn(
  BAND_COLUMN_CLASS,
  STOP_RING_CLASS,
  'cursor-pointer hover:border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
  'aria-expanded:border-primary aria-expanded:bg-[var(--color-background-selected)] aria-expanded:hover:border-primary'
);

export const SELECTED_CHIP_CLASS = cn(
  STOP_RING_CLASS,
  'data-[selected=true]:outline-2 data-[selected=true]:decoration-2 data-[selected=true]:border-primary focus-visible:outline-2 forced-colors:data-[tone]:data-[selected=true]:outline-2'
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
  'data-[selected=true]:outline-2 data-[row-selected=true]:outline-2 group-focus-visible/row:outline-2'
);

export const ROW_NUMBER_CLASS =
  'absolute end-[calc(100%+4px)] top-[9px] flex h-[22px] min-w-5 items-center justify-center rounded-md border border-border-de-emp bg-background px-1 text-xs leading-5 whitespace-nowrap text-foreground-de-emp tabular-nums shadow-sm opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100';

export const LINE_CLASS = cn(
  'flex min-h-[var(--sentence-line)] items-start gap-2',
  'group-data-[change=delete]/row:**:text-foreground-de-emp! group-data-[change=delete]/row:**:line-through'
);

export const SENTENCE_CLASS = 'min-h-[var(--sentence-line)]';

export const RULE_TITLE_CLASS = 'min-h-[var(--sentence-line)] font-semibold';

export const INLINE_LINE_CLASS = 'inline';

export const LINES_CLASS = 'mt-[var(--sentence-lines-gap)]';

export const LINE_TEXT_CLASS = 'min-w-0 break-words';

export const CLAMPED_LINE_CLASS = 'flex flex-wrap items-baseline gap-x-2';

export const HEADING_TEXT_CLASS = cn(
  LINE_TEXT_CLASS,
  'py-px leading-[calc(var(--sentence-line)-2px)]'
);

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

const WAVE_CLASS = 'underline decoration-wavy decoration-1 underline-offset-[3px]';

export const TOKEN_KIND_CLASS = {
  input: cn(
    WAVE_CLASS,
    'decoration-[color-mix(in_srgb,var(--color-info-text)_55%,transparent)]',
    'font-medium text-info-text group-data-[tone]/row:text-[color-mix(in_srgb,var(--color-info-text)_80%,var(--color-foreground))] group-data-[dim=true]/row:text-foreground-de-emp'
  ),
  output: cn(
    WAVE_CLASS,
    'decoration-[color-mix(in_srgb,var(--sentence-output-hue)_55%,transparent)]',
    'font-medium text-[var(--sentence-output-hue)] group-data-[dim=true]/row:text-foreground-de-emp'
  ),
  value: 'rounded font-medium text-foreground not-data-[tone]:hover:bg-background-hover',
} as const;

export const EDITABLE_VALUE_CLASS = cn(
  'data-[tone=warning]:underline data-[tone=warning]:decoration-wavy data-[tone=warning]:decoration-1 data-[tone=warning]:underline-offset-[3px] data-[tone=warning]:decoration-[var(--color-warning-icon)]',
  'group-data-[editable=true]/row:underline group-data-[editable=true]/row:decoration-wavy group-data-[editable=true]/row:decoration-1 group-data-[editable=true]/row:underline-offset-[3px] group-data-[editable=true]/row:decoration-[var(--color-warning-icon)]'
);

export const OUTPUT_VALUE_CLASS =
  'inline-flex items-center rounded-md border border-[color-mix(in_srgb,var(--sentence-output-hue)_35%,transparent)] bg-[color-mix(in_srgb,var(--sentence-output-hue)_8%,var(--color-background))] px-1.5 text-sm leading-[calc(var(--sentence-line)-4px)] font-medium text-[var(--sentence-output-hue)] hover:border-[var(--sentence-output-hue)]';

export const EMPTY_OUTPUT_VALUE_CLASS =
  'inline-flex items-center rounded-md border border-dashed border-border px-1.5 text-sm leading-[calc(var(--sentence-line)-4px)] text-foreground-de-emp';

export const LINE_MARK_CLASS = 'inline-flex h-[var(--sentence-line)] shrink-0 items-center';

export const MARK_GLYPH_CLASS = 'size-3.5 forced-colors:text-[CanvasText]';

export const MARK_TOOLTIP_ANCHOR_CLASS = 'pointer-events-none fixed';

export const MARK_TOOLTIP_CLASS = 'max-w-[320px] data-[state=closed]:animate-none!';

export const MARK_TOOLTIP_TEXT_CLASS = 'flex items-center gap-1.5 whitespace-pre-line text-xs';

export const VALUE_EDITOR_CLASS =
  'fixed inset-auto m-0 mt-1 w-72 min-w-0 max-w-full rounded-md border border-border-de-emp bg-popover p-3 text-sm text-popover-foreground shadow-md backdrop:bg-transparent future:rounded-lg';

export const COLUMN_EDITOR_CLASS = cn(VALUE_EDITOR_CLASS, 'w-80');

export const POPOVER_CLASS = 'flex min-w-0 flex-col gap-3';

export const POPOVER_HEADER_CLASS = 'flex min-w-0 items-center gap-1.5';

export const POPOVER_ICON_CLASS = 'flex shrink-0 text-foreground-de-emp [&_svg]:size-3.5';

export const POPOVER_TITLE_CLASS =
  'min-w-0 truncate text-sm leading-5 font-semibold text-foreground';

export const POPOVER_FIELD_CLASS = 'h-8 min-w-0';

export const POPOVER_OPTION_CLASS = 'flex min-w-0 items-center gap-1.5';

export const COLUMN_FIELD_CLASS = 'flex min-w-0 flex-col gap-1';

export const COLUMN_FIELD_LABEL_CLASS = 'text-xs font-semibold';

export const COLUMN_REQUIRED_CLASS = 'text-error-text';

export const COLUMN_CODE_FIELD_CLASS = cn(POPOVER_FIELD_CLASS, 'font-mono');

export const COLUMN_HINT_CLASS = 'text-[11px] leading-4 text-foreground-de-emp';

export const POPOVER_ERROR_CLASS = 'text-[11px] leading-4 text-error-text';

export const VALUE_POPOVER_CHOICES_CLASS = 'flex min-w-0 flex-col gap-1';

export const ALLOWED_VALUES_CLASS = 'flex max-h-48 flex-col gap-0 overflow-y-auto';

export const ALLOWED_VALUE_CLASS =
  'flex h-7 min-w-0 items-center gap-2 rounded px-1 hover:bg-background-hover';

export const ALLOWED_VALUE_LABEL_CLASS = 'min-w-0 flex-1 cursor-pointer truncate text-sm';

export const RANGE_FIELDS_CLASS = 'flex min-w-0 flex-col gap-2';

export const RANGE_END_CLASS = 'flex min-w-0 items-center gap-2';

export const RANGE_END_FIELD_CLASS = cn(POPOVER_FIELD_CLASS, 'flex-1');

export const RANGE_INCLUDED_CLASS = 'shrink-0 cursor-pointer text-xs text-foreground-de-emp';

export const ADD_VALUE_CLASS = 'flex min-w-0 items-center gap-1';

export const ADD_VALUE_BUTTON_CLASS = 'h-8 shrink-0 px-2 [&_svg]:size-4';

export const POPOVER_FOOTER_CLASS =
  'flex flex-wrap items-center justify-end gap-2 border-t border-border-de-emp pt-3';

export const POPOVER_LINKS_CLASS = 'me-auto flex min-w-0 items-center gap-3';

export const POPOVER_LINK_CLASS = 'h-auto px-0 text-xs';

export const POPOVER_ACTIONS_CLASS = 'flex shrink-0 items-center gap-2';

export const POPOVER_APPLY_DIMMED_CLASS = 'aria-disabled:opacity-50';

/** A condition line the open editor adds: its value reads as a placeholder until the host words it. */
export const PENDING_LINE_CLASS =
  '[&_[data-kind=value]]:rounded-md [&_[data-kind=value]]:border [&_[data-kind=value]]:border-dashed [&_[data-kind=value]]:border-border [&_[data-kind=value]]:px-1.5 [&_[data-kind=value]]:font-normal [&_[data-kind=value]]:text-foreground-de-emp';

export const HEADING_ACTIONS_SPACE_CLASS = 'pe-18';

export const RULE_ACTIONS_CLASS =
  'absolute end-2 top-[calc(var(--sentence-row-padding)-var(--sentence-row-border))] flex h-[var(--sentence-line)] items-center gap-0.5';

export const RULE_ACTION_CLASS = cn(
  'size-6 text-foreground-de-emp hover:text-foreground',
  'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 group-has-[[data-selected]]/row:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
);

/** Hidden until its card is hovered or holds the selection, or it has keyboard focus. */
export const REVEALED_ACTION_CLASS =
  'opacity-0 group-hover/row:opacity-100 group-has-[[data-selected]]/row:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100';

export const CITATION_BUTTON_CLASS =
  'gap-1 text-foreground-de-emp hover:text-foreground [&_svg]:size-3.5 [&_svg]:shrink-0';

export const RULE_CITATIONS_CLASS = 'ms-auto flex flex-wrap justify-end gap-1';

export const CITED_LINES_CLASS = 'flex flex-wrap items-end gap-x-2';

export const CITED_LINE_CLASS = 'grow';

export const HEADER_CITATIONS_CLASS = 'flex gap-1 self-center';

export const HEADER_CITATION_REVEAL_CLASS =
  'opacity-0 group-hover/header:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100';

export const DELETE_RULE_CLASS = cn(
  RULE_ACTION_CLASS,
  'hover:text-error-text future:hover:text-error-text',
  REVEALED_ACTION_CLASS
);

export const CLAUSE_CLASS = 'group/clause relative pe-7';

export const REMOVE_CONDITIONS_CLASS =
  'absolute end-0 top-0.5 flex opacity-0 group-hover/clause:opacity-100 group-has-[[data-selected]]/row:opacity-100 group-focus-within/clause:opacity-100 has-focus-visible:opacity-100 [@media(hover:none)]:opacity-100';

export const REMOVE_CONDITION_CLASS =
  'size-5 shrink-0 text-foreground-de-emp hover:text-foreground';

export const ADD_RULE_LINK_CLASS = 'h-auto w-fit gap-1 rounded-md px-2 py-1.5 [&_svg]:size-3.5';

export const ADD_RULE_FOOTER_CLASS = cn('pb-4', GUTTER_CLASS);

export const POLICY_TRIGGER_CLASS = cn(
  BAND_COLUMN_BUTTON_CLASS,
  '-my-0.5 -ms-1 h-6 bg-background-hover text-foreground-de-emp future:text-foreground-de-emp [&_svg]:size-3.5'
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

/** A changed value's or column's wash, the Business Rules table diff's: green added, amber changed, red and struck removed; a validation tone underlines it. */
export const CHANGED_CHIP_CLASS = cn(
  'data-[change=add]:bg-[color-mix(in_srgb,var(--color-success-icon)_12%,var(--color-background))]! data-[change=add]:text-foreground!',
  'data-[change=update]:bg-[color-mix(in_srgb,var(--color-warning-icon)_18%,var(--color-background))]! data-[change=update]:text-foreground!',
  'data-[change=delete]:bg-[color-mix(in_srgb,var(--color-error-icon)_8%,var(--color-background))]! data-[change=delete]:text-foreground-de-emp! data-[change=delete]:line-through',
  'data-[change]:data-[tone=error]:shadow-[inset_0_-2px_0_var(--color-error-icon)] data-[change]:data-[tone=warning]:shadow-[inset_0_-2px_0_var(--color-warning-icon)] data-[change]:data-[tone=success]:shadow-[inset_0_-2px_0_var(--color-success-icon)]',
  'forced-colors:data-[change]:outline-1'
);

/** A condition value's room around its wash. */
export const CHANGED_VALUE_CLASS = 'data-[change]:px-0.5';

/** A value's old text, struck before or after what the cell holds now; a removed one keeps its red wash. */
export const STRUCK_VALUE_CLASS = cn(
  'rounded px-0.5 font-normal text-foreground-de-emp line-through decoration-foreground-de-emp',
  'data-[change=delete]:bg-[color-mix(in_srgb,var(--color-error-icon)_8%,var(--color-background))]'
);

/** A removed condition's line: struck, on the red wash. */
export const REMOVED_LINE_CLASS =
  'rounded-md bg-[color-mix(in_srgb,var(--color-error-icon)_8%,transparent)] text-foreground-de-emp line-through **:text-foreground-de-emp!';

/** An added condition's line, on the green wash. */
export const ADDED_LINE_CLASS =
  'rounded-md bg-[color-mix(in_srgb,var(--color-success-icon)_12%,transparent)]';

/** A changed card's start border in the change's colour, and an added or removed card's wash; a removed card is struck. */
export const ROW_CHANGE_CLASS = cn(
  'group-data-[change]/row:border-s-2',
  'group-data-[change=add]/row:border-s-success! group-data-[change=update]/row:border-s-warning-icon! group-data-[change=delete]/row:border-s-error!',
  'group-data-[change=add]/row:bg-[color-mix(in_srgb,var(--color-success-icon)_12%,var(--color-background))]',
  'group-data-[change=delete]/row:bg-[color-mix(in_srgb,var(--color-error-icon)_8%,var(--color-background))]'
);

/** A changed card's number and sign, in the change's colour. */
export const ROW_NUMBER_CHANGE_CLASS = cn(
  'gap-0.5 group-data-[change]/row:font-semibold',
  'group-data-[change=add]/row:text-success group-data-[change=update]/row:text-warning-text group-data-[change=delete]/row:text-error'
);

export const CHANGE_SIGN_CLASS = 'font-mono';

export const MOVED_ICON_CLASS = 'size-3';

export const HIT_POLICY_CHANGE_CLASS = cn(HEADER_LABEL_CLASS, 'inline-flex items-baseline gap-1');

export const FOLD_ROW_CLASS = 'pb-[var(--sentence-row-gap)]';

export const FOLD_BUTTON_CLASS =
  'w-full justify-start rounded-lg border border-dashed border-border-de-emp text-foreground-de-emp';
