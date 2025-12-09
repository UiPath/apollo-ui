"use client";

import { useState, useEffect } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { themes, type ThemeName } from "../themes";

const THEME_STORAGE_KEY = "apollo-vertex-theme";

export function ThemeSwitcher() {
    const [selectedTheme, setSelectedTheme] = useState<ThemeName>("ocean");

    useEffect(() => {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && savedTheme in themes) {
            setSelectedTheme(savedTheme as ThemeName);
        }
    }, []);

    const handleThemeChange = (value: string) => {
        const themeName = value as ThemeName;
        setSelectedTheme(themeName);
        localStorage.setItem(THEME_STORAGE_KEY, themeName);
        
        // Dispatch a custom event to notify the ThemeProvider
        window.dispatchEvent(
            new CustomEvent("theme-change", { detail: themeName })
        );
    };

    return (
        <Select value={selectedTheme} onValueChange={handleThemeChange}>
            <SelectTrigger size="sm">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(themes).map(([key, theme]) => (
                    <SelectItem key={key} value={key}>
                        {theme.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

