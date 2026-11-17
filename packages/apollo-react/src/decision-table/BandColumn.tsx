import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import type { DiffChange, DiffLabels } from './decisionTextDiff';
import { MarkBadge, type MarkBadgeProps, markIds } from './MarkBadge';
import type { Mark } from './marks';
import { isLineMark, type LineMarks, type MarkFields } from './sentenceMarks';
import {
  BAND_COLUMN_BUTTON_CLASS,
  BAND_COLUMN_CLASS,
  BAND_COLUMN_ITEM_CLASS,
  CHANGED_CHIP_CLASS,
  POPOVER_ICON_CLASS,
} from './sentenceStyles';
import type { BandColumnView } from './sentenceTypes';

/** The `Mark` fields a band column paints; a field added to `Mark` fails to compile here until the column decides on it. */
const columnMark = (mark: Mark | undefined) =>
  ({
    tone: mark?.tone,
    title: mark?.title,
    glyph: mark?.glyph,
    matched: undefined,
  }) satisfies MarkFields<Mark>;

export interface BandColumnProps {
  column: BandColumnView;
  mark: Mark | undefined;
  badgeId: string;
  /** The column's change in a diff. */
  change: DiffChange | undefined;
  labels: MarkBadgeProps['labels'] & Pick<DiffLabels, 'changeStatus'>;
  /** A plain pill, or a button that opens or closes the column's popover, with the popover's id while it is open on this column. */
  pill:
    | { kind: 'plain' }
    | { kind: 'button'; onToggle: (columnId: string) => void; openEditorId: string | null };
}

/** One input or output of a band: its type glyph and name, painted by its column's mark, and a button where it is editable. */
export const BandColumn: React.FC<BandColumnProps> = ({
  column,
  mark,
  badgeId,
  change,
  labels,
  pill,
}) => {
  const { tone, title } = columnMark(mark);
  const columnMarks: LineMarks | null = isLineMark(mark) ? [mark] : null;
  const chip = {
    'aria-describedby': columnMarks ? markIds(badgeId, columnMarks).join(' ') : undefined,
    'data-tone': tone,
    'data-change': change,
    'data-mark-title': title,
  };
  const content = (
    <>
      {column.icon && (
        <span aria-hidden className={POPOVER_ICON_CLASS}>
          {column.icon}
        </span>
      )}
      {change && <span className="sr-only">{labels.changeStatus(change)} </span>}
      {column.name}
      {columnMarks && <MarkBadge id={badgeId} marks={columnMarks} labels={labels} />}
    </>
  );
  if (pill.kind === 'plain') {
    return (
      <li
        className={cn(BAND_COLUMN_CLASS, CHANGED_CHIP_CLASS)}
        data-column-id={column.id}
        {...chip}
      >
        {content}
      </li>
    );
  }
  return (
    <li className={BAND_COLUMN_ITEM_CLASS} data-column-id={column.id}>
      <button
        type="button"
        className={cn(BAND_COLUMN_BUTTON_CLASS, CHANGED_CHIP_CLASS)}
        aria-expanded={pill.openEditorId !== null}
        aria-controls={pill.openEditorId ?? undefined}
        onClick={() => pill.onToggle(column.id)}
        {...chip}
      >
        {content}
      </button>
    </li>
  );
};
