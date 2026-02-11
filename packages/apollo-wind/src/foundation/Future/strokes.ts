/**
 * Apollo Future — Stroke Tokens
 *
 * Single source of truth for border widths and border colors
 * in the Future design language.
 * Includes values actively used in both Delegate and Flow templates.
 *
 * For border radius tokens, see `radius.ts`.
 */

// =============================================================================
// Border Width
// =============================================================================

/**
 * Border width scale in pixels.
 *
 * | Token   | px | Tailwind       |
 * |---------|----|----------------|
 * | none    | 0  | border-0       |
 * | default | 1  | border         |
 */
export const borderWidth = {
  none: 0,
  default: 1,
} as const;

// =============================================================================
// Border Color
// =============================================================================

/**
 * Semantic border color tokens mapped to Tailwind Zinc palette.
 *
 * | Token    | Hex     | Tailwind          | Usage                          |
 * |----------|---------|-------------------|--------------------------------|
 * | subtle   | #27272a | border-zinc-800   | Dividers, card borders         |
 * | default  | #3f3f46 | border-zinc-700   | Default component borders      |
 * | muted    | #18181b | border-zinc-900   | Subdued container borders      |
 * | strong   | #e4e4e7 | border-zinc-200   | High-contrast borders on dark  |
 * | hover    | #52525b | border-zinc-600   | Hover state borders            |
 */
export const borderColor = {
  subtle: '#27272a',
  default: '#3f3f46',
  muted: '#18181b',
  strong: '#e4e4e7',
  hover: '#52525b',
} as const;

/**
 * Tailwind class mapping for quick reference.
 */
export const borderColorClass = {
  subtle: 'border-zinc-800',
  default: 'border-zinc-700',
  muted: 'border-zinc-900',
  strong: 'border-zinc-200',
  hover: 'border-zinc-600',
} as const;
