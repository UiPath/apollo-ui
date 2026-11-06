import { EMPTY_VALUE_DASH } from './constants';
import type { SentencePart, SentenceToken } from './sentenceTypes';

const isValue = (part: SentencePart): boolean => typeof part !== 'string' && part.kind === 'value';

/** A token's text as shown; an empty value reads as the grid's empty cell does. */
export const tokenText = (token: SentenceToken): string =>
  token.kind === 'value' && token.text === '' ? EMPTY_VALUE_DASH : token.text;

/** The text a reader sees for these parts. */
export const partsText = (parts: readonly SentencePart[]): string =>
  parts.map((part) => (typeof part === 'string' ? part : tokenText(part))).join('');

/** The index after the last value of the run of `columnId`'s values that `start` begins. */
const runEnd = (parts: readonly SentencePart[], start: number, columnId: string): number => {
  let end = start + 1;
  for (const [offset, part] of parts.slice(end).entries()) {
    if (typeof part === 'string') continue;
    if (part.kind !== 'value' || part.columnId !== columnId) break;
    end = start + offset + 2;
  }
  return end;
};

/** The first run of one column's values past `limit`, clamped: the parts shown, the values hidden, the parts after them and their count. */
export const boundedParts = (
  parts: readonly SentencePart[],
  limit: number
): {
  shown: readonly SentencePart[];
  hidden: readonly SentencePart[];
  after: readonly SentencePart[];
  hiddenValues: number;
} => {
  let column: string | undefined;
  let run = 0;
  let lastShown = 0;
  for (const [index, part] of parts.entries()) {
    if (typeof part === 'string') continue;
    if (part.kind !== 'value') {
      column = undefined;
      continue;
    }
    run = part.columnId === column ? run + 1 : 1;
    column = part.columnId;
    if (run === limit) lastShown = index;
    if (run > limit) {
      const end = runEnd(parts, index, column);
      const hidden = parts.slice(index, end);
      const after = parts.slice(end);
      return {
        shown: [...parts.slice(0, lastShown + 1), ...after],
        hidden,
        after,
        hiddenValues: hidden.filter(isValue).length,
      };
    }
  }
  return { shown: parts, hidden: [], after: [], hiddenValues: 0 };
};
