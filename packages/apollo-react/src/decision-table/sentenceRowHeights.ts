import type { SentenceRow } from './sentenceTypes';

/** A sentence line's fixed height; every line of a row is clamped to one. */
export const SENTENCE_LINE_HEIGHT_PX = 24;
/** A row's padding above and below its lines. */
export const SENTENCE_ROW_PADDING_PX = 4;
/** The gap below each row. */
export const SENTENCE_ROW_GAP_PX = 8;
/** A row with no condition lines: its heading and its lead. */
export const SENTENCE_MIN_ROW_HEIGHT_PX =
  2 * SENTENCE_ROW_PADDING_PX + SENTENCE_ROW_GAP_PX + 2 * SENTENCE_LINE_HEIGHT_PX;

/** A row's height: one line each for its heading, its lead and every condition line. */
export const sentenceRowHeight = (row: SentenceRow): number =>
  SENTENCE_MIN_ROW_HEIGHT_PX + SENTENCE_LINE_HEIGHT_PX * row.lines.length;

/** Prefix sums of the rows' heights, for `useVirtualizedAxis`. */
export const sentenceRowOffsets = (rows: readonly SentenceRow[]): number[] => {
  let total = 0;
  const offsets = [total];
  for (const row of rows) {
    total += sentenceRowHeight(row);
    offsets.push(total);
  }
  return offsets;
};
