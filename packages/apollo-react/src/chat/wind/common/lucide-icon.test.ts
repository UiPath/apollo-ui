import { describe, expect, it } from 'vitest';

import { resolveLucideIconName } from './lucide-icon';

describe('resolveLucideIconName', () => {
  it.each([
    ['file-text', 'FileText'],
    ['FileText', 'FileText'],
    ['message-circle-plus', 'MessageCirclePlus'],
    ['grid-2x2', 'Grid2x2'],
    ['Grid2x2', 'Grid2x2'],
    ['arrow-down-0-1', 'ArrowDown01'],
    ['ArrowDown01', 'ArrowDown01'],
    ['share', 'Share'],
    // Deprecated aliases, which lucide still exports under their old names.
    ['alert-circle', 'AlertCircle'],
    ['AlertCircle', 'AlertCircle'],
    ['more-horizontal', 'MoreHorizontal'],
  ])('resolves %s to %s', (icon, expected) => {
    expect(resolveLucideIconName(icon)).toBe(expected);
  });

  it('returns undefined for names lucide does not have, and for its non-icon exports', () => {
    expect(resolveLucideIconName('picture_as_pdf')).toBeUndefined();
    expect(resolveLucideIconName('')).toBeUndefined();
    expect(resolveLucideIconName('createLucideIcon')).toBeUndefined();
    expect(resolveLucideIconName('Icon')).toBeUndefined();
    expect(resolveLucideIconName('icons')).toBeUndefined();
    expect(resolveLucideIconName('default')).toBeUndefined();
  });
});
