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
 * - `'core-dark'`  — Core dark theme (apollo-core design language)
 * - `'core-light'` — Core light theme (apollo-core design language)
 * - `'wireframe'`    — Demo: low-fidelity wireframe theme (may be removed)
 * - `'vertex'`       — Demo: Apollo Vertex dark palette (may be removed)
 * - `'canvas'`       — Demo: Apollo React / MUI dark palette (may be removed)
 */
export type FutureTheme = 'dark' | 'light' | 'core-dark' | 'core-light' | 'wireframe' | 'vertex' | 'canvas';
