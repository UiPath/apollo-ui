import { EMPTY_VALUE_DASH } from './constants';
import type { SentencePart, SentenceToken } from './sentenceTypes';

const isValue = (part: SentencePart): boolean => typeof part !== 'string' && part.kind === 'value';

/** A token's text as shown; an empty value reads as the grid's empty cell does. */
export const tokenText = (token: SentenceToken): string =>
  token.kind === 'value' && token.text === '' ? EMPTY_VALUE_DASH : token.text;

/** The text a reader sees for these parts. */
export const partsText = (parts: readonly SentencePart[]): string =>
  parts.map((part) => (typeof part === 'string' ? part : tokenText(part))).join('');

/** A run of one column's values past the limit: the values it hides, the parts shown after it and how many values it hides. */
interface ClampedRun {
  hidden: readonly SentencePart[];
  after: readonly SentencePart[];
  hiddenValues: number;
}

/** The parts a line shows, and each run of values it clamps. */
interface BoundedParts {
  shown: readonly SentencePart[];
  clamped: readonly ClampedRun[];
}

/** A clamped run while it is collected: its hidden parts and the shown parts before it. */
interface OpenRun {
  hidden: SentencePart[];
  end: number;
}

/** Every run of one column's values clamped to its first `limit`: the parts shown, and each clamped run. */
export const boundedParts = (parts: readonly SentencePart[], limit: number): BoundedParts => {
  const shown: SentencePart[] = [];
  const runs: OpenRun[] = [];
  let pending: SentencePart[] = [];
  let column: string | undefined;
  let count = 0;
  for (const part of parts) {
    if (typeof part === 'string') {
      pending.push(part);
      continue;
    }
    const value = part.kind === 'value';
    count = value && part.columnId === column ? count + 1 : 1;
    column = value ? part.columnId : undefined;
    if (!value || count <= limit) shown.push(...pending, part);
    else if (count === limit + 1) runs.push({ hidden: [part], end: shown.length });
    else runs.at(-1)?.hidden.push(...pending, part);
    pending = [];
  }
  shown.push(...pending);
  return {
    shown,
    clamped: runs.map(({ hidden, end }) => ({
      hidden,
      after: shown.slice(end),
      hiddenValues: hidden.filter(isValue).length,
    })),
  };
};
