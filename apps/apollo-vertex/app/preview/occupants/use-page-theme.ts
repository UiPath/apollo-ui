import { useEffect } from "react";
import type { WorkbenchTheme } from "./workbench-url-state";

const THEMES: readonly WorkbenchTheme[] = ["light", "dark"];

/**
 * Applies the workbench's theme to the whole page while it's open, and puts
 * the site's theme back when it closes. The site marks its theme on <html>
 * (a light or dark class, and color-scheme), and a class on the workbench
 * can add dark but never undo the site's, so the theme goes on <html> too.
 * Portaled parts (tooltips, menus) follow it that way. The site's stored
 * preference is never touched, and if the site re-applies its own theme
 * while the workbench is open, the workbench's wins again.
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
