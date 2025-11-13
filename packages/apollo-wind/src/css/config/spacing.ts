/**
 * Spacing Configuration
 *
 * Tailwind spacing configuration using Apollo Design System tokens.
 * All spacing values reference CSS variables from apollo-core for automatic theme support.
 *
 * This module maps apollo-core spacing and padding tokens to Tailwind-compatible configuration.
 */

import { cssVars } from '../generated/css-vars';

/**
 * Named spacing scale configuration
 * Maps Apollo named spacing tokens to Tailwind format
 *
 * Apollo provides 8 named spacing values:
 * - micro: 4px
 * - xs: 8px
 * - s: 12px
 * - base: 16px
 * - m: 20px
 * - l: 24px
 * - xl: 32px
 * - xxl: 40px
 */
export const namedSpacing = {
  micro: `var(${cssVars.spacing.SpacingMicro})`,
  xs: `var(${cssVars.spacing.SpacingXs})`,
  s: `var(${cssVars.spacing.SpacingS})`,
  base: `var(${cssVars.spacing.SpacingBase})`,
  m: `var(${cssVars.spacing.SpacingM})`,
  l: `var(${cssVars.spacing.SpacingL})`,
  xl: `var(${cssVars.spacing.SpacingXl})`,
  xxl: `var(${cssVars.spacing.SpacingXxl})`,
} as const;

/**
 * Numeric spacing scale configuration
 * Standard Tailwind numeric scale (0-10) for consistent spacing
 *
 * Aligns with named scale where possible:
 * - 0: 0 (no spacing)
 * - 1: 4px (same as micro)
 * - 2: 8px (same as xs)
 * - 3: 12px (same as s)
 * - 4: 16px (same as base)
 * - 5: 20px (same as m)
 * - 6: 24px (same as l)
 * - 8: 32px (same as xl)
 * - 10: 40px (same as xxl)
 */
export const numericSpacing = {
  0: '0',
  1: `var(${cssVars.spacing.SpacingMicro})`, // 4px
  2: `var(${cssVars.spacing.SpacingXs})`, // 8px
  3: `var(${cssVars.spacing.SpacingS})`, // 12px
  4: `var(${cssVars.spacing.SpacingBase})`, // 16px
  5: `var(${cssVars.spacing.SpacingM})`, // 20px
  6: `var(${cssVars.spacing.SpacingL})`, // 24px
  8: `var(${cssVars.spacing.SpacingXl})`, // 32px
  10: `var(${cssVars.spacing.SpacingXxl})`, // 40px
} as const;

/**
 * Padding scale configuration
 * Component-level padding values (distinct from layout spacing)
 *
 * Apollo provides 7 padding values for components:
 * - xs: 4px
 * - s: 8px
 * - m: 12px
 * - l: 16px
 * - xl: 24px
 * - xxl: 32px
 * - xxxl: 48px
 *
 * Note: Padding is for component-level spacing, spacing is for layout.
 * Can be used with Tailwind's padding utilities or exported separately.
 */
export const padding = {
  xs: `var(${cssVars.padding.PadXs})`,
  s: `var(${cssVars.padding.PadS})`,
  m: `var(${cssVars.padding.PadM})`,
  l: `var(${cssVars.padding.PadL})`,
  xl: `var(${cssVars.padding.PadXl})`,
  xxl: `var(${cssVars.padding.PadXxl})`,
  xxxl: `var(${cssVars.padding.PadXxxl})`,
} as const;

/**
 * Complete spacing configuration export
 * Combines named spacing, numeric spacing, and padding
 */
export const spacing = {
  ...namedSpacing,
  ...numericSpacing,
} as const;

/**
 * Type exports for TypeScript consumers
 */
export type NamedSpacing = typeof namedSpacing;
export type NumericSpacing = typeof numericSpacing;
export type Padding = typeof padding;
export type Spacing = typeof spacing;
