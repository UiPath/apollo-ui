import { describe, expect, it } from 'vitest';

import { stripResourceTokens } from './resource-token-parser';

const makeToken = (data: Record<string, string>) => `[[resource-token:${JSON.stringify(data)}]]`;

describe('stripResourceTokens', () => {
  it('replaces a valid token with its displayName', () => {
    const token = makeToken({ id: '1', type: 'queue', displayName: 'My Queue' });
    expect(stripResourceTokens(`Use ${token} here`)).toBe('Use My Queue here');
  });

  it('replaces multiple tokens in one string', () => {
    const t1 = makeToken({ id: '1', type: 'queue', displayName: 'Queue A' });
    const t2 = makeToken({ id: '2', type: 'bucket', displayName: 'Bucket B' });
    expect(stripResourceTokens(`${t1} and ${t2}`)).toBe('Queue A and Bucket B');
  });

  it('preserves the original token when JSON is invalid', () => {
    const raw = '[[resource-token:{not valid json}]]';
    expect(stripResourceTokens(raw)).toBe(raw);
  });

  it('preserves the original token when required fields are missing', () => {
    const raw = makeToken({ id: '1', type: 'queue' });
    expect(stripResourceTokens(raw)).toBe(raw);
  });

  it('passes through plain text with no tokens unchanged', () => {
    expect(stripResourceTokens('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(stripResourceTokens('')).toBe('');
  });
});
