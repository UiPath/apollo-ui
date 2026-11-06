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
    expect(boundedParts(parts, 3)).toEqual({
      shown: parts,
      hidden: [],
      after: [],
      hiddenValues: 0,
    });
  });
});

describe('partsText', () => {
  it('reads an empty value as the grid reads an empty cell', () => {
    expect(partsText(['Reason is ', value('')])).toBe(`Reason is ${EMPTY_VALUE_DASH}`);
  });
});
