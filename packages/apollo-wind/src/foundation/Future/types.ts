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
 * All supported theme modes for Future templates.
 *
 * - `'dark'`         — Future dark theme (default)
 * - `'light'`        — Future light theme
 * - `'legacy-dark'`  — Legacy dark theme (backward-compatible)
 * - `'legacy-light'` — Legacy light theme (backward-compatible)
 */
export type FutureTheme = 'dark' | 'light' | 'legacy-dark' | 'legacy-light';
