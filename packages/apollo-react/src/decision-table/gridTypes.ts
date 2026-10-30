import type React from 'react';

/** Where the selection goes once an edit commits: Enter goes down, Tab right, Shift+Tab left. */
export type CellCommitMove = 'down' | 'right' | 'left' | 'none';

/** A cell edge, for the borders a band's body cells opt out of. */
export type CellEdge = 'top' | 'right' | 'bottom' | 'left';

/**
 * The grouped-header a column belongs to. Contiguous columns sharing a group `id` render as one
 * spanned group cell; columns without a group get a plain gutter above them. Hoist each group to a
 * single shared object: runs merge by `id` and render the first column's group, so two objects
 * with one id would silently drop the second's label, tone and cellProps.
 */
export interface GridColumnGroup {
  /** Run-grouping identity — adjacent columns with the same id share one group cell. */
  id: string;
  label: string;
  /** Classes mixed into the group cell for its colour identity — open, so consumers name their own palette. */
  toneClassName?: string;
  /**
   * Renders the band cell's content. Called per rendered run — a spacer or a pinning boundary can
   * split a band across cells — with `isFirstRunOfGroup` marking the one that opens it.
   */
  renderLabel?: (run: {
    first: GridColumn;
    firstFlexIndex: number;
    isFirstRunOfGroup: boolean;
    label: string;
  }) => React.ReactNode;
  /**
   * Borders the BODY cells of this band leave off BETWEEN themselves, so its columns read as one
   * field separated by their shared tint rather than by internal lines.
   * The band's own outer edges are never dropped
   * Body cells only; the band row and the column headers keep every border they would draw. Hoist
   * the array with the group — it reaches every mounted row.
   */
  omitCellBorders?: readonly CellEdge[];
  /** Draws the grid's inert separator band immediately before this group's first column. */
  separatorBefore?: boolean;
  /**
   * Extra attributes for the group `<th>` (testids, menu-delegation data attributes). Called per
   * rendered run with the run's first column and its flex index, since a window spacer can split
   * a group into two cells — the index keeps each rendered cell's attributes (e.g. testids) unique.
   */
  cellProps?: (
    firstColumn: GridColumn,
    firstFlexIndex: number
  ) => React.ThHTMLAttributes<HTMLTableCellElement> & Record<`data-${string}`, string | undefined>;
}

/** One flexible (auto-fit, resizable) column of the grid. */
export interface GridColumn {
  /** Width/resize key — must be unique across the grid. */
  id: string;
  /** Accessible name, used by the grid's resize handle label. */
  name: string;
  defaultWidth: number;
  group?: GridColumnGroup;
}

/**
 * One mounted column of the horizontal window, or a spacer standing in for columns scrolled out of
 * view. `flexIndex` addresses `columns` (and the width arrays); `windowIndex` is the position among
 * the non-pinned columns (the windowed axis' space), or null for pinned columns.
 */
export type VisibleGridColumn =
  | {
      type: 'column';
      column: GridColumn;
      flexIndex: number;
      windowIndex: number | null;
      omitBorders: readonly CellEdge[];
    }
  | { type: 'spacer'; widthPx: number; coveredIds: string[]; separatorPx: number }
  | { type: 'separator'; widthPx: number; beforeColumnId: string };

/**
 * The grid's imperative surface, for the event-time needs a declarative prop cannot serve:
 * positioning overlays, starting reorder drags from consumer-rendered affordances, and keyboard
 * scroll-into-view. Every geometry member is a getter reading live measurements.
 */
export interface GridHandle {
  /** The scroll container, for consumer-owned positioning and DOM queries. */
  container: () => HTMLDivElement | null;
  /** Measured sticky header height. */
  headerHeight: () => number;
  /** Content width before data column 0: the leading gutter plus the live pinned-column widths. */
  columnLeading: () => number;
  /** Prefix sums over the windowed columns' live widths: item i spans [offsets[i], offsets[i+1]). */
  columnOffsets: () => number[];
  /** The table's current total width, following live column resizes. */
  totalWidth: () => number;
  /** Scrolls the container so the row is fully visible — not merely mounted in the overscan. */
  scrollRowIntoView: (rowIndex: number) => void;
  /** Scrolls the container so the windowed column is fully visible. */
  scrollColumnIntoView: (windowIndex: number) => void;
  /** Arms a row drag-reorder from a consumer-rendered grab handle. */
  startRowDrag: (rowIndex: number, event: React.PointerEvent) => void;
  /**
   * Arms a column drag-reorder inside one column group (see `columnGroupSizes`). `indexInGroup`
   * is the column's position within its group. A no-op when the grid declares no groups.
   */
  startColumnDrag: (groupIndex: number, indexInGroup: number, event: React.PointerEvent) => void;
  /** The clipboard operations; every one a no-op unless a `clipboard` prop is configured. */
  clipboard: GridClipboardActions;
}

/** A cell's position in the grid's own coordinates; what a column means is the consumer's business. */
export interface GridPosition {
  row: number;
  col: number;
}

/** A rectangular selection: where it started and where it currently reaches. */
export interface GridRange {
  anchor: GridPosition;
  focus: GridPosition;
}

/** One cell of a batched clipboard write, in grid coordinates — the consumer maps it to its model. */
export interface GridCellWrite extends GridPosition {
  text: string;
}

/** What a paste could not do, for the consumer's announcement. */
export interface GridPasteOutcome {
  clampedRows: number;
  clampedColumns: number;
  /** Cells dropped because `canWriteAt` refused them. */
  skippedCells: number;
}

/**
 * Spreadsheet clipboard over a rectangular selection: Ctrl+C / X / V plus the menu equivalents.
 * Pass it to {@link DecisionTableProps.clipboard}; omit it and the grid has no clipboard at all.
 */
export interface GridClipboardProps {
  /** The live selection. Nothing copies, pastes or clears while this is null. */
  range: GridRange | null;
  /** An open cell editor owns its own clipboard semantics, so the grid stands down. */
  editing: boolean;
  readOnly?: boolean;
  /** The text a copy carries for a position. */
  textAt: (row: number, col: number) => string;
  /** Whether a position accepts this text; refused cells are skipped and counted, never guessed at. */
  canWriteAt?: (row: number, col: number, text: string) => boolean;
  /** What a clear stores in a column. Defaults to empty. */
  blankTextAt?: (col: number) => string;
  /** Most rows a growing paste may append; omit for a grid that never grows. */
  maxAppendRows?: number;
  /** Applies one batch. The consumer maps coordinates to its own model and dispatches once. */
  onWrite: (writes: GridCellWrite[], appendRows: number) => void;
  /** Announces what a paste clamped or skipped; the grid composes no prose of its own. */
  onPasteOutcome?: (outcome: GridPasteOutcome) => void;
  /** Reports a clipboard the browser refused, so the consumer can tell the user. */
  onClipboardBlocked?: (reason: 'copy' | 'paste') => void;
}

/**
 * The clipboard operations, for a consumer-built menu or shortcut. No labels: the grid renders no
 * menu, so naming these is the consumer's business — and a replacement grid brings its own.
 */
export interface GridClipboardActions {
  copy: () => void;
  cut: () => void;
  /** `grow` appends rows for a block taller than the grid, up to `maxAppendRows`. */
  paste: (options?: { grow?: boolean }) => void;
  /** Clears the selection's writable cells — also the Delete/Backspace path. Returns whether
   * anything was clearable, so a consumer's Delete handler knows to claim the key. */
  clear: () => boolean;
}

/** The grid's own strings — the consumer passes localized values; the grid ships no English. */
export interface GridLabels {
  /** Aria label of a column's resize handle. */
  resizeColumn: (columnName: string) => string;
  /** Tooltip on the resize handle (double-click / Enter resets to auto-fit). */
  resetColumnWidth: string;
  /** The row-number gutter's header content; "#" (locale-neutral) when omitted. */
  rowNumberHeader?: string;
}
