/**
 * Theme catalog shared between the preview (decorator) and the manager
 * (custom theme toolbar tool).
 */

export type ThemeMode =
  | 'light'
  | 'dark'
  | 'light-hc'
  | 'dark-hc'
  | 'future-light'
  | 'future-dark'
  | 'wireframe'
  | 'vertex'
  | 'canvas';

export interface ThemeItem {
  value: ThemeMode;
  title: string;
}

export const ALL_THEME_ITEMS: ThemeItem[] = [
  { value: 'light', title: 'Light' },
  { value: 'dark', title: 'Dark' },
  { value: 'light-hc', title: 'Light High Contrast' },
  { value: 'dark-hc', title: 'Dark High Contrast' },
  { value: 'future-light', title: 'Future Light' },
  { value: 'future-dark', title: 'Future Dark' },
  { value: 'wireframe', title: 'Wireframe' },
  { value: 'vertex', title: 'Vertex' },
  { value: 'canvas', title: 'Canvas' },
];

export const ALL_THEMES = ALL_THEME_ITEMS.map((item) => item.value);

/**
 * Themes available to Material stories (`parameters.material`). The demo
 * themes (wireframe/vertex/canvas) are Wind-only — the MUI theme layer has no
 * equivalent, so they are hidden from the selector on Material stories.
 */
export const MATERIAL_THEME_ITEMS: ThemeItem[] = ALL_THEME_ITEMS.filter(
  (item) => !['wireframe', 'vertex', 'canvas'].includes(item.value)
);

export const MATERIAL_THEMES = MATERIAL_THEME_ITEMS.map((item) => item.value);

/** Closest Material-supported theme for a demo theme. */
export function clampThemeForMaterial(theme: ThemeMode): ThemeMode {
  if (MATERIAL_THEMES.includes(theme)) {
    return theme;
  }
  return theme === 'wireframe' ? 'light' : 'dark';
}

export const DEFAULT_THEME: ThemeMode = 'future-dark';
