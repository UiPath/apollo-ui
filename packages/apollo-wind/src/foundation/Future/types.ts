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
 * - `'dark'`         — Default dark theme (apollo-core design language)
 * - `'light'`        — Default light theme (apollo-core design language)
 * - `'dark-hc'`      — High contrast dark theme
 * - `'light-hc'`     — High contrast light theme
 * - `'future-dark'`  — Future dark theme
 * - `'future-light'` — Future light theme
 * - `'wireframe'`    — Demo: low-fidelity wireframe theme (may be removed)
 * - `'vertex'`       — Demo: Apollo Vertex dark palette (may be removed)
 * - `'canvas'`       — Demo: Apollo React / MUI dark palette (may be removed)
 */
export type FutureTheme = 'dark' | 'light' | 'dark-hc' | 'light-hc' | 'future-dark' | 'future-light' | 'wireframe' | 'vertex' | 'canvas';
