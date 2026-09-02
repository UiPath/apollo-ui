"use client";

import { useEffect, useRef, useState } from "react";

/**
 * True when the ref'd element's content is taller than its visible box.
 * Used to show the flow footer's top border only when there's more content
 * below the fold — short screens stay borderless.
 */
export function useContentOverflow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, overflowing };
}
