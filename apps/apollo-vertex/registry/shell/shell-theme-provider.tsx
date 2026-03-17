import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

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
    success?: string;
    info?: string;
    warning?: string;
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
    success?: string;
    info?: string;
    warning?: string;
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
  children: ReactNode;
  themeConfig?: ThemeConfig;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
});

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
  success: "--success",
  info: "--info",
  warning: "--warning",
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

function isValidTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function getEffectiveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

function applyThemeClass(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(getEffectiveTheme(theme));
}

function applyThemeConfig(config: ThemeConfig, theme: Theme) {
  const root = document.documentElement;
  const isDark = getEffectiveTheme(theme) === "dark";

  for (const cssVar of Object.values(cssVarMap)) {
    root.style.removeProperty(cssVar);
  }

  const themeVars = isDark ? config.dark : config.light;
  if (themeVars == null) return;

  for (const [key, value] of Object.entries(themeVars)) {
    const cssVar = cssVarMap[key];
    if (cssVar && value) {
      root.style.setProperty(cssVar, value);
    }
  }
}

function clearThemeConfig() {
  const root = document.documentElement;
  for (const cssVar of Object.values(cssVarMap)) {
    root.style.removeProperty(cssVar);
  }
}

export function ThemeProvider({
  children,
  themeConfig,
  storageKey = "vss-ui-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const stored = localStorage.getItem(storageKey);
    return isValidTheme(stored) ? stored : "system";
  });

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  // Apply light/dark class to document root
  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyThemeClass(theme);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Cross-tab sync: update React state when theme changes in another tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && isValidTheme(e.newValue)) {
        setThemeState(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [storageKey]);

  // Apply CSS variable overrides from themeConfig
  useEffect(() => {
    if (!themeConfig) return;

    applyThemeConfig(themeConfig, theme);
    return () => clearThemeConfig();
  }, [themeConfig, theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
