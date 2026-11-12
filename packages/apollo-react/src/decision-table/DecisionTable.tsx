import { cn } from '@uipath/apollo-wind';
import { ArrowRight } from 'lucide-react';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import { BODY_ROW_HEIGHT_PX, MIN_COLUMN_WIDTH } from './constants';
import {
  DRAG_PREVIEW_CLASS,
  DRAG_SOURCE_CLASS,
  DROP_INDICATOR_Z_CLASS,
  FROZEN_RIGHT_GROUP_CELL_CLASS,
  GRID_FRAME_CLASS,
  GRID_PANE_CLASS,
  GROUP_CELL_CLASS,
  GROUP_GUTTER_CLASS,
  HEADER_CELL_CLASS,
  PINNED_HEADER_Z_CLASS,
  RESIZE_HANDLE_BELOW_INSERT_CLASS,
  RESIZE_HANDLE_CLASS,
  ROW_HOVER_OVERLAY_CLASS,
  SEPARATOR_GROUP_CELL_CLASS,
  SEPARATOR_HEADER_CELL_CLASS,
  TABLE_EDGE_CLASS,
  TABLE_HUG_EDGE_CLASS,
  TOP_LEFT_CORNER_CELL_CLASS,
} from './gridStyles';
import type {
  GridClipboardProps,
  GridColumn,
  GridColumnGroup,
  GridGroupRun,
  GridHandle,
  GridLabels,
  VisibleGridColumn,
} from './gridTypes';
import { MarkGlyph } from './MarkGlyph';
import {
  bandGeometry,
  buildColumnPreview,
  buildRowPreview,
  type DragReorderState,
  dragShiftPx,
  dropIndex,
  gapStartPx,
  useDragReorder,
} from './useDragReorder';
import { useGridClipboard } from './useGridClipboard';
import { type GridLayout, useGridLayout } from './useGridLayout';
import { useRowHover } from './useRowHover';

/** The slide of a unit a drag passes, and of the dragged one into its gap. */
const DRAG_SHIFT_TRANSITION = 'transform 150ms ease';

/** Where a data column sits among the mounted ones, which is its cell's place in every row; -1 when unmounted. */
const visiblePositionOf = (visibleColumns: VisibleGridColumn[], flexIndex: number) =>
  visibleColumns.findIndex(
    (visible) => visible.type === 'column' && visible.flexIndex === flexIndex
  );

/** What a consumer's header cell receives beyond its column def. */
export interface HeaderCellContext {
  /** The grid's resize grab strip, or null when columns are not resizable — place it inside the returned `<th>`. */
  resizeHandle: React.ReactNode;
  /** Set for pinned columns: the sticky left offset their header must carry. */
  pinnedLeftPx?: number;
  /** Set for pinned columns: the class lifting their header so the scrolling headers pass under it. */
  pinnedClassName?: string;
}

export interface DecisionTableProps {
  /**
   * Must be referentially stable across unrelated renders (memoize it): the mounted-columns
   * window keys on this array's identity, and that window feeds every row's memo.
   */
  columns: GridColumn[];
  rowCount: number;
  /** Fixed body row height every window and drop target does arithmetic on. */
  rowHeightPx?: number;
  /** Width of the leading row-number gutter; 0 (the default) renders no gutter. */
  leadingColumnWidth?: number;
  /** Width of the trailing fixed column (action gutter / result column); 0 renders none. */
  trailingColumnWidth?: number;
  /** How many leading columns stay mounted and sticky over the viewport's left edge. */
  pinnedColumnCount?: number;
  /**
   * The consumer's persisted width overrides by column id — `{}` when nothing is stored, a
   * promise of the map (the table stays hidden until it settles, so a reload never flashes the
   * default widths), or `null` while the consumer has not started loading yet (also hidden).
   * Persistence stays the consumer's; only render timing lives in the grid.
   */
  initialColumnWidths?: Record<string, number> | Promise<Record<string, number>> | null;
  /** Reports the full override map after every user resize/reset/prune; the consumer persists it. */
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  /** Shows the resize handles and enables keyboard/drag resizing. */
  columnsResizable?: boolean;
  /** The header edges also carry an insert "+" at the top, so the resize handles start below it. */
  headerEdgeInserts?: boolean;
  /**
   * Sizes of the contiguous column-reorder groups, counted over the WINDOWED (non-pinned) columns
   * from the first one — e.g. `[inputCount, outputCount]`. A drag never crosses a group; columns
   * past the last group are not draggable. Omitted or empty, column drags are disabled. Sizes,
   * not fenceposts: there is no ascending / starts-at-0 / ends-at-count contract to get wrong.
   */
  columnGroupSizes?: number[];
  /** Row drop handler; row drags start from the handle's `startRowDrag`. */
  onRowMove?: (from: number, to: number) => void;
  /** Column drop handler — `from`/`to` are indices within the dragged group. */
  onColumnMove?: (groupIndex: number, from: number, to: number) => void;
  /** Row index to keep mounted through window shifts (the row being edited), or null. */
  retainedRowIndex?: number | null;
  /** Window-space column index to keep mounted (the column being edited), or null. */
  retainedColumnIndex?: number | null;
  /** Renders one flexible column's header `<th>` (required — the grid has no default header). */
  renderHeaderCell: (column: GridColumn, context: HeaderCellContext) => React.ReactNode;
  /**
   * Renders one body `<tr>`, keyed by the consumer (row identity must survive window shifts).
   * `visibleColumns` is the mounted horizontal window — referentially stable while the window
   * holds, so it can participate in a row memo.
   *
   * The drag preview, the parting rows and the row hover find rows in the DOM, so each `<tr>`
   * carries `aria-rowindex` (header rows first, then 1-based rows), and each data row a direct-child
   * cell with `data-row` (`GridCell` sets it; a row-number cell sets its own). A row without them
   * still drags, but shows no preview, parting or hover, and its cells stay put while a column drag
   * parts the header.
   */
  renderRow: (rowIndex: number, visibleColumns: VisibleGridColumn[]) => React.ReactNode;
  /** The trailing add-row `<tr>`, when the grid offers one; receives the full-row colSpan. */
  renderFooterRow?: (colSpan: number) => React.ReactNode;
  /**
   * The leading gutter's header: one top-left corner cell spanning every header row, holding this
   * content. Defaults to "#". Rendered only with a leading column (`leadingColumnWidth > 0`).
   */
  topLeftCorner?: React.ReactNode;
  /**
   * A mark on the table as a whole, for issues with no row, cell or column to sit on (a decision
   * with no rules, an output type its hit policy cannot return). Drawn in the top-left corner under
   * `topLeftCorner`, its tone's glyph carrying `title` as `data-mark-title` and as its accessible
   * name, as every mark does. Drawn only with a leading column.
   */
  tableMark?: { tone: 'error' | 'warning'; title: string };
  /** The trailing fixed column's header `<th>` (rendered only when the layout reserves its width). */
  trailingHeaderCell?: React.ReactNode;
  /** The trailing fixed column's group-row cell; defaults to a pinned empty gutter. */
  trailingGroupCell?: React.ReactNode;
  /**
   * Spreadsheet copy / cut / paste / clear over a rectangular selection. Omit it and the grid has
   * no clipboard; the menu commands and the Delete path come back on the {@link GridHandle}.
   */
  clipboard?: GridClipboardProps;
  /** Accessible name of the `<table>`. */
  tableAriaLabel?: string;
  /**
   * Merged onto the scroll container — the consumer's keyboard/clipboard/pointer/menu handlers.
   * A `data-testid` here overrides the container's default (`dataTestId`); derived ids keep the prefix.
   */
  containerProps?: React.HTMLAttributes<HTMLDivElement> &
    Record<`data-${string}`, string | undefined>;
  /** Container testid; derived ids: `-resize-{columnId}`, `-row-spacer`, `-drop-indicator`.
   * Required — two grids sharing a default would collide on every derived id. */
  dataTestId: string;
  /** The grid's own few strings — required, so a localized consumer cannot silently ship English. */
  labels: GridLabels;
  /** Overlays rendered inside the scroll container (menus, notes, dialogs). */
  children?: React.ReactNode;
}

type ColumnRun =
  | (GridGroupRun & {
      type: 'group';
      group: GridColumnGroup;
      count: number;
      pinnedLeftPx?: number;
    })
  | { type: 'gutter'; count: number; firstFlexIndex: number; pinnedLeftPx?: number }
  | { type: 'spacer'; widthPx: number; firstCoveredId: string }
  | { type: 'separator'; widthPx: number; beforeColumnId: string };

/** Each group's own first and last flex index. Depends only on the columns, not the window. */
type GroupBounds = ReadonlyMap<string, { first: number; last: number }>;

export const groupBoundsOf = (columns: GridColumn[]): GroupBounds => {
  const bounds = new Map<string, { first: number; last: number }>();
  columns.forEach((column, flexIndex) => {
    if (!column.group) return;
    const groupBounds = bounds.get(column.group.id);
    if (groupBounds) groupBounds.last = flexIndex;
    else bounds.set(column.group.id, { first: flexIndex, last: flexIndex });
  });
  return bounds;
};

/** Contiguous same-group runs of the mounted columns, for the group header's colSpans. */
export const groupColumnRuns = (
  groupBounds: GroupBounds,
  visibleColumns: VisibleGridColumn[],
  pinnedLeftPxOf: (flexIndex: number) => number | undefined
): ColumnRun[] => {
  const runs: ColumnRun[] = [];
  // Which bands have already opened. `firstFlexIndex` cannot answer this: it is the first *mounted*
  // column of the run, so a band scrolled past its own start reports an index that is not its start.
  const openedGroups = new Set<string>();
  for (const visible of visibleColumns) {
    if (visible.type === 'spacer') {
      runs.push({
        type: 'spacer',
        widthPx: visible.widthPx,
        firstCoveredId: visible.coveredIds[0]!,
      });
      continue;
    }
    // Its own run, which also ends the group before it — the band is exactly the boundary.
    if (visible.type === 'separator') {
      runs.push({
        type: 'separator',
        widthPx: visible.widthPx,
        beforeColumnId: visible.beforeColumnId,
      });
      continue;
    }
    const { column, flexIndex } = visible;
    const last = runs[runs.length - 1];
    const pinnedLeftPx = pinnedLeftPxOf(flexIndex);
    // A pinned/unpinned boundary splits a run — group and gutter alike: one spanned cell cannot
    // be half sticky, and a pinned run carries its sticky left offset.
    const samePinning = (previous: { pinnedLeftPx?: number }) =>
      (previous.pinnedLeftPx !== undefined) === (pinnedLeftPx !== undefined);
    if (!column.group) {
      if (last?.type === 'gutter' && samePinning(last)) {
        last.count += 1;
      } else {
        runs.push({ type: 'gutter', count: 1, firstFlexIndex: flexIndex, pinnedLeftPx });
      }
      continue;
    }
    if (last?.type === 'group' && last.group.id === column.group.id && samePinning(last)) {
      last.count += 1;
    } else {
      runs.push({
        type: 'group',
        group: column.group,
        first: column,
        firstFlexIndex: flexIndex,
        count: 1,
        pinnedLeftPx,
        isFirstRunOfGroup: !openedGroups.has(column.group.id),
        startsGroup: false,
        endsGroup: false,
      });
      openedGroups.add(column.group.id);
    }
  }
  markGroupEdges(groupBounds, runs);
  return runs;
};

/** Whether each run really holds its group's first or last column. */
const markGroupEdges = (groupBounds: GroupBounds, runs: ColumnRun[]) => {
  for (const run of runs) {
    if (run.type !== 'group') continue;
    const bounds = groupBounds.get(run.group.id);
    run.startsGroup = run.firstFlexIndex === bounds?.first;
    run.endsGroup = run.firstFlexIndex + run.count - 1 === bounds?.last;
  }
};

/**
 * The shared grid: a focusable scroll container, a fixed-layout table whose colgroup follows the
 * live column widths, a sticky two-row header (group row + column headers, both windowed with the
 * columns), a windowed body the consumer renders rows into, and drag-reorder for rows and columns.
 * Widths, virtualization and drags are owned here; all model knowledge stays with the consumer,
 * which reaches the grid's live geometry through the imperative `GridHandle`.
 */
export const DecisionTable = forwardRef<GridHandle, DecisionTableProps>(
  (
    {
      columns,
      rowCount,
      rowHeightPx = BODY_ROW_HEIGHT_PX,
      leadingColumnWidth = 0,
      trailingColumnWidth = 0,
      pinnedColumnCount = 0,
      initialColumnWidths = {},
      onColumnWidthsChange,
      columnsResizable = false,
      headerEdgeInserts = false,
      columnGroupSizes,
      onRowMove,
      onColumnMove,
      retainedRowIndex = null,
      retainedColumnIndex = null,
      renderHeaderCell,
      renderRow,
      renderFooterRow,
      topLeftCorner = '#',
      tableMark,
      trailingHeaderCell,
      trailingGroupCell,
      tableAriaLabel,
      clipboard,
      containerProps,
      dataTestId,
      labels,
      children,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    // The drag hook needs the layout's live geometry while the layout needs the drag's retention —
    // broken by reading the layout through a ref the getters close over. Grid-internal only.
    const layoutRef = useRef<GridLayout | null>(null);
    const headerHeight = useCallback(() => layoutRef.current?.headerHeight() ?? 0, []);
    const columnLeading = useCallback(() => layoutRef.current?.columnLeading() ?? 0, []);
    const columnOffsets = useCallback(() => layoutRef.current?.columnOffsets ?? [], []);
    const columnWidth = useCallback(
      (dataIndex: number) => {
        const flexIndex = (layoutRef.current?.pinnedColumnCount ?? 0) + dataIndex;
        return layoutRef.current?.widths[flexIndex] ?? columns[flexIndex]?.defaultWidth ?? 0;
      },
      [columns]
    );

    const onRowMoveRef = useRef(onRowMove);
    onRowMoveRef.current = onRowMove;
    const onColumnMoveRef = useRef(onColumnMove);
    onColumnMoveRef.current = onColumnMove;

    // Fenceposts derived from the group sizes: group i spans [boundaries[i], boundaries[i + 1])
    // in windowed-column space. No sizes -> a single fencepost -> no group to drag within.
    const sizesKey = (columnGroupSizes ?? []).join(',');
    // Capped at the unpinned column count, the space the groups index: group sizes that overcount
    // would otherwise let a drag start on, or drop onto, a column the table does not have.
    const windowedColumnCount = Math.max(0, columns.length - pinnedColumnCount);
    // biome-ignore lint/correctness/useExhaustiveDependencies: sizesKey is `columnGroupSizes` by value
    const boundaries = React.useMemo(() => {
      const out = [0];
      for (const size of columnGroupSizes ?? []) {
        out.push(Math.min(out[out.length - 1]! + size, windowedColumnCount));
      }
      return out;
    }, [sizesKey, windowedColumnCount]);
    const boundariesRef = useRef(boundaries);
    boundariesRef.current = boundaries;
    const previewHostRef = useRef<HTMLDivElement>(null);
    const dropIndicatorRef = useRef<HTMLDivElement>(null);
    const dragSourcesRef = useRef<HTMLElement[]>([]);
    // A column's copy and lines are drawn in content space over the sticky header, so they are cut
    // at the band row's foot wherever the table is scrolled: the bands stay clear above the dragged
    // header, and the body rows the copy carries never show through the band row. The other edges
    // reach past the copy, so its shadow stays.
    const clipColumnDrag = useCallback((axis: DragReorderState['axis'] | null) => {
      const container = containerRef.current;
      const head = container?.querySelector<HTMLTableElement>(':scope > table')?.tHead;
      const labelRow = head?.rows[head.rows.length - 1];
      const clipPath =
        axis === 'column' && container
          ? `inset(${container.scrollTop + (labelRow?.offsetTop ?? 0)}px -32px -32px)`
          : '';
      for (const layer of [previewHostRef.current, dropIndicatorRef.current]) {
        if (layer) {
          layer.style.clipPath = clipPath;
        }
      }
    }, []);
    // What finding a row's or column's cells needs, set further down from this render; read only at drag time.
    const dragLayoutRef = useRef<{
      headerRowCount: number;
      visibleColumns: VisibleGridColumn[];
      pinnedCount: number;
      bodyLeading: number;
      headerLeading: number;
    } | null>(null);
    // Every row or cell a drag has moved, with how far.
    const shiftedRef = useRef(new Map<HTMLElement, number>());
    // Set by a drop, whose reorder puts every moved unit where it is drawn, until the drag state clears.
    const settledRef = useRef(false);
    const snapDragShifts = useCallback(() => {
      for (const element of shiftedRef.current.keys()) {
        element.style.transition = '';
        element.style.transform = '';
      }
      shiftedRef.current.clear();
      settledRef.current = true;
    }, []);
    // Copies the dragged unit's mounted cells into the preview and blanks them in the table. Rebuilt
    // whenever the table renders mid-drag, so rows or columns a scroll mounts join the copy.
    const fillPreview = useCallback(
      (state: DragReorderState): boolean => {
        const host = previewHostRef.current;
        const shape = dragLayoutRef.current;
        if (!host || !shape) {
          return false;
        }
        const dataIndex =
          state.axis === 'column' ? (boundariesRef.current[state.groupIndex] ?? 0) + state.from : 0;
        const position =
          state.axis === 'column'
            ? visiblePositionOf(shape.visibleColumns, shape.pinnedCount + dataIndex)
            : 0;
        const preview =
          state.axis === 'row'
            ? buildRowPreview(containerRef.current, state.from + shape.headerRowCount + 1)
            : position < 0
              ? null
              : buildColumnPreview(containerRef.current, {
                  headerCellIndex: position + shape.headerLeading,
                  bodyCellIndex: position + shape.bodyLeading,
                  widthPx: columnWidth(dataIndex),
                });
        if (!preview) {
          return false;
        }
        host.replaceChildren(preview.table);
        for (const source of preview.sources) {
          source.setAttribute('data-drag-source', '');
        }
        dragSourcesRef.current = preview.sources;
        return true;
      },
      [columnWidth]
    );
    // The copy of the dragged unit, held where the pointer is. DOM writes rather than state: a drag
    // frame must not re-render the memoized rows.
    const onDragMove = useCallback(
      (state: DragReorderState, px: number | null) => {
        const host = previewHostRef.current;
        const shape = dragLayoutRef.current;
        if (!host || !shape) {
          return;
        }
        if (px === null) {
          host.replaceChildren();
          host.style.transform = '';
          clipColumnDrag(null);
          for (const source of dragSourcesRef.current) {
            source.removeAttribute('data-drag-source');
          }
          dragSourcesRef.current = [];
          return;
        }
        if (!host.firstChild && !fillPreview(state)) {
          return;
        }
        host.style.transform = state.axis === 'row' ? `translateY(${px}px)` : `translateX(${px}px)`;
        clipColumnDrag(state.axis);
      },
      [fillPreview, clipColumnDrag]
    );
    const { dragState, startRowDrag, startColumnDrag } = useDragReorder({
      containerRef,
      headerHeight,
      columnLeading,
      columnOffsets,
      columnWidth,
      rowHeightPx,
      rowCount,
      columnGroupBoundaries: boundaries,
      onDropRow: (from, to) => {
        snapDragShifts();
        onRowMoveRef.current?.(from, to);
      },
      onDropColumn: (groupIndex, from, to) => {
        snapDragShifts();
        onColumnMoveRef.current?.(groupIndex, from, to);
      },
      onDragMove,
    });

    // A dragged unit stays mounted through the drag's own scrolling, merged with the consumer's
    // retention (its editing cell). The dragged column's window index is its group's fencepost
    // plus its index within the group.
    const dragRetainedRow = dragState?.axis === 'row' ? dragState.from : null;
    const dragRetainedColumn =
      dragState?.axis === 'column'
        ? (boundaries[dragState.groupIndex] ?? 0) + dragState.from
        : null;

    const layout = useGridLayout({
      columns,
      rowCount,
      rowHeightPx,
      leadingColumnWidth,
      trailingColumnWidth,
      pinnedColumnCount,
      initialColumnWidths,
      onColumnWidthsChange,
      containerRef,
      retainedRowIndex: retainedRowIndex ?? dragRetainedRow,
      retainedColumnIndex: retainedColumnIndex ?? dragRetainedColumn,
    });
    layoutRef.current = layout;

    const { visibleColumns, widths, totalWidth } = layout;
    const hasTrailing = trailingColumnWidth > 0;
    const hasLeading = leadingColumnWidth > 0;
    const groupBounds = React.useMemo(() => groupBoundsOf(columns), [columns]);
    // A grid with no grouped column (and no trailing group cell) gets no group row at all — a
    // flat grid must not pay a blank band-height strip. Consumers with groups keep two header rows, so
    // their header cells stick below the band row and body rows number from aria-rowindex 3; a flat
    // grid's header cells must stick at top-0 and its rows number from 2.
    const hasGroupRow =
      columns.some((column) => column.group !== undefined) || trailingGroupCell !== undefined;
    const headerRowCount = hasGroupRow ? 2 : 1;
    const topLeftCornerCell = hasLeading && (
      <th
        rowSpan={headerRowCount}
        className={TOP_LEFT_CORNER_CELL_CLASS}
        scope="col"
        data-testid={`${dataTestId}-top-left-corner`}
      >
        {tableMark ? (
          // The content and the mark centred in the corner as one group.
          <div className="flex flex-col items-center justify-center gap-1">
            {topLeftCorner}
            <span
              role="img"
              className="inline-flex size-5 items-center justify-center"
              aria-label={tableMark.title}
              data-mark-title={tableMark.title}
              data-tone={tableMark.tone}
              data-testid={`${dataTestId}-table-mark`}
            >
              <MarkGlyph tone={tableMark.tone} className="size-3" />
            </span>
          </div>
        ) : (
          topLeftCorner
        )}
      </th>
    );
    const bodyLeading = hasLeading ? 1 : 0;
    // Cells before the first data header in the label row. With a band row, the corner spans both
    // header rows from there, so the label row has no leading cell of its own.
    const headerLeading = hasLeading && !hasGroupRow ? 1 : 0;
    dragLayoutRef.current = {
      headerRowCount,
      visibleColumns,
      pinnedCount: layout.pinnedColumnCount,
      bodyLeading,
      headerLeading,
    };

    // Slides the units a drag passes out of its way and the dragged one into the gap, by DOM writes on
    // the mounted rows and cells, so a drag re-renders no row. Re-run on every render, as a scroll
    // mounts new ones.
    useLayoutEffect(() => {
      const shifted = shiftedRef.current;
      if (!dragState || settledRef.current) {
        settledRef.current = dragState !== null;
        // Escape, or a release back where it started: everything slides home.
        for (const [element, shift] of shifted) {
          if (shift !== 0) {
            element.style.transition = DRAG_SHIFT_TRANSITION;
            element.style.transform = '';
          }
        }
        shifted.clear();
        return;
      }
      // Before the shifts below, which the copy must not take on. Only once the first move has placed it.
      if (previewHostRef.current?.firstChild) {
        fillPreview(dragState);
      }
      // The lines mount a render after the drag starts, after its first move was clipped.
      clipColumnDrag(dragState.axis);
      const table = containerRef.current?.querySelector(':scope > table');
      if (!(table instanceof HTMLTableElement)) {
        return;
      }
      const to = dropIndex(dragState.from, dragState.boundary);
      const placed = new Set<HTMLElement>();
      const place = (element: HTMLElement, shift: number, axis: 'X' | 'Y') => {
        placed.add(element);
        const previous = shifted.get(element);
        if (previous === shift) {
          return;
        }
        // One mounted mid-drag appears in place; one already showing slides.
        element.style.transition = previous === undefined ? '' : DRAG_SHIFT_TRANSITION;
        element.style.transform = shift === 0 ? '' : `translate${axis}(${shift}px)`;
        shifted.set(element, shift);
      };
      const bodyRows = Array.from(table.tBodies[0]?.rows ?? []).filter((row) =>
        row.hasAttribute('aria-rowindex')
      );
      if (dragState.axis === 'row') {
        const rowSize = () => rowHeightPx;
        for (const row of bodyRows) {
          const index = Number(row.getAttribute('aria-rowindex')) - headerRowCount - 1;
          if (index >= 0 && index < rowCount) {
            place(row, dragShiftPx(index, dragState.from, to, rowSize), 'Y');
          }
        }
      } else {
        const start = boundaries[dragState.groupIndex] ?? 0;
        const end = boundaries[dragState.groupIndex + 1] ?? start;
        const { sizeAt } = bandGeometry(layout.columnOffsets, columnWidth, start);
        const headerRow = table.tHead?.rows[table.tHead.rows.length - 1];
        // The full-width footer holds no column.
        const cellRows = bodyRows.filter((row) => row.cells.length > 1);
        for (let index = 0; index < end - start; index++) {
          const position = visiblePositionOf(
            visibleColumns,
            layout.pinnedColumnCount + start + index
          );
          if (position < 0) {
            continue;
          }
          const shift = dragShiftPx(index, dragState.from, to, sizeAt);
          const header = headerRow?.cells[position + headerLeading];
          if (header) {
            place(header, shift, 'X');
          }
          for (const row of cellRows) {
            const cell = row.cells[position + bodyLeading];
            if (cell) {
              place(cell, shift, 'X');
            }
          }
        }
      }
      // Off the drag's path now: a drag on the other axis replaced this one, or the row left the table.
      for (const element of shifted.keys()) {
        if (!placed.has(element)) {
          element.style.transition = '';
          element.style.transform = '';
          shifted.delete(element);
        }
      }
    });

    // Moved as the units are, by a transform on the same transition, so the lines keep pace with the gap.
    const gapFrame = { top: 0, left: 0, transition: DRAG_SHIFT_TRANSITION };
    const dropGapStyle = (state: NonNullable<typeof dragState>): React.CSSProperties => {
      const to = dropIndex(state.from, state.boundary);
      if (state.axis === 'row') {
        // Rows share one height, so the gap is the drop index's own row.
        return {
          ...gapFrame,
          transform: `translateY(${headerHeight() + to * rowHeightPx - 1}px)`,
          width: totalWidth,
          height: rowHeightPx + 2,
        };
      }
      const band = bandGeometry(
        layout.columnOffsets,
        columnWidth,
        boundaries[state.groupIndex] ?? 0
      );
      const left =
        columnLeading() + band.left + gapStartPx(state.from, to, band.offsetOf, band.sizeAt);
      return {
        ...gapFrame,
        transform: `translateX(${left - 1}px)`,
        width: band.sizeAt(state.from) + 2,
        height: headerHeight() + rowCount * rowHeightPx,
      };
    };

    // The grid owns its clipboard; the consumer only describes how its cells read and write.
    const gridClipboard = useGridClipboard(clipboard, { rowCount, columnCount: columns.length });

    useImperativeHandle(
      ref,
      () => ({
        container: () => containerRef.current,
        headerHeight,
        columnLeading,
        columnOffsets,
        totalWidth: () => layoutRef.current?.totalWidth ?? 0,
        scrollRowIntoView: (rowIndex: number) => layoutRef.current?.scrollRowIntoView(rowIndex),
        scrollColumnIntoView: (windowIndex: number) =>
          layoutRef.current?.scrollColumnIntoView(windowIndex),
        // Refused with nothing to apply the drop, which would snap the rows home instead of sliding them.
        startRowDrag: (rowIndex, event) =>
          onRowMoveRef.current !== undefined && startRowDrag(rowIndex, event),
        startColumnDrag: (groupIndex, indexInGroup, event) =>
          onColumnMoveRef.current !== undefined && startColumnDrag(groupIndex, indexInGroup, event),
        clipboard: gridClipboard.actions,
      }),
      [
        headerHeight,
        columnLeading,
        columnOffsets,
        startRowDrag,
        startColumnDrag,
        gridClipboard.actions,
      ]
    );

    // When a focused element inside the grid unmounts — an inline editor closing, a row's action
    // button scrolled out of the window — the browser silently drops focus to <body>, ejecting a
    // keyboard user. Removal fires no focusout while genuinely leaving does, so the flag survives
    // exactly the unmount case and focus returns to the grid.
    const focusWithinRef = useRef(false);
    useEffect(() => {
      if (focusWithinRef.current && document.activeElement === document.body) {
        containerRef.current?.focus();
      }
    });

    // `data-scrolled` shows the header's scroll shadow.
    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }
      // Written only on a change.
      const markScrolled = () => {
        const scrolled = container.scrollTop > 0 ? 'true' : 'false';
        if (container.dataset.scrolled !== scrolled) {
          container.dataset.scrolled = scrolled;
        }
      };
      markScrolled();
      container.addEventListener('scroll', markScrolled, { passive: true });
      return () => container.removeEventListener('scroll', markScrolled);
    }, []);

    const rowHoverRef = useRef<HTMLDivElement | null>(null);
    const rowTopPx = useCallback(
      (index: number) => headerHeight() + index * rowHeightPx,
      [headerHeight, rowHeightPx]
    );
    useRowHover(containerRef, rowHoverRef, rowTopPx, dragState === null);

    /** The sticky left offset of a pinned column: the gutter plus the pinned columns before it. */
    const pinnedLeftPxOf = (flexIndex: number): number | undefined => {
      if (flexIndex >= layout.pinnedColumnCount) {
        return undefined;
      }
      let offset = leadingColumnWidth;
      for (let index = 0; index < flexIndex; index += 1) {
        offset += widths[index] ?? 0;
      }
      return offset;
    };

    // A focusable grab strip on a resizable header's right edge; stops its own clicks so finishing a
    // drag or double-clicking to reset never selects the column underneath. As a focusable separator
    // it names the column it resizes and reports its width as a range: aria-valuemax is the table
    // width (a column can never exceed it) so assistive tech does not fall back to the implicit max
    // of 100 and clamp the announced value. Enter/Space reset it, as the tooltip and aria-label say.
    const renderResizeHandle = (column: GridColumn, width: number): React.ReactNode => {
      if (!columnsResizable) {
        return null;
      }
      // No handle on the last column.
      if (column.id === columns[columns.length - 1]?.id) {
        return null;
      }
      return (
        // biome-ignore lint/a11y/useSemanticElements: ARIA window-splitter — a focusable, value-carrying resize separator <hr> cannot express
        <span
          className={cn(RESIZE_HANDLE_CLASS, headerEdgeInserts && RESIZE_HANDLE_BELOW_INSERT_CLASS)}
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(width)}
          aria-valuemin={MIN_COLUMN_WIDTH}
          aria-valuemax={Math.round(totalWidth)}
          tabIndex={0}
          data-testid={`${dataTestId}-resize-${column.id}`}
          aria-label={labels.resizeColumn(column.name)}
          title={labels.resetColumnWidth}
          onPointerDown={(event) => layout.onResizeStart(column.id, event)}
          onKeyDown={(event) => layout.onResizeKeyDown(column.id, event)}
          // Both stopped: the handle sits inside a header that answers to click and double-click
          // itself (selection, inline rename), and resizing is never also one of those.
          onDoubleClick={(event) => {
            event.stopPropagation();
            layout.onResizeReset(column.id);
          }}
          onClick={(event) => event.stopPropagation()}
        />
      );
    };

    // Where the pinned columns end, for content that sticks just past them (a band's caption).
    const pinnedEdgePx =
      leadingColumnWidth +
      widths.slice(0, layout.pinnedColumnCount).reduce((sum, width) => sum + width, 0);
    const bodyColSpan = bodyLeading + visibleColumns.length + (hasTrailing ? 1 : 0);
    const {
      onFocus: consumerFocus,
      onBlur: consumerBlur,
      onKeyDown: consumerKeyDown,
      onCopy: consumerCopy,
      onCut: consumerCut,
      onPaste: consumerPaste,
      ...restContainerProps
    } = containerProps ?? {};
    // Composed rather than spread: `restContainerProps` lands last, so a consumer's clipboard
    // handler would otherwise replace the grid's and silently disable Ctrl+C/X/V. The grid acts
    // first and the consumer sees anything it did not claim.
    const composeClipboard =
      (
        mine: ((event: React.ClipboardEvent<HTMLDivElement>) => void) | undefined,
        theirs: typeof consumerCopy
      ) =>
      (event: React.ClipboardEvent<HTMLDivElement>) => {
        mine?.(event);
        if (!event.defaultPrevented) {
          theirs?.(event);
        }
      };

    const scrollContainer = (
      <div
        // The containing block for the drag-reorder drop indicator (content-space coordinates).
        // `select-none`: dragging across cells is a range gesture, so it must not also drag a
        // native text selection through the values. Editors re-enable it on their own cell.
        // While a row or column is carried, the grab hand holds over every cell it passes.
        className={cn(GRID_FRAME_CLASS, dragState && 'cursor-grabbing [&_*]:cursor-grabbing!')}
        ref={layout.attachContainer}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the grid surface takes focus for the consumer's spreadsheet navigation
        tabIndex={0}
        onFocus={(event) => {
          focusWithinRef.current = true;
          consumerFocus?.(event);
        }}
        onBlur={(event) => {
          // Focus genuinely leaving the grid clears the flag; a focused element being unmounted
          // fires no focusout at all, which is exactly the case the flag must survive.
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            focusWithinRef.current = false;
          }
          consumerBlur?.(event);
        }}
        onKeyDown={(event) => {
          // The clipboard's own keys first (Delete/Backspace clears the range), then the consumer's.
          if (!gridClipboard.handleKeyDown(event)) {
            consumerKeyDown?.(event);
          }
        }}
        data-testid={dataTestId}
        data-grid
        onCopy={composeClipboard(gridClipboard.containerProps.onCopy, consumerCopy)}
        onCut={composeClipboard(gridClipboard.containerProps.onCut, consumerCut)}
        onPaste={composeClipboard(gridClipboard.containerProps.onPaste, consumerPaste)}
        {...restContainerProps}
      >
        {/* Explicit total width, so `table-layout: fixed` holds every column at its resolved size. The
            width hook keeps the table hidden via its ref until widths settle, so a reload does not flash
            the defaults. Row count and explicit per-row indices, because assistive tech sees only the
            windowed rows. */}
        <table
          className={cn(
            'table-fixed border-separate border-spacing-0 text-xs text-foreground',
            TABLE_EDGE_CLASS,
            TABLE_HUG_EDGE_CLASS,
            DRAG_SOURCE_CLASS
          )}
          ref={layout.setTableElement}
          // Published here rather than on the scroll container: the container spreads the
          // consumer's own props, which may carry a `style` that would replace this one. Every
          // cell surface reads it (see CELL_SURFACE_CLASS), so the row height the window does
          // arithmetic on and the height the cells actually render at are one value.
          style={
            {
              width: totalWidth,
              '--grid-row-height': `${rowHeightPx}px`,
              '--grid-pinned-left': `${pinnedEdgePx}px`,
            } as React.CSSProperties
          }
          aria-label={tableAriaLabel}
          aria-rowcount={rowCount + headerRowCount + (renderFooterRow ? 1 : 0)}
        >
          <colgroup>
            {hasLeading && <col style={{ width: leadingColumnWidth }} />}
            {visibleColumns.map((visible) => {
              if (visible.type === 'separator') {
                return (
                  <col
                    key={`col-separator-${visible.beforeColumnId}`}
                    style={{ width: visible.widthPx }}
                  />
                );
              }
              if (visible.type === 'spacer') {
                // Keyed and registered by the first column it covers — stable while the window
                // holds, unique per spacer. Registered with the resize hook so a live drag re-sums
                // this width from the layout it writes — the hidden columns take part too.
                return (
                  <col
                    key={`col-spacer-${visible.coveredIds[0]}`}
                    ref={(element) =>
                      layout.setSpacerElement(
                        `colgroup-spacer-${visible.coveredIds[0]}`,
                        visible.coveredIds,
                        element,
                        visible.separatorPx
                      )
                    }
                    style={{ width: visible.widthPx }}
                  />
                );
              }
              return (
                <col
                  key={visible.column.id}
                  ref={(element) => layout.setColElement(visible.column.id, element)}
                  style={{ width: widths[visible.flexIndex] }}
                />
              );
            })}
            {hasTrailing && <col style={{ width: trailingColumnWidth }} />}
          </colgroup>
          <thead ref={layout.theadRef}>
            {hasGroupRow && (
              <tr aria-rowindex={1}>
                {topLeftCornerCell}
                {/* Group cells span runs of same-group mounted columns; a spacer splits a group into
                  two cells of the same tone. */}
                {groupColumnRuns(groupBounds, visibleColumns, pinnedLeftPxOf).map((run) => {
                  if (run.type === 'spacer') {
                    return (
                      <td
                        key={`group-spacer-${run.firstCoveredId}`}
                        aria-hidden="true"
                        className={GROUP_GUTTER_CLASS}
                        style={{ width: run.widthPx }}
                      />
                    );
                  }
                  if (run.type === 'separator') {
                    return (
                      <td
                        key={`group-separator-${run.beforeColumnId}`}
                        aria-hidden="true"
                        data-separator="group"
                        className={SEPARATOR_GROUP_CELL_CLASS}
                        style={{ width: run.widthPx }}
                      />
                    );
                  }
                  if (run.type === 'gutter') {
                    return (
                      <td
                        key={`group-gutter-${run.firstFlexIndex}`}
                        aria-hidden="true"
                        className={cn(
                          GROUP_GUTTER_CLASS,
                          run.pinnedLeftPx !== undefined && PINNED_HEADER_Z_CLASS
                        )}
                        style={
                          run.pinnedLeftPx !== undefined ? { left: run.pinnedLeftPx } : undefined
                        }
                        colSpan={run.count}
                      />
                    );
                  }
                  // `cellProps` is read once and its className and style merged rather than spread
                  // over (a pinned run's `left` wins over the consumer's): a group whose look varies
                  // per run (the band separator belongs on the run that actually starts the band,
                  // not on a continuation split off by a spacer) has no other seam — `toneClassName`
                  // is one value shared by every run of the group.
                  const groupRun: GridGroupRun = {
                    first: run.first,
                    firstFlexIndex: run.firstFlexIndex,
                    isFirstRunOfGroup: run.isFirstRunOfGroup,
                    startsGroup: run.startsGroup,
                    endsGroup: run.endsGroup,
                  };
                  const groupCellProps = run.group.cellProps?.(groupRun);
                  return (
                    <th
                      key={`group-${run.group.id}-${run.firstFlexIndex}`}
                      {...groupCellProps}
                      className={cn(
                        GROUP_CELL_CLASS,
                        run.group.toneClassName,
                        groupCellProps?.className,
                        run.pinnedLeftPx !== undefined && PINNED_HEADER_Z_CLASS
                      )}
                      style={
                        run.pinnedLeftPx !== undefined
                          ? { ...groupCellProps?.style, left: run.pinnedLeftPx }
                          : groupCellProps?.style
                      }
                      scope="colgroup"
                      colSpan={run.count}
                    >
                      {run.group.renderLabel
                        ? run.group.renderLabel({ ...groupRun, label: run.group.label })
                        : run.group.label}
                    </th>
                  );
                })}
                {hasTrailing &&
                  (trailingGroupCell ?? (
                    <td aria-hidden="true" className={FROZEN_RIGHT_GROUP_CELL_CLASS} />
                  ))}
              </tr>
            )}
            <tr aria-rowindex={headerRowCount}>
              {!hasGroupRow && topLeftCornerCell}
              {visibleColumns.map((visible) => {
                if (visible.type === 'separator') {
                  return (
                    <td
                      key={`header-separator-${visible.beforeColumnId}`}
                      aria-hidden="true"
                      data-separator="header"
                      data-testid={`${dataTestId}-separator-${visible.beforeColumnId}`}
                      className={SEPARATOR_HEADER_CELL_CLASS}
                      style={{ width: visible.widthPx }}
                    >
                      <ArrowRight aria-hidden className="inline-block size-3.5" />
                    </td>
                  );
                }
                if (visible.type === 'spacer') {
                  return (
                    <td
                      key={`header-spacer-${visible.coveredIds[0]}`}
                      aria-hidden="true"
                      className={HEADER_CELL_CLASS}
                      style={{ width: visible.widthPx }}
                    />
                  );
                }
                const width = widths[visible.flexIndex] ?? visible.column.defaultWidth;
                const pinnedLeftPx = pinnedLeftPxOf(visible.flexIndex);
                return (
                  <React.Fragment key={visible.column.id}>
                    {renderHeaderCell(visible.column, {
                      resizeHandle: renderResizeHandle(visible.column, width),
                      pinnedLeftPx,
                      pinnedClassName:
                        pinnedLeftPx === undefined ? undefined : PINNED_HEADER_Z_CLASS,
                    })}
                  </React.Fragment>
                );
              })}
              {hasTrailing && trailingHeaderCell}
            </tr>
          </thead>
          <tbody>
            {/* One flat, keyed list — flatMap, never nested arrays. A nested array is an implicit
                fragment keyed by its segment position, so the rows' own keys never reached the
                <tbody> reconciliation: a leading spacer appearing remounted every row, discarding
                any in-flight editor draft without a blur to commit it. */}
            {(() => {
              // Spacers are keyed by the first row they stand in for, tracked with a cursor —
              // stable while the window holds, and the data rows keep their own identity keys.
              let nextRowIndex = 0;
              return layout.rowSegments.flatMap((segment) => {
                if (segment.type === 'spacer') {
                  return (
                    // biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: an empty spacer row holds nothing interactive; the role is exactly what it is
                    <tr
                      key={`spacer-${nextRowIndex}`}
                      role="presentation"
                      data-testid={`${dataTestId}-row-spacer`}
                    >
                      <td
                        colSpan={bodyColSpan}
                        style={{ padding: 0, border: 'none', height: segment.sizePx }}
                      />
                    </tr>
                  );
                }
                const rows: React.ReactNode[] = [];
                for (let rowIndex = segment.from; rowIndex < segment.to; rowIndex++) {
                  rows.push(renderRow(rowIndex, visibleColumns));
                }
                nextRowIndex = segment.to;
                return rows;
              });
            })()}
            {renderFooterRow?.(bodyColSpan)}
          </tbody>
        </table>
        <div
          ref={rowHoverRef}
          aria-hidden="true"
          className={ROW_HOVER_OVERLAY_CLASS}
          style={{ display: 'none', width: totalWidth, height: rowHeightPx }}
          data-testid={`${dataTestId}-row-hover`}
        />
        {/* Filled and moved by `onDragMove`; React only owns the empty host. */}
        <div
          ref={previewHostRef}
          aria-hidden="true"
          className={DRAG_PREVIEW_CLASS}
          data-testid={`${dataTestId}-drag-preview`}
        />
        {/* Lines on both edges of the gap the dragged unit will drop into. */}
        {dragState && (
          <div
            ref={dropIndicatorRef}
            className={cn(
              'pointer-events-none absolute border-primary',
              dragState.axis === 'row' ? 'border-y-2' : 'border-x-2',
              DROP_INDICATOR_Z_CLASS
            )}
            data-testid={`${dataTestId}-drop-indicator`}
            style={dropGapStyle(dragState)}
          />
        )}
        {children}
      </div>
    );

    // The card stops at the last row, so the pane below it is the grid's blank area too.
    const consumerPointerDown = restContainerProps.onPointerDown;
    return (
      <div
        className={GRID_PANE_CLASS}
        data-grid
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            consumerPointerDown?.(event);
          }
        }}
      >
        {scrollContainer}
      </div>
    );
  }
);

DecisionTable.displayName = 'DecisionTable';
