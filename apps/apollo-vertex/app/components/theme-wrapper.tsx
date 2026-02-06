"use client";

import type React from "react";
import { useEffect, useState } from "react";
import type { ThemeConfig } from "@/registry/shell/internal/theme-provider";
import { ThemeProvider } from "@/registry/shell/internal/theme-provider";
import { getCustomTheme, type ThemeName, themes } from "../themes";

const THEME_STORAGE_KEY = "apollo-vertex-theme";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(
    themes.default.config,
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      if (savedTheme === "custom") {
        const customTheme = getCustomTheme();
        if (customTheme) {
          setThemeConfig(customTheme);
        } else {
          // Fallback to default if custom theme doesn't exist
          setThemeConfig(themes.default.config);
        }
      } else if (savedTheme in themes) {
        setThemeConfig(themes[savedTheme as keyof typeof themes].config);
      }
    }

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeName>;
      const newTheme = customEvent.detail;

      if (newTheme === "custom") {
        const customTheme = getCustomTheme();
        if (customTheme) {
          setThemeConfig(customTheme);
        }
      } else if (newTheme in themes) {
        setThemeConfig(themes[newTheme as keyof typeof themes].config);
      }
    };

    window.addEventListener("theme-change", handleThemeChange);

    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
    };
  }, []);

  return (
    <ThemeProvider themeConfig={themeConfig} storageKey="theme">
      {children}
    </ThemeProvider>
  );
}
