import type { Mark, MarkTone, RowMark } from './marks';
import type { SentencePart } from './sentenceTypes';

/** The tones a glyph shows. */
export type GlyphTone = Exclude<MarkTone, 'success'>;

/** A mark that ends a line with its glyph. */
export type LineMark = Pick<Mark, 'title'> & { tone: GlyphTone };

const valueColumnIds = (parts: readonly SentencePart[]): string[] => [
  ...new Set(
    parts.flatMap((part) =>
      typeof part !== 'string' && part.kind === 'value' ? [part.columnId] : []
    )
  ),
];

/** Whether a mark shows a glyph. */
export const isLineMark = (mark: Mark | undefined): mark is Mark & LineMark =>
  mark?.glyph === true && (mark.tone === 'error' || mark.tone === 'warning');

/** The glyph marks of `own` and of a line's value tokens, once per tone and message. */
export const lineMarksOf = (
  parts: readonly SentencePart[],
  cells: RowMark['cells'],
  own?: Mark
): LineMark[] => {
  const candidates = [own, ...valueColumnIds(parts).map((columnId) => cells?.[columnId])];
  const marks = new Map<string, LineMark>();
  for (const mark of candidates.filter(isLineMark)) {
    marks.set(`${mark.tone}\n${mark.title ?? ''}`, { tone: mark.tone, title: mark.title });
  }
  return [...marks.values()];
};

/** The tone a line's glyph shows: error when any of its marks is one. */
export const worstTone = (marks: readonly LineMark[]): GlyphTone =>
  marks.some((mark) => mark.tone === 'error') ? 'error' : 'warning';
