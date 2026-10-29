import { cn } from '@uipath/apollo-wind';
import type { CellEdge } from './gridTypes';

/**
 * The grid's class-string vocabulary. The grid renders its own chrome (header rows, resize
 * handles, drop indicator) from these; the body classes are exported so consumer-rendered rows
 * and affordances share one look with the chrome around them.
 */

/**
 * The scroll container, drawn as a rounded card inset from its pane. Its height follows the rows, up
 * to the pane's, so a short table is not a box of empty space. The card's border is the table's outer
 * edge, which is why the last row and column drop their own (`TABLE_EDGE_CLASS`); short of the card,
 * the table draws its right edge itself (`TABLE_HUG_EDGE_CLASS`).
 */
export const GRID_FRAME_CLASS =
  'relative m-3 min-h-0 flex-initial overflow-auto rounded-lg border border-border-de-emp/60 bg-background outline-none select-none';

/** Fills the pane around the card, so a press below a short table is still a press on the grid's blank area. */
export const GRID_PANE_CLASS = 'flex min-h-0 flex-1 flex-col';

/** The scroll container when the host draws the frame: no card of its own, filling the host's pane. */
export const HOST_FRAMED_CONTAINER_CLASS = 'relative flex-1 overflow-auto outline-none select-none';

/** Drops the edges the frame already draws, whichever row and column end the table. */
export const TABLE_EDGE_CLASS =
  '[&_tr>*:last-child]:border-r-0 [&>tbody>tr:last-child>*]:border-b-0';

/**
 * The right edge of a table narrower than its frame, where the frame's border is no longer it. Drawn
 * outside the table, so once the table reaches the frame the scroll container clips it rather than
 * doubling the frame's line.
 */
export const TABLE_HUG_EDGE_CLASS =
  'shadow-[1px_0_0_0_color-mix(in_srgb,var(--color-border-de-emp)_60%,transparent)]';

/**
 * The lines between cells, all barely there so the table breathes: rows at 60% of the de-emphasised
 * border, columns at 50%. Edges are set separately so a cell can keep one and drop the other.
 */
const GRID_LINE_V_CLASS = 'border-r border-r-border-de-emp/50';
export const GRID_LINE_H_CLASS = 'border-b border-b-border-de-emp/60';
/** Under the header: the de-emphasised border at full strength, the one line a step above the rest. */
const HEADER_LINE_CLASS = 'border-b border-b-border-de-emp';

/** Sticky header chrome, shared by the group row and the label row. */
const STICKY_HEADER_CLASS = 'sticky z-2 bg-background';

/**
 * The group (caption) row is 33px — 32 inside plus its bottom line, as in the design — and the label
 * row sticks that far down, so the two numbers change together.
 */
const GROUP_ROW_HEIGHT_CLASS = 'h-[33px]';
const HEADER_ROW_TOP_CLASS = 'top-[33px]';

/** A group row cell; the group's colour identity comes from its `toneClassName`. */
export const GROUP_CELL_CLASS = cn(
  STICKY_HEADER_CLASS,
  'top-0',
  GROUP_ROW_HEIGHT_CLASS,
  GRID_LINE_V_CLASS,
  GRID_LINE_H_CLASS,
  // `align-middle` stated, not inherited: a host that resets `th` to top would otherwise lift the caption.
  'px-2 py-0 text-left align-middle text-xs font-semibold'
);

/** The group row above ungrouped columns and the gutters. */
export const GROUP_GUTTER_CLASS = cn(
  STICKY_HEADER_CLASS,
  'top-0',
  GROUP_ROW_HEIGHT_CLASS,
  GRID_LINE_V_CLASS,
  GRID_LINE_H_CLASS
);

/**
 * The output band's teal, set as `--grid-output-hue` on the element that uses it; every output
 * colour (caption, fill, body tint) is mixed from it, as the input side is from primary. Apollo has
 * no theme-aware teal, so cyan-700 is mixed with the foreground: darker on a light theme, lighter on
 * a dark one, legible as caption text on both.
 */
export const OUTPUT_HUE_CLASS =
  '[--grid-output-hue:color-mix(in_srgb,var(--color-cyan-700)_75%,var(--color-foreground))]';

/**
 * The standard group tones (`GridColumnGroup.toneClassName` values): a caption in the band's hue
 * over a light fill of it. Inputs take the theme's primary blue; outputs the teal above.
 */
export const GROUP_TONE_CLASS = {
  annotation: 'text-foreground-de-emp',
  inputs: 'text-primary bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-background))]',
  outputs: cn(
    OUTPUT_HUE_CLASS,
    'text-[var(--grid-output-hue)] bg-[color-mix(in_srgb,var(--grid-output-hue)_8%,var(--color-background))]'
  ),
} as const;

/**
 * The inert band between two column groups. Neutral down its whole height, so it reads as chrome
 * between the two bands' hues rather than as a third.
 */
export const SEPARATOR_GROUP_CELL_CLASS = cn(
  STICKY_HEADER_CLASS,
  'top-0',
  GROUP_ROW_HEIGHT_CLASS,
  GRID_LINE_H_CLASS,
  'bg-[color-mix(in_srgb,var(--color-foreground-de-emp)_8%,var(--color-background))]',
  // Closes the band beyond it. The left edge needs nothing: the band cell before this one draws
  // its own right border, and `border-separate` would paint the pair as 2px.
  GRID_LINE_V_CLASS
);

/** Header row — as neutral as the band row above it. */
export const SEPARATOR_HEADER_CELL_CLASS = cn(
  STICKY_HEADER_CLASS,
  HEADER_ROW_TOP_CLASS,
  HEADER_LINE_CLASS,
  'bg-[color-mix(in_srgb,var(--color-foreground-de-emp)_5%,var(--color-background))]',
  'text-center align-middle text-foreground-de-emp',
  // As in the band row: the header before this one draws the left edge, this draws the right.
  GRID_LINE_V_CLASS
);

/** Body rows beside the outputs, in both tables. */
export const SEPARATOR_BODY_TINTED_CELL_CLASS = cn(
  GRID_LINE_V_CLASS,
  GRID_LINE_H_CLASS,
  'bg-[color-mix(in_srgb,var(--color-foreground-de-emp)_5%,var(--color-background))]'
);

/**
 * A marked row's wash on its separator and gutters. An overlay rather than a fill, as `IN_RANGE_CLASS` is, so
 * the band shows through and the row reads as one wash across it. Same strengths as the cells' `CELL_MARK_CLASS`.
 */
export const ROW_MARK_OVERLAY_CLASS = [
  'group-data-[tone=success]/row:bg-[image:linear-gradient(color-mix(in_srgb,var(--color-success-icon)_15%,transparent),color-mix(in_srgb,var(--color-success-icon)_15%,transparent))]',
  'group-data-[tone=error]/row:bg-[image:linear-gradient(color-mix(in_srgb,var(--color-error-icon)_5%,transparent),color-mix(in_srgb,var(--color-error-icon)_5%,transparent))]',
  'group-data-[tone=warning]/row:bg-[image:linear-gradient(color-mix(in_srgb,var(--color-warning-icon)_5%,transparent),color-mix(in_srgb,var(--color-warning-icon)_5%,transparent))]',
].join(' ');

/**
 * The class that drops one border, by edge — what `GridColumnGroup.omitCellBorders` resolves to.
 * Written out per edge because Tailwind's scanner only sees complete class strings.
 */
export const OMIT_BORDER_CLASS = {
  top: 'border-t-0',
  right: 'border-r-0',
  bottom: 'border-b-0',
  left: 'border-l-0',
} as const satisfies Record<CellEdge, string>;

/**
 * The left edge of a column frozen to the right of the grid
 * (the add-column "+", the tests panel's result column).
 */
export const FROZEN_LEFT_EDGE_CLASS =
  'shadow-[-1px_0_0_0_color-mix(in_srgb,var(--color-border-de-emp)_60%,transparent)]';

/** Body tint carried by every output cell, so the outputs read as one band down the table. */
export const OUTPUT_CELL_TINT_CLASS = cn(
  OUTPUT_HUE_CLASS,
  'bg-[color-mix(in_srgb,var(--grid-output-hue)_4%,var(--color-background))]'
);

/** A body cell's lines; consumers add their own fill and padding. */
export const BODY_CELL_CLASS = cn(GRID_LINE_V_CLASS, GRID_LINE_H_CLASS, 'p-0');

/**
 * A marked cell's wash, from its own `data-tone` or its row's. The `:not([data-tone])` guard makes
 * the two selectors disjoint, so every cell matches exactly one of them. The hue is an apollo-core
 * `--color-*-icon`, which resolves on every element under the theme class.
 */
export const CELL_MARK_CLASS = [
  'group-data-[tone=success]/row:[&:not([data-tone])]:bg-[color-mix(in_srgb,var(--color-success-icon)_15%,var(--color-background))]',
  'group-data-[tone=error]/row:[&:not([data-tone])]:bg-[color-mix(in_srgb,var(--color-error-icon)_5%,var(--color-background))]',
  'group-data-[tone=warning]/row:[&:not([data-tone])]:bg-[color-mix(in_srgb,var(--color-warning-icon)_5%,var(--color-background))]',
  'group-data-[dim=true]/row:text-foreground-de-emp',
  'data-[tone=success]:bg-[color-mix(in_srgb,var(--color-success-icon)_10%,var(--color-background))]',
  'data-[tone=error]:bg-[color-mix(in_srgb,var(--color-error-icon)_10%,var(--color-background))]',
  'data-[tone=warning]:bg-[color-mix(in_srgb,var(--color-warning-icon)_10%,var(--color-background))]',
].join(' ');

/** A marked row's rail and number, in the gutter beside it. */
export const ROW_GUTTER_MARK_CLASS = [
  'group-data-[tone=success]/row:border-l-2 group-data-[tone=success]/row:border-l-success',
  'group-data-[tone=success]/row:font-semibold group-data-[tone=success]/row:text-success',
  'group-data-[tone=error]/row:border-l-2 group-data-[tone=error]/row:border-l-error group-data-[tone=error]/row:text-error',
  'group-data-[tone=warning]/row:border-l-2 group-data-[tone=warning]/row:border-l-warning group-data-[tone=warning]/row:text-warning',
  'group-data-[dim=true]/row:text-foreground-de-emp',
].join(' ');

/** A column header: no fill, muted medium-weight labels, the stronger line beneath. */
export const HEADER_CELL_CLASS = cn(
  STICKY_HEADER_CLASS,
  HEADER_ROW_TOP_CLASS,
  GRID_LINE_V_CLASS,
  HEADER_LINE_CLASS,
  'px-2 py-2 text-left align-top text-foreground-de-emp'
);

/**
 * A band's caption and its "+", on one line whatever the band's width. Sticky, so while any of the
 * band is in view its caption is too, held just past the pinned columns (the grid publishes where
 * they end as `--grid-pinned-left`) at the band cell's own inset. The band cell is its containing
 * block, so as the band scrolls out its right edge pushes the caption with it and the next band's
 * caption takes the place.
 */
export const BAND_LABEL_ROW_CLASS =
  'sticky left-[calc(var(--grid-pinned-left,0px)+0.5rem)] flex w-fit items-center gap-1 whitespace-nowrap';

/**
 * The add-column button beside a band's label (on a ghost `Button`, sized down to the label). Inherits the
 * band's own text colour so it reads as part of the label rather than as chrome dropped on top of the tint.
 */
export const BAND_ADD_COLUMN_CLASS =
  'size-3.5 shrink-0 rounded-sm text-current opacity-60 transition-opacity duration-150 hover:bg-transparent hover:text-current ' +
  'hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-offset-0 future:text-current future:hover:text-current';

/** The label row inside a header cell: the name, and the drag grip that reveals on hover. */
export const HEADER_LABEL_ROW_CLASS = 'flex items-center justify-between gap-1 text-xs font-medium';

/**
 * The resize affordance: a wide invisible grab strip with a thin visible line inside it, so the
 * pointer target is forgiving while the border stays hairline.
 */
export const RESIZE_HANDLE_CLASS = [
  'absolute top-0 -right-0.75 z-3 h-full w-1.5 cursor-col-resize touch-none focus-visible:outline-none',
  "after:absolute after:top-0 after:right-0.75 after:h-full after:w-0.5 after:bg-transparent after:content-['']",
  'hover:after:bg-primary focus-visible:after:bg-primary',
].join(' ');

/**
 * The row-number gutter, pinned to the left edge. Sticky makes it a stacking context, which caps
 * an insert affordance below the sticky header — the first row's "+" straddles the header's
 * bottom edge and would paint half-hidden. The whole cell lifts while the affordance is wanted.
 * `group/gutter` reveals the insert and drag affordances on hovering this cell.
 */
export const ROW_NUMBER_CELL_CLASS = cn(
  'group/gutter sticky left-0 z-1 bg-background px-1 text-center align-middle whitespace-nowrap text-foreground-de-emp',
  GRID_LINE_V_CLASS,
  GRID_LINE_H_CLASS,
  'hover:z-4 focus-within:z-4'
);

/**
 * Every reveal below marks its `opacity-100`: a sibling micro-frontend publishes `opacity-0`
 * unlayered into the shared document, and an unlayered declaration outranks a layered utility
 * whatever its selector, so the resting state would win over the hover.
 */

/** Straddles the row's top border so a row can be inserted without going through a menu. */
export const INSERT_ROW_CLASS =
  'absolute -top-[9px] left-1/2 z-2 size-[18px] -translate-x-1/2 rounded-full opacity-0 transition-opacity duration-150 ' +
  'group-hover/gutter:opacity-100! focus-visible:opacity-100!';

/**
 * Hover-revealed grab affordance, taken out of the flow so the row number stays centred in its
 * gutter whether or not the handle is showing.
 */
export const ROW_DRAG_HANDLE_CLASS =
  'absolute top-1/2 right-0.5 z-1 inline-flex -translate-y-1/2 cursor-grab touch-none items-center ' +
  'text-foreground-de-emp opacity-0 transition-opacity duration-150 group-hover/gutter:opacity-100!';

/**
 * The column grip, revealed by hovering the header cell. No `focus-visible` reveal: the grip is a
 * `span` with no tab stop, so the variant could never match — the keyboard route to reordering is
 * the context menu's move entries.
 */
export const COLUMN_DRAG_HANDLE_CLASS =
  'inline-flex shrink-0 cursor-grab touch-none items-center text-foreground-de-emp opacity-0 ' +
  'transition-opacity duration-150 group-hover/header:opacity-100!';

/**
 * A row's own action (run, update expected, delete), on a ghost `size="3xs"` icon `Button`. Apollo's ghost and link
 * variants recolour text under the Future themes, so a colour that must hold there needs a `future:` twin.
 */
const ROW_ACTION_BUTTON_CLASS =
  'text-foreground-de-emp hover:bg-background-hover hover:text-foreground [&_svg]:size-3.5';

/**
 * A row action that is disabled while its test runs. It keeps its pointer events: Apollo's disabled look drops them,
 * which hid the tooltip and let a click fall through to the cell and select the row. So it restates the disabled look
 * itself, in colour rather than Apollo's opacity, which would also fade the tooltip trigger.
 */
export const LOCKABLE_ROW_ACTION_BUTTON_CLASS =
  `${ROW_ACTION_BUTTON_CLASS} disabled:pointer-events-auto disabled:cursor-default disabled:opacity-100 disabled:bg-transparent ` +
  'disabled:text-foreground-disable future:disabled:text-foreground-disable';

/** The destructive row action. */
export const DELETE_ROW_BUTTON_CLASS = `${ROW_ACTION_BUTTON_CLASS} hover:text-error-text future:hover:text-error-text`;

/** The decision table's delete, revealed on its own; the tests panel reveals its actions as a group. */
export const DELETE_ROW_CLASS = `${DELETE_ROW_BUTTON_CLASS} opacity-0 transition-opacity duration-150 group-hover/row:opacity-100! focus-visible:opacity-100!`;

/**
 * The cell surface: one row height minus its bottom border, border-box so a row can never grow.
 *
 * Sized from `--grid-row-height`, which the grid publishes on the table from its `rowHeightPx`.
 * The vertical padding centres the text by subtracting that border and the line box below, so the
 * `17px` here and the `leading-[17px]` must stay the same number.
 */
export const CELL_SURFACE_CLASS =
  'box-border h-[calc(var(--grid-row-height)_-_1px)] truncate px-2 py-[calc((var(--grid-row-height)_-_1px_-_17px)_/_2)] leading-[17px]';

/** The range tint is a background image so it composes over a pinned cell's opaque background. */
export const IN_RANGE_CLASS =
  'bg-[image:linear-gradient(color-mix(in_srgb,var(--color-primary)_10%,transparent),color-mix(in_srgb,var(--color-primary)_10%,transparent))]';

/** The transient note's visible form, for the cases a sighted user must not miss. */
export const LIVE_NOTE_CLASS =
  'sticky bottom-2 left-2 z-5 w-fit max-w-[calc(100%-16px)] rounded border border-border-de-emp bg-background-secondary ' +
  'px-2.5 py-1.5 text-xs text-foreground shadow-md';

/**
 * The footer row's add action, on a `link` `Button`. The `<td>` spans the whole table, so the button alone is stuck to
 * the container's left edge — otherwise it scrolled off with the columns on a wide table.
 */
export const FOOTER_ACTION_CLASS =
  'sticky left-0 block w-fit h-auto px-2 py-1.5 font-normal future:text-primary future:hover:text-primary';

/**
 * The built-in plain cell editor. A raw `<input>` on purpose: it is the cell's own surface, and Apollo's `Input` is a
 * form field whose border, height and padding would all have to be undone to fit inside the row. Border-box at the
 * cell surface height, or the padding grows the edited row past the height every spacer and scroll target assumes.
 */
export const CELL_EDITOR_CLASS =
  'box-border h-[calc(var(--grid-row-height)_-_1px)] w-full border-0 bg-background px-2 ' +
  'py-[calc((var(--grid-row-height)_-_1px_-_17px)_/_2)] [font:inherit] text-foreground outline-none';
