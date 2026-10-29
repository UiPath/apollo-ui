import { Virtualizer, type VirtualizerOptions } from '@tanstack/virtual-core';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * What a windowed axis mounts: runs of real items (half-open index ranges) and spacers standing in
 * for everything scrolled out of view, sized so scrollbar geometry matches the full table.
 */
type AxisSegment = { type: 'items'; from: number; to: number } | { type: 'spacer'; sizePx: number };

interface WindowSegmentsInput {
  itemCount: number;
  /** Uniform item size; ignored where `offsetsPx` provides the real geometry. */
  itemSizePx: number;
  start: number;
  end: number;
  retained: number | null;
  /** Prefix sums when items vary in size: item i spans `[offsetsPx[i], offsetsPx[i + 1])`. */
  offsetsPx?: number[];
}

/**
 * The window plus a retained item, kept mounted at its true offset even when scrolled out:
 * unmounting an editor is not a blur, so scrolling it away would silently discard the draft.
 * Ranges are clamped here, not at call sites: this is exported, and an out-of-range `start`
 * reaching a consumer's `slice` makes items vanish quietly while the scrollbar shrinks.
 */
export const windowSegments = ({
  itemCount,
  itemSizePx,
  start,
  end,
  retained,
  offsetsPx,
}: WindowSegmentsInput): AxisSegment[] => {
  const sizeBetween = (from: number, to: number): number =>
    offsetsPx ? offsetsPx[to]! - offsetsPx[from]! : (to - from) * itemSizePx;
  const safeStart = Math.min(Math.max(0, start), itemCount);
  const safeEnd = Math.min(Math.max(safeStart, end), itemCount);
  const safeRetained = retained !== null && retained >= 0 && retained < itemCount ? retained : null;

  const runs: { from: number; to: number }[] = [];
  if (safeRetained !== null && safeRetained < safeStart) {
    runs.push({ from: safeRetained, to: safeRetained + 1 });
  }
  if (safeStart < safeEnd) {
    runs.push({ from: safeStart, to: safeEnd });
  }
  if (safeRetained !== null && safeRetained >= safeEnd) {
    runs.push({ from: safeRetained, to: safeRetained + 1 });
  }

  const segments: AxisSegment[] = [];
  let cursor = 0;
  for (const run of runs) {
    if (run.from > cursor) {
      segments.push({ type: 'spacer', sizePx: sizeBetween(cursor, run.from) });
    }
    segments.push({ type: 'items', from: run.from, to: run.to });
    cursor = run.to;
  }
  if (cursor < itemCount) {
    segments.push({ type: 'spacer', sizePx: sizeBetween(cursor, itemCount) });
  }
  return segments;
};

const segmentsEqual = (left: AxisSegment[], right: AxisSegment[]): boolean =>
  left.length === right.length &&
  left.every((segment, index) => {
    const other = right[index]!;
    if (segment.type === 'spacer') {
      return other.type === 'spacer' && segment.sizePx === other.sizePx;
    }
    return other.type === 'items' && segment.from === other.from && segment.to === other.to;
  });

interface VirtualizedAxisOptions {
  axis: 'vertical' | 'horizontal';
  /**
   * Items mounted beyond each viewport edge — the scroll's crumple zone. The compositor moves the
   * page before React commits the incoming items, so everything scrolled past in that latency must
   * already be mounted or the user sees blank space.
   */
  overscanItems: number;
  /** Viewport size assumed until measured; also the size under jsdom, which measures everything as 0. */
  fallbackViewportPx: number;
  /**
   * Content before item 0 on this axis, so item N starts at `leading + N * size`. A function when
   * the value has to be measured (the sticky header's height on the vertical axis).
   */
  leadingFixedPx?: number | (() => number);
  /**
   * How much of the viewport's start edge is covered by sticky content — the header on the
   * vertical axis, the pinned leading columns on the horizontal one. An item at
   * the very start of the scrollport can still be hidden underneath it, so visibility starts past
   * this, not at 0.
   */
  stickyLeadingPx?: number | (() => number);
  /**
   * The end-edge counterpart: sticky content covering the viewport's far edge (the pinned
   * trailing gutter on the horizontal axis, when present). Without it, a scroll-into-view that
   * lands an item flush with the viewport edge has really landed it under the pinned overlay.
   */
  stickyTrailingPx?: number | (() => number);
  /**
   * Prefix sums when items vary in size (user-resized columns): item i spans
   * `[itemOffsetsPx[i], itemOffsetsPx[i + 1])`, length `itemCount + 1`. Every estimate — the
   * scroll anchor, the window's fill, spacer sizes and scroll-into-view targets — then reads real
   * geometry instead of walking index space at `itemSizePx`.
   */
  itemOffsetsPx?: number[];
}

interface VirtualizedAxis {
  segments: AxisSegment[];
  /** Ref callback for the scroll container; the axis observes its size and scroll offset. */
  measureRef: (element: HTMLElement | null) => void;
  /** Scrolls the container so the item is fully visible — not merely mounted in the overscan. */
  scrollItemIntoView: (container: HTMLElement | null, index: number) => void;
}

const resolve = (value: number | (() => number) | undefined): number =>
  typeof value === 'function' ? value() : (value ?? 0);

/**
 * Windows one axis of the grid to its viewport on TanStack `virtual-core`'s measurement/scroll
 * engine: the DOM holds the visible items plus overscan, spacers keep the scrollbar honest, and
 * scrolling swaps what is mounted. Rendering cost is proportional to the viewport on both axes.
 *
 * The core is bound directly rather than through `useVirtualizer`: the react adapter re-renders
 * unconditionally on every raw range change — one render per item boundary crossed — where this
 * grid's budget is one render per coarse anchor step. The `onChange` below recomputes the anchored
 * window and calls `setState` only when it actually moved, preserving that cadence; the core still
 * owns offset observation, rect measurement and the offset→index math.
 */
export const useVirtualizedAxis = (
  itemCount: number,
  itemSizePx: number,
  retained: number | null,
  options: VirtualizedAxisOptions
): VirtualizedAxis => {
  const {
    axis,
    overscanItems,
    fallbackViewportPx,
    leadingFixedPx,
    stickyLeadingPx,
    stickyTrailingPx,
    itemOffsetsPx,
  } = options;
  // Half the overscan: every window shift then happens at least the other half away from blank
  // space, while cutting scroll-driven renders by the same factor.
  const shiftThreshold = Math.max(1, Math.floor(overscanItems / 2));

  /** Start of item `index` in content space (before the leading offset). */
  const itemStartPx = useCallback(
    (index: number): number =>
      itemOffsetsPx
        ? itemOffsetsPx[Math.min(index, itemOffsetsPx.length - 1)]!
        : index * itemSizePx,
    [itemOffsetsPx, itemSizePx]
  );

  /** The item containing the content-space position — a binary search when sizes vary. */
  const indexAtPx = useCallback(
    (px: number): number => {
      if (!itemOffsetsPx) {
        return Math.floor(px / itemSizePx);
      }
      let low = 0;
      let high = itemOffsetsPx.length - 2;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (itemOffsetsPx[mid]! <= px) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }
      return low;
    },
    [itemOffsetsPx, itemSizePx]
  );

  // Trails the first visible item by up to the threshold and snaps forward in coarse steps, so a
  // fling costs a handful of renders instead of one per item boundary.
  const [anchor, setAnchor] = useState(0);
  const [viewportPx, setViewportPx] = useState<number | null>(null);
  const anchorRef = useRef(anchor);
  const viewportRef = useRef(viewportPx);

  const scrollElementRef = useRef<HTMLElement | null>(null);
  const measureRef = useCallback((element: HTMLElement | null) => {
    scrollElementRef.current = element;
  }, []);

  // The option bag is rebuilt per render (the core merges via `setOptions`), so every callback
  // reads current props without the instance being torn down.
  const virtualizerOptions: VirtualizerOptions<HTMLElement, Element> = {
    count: itemCount,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: (index) =>
      itemOffsetsPx ? itemOffsetsPx[index + 1]! - itemOffsetsPx[index]! : itemSizePx,
    // Where item 0 starts in the scroll content — the sticky header above the rows, the fixed
    // leading columns before the windowed columns. Resolved per render; a mid-render
    // header resize is a bounded staleness the overscan absorbs (scrollItemIntoView reads live).
    paddingStart: resolve(leadingFixedPx),
    overscan: 0,
    horizontal: axis === 'horizontal',
    initialRect: { width: fallbackViewportPx, height: fallbackViewportPx },
    // Direct assignment, never smooth-scrolled. Reached only when the scroll element attaches
    // (`_willUpdate` writes the current offset back to itself); no positioned scroll ever routes
    // here, because `scrollItemIntoView` below owns positioning and `scrollToIndex`/
    // `scrollToOffset` stay unused.
    //
    // `scrollToIndex(index, { align: "auto" })` with `scrollPaddingStart`/`scrollPaddingEnd` set to
    // the sticky insets does compute the same target, but it is not usable here. It measures
    // against `getScrollOffset()`, which this binding only advances when the DOM emits a `scroll`
    // event — so a second keyboard move in the same frame targets from a stale offset — and it arms
    // `scheduleScrollReconcile`, a rAF loop that re-targets until the observed offset matches or 5s
    // elapse. Under jsdom (no layout, no scroll events) that loop never converges and spins for the
    // full timeout on every navigation. `scrollItemIntoView` reads the container's live geometry
    // instead, which is correct in both environments and costs no frames.
    scrollToFn: (offset, _options, instance) => {
      const element = instance.scrollElement;
      if (!element) {
        return;
      }
      if (axis === 'horizontal') {
        element.scrollLeft = offset;
      } else {
        element.scrollTop = offset;
      }
    },
    // A plain scroll listener with `isScrolling` pinned false. The default observer arms a 150ms
    // debounce per scroll event whose delayed notify is a state update outside any act()/event
    // scope — a flake class under any test setup that gates on stray console output — and costs
    // one extra notify per scroll burst. Nothing here consumes `isScrolling`.
    observeElementOffset: (instance, callback) => {
      const element = instance.scrollElement;
      if (!element) {
        return;
      }
      const report = () =>
        callback(axis === 'horizontal' ? element.scrollLeft : element.scrollTop, false);
      report();
      element.addEventListener('scroll', report, { passive: true });
      return () => element.removeEventListener('scroll', report);
    },
    // The fallback rect until a real measurement arrives, then ResizeObserver only — never a
    // synchronous read at subscribe time, which would let an unrelated layout mock masquerade as
    // the viewport. Under a test DOM with no real layout the observer never reports a usable
    // rect, so the fallback persists for the whole test — exactly as the bespoke hook behaved.
    observeElementRect: (instance, callback) => {
      const element = instance.scrollElement;
      if (!element) {
        return;
      }
      callback({ width: fallbackViewportPx, height: fallbackViewportPx });
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      const observer = new ResizeObserver(() => {
        callback({
          width: element.clientWidth || fallbackViewportPx,
          height: element.clientHeight || fallbackViewportPx,
        });
      });
      observer.observe(element);
      return () => observer.disconnect();
    },
    // The render gate. The core notifies on every raw range change — every item boundary the
    // scroll crosses — and this callback turns that into at most one state change per coarse
    // anchor step or real viewport resize.
    onChange: (instance) => {
      const range = instance.range;
      if (range) {
        const nextAnchor =
          Math.abs(range.startIndex - anchorRef.current) >= shiftThreshold
            ? range.startIndex
            : anchorRef.current;
        if (nextAnchor !== anchorRef.current) {
          anchorRef.current = nextAnchor;
          setAnchor(nextAnchor);
        }
      }
      const rect = instance.scrollRect;
      if (rect) {
        const nextViewport = (axis === 'horizontal' ? rect.width : rect.height) || null;
        if (nextViewport !== viewportRef.current) {
          viewportRef.current = nextViewport;
          setViewportPx(nextViewport);
        }
      }
    },
  };

  const virtualizerRef = useRef<Virtualizer<HTMLElement, Element> | null>(null);
  if (virtualizerRef.current === null) {
    virtualizerRef.current = new Virtualizer(virtualizerOptions);
  } else {
    virtualizerRef.current.setOptions(virtualizerOptions);
  }
  const virtualizer = virtualizerRef.current;

  // The core's own lifecycle: observers attach on mount and re-attach when the scroll element
  // changes; `_willUpdate` runs per commit so a late-attached container ref is picked up.
  useEffect(() => virtualizer._didMount(), [virtualizer]);
  useLayoutEffect(() => {
    virtualizer._willUpdate();
  });

  // Sizes are cached by the core and `estimateSize` is not one of its measurement dependencies —
  // a resized column changes the offsets array and must explicitly invalidate. (`paddingStart` IS
  // a dependency, which makes leading pinned-column resizes look self-healing in manual checks while
  // windowed-column resizes silently stale — hence keying on the offsets identity, not on symptoms.)
  const isFirstMeasureRef = useRef(true);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the geometry inputs are the invalidation key — the effect re-measures when they change, not because its body reads them
  useEffect(() => {
    if (isFirstMeasureRef.current) {
      isFirstMeasureRef.current = false;
      return;
    }
    virtualizer.measure();
  }, [virtualizer, itemOffsetsPx, itemSizePx]);

  // Read through a ref so this callback's identity survives width changes: consumers scroll the
  // selection into view from an effect keyed on it, and an offsets-keyed identity re-fired that
  // effect on every column resize or rename — yanking the viewport back to the selected column.
  const itemStartPxRef = useRef(itemStartPx);
  itemStartPxRef.current = itemStartPx;
  const scrollItemIntoView = useCallback(
    (container: HTMLElement | null, index: number) => {
      if (!container) {
        return;
      }
      const viewport =
        (axis === 'vertical' ? container.clientHeight : container.clientWidth) ||
        fallbackViewportPx;
      const scrollOffset = axis === 'vertical' ? container.scrollTop : container.scrollLeft;
      const sticky = resolve(stickyLeadingPx);
      const trailing = resolve(stickyTrailingPx);
      const itemStart = resolve(leadingFixedPx) + itemStartPxRef.current(index);
      const itemEnd = resolve(leadingFixedPx) + itemStartPxRef.current(index + 1);
      let next: number | null = null;
      if (itemStart < scrollOffset + sticky) {
        next = Math.max(0, itemStart - sticky);
      } else if (itemEnd > scrollOffset + viewport - trailing) {
        // Past the far edge minus whatever floats over it — flush with the viewport edge would
        // leave the item's tail under the pinned trailing overlay, not visible.
        next = itemEnd - viewport + trailing;
      }
      if (next !== null) {
        if (axis === 'vertical') {
          container.scrollTop = next;
        } else {
          container.scrollLeft = next;
        }
      }
    },
    [axis, leadingFixedPx, stickyLeadingPx, stickyTrailingPx, fallbackViewportPx]
  );

  // Preserved identity when the window is unchanged: retaining an item already inside the window, or
  // any recompute that lands on the same ranges, must not hand consumers a new array — rows memo
  // on it, and a fresh identity here repaints every mounted row.
  const previousSegmentsRef = useRef<AxisSegment[]>([]);
  const segments = useMemo(() => {
    const viewport = viewportPx ?? fallbackViewportPx;
    // Clamped so deleting items while scrolled deep cannot leave an empty window waiting for the
    // browser's own scroll correction.
    const safeAnchor = Math.min(anchor, Math.max(0, itemCount - 1));
    const start = Math.max(0, safeAnchor - overscanItems);
    // How many items fill a viewport from the anchor: exact under offsets, uniform otherwise.
    const fillEnd = itemOffsetsPx
      ? indexAtPx(itemStartPx(safeAnchor) + viewport - 1) + 1
      : safeAnchor + Math.ceil(viewport / itemSizePx);
    const end = Math.min(itemCount, fillEnd + overscanItems);
    const next = windowSegments({
      itemCount,
      itemSizePx,
      start,
      end,
      retained,
      offsetsPx: itemOffsetsPx,
    });
    if (segmentsEqual(previousSegmentsRef.current, next)) {
      return previousSegmentsRef.current;
    }
    previousSegmentsRef.current = next;
    return next;
  }, [
    itemCount,
    itemSizePx,
    anchor,
    viewportPx,
    retained,
    overscanItems,
    fallbackViewportPx,
    itemOffsetsPx,
    indexAtPx,
    itemStartPx,
  ]);

  return { segments, measureRef, scrollItemIntoView };
};
