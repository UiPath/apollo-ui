import type { SentenceRule } from './sentenceTypes';

/** A sentence line's fixed height; every line of a rule is clamped to one. */
export const SENTENCE_LINE_HEIGHT_PX = 24;
/** A rule's padding above and below its lines. */
export const SENTENCE_RULE_PADDING_PX = 4;
/** The gap below each rule. */
export const SENTENCE_RULE_GAP_PX = 8;
/** A rule with no condition lines: its heading and its lead. */
export const SENTENCE_MIN_RULE_HEIGHT_PX =
  2 * SENTENCE_RULE_PADDING_PX + SENTENCE_RULE_GAP_PX + 2 * SENTENCE_LINE_HEIGHT_PX;

/** A rule's height: one line each for its heading, its lead and every condition line. */
export const sentenceRuleHeight = (rule: SentenceRule): number =>
  SENTENCE_MIN_RULE_HEIGHT_PX + SENTENCE_LINE_HEIGHT_PX * rule.lines.length;

/** Prefix sums of the rules' heights, for `useVirtualizedAxis`. */
export const sentenceRuleOffsets = (rules: readonly SentenceRule[]): number[] => {
  let total = 0;
  const offsets = [total];
  for (const rule of rules) {
    total += sentenceRuleHeight(rule);
    offsets.push(total);
  }
  return offsets;
};
