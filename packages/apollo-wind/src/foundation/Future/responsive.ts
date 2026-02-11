/**
 * Apollo Future — Responsive Tokens
 *
 * Single source of truth for breakpoints and viewport widths
 * in the Future design language.
 * Includes values actively used in both Delegate and Flow templates
 * and ViewportGuard.
 */

// =============================================================================
// Breakpoints (min-width in px)
// =============================================================================

/**
 * Breakpoints used in Delegate templates and guards.
 * Use with window.matchMedia(`(min-width: ${value}px)`).
 *
 * | Token         | px   | Usage                                      |
 * |---------------|------|--------------------------------------------|
 * | viewportGuard | 769  | Content shown ≥769px; below shows overlay   |
 * | panelExpand   | 1025 | Left panel expanded ≥1025px; else collapsed |
 */
export const breakpoint = {
  viewportGuard: 769,
  panelExpand: 1025,
} as const;

// =============================================================================
// Viewport presets (Storybook / testing reference)
// =============================================================================

/**
 * Named viewport widths used in Storybook and for reference.
 * Matches Theme/Future viewport dropdown (Screen XL, L, M, S, XS).
 *
 * | Token | px   | Name           |
 * |-------|------|----------------|
 * | xs    | 540  | Screen XS 540  |
 * | s     | 768  | Screen S 768   |
 * | m     | 1024 | Screen M 1024  |
 * | l     | 1440 | Screen L 1440  |
 * | xl    | 1920 | Screen XL 1920 |
 */
export const viewport = {
  xs: 540,
  s: 768,
  m: 1024,
  l: 1440,
  xl: 1920,
} as const;
