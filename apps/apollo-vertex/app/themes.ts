import type { ThemeConfig } from "../registry/theme-provider/theme-provider";

export const themes = {
    ocean: {
        name: "Ocean",
        config: {
            light: {
                background: "oklch(0.98 0.01 220)",
                foreground: "oklch(0.15 0.02 250)",
                card: "oklch(1 0 0)",
                cardForeground: "oklch(0.15 0.02 250)",
                popover: "oklch(1 0 0)",
                popoverForeground: "oklch(0.15 0.02 250)",
                primary: "oklch(0.55 0.15 240)",
                primaryForeground: "oklch(0.98 0.01 220)",
                secondary: "oklch(0.85 0.05 200)",
                secondaryForeground: "oklch(0.15 0.02 250)",
                muted: "oklch(0.92 0.02 220)",
                mutedForeground: "oklch(0.45 0.03 240)",
                accent: "oklch(0.75 0.12 200)",
                accentForeground: "oklch(0.98 0.01 220)",
                destructive: "oklch(0.577 0.245 27.325)",
                border: "oklch(0.88 0.02 220)",
                input: "oklch(0.88 0.02 220)",
                ring: "oklch(0.55 0.15 240)",
                chart1: "oklch(0.60 0.15 240)",
                chart2: "oklch(0.65 0.12 200)",
                chart3: "oklch(0.50 0.18 260)",
                chart4: "oklch(0.70 0.10 180)",
                chart5: "oklch(0.55 0.14 220)",
            },
            dark: {
                background: "oklch(0.12 0.02 250)",
                foreground: "oklch(0.95 0.01 220)",
                card: "oklch(0.18 0.02 250)",
                cardForeground: "oklch(0.95 0.01 220)",
                popover: "oklch(0.18 0.02 250)",
                popoverForeground: "oklch(0.95 0.01 220)",
                primary: "oklch(0.65 0.18 220)",
                primaryForeground: "oklch(0.12 0.02 250)",
                secondary: "oklch(0.25 0.03 240)",
                secondaryForeground: "oklch(0.95 0.01 220)",
                muted: "oklch(0.25 0.03 240)",
                mutedForeground: "oklch(0.65 0.04 220)",
                accent: "oklch(0.35 0.08 200)",
                accentForeground: "oklch(0.95 0.01 220)",
                destructive: "oklch(0.704 0.191 22.216)",
                border: "oklch(1 0 0 / 10%)",
                input: "oklch(1 0 0 / 15%)",
                ring: "oklch(0.65 0.18 220)",
                chart1: "oklch(0.60 0.20 240)",
                chart2: "oklch(0.70 0.15 200)",
                chart3: "oklch(0.55 0.22 260)",
                chart4: "oklch(0.75 0.12 180)",
                chart5: "oklch(0.60 0.18 220)",
            },
        } satisfies ThemeConfig,
    },
    sunset: {
        name: "Sunset",
        config: {
            light: {
                background: "oklch(0.99 0.01 40)",
                foreground: "oklch(0.15 0.02 30)",
                card: "oklch(1 0 0)",
                cardForeground: "oklch(0.15 0.02 30)",
                popover: "oklch(1 0 0)",
                popoverForeground: "oklch(0.15 0.02 30)",
                primary: "oklch(0.55 0.20 35)",
                primaryForeground: "oklch(0.99 0.01 40)",
                secondary: "oklch(0.88 0.08 50)",
                secondaryForeground: "oklch(0.15 0.02 30)",
                muted: "oklch(0.94 0.03 40)",
                mutedForeground: "oklch(0.45 0.03 30)",
                accent: "oklch(0.70 0.18 25)",
                accentForeground: "oklch(0.99 0.01 40)",
                destructive: "oklch(0.577 0.245 27.325)",
                border: "oklch(0.90 0.02 40)",
                input: "oklch(0.90 0.02 40)",
                ring: "oklch(0.55 0.20 35)",
                chart1: "oklch(0.65 0.22 35)",
                chart2: "oklch(0.70 0.18 25)",
                chart3: "oklch(0.60 0.24 45)",
                chart4: "oklch(0.75 0.15 15)",
                chart5: "oklch(0.68 0.20 30)",
            },
            dark: {
                background: "oklch(0.12 0.02 30)",
                foreground: "oklch(0.95 0.01 40)",
                card: "oklch(0.18 0.03 30)",
                cardForeground: "oklch(0.95 0.01 40)",
                popover: "oklch(0.18 0.03 30)",
                popoverForeground: "oklch(0.95 0.01 40)",
                primary: "oklch(0.70 0.22 35)",
                primaryForeground: "oklch(0.12 0.02 30)",
                secondary: "oklch(0.25 0.04 35)",
                secondaryForeground: "oklch(0.95 0.01 40)",
                muted: "oklch(0.25 0.04 35)",
                mutedForeground: "oklch(0.65 0.04 40)",
                accent: "oklch(0.40 0.12 25)",
                accentForeground: "oklch(0.95 0.01 40)",
                destructive: "oklch(0.704 0.191 22.216)",
                border: "oklch(1 0 0 / 10%)",
                input: "oklch(1 0 0 / 15%)",
                ring: "oklch(0.70 0.22 35)",
                chart1: "oklch(0.65 0.25 35)",
                chart2: "oklch(0.75 0.20 25)",
                chart3: "oklch(0.60 0.28 45)",
                chart4: "oklch(0.80 0.18 15)",
                chart5: "oklch(0.68 0.24 30)",
            },
        } satisfies ThemeConfig,
    },
} as const;

export type ThemeName = keyof typeof themes | "custom";

const CUSTOM_THEME_STORAGE_KEY = "apollo-vertex-custom-theme";

export function getCustomTheme(): ThemeConfig | null {
    if (typeof window === "undefined") return null;

    const savedTheme = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    if (!savedTheme) return null;

    try {
        return JSON.parse(savedTheme);
    } catch (e) {
        console.error("Failed to parse custom theme", e);
        return null;
    }
}

export function hasCustomTheme(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(CUSTOM_THEME_STORAGE_KEY) !== null;
}

