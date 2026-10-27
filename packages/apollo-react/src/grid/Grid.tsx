import { cn } from '@uipath/apollo-wind';
import { ArrowRight } from 'lucide-react';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { BODY_ROW_HEIGHT_PX, MIN_COLUMN_WIDTH } from './constants';
import {
  GRID_FRAME_CLASS,
  GRID_PANE_CLASS,
  GROUP_CELL_CLASS,
  GROUP_GUTTER_CLASS,
  HEADER_CELL_CLASS,
  HOST_FRAMED_CONTAINER_CLASS,
  OMIT_BORDER_CLASS,
  RESIZE_HANDLE_CLASS,
  SEPARATOR_GROUP_CELL_CLASS,
  SEPARATOR_HEADER_CELL_CLASS,
  TABLE_EDGE_CLASS,
  TABLE_HUG_EDGE_CLASS,
} from './gridStyles';
import type {
  GridClipboardProps,
  GridColumn,
  GridColumnGroup,
  GridHandle,
  GridLabels,
  VisibleGridColumn,
} from './gridTypes';
import { useDragReorder } from './useDragReorder';
import { useGridClipboard } from './useGridClipboard';
import { type GridLayout, useGridLayout } from './useGridLayout';

/** What a consumer's header cell receives beyond its column def. */
export interface HeaderCellContext {
  /** The grid's resize grab strip, or null when columns are not resizable — place it inside the returned `<th>`. */
  resizeHandle: React.ReactNode;
  /** Set for pinned columns: the sticky left offset their header must carry. */
  pinnedLeftPx?: number;
}

interface GridProps {
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
  /** The host draws the table's outer boundary. The cells that sit against it give up their own edges. */
  framedByHost?: boolean;
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
   */
  renderRow: (rowIndex: number, visibleColumns: VisibleGridColumn[]) => React.ReactNode;
  /** The trailing add-row `<tr>`, when the grid offers one; receives the full-row colSpan. */
  renderFooterRow?: (colSpan: number) => React.ReactNode;
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
  | {
      type: 'group';
      group: GridColumnGroup;
      first: GridColumn;
      firstFlexIndex: number;
      count: number;
      pinnedLeftPx?: number;
      isFirstRunOfGroup: boolean;
    }
  | { type: 'gutter'; count: number; firstFlexIndex: number; pinnedLeftPx?: number }
  | { type: 'spacer'; widthPx: number; firstCoveredId: string }
  | { type: 'separator'; widthPx: number; beforeColumnId: string };

/** Contiguous same-group runs of the mounted columns, for the group header's colSpans. */
const groupColumnRuns = (
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
      });
      openedGroups.add(column.group.id);
    }
  }
  return runs;
};

/**
 * The shared grid: a focusable scroll container, a fixed-layout table whose colgroup follows the
 * live column widths, a sticky two-row header (group row + column headers, both windowed with the
 * columns), a windowed body the consumer renders rows into, and drag-reorder for rows and columns.
 * Widths, virtualization and drags are owned here; all model knowledge stays with the consumer,
 * which reaches the grid's live geometry through the imperative `GridHandle`.
 */
export const Grid = forwardRef<GridHandle, GridProps>(
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
      framedByHost = false,
      columnGroupSizes,
      onRowMove,
      onColumnMove,
      retainedRowIndex = null,
      retainedColumnIndex = null,
      renderHeaderCell,
      renderRow,
      renderFooterRow,
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

    const onRowMoveRef = useRef(onRowMove);
    onRowMoveRef.current = onRowMove;
    const onColumnMoveRef = useRef(onColumnMove);
    onColumnMoveRef.current = onColumnMove;

    // Fenceposts derived from the group sizes: group i spans [boundaries[i], boundaries[i + 1])
    // in windowed-column space. No sizes -> a single fencepost -> no group to drag within.
    const sizesKey = (columnGroupSizes ?? []).join(',');
    // biome-ignore lint/correctness/useExhaustiveDependencies: sizesKey is `columnGroupSizes` by value
    const boundaries = React.useMemo(() => {
      const out = [0];
      for (const size of columnGroupSizes ?? []) {
        out.push(out[out.length - 1]! + size);
      }
      return out;
    }, [sizesKey]);
    const {
      dragState,
      startRowDrag,
      startColumnDrag: beginColumnDrag,
    } = useDragReorder({
      containerRef,
      headerHeight,
      columnLeading,
      columnOffsets,
      rowHeightPx,
      rowCount,
      columnGroupBoundaries: boundaries,
      onDropRow: (from, to) => onRowMoveRef.current?.(from, to),
      onDropColumn: (groupIndex, from, to) => onColumnMoveRef.current?.(groupIndex, from, to),
    });

    // Without at least one group there is nothing to drag within — the handle's startColumnDrag
    // is a no-op instead of arming a drag whose drop would index a missing group.
    const boundariesRef = useRef(boundaries);
    boundariesRef.current = boundaries;
    const startColumnDrag = useCallback(
      (groupIndex: number, indexInGroup: number, event: React.PointerEvent) => {
        if (boundariesRef.current.length >= 2) {
          beginColumnDrag(groupIndex, indexInGroup, event);
        }
      },
      [beginColumnDrag]
    );

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
      framedByHost,
    });
    layoutRef.current = layout;

    const { visibleColumns, widths, totalWidth } = layout;
    const hasTrailing = trailingColumnWidth > 0;
    const hasLeading = leadingColumnWidth > 0;
    // A grid with no grouped column (and no trailing group cell) gets no group row at all — a
    // flat grid must not pay a blank band-height strip. Consumers with groups keep two header rows, so
    // their header cells stick below the band row and body rows number from aria-rowindex 3; a flat
    // grid's header cells must stick at top-0 and its rows number from 2.
    const hasGroupRow =
      columns.some((column) => column.group !== undefined) || trailingGroupCell !== undefined;
    // The group row is the table's top edge, so every cell in it gives that edge up when the host frames.
    const hostTopEdge = framedByHost && OMIT_BORDER_CLASS.top;
    const headerRowCount = hasGroupRow ? 2 : 1;

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
        startRowDrag,
        startColumnDrag,
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
          className={RESIZE_HANDLE_CLASS}
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
    const bodyColSpan = (hasLeading ? 1 : 0) + visibleColumns.length + (hasTrailing ? 1 : 0);
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
        className={framedByHost ? HOST_FRAMED_CONTAINER_CLASS : GRID_FRAME_CLASS}
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
            !framedByHost && [TABLE_EDGE_CLASS, TABLE_HUG_EDGE_CLASS]
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
            {/* The top edge goes on each cell, where `cn` drops the conflicting `border-t` outright — a
                `> *` rule would only tie it on specificity and lose on source order. The right edge can
                stay on the row, because `> *:last-child` outranks the cell's own `border-r`. */}
            {hasGroupRow && (
              <tr aria-rowindex={1} className={cn(framedByHost && '[&>*:last-child]:border-r-0')}>
                {hasLeading && (
                  <td
                    aria-hidden="true"
                    className={cn(GROUP_GUTTER_CLASS, 'left-0 z-3', hostTopEdge)}
                  />
                )}
                {/* Group cells span runs of same-group mounted columns; a spacer splits a group into
                  two cells of the same tone. */}
                {groupColumnRuns(visibleColumns, pinnedLeftPxOf).map((run) => {
                  if (run.type === 'spacer') {
                    return (
                      <td
                        key={`group-spacer-${run.firstCoveredId}`}
                        aria-hidden="true"
                        className={cn(GROUP_GUTTER_CLASS, hostTopEdge)}
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
                        className={cn(SEPARATOR_GROUP_CELL_CLASS, hostTopEdge)}
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
                          run.pinnedLeftPx !== undefined && 'z-3',
                          hostTopEdge
                        )}
                        style={
                          run.pinnedLeftPx !== undefined ? { left: run.pinnedLeftPx } : undefined
                        }
                        colSpan={run.count}
                      />
                    );
                  }
                  // `cellProps` is read once and its className merged rather than spread over: a
                  // group whose look varies per run (the band separator belongs on the run that
                  // actually starts the band, not on a continuation split off by a spacer) has no
                  // other seam — `toneClassName` is one value shared by every run of the group.
                  const groupCellProps = run.group.cellProps?.(run.first, run.firstFlexIndex);
                  return (
                    <th
                      key={`group-${run.group.id}-${run.firstFlexIndex}`}
                      {...groupCellProps}
                      className={cn(
                        GROUP_CELL_CLASS,
                        run.group.toneClassName,
                        groupCellProps?.className,
                        run.pinnedLeftPx !== undefined && 'z-3',
                        hostTopEdge
                      )}
                      style={
                        run.pinnedLeftPx !== undefined ? { left: run.pinnedLeftPx } : undefined
                      }
                      scope="colgroup"
                      colSpan={run.count}
                    >
                      {run.group.renderLabel
                        ? run.group.renderLabel({
                            first: run.first,
                            firstFlexIndex: run.firstFlexIndex,
                            isFirstRunOfGroup: run.isFirstRunOfGroup,
                            label: run.group.label,
                          })
                        : run.group.label}
                    </th>
                  );
                })}
                {hasTrailing &&
                  (trailingGroupCell ?? (
                    <td aria-hidden="true" className={cn(GROUP_GUTTER_CLASS, 'right-0 z-3')} />
                  ))}
              </tr>
            )}
            <tr
              aria-rowindex={headerRowCount}
              className={cn(framedByHost && '[&>*:last-child]:border-r-0')}
            >
              {hasLeading && (
                <th
                  className={cn(HEADER_CELL_CLASS, 'left-0 z-3 text-center align-middle')}
                  scope="col"
                >
                  {labels.rowNumberHeader ?? '#'}
                </th>
              )}
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
                return (
                  <React.Fragment key={visible.column.id}>
                    {renderHeaderCell(visible.column, {
                      resizeHandle: renderResizeHandle(visible.column, width),
                      pinnedLeftPx: pinnedLeftPxOf(visible.flexIndex),
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
        {dragState && (
          <div
            className="pointer-events-none absolute z-4 bg-primary"
            data-testid={`${dataTestId}-drop-indicator`}
            style={
              dragState.axis === 'row'
                ? {
                    top: headerHeight() + dragState.boundary * rowHeightPx - 1,
                    left: 0,
                    width: totalWidth,
                    height: 2,
                  }
                : {
                    left:
                      columnLeading() +
                      (layout.columnOffsets[
                        (boundaries[dragState.groupIndex] ?? 0) + dragState.boundary
                      ] ?? 0) -
                      1,
                    top: 0,
                    width: 2,
                    height: headerHeight() + rowCount * rowHeightPx,
                  }
            }
          />
        )}
        {children}
      </div>
    );

    if (framedByHost) {
      return scrollContainer;
    }
    // The card stops at the last row, so the pane below it is the grid's blank area too.
    const consumerPointerDown = restContainerProps.onPointerDown;
    return (
      <div
        className={GRID_PANE_CLASS}
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

Grid.displayName = 'Grid';
