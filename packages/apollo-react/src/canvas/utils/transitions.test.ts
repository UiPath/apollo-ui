import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion, withViewportMotion } from './transitions';

const setReducedMotion = (matches: boolean) =>
  vi.spyOn(window, 'matchMedia').mockReturnValue({ matches } as MediaQueryList);

afterEach(() => vi.restoreAllMocks());

describe('prefersReducedMotion', () => {
  it('reads the reduced-motion media query', () => {
    setReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
  });

  it('is false where matchMedia is missing', () => {
    vi.stubGlobal('matchMedia', undefined);
    try {
      expect(prefersReducedMotion()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('withViewportMotion', () => {
  it('lays the options over the defaults', () => {
    setReducedMotion(false);
    expect(withViewportMotion({ padding: 0.1, duration: 300 }, { padding: 0.2 })).toEqual({
      padding: 0.2,
      duration: 300,
    });
  });

  it('drops the duration to 0 under reduced motion', () => {
    setReducedMotion(true);
    expect(withViewportMotion({ duration: 300 }, { duration: 500 })).toEqual({ duration: 0 });
  });
});
