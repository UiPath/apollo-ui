import type React from 'react';
import { MarkBadge, type MarkBadgeProps, markIds } from './MarkBadge';
import type { Mark } from './marks';
import { isLineMark, type MarkFields } from './sentenceMarks';
import { BAND_COLUMN_CLASS } from './sentenceStyles';
import type { SentenceBand } from './sentenceTypes';

/** The `Mark` fields a band column paints; a field added to `Mark` fails to compile here until the column decides on it. */
const columnMark = (mark: Mark | undefined) =>
  ({
    tone: mark?.tone,
    title: mark?.title,
    glyph: mark?.glyph,
    matched: undefined,
  }) satisfies MarkFields<Mark>;

export interface BandColumnProps {
  column: SentenceBand['columns'][number];
  mark: Mark | undefined;
  badgeId: string;
  labels: MarkBadgeProps['labels'];
}

/** One input or output of a band, painted by its column's mark. */
export const BandColumn: React.FC<BandColumnProps> = ({ column, mark, badgeId, labels }) => {
  const { tone, title } = columnMark(mark);
  const columnMarks = isLineMark(mark) ? [mark] : [];
  return (
    <li
      className={BAND_COLUMN_CLASS}
      aria-describedby={
        columnMarks.length > 0 ? markIds(badgeId, columnMarks).join(' ') : undefined
      }
      data-column-id={column.id}
      data-tone={tone}
      data-mark-title={title}
    >
      {column.name}
      {columnMarks.length > 0 && <MarkBadge id={badgeId} marks={columnMarks} labels={labels} />}
    </li>
  );
};
