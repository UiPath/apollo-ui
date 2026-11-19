import { cn } from '@uipath/apollo-wind';
import { TEXT_COLUMN_CLASS } from './sentenceStyles';

export const GRAPH_FRAME_CLASS =
  'relative flex min-h-0 flex-1 flex-col bg-background-secondary future:bg-background';

export const GRAPH_SCROLLER_CLASS = 'min-h-0 flex-1 scroll-pt-12 overflow-auto';

export const GRAPH_COLUMN_CLASS = cn(TEXT_COLUMN_CLASS, 'flex flex-col gap-4 py-8 pr-8');

export const GRAPH_EMPTY_CLASS = 'm-0 px-8 py-8 text-sm text-foreground-de-emp';

export const GRAPH_MINIMAP_SLOT_CLASS = 'absolute top-[15px] left-[15px] z-10';

export const GRAPH_MINIMAP_GAP_PX = 12;

export const graphColumnInsetOf = (launcherEnd: number): string =>
  `max(2rem, calc(${launcherEnd + GRAPH_MINIMAP_GAP_PX}px - max(0px, (100% - 48rem) / 2)))`;

export const GRAPH_CARD_CLASS =
  'group/chapter relative flex flex-col rounded-[10px] border border-border-de-emp bg-background data-[active]:border-border';

export const GRAPH_CARD_COLLAPSED_CLASS =
  '[&>:first-child]:rounded-[10px] [&>:first-child]:border-b-0';

export const GRAPH_CARD_TONE_CLASS = {
  error: 'border-[var(--color-error-icon)] data-[active]:border-[var(--color-error-icon)]',
  warning: 'border-[var(--color-warning-icon)] data-[active]:border-[var(--color-warning-icon)]',
} as const;

export const GRAPH_HEADER_CLASS =
  'sticky top-0 z-[2] m-0 flex h-12 items-center gap-2 rounded-t-[10px] border-b border-border-de-emp bg-background px-3 text-base font-normal';

export const GRAPH_TOGGLE_CLASS =
  'flex min-w-0 cursor-pointer items-center gap-2 rounded-md border-0 bg-transparent p-0 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-foreground-de-emp';

export const GRAPH_NAME_CLASS =
  'min-w-0 truncate text-base leading-6 font-semibold text-foreground';

export const GRAPH_REVEAL_CLASS =
  'opacity-0 transition-opacity group-hover/chapter:opacity-100 group-focus-within/chapter:opacity-100 group-data-[open]/chapter:opacity-100 motion-reduce:transition-none';

export const GRAPH_HIT_POLICY_CLASS = cn(
  'shrink-0 text-xs text-foreground-de-emp',
  GRAPH_REVEAL_CLASS
);

export const GRAPH_RULE_COUNT_CLASS = cn(
  'ms-auto shrink-0 text-xs text-foreground-de-emp',
  GRAPH_REVEAL_CLASS
);

export const GRAPH_MARK_BUTTON_CLASS =
  'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary';

export const GRAPH_MENU_BUTTON_CLASS = cn(
  'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-foreground-de-emp hover:bg-background-hover focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-background-hover data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100',
  GRAPH_REVEAL_CLASS
);

export const GRAPH_ADD_DECISION_CLASS =
  'flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-dashed border-border-de-emp bg-transparent px-3 text-start text-sm text-foreground-de-emp hover:bg-background-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4';

export const GRAPH_BODY_CLASS =
  'flex flex-col gap-3 overflow-clip rounded-b-[9px] bg-background-secondary px-3.5 pt-3.5 pb-4 future:bg-background';

export const GRAPH_NEST_CLASS = 'ms-[22px] flex flex-col gap-3 pt-3 ps-6';

export const GRAPH_BRANCH_CLASS =
  'relative before:absolute before:-top-3 before:-bottom-3 before:-start-6 before:border-s before:border-border last:before:bottom-auto last:before:h-[29px] after:absolute after:top-[9px] after:-start-6 after:h-4 after:w-6 after:rounded-es-lg after:border-b after:border-s after:border-border';

export const GRAPH_REFERENCE_CLASS =
  'group/chapter flex h-12 items-center gap-1.5 rounded-[10px] border border-dashed border-border bg-background px-3.5 text-xs text-foreground-de-emp';

export const GRAPH_REFERENCE_CHIP_CLASS =
  'inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border border-[color-mix(in_srgb,var(--sentence-output-hue)_35%,transparent)] bg-background px-2 align-middle text-xs font-medium text-[var(--sentence-output-hue)] hover:bg-[color-mix(in_srgb,var(--sentence-output-hue)_8%,var(--color-background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export const GRAPH_OUTPUT_HUE_CLASS =
  '[--sentence-output-hue:var(--color-purple-600)] dark:[--sentence-output-hue:var(--color-purple-300)]';

export const MINIMAP_FLOATING_CLASS =
  'rounded-xl border border-border-subtle bg-surface-raised p-1 text-foreground shadow-lg backdrop-blur-sm';

export const MINIMAP_TRIGGER_CLASS =
  'h-8 gap-2 rounded-md px-3 text-sm font-medium text-foreground future:text-foreground hover:bg-muted data-[state=open]:bg-accent [&_svg]:size-4';

export const MINIMAP_CONTENT_CLASS =
  'flex max-h-[min(440px,var(--radix-popover-content-available-height))] w-[296px] flex-col overflow-hidden border-border-subtle bg-background p-0 shadow-lg';

export const MINIMAP_ROW_CLASS =
  'flex min-w-0 cursor-pointer items-center gap-1.5 rounded-[4px] pe-1.5 text-xs whitespace-nowrap text-foreground-de-emp select-none data-[selected]:bg-accent data-[selected]:text-foreground data-[current]:font-semibold data-[current]:text-primary';
