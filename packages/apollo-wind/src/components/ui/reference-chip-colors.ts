/**
 * Semantic look of a reference.
 * - `default`: a valid reference. Uses the `valid` palette.
 * - `warning`: valid but needs attention, such as a file variable no tool can read.
 * - `invalid`: the reference doesn't resolve, such as a deleted or unknown variable.
 */
export type ReferenceChipVariant = 'default' | 'warning' | 'invalid';

/** Paired reference colors. Keep labels, icons and backgrounds on the same semantic palette. */
export const getReferenceChipColors = () => ({
  valid: {
    background: 'var(--color-info-background)',
    border: 'var(--color-info-icon)',
    text: 'var(--color-info-text)',
    icon: 'var(--color-info-icon)',
  },
  /** A valid reference the host can't act on, such as a file variable no tool can read. */
  warning: {
    background: 'var(--color-warning-background)',
    border: 'var(--color-warning-icon)',
    text: 'var(--color-warning-text)',
    icon: 'var(--color-warning-icon)',
  },
  invalid: {
    background: 'var(--color-error-background)',
    border: 'var(--color-error-icon)',
    text: 'var(--color-error-text)',
    icon: 'var(--color-error-icon)',
  },
});
