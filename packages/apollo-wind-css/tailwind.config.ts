import type { Config } from 'tailwindcss';
import { colors } from './src/config/colors';
import { typography } from './src/config/typography';
import { spacing } from './src/config/spacing';
import { shadows } from './src/config/shadows';
import { animations } from './src/config/animations';

/**
 * Tailwind Configuration for Apollo Wind Development
 *
 * This config is used for Storybook development only.
 * In Tailwind v4, plugins are loaded via @plugin directive in CSS (see .storybook/environment.scss).
 *
 * Consuming applications will use their own tailwind.config with apollo-wind preset (v3 compatibility)
 * or @plugin directive (v4).
 */
export default {
  theme: {
    colors,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    spacing,
    boxShadow: shadows,
    extend: {
      animation: animations,
    },
  },
  content: [
    './src/**/*.{ts,tsx,js,jsx}',
    './src/**/*.stories.{ts,tsx,js,jsx}',
    './.storybook/**/*.{ts,tsx,js,jsx}',
  ],
} satisfies Config;
