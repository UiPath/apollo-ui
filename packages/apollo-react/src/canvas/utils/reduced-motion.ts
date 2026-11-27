/**
 * Whether the user asked for reduced motion. False where `matchMedia` is missing, as in jsdom.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
}

/**
 * Lays a caller's viewport options over the defaults, so a caller that sets only `padding` still
 * animates. Under reduced motion, any duration drops to 0.
 */
export function withViewportMotion<D extends object, O extends { duration?: number }>(
  defaults: D,
  options?: O
): D & O {
  const merged = { ...defaults, ...options } as D & O;
  return prefersReducedMotion() ? { ...merged, duration: 0 } : merged;
}
