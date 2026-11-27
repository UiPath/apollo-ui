import type { Theme } from '@uipath/apollo-wind';
import { useEffect } from 'react';

const CARTOGRAPHER_DARK = {
  '--bg-primary': '#141414',
  '--bg-secondary': '#232323',
  '--bg-elevated': '#232323',
  '--bg-highlight': 'color-mix(in srgb, #f4f4f4 8%, transparent)',
  '--popover-bg': '#232323',
  '--ui-bg-hover': '#1c1c1c',
  '--fg-emphasized': '#f4f4f4',
  '--fg-deemphasized': '#b0b0b0',
  '--fg-disabled': '#797979',
  '--border-primary': '#2a2a2a',
  '--border-subtle': '#2a2a2a',
  '--input-border': '#737373',
  '--primary': '#0169cc',
  '--primary-foreground': '#ffffff',
  '--ui-accent': '#0169cc',
  '--surface-hover': 'color-mix(in srgb, #f4f4f4 8%, transparent)',
  '--status-error': '#da1e28',
  '--status-error-text': '#f87171',
  '--fg-on-error': '#ffffff',
  '--status-success': '#42be65',
  '--status-success-text': '#42be65',
  '--status-warning': '#f1c21b',
  '--status-warning-text': '#fb923c',
  '--status-info': '#0169cc',
  '--chart-purple': '#b748b6',
  '--button-primary': '#0169cc',
  '--bg-select': 'color-mix(in srgb, #f4f4f4 8%, transparent)',
  '--status-warning-bg': 'rgba(249, 115, 22, 0.15)',
};

const CARTOGRAPHER_LIGHT: typeof CARTOGRAPHER_DARK = {
  '--bg-primary': '#fafafd',
  '--bg-secondary': '#fafafa',
  '--bg-elevated': '#ffffff',
  '--bg-highlight': 'color-mix(in srgb, #1a2b3c 8%, transparent)',
  '--popover-bg': '#ffffff',
  '--ui-bg-hover': 'rgba(0, 0, 0, 0.04)',
  '--fg-emphasized': '#1a2b3c',
  '--fg-deemphasized': '#62626b',
  '--fg-disabled': '#8a97a0',
  '--border-primary': '#e4e4e7',
  '--border-subtle': '#e5e9ec',
  '--input-border': '#8a8a8a',
  '--primary': '#0169cc',
  '--primary-foreground': '#ffffff',
  '--ui-accent': '#0169cc',
  '--surface-hover': 'color-mix(in srgb, #1a2b3c 8%, transparent)',
  '--status-error': '#dc2626',
  '--status-error-text': '#b91c1c',
  '--fg-on-error': '#ffffff',
  '--status-success': '#22c55e',
  '--status-success-text': '#166534',
  '--status-warning': '#f59e0b',
  '--status-warning-text': '#8f5800',
  '--status-info': '#0169cc',
  '--chart-purple': '#933692',
  '--button-primary': '#0169cc',
  '--bg-select': 'color-mix(in srgb, #1a2b3c 8%, transparent)',
  '--status-warning-bg': '#fff7ed',
};

const STORY_THEME_OF = {
  host: { theme: undefined, vars: undefined },
  'future-light': { theme: 'future-light', vars: undefined },
  'future-dark': { theme: 'future-dark', vars: undefined },
  'cartographer light': { theme: 'cartographer', vars: CARTOGRAPHER_LIGHT },
  'cartographer dark': { theme: 'cartographer', vars: CARTOGRAPHER_DARK },
} as const satisfies Record<
  string,
  { theme: Theme | undefined; vars: typeof CARTOGRAPHER_DARK | undefined }
>;

export type StoryTheme = keyof typeof STORY_THEME_OF;

export const STORY_THEMES = Object.keys(STORY_THEME_OF) as StoryTheme[];

/** The theme a story passes, after putting Cartographer's own variables on the page as its app does. */
export const useStoryTheme = (choice: StoryTheme): Theme | undefined => {
  const { theme, vars } = STORY_THEME_OF[choice];
  useEffect(() => {
    if (!vars) return;
    const { style } = document.body;
    for (const [name, value] of Object.entries(vars)) style.setProperty(name, value);
    return () => {
      for (const name of Object.keys(vars)) style.removeProperty(name);
    };
  }, [vars]);
  return theme;
};
