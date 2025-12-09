"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { ThemeProvider } from "../../registry/theme-provider/theme-provider";
import { themes, type ThemeName } from "../themes";

const THEME_STORAGE_KEY = "apollo-vertex-theme";

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
    const [selectedTheme, setSelectedTheme] = useState<ThemeName>("ocean");

    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && savedTheme in themes) {
            setSelectedTheme(savedTheme as ThemeName);
        }

        const handleThemeChange = (event: Event) => {
            const customEvent = event as CustomEvent<ThemeName>;
            setSelectedTheme(customEvent.detail);
        };

        window.addEventListener("theme-change", handleThemeChange);

        return () => {
            window.removeEventListener("theme-change", handleThemeChange);
        };
    }, []);

    return (
        <ThemeProvider theme={themes[selectedTheme].config}>
            {children}
        </ThemeProvider>
    );
}

