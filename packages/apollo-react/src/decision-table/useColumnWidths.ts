import type React from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  resizeColumnWidths,
  resolveColumnWidths,
  type SizedColumn,
  widthFor,
} from './columnSizing';
import { COLUMN_RESIZE_KEYBOARD_STEP, MIN_COLUMN_WIDTH } from './constants';

const isThenable = (
  value: Record<string, number> | Promise<Record<string, number>>
): value is Promise<Record<string, number>> =>
  typeof (value as Promise<Record<string, number>>).then === 'function';

// A promise seed is keyed by identity — stamped with a stable id so the seeding effect's value key
// stays a plain string either way.
const promiseIds = new WeakMap<object, number>();
let nextPromiseId = 0;
const promiseIdOf = (promise: object): number => {
  let id = promiseIds.get(promise);
  if (id === undefined) {
    nextPromiseId += 1;
    id = nextPromiseId;
    promiseIds.set(promise, id);
  }
  return id;
};

interface ColumnWidthsApi {
  widths: number[];
  totalWidth: number;
  /**
   * Ref callback for the `<table>`. The hook hides it until the first layout has settled — the
   * container is measured and the host's initial widths are known — then reveals it, so a
   * reload shows the saved widths once instead of flashing the defaults while the async read runs.
   */
  setTableElement: (table: HTMLTableElement | null) => void;
  /** Ref callback that registers a `<col>` element so a drag can write its width straight to the DOM. */
  setColElement: (columnId: string, element: HTMLTableColElement | null) => void;
  /** Ref callback for a windowed grid's spacer `<col>`, with the hidden columns' keys it stands in for. */
  setSpacerElement: (
    spacerId: string,
    coveredIds: string[],
    element: HTMLTableColElement | null,
    extraPx?: number
  ) => void;
  onResizeStart: (columnId: string, event: React.PointerEvent) => void;
  onResizeKeyDown: (columnId: string, event: React.KeyboardEvent) => void;
  onResizeReset: (columnId: string) => void;
}

/**
 * Owns a grid's column widths: auto-fit on mount/resize and directional drag/keyboard resizing
 * that keeps the dragged edge under the cursor. The grid computes, the host persists: user-set
 * overrides seed from `initialWidths` and every change reports the full override map through
 * `onWidthsChange`. A drag writes to the `<col>` elements through refs and commits once on
 * release — routing pointer moves through React would repaint every memoised row per frame.
 */
export function useColumnWidths({
  columns,
  reservedPx,
  containerRef,
  initialWidths,
  onWidthsChange,
}: {
  columns: SizedColumn[];
  /** Total width of the grid's fixed gutters — excluded from auto-fit and included in totalWidth. */
  reservedPx: number;
  containerRef: React.RefObject<HTMLElement | null>;
  /**
   * The host's persisted overrides, keyed by column id — a plain map when known synchronously, or
   * a promise of one (the table stays hidden until it settles, so a reload never flashes the
   * defaults). Persistence stays the host's; only the render timing lives here. A changed map
   * re-seeds (maps compared by value, promises by identity), so the host can swap documents
   * without remounting.
   */
  initialWidths: Record<string, number> | Promise<Record<string, number>> | null;
  /** Reports the full override map after every user resize/reset and column prune; host persists. */
  onWidthsChange?: (widths: Record<string, number>) => void;
}): ColumnWidthsApi {
  // Keyed by value: a cosmetic rebuild of the defs (e.g. a header rename) must not re-run the
  // reflow effects below, which would snap directional drag sizes back to auto-fit.
  const columnsKey = columns.map((column) => `${column.id}:${column.defaultWidth}`).join(',');
  // biome-ignore lint/correctness/useExhaustiveDependencies: columnsKey is `columns` by value
  const stableColumns = useMemo(() => columns, [columnsKey]);

  // `sizes` is the live width of every column (auto-fit result, mutated directionally by drags).
  // `overrides` is the persisted subset the user set by hand.
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [containerWidth, setContainerWidth] = useState(0);

  // The grid stays hidden until the container is measured and the persisted widths have loaded, so a
  // reload reveals the saved layout once instead of flashing the defaults while the async read runs.
  // Visibility is written straight to the <table> rather than through React state: revealing is a DOM
  // mutation, so it never schedules an out-of-act state update in a parent's test when the async read
  // settles after the render.
  const tableElementRef = useRef<HTMLTableElement | null>(null);
  const measuredRef = useRef(false);
  const loadedRef = useRef(false);
  const applyVisibility = useCallback(() => {
    const table = tableElementRef.current;
    if (table) {
      table.style.visibility = measuredRef.current && loadedRef.current ? 'visible' : 'hidden';
    }
  }, []);
  const setTableElement = useCallback(
    (table: HTMLTableElement | null) => {
      tableElementRef.current = table;
      applyVisibility();
    },
    [applyVisibility]
  );

  const widths = stableColumns.map((column) => widthFor(sizes, column.id) ?? column.defaultWidth);
  const totalWidth = reservedPx + widths.reduce((sum, width) => sum + width, 0);

  // Refs so the stable callbacks below always read current values without being re-created.
  const columnsRef = useRef(stableColumns);
  columnsRef.current = stableColumns;
  const overridesRef = useRef(overrides);
  overridesRef.current = overrides;
  const sizesRef = useRef(sizes);
  sizesRef.current = sizes;
  const containerWidthRef = useRef(containerWidth);
  containerWidthRef.current = containerWidth;
  const reservedPxRef = useRef(reservedPx);
  reservedPxRef.current = reservedPx;
  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  const colElements = useRef(new Map<string, HTMLTableColElement>());
  const setColElement = useCallback((columnId: string, element: HTMLTableColElement | null) => {
    if (element) {
      colElements.current.set(columnId, element);
    } else {
      colElements.current.delete(columnId);
    }
  }, []);

  /**
   * A windowed grid collapses its off-screen columns into spacer `<col>`s. Those columns still
   * take part in a drag's redistribution, so the spacer standing in for them must follow the live
   * layout too — registered with the keys it covers, its width is re-summed on every direct DOM
   * write. Without this the table width moved with the hidden columns while the spacer held its
   * rendered width, visibly shearing the grid until pointer-up committed a re-render.
   */
  const spacerElements = useRef(
    new Map<string, { element: HTMLTableColElement; coveredIds: string[]; extraPx: number }>()
  );
  const setSpacerElement = useCallback(
    (spacerId: string, coveredIds: string[], element: HTMLTableColElement | null, extraPx = 0) => {
      if (element) {
        spacerElements.current.set(spacerId, { element, coveredIds, extraPx });
      } else {
        spacerElements.current.delete(spacerId);
      }
    },
    []
  );

  // Recompute the whole auto-fit layout. Takes its inputs explicitly so the resize effect below can
  // pass its own dependencies (and re-run when they change) while load/reset pass current ref values.
  const reflow = useCallback(
    (
      availableWidth: number,
      forColumns: SizedColumn[],
      withOverrides: Record<string, number>,
      reserved: number
    ) => {
      const resolved = resolveColumnWidths({
        containerWidth: availableWidth,
        columns: forColumns,
        overrides: withOverrides,
        reservedPx: reserved,
      });
      const layout: Record<string, number> = {};
      forColumns.forEach((column, index) => {
        layout[column.id] = resolved[index]!;
      });
      setSizes(layout);
    },
    []
  );

  // The host reports changed overrides through a ref-read callback, so its identity is free.
  const onWidthsChangeRef = useRef(onWidthsChange);
  onWidthsChangeRef.current = onWidthsChange;
  // Set while the current document's seed failed to load: the session's layout may not reflect
  // what is persisted, so reporting a "full" override map would overwrite widths this grid never
  // saw. Resizing still works for the session — it just stops being persisted.
  const seedFailedRef = useRef(false);
  const reportWidths = useCallback((widths: Record<string, number>) => {
    if (!seedFailedRef.current) {
      onWidthsChangeRef.current?.(widths);
    }
  }, []);

  // Seed the overrides from the host's persisted map. Reset synchronously first so one document's
  // widths never bleed into another when the grid is reused without unmounting; a promise keeps
  // the table hidden until it settles. A plain map is keyed by VALUE, not identity — a host is
  // free to build it inline per render, and re-seeding on every fresh-but-equal object would loop.
  const initialWidthsRef = useRef(initialWidths);
  initialWidthsRef.current = initialWidths;
  const initialWidthsKey =
    initialWidths === null
      ? 'null'
      : isThenable(initialWidths)
        ? `promise:${promiseIdOf(initialWidths)}`
        : Object.keys(initialWidths)
            .sort((a, b) => a.localeCompare(b))
            .map((key) => `${key}:${initialWidths[key]}`)
            .join(',');
  // A layout effect: a synchronous seed's state update re-renders before paint, so the widths are
  // in the DOM before the visibility flip below can reveal them — no flash.
  // biome-ignore lint/correctness/useExhaustiveDependencies: initialWidthsKey is `initialWidths` by value
  useLayoutEffect(() => {
    const seed = initialWidthsRef.current;
    loadedRef.current = false;
    applyVisibility();
    // The ref is reset in the same breath as the state: the columns-change reflow below can run
    // before the state lands, and reading the previous document's overrides through the ref would
    // re-apply them over this clean layout.
    overridesRef.current = {};
    setOverrides({});
    reflow(containerWidthRef.current, columnsRef.current, {}, reservedPxRef.current);
    if (seed === null) {
      // The host has not started loading yet — stay hidden until it hands over a map or promise.
      return;
    }
    const apply = (raw: Record<string, number>) => {
      // Pruned against the columns as they stand NOW, not as they stood when the seed started: a
      // column deleted while an async seed was in flight must not come back as a ghost override
      // the columns-change effect has no later chance to reconcile away.
      const present = new Set(columnsRef.current.map((column) => column.id));
      // A transient empty column set (a model still hydrating) must not discard the whole seed —
      // the columns-change effect prunes any genuinely stale keys once the columns arrive.
      const stored =
        columnsRef.current.length === 0
          ? raw
          : Object.fromEntries(Object.entries(raw).filter(([key]) => present.has(key)));
      // An empty map schedules nothing: the clean layout above already IS the seeded layout, and
      // the common no-saved-widths reload should not pay (or, in tests, leak) an extra update.
      overridesRef.current = stored;
      setOverrides(stored);
      reflow(containerWidthRef.current, columnsRef.current, stored, reservedPxRef.current);
    };
    seedFailedRef.current = false;
    if (!isThenable(seed)) {
      if (Object.keys(seed).length > 0) {
        apply(seed);
      }
      loadedRef.current = true;
      applyVisibility();
      return;
    }
    let active = true;
    void seed.then(
      (stored) => {
        if (!active) {
          return;
        }
        if (Object.keys(stored).length > 0) {
          // Applied synchronously, so the reveal below never paints the pre-seed defaults first.
          flushSync(() => apply(stored));
        }
        loadedRef.current = true;
        applyVisibility();
      },
      (error) => {
        if (!active) {
          return;
        }
        // Surfaced, not swallowed: width persistence silently going dead for the rest of the
        // session is the kind of thing only a log explains.
        console.warn('Decision table: reading the persisted column widths failed.', error);
        // The persisted widths are unknowable, not absent. Reveal the table with the defaults —
        // hidden-forever is worse than un-remembered widths — but stop persisting: a "full" map
        // built from this blind session would overwrite every width the failed read was hiding.
        seedFailedRef.current = true;
        loadedRef.current = true;
        applyVisibility();
      }
    );
    return () => {
      active = false;
    };
  }, [initialWidthsKey, reflow, applyVisibility]);

  // Re-fit on mount, container resize, and column add/delete. clientWidth already excludes the vertical
  // scrollbar, so auto-fit never overshoots into it.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => setContainerWidth(element.clientWidth));
    observer.observe(element);
    setContainerWidth(element.clientWidth);
    measuredRef.current = true;
    applyVisibility();
    return () => observer.disconnect();
  }, [containerRef, applyVisibility]);

  useEffect(() => {
    reflow(containerWidth, stableColumns, overridesRef.current, reservedPx);
  }, [containerWidth, stableColumns, reservedPx, reflow]);

  // Reconcile to the current columns whenever they change: drop overrides and persisted widths for
  // columns that no longer exist, so deleting a column reclaims its stored width and repeated
  // add/delete cycles cannot grow the host's map without bound. Single chokepoint — every delete path
  // (menu, panel, reducer) ends in a columns change, so none has to remember.
  useEffect(() => {
    // A transient empty column set (a model still hydrating) must not durably wipe the host's
    // stored widths.
    if (stableColumns.length === 0) {
      return;
    }
    const present = new Set(stableColumns.map((column) => column.id));
    const previous = overridesRef.current;
    const stale = Object.keys(previous).filter((key) => !present.has(key));
    if (stale.length === 0) {
      return;
    }
    const next = { ...previous };
    for (const key of stale) {
      delete next[key];
    }
    overridesRef.current = next;
    setOverrides(next);
    reportWidths(next);
  }, [stableColumns, reportWidths]);

  // Commit a resize: store the layout it produces and report the new override map to the host.
  const applyResize = useCallback(
    (key: string, newWidth: number) => {
      const next = resizeColumnWidths(
        sizesRef.current,
        columnsRef.current,
        key,
        newWidth,
        overridesRef.current,
        containerWidthRef.current,
        reservedPxRef.current
      );
      setSizes(next);
      const nextOverrides = { ...overridesRef.current, [key]: next[key]! };
      overridesRef.current = nextOverrides;
      setOverrides(nextOverrides);
      reportWidths(nextOverrides);
    },
    [reportWidths]
  );

  const resetColumn = useCallback(
    (key: string) => {
      // Computed outside the updater — updaters must stay pure (StrictMode double-invokes them,
      // and a replayed one would re-run the reflow against whatever the refs hold by then).
      const previous = overridesRef.current;
      if (previous[key] === undefined) {
        return;
      }
      const { [key]: _removed, ...next } = previous;
      overridesRef.current = next;
      setOverrides(next);
      reflow(containerWidthRef.current, columnsRef.current, next, reservedPxRef.current);
      reportWidths(next);
    },
    [reflow, reportWidths]
  );

  const onResizeStart = useCallback(
    (key: string, event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const handle = event.currentTarget as HTMLElement;
      const table = handle.closest('table') as HTMLTableElement | null;
      const startX = event.clientX;
      const startWidth =
        widthsRef.current[columnsRef.current.findIndex((column) => column.id === key)] ??
        MIN_COLUMN_WIDTH;
      try {
        handle.setPointerCapture(event.pointerId);
      } catch {
        // Capture is best-effort: without it the drag only tracks while the pointer stays over
        // the handle, and the buttons check below ends a sequence whose pointerup went elsewhere.
      }
      // One controller detaches every listener at once — on commit and on cancel alike, so no listener
      // is ever left attached after the sequence ends.
      const controller = new AbortController();
      const { signal } = controller;
      let latest = startWidth;

      // Write the whole resolved layout straight to the DOM (never through React) so the drag stays at
      // 60fps without repainting the memoised rows; pointer-up commits the same layout to state.
      const applyToDom = (layout: Record<string, number>) => {
        const defaults = new Map(
          columnsRef.current.map((column) => [column.id, column.defaultWidth])
        );
        const widthOf = (id: string) =>
          widthFor(layout, id) ?? defaults.get(id) ?? MIN_COLUMN_WIDTH;
        let total = reservedPxRef.current;
        for (const column of columnsRef.current) {
          const width = widthOf(column.id);
          total += width;
          const element = colElements.current.get(column.id);
          if (element) {
            element.style.width = `${width}px`;
          }
        }
        for (const spacer of spacerElements.current.values()) {
          // `extraPx` restores the non-column width the spacer covers. Without it a spacer holding a
          // group separator loses 30px for the length of the drag and snaps back on pointer-up.
          spacer.element.style.width = `${spacer.coveredIds.reduce((sum, id) => sum + widthOf(id), spacer.extraPx)}px`;
        }
        if (table) {
          table.style.width = `${total}px`;
        }
      };

      handle.addEventListener(
        'pointermove',
        (move) => {
          // A pointerup missed while capture failed would leave the drag armed, resuming against
          // the stale start on the next hover — the first buttonless move abandons it instead.
          if ((move.buttons & 1) === 0) {
            controller.abort();
            applyToDom(sizesRef.current);
            return;
          }
          latest = Math.max(MIN_COLUMN_WIDTH, startWidth + (move.clientX - startX));
          applyToDom(
            resizeColumnWidths(
              sizesRef.current,
              columnsRef.current,
              key,
              latest,
              overridesRef.current,
              containerWidthRef.current,
              reservedPxRef.current
            )
          );
        },
        { signal }
      );
      handle.addEventListener(
        'pointerup',
        () => {
          controller.abort();
          if (latest !== startWidth) {
            applyResize(key, latest);
            return;
          }
          // Back where it started, so there is nothing to commit — but the drag wrote redistributed
          // widths for the other columns, and recomputing at the start width does not necessarily
          // reproduce the layout React state still holds. Put the DOM back, as a cancel does.
          applyToDom(sizesRef.current);
        },
        { signal }
      );
      // A cancelled sequence (touch interrupted, capture lost) never commits: abandon the drag and put
      // every directly-mutated <col> and the <table> back to the widths React state still holds.
      handle.addEventListener(
        'pointercancel',
        () => {
          controller.abort();
          applyToDom(sizesRef.current);
        },
        { signal }
      );
    },
    [applyResize]
  );

  const onResizeKeyDown = useCallback(
    (key: string, event: React.KeyboardEvent) => {
      // Enter or Space resets to auto-fit, so keyboard users have the reset that double-click gives.
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        resetColumn(key);
        return;
      }
      let delta = 0;
      if (event.key === 'ArrowLeft') {
        delta = -COLUMN_RESIZE_KEYBOARD_STEP;
      } else if (event.key === 'ArrowRight') {
        delta = COLUMN_RESIZE_KEYBOARD_STEP;
      }
      if (delta === 0) {
        return;
      }
      event.preventDefault();
      const current =
        widthsRef.current[columnsRef.current.findIndex((column) => column.id === key)] ??
        MIN_COLUMN_WIDTH;
      applyResize(key, Math.max(MIN_COLUMN_WIDTH, current + delta));
    },
    [applyResize, resetColumn]
  );

  const onResizeReset = resetColumn;

  return {
    widths,
    totalWidth,
    setTableElement,
    setColElement,
    setSpacerElement,
    onResizeStart,
    onResizeKeyDown,
    onResizeReset,
  };
}
