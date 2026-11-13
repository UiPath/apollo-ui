import { EMPTY_VALUE_DASH } from './constants';
import type { SentencePart, SentenceRule, SentenceToken } from './sentenceTypes';

/** Most value tokens one line renders before the rest collapse into a count. */
export const SENTENCE_LINE_VALUE_LIMIT = 20;

export const isValue = (part: SentencePart): part is SentenceToken =>
  typeof part !== 'string' && part.kind === 'value';

/** A token's text as shown; an empty value reads as the grid's empty cell does, or as `empty`. */
export const tokenText = (token: SentenceToken, empty = EMPTY_VALUE_DASH): string =>
  token.kind === 'value' && token.text === '' ? empty : token.text;

const isToken = (part: SentencePart): part is SentenceToken => typeof part !== 'string';

/** Every token of a rule, heading, lead, then lines. */
const ruleTokens = (rule: SentenceRule): SentenceToken[] =>
  [...rule.heading, ...rule.lead, ...rule.lines.flatMap((line) => line.parts)].filter(isToken);

/** Whether a rule words a cell in its heading, as an outcome. */
export const isOutcome = (rule: SentenceRule, columnId: string): boolean =>
  rule.heading.some((part) => typeof part !== 'string' && part.columnId === columnId);

/** A column's name as the row words it. */
export const columnNameOf = (rule: SentenceRule, columnId: string): string =>
  ruleTokens(rule).find((token) => token.kind !== 'value' && token.columnId === columnId)?.text ??
  '';

/** The text a reader sees for these parts, an empty value read as `empty`. */
export const partsText = (parts: readonly SentencePart[], empty = EMPTY_VALUE_DASH): string =>
  parts.map((part) => (typeof part === 'string' ? part : tokenText(part, empty))).join('');

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
