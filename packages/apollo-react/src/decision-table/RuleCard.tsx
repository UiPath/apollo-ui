import { memo } from 'react';
import { LineText } from './LineText';
import { MarkBadge, markIds } from './MarkBadge';
import type { RowMark } from './marks';
import { type LineMark, lineMarksOf, type MarkFields, unplacedColumnIds } from './sentenceMarks';
import {
  LINE_BULLET_CLASS,
  LINE_CLASS,
  LINES_CLASS,
  ROW_NUMBER_CLASS,
  ROW_SURFACE_CLASS,
  RULE_CARD_CLASS,
} from './sentenceStyles';
import type { DecisionTextLabels, SentenceRule } from './sentenceTypes';

/** The `RowMark` fields a card paints; a field added to `RowMark` fails to compile here until the card decides on it. */
const cardMark = (mark: RowMark | undefined) =>
  ({
    tone: mark?.tone,
    dim: mark?.dim,
    title: mark?.title,
    glyph: mark?.glyph,
    cells: mark?.cells,
  }) satisfies MarkFields<RowMark>;

export interface RuleCardProps {
  rule: SentenceRule;
  /** 1-based, as announced and as numbered. */
  position: number;
  setSize: number;
  numbered: boolean;
  mark: RowMark | undefined;
  idPrefix: string;
  dataTestId: string;
  labels: DecisionTextLabels;
}

/** One rule as a sentence: its heading, its lead and its condition lines. */
export const RuleCard = memo<RuleCardProps>(
  ({ rule, position, setSize, numbered, mark, idPrefix, dataTestId, labels }) => {
    const id = `${idPrefix}-${position}`;
    const { tone, dim, title, cells } = cardMark(mark);
    const badgeFor = (key: string, marks: LineMark[]) =>
      marks.length > 0 ? { id: `${id}-mark-${key}`, marks, labels } : null;
    const unplaced = unplacedColumnIds(
      [rule.heading, rule.lead, ...rule.lines.map((line) => line.parts)],
      cells
    );
    const headingBadge = badgeFor('heading', lineMarksOf(rule.heading, cells, mark, unplaced));
    const leadBadge = badgeFor('lead', lineMarksOf(rule.lead, cells));
    const lineBadges = rule.lines.map((line, index) =>
      badgeFor(`line-${index}`, lineMarksOf(line.parts, cells))
    );
    const describedBy = [headingBadge, leadBadge, ...lineBadges]
      .flatMap((badge) => (badge ? markIds(badge.id, badge.marks) : []))
      .join(' ');

    return (
      <li
        aria-posinset={position}
        aria-setsize={setSize}
        aria-labelledby={[numbered && `${id}-number`, `${id}-heading`, `${id}-lead`]
          .filter(Boolean)
          .join(' ')}
        aria-describedby={describedBy || undefined}
        className={RULE_CARD_CLASS}
        data-row-id={rule.rowId}
        data-tone={tone}
        data-dim={dim}
        data-testid={`${dataTestId}-row-${rule.rowId}`}
      >
        <div className={ROW_SURFACE_CLASS}>
          {numbered && (
            <span id={`${id}-number`} className={ROW_NUMBER_CLASS}>
              {position}
            </span>
          )}
          <div className={LINE_CLASS} data-mark-title={title}>
            <LineText
              id={`${id}-heading`}
              heading
              parts={rule.heading}
              cells={cells}
              labels={labels}
            />
            {headingBadge && <MarkBadge {...headingBadge} />}
          </div>
          <div className={LINE_CLASS}>
            <LineText id={`${id}-lead`} parts={rule.lead} cells={cells} labels={labels} />
            {leadBadge && <MarkBadge {...leadBadge} />}
          </div>
          {rule.lines.length > 0 && (
            <ul className={LINES_CLASS}>
              {rule.lines.map((line, index) => {
                const lineBadge = lineBadges[index];
                return (
                  <li key={index} className={LINE_CLASS} data-column-id={line.columnId}>
                    <span aria-hidden className={LINE_BULLET_CLASS} />
                    <LineText parts={line.parts} cells={cells} labels={labels} />
                    {lineBadge && <MarkBadge {...lineBadge} />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </li>
    );
  }
);
