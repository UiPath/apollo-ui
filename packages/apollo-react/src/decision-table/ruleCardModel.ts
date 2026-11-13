import type { LineTextLabels } from './LineText';
import type { MarkBadgeLabels, MarkBadgeProps } from './MarkBadge';
import { markIds } from './MarkBadge';
import type { RowMark } from './marks';
import { type LineMarks, lineMarksOf, type MarkFields, unplacedColumnIds } from './sentenceMarks';
import type { SentenceRule } from './sentenceTypes';

export interface RuleCardLabels extends MarkBadgeLabels, LineTextLabels {}

/** The `RowMark` fields a card paints; a field added to `RowMark` fails to compile here until the card decides on it. */
const cardMark = (mark: RowMark | undefined) =>
  ({
    tone: mark?.tone,
    dim: mark?.dim,
    title: mark?.title,
    glyph: mark?.glyph,
    cells: mark?.cells,
  }) satisfies MarkFields<RowMark>;

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
  mark: RowMark | undefined;
  idPrefix: string;
  labels: RuleCardLabels;
}

/** What a rule card renders, derived from its rule, its mark and its strings. */
interface RuleCardModel extends Pick<RowMark, 'tone' | 'dim' | 'title' | 'cells'> {
  id: string;
  describedBy: string | undefined;
  badges: RuleBadges;
}

/** A rule card's id, its mark's tone, dim, title and cells, its glyph badges and the ids of their announcements. */
export const ruleCardModel = ({
  rule,
  position,
  mark,
  idPrefix,
  labels,
}: RuleCardModelParams): RuleCardModel => {
  const id = `${idPrefix}-${position}`;
  const { tone, dim, title, cells } = cardMark(mark);
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
    id,
    tone,
    dim,
    title,
    cells,
    describedBy:
      [badges.heading, badges.lead, ...badges.lines]
        .flatMap((badge) => (badge ? markIds(badge.id, badge.marks) : []))
        .join(' ') || undefined,
    badges,
  };
};
