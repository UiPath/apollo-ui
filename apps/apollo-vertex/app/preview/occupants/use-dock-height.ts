import { type RefObject, useEffect, useState } from "react";

/**
 * The height of the dock floating over the stage, kept free below what's
 * on it. Each view has its own dock: `view` names the one showing, so the
 * one observed is always it.
 */
export function useDockHeight(
  area: RefObject<HTMLElement | null>,
  view: string,
): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const dock = area.current?.querySelector("[data-slot=workbench-dock]");
    if (!dock) return;
    const observer = new ResizeObserver(() =>
      setHeight(dock.getBoundingClientRect().height),
    );
    observer.observe(dock);
    return () => observer.disconnect();
  }, [area, view]);
  return height;
}
