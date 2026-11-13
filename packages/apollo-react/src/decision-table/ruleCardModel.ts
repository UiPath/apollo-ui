import type { LineTextLabels } from './LineText';
import type { MarkBadgeLabels, MarkBadgeProps } from './MarkBadge';
import { markIds } from './MarkBadge';
import type { RowMark } from './marks';
import { type LineMarks, lineMarksOf, type MarkFields, unplacedColumnIds } from './sentenceMarks';
import {
  boundedParts,
  columnNameOf,
  isOutcome,
  partsText,
  SENTENCE_LINE_VALUE_LIMIT,
} from './sentenceParts';
import type { SentencePart, SentenceRule, SentenceToken } from './sentenceTypes';
import type { CellStop } from './TokenChip';

export interface RuleCardLabels extends MarkBadgeLabels, LineTextLabels {
  /** A cell's name as a keyboard stop, e.g. "age 25 and 60, rule 2": its column, its values as shown and its row's 1-based position; without it a stop is named by its column and values. */
  cell?: (column: string, values: string, position: number) => string;
  /** An empty value as read aloud in a cell's name, e.g. "empty", where the line shows a dash; without it the dash is read. */
  emptyValue?: string;
}

/** The `RowMark` fields a card paints; a field added to `RowMark` fails to compile here until the card decides on it. */
const cardMark = (mark: RowMark | undefined) =>
  ({
    tone: mark?.tone,
    dim: mark?.dim,
    title: mark?.title,
    glyph: mark?.glyph,
    cells: mark?.cells,
  }) satisfies MarkFields<RowMark>;

/** A cell's first value token and the parts of its line. */
interface FirstValue {
  token: SentenceToken;
  parts: readonly SentencePart[];
}

/** Each cell's first value token and the parts of its line, in reading order. */
export const firstValuesOf = (rule: SentenceRule) => {
  const first = new Map<string, FirstValue>();
  for (const parts of [rule.heading, rule.lead, ...rule.lines.map((line) => line.parts)]) {
    for (const part of parts) {
      if (typeof part !== 'string' && part.kind === 'value' && !first.has(part.columnId)) {
        first.set(part.columnId, { token: part, parts });
      }
    }
  }
  return first;
};

/** A cell's name as a stop reads it: the host's `cell` label, else its column and values. */
const cellName = (
  { cell }: Pick<RuleCardLabels, 'cell'>,
  column: string,
  values: string,
  position: number
): string => cell?.(column, values, position) ?? [column, values].filter(Boolean).join(' ');

/** A condition's run verdict as its line reads it out, or nothing for an outcome or a cell the run did not judge. */
const verdictOf = (
  rule: SentenceRule,
  columnId: string,
  cells: RowMark['cells'],
  labels: RuleCardLabels
): string => {
  const matched = isOutcome(rule, columnId) ? undefined : cells?.[columnId]?.matched;
  return matched === undefined ? '' : labels.conditionVerdict(matched);
};

/** A cell's values as its line shows them, first to last, then the count of those it clamps. */
const shownValuesOf = (
  parts: readonly SentencePart[],
  columnId: string,
  labels: RuleCardLabels
): string => {
  const { shown, clamped } = boundedParts(parts, SENTENCE_LINE_VALUE_LIMIT);
  const isCell = (part: SentencePart): boolean =>
    typeof part !== 'string' && part.kind === 'value' && part.columnId === columnId;
  const indexes = shown.flatMap((part, index) => (isCell(part) ? [index] : []));
  const text = partsText(shown.slice(indexes[0], (indexes.at(-1) ?? 0) + 1), labels.emptyValue);
  const hidden = clamped.reduce(
    (count, run) => (run.hidden.some(isCell) ? count + run.hiddenValues : count),
    0
  );
  return hidden > 0 ? `${text} ${labels.moreValues(hidden)}` : text;
};

/** A line's text as it shows, each clamped run read as its count. */
const shownLineText = (parts: readonly SentencePart[], labels: RuleCardLabels): string => {
  const { shown, clamped } = boundedParts(parts, SENTENCE_LINE_VALUE_LIMIT);
  const cuts = clamped.map(({ after }) => shown.length - after.length);
  return [
    ...clamped.map(
      ({ hiddenValues }, index) =>
        `${partsText(shown.slice(cuts[index - 1] ?? 0, cuts[index]))} ${labels.moreValues(hiddenValues)}`
    ),
    partsText(shown.slice(cuts.at(-1) ?? 0)),
  ].join('');
};

/** The glyph badges a card's lines end with, or null where a line has none. */
interface RuleBadges {
  heading: MarkBadgeProps | null;
  lead: MarkBadgeProps | null;
  lines: (MarkBadgeProps | null)[];
}

export interface RuleCardModelParams {
  rule: SentenceRule;
  /** 1-based, as announced and as numbered. */
  position: number;
  numbered: boolean;
  mark: RowMark | undefined;
  selectable: boolean;
  idPrefix: string;
  labels: RuleCardLabels;
}

/** What a rule card renders, derived from its rule, its mark and its strings. */
interface RuleCardModel extends Pick<RowMark, 'tone' | 'dim' | 'title' | 'cells'> {
  ariaLabel: string;
  describedBy: string | undefined;
  stops: CellStop[];
  stopOf: (token: SentenceToken) => CellStop | undefined;
  badges: RuleBadges;
}

/** A rule card's mark, name and description, cell stops and glyph badges. */
export const ruleCardModel = ({
  rule,
  position,
  numbered,
  mark,
  selectable,
  idPrefix,
  labels,
}: RuleCardModelParams): RuleCardModel => {
  const id = `${idPrefix}-${position}`;
  const { tone, dim, title, cells } = cardMark(mark);
  const stops: CellStop[] = selectable
    ? [...firstValuesOf(rule)].map(([columnId, { token, parts }], index) => ({
        token,
        labelId: `${id}-cell-${index}`,
        label: [
          cellName(
            labels,
            columnNameOf(rule, columnId),
            shownValuesOf(parts, columnId, labels),
            position
          ),
          verdictOf(rule, columnId, cells, labels),
        ]
          .filter(Boolean)
          .join(' '),
      }))
    : [];
  const stopByToken = new Map(stops.map((stop) => [stop.token, stop]));
  const badgeFor = (key: string, marks: LineMarks | null) =>
    marks ? { id: `${id}-mark-${key}`, marks, labels } : null;
  const unplaced = unplacedColumnIds(
    [rule.heading, rule.lead, ...rule.lines.map((line) => line.parts)],
    cells
  );
  const badges: RuleBadges = {
    heading: badgeFor('heading', lineMarksOf(rule.heading, cells, mark, unplaced)),
    lead: badgeFor('lead', lineMarksOf(rule.lead, cells)),
    lines: rule.lines.map((line, index) =>
      badgeFor(`line-${index}`, lineMarksOf(line.parts, cells))
    ),
  };
  return {
    tone,
    dim,
    title,
    cells,
    ariaLabel: [
      numbered ? String(position) : '',
      shownLineText(rule.heading, labels),
      shownLineText(rule.lead, labels),
    ]
      .filter(Boolean)
      .join(' '),
    describedBy:
      [badges.heading, badges.lead, ...badges.lines]
        .flatMap((badge) => (badge ? markIds(badge.id, badge.marks) : []))
        .join(' ') || undefined,
    stops,
    stopOf: (token) => stopByToken.get(token),
    badges,
  };
};
