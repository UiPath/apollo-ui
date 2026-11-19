import { describe, expect, it } from 'vitest';

import type { AutopilotChatInfoLink } from '../../service';
import { normalizeInfoLinks } from './info-links';

describe('normalizeInfoLinks', () => {
  it('keeps the order and links http, https and relative URLs', () => {
    expect(
      normalizeInfoLinks([
        { label: 'Terms', url: 'https://a.test/terms' },
        { label: 'Privacy policy', url: 'http://a.test/privacy' },
        { label: 'Chat history policy', url: '/history-policy' },
      ])
    ).toEqual([
      { label: 'Terms', href: 'https://a.test/terms' },
      { label: 'Privacy policy', href: 'http://a.test/privacy' },
      { label: 'Chat history policy', href: '/history-policy' },
    ]);
  });

  it('keeps the label of a refused or empty URL, without a link', () => {
    expect(
      normalizeInfoLinks([
        { label: 'Script', url: 'javascript:alert(1)' },
        { label: 'Data', url: 'data:text/html,x' },
        { label: 'Empty', url: '' },
        { label: 'Blank', url: '   ' },
        { label: 'Missing' } as AutopilotChatInfoLink,
      ])
    ).toEqual([
      { label: 'Script' },
      { label: 'Data' },
      { label: 'Empty' },
      { label: 'Blank' },
      { label: 'Missing' },
    ]);
  });

  it('trims labels and URLs and drops entries without a label', () => {
    expect(
      normalizeInfoLinks([
        { label: '  Terms ', url: ' https://a.test/terms ' },
        { label: '', url: 'https://a.test/empty' },
        { label: '   ', url: 'https://a.test/blank' },
        { url: 'https://a.test/none' } as AutopilotChatInfoLink,
        null as unknown as AutopilotChatInfoLink,
      ])
    ).toEqual([{ label: 'Terms', href: 'https://a.test/terms' }]);
  });

  it('reads anything but an array as no links', () => {
    expect(normalizeInfoLinks(undefined)).toEqual([]);
    expect(normalizeInfoLinks(null)).toEqual([]);
    expect(normalizeInfoLinks('Terms' as unknown as AutopilotChatInfoLink[])).toEqual([]);
    expect(
      normalizeInfoLinks({ label: 'Terms', url: '/terms' } as unknown as AutopilotChatInfoLink[])
    ).toEqual([]);
  });
});
