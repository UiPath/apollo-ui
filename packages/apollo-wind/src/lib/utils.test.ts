import { describe, expect, it, vi } from 'vitest';

import { cn, composeRefs } from './utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('merges Tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    const isTrue = true;
    const isFalse = false;
    expect(cn('base', isTrue && 'conditional')).toBe('base conditional');
    expect(cn('base', isFalse && 'conditional')).toBe('base');
  });

  it('handles undefined and null values', () => {
    expect(cn('class1', undefined, 'class2', null)).toBe('class1 class2');
  });

  it('handles arrays', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2');
  });

  it('handles objects', () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3');
  });

  it('deduplicates Tailwind utility classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});

describe('composeRefs', () => {
  it('sets object and callback refs', () => {
    const object = { current: null as string | null };
    const callback = vi.fn();
    composeRefs<string>(object, callback)('node');
    expect(object.current).toBe('node');
    expect(callback).toHaveBeenCalledWith('node');
  });

  it('returns nothing when no ref gives a cleanup, so React calls it again with null', () => {
    expect(composeRefs<string>({ current: null }, vi.fn())('node')).toBeUndefined();
  });

  it("runs a callback ref's cleanup and resets the other refs", () => {
    const object = { current: null as string | null };
    const cleanup = vi.fn();
    const plain = vi.fn();
    const dispose = composeRefs<string>(object, () => cleanup, plain)('node');
    expect(typeof dispose).toBe('function');
    (dispose as () => void)();
    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(object.current).toBeNull();
    expect(plain).toHaveBeenLastCalledWith(null);
  });
});
