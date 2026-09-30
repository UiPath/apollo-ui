import * as React from 'react';

/**
 * How many items of a single-line row fit before the rest are counted by an overflow chip.
 *
 * Item widths vary, so a fixed limit either hides items a wide row has room for or overflows a
 * narrow one. The row is measured instead, on every resize and whenever `itemsKey` changes.
 *
 * Render every item, always, with `itemRefs.current[i]` attached, and hide the ones past
 * `visibleCount` rather than slicing them out: the next measurement reads those elements, and a
 * sliced row could only ever shrink. Render the chip always too, with `overflowRef` attached and its
 * widest text, so its width is known before anything overflows.
 */
export function useVisibleCount(itemCount: number, itemsKey: string, gap: number) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<(HTMLElement | null)[]>([]);
  const overflowRef = React.useRef<HTMLElement>(null);
  const [visibleCount, setVisibleCount] = React.useState(itemCount);

  const measure = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const available = container.clientWidth;
    const widths = Array.from(
      { length: itemCount },
      (_, i) => itemRefs.current[i]?.offsetWidth ?? 0
    );
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, itemCount - 1);

    let next = itemCount;
    if (total > available) {
      // Only an overflowing row shows the chip, so only then is its width taken from the pills.
      const room = available - (overflowRef.current?.offsetWidth ?? 0) - gap;
      let used = 0;
      let fits = 0;
      for (const width of widths) {
        if (used + width > room) break;
        used += width + gap;
        fits += 1;
      }
      // At least one, even in a row too narrow for it: a lone "+4 more" says nothing about what is
      // selected.
      next = Math.max(1, fits);
    }
    setVisibleCount((prev) => (prev === next ? prev : next));
  }, [itemCount, gap]);

  // Before paint, so the row never shows a frame with the wrong number of items.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `itemsKey` re-measures when the items change but their count does not.
  React.useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure, itemsKey]);

  return { containerRef, itemRefs, overflowRef, visibleCount };
}
