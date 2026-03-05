/**
 * Apollo Future — Shadow Tokens
 *
 * Single source of truth for all box-shadow values
 * in the Future design language.
 * Includes values actively used in both Delegate and Flow templates.
 */

// =============================================================================
// Box Shadow
// =============================================================================

/**
 * Box shadow scale.
 *
 * | Token     | Value                                    | Tailwind                                              | Usage                              |
 * |-----------|------------------------------------------|-------------------------------------------------------|------------------------------------|
 * | sm        | 0 1px 2px 0 rgba(0,0,0,0.05)             | shadow-sm                                             | Subtle lift (logo, small badges)   |
 * | rail      | 0px 4px 16px 0px rgba(0,0,0,0.25)        | shadow-[0px_4px_16px_0px_rgba(0,0,0,0.25)]           | Icon rail shadow (Flow panel)      |
 * | elevated  | 0px 4px 24px 0px rgba(0,0,0,0.25)        | shadow-[0px_4px_24px_0px_rgba(0,0,0,0.25)]           | Panels, hover cards                |
 */
export const boxShadow = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  rail: '0px 4px 16px 0px rgba(0, 0, 0, 0.25)',
  elevated: '0px 4px 24px 0px rgba(0, 0, 0, 0.25)',
} as const;

/**
 * Tailwind class mapping for quick reference.
 */
export const boxShadowClass = {
  sm: 'shadow-sm',
  rail: 'shadow-[0px_4px_16px_0px_rgba(0,0,0,0.25)]',
  elevated: 'shadow-[0px_4px_24px_0px_rgba(0,0,0,0.25)]',
} as const;
