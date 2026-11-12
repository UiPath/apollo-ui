import type { LineTextProps } from './LineText';
import type { MarkBadgeProps } from './MarkBadge';
import { markIds } from './MarkBadge';
import type { RowMark } from './marks';
import type { RemoveConditionButtonProps } from './RemoveConditionButton';
import type { RuleCardLabels, RuleCardProps } from './RuleCard';
import { type LineMark, lineMarksOf, type MarkFields, unplacedColumnIds } from './sentenceMarks';
import {
  boundedParts,
  columnNameOf,
  partsText,
  SENTENCE_LINE_VALUE_LIMIT,
  stopTokensOf,
} from './sentenceParts';
import type { SentencePart, SentenceRule, SentenceToken } from './sentenceTypes';
import type { CellStop } from './TokenChip';

/** The `RowMark` fields a card paints; a field added to `RowMark` fails to compile here until the card decides on it. */
const cardMark = (mark: RowMark | undefined) =>
  ({
    tone: mark?.tone,
    dim: mark?.dim,
    title: mark?.title,
    glyph: mark?.glyph,
    cells: mark?.cells,
  }) satisfies MarkFields<RowMark>;

/** A cell's stop token and the parts of its line. */
interface FirstValue {
  token: SentenceToken;
  parts: readonly SentencePart[];
}

/** Each cell's stop token and the parts of its line, in reading order. */
export const firstValuesOf = (rule: SentenceRule) => {
  const stops = new Set(stopTokensOf(rule));
  const first = new Map<string, FirstValue>();
  for (const parts of [rule.heading, rule.lead, ...rule.lines.map((line) => line.parts)]) {
    for (const part of parts) {
      if (typeof part !== 'string' && stops.has(part) && !first.has(part.columnId)) {
        first.set(part.columnId, { token: part, parts });
      }
    }
  }
  return first;
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
  if (indexes.length === 0) return '';
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

/** The clear actions of a card's heading, per outcome with a value, and the remove actions of its lead, per input it words, and of each condition line. */
interface RuleRemovals {
  heading: RemoveConditionButtonProps[];
  lead: RemoveConditionButtonProps[];
  lines: (RemoveConditionButtonProps | null)[];
}

type RuleCardModelParams = Pick<
  RuleCardProps,
  | 'rule'
  | 'position'
  | 'numbered'
  | 'mark'
  | 'selectable'
  | 'decisionLinks'
  | 'idPrefix'
  | 'labels'
  | 'editLabels'
>;

/** What a rule card renders, derived from its rule, its mark and its strings. */
interface RuleCardModel
  extends Pick<RowMark, 'tone' | 'dim' | 'title' | 'cells'>,
    Pick<LineTextProps, 'stopOf' | 'linkOf'> {
  ariaLabel: string;
  describedBy: string | undefined;
  stops: CellStop[];
  badges: RuleBadges;
  removals: RuleRemovals;
}

const filledColumnIds = (parts: readonly SentencePart[]): string[] => [
  ...new Set(
    parts.flatMap((part) =>
      typeof part !== 'string' && part.kind === 'value' && part.text !== '' ? [part.columnId] : []
    )
  ),
];

const inputColumnIds = (parts: readonly SentencePart[]): string[] => [
  ...new Set(
    parts.flatMap((part) =>
      typeof part !== 'string' && part.kind === 'input' ? [part.columnId] : []
    )
  ),
];

/** A rule card's mark, name and description, cell stops and decision links, glyph badges and remove actions. */
export const ruleCardModel = ({
  rule,
  position,
  numbered,
  mark,
  selectable,
  decisionLinks,
  idPrefix,
  labels,
  editLabels,
}: RuleCardModelParams): RuleCardModel => {
  const id = `${idPrefix}-${position}`;
  const { tone, dim, title, cells } = cardMark(mark);
  const stops: CellStop[] = selectable
    ? [...firstValuesOf(rule)].map(([columnId, { token, parts }], index) => ({
        token,
        labelId: `${id}-cell-${index}`,
        label: labels.cell(
          columnNameOf(rule, columnId),
          shownValuesOf(parts, columnId, labels),
          position
        ),
      }))
    : [];
  const stopByToken = new Map(stops.map((stop) => [stop.token, stop]));
  const badgeFor = (key: string, marks: LineMark[]) =>
    marks.length > 0 ? { id: `${id}-mark-${key}`, marks, labels } : null;
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
  const removalOf = (columnId: string): RemoveConditionButtonProps | null =>
    editLabels
      ? { columnId, label: editLabels.removeCondition(columnNameOf(rule, columnId), position) }
      : null;
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
    linkOf: (token) =>
      decisionLinks && token.kind === 'input' && token.decisionId !== undefined
        ? {
            decisionId: token.decisionId,
            label: labels.openDecision(token.text),
            tabbable: !selectable,
          }
        : undefined,
    badges,
    removals: {
      heading: editLabels
        ? filledColumnIds(rule.heading).map((columnId) => ({
            columnId,
            label: editLabels.clearOutcome(columnNameOf(rule, columnId), position),
          }))
        : [],
      lead: inputColumnIds(rule.lead).flatMap((columnId) => removalOf(columnId) ?? []),
      lines: rule.lines.map((line) => removalOf(line.columnId)),
    },
  };
};
