import { EMPTY_VALUE_DASH } from './constants';
import { boundedParts, partsText } from './sentenceParts';
import type { SentencePart } from './sentenceTypes';

const value = (text: string): SentencePart => ({ columnId: 'c', kind: 'value', text });
const list = (count: number): SentencePart[] => [
  { columnId: 'c', kind: 'input', text: 'Region' },
  ' is one of ',
  ...Array.from({ length: count }, (_, index): SentencePart[] =>
    index === 0 ? [value(`v${index}`)] : [', ', value(`v${index}`)]
  ).flat(),
];

describe('boundedParts', () => {
  it('keeps every part when the values fit the limit', () => {
    const parts = list(3);
    expect(boundedParts(parts, 3)).toEqual({ shown: parts, hidden: [], hiddenValues: 0 });
  });

  it('ends on the last value it shows and counts the values it hides', () => {
    const { shown, hidden, hiddenValues } = boundedParts(list(10_000), 20);
    expect(shown.filter((part) => typeof part !== 'string' && part.kind === 'value')).toHaveLength(
      20
    );
    expect(partsText(shown)).toBe(
      `Region is one of ${Array.from({ length: 20 }, (_, index) => `v${index}`).join(', ')}`
    );
    expect(hiddenValues).toBe(9_980);
    expect(partsText(hidden).startsWith('v20, v21')).toBe(true);
  });
});

describe('partsText', () => {
  it('reads an empty value as the grid reads an empty cell', () => {
    expect(partsText(['Reason is ', value('')])).toBe(`Reason is ${EMPTY_VALUE_DASH}`);
  });
});
