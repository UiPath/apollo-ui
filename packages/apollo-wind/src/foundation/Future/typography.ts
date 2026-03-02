/**
 * Apollo Future — Typography Tokens
 *
 * Single source of truth for all typography in the Future design language.
 * Includes values actively used in both Delegate and Flow templates.
 * Templates and components should import from this file rather than
 * hard-coding font values.
 */

// =============================================================================
// Font Family
// =============================================================================

export const fontFamily = {
  /** Primary sans-serif stack — used for all UI text */
  base: "'Inter', system-ui, -apple-system, sans-serif",
  /** Monospace stack — used for code, data, and technical content */
  monospace: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Fira Mono', Menlo, monospace",
  /** Numeric stack — used for tabular numbers and data displays */
  numeric: "'Inter', system-ui, -apple-system, sans-serif",

  // Legacy alias kept for backwards compatibility with existing templates
  /** @deprecated Use `fontFamily.base` instead */
  sans: "'Inter', system-ui, -apple-system, sans-serif",
} as const;

// =============================================================================
// Font Size
// =============================================================================

/**
 * Font size scale in pixels.
 *
 * | Token  | px  | Tailwind       |
 * |--------|-----|----------------|
 * | xs     | 12  | text-xs        |
 * | sm     | 14  | text-sm        |
 * | md     | 15  | text-[15px]    |
 * | base   | 16  | text-base      |
 * | xl     | 20  | text-xl        |
 * | 4xl    | 40  | text-[40px]    |
 */
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 15,
  base: 16,
  xl: 20,
  '4xl': 40,
} as const;

// =============================================================================
// Font Weight
// =============================================================================

/**
 * Font weight scale.
 *
 * | Token     | Value | Tailwind        |
 * |-----------|-------|-----------------|
 * | normal    | 400   | font-normal     |
 * | medium    | 500   | font-medium     |
 * | semibold  | 600   | font-semibold   |
 * | bold      | 700   | font-bold       |
 */
export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// =============================================================================
// Line Height
// =============================================================================

/**
 * Line height scale in pixels.
 *
 * | Token    | px  | Tailwind    |
 * |----------|-----|-------------|
 * | snug     | 20  | leading-5   |
 * | normal   | 24  | leading-6   |
 * | loose    | 36  | leading-9   |
 */
export const lineHeight = {
  snug: 20,
  normal: 24,
  loose: 36,
} as const;

// =============================================================================
// Letter Spacing
// =============================================================================

/**
 * Letter spacing tokens in pixels.
 *
 * | Token    | Value    | Tailwind              | Usage                      |
 * |----------|---------|-----------------------|----------------------------|
 * | tight    | -0.8px  | tracking-[-0.8px]     | Large headings (40px)      |
 * | snug     | -0.6px  | tracking-[-0.6px]     | Panel tab titles           |
 * | normal   | -0.4px  | tracking-[-0.4px]     | Primary text (16px)        |
 * | subtle   | -0.35px | tracking-[-0.35px]    | Subtitles, labels (14px)   |
 * | fine     | -0.3px  | tracking-[-0.3px]     | Small labels (12px)        |
 */
export const letterSpacing = {
  tight: '-0.8px',
  snug: '-0.6px',
  normal: '-0.4px',
  subtle: '-0.35px',
  fine: '-0.3px',
} as const;
