import { useEffect } from "react";
import type { WorkbenchTheme } from "./workbench-url-state";

const THEMES: readonly WorkbenchTheme[] = ["light", "dark"];

/**
 * Puts the workbench's theme on <html> while it's open, where the site keeps
 * its own, and restores the site's after. The site's stored preference is
 * never touched.
 */
export function usePageTheme(theme: WorkbenchTheme) {
  useEffect(() => {
    const root = document.documentElement;
    const before = {
      classes: THEMES.filter((t) => root.classList.contains(t)),
      scheme: root.style.colorScheme,
    };
    const applied = () =>
      root.classList.contains(theme) &&
      THEMES.every((t) => t === theme || !root.classList.contains(t)) &&
      root.style.colorScheme === theme;
    const apply = () => {
      if (applied()) return;
      for (const t of THEMES) root.classList.toggle(t, t === theme);
      root.style.colorScheme = theme;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => {
      observer.disconnect();
      for (const t of THEMES)
        root.classList.toggle(t, before.classes.includes(t));
      root.style.colorScheme = before.scheme;
    };
  }, [theme]);
}
