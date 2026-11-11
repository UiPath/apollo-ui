import { memo } from 'react';
import { ConditionLine, type ConditionLineLabels } from './ConditionLine';
import type { MarkBadgeLabels } from './MarkBadge';
import type { RowMark } from './marks';
import { RuleLine } from './RuleLine';
import { ruleCardModel } from './ruleCardModel';
import {
  LINES_CLASS,
  ROW_NUMBER_CLASS,
  ROW_SURFACE_CLASS,
  RULE_CARD_CLASS,
} from './sentenceStyles';
import type { SentenceRule } from './sentenceTypes';

export interface RuleCardLabels extends MarkBadgeLabels, ConditionLineLabels {}

export interface RuleCardProps {
  rule: SentenceRule;
  /** 1-based, as announced and as numbered. */
  position: number;
  setSize: number;
  numbered: boolean;
  mark: RowMark | undefined;
  idPrefix: string;
  dataTestId: string;
  labels: RuleCardLabels;
}

/** One rule as a sentence: its heading, its lead and its condition lines. */
export const RuleCard = memo<RuleCardProps>(
  ({ rule, position, setSize, numbered, mark, idPrefix, dataTestId, labels }) => {
    const card = ruleCardModel({ rule, position, mark, idPrefix, labels });
    const lineProps = { cells: card.cells, labels };

    return (
      <li
        aria-posinset={position}
        aria-setsize={setSize}
        aria-labelledby={[numbered && `${card.id}-number`, `${card.id}-heading`, `${card.id}-lead`]
          .filter(Boolean)
          .join(' ')}
        aria-describedby={card.describedBy}
        className={RULE_CARD_CLASS}
        data-row-id={rule.rowId}
        data-tone={card.tone}
        data-dim={card.dim}
        data-testid={`${dataTestId}-row-${rule.rowId}`}
      >
        <div className={ROW_SURFACE_CLASS}>
          {numbered && (
            <span id={`${card.id}-number`} className={ROW_NUMBER_CLASS}>
              {position}
            </span>
          )}
          <RuleLine
            id={`${card.id}-heading`}
            heading
            parts={rule.heading}
            title={card.title}
            badge={card.badges.heading}
            {...lineProps}
          />
          <RuleLine
            id={`${card.id}-lead`}
            parts={rule.lead}
            badge={card.badges.lead}
            {...lineProps}
          />
          {rule.lines.length > 0 && (
            <ul className={LINES_CLASS}>
              {rule.lines.map((line, index) => (
                <ConditionLine
                  key={index}
                  line={line}
                  badge={card.badges.lines[index] ?? null}
                  {...lineProps}
                />
              ))}
            </ul>
          )}
        </div>
      </li>
    );
  }
);
