"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/select/select";
import { hasCustomTheme, type ThemeName, themes } from "../themes";

const THEME_STORAGE_KEY = "apollo-vertex-theme";

export function ThemeSwitcher() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>("default");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    // Check if custom theme exists
    setShowCustom(hasCustomTheme());

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && (savedTheme in themes || savedTheme === "custom")) {
      setSelectedTheme(savedTheme as ThemeName);
    }

    // Listen for custom theme changes
    const handleStorageChange = () => {
      setShowCustom(hasCustomTheme());
    };

    window.addEventListener("storage", handleStorageChange);
    // Also listen for theme-change events in case they happen in the same tab
    window.addEventListener("theme-change", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("theme-change", handleStorageChange);
    };
  }, []);

  const handleThemeChange = (value: string) => {
    const themeName = value as ThemeName;
    setSelectedTheme(themeName);
    localStorage.setItem(THEME_STORAGE_KEY, themeName);

    // Dispatch a custom event to notify the ThemeProvider
    window.dispatchEvent(
      new CustomEvent("theme-change", { detail: themeName }),
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
        {showCustom && <SelectItem value="custom">Custom</SelectItem>}
      </SelectContent>
    </Select>
  );
}
