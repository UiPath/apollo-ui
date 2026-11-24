import { MULTI_SENTENCE_RULES } from './__fixtures__/sentences.fixtures';
import { sentenceRuleOffsets } from './sentenceRuleHeights';

describe('sentenceRuleOffsets', () => {
  it('sums the heights in order', () => {
    expect(sentenceRuleOffsets(MULTI_SENTENCE_RULES)).toEqual([0, 176, 304, 358, 412, 466]);
  });

  it('adds a line for a named rule and none for a blank name', () => {
    const names = ['Prime', ' '];
    const rules = MULTI_SENTENCE_RULES.slice(0, 2).map((rule, index) => ({
      ...rule,
      name: names[index],
    }));
    expect(sentenceRuleOffsets(rules)).toEqual([0, 200, 328]);
  });
});
