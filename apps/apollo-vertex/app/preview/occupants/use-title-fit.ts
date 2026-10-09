import { type RefObject, useEffect, useState } from "react";

/** The least a title truncates to before its badge gives way. */
const TITLE_MIN = 64;

/**
 * Whether a title's badge still fits beside it: the title truncates
 * first, and the badge goes only when the title would have to shrink
 * past TITLE_MIN, or past its own width when that's less. The badge is
 * measured where it is, kept out of the flow while it's hidden.
 */
export function useTitleFit(
  row: RefObject<HTMLElement | null>,
  title: RefObject<HTMLElement | null>,
  badge: RefObject<HTMLElement | null>,
  /** What changes the badge's or title's text, to measure again. */
  text: string,
): boolean {
  const [fits, setFits] = useState(true);
  useEffect(() => {
    const at = row.current;
    if (!at) return;
    const measure = () => {
      const heading = title.current;
      const tag = badge.current;
      if (!heading || !tag) return;
      const gap = Number.parseFloat(getComputedStyle(at).columnGap) || 0;
      const least = Math.min(heading.scrollWidth, TITLE_MIN);
      setFits(at.clientWidth >= least + gap + tag.offsetWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(at);
    return () => observer.disconnect();
  }, [row, title, badge, text]);
  return fits;
}
