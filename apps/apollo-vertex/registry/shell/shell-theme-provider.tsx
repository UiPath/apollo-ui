import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { THEME_STORAGE_KEY } from "./shell-constants";

export type ThemeConfig = {
  light?: Record<string, string>;
  dark?: Record<string, string>;
};
export type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  themeConfig?: ThemeConfig;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState | null>(null);

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

function applyThemeClass(resolved: "light" | "dark") {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

function applyThemeConfig(config: ThemeConfig, resolved: "light" | "dark") {
  const root = document.documentElement;
  const isDark = resolved === "dark";

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
  defaultTheme = "system",
  themeConfig,
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const stored = localStorage.getItem(storageKey);
    return isValidTheme(stored) ? stored : defaultTheme;
  });

  const systemDark = useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );

  const resolvedTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  // Apply light/dark class to document root
  useEffect(() => {
    applyThemeClass(resolvedTheme);
  }, [resolvedTheme]);

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

    applyThemeConfig(themeConfig, resolvedTheme);
    return () => clearThemeConfig();
  }, [themeConfig, resolvedTheme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context == null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
