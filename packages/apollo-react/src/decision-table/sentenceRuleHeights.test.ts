import { MULTI_SENTENCE_RULES } from './__fixtures__/sentences.fixtures';
import { sentenceRuleHeight, sentenceRuleOffsets } from './sentenceRuleHeights';

describe('sentenceRuleHeight', () => {
  it('counts the heading, the lead and each condition line as one line each', () => {
    expect(MULTI_SENTENCE_RULES.map(sentenceRuleHeight)).toEqual([
      16 + 24 * 7,
      16 + 24 * 5,
      16 + 24 * 2,
      16 + 24 * 2,
      16 + 24 * 2,
    ]);
  });
});

describe('sentenceRuleOffsets', () => {
  it('sums the heights in order', () => {
    expect(sentenceRuleOffsets(MULTI_SENTENCE_RULES)).toEqual([0, 184, 320, 384, 448, 512]);
  });
});
