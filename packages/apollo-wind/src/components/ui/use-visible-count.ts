import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * How many items of a single-line row fit before the rest are counted by an overflow chip.
 *
 * Item widths vary, so a fixed limit either hides items a wide row has room for or overflows a
 * narrow one. The row is measured instead, while `enabled`, whenever `keys` change and whenever the
 * row, an item or the chip resizes.
 *
 * Render every item, always, with `itemRefs.current[i]` attached, and hide the ones past
 * `visibleCount` rather than slicing them out: the next measurement reads those elements, and a
 * sliced row could only ever shrink. Render the chip always too, with `overflowRef` attached and its
 * widest text, so its width is known before anything overflows.
 */
export function useVisibleCount(enabled: boolean, keys: readonly string[], gap: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const overflowRef = useRef<HTMLElement>(null);
  const itemCount = keys.length;
  const [visibleCount, setVisibleCount] = useState(itemCount);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Fractional widths: `clientWidth` and `offsetWidth` round each element to a whole pixel, and
    // those errors add up across the row, so a row that clips its last item could still look like
    // it fits. The row has no inline padding or border, so its box width is its content width.
    const widthOf = (el: Element | null | undefined) => el?.getBoundingClientRect().width ?? 0;
    const available = widthOf(container);
    const widths = Array.from({ length: itemCount }, (_, i) => widthOf(itemRefs.current[i]));
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, itemCount - 1);

    let next = itemCount;
    if (total > available) {
      // Only an overflowing row shows the chip, so only then is its width taken from the pills.
      const room = available - widthOf(overflowRef.current) - gap;
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

  // Joined, so a reorder of the same items re-measures too.
  const key = keys.join('\u0000');

  // Before paint, so the row never shows a frame with the wrong number of items. The items and the
  // chip are observed as well as the row: their widths change on their own, with the row staying
  // the same size, when a webfont replaces the fallback one or an item is relabelled.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` is read only as a trigger: it re-measures and re-observes when the items change but their count does not.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    for (const item of itemRefs.current.slice(0, itemCount)) {
      if (item) observer.observe(item);
    }
    if (overflowRef.current) observer.observe(overflowRef.current);
    return () => observer.disconnect();
  }, [enabled, key, itemCount, measure]);

  return { containerRef, itemRefs, overflowRef, visibleCount };
}
