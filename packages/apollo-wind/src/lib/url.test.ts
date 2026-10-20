import { describe, expect, it } from 'vitest';
import { isSafeHref, safeHref } from './url';

describe('isSafeHref', () => {
  it.each([
    'https://example.com/a',
    'http://example.com',
    'mailto:a@example.com',
    'tel:+15550100',
    '/docs/policy',
    'docs/policy#page=2',
  ])('allows %s', (href) => {
    expect(isSafeHref(href)).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    '\u0001javascript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ])('rejects %j', (href) => {
    expect(isSafeHref(href)).toBe(false);
  });
});

describe('safeHref', () => {
  it('passes safe values through and drops unsafe or missing ones', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com');
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
    expect(safeHref('')).toBeUndefined();
  });
});
