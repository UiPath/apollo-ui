import { MULTI_SENTENCE_RULES } from './__fixtures__/sentences.fixtures';
import { sentenceRuleOffsets } from './sentenceRuleHeights';

describe('sentenceRuleOffsets', () => {
  it('sums the heights in order', () => {
    expect(sentenceRuleOffsets(MULTI_SENTENCE_RULES)).toEqual([0, 176, 304, 358, 412, 466]);
  });
});
