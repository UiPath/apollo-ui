"use client";

import { useEffect, useState } from "react";

export type ViewMode = "desktop" | "compact" | "stacked";

export function useViewMode(
  ref: React.RefObject<HTMLDivElement | null>,
): ViewMode {
  const [mode, setMode] = useState<ViewMode>("desktop");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w >= 1100) setMode("desktop");
      else if (w >= 800) setMode("compact");
      else setMode("stacked");
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return mode;
}
