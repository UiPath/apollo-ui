"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { ThemeProvider } from "../../registry/theme-provider/theme-provider";
import type { ThemeConfig } from "../../registry/theme-provider/theme-provider";
import { themes, type ThemeName, getCustomTheme } from "../themes";

const THEME_STORAGE_KEY = "apollo-vertex-theme";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const [themeConfig, setThemeConfig] = useState<ThemeConfig>(themes.ocean.config);

    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
            if (savedTheme === "custom") {
                const customTheme = getCustomTheme();
                if (customTheme) {
                    setThemeConfig(customTheme);
                } else {
                    // Fallback to ocean if custom theme doesn't exist
                    setThemeConfig(themes.ocean.config);
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
        <ThemeProvider theme={themeConfig} storageKey="theme">
            {children}
        </ThemeProvider>
    );
}

