import { describe, expect, it } from 'vitest';

import { resolveLucideIconName } from './lucide-icon';

describe('resolveLucideIconName', () => {
  it.each([
    ['file-text', 'file-text'],
    ['FileText', 'file-text'],
    ['Grid2x2', 'grid-2x2'],
  ])('resolves %s to %s', (icon, expected) => {
    expect(resolveLucideIconName(icon)).toBe(expected);
  });

  it('resolves PascalCase names with digit runs to a name lucide knows', () => {
    // lucide lists both "arrow-down-0-1" and its alias "arrow-down-01"
    expect(['arrow-down-0-1', 'arrow-down-01']).toContain(resolveLucideIconName('ArrowDown01'));
  });

  it('returns undefined for names lucide does not have', () => {
    expect(resolveLucideIconName('picture_as_pdf')).toBeUndefined();
    expect(resolveLucideIconName('')).toBeUndefined();
  });
});
