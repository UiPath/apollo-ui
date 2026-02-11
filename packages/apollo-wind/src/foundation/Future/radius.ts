/**
 * Apollo Future — Radius Tokens
 *
 * Single source of truth for all border radius values
 * in the Future design language.
 * Includes values actively used in both Delegate and Flow templates.
 */

// =============================================================================
// Border Radius
// =============================================================================

/**
 * Border radius scale in pixels.
 *
 * | Token   | px    | Tailwind         | Usage                       |
 * |---------|-------|------------------|-----------------------------|
 * | sm      | 4     | rounded-[4px]    | Chat bubble corner (Flow)   |
 * | lg      | 8     | rounded-lg       | Buttons, inputs, icons      |
 * | lgPlus  | 10    | rounded-[10px]   | Toggle pill buttons         |
 * | xl      | 12    | rounded-xl       | Toggle containers, cards    |
 * | 2xl     | 16    | rounded-2xl      | Panels, large cards         |
 * | xlPlus  | 20    | rounded-[20px]   | Node size selector (Flow)   |
 * | 3xl     | 24    | rounded-3xl      | Canvas toolbar              |
 * | pill    | 32    | rounded-[32px]   | Delegate card radius        |
 * | circle  | 9999  | rounded-full     | Circular buttons (send)     |
 */
export const borderRadius = {
  sm: 4,
  lg: 8,
  lgPlus: 10,
  xl: 12,
  '2xl': 16,
  xlPlus: 20,
  '3xl': 24,
  pill: 32,
  circle: 9999,
} as const;
