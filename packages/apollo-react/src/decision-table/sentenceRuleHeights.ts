import type React from 'react';
import type { SentenceRule } from './sentenceTypes';

/** A sentence line's height; a line that wraps takes one more per line it wraps onto. */
const SENTENCE_LINE_HEIGHT_PX = 24;
const SENTENCE_RULE_BORDER_PX = 1;
const SENTENCE_RULE_PADDING_PX = 10;
const SENTENCE_LINES_GAP_PX = 2;
const SENTENCE_RULE_GAP_PX = 8;
/** A rule with no condition lines: its heading and its lead. */
export const SENTENCE_MIN_RULE_HEIGHT_PX =
  2 * SENTENCE_RULE_BORDER_PX +
  2 * SENTENCE_RULE_PADDING_PX +
  SENTENCE_RULE_GAP_PX +
  2 * SENTENCE_LINE_HEIGHT_PX;

/** A rule's height before its card is measured: one line each for its heading, its lead and every condition line. */
const sentenceRuleHeight = (rule: SentenceRule): number =>
  rule.lines.length === 0
    ? SENTENCE_MIN_RULE_HEIGHT_PX
    : SENTENCE_MIN_RULE_HEIGHT_PX +
      SENTENCE_LINES_GAP_PX +
      SENTENCE_LINE_HEIGHT_PX * rule.lines.length;

/** Prefix sums of the rules' heights, for `useVirtualizedAxis`: a rule's `measured` height by row id, else its estimate. */
export const sentenceRuleOffsets = (
  rules: readonly SentenceRule[],
  measured?: ReadonlyMap<string, number>
): number[] => {
  let total = 0;
  const offsets = [total];
  for (const rule of rules) {
    total += measured?.get(rule.rowId) ?? sentenceRuleHeight(rule);
    offsets.push(total);
  }
  return offsets;
};

/** The list's inline style: its geometry as CSS variables, which the bands share. */
export type SentenceListStyle = React.CSSProperties &
  Record<`--sentence-${string}`, string | number>;

const LIST_GEOMETRY: SentenceListStyle = {
  '--sentence-line': `${SENTENCE_LINE_HEIGHT_PX}px`,
  '--sentence-row-border': `${SENTENCE_RULE_BORDER_PX}px`,
  '--sentence-row-padding': `${SENTENCE_RULE_PADDING_PX}px`,
  '--sentence-lines-gap': `${SENTENCE_LINES_GAP_PX}px`,
  '--sentence-row-gap': `${SENTENCE_RULE_GAP_PX}px`,
};

/** The list's geometry, and the width of its rule numbers when they show. */
export const sentenceListStyle = (numbered: boolean, ruleCount: number): SentenceListStyle =>
  numbered
    ? { ...LIST_GEOMETRY, '--sentence-number-digits': String(ruleCount).length }
    : LIST_GEOMETRY;
