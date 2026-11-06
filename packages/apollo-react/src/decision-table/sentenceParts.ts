import { EMPTY_VALUE_DASH } from './constants';
import type { SentencePart, SentenceToken } from './sentenceTypes';

const isValue = (part: SentencePart): boolean => typeof part !== 'string' && part.kind === 'value';

/** A token's text as shown; an empty value reads as the grid's empty cell does. */
export const tokenText = (token: SentenceToken): string =>
  token.kind === 'value' && token.text === '' ? EMPTY_VALUE_DASH : token.text;

/** The text a reader sees for these parts. */
export const partsText = (parts: readonly SentencePart[]): string =>
  parts.map((part) => (typeof part === 'string' ? part : tokenText(part))).join('');

/** The parts after the last value token. */
export const trailingParts = (parts: readonly SentencePart[]): readonly SentencePart[] => {
  let end = 0;
  for (const [index, part] of parts.entries()) {
    if (isValue(part)) end = index + 1;
  }
  return parts.slice(end);
};

/** The parts through the `limit`-th value token and after the last, the values between, and how many those are. */
export const boundedParts = (
  parts: readonly SentencePart[],
  limit: number
): { shown: readonly SentencePart[]; hidden: readonly SentencePart[]; hiddenValues: number } => {
  let values = 0;
  let lastShown = 0;
  for (const [index, part] of parts.entries()) {
    if (!isValue(part)) continue;
    values += 1;
    if (values > limit) {
      const trailing = trailingParts(parts);
      const hidden = parts.slice(index, parts.length - trailing.length);
      return {
        shown: [...parts.slice(0, lastShown + 1), ...trailing],
        hidden,
        hiddenValues: hidden.filter(isValue).length,
      };
    }
    lastShown = index;
  }
  return { shown: parts, hidden: [], hiddenValues: 0 };
};
