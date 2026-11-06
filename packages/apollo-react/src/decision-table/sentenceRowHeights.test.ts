import { MULTI_SENTENCE_ROWS } from './__fixtures__/sentences.fixtures';
import { sentenceRowHeight, sentenceRowOffsets } from './sentenceRowHeights';

describe('sentenceRowHeight', () => {
  it('counts the heading, the lead and each condition line as one line each', () => {
    expect(MULTI_SENTENCE_ROWS.map(sentenceRowHeight)).toEqual([
      16 + 24 * 7,
      16 + 24 * 5,
      16 + 24 * 2,
      16 + 24 * 2,
      16 + 24 * 2,
    ]);
  });
});

describe('sentenceRowOffsets', () => {
  it('sums the heights in order', () => {
    expect(sentenceRowOffsets(MULTI_SENTENCE_ROWS)).toEqual([0, 184, 320, 384, 448, 512]);
  });
});
