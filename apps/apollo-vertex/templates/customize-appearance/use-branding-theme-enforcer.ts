"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/registry/shell/shell-theme-provider";
import { useBrandingStore } from "./branding-store";

const PREVIOUS_THEME_KEY = "vertex-branding-previous-theme";

// Custom brand colors are calibrated for the light palette (the primary ramp
// generator targets light-mode lightness values). In dark mode the ramp
// renders against dark chrome and looks wrong. This hook locks the app to
// light mode whenever the user selects a custom theme and restores their
// previous theme when they switch back to the default themes.
//
// Call from your app root, inside the ThemeProvider:
//
//   function App() {
//     useBrandingThemeEnforcer();
//     return <YourRoutes />;
//   }
export function useBrandingThemeEnforcer() {
  const { themeMode } = useBrandingStore();
  const { theme, setTheme } = useTheme();
  const prevMode = useRef(themeMode);

  useEffect(() => {
    if (themeMode === "custom") {
      if (prevMode.current !== "custom" && typeof window !== "undefined") {
        window.localStorage.setItem(PREVIOUS_THEME_KEY, theme);
      }
      if (theme !== "light") {
        setTheme("light");
      }
    } else if (prevMode.current === "custom" && typeof window !== "undefined") {
      const saved = window.localStorage.getItem(PREVIOUS_THEME_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        setTheme(saved);
        window.localStorage.removeItem(PREVIOUS_THEME_KEY);
      }
    }
    prevMode.current = themeMode;
  }, [themeMode, theme, setTheme]);
}
