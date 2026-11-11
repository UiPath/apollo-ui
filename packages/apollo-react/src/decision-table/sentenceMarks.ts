import type { Mark, MarkTone, RowMark, TableMarks } from './marks';
import { isValue } from './sentenceParts';
import type { SentencePart } from './sentenceTypes';

/** Every field of a grid mark type, required, so a field added there fails to compile where the view lists the ones it shows. */
export type MarkFields<T> = { [K in keyof T]-?: unknown };

/** The `TableMarks` maps the view reads; a map added to `TableMarks` fails to compile here until the view decides on it. */
export const tableMarks = ({ rows, columns }: TableMarks) =>
  ({ rows, columns }) satisfies MarkFields<TableMarks>;

/** Whether each grid tone ends a line with a glyph; a tone added to `MarkTone` fails to compile here until it is decided. */
const SHOWS_GLYPH = { success: false, error: true, warning: true } satisfies Record<
  MarkTone,
  boolean
>;

/** The tones a glyph shows. */
export type GlyphTone = {
  [T in MarkTone]: (typeof SHOWS_GLYPH)[T] extends true ? T : never;
}[MarkTone];

/** How severe each glyph tone is; a tone that starts showing a glyph fails to compile here until it is ranked. */
const SEVERITY = { warning: 1, error: 2 } satisfies Record<GlyphTone, number>;

/** A mark that ends a line with its glyph. */
export type LineMark = Pick<Mark, 'title'> & { tone: GlyphTone };

const valueColumnIds = (parts: readonly SentencePart[]): string[] => [
  ...new Set(parts.filter(isValue).map((part) => part.columnId)),
];

/** Whether a mark shows a glyph. */
export const isLineMark = (mark: Mark | undefined): mark is Mark & LineMark =>
  mark?.glyph === true && mark.tone !== undefined && SHOWS_GLYPH[mark.tone];

/** The marked columns that none of `lines` shows as a value token. */
export const unplacedColumnIds = (
  lines: readonly (readonly SentencePart[])[],
  cells: RowMark['cells']
): string[] => {
  const placed = new Set(lines.flatMap(valueColumnIds));
  return Object.keys(cells ?? {}).filter((columnId) => !placed.has(columnId));
};

/** The glyph marks of `own`, of a line's value tokens and of the `unplaced` columns, once per tone and message. */
export const lineMarksOf = (
  parts: readonly SentencePart[],
  cells: RowMark['cells'],
  own?: Mark,
  unplaced: readonly string[] = []
): LineMark[] => {
  const candidates = [
    own,
    ...[...valueColumnIds(parts), ...unplaced].map((columnId) => cells?.[columnId]),
  ];
  const marks = new Map<string, LineMark>();
  for (const mark of candidates.filter(isLineMark)) {
    marks.set(`${mark.tone}\n${mark.title ?? ''}`, { tone: mark.tone, title: mark.title });
  }
  return [...marks.values()];
};

/** The tone a line's glyph shows: the most severe of its marks. */
export const worstTone = (marks: readonly LineMark[]): GlyphTone =>
  marks.reduce<GlyphTone>(
    (worst, mark) => (SEVERITY[mark.tone] > SEVERITY[worst] ? mark.tone : worst),
    'warning'
  );
