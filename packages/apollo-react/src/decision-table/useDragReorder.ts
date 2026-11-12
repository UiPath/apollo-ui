import { type DependencyList, useCallback, useEffect, useRef, useState } from 'react';
import { AUTOSCROLL_EDGE_PX, AUTOSCROLL_STEP_PX } from './constants';
import type { DragStartEvent } from './gridTypes';

/**
 * A live drag. Split by axis so a column drag cannot exist without its group: with the group
 * merely optional, `{axis: "column", groupIndex: undefined}` was representable, and it reached
 * the boundary math as "first group" and the drop as "ignore this entirely".
 * `from` and `boundary` are group-space for columns, row indices for rows.
 */
export type DragReorderState =
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
  /** A data column's own width, without the separator `columnOffsets` charges to the band's first column. */
  columnWidth: (dataIndex: number) => number;
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
  /**
   * Where the dragged unit is held, on each move and autoscroll step: a row's content-space top, or a
   * column's content-space left inside its own group, in px; `null` once the drag ends.
   */
  onDragMove?: (state: DragReorderState, px: number | null) => void;
}

/** A client point in the container's scrolled content space; NaN coordinates (synthetic events) pass through. */
const toContent = (container: HTMLElement, clientX: number, clientY: number) => {
  const rect = container.getBoundingClientRect();
  return {
    x: clientX - rect.left + container.scrollLeft,
    y: clientY - rect.top + container.scrollTop,
  };
};

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
 * How far a unit of the dragged run is moved while the dragged one is held over drop index `to`:
 * the units it passes make room by its size, and it takes the gap they leave.
 */
export const dragShiftPx = (
  index: number,
  from: number,
  to: number,
  sizeAt: (index: number) => number
): number => {
  if (index === from) {
    let passed = 0;
    for (let other = Math.min(from, to); other <= Math.max(from, to); other++) {
      passed += other === from ? 0 : sizeAt(other);
    }
    return to >= from ? passed : -passed;
  }
  if (from < index && index <= to) {
    return -sizeAt(from);
  }
  return to <= index && index < from ? sizeAt(from) : 0;
};

/**
 * A band's columns in content space, past the data columns' leading edge. `offsets` charges a separator
 * before the band to its first column's span, so the band starts at that span's end minus the column's width.
 */
export const bandGeometry = (
  offsets: number[],
  columnWidth: (dataIndex: number) => number,
  start: number
) => {
  const left = (offsets[start + 1] ?? 0) - columnWidth(start);
  return {
    left,
    offsetOf: (index: number) => (index === 0 ? 0 : (offsets[start + index] ?? 0) - left),
    sizeAt: (index: number) => columnWidth(start + index),
  };
};

/** Where the gap the dragged unit takes at drop index `to` starts, from the start of its run. */
export const gapStartPx = (
  from: number,
  to: number,
  offsetOf: (index: number) => number,
  sizeAt: (index: number) => number
): number => (to > from ? offsetOf(to + 1) - sizeAt(from) : offsetOf(to));

/**
 * The insertion slot (`0..count`) for a dragged unit whose copy starts at `start`, in its run's own
 * space: the copy's centre entering a neighbour's span swaps them. So a unit of any size moves once
 * it covers half of the next one, wherever it was grabbed.
 */
export const slotForCopy = (
  from: number,
  start: number,
  count: number,
  offsetOf: (index: number) => number,
  sizeAt: (index: number) => number
): number => {
  const centre = start + sizeAt(from) / 2;
  let to = from;
  for (let index = from - 1; index >= 0 && centre <= offsetOf(index) + sizeAt(index); index--) {
    to = index;
  }
  for (let index = from + 1; index < count && centre >= offsetOf(index); index++) {
    to = index;
  }
  return to > from ? to + 1 : to;
};

/**
 * Drag-reorder for rows and columns with the drop target computed from pointer position against
 * known geometry — fixed row height, column prefix sums — never from DOM collision. Both axes are
 * windowed: most drop targets are unmounted spacers, which geometry doesn't care about, and an
 * rAF autoscroll loop brings far targets toward the pointer. Deliberately not dnd-kit: a
 * context-subscribed draggable per row would re-render every mounted row on every drag frame,
 * the per-row render cost this grid's memoization exists to avoid.
 */
export const useDragReorder = (options: DragReorderOptions) => {
  const {
    containerRef,
    headerHeight,
    columnLeading,
    columnOffsets,
    columnWidth,
    rowHeightPx,
    rowCount,
  } = options;
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

  /** Pointer-to-edge distance at the grab, so the row or column moves with the pointer instead of jumping to it. */
  const grabOffsetRef = useRef(0);

  /** Where a dragged column's band starts, and where the dragged column itself sits, in content space. */
  const columnGeometry = useCallback(
    (groupIndex: number, from: number) => {
      const offsets = columnOffsets();
      const boundaries = columnGroupBoundariesRef.current;
      const start = boundaries[groupIndex] ?? 0;
      const end = boundaries[groupIndex + 1] ?? start;
      const band = bandGeometry(offsets, columnWidth, start);
      const bandLeft = columnLeading() + band.left;
      return {
        left: bandLeft + band.offsetOf(from),
        width: band.sizeAt(from),
        bandLeft,
        bandRight: columnLeading() + (offsets[end] ?? 0),
      };
    },
    [columnLeading, columnOffsets, columnWidth]
  );

  const columnLeftAt = useCallback(
    (groupIndex: number, from: number, clientX: number): number => {
      const { left: resting, width, bandLeft, bandRight } = columnGeometry(groupIndex, from);
      const container = containerRef.current;
      if (!container) {
        return resting;
      }
      const left = toContent(container, clientX, 0).x - grabOffsetRef.current;
      if (Number.isNaN(left)) {
        return resting;
      }
      return Math.max(bandLeft, Math.min(bandRight - width, left));
    },
    [containerRef, columnGeometry]
  );

  const rowTopAt = useCallback(
    (from: number, clientY: number): number => {
      const resting = headerHeight() + from * rowHeightPx;
      const container = containerRef.current;
      if (!container) {
        return resting;
      }
      const top = toContent(container, 0, clientY).y - grabOffsetRef.current;
      if (Number.isNaN(top)) {
        return resting;
      }
      const highest = container.scrollTop + headerHeight();
      const lowest = Math.min(
        headerHeight() + (rowCount - 1) * rowHeightPx,
        container.scrollTop + container.clientHeight - rowHeightPx
      );
      return Math.max(highest, Math.min(lowest, top));
    },
    [containerRef, headerHeight, rowHeightPx, rowCount]
  );

  // Read at event time through a ref: a drag outlives several renders, and its listeners must
  // see the freshest geometry (offsets change mid-drag under autoscroll) and drop handlers.
  const boundaryFromPointer = useCallback(
    (state: DragReorderState, clientX: number, clientY: number): number => {
      if (state.axis === 'row') {
        const container = containerRef.current;
        if (!container || Number.isNaN(clientY)) {
          return state.boundary;
        }
        // Where the copy would be, not where it is drawn: the drawn copy stops at the viewport's
        // edge, and the slot must keep following a pointer past it while autoscroll runs.
        const top = toContent(container, 0, clientY).y - grabOffsetRef.current - headerHeight();
        return slotForCopy(
          state.from,
          top,
          rowCount,
          (index) => index * rowHeightPx,
          () => rowHeightPx
        );
      }
      if (Number.isNaN(clientX)) {
        return state.boundary;
      }
      const boundaries = columnGroupBoundariesRef.current;
      const start = boundaries[state.groupIndex] ?? 0;
      const end = boundaries[state.groupIndex + 1] ?? start;
      const container = containerRef.current;
      if (!container) {
        return state.boundary;
      }
      const band = bandGeometry(columnOffsets(), columnWidth, start);
      // Unclamped, as for rows: the drawn copy stops at the band's edges, which a narrow neighbour
      // of a wide column would otherwise keep its centre from reaching.
      const left =
        toContent(container, clientX, 0).x - grabOffsetRef.current - columnLeading() - band.left;
      return slotForCopy(state.from, left, end - start, band.offsetOf, band.sizeAt);
    },
    [containerRef, headerHeight, columnLeading, columnOffsets, columnWidth, rowHeightPx, rowCount]
  );

  const latestRef = useRef({
    boundaryFromPointer,
    rowTopAt,
    columnLeftAt,
    columnGeometry,
    onDropRow: options.onDropRow,
    onDropColumn: options.onDropColumn,
    onDragMove: options.onDragMove,
  });
  latestRef.current = {
    boundaryFromPointer,
    rowTopAt,
    columnLeftAt,
    columnGeometry,
    onDropRow: options.onDropRow,
    onDropColumn: options.onDropColumn,
    onDragMove: options.onDragMove,
  };

  const reportPosition = useCallback(
    (state: DragReorderState, pointer: { x: number; y: number }) => {
      const latest = latestRef.current;
      latest.onDragMove?.(
        state,
        state.axis === 'row'
          ? latest.rowTopAt(state.from, pointer.y)
          : latest.columnLeftAt(state.groupIndex, state.from, pointer.x)
      );
    },
    []
  );

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
      reportPosition(state, pointer);
      // Scrolling changed the content-space position under the still pointer — recompute.
      const boundary = latestRef.current.boundaryFromPointer(state, pointer.x, pointer.y);
      if (boundary !== state.boundary) {
        dragRef.current = { ...state, boundary };
        setDragState(dragRef.current);
      }
      rafRef.current = requestAnimationFrame(autoscrollLoop);
    }
  }, [containerRef, headerHeight, columnLeading, reportPosition]);

  const beginDrag = useCallback(
    // Returns whether the drag began, as every start does; refusals belong to the callers above it.
    (initial: DragReorderState, event: DragStartEvent): boolean => {
      // A drag already in flight (two fingers on two handles, or a missed pointerup) must be torn
      // down first: its listeners would otherwise outlive it and the first pointerup to arrive
      // would commit using this drag's state.
      cancelRef.current?.();
      // `preventDefault` below stops the pointer gesture smearing a text selection, but it also
      // suppresses the focus change — so a field holding an uncommitted draft (a field that
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
      const container = containerRef.current;
      // From the press, not the move that started the drag: the copy then keeps the pointer's place on the unit.
      const pressed = event.press ?? event;
      const grab = container
        ? toContent(container, pressed.clientX, pressed.clientY)
        : { x: Number.NaN, y: Number.NaN };
      const offset =
        initial.axis === 'row'
          ? grab.y - (headerHeight() + initial.from * rowHeightPx)
          : grab.x - latestRef.current.columnGeometry(initial.groupIndex, initial.from).left;
      grabOffsetRef.current = Number.isNaN(offset) ? 0 : offset;
      // A drag started from a move past the press threshold is already off the unit's own slot; a
      // release with no further move must land on the slot the indicator shows.
      dragRef.current = {
        ...initial,
        boundary: latestRef.current.boundaryFromPointer(initial, event.clientX, event.clientY),
      };
      setDragState(dragRef.current);
      pointerRef.current = { x: event.clientX, y: event.clientY };
      reportPosition(initial, { x: event.clientX, y: event.clientY });

      // The pointer the drag follows: the one that started it, or the first to move.
      let owner = event.pointerId;
      const isOwner = (pointerEvent: PointerEvent) => {
        if (pointerEvent.pointerId === undefined) {
          return true;
        }
        owner ??= pointerEvent.pointerId;
        return pointerEvent.pointerId === owner;
      };
      const retarget = (state: DragReorderState, x: number, y: number) => {
        reportPosition(state, { x, y });
        const boundary = latestRef.current.boundaryFromPointer(state, x, y);
        if (boundary !== state.boundary) {
          dragRef.current = { ...state, boundary };
          setDragState(dragRef.current);
        }
      };

      const onPointerMove = (move: PointerEvent) => {
        if (!isOwner(move)) {
          return;
        }
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
        retarget(state, move.clientX, move.clientY);
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(autoscrollLoop);
        }
      };
      // A wheel or trackpad scroll moves the content under a still pointer, as autoscroll does.
      const onScroll = () => {
        const state = dragRef.current;
        const pointer = pointerRef.current;
        if (state && pointer) {
          retarget(state, pointer.x, pointer.y);
        }
      };
      const onPointerCancel = (cancel: PointerEvent) => {
        if (isOwner(cancel)) {
          cleanup();
        }
      };
      // The window losing focus can swallow the pointerup; the drag must not wait for it.
      const onVisibilityChange = () => {
        if (document.hidden) {
          cleanup();
        }
      };
      const cleanup = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerCancel);
        document.removeEventListener('keydown', onKeyDown, true);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('blur', cleanup);
        container?.removeEventListener('scroll', onScroll);
        stopAutoscroll();
        const ended = dragRef.current;
        if (ended) {
          latestRef.current.onDragMove?.(ended, null);
        }
        pointerRef.current = null;
        dragRef.current = null;
        // Registered so an unmount mid-drag detaches the document listeners too — cleanup only
        // runs from pointerup/cancel/Escape otherwise, none of which an unmount delivers.
        cancelRef.current = null;
        setDragState(null);
      };
      cancelRef.current = cleanup;
      const onPointerUp = (up: PointerEvent) => {
        if (!isOwner(up)) {
          return;
        }
        const state = dragRef.current;
        try {
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
        } finally {
          // A drop handler that throws would otherwise leave the drag armed with its document
          // listeners attached, and the next unrelated click would commit a move.
          cleanup();
        }
      };
      // No key reaches the grid while a unit is carried: typing would open an editor, Delete clear
      // the selection, under a drag about to move it. Nor does a key's browser action: Ctrl/Cmd+X
      // and V fire cut and paste, which bypass the grid's key handling. Escape cancels.
      const onKeyDown = (key: KeyboardEvent) => {
        key.stopPropagation();
        key.preventDefault();
        if (key.key === 'Escape') {
          cleanup();
        }
      };
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      // Touch/pen gestures the browser reclaims (scroll takeover, palm rejection) end the drag
      // without a pointerup; without this the drag would stay armed with no way to finish it.
      document.addEventListener('pointercancel', onPointerCancel);
      document.addEventListener('keydown', onKeyDown, true);
      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('blur', cleanup);
      container?.addEventListener('scroll', onScroll, { passive: true });
      // The move that started the drag may already sit at an edge; the autoscroll must not wait for another.
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(autoscrollLoop);
      }
      return true;
    },
    [autoscrollLoop, stopAutoscroll, containerRef, headerHeight, rowHeightPx, reportPosition]
  );

  // A position the table does not have would drop with indices the consumer cannot apply.
  const startRowDrag = useCallback(
    (rowIndex: number, event: DragStartEvent) =>
      Number.isInteger(rowIndex) &&
      rowIndex >= 0 &&
      rowIndex < rowCount &&
      beginDrag({ axis: 'row', from: rowIndex, boundary: rowIndex }, event),
    [beginDrag, rowCount]
  );
  const startColumnDrag = useCallback(
    (groupIndex: number, indexInGroup: number, event: DragStartEvent) => {
      const boundaries = columnGroupBoundariesRef.current;
      const size = (boundaries[groupIndex + 1] ?? 0) - (boundaries[groupIndex] ?? 0);
      return (
        Number.isInteger(groupIndex) &&
        Number.isInteger(indexInGroup) &&
        groupIndex >= 0 &&
        groupIndex < boundaries.length - 1 &&
        indexInGroup >= 0 &&
        indexInGroup < size &&
        beginDrag({ axis: 'column', groupIndex, from: indexInGroup, boundary: indexInGroup }, event)
      );
    },
    [beginDrag]
  );

  // Rows or bands changing under a drag would drop it on positions it no longer means.
  const shapeKey = `${rowCount}|${options.columnGroupBoundaries.join(',')}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: `shapeKey` is the signal, not a value this reads
  useEffect(() => {
    cancelRef.current?.();
  }, [shapeKey]);

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

/** How far a press travels before it becomes a drag rather than a click. */
const PRESS_DRAG_THRESHOLD_PX = 4;

/** Arms a drag that starts from the first move past the threshold; returns the disarm. */
const armPressDrag = (
  press: { clientX: number; clientY: number; pointerId?: number },
  start: (move: DragStartEvent) => void
): (() => void) => {
  const { clientX: startX, clientY: startY, pointerId } = press;
  // Another finger's events belong to its own press, not this one.
  const isOwn = (event: PointerEvent) =>
    pointerId === undefined || event.pointerId === undefined || event.pointerId === pointerId;
  const onEnd = (end: PointerEvent) => {
    if (isOwn(end)) {
      disarm();
    }
  };
  // A release missed while the window was away would leave the press armed for the next gesture.
  const onHidden = () => {
    if (document.visibilityState === 'hidden') {
      disarm();
    }
  };
  const disarm = () => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onEnd);
    document.removeEventListener('pointercancel', onEnd);
    document.removeEventListener('visibilitychange', onHidden);
    window.removeEventListener('blur', disarm);
  };
  const onMove = (move: PointerEvent) => {
    if (!isOwn(move)) {
      return;
    }
    if ((move.buttons & 1) === 0) {
      disarm();
      return;
    }
    // Short of the threshold, a release leaves the press a click.
    if (Math.hypot(move.clientX - startX, move.clientY - startY) < PRESS_DRAG_THRESHOLD_PX) {
      return;
    }
    disarm();
    start({
      clientX: move.clientX,
      clientY: move.clientY,
      preventDefault: () => move.preventDefault(),
      press: { clientX: startX, clientY: startY },
      pointerId: move.pointerId,
    });
  };
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onEnd);
  document.addEventListener('pointercancel', onEnd);
  document.addEventListener('visibilitychange', onHidden);
  window.addEventListener('blur', disarm);
  return disarm;
};

/**
 * `armPressDrag` for a surface that is both clicked and dragged, disarmed on unmount or when `position`
 * (a row's index, the columns) changes. `start` returns whether the drag began; a refused one leaves
 * the press a click.
 */
export const usePressDrag = (position: DependencyList) => {
  const disarmRef = useRef<(() => void) | null>(null);
  const draggedRef = useRef(false);
  // A press left armed would drag whatever now sits where it was pressed, and outlive the element.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `position` is the caller's dependency list, passed through
  useEffect(() => () => disarmRef.current?.(), position);
  /** Every press, with `start` null where this one cannot drag. */
  const press = useCallback(
    (
      event: { clientX: number; clientY: number; pointerId?: number },
      start: ((move: DragStartEvent) => boolean) | null
    ) => {
      // Cleared on every press: a drag released elsewhere sends its click to another element, leaving it set.
      draggedRef.current = false;
      disarmRef.current?.();
      disarmRef.current = start
        ? armPressDrag(event, (move) => {
            draggedRef.current = start(move);
          })
        : null;
    },
    []
  );
  /** Whether a click ends a press that dragged, and so selects nothing. */
  const clickWasDrag = useCallback(() => {
    const dragged = draggedRef.current;
    draggedRef.current = false;
    return dragged;
  }, []);
  return { press, clickWasDrag };
};

/** A detached copy of a mounted body row, for the drag preview; null when the row is not mounted. */
export const buildRowPreview = (
  container: HTMLElement | null,
  ariaRowIndex: number
): { table: HTMLTableElement; sources: HTMLElement[] } | null => {
  const table = container?.querySelector(':scope > table');
  const source = table?.querySelector(`:scope > tbody > tr[aria-rowindex="${ariaRowIndex}"]`);
  if (!(table instanceof HTMLTableElement) || !(source instanceof HTMLTableRowElement)) {
    return null;
  }
  // A shell of the grid's own table, so the copy keeps its column widths, row height and cell styles.
  const shell = table.cloneNode(false) as HTMLTableElement;
  const colgroup = table.querySelector(':scope > colgroup');
  if (colgroup) {
    shell.append(colgroup.cloneNode(true));
  }
  const body = document.createElement('tbody');
  body.append(source.cloneNode(true));
  shell.append(body);
  stripIdentity(shell);
  return { table: shell, sources: [source] };
};

/**
 * For the eye only: duplicated ids and test ids would make every lookup ambiguous mid-drag. A copy
 * rebuilt mid-drag also drops the drag's own marks, or it would be blanked and shifted like its source.
 */
const stripIdentity = (shell: HTMLTableElement) => {
  shell.removeAttribute('aria-label');
  shell.removeAttribute('aria-rowcount');
  // The copied buttons must not take focus inside the aria-hidden preview.
  shell.setAttribute('inert', '');
  for (const element of [shell, ...shell.querySelectorAll('[id], [data-testid]')]) {
    element.removeAttribute('id');
    element.removeAttribute('data-testid');
  }
  for (const element of shell.querySelectorAll<HTMLElement>('[data-drag-source], [style]')) {
    element.removeAttribute('data-drag-source');
    element.style.transform = '';
    element.style.transition = '';
  }
};

/** A detached copy of one mounted column, header to last mounted row, for the drag preview; null when it is not mounted. */
export const buildColumnPreview = (
  container: HTMLElement | null,
  {
    headerCellIndex,
    bodyCellIndex,
    widthPx,
  }: { headerCellIndex: number; bodyCellIndex: number; widthPx: number }
): { table: HTMLTableElement; sources: HTMLElement[] } | null => {
  const table = container?.querySelector(':scope > table');
  if (!(table instanceof HTMLTableElement) || !table.tHead || !table.tBodies[0]) {
    return null;
  }
  // Cells are found by position: every row renders the same visible columns in order. The header and
  // body indices differ when a corner cell spanning the header rows takes the label row's leading cell.
  const headerRows = Array.from(table.tHead.rows);
  const headerRow = headerRows[headerRows.length - 1];
  const header = headerRow?.cells[headerCellIndex];
  if (!header) {
    return null;
  }
  const shell = table.cloneNode(false) as HTMLTableElement;
  shell.style.width = `${widthPx}px`;
  const colgroup = document.createElement('colgroup');
  const col = document.createElement('col');
  col.style.width = `${widthPx}px`;
  colgroup.append(col);
  const head = document.createElement('thead');
  for (const row of headerRows.slice(0, -1)) {
    const blank = document.createElement('tr');
    const cell = document.createElement('th');
    cell.style.height = `${row.getBoundingClientRect().height}px`;
    cell.style.padding = '0';
    cell.style.border = '0';
    blank.append(cell);
    head.append(blank);
  }
  const headerCopy = document.createElement('tr');
  headerCopy.append(header.cloneNode(true));
  head.append(headerCopy);

  const sources: HTMLElement[] = [header];
  const body = document.createElement('tbody');
  for (const row of Array.from(table.tBodies[0].rows)) {
    // Spacer rows keep their heights, so each copied cell lines up with the row it came from.
    if (row.getAttribute('role') === 'presentation') {
      body.append(row.cloneNode(true));
      continue;
    }
    const cell = row.cells[bodyCellIndex];
    // The full-width footer, or a row too short to hold the column.
    if (!cell || row.cells.length === 1) {
      continue;
    }
    const copy = row.cloneNode(false) as HTMLTableRowElement;
    copy.append(cell.cloneNode(true));
    body.append(copy);
    sources.push(cell);
  }
  shell.append(colgroup, head, body);
  stripIdentity(shell);
  // A spacer row's one cell spans the whole table; in the copy it spans the one column.
  for (const spacer of shell.querySelectorAll<HTMLTableCellElement>(
    "tbody > tr[role='presentation'] > td"
  )) {
    spacer.colSpan = 1;
  }
  return { table: shell, sources };
};
