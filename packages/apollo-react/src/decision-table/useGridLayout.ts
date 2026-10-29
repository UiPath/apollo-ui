import type React from 'react';
import { useCallback, useMemo, useRef } from 'react';
import {
  COLUMN_ESTIMATE_PX,
  DEFAULT_COLUMN_OVERSCAN,
  DEFAULT_ROW_OVERSCAN,
  FALLBACK_COLUMN_VIEWPORT_PX,
  FALLBACK_ROW_VIEWPORT_PX,
  GROUP_SEPARATOR_WIDTH_PX,
} from './constants';
import type { CellEdge, GridColumn, VisibleGridColumn } from './gridTypes';
import { useColumnWidths } from './useColumnWidths';
import { useVirtualizedAxis } from './useVirtualizedAxis';

interface GridLayoutOptions {
  columns: GridColumn[];
  rowCount: number;
  /** Fixed row height the vertical window does arithmetic on (see BODY_ROW_HEIGHT_PX). */
  rowHeightPx: number;
  /** Width of the leading row-number gutter, or 0 when absent. */
  leadingColumnWidth: number;
  /** Width of the trailing fixed column (action gutter / result column), or 0 when absent. */
  trailingColumnWidth: number;
  /** How many leading columns stay mounted and sticky over the viewport's left edge. */
  pinnedColumnCount?: number;
  /** The host's persisted width overrides — a map, or a promise of one (table hidden until it settles). */
  initialColumnWidths: Record<string, number> | Promise<Record<string, number>> | null;
  /** Reports the full override map after every user resize/reset/prune; the host persists it. */
  onColumnWidthsChange?: (widths: Record<string, number>) => void;
  /** The scroll container — owned by the consumer so its own handlers can reach it. */
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  /** Row index retained (kept mounted) in the vertical window — the row being edited or dragged — or null. */
  retainedRowIndex?: number | null;
  /** Window-space column index retained (kept mounted) in the horizontal window, or null. */
  retainedColumnIndex?: number | null;
  /** The host draws the table's outer boundary, so the cells against it give up their own edges. */
  framedByHost?: boolean;
}

/**
 * Flex indices whose column opens a group that asked for a separator before it. Index 0 is
 * excluded: a band at the very start has no boundary to mark, and its width would sit outside the
 * leading-edge measurement. So is anything strictly inside the pinned region: only the windowed
 * loops emit separators, so counting a pinned one would widen the table past the `<col>`s it
 * renders. `pinnedCount` itself is the first windowed index, which does render.
 *
 * Exported for the layout test — the width total and the rendered columns read this one set.
 */
export const separatorFlexIndexes = (columns: GridColumn[], pinnedCount = 0): Set<number> => {
  const indexes = new Set<number>();
  for (let index = Math.max(1, pinnedCount); index < columns.length; index++) {
    const group = columns[index]!.group;
    if (group?.separatorBefore && group.id !== columns[index - 1]!.group?.id) {
      indexes.add(index);
    }
  }
  return indexes;
};

const NO_OMITTED_BORDERS: readonly CellEdge[] = [];

const RIGHT_OMITTED: readonly CellEdge[] = ['right'];

/** The host draws the boundary, so the table's own last column would double its right-hand line. */
const withHostFrame = (edges: readonly CellEdge[], isLast: boolean): readonly CellEdge[] =>
  isLast && !edges.includes('right') ? [...edges, 'right'] : edges;

/**
 * What each column actually leaves off: its band's declaration minus the edges that close the band,
 * plus the host's own edge where it frames the table.
 *
 * A band's first column keeps its left border and its last keeps its right, so the band is enclosed
 * — and so every row draws that boundary on the same pixel. Letting the neighbour draw it instead
 * (the separator's own left border, say) puts the body's line one pixel right of the header's,
 * because `border-separate` paints each border inside its own cell.
 */
const resolveOmittedBorders = (
  columns: GridColumn[],
  framedByHost: boolean
): (readonly CellEdge[])[] =>
  columns.map((column, index) => {
    const isLast = index === columns.length - 1;
    const declared = column.group?.omitCellBorders;
    if (!declared || declared.length === 0) {
      return framedByHost && isLast ? RIGHT_OMITTED : NO_OMITTED_BORDERS;
    }
    const inSameBand = (other: GridColumn | undefined) =>
      other?.group?.id !== undefined && other.group.id === column.group?.id;
    const opensBand = !inSameBand(columns[index - 1]);
    const closesBand = !inSameBand(columns[index + 1]);
    const kept = declared.filter(
      (edge) => !(edge === 'left' && opensBand) && !(edge === 'right' && closesBand)
    );
    // Keep the declared array's identity when nothing was dropped — it feeds every row's memo.
    return withHostFrame(kept.length === declared.length ? declared : kept, framedByHost && isLast);
  });

export type GridLayout = ReturnType<typeof useGridLayout>;

/**
 * INTERNAL to the grid — consumers get `DecisionTable` and its imperative handle instead.
 *
 * The grid's engine: column widths (auto-fit, drag/keyboard resize) and both virtualization
 * windows, exposed as one layout object `DecisionTable` renders from and reads for geometry
 * (drag-reorder targets, overlays, scroll-into-view).
 *
 * The first `pinnedColumnCount` columns stay mounted at every horizontal position; the remaining
 * columns are windowed with prefix sums over the live widths, so spacer sizes and scroll targets
 * stay exact under user-resized columns.
 */
export const useGridLayout = ({
  columns,
  rowCount,
  rowHeightPx,
  leadingColumnWidth,
  trailingColumnWidth,
  pinnedColumnCount = 0,
  initialColumnWidths,
  onColumnWidthsChange,
  containerRef,
  retainedRowIndex = null,
  retainedColumnIndex = null,
  framedByHost = false,
}: GridLayoutOptions) => {
  // Keyed by value. Every column's group id is in the key, not just the ones asking for a band
  const separatorsKey = columns
    .map((column) => `${column.group?.id ?? ''}:${column.group?.separatorBefore ? '1' : ''}`)
    .join(',');
  // biome-ignore lint/correctness/useExhaustiveDependencies: separatorsKey is the separator layout by value
  const pinnedCount = Math.min(pinnedColumnCount, columns.length);
  const separatorBefore = useMemo(
    () => separatorFlexIndexes(columns, pinnedCount),
    [separatorsKey, pinnedCount]
  );
  const omittedBorders = useMemo(
    () => resolveOmittedBorders(columns, framedByHost),
    [columns, framedByHost]
  );

  const {
    widths,
    totalWidth,
    setTableElement,
    setColElement,
    setSpacerElement,
    onResizeStart,
    onResizeKeyDown,
    onResizeReset,
  } = useColumnWidths({
    columns,
    // The bands are reserved width like the gutters: counted in the total, excluded from auto-fit.
    reservedPx:
      leadingColumnWidth + trailingColumnWidth + separatorBefore.size * GROUP_SEPARATOR_WIDTH_PX,
    containerRef,
    initialWidths: initialColumnWidths,
    onWidthsChange: onColumnWidthsChange,
  });

  const windowedCount = columns.length - pinnedCount;

  // The sticky header both occupies flow space above the rows and covers the top of the viewport,
  // so the row axis uses its measured height for both offsets. Cached off a ResizeObserver rather
  // than read per call: the callers are scroll handlers, and an offsetHeight read there forces a
  // layout pass on exactly the fling frames where a window shift just invalidated it.
  const headerHeightRef = useRef(0);
  const headerObserverRef = useRef<ResizeObserver | null>(null);
  const theadRef = useCallback((element: HTMLTableSectionElement | null) => {
    headerObserverRef.current?.disconnect();
    headerObserverRef.current = null;
    headerHeightRef.current = element?.offsetHeight ?? 0;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      headerHeightRef.current = element.offsetHeight;
    });
    observer.observe(element);
    headerObserverRef.current = observer;
  }, []);
  const headerHeight = useCallback(() => headerHeightRef.current, []);

  // Participates in every row's memo, so it must keep its identity across unrelated renders. The
  // width hook rebuilds `widths` every render, so its value stands in for its identity below.
  const widthsKey = widths.join(',');
  // biome-ignore lint/correctness/useExhaustiveDependencies: widthsKey is `widths` by value — the fresh array identity every render must not repaint all rows
  const stableWidths = useMemo(() => widths, [widthsKey]);

  // The leading edge reads the live gutter + pinned-column widths through a ref, because pinned
  // columns are resizable.
  const widthsRef = useRef(stableWidths);
  widthsRef.current = stableWidths;
  const columnsRef = useRef(columns);
  columnsRef.current = columns;
  const columnLeading = useCallback(() => {
    let leading = leadingColumnWidth;
    for (let index = 0; index < pinnedCount && index < columnsRef.current.length; index += 1) {
      leading += widthsRef.current[index] ?? columnsRef.current[index]!.defaultWidth;
    }
    return leading;
  }, [leadingColumnWidth, pinnedCount]);

  // Prefix sums over the windowed columns' live widths: item i spans [offsets[i], offsets[i + 1]).
  const columnOffsets = useMemo(() => {
    const offsets = new Array<number>(windowedCount + 1);
    offsets[0] = 0;
    for (let windowIndex = 0; windowIndex < windowedCount; windowIndex++) {
      const flexIndex = pinnedCount + windowIndex;
      // A band belongs to the span of the column it precedes: [band][column], starting at offsets[i].
      // Charged to the column before instead, its width falls between that column's `<col>` and the
      // spacer after it whenever the window boundary lands on the band — while `totalWidth` counts it.
      const separatorHere = separatorBefore.has(flexIndex) ? GROUP_SEPARATOR_WIDTH_PX : 0;
      offsets[windowIndex + 1] =
        offsets[windowIndex]! +
        separatorHere +
        (stableWidths[flexIndex] ?? columns[flexIndex]!.defaultWidth);
    }
    return offsets;
  }, [stableWidths, windowedCount, pinnedCount, columns, separatorBefore]);

  // Both axes are windowed to the viewport; spacers stand in for the rest, so DOM size follows the
  // viewport, not the table. Retained items (an editing cell, a dragged unit) stay mounted: unmounting
  // an editor mid-edit would discard the draft without a blur commit.
  const rowWindow = useVirtualizedAxis(rowCount, rowHeightPx, retainedRowIndex, {
    axis: 'vertical',
    overscanItems: DEFAULT_ROW_OVERSCAN,
    fallbackViewportPx: FALLBACK_ROW_VIEWPORT_PX,
    leadingFixedPx: headerHeight,
    stickyLeadingPx: headerHeight,
  });
  const columnWindow = useVirtualizedAxis(windowedCount, COLUMN_ESTIMATE_PX, retainedColumnIndex, {
    axis: 'horizontal',
    overscanItems: DEFAULT_COLUMN_OVERSCAN,
    fallbackViewportPx: FALLBACK_COLUMN_VIEWPORT_PX,
    leadingFixedPx: columnLeading,
    // The gutter and pinned columns cover the viewport's left edge, so a keyboard scroll-into-view
    // must clear them, exactly as rows must clear the sticky header.
    stickyLeadingPx: columnLeading,
    // And the trailing fixed column is pinned over the right edge — flush with the viewport edge
    // would park a just-selected column's tail underneath it.
    stickyTrailingPx: trailingColumnWidth,
    itemOffsetsPx: columnOffsets,
  });

  const visibleColumns = useMemo<VisibleGridColumn[]>(() => {
    const result: VisibleGridColumn[] = [];
    for (let flexIndex = 0; flexIndex < pinnedCount; flexIndex++) {
      result.push({
        type: 'column',
        column: columns[flexIndex]!,
        flexIndex,
        windowIndex: null,
        omitBorders: omittedBorders[flexIndex]!,
      });
    }
    let cursor = 0;
    columnWindow.segments.forEach((segment, segmentIndex) => {
      if (segment.type === 'spacer') {
        // The axis sizes spacers from the same prefix sums the colgroup renders, so the totals
        // always agree; the covered ids let a live drag keep the spacer in step (useColumnWidths).
        const nextItems = columnWindow.segments
          .slice(segmentIndex + 1)
          .find((other) => other.type === 'items');
        const gapEnd = nextItems?.type === 'items' ? nextItems.from : windowedCount;
        const coveredIds: string[] = [];
        let separatorPx = 0;
        for (let windowIndex = cursor; windowIndex < gapEnd; windowIndex++) {
          const flexIndex = pinnedCount + windowIndex;
          coveredIds.push(columns[flexIndex]!.id);
          if (separatorBefore.has(flexIndex)) {
            separatorPx += GROUP_SEPARATOR_WIDTH_PX;
          }
        }
        result.push({ type: 'spacer', widthPx: segment.sizePx, coveredIds, separatorPx });
        cursor = gapEnd;
        return;
      }
      for (let windowIndex = segment.from; windowIndex < segment.to; windowIndex++) {
        const flexIndex = pinnedCount + windowIndex;
        // Emitted whenever the column it belongs to is mounted, mounted neighbour or not: its
        // width lives in this column's span, so the spacer before it never covers the band.
        if (separatorBefore.has(flexIndex)) {
          result.push({
            type: 'separator',
            widthPx: GROUP_SEPARATOR_WIDTH_PX,
            beforeColumnId: columns[flexIndex]!.id,
          });
        }
        result.push({
          type: 'column',
          column: columns[flexIndex]!,
          flexIndex,
          windowIndex,
          omitBorders: omittedBorders[flexIndex]!,
        });
      }
      cursor = segment.to;
    });
    return result;
  }, [columnWindow.segments, columns, pinnedCount, windowedCount, separatorBefore, omittedBorders]);

  const scrollRowIntoView = useCallback(
    (rowIndex: number) => rowWindow.scrollItemIntoView(containerRef.current, rowIndex),
    [rowWindow.scrollItemIntoView, containerRef]
  );
  const scrollColumnIntoView = useCallback(
    (windowIndex: number) => columnWindow.scrollItemIntoView(containerRef.current, windowIndex),
    [columnWindow.scrollItemIntoView, containerRef]
  );

  // Stable identity for a callback ref: React re-invokes a fresh function on every render
  // (detach + attach), and both axes would re-run their attach for nothing.
  const { measureRef: measureRows } = rowWindow;
  const { measureRef: measureColumns } = columnWindow;
  const attachContainer = useCallback(
    (element: HTMLDivElement | null) => {
      containerRef.current = element;
      measureRows(element);
      measureColumns(element);
    },
    [containerRef, measureRows, measureColumns]
  );

  return {
    widths: stableWidths,
    totalWidth,
    columnOffsets,
    columnLeading,
    headerHeight,
    pinnedColumnCount: pinnedCount,
    leadingColumnWidth,
    trailingColumnWidth,
    containerRef,
    visibleColumns,
    rowSegments: rowWindow.segments,
    theadRef,
    attachContainer,
    setTableElement,
    setColElement,
    setSpacerElement,
    scrollRowIntoView,
    scrollColumnIntoView,
    onResizeStart,
    onResizeKeyDown,
    onResizeReset,
  };
};
