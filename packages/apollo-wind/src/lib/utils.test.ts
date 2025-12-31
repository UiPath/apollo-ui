import { describe, expect, it } from 'vitest';

import { cn } from './utils';

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
