import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// Port of apollo-wind's useVisibleCount. Keep every chip and the count mounted with refs attached,
// parking chips past `visibleCount` instead of unmounting them: the next measurement reads them.
export function useVisibleCount(enabled: boolean, keys: readonly string[], gap: number) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const overflowRef = useRef<HTMLElement | null>(null);
  const itemCount = keys.length;
  const [visibleCount, setVisibleCount] = useState(itemCount);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Fractional widths: whole-pixel rounding adds up across the row and hides an overflow.
    const widthOf = (el: Element | null | undefined) => el?.getBoundingClientRect().width ?? 0;
    const available = widthOf(container);
    const widths = Array.from({ length: itemCount }, (_, i) => widthOf(itemRefs.current[i]));
    const total = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, itemCount - 1);

    let next = itemCount;
    if (total > available) {
      const room = available - widthOf(overflowRef.current) - gap;
      let used = 0;
      next = 0;
      for (const width of widths) {
        if (used + width > room) break;
        used += width + gap;
        next += 1;
      }
    }
    setVisibleCount((prev) => (prev === next ? prev : next));
  }, [itemCount, gap]);

  const key = keys.join('\u0000');

  // Before paint; the chips and the count are observed too, since a webfont swap or a relabel
  // changes their widths while the row keeps its size.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` only re-triggers the measurement when the chips change but their count does not.
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
