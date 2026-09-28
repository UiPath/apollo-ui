/**
 * Apollo Future — Shared Types
 *
 * Centralised type definitions used across all Future design-system templates
 * and components. Import from this file to keep theme-related types consistent.
 */

// =============================================================================
// Theme
// =============================================================================

/**
 * All supported theme modes for templates.
 *
 * Apollo Core (applied to <body>):
 * - `'dark'`         — Apollo Core dark theme
 * - `'light'`        — Apollo Core light theme
 * - `'dark-hc'`      — Apollo Core dark high-contrast theme
 * - `'light-hc'`     — Apollo Core light high-contrast theme
 *
 * Future (applied as CSS class):
 * - `'future-dark'`  — Future dark theme (zinc + cyan)
 * - `'future-light'` — Future light theme (zinc + cyan)
 *
 * Demo (applied as CSS class):
 * - `'wireframe'`    — Demo: low-fidelity wireframe theme
 * - `'vertex'`       — Demo: Apollo Vertex dark palette
 * - `'canvas'`       — Demo: Apollo React / MUI dark palette
 */
export type Theme =
  | 'dark'
  | 'light'
  | 'dark-hc'
  | 'light-hc'
  | 'future-dark'
  | 'future-light'
  | 'wireframe'
  | 'vertex'
  | 'canvas';
