/**
 * Typography Configuration
 *
 * Tailwind typography configuration using Apollo Design System tokens.
 * All typography values reference CSS variables from apollo-core for automatic theme support.
 *
 * This module maps apollo-core typography tokens to Tailwind-compatible configuration.
 */

import { FontFamily as ApolloCoreFontFamily } from '@uipath/apollo-core';

import { cssVars } from '../generated/css-vars';

/**
 * Helper function to parse font family string into array
 * Converts comma-separated font family string to array of font names
 */
function parseFontFamily(fontFamilyString: string): string[] {
  return fontFamilyString
    .split(',')
    .map((font) => font.trim())
    .filter((font) => font.length > 0);
}

/**
 * Font family configuration
 * Maps Apollo font families to Tailwind format
 *
 * - sans: Default body text font (Noto Sans with CJK variants + system fallbacks)
 * - title: Heading font (Poppins with Noto Sans fallback + system fallbacks)
 * - mono: Monospace font for code (Inconsolata + monospace fallback)
 *
 * All font stacks are preserved exactly as defined in apollo-core
 */
export const fontFamily = {
  sans: parseFontFamily(ApolloCoreFontFamily.FontNormal),
  title: parseFontFamily(ApolloCoreFontFamily.FontTitle),
  mono: parseFontFamily(ApolloCoreFontFamily.FontMono),
} as const;

/**
 * Font size configuration
 * Maps Apollo typography scale to Tailwind format with line heights
 *
 * Tailwind fontSize format: [fontSize, { lineHeight, fontWeight? }]
 *
 * Body text sizes:
 * - micro: 8px/12px
 * - xs: 10px/16px
 * - s: 12px/16px
 * - m: 14px/20px (default body text)
 * - l: 16px/24px
 *
 * Header sizes (include fontWeight):
 * - h4: 20px/24px/600
 * - h3: 24px/32px/600
 * - h2: 32px/40px/600
 * - h1: 36px/40px/600
 * - hero: 60px/64px/600
 */
export const fontSize = {
  // Body text sizes
  micro: [
    `var(${cssVars.fontFamily.FontMicroSize})`,
    { lineHeight: `var(${cssVars.fontFamily.FontMicroLineHeight})` },
  ],
  xs: [
    `var(${cssVars.fontFamily.FontXsSize})`,
    { lineHeight: `var(${cssVars.fontFamily.FontXsLineHeight})` },
  ],
  s: [
    `var(${cssVars.fontFamily.FontSSize})`,
    { lineHeight: `var(${cssVars.fontFamily.FontSLineHeight})` },
  ],
  m: [
    `var(${cssVars.fontFamily.FontMSize})`,
    { lineHeight: `var(${cssVars.fontFamily.FontMLineHeight})` },
  ],
  l: [
    `var(${cssVars.fontFamily.FontLSize})`,
    { lineHeight: `var(${cssVars.fontFamily.FontLLineHeight})` },
  ],

  // Header sizes (with fontWeight)
  h4: [
    `var(${cssVars.fontFamily.FontHeader4Size})`,
    {
      lineHeight: `var(${cssVars.fontFamily.FontHeader4LineHeight})`,
      fontWeight: `var(${cssVars.fontFamily.FontHeader4Weight})`,
    },
  ],
  h3: [
    `var(${cssVars.fontFamily.FontHeader3Size})`,
    {
      lineHeight: `var(${cssVars.fontFamily.FontHeader3LineHeight})`,
      fontWeight: `var(${cssVars.fontFamily.FontHeader3Weight})`,
    },
  ],
  h2: [
    `var(${cssVars.fontFamily.FontHeader2Size})`,
    {
      lineHeight: `var(${cssVars.fontFamily.FontHeader2LineHeight})`,
      fontWeight: `var(${cssVars.fontFamily.FontHeader2Weight})`,
    },
  ],
  h1: [
    `var(${cssVars.fontFamily.FontHeader1Size})`,
    {
      lineHeight: `var(${cssVars.fontFamily.FontHeader1LineHeight})`,
      fontWeight: `var(${cssVars.fontFamily.FontHeader1Weight})`,
    },
  ],
  hero: [
    `var(${cssVars.fontFamily.FontHeroSize})`,
    {
      lineHeight: `var(${cssVars.fontFamily.FontHeroLineHeight})`,
      fontWeight: `var(${cssVars.fontFamily.FontHeroWeight})`,
    },
  ],
} as const;

/**
 * Font weight configuration
 * Maps Apollo font weights to Tailwind format
 *
 * Numeric values:
 * - light: 300
 * - normal/regular: 400 (default)
 * - medium: 500
 * - semibold: 600
 * - bold: 700
 */
export const fontWeight = {
  light: `var(${cssVars.fontFamily.FontWeightLight})`,
  normal: `var(${cssVars.fontFamily.FontWeightDefault})`,
  regular: `var(${cssVars.fontFamily.FontWeightDefault})`, // Alias for normal
  medium: `var(${cssVars.fontFamily.FontWeightMedium})`,
  semibold: `var(${cssVars.fontFamily.FontWeightSemibold})`,
  bold: `var(${cssVars.fontFamily.FontWeightBold})`,
} as const;

/**
 * Complete typography configuration export
 * Combines font families, sizes, and weights
 */
export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
} as const;

/**
 * Type exports for TypeScript consumers
 */
export type FontFamily = typeof fontFamily;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type Typography = typeof typography;
