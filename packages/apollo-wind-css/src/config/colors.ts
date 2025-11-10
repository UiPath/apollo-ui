/**
 * Color Configuration
 *
 * Tailwind color configuration using Apollo Design System tokens.
 * All colors reference GENERIC CSS variables from apollo-core for automatic theme support.
 *
 * This module maps apollo-core color tokens to Tailwind-compatible color objects.
 * Color values use CSS variable references (var(--color-name)) to enable dynamic theming.
 *
 * IMPORTANT: Colors reference GENERIC CSS variables (e.g., --color-background)
 * not theme-specific ones (e.g., --color-background-light). Theme switching is
 * handled by apollo-core/portal-shell via body.{theme} classes that update the
 * generic variable values.
 */

import { cssVars } from '../generated/css-vars';

/**
 * Helper function to convert palette object to Tailwind-compatible format
 * Wraps each CSS variable name in var() syntax
 */
function mapPalette<T extends Record<string, string>>(palette: T): Record<keyof T, string> {
  const result = {} as Record<keyof T, string>;
  for (const [shade, varName] of Object.entries(palette)) {
    result[shade as keyof T] = `var(${varName})`;
  }
  return result;
}

/**
 * Helper function to wrap CSS variable names in var() syntax
 * Takes camelCase keys from cssVars and wraps values in var()
 */
function wrapInVar(tokens: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, varName] of Object.entries(tokens)) {
    result[key] = `var(${varName})`;
  }

  return result;
}

/**
 * Base color palette scales
 * Maps all apollo-core color palettes to Tailwind-compatible format
 *
 * Each palette preserves the exact shades available in apollo-core.
 * Note: Apollo color scales don't match standard Tailwind shades (50-900),
 * they include custom shades like 050, 150, 250, 350, 450, 550, 625, 750, 850
 */
export const basePalette = {
  orange: mapPalette(cssVars.color.palette.orange),
  blue: mapPalette(cssVars.color.palette.blue),
  'blue-secondary': mapPalette(cssVars.color.palette['blue-secondary']),
  green: mapPalette(cssVars.color.palette.green),
  yellow: mapPalette(cssVars.color.palette.yellow),
  red: mapPalette(cssVars.color.palette.red),
  purple: mapPalette(cssVars.color.palette.purple),
  'light-blue': mapPalette(cssVars.color.palette['light-blue']),
  pink: mapPalette(cssVars.color.palette.pink),
  ink: mapPalette(cssVars.color.palette.ink),
} as const;

/**
 * Semantic colors
 * Purpose-driven color mappings for UI elements (~117 semantic tokens)
 *
 * Includes comprehensive semantic color categories:
 * - Basic: white, black
 * - Status: error, warning, info, success (backgrounds, text, icons)
 * - UI Elements: background, foreground, border, selection, hover, focus
 * - Components: chip, icon, toggle, button, callout, carousel, code, skeleton
 * - Interactive states: hover, pressed, focused, disabled
 *
 * IMPORTANT: These reference GENERIC CSS variables (--color-background)
 * that automatically update when theme changes via body.{theme} classes.
 * Theme variants (light/dark) are handled at runtime by apollo-core, NOT here.
 *
 * Keys use camelCase (background, foregroundLight, primaryHover) for
 * JavaScript/TypeScript access. Tailwind converts these to kebab-case
 * utilities (bg-background, text-foreground-light, etc).
 */
export const semanticColors = wrapInVar(cssVars.color.semantic);

/**
 * Complete color configuration export
 * Combines base palette and semantic colors for Tailwind configuration
 */
export const colors = {
  ...basePalette,
  ...semanticColors,
} as const;

/**
 * Type exports for TypeScript consumers
 */
export type BasePalette = typeof basePalette;
export type SemanticColors = typeof semanticColors;
export type Colors = typeof colors;
