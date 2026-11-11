import { memo } from 'react';
import { ConditionLine, type ConditionLineLabels } from './ConditionLine';
import type { MarkBadgeLabels } from './MarkBadge';
import type { RowMark } from './marks';
import { RuleLine } from './RuleLine';
import { ruleCardModel } from './ruleCardModel';
import { StopLabels } from './StopLabels';
import {
  LINES_CLASS,
  ROW_NUMBER_CLASS,
  ROW_SURFACE_CLASS,
  RULE_CARD_CLASS,
} from './sentenceStyles';
import type { SentenceRule } from './sentenceTypes';

export interface RuleCardLabels extends MarkBadgeLabels, ConditionLineLabels {
  /** A cell's name as a keyboard stop, e.g. "age 25 and 60, rule 2": its column, its values as shown and its row's 1-based position. */
  cell: (column: string, values: string, position: number) => string;
  /** An empty value as read aloud in a cell's name, e.g. "empty", where the line shows a dash. */
  emptyValue: string;
}

export interface RuleCardProps {
  rule: SentenceRule;
  /** 1-based, as announced and as numbered. */
  position: number;
  setSize: number;
  numbered: boolean;
  mark: RowMark | undefined;
  /** The selected cell, null when the rule is selected, undefined when the row is not. */
  selectedColumnId: string | null | undefined;
  selectable: boolean;
  idPrefix: string;
  dataTestId: string;
  labels: RuleCardLabels;
}

/** One rule as a sentence: its heading, its lead and its condition lines. */
export const RuleCard = memo<RuleCardProps>(
  ({
    rule,
    position,
    setSize,
    numbered,
    mark,
    selectedColumnId,
    selectable,
    idPrefix,
    dataTestId,
    labels,
  }) => {
    const card = ruleCardModel({
      rule,
      position,
      numbered,
      mark,
      selectable,
      idPrefix,
      labels,
    });
    const lineProps = { cells: card.cells, selectedColumnId, stopOf: card.stopOf, labels };

    return (
      <li
        tabIndex={selectable ? (selectedColumnId === null ? 0 : -1) : undefined}
        aria-posinset={position}
        aria-setsize={setSize}
        aria-label={card.ariaLabel}
        aria-describedby={card.describedBy}
        className={RULE_CARD_CLASS}
        data-row-id={rule.rowId}
        data-tone={card.tone}
        data-dim={card.dim}
        data-testid={`${dataTestId}-row-${rule.rowId}`}
      >
        <div className={ROW_SURFACE_CLASS} data-selected={selectedColumnId === null || undefined}>
          {numbered && <span className={ROW_NUMBER_CLASS}>{position}</span>}
          <RuleLine
            heading
            parts={rule.heading}
            title={card.title}
            badge={card.badges.heading}
            {...lineProps}
          />
          <RuleLine parts={rule.lead} badge={card.badges.lead} {...lineProps} />
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
        {card.stops.length > 0 && <StopLabels stops={card.stops} />}
      </li>
    );
  }
);
