import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { Fragment, memo } from 'react';
import { showTitleIfClipped } from './clippedTitle';
import { MarkGlyph } from './MarkGlyph';
import type { Mark, RowMark } from './marks';
import {
  type LineMark,
  lineMarksOf,
  type MarkFields,
  unplacedColumnIds,
  worstTone,
} from './sentenceMarks';
import { boundedParts, partsText, tokenText } from './sentenceParts';
import {
  CLAMPED_LINE_CLASS,
  EMPTY_OUTPUT_VALUE_CLASS,
  HEADING_TEXT_CLASS,
  LINE_BULLET_CLASS,
  LINE_CLASS,
  LINE_FILL_CLASS,
  LINE_MARK_CLASS,
  LINE_TEXT_CLASS,
  LINES_CLASS,
  MARK_GLYPH_CLASS,
  MARKED_CHIP_CLASS,
  MORE_VALUES_CLASS,
  OUTPUT_VALUE_CLASS,
  ROW_NUMBER_CLASS,
  ROW_SURFACE_CLASS,
  RULE_CARD_CLASS,
  TOKEN_KIND_CLASS,
  WORD_CLASS,
} from './sentenceStyles';
import type {
  DecisionCardLabels,
  SentencePart,
  SentenceRule,
  SentenceToken,
} from './sentenceTypes';

/** Most value tokens one line renders before the rest collapse into a count. */
const SENTENCE_LINE_VALUE_LIMIT = 20;

const markId = (id: string, index: number): string => `${id}-${index}`;

/** The ids of a badge's announcements, for the `aria-describedby` of whatever it ends. */
export const markIds = (id: string, marks: readonly LineMark[]): string[] =>
  marks.map((_, index) => markId(id, index));

/** A glyph in the worst tone of its marks, and each mark's announcement for `aria-describedby`. */
export const MarkBadge: React.FC<{
  id: string;
  marks: readonly LineMark[];
  labels: DecisionCardLabels;
}> = ({ id, marks, labels }) => {
  const tone = worstTone(marks);
  const titles = marks.flatMap((mark) => (mark.title ? [mark.title] : []));
  return (
    <span
      className={LINE_MARK_CLASS}
      data-tone={tone}
      data-mark-title={titles.length > 0 ? titles.join('\n') : undefined}
    >
      <MarkGlyph tone={tone} className={MARK_GLYPH_CLASS} />
      {marks.map((mark, index) => (
        <span key={index} id={markId(id, index)} hidden>
          {labels.markStatus(mark.tone, mark.title)}
        </span>
      ))}
    </span>
  );
};

/** The `Mark` fields a value chip paints; a field added to `Mark` fails to compile here until the chip decides on it. */
const chipMark = (mark: Mark | undefined) =>
  ({
    tone: mark?.tone,
    title: mark?.title,
    matched: mark?.matched,
    glyph: undefined,
  }) satisfies MarkFields<Mark>;

/** The `RowMark` fields a card paints; a field added to `RowMark` fails to compile here until the card decides on it. */
const cardMark = (mark: RowMark | undefined) =>
  ({
    tone: mark?.tone,
    dim: mark?.dim,
    title: mark?.title,
    glyph: mark?.glyph,
    cells: mark?.cells,
  }) satisfies MarkFields<RowMark>;

/** A token's own look: an output's value is a pill, or muted when the cell is empty. */
const tokenClass = (token: SentenceToken, output: boolean): string => {
  if (token.kind !== 'value' || !output) return TOKEN_KIND_CLASS[token.kind];
  return token.text === '' ? EMPTY_OUTPUT_VALUE_CLASS : OUTPUT_VALUE_CLASS;
};

const TokenChip: React.FC<{
  token: SentenceToken;
  mark: Mark | undefined;
  output: boolean;
}> = ({ token, mark, output }) => {
  const isValue = token.kind === 'value';
  const { tone, title, matched } = chipMark(mark);
  return (
    <span
      className={cn(tokenClass(token, output), isValue && MARKED_CHIP_CLASS)}
      data-kind={token.kind}
      data-column-id={token.columnId}
      data-tone={tone}
      data-mark-title={title}
      data-mark-matched={matched}
    >
      {tokenText(token)}
    </span>
  );
};

/** The first values of the hidden run, an ellipsis if any remain, then the parts after the run. */
const hiddenTitle = (hidden: readonly SentencePart[], after: readonly SentencePart[]): string => {
  const { shown, clamped } = boundedParts(hidden, SENTENCE_LINE_VALUE_LIMIT);
  return `${partsText(shown)}${clamped.length > 0 ? '…' : ''}${partsText(after)}`;
};

/** A line that tests an input mutes its connecting words, as the condition's operator. */
const testsInput = (parts: readonly SentencePart[]): boolean =>
  parts.some((part) => typeof part !== 'string' && part.kind === 'input');

/** One clamped line: its first values, then a count of the rest that the clamp never hides. */
const LineText: React.FC<{
  id?: string;
  heading?: boolean;
  parts: readonly SentencePart[];
  cells: RowMark['cells'];
  labels: DecisionCardLabels;
}> = ({ id, heading = false, parts, cells, labels }) => {
  const { shown, clamped } = boundedParts(parts, SENTENCE_LINE_VALUE_LIMIT);
  const textClass = cn(heading ? HEADING_TEXT_CLASS : LINE_TEXT_CLASS, LINE_FILL_CLASS);
  const wordClass = testsInput(parts) ? WORD_CLASS : undefined;
  const text = (from: number, to = shown.length) =>
    shown.slice(from, to).map((part, offset) =>
      typeof part === 'string' ? (
        <span key={from + offset} className={wordClass}>
          {part}
        </span>
      ) : (
        <TokenChip
          key={from + offset}
          token={part}
          mark={part.kind === 'value' ? cells?.[part.columnId] : undefined}
          output={heading}
        />
      )
    );
  if (clamped.length === 0) {
    return (
      <span id={id} className={textClass} onMouseEnter={showTitleIfClipped}>
        {text(0)}
      </span>
    );
  }
  const cuts = clamped.map(({ after }) => shown.length - after.length);
  const tail = cuts.at(-1) ?? shown.length;
  return (
    <span id={id} className={cn(textClass, CLAMPED_LINE_CLASS)}>
      {clamped.map(({ hidden, after, hiddenValues }, index) => (
        <Fragment key={index}>
          <span className={LINE_TEXT_CLASS} onMouseEnter={showTitleIfClipped}>
            {text(cuts[index - 1] ?? 0, cuts[index])}
          </span>
          <span
            className={MORE_VALUES_CLASS}
            data-more-values={hiddenValues}
            title={hiddenTitle(hidden, after)}
          >
            {labels.moreValues(hiddenValues)}
          </span>
        </Fragment>
      ))}
      {tail < shown.length && (
        <span className={LINE_TEXT_CLASS} onMouseEnter={showTitleIfClipped}>
          {text(tail)}
        </span>
      )}
    </span>
  );
};

export interface RuleCardProps {
  rule: SentenceRule;
  /** 1-based, as announced and as numbered. */
  position: number;
  setSize: number;
  numbered: boolean;
  mark: RowMark | undefined;
  idPrefix: string;
  dataTestId: string;
  labels: DecisionCardLabels;
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
