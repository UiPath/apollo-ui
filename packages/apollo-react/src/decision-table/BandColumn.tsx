import type React from 'react';
import { MarkBadge, type MarkBadgeProps, markIds } from './MarkBadge';
import type { Mark } from './marks';
import { isLineMark, type MarkFields } from './sentenceMarks';
import {
  BAND_COLUMN_BUTTON_CLASS,
  BAND_COLUMN_CLASS,
  BAND_COLUMN_ITEM_CLASS,
  POPOVER_ICON_CLASS,
} from './sentenceStyles';
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
  /** Opens or closes the column's popover; without it the pill stays plain. */
  onToggle: ((columnId: string) => void) | undefined;
  /** The popover's id while it is open on this column. */
  editorId: string | undefined;
}

/** One input or output of a band: its type glyph and name, painted by its column's mark, and a button where it is editable. */
export const BandColumn: React.FC<BandColumnProps> = ({
  column,
  mark,
  badgeId,
  labels,
  onToggle,
  editorId,
}) => {
  const { tone, title } = columnMark(mark);
  const columnMarks = isLineMark(mark) ? [mark] : [];
  const chip = {
    'aria-describedby':
      columnMarks.length > 0 ? markIds(badgeId, columnMarks).join(' ') : undefined,
    'data-tone': tone,
    'data-mark-title': title,
  };
  const content = (
    <>
      {column.icon && (
        <span aria-hidden className={POPOVER_ICON_CLASS}>
          {column.icon}
        </span>
      )}
      {column.name}
      {columnMarks.length > 0 && <MarkBadge id={badgeId} marks={columnMarks} labels={labels} />}
    </>
  );
  if (!onToggle) {
    return (
      <li className={BAND_COLUMN_CLASS} data-column-id={column.id} {...chip}>
        {content}
      </li>
    );
  }
  return (
    <li className={BAND_COLUMN_ITEM_CLASS} data-column-id={column.id}>
      <button
        type="button"
        className={BAND_COLUMN_BUTTON_CLASS}
        aria-expanded={editorId !== undefined}
        aria-controls={editorId}
        onClick={() => onToggle(column.id)}
        {...chip}
      >
        {content}
      </button>
    </li>
  );
};
