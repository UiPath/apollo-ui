import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTOSCROLL_EDGE_PX, AUTOSCROLL_STEP_PX } from './constants';

/**
 * A live drag. Split by axis so a column drag cannot exist without its group: with the group
 * merely optional, `{axis: "column", groupIndex: undefined}` was representable, and it reached
 * the boundary math as "first group" and the drop as "ignore this entirely".
 * `from` and `boundary` are group-space for columns, row indices for rows.
 */
type DragReorderState =
  | { axis: 'row'; from: number; boundary: number }
  | { axis: 'column'; groupIndex: number; from: number; boundary: number };

interface DragReorderOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Measured sticky header height — rows start below it. */
  headerHeight: () => number;
  /** Content before data column 0: the leading gutter plus the live pinned-column widths. */
  columnLeading: () => number;
  /** Prefix sums over the data columns' live widths, length dataCount + 1 — read at event time. */
  columnOffsets: () => number[];
  rowHeightPx: number;
  rowCount: number;
  /**
   * Ascending fenceposts partitioning the windowed columns into reorder groups: group i spans
   * `[boundaries[i], boundaries[i + 1])` in data space. A drag never crosses a group. `[0, n]`
   * makes the whole grid one group; an empty array disables column drags.
   */
  columnGroupBoundaries: number[];
  onDropRow: (from: number, to: number) => void;
  /** `from`/`to` are indices within the dragged group. */
  onDropColumn: (groupIndex: number, from: number, to: number) => void;
}

/**
 * The index a drag lands on, from the insertion slot it was dropped in. `boundary` is a slot
 * (`0..count`) — the gap *before* item `boundary` in the pre-move array — so removing the source
 * first shifts every later slot left by one, and the `- 1` applies only to slots after `from`.
 *
 * Both no-op slots (`from`, the gap before the source, and `from + 1`, the gap after it) map back
 * to `from` on purpose: callers gate the dispatch on `to !== from`, so anything else here lets a
 * drag that went nowhere reorder the model, push an undo entry and dirty the document.
 *
 * Exported for the table test — every drag path routes through it, and a formula that drops the
 * `boundary > from` condition still agrees on downward drags, so getting this wrong is invisible
 * to any test that only drags down (which is what the drag tests in the grid suite all do).
 */
export const dropIndex = (from: number, boundary: number): number =>
  boundary > from ? boundary - 1 : boundary;

/**
 * Nearest row insertion slot (`0..rowCount`) for a content-space y. A pointer event without
 * coordinates (synthetic dispatchers) yields NaN, which must not smear into the indicator's
 * geometry — the previous boundary holds instead. Exported for the boundary-math tests.
 */
export const rowBoundaryForY = (
  y: number,
  rowHeightPx: number,
  rowCount: number,
  previous: number
): number => {
  const boundary = Math.round(y / rowHeightPx);
  return Number.isNaN(boundary) ? previous : Math.max(0, Math.min(rowCount, boundary));
};

/**
 * Nearest column insertion slot for a content-space x, in the dragged band's own space: the
 * nearest boundary by the columns' live prefix sums, clamped inside `[bandStart, bandEnd]` so a
 * cross-band drop is unrepresentable rather than warned about after the fact. Exported for the
 * boundary-math tests.
 */
export const columnBoundaryForX = (
  x: number,
  offsets: number[],
  columnCount: number,
  bandStart: number,
  bandEnd: number,
  previous: number
): number => {
  if (Number.isNaN(x)) {
    return previous;
  }
  let boundary = 0;
  while (
    boundary < columnCount &&
    offsets[boundary]! + (offsets[boundary + 1]! - offsets[boundary]!) / 2 < x
  ) {
    boundary += 1;
  }
  return Math.max(bandStart, Math.min(bandEnd, boundary)) - bandStart;
};

/**
 * Drag-reorder for rows and columns with the drop target computed from pointer position against
 * known geometry — fixed row height, column prefix sums — never from DOM collision. Both axes are
 * windowed: most drop targets are unmounted spacers, which geometry doesn't care about, and an
 * rAF autoscroll loop brings far targets toward the pointer. Deliberately not dnd-kit: a
 * context-subscribed draggable per row would re-render every mounted row on every drag frame,
 * which is the exact cost the SelectionCost contract exists to forbid.
 */
export const useDragReorder = (options: DragReorderOptions) => {
  const { containerRef, headerHeight, columnLeading, columnOffsets, rowHeightPx, rowCount } =
    options;
  const [dragState, setDragState] = useState<DragReorderState | null>(null);
  // Read at event time: group shapes can change mid-drag (a column added elsewhere).
  const columnGroupBoundariesRef = useRef(options.columnGroupBoundaries);
  columnGroupBoundariesRef.current = options.columnGroupBoundaries;

  // The drag's source of truth. Document-level listeners mutate and read THIS synchronously —
  // `dragState` only mirrors it for rendering. Reading React state from those listeners would
  // race the commit: a pointermove arriving before the pointerdown's state lands sees null.
  const dragRef = useRef<DragReorderState | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  /** The live drag's teardown, so an unmount can detach its document listeners. */
  const cancelRef = useRef<(() => void) | null>(null);

  // Read at event time through a ref: a drag outlives several renders, and its listeners must
  // see the freshest geometry (offsets change mid-drag under autoscroll) and drop handlers.
  const boundaryFromPointer = useCallback(
    (state: DragReorderState, clientX: number, clientY: number): number => {
      const container = containerRef.current;
      if (!container) {
        return state.boundary;
      }
      const rect = container.getBoundingClientRect();
      if (state.axis === 'row') {
        const y = clientY - rect.top + container.scrollTop - headerHeight();
        return rowBoundaryForY(y, rowHeightPx, rowCount, state.boundary);
      }
      const x = clientX - rect.left + container.scrollLeft - columnLeading();
      const boundaries = columnGroupBoundariesRef.current;
      const groupStart = boundaries[state.groupIndex] ?? 0;
      const groupEnd = boundaries[state.groupIndex + 1] ?? groupStart;
      const columnCount = boundaries[boundaries.length - 1] ?? 0;
      return columnBoundaryForX(
        x,
        columnOffsets(),
        columnCount,
        groupStart,
        groupEnd,
        state.boundary
      );
    },
    [containerRef, headerHeight, columnLeading, columnOffsets, rowHeightPx, rowCount]
  );

  const latestRef = useRef({
    boundaryFromPointer,
    onDropRow: options.onDropRow,
    onDropColumn: options.onDropColumn,
  });
  latestRef.current = {
    boundaryFromPointer,
    onDropRow: options.onDropRow,
    onDropColumn: options.onDropColumn,
  };

  const stopAutoscroll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const autoscrollLoop = useCallback(() => {
    rafRef.current = null;
    const container = containerRef.current;
    const pointer = pointerRef.current;
    const state = dragRef.current;
    if (!container || !pointer || !state) {
      return;
    }
    const rect = container.getBoundingClientRect();
    // Compared before and after the write, not inferred from the pointer being in the edge band:
    // held against an already fully-scrolled edge, the band alone rescheduled the frame forever.
    const before = state.axis === 'row' ? container.scrollTop : container.scrollLeft;
    if (state.axis === 'row') {
      if (pointer.y > rect.bottom - AUTOSCROLL_EDGE_PX) {
        container.scrollTop += AUTOSCROLL_STEP_PX;
      } else if (pointer.y < rect.top + headerHeight() + AUTOSCROLL_EDGE_PX) {
        container.scrollTop -= AUTOSCROLL_STEP_PX;
      }
    } else if (pointer.x > rect.right - AUTOSCROLL_EDGE_PX) {
      container.scrollLeft += AUTOSCROLL_STEP_PX;
    } else if (pointer.x < rect.left + columnLeading() + AUTOSCROLL_EDGE_PX) {
      container.scrollLeft -= AUTOSCROLL_STEP_PX;
    }
    const moved = (state.axis === 'row' ? container.scrollTop : container.scrollLeft) !== before;
    if (moved) {
      // Scrolling changed the content-space position under the still pointer — recompute.
      const boundary = boundaryFromPointer(state, pointer.x, pointer.y);
      if (boundary !== state.boundary) {
        dragRef.current = { ...state, boundary };
        setDragState(dragRef.current);
      }
      rafRef.current = requestAnimationFrame(autoscrollLoop);
    }
  }, [containerRef, headerHeight, columnLeading, boundaryFromPointer]);

  const beginDrag = useCallback(
    (initial: DragReorderState, event: React.PointerEvent) => {
      // A drag already in flight (two fingers on two handles, or a missed pointerup) must be torn
      // down first: its listeners would otherwise outlive it and the first pointerup to arrive
      // would commit using this drag's state.
      cancelRef.current?.();
      // `preventDefault` below stops the pointer gesture smearing a text selection, but it also
      // suppresses the focus change — so a field holding an uncommitted draft (the formula bar
      // commits on blur) would never blur, and the move would then change the content under the
      // coordinates that draft was written against, stranding it. Blur first, while the model
      // still matches: the commit lands on the row the user actually typed into.
      const focused = document.activeElement;
      if (
        focused instanceof HTMLElement &&
        focused.closest("input, textarea, [contenteditable='true']")
      ) {
        focused.blur();
      }
      // A drag is a pointer gesture; the text under it must not smear into a selection.
      event.preventDefault();
      dragRef.current = initial;
      setDragState(initial);
      pointerRef.current = { x: event.clientX, y: event.clientY };

      const onPointerMove = (move: PointerEvent) => {
        // A pointerup missed while the cursor was outside the window would otherwise leave the
        // drag armed, and the user's next unrelated click would commit a move they never asked
        // for. The first buttonless move ends it, exactly as the resize hook guards itself.
        if ((move.buttons & 1) === 0) {
          cleanup();
          return;
        }
        pointerRef.current = { x: move.clientX, y: move.clientY };
        const state = dragRef.current;
        if (!state) {
          return;
        }
        const boundary = latestRef.current.boundaryFromPointer(state, move.clientX, move.clientY);
        if (boundary !== state.boundary) {
          dragRef.current = { ...state, boundary };
          setDragState(dragRef.current);
        }
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(autoscrollLoop);
        }
      };
      const cleanup = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', cleanup);
        document.removeEventListener('keydown', onKeyDown, true);
        stopAutoscroll();
        pointerRef.current = null;
        dragRef.current = null;
        // Registered so an unmount mid-drag detaches the document listeners too — cleanup only
        // runs from pointerup/cancel/Escape otherwise, none of which an unmount delivers.
        cancelRef.current = null;
        setDragState(null);
      };
      cancelRef.current = cleanup;
      const onPointerUp = () => {
        const state = dragRef.current;
        if (state) {
          const to = dropIndex(state.from, state.boundary);
          if (to !== state.from) {
            if (state.axis === 'row') {
              latestRef.current.onDropRow(state.from, to);
            } else {
              latestRef.current.onDropColumn(state.groupIndex, state.from, to);
            }
          }
        }
        cleanup();
      };
      const onKeyDown = (key: KeyboardEvent) => {
        if (key.key === 'Escape') {
          key.stopPropagation();
          cleanup();
        }
      };
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      // Touch/pen gestures the browser reclaims (scroll takeover, palm rejection) end the drag
      // without a pointerup; without this the drag would stay armed with no way to finish it.
      document.addEventListener('pointercancel', cleanup);
      document.addEventListener('keydown', onKeyDown, true);
    },
    [autoscrollLoop, stopAutoscroll]
  );

  const startRowDrag = useCallback(
    (rowIndex: number, event: React.PointerEvent) =>
      beginDrag({ axis: 'row', from: rowIndex, boundary: rowIndex }, event),
    [beginDrag]
  );
  const startColumnDrag = useCallback(
    (groupIndex: number, indexInGroup: number, event: React.PointerEvent) =>
      beginDrag({ axis: 'column', groupIndex, from: indexInGroup, boundary: indexInGroup }, event),
    [beginDrag]
  );

  // A drag left dangling by an unmount must not keep its document listeners (or the rAF loop)
  // alive — they hold this component's closures for the life of the page.
  useEffect(
    () => () => {
      cancelRef.current?.();
      stopAutoscroll();
    },
    [stopAutoscroll]
  );

  return { dragState, startRowDrag, startColumnDrag };
};
