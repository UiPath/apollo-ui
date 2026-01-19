import type React from "react";
import { useCallback, useEffect } from "react";

export interface ThemeConfig {
  light?: {
    background?: string;
    foreground?: string;
    card?: string;
    cardForeground?: string;
    popover?: string;
    popoverForeground?: string;
    primary?: string;
    primaryForeground?: string;
    secondary?: string;
    secondaryForeground?: string;
    muted?: string;
    mutedForeground?: string;
    accent?: string;
    accentForeground?: string;
    destructive?: string;
    border?: string;
    input?: string;
    ring?: string;
    chart1?: string;
    chart2?: string;
    chart3?: string;
    chart4?: string;
    chart5?: string;
    sidebar?: string;
    sidebarForeground?: string;
    sidebarPrimary?: string;
    sidebarPrimaryForeground?: string;
    sidebarAccent?: string;
    sidebarAccentForeground?: string;
    sidebarBorder?: string;
    sidebarRing?: string;
  };

  dark?: {
    background?: string;
    foreground?: string;
    card?: string;
    cardForeground?: string;
    popover?: string;
    popoverForeground?: string;
    primary?: string;
    primaryForeground?: string;
    secondary?: string;
    secondaryForeground?: string;
    muted?: string;
    mutedForeground?: string;
    accent?: string;
    accentForeground?: string;
    destructive?: string;
    border?: string;
    input?: string;
    ring?: string;
    chart1?: string;
    chart2?: string;
    chart3?: string;
    chart4?: string;
    chart5?: string;
    sidebar?: string;
    sidebarForeground?: string;
    sidebarPrimary?: string;
    sidebarPrimaryForeground?: string;
    sidebarAccent?: string;
    sidebarAccentForeground?: string;
    sidebarBorder?: string;
    sidebarRing?: string;
  };
}

interface ThemeProviderProps {
  theme?: ThemeConfig;
  children: React.ReactNode;
  storageKey?: string;
}

const cssVarMap: Record<string, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
};

type Theme = "light" | "dark" | "system";

const getStoredTheme = (storageKey: string): Theme => {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
};

const getEffectiveTheme = (storedTheme: Theme): "light" | "dark" => {
  if (storedTheme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return storedTheme;
};

export const ThemeProvider = ({
  theme,
  children,
  storageKey = "vss-ui-theme",
}: ThemeProviderProps) => {
  const applyTheme = useCallback(
    (themeConfig: ThemeConfig) => {
      const root = document.documentElement;
      const storedTheme = getStoredTheme(storageKey);
      const effectiveTheme = getEffectiveTheme(storedTheme);
      const isDark = effectiveTheme === "dark";

      for (const cssVar of Object.values(cssVarMap)) {
        root.style.removeProperty(cssVar);
      }

      const themeVars = isDark ? themeConfig.dark : themeConfig.light;

      if (themeVars == null) return;

      for (const [key, value] of Object.entries(themeVars)) {
        const cssVar = cssVarMap[key];
        if (!cssVar || !value) {
          continue;
        }
        root.style.setProperty(cssVar, value);
      }
    },
    [storageKey],
  );

  useEffect(() => {
    if (!theme) return;

    applyTheme(theme);

    const storedTheme = getStoredTheme(storageKey);
    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleThemeChange = () => {
      applyTheme(theme);
    };

    // Listen to system theme changes if in system mode
    if (storedTheme === "system") {
      systemThemeQuery.addEventListener("change", handleThemeChange);
    }

    // Listen to storage changes (for cross-tab updates)
    window.addEventListener("storage", handleThemeChange);

    // Watch for class changes on the html element (for same-tab light/dark toggle)
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      systemThemeQuery.removeEventListener("change", handleThemeChange);
      window.removeEventListener("storage", handleThemeChange);
      observer.disconnect();

      const root = document.documentElement;
      for (const cssVar of Object.values(cssVarMap)) {
        root.style.removeProperty(cssVar);
      }
    };
  }, [theme, applyTheme, storageKey]);

  return <>{children}</>;
};
