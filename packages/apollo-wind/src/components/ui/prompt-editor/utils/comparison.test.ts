import { describe, expect, it } from 'vitest';
import type { PromptEditorToken } from '../types';
import { areTokensEqual } from './comparison';

const base: PromptEditorToken[] = [
  { type: 'text', value: 'Hi ' },
  { type: 'input', value: 'vars.firstName' },
];

describe('areTokensEqual', () => {
  it('treats two empty arrays as equal', () => {
    expect(areTokensEqual([], [])).toBe(true);
  });

  it('returns true for identical token arrays', () => {
    expect(areTokensEqual(base, [...base.map((t) => ({ ...t }))])).toBe(true);
  });

  it('returns false when lengths differ', () => {
    expect(areTokensEqual(base, base.slice(0, 1))).toBe(false);
  });

  it('returns false when a token type differs', () => {
    expect(
      areTokensEqual(base, [
        { type: 'text', value: 'Hi ' },
        { type: 'output', value: 'vars.firstName' },
      ])
    ).toBe(false);
  });

  it('returns false when a token value differs', () => {
    expect(
      areTokensEqual(base, [
        { type: 'text', value: 'Hi ' },
        { type: 'input', value: 'vars.lastName' },
      ])
    ).toBe(false);
  });
});
