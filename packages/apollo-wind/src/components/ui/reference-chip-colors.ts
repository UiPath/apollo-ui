/** Paired reference colors. Keep labels, icons and backgrounds on the same semantic palette. */
export const getReferenceChipColors = () => ({
  valid: {
    background: 'var(--color-info-background)',
    border: 'var(--color-info-icon)',
    text: 'var(--color-info-text)',
    icon: 'var(--color-info-icon)',
  },
  invalid: {
    background: 'var(--color-error-background)',
    border: 'var(--color-error-icon)',
    text: 'var(--color-error-text)',
    icon: 'var(--color-error-icon)',
  },
});
