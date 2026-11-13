import { memo } from 'react';
import { ConditionLine } from './ConditionLine';
import { RuleLine } from './RuleLine';
import { type RuleCardModelParams, ruleCardModel } from './ruleCardModel';
import { StopLabels } from './StopLabels';
import {
  LINES_CLASS,
  ROW_NUMBER_CLASS,
  ROW_SURFACE_CLASS,
  RULE_CARD_CLASS,
} from './sentenceStyles';

export interface RuleCardProps extends RuleCardModelParams {
  setSize: number;
  /** The selected cell, null when the rule is selected, undefined when the row is not. */
  selectedColumnId: string | null | undefined;
  dataTestId: string;
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
    const card = ruleCardModel({ rule, position, numbered, mark, selectable, idPrefix, labels });
    const lineProps = { cells: card.cells, selectedColumnId, stopOf: card.stopOf, labels };
    const ruleSelected = selectedColumnId === null;

    return (
      <li
        tabIndex={selectable ? (ruleSelected ? 0 : -1) : undefined}
        aria-posinset={position}
        aria-setsize={setSize}
        aria-label={card.ariaLabel}
        aria-describedby={card.describedBy}
        aria-current={ruleSelected || undefined}
        className={RULE_CARD_CLASS}
        data-row-id={rule.rowId}
        data-tone={card.tone}
        data-dim={card.dim}
        data-testid={`${dataTestId}-row-${rule.rowId}`}
      >
        <div className={ROW_SURFACE_CLASS} data-selected={ruleSelected || undefined}>
          {numbered && <span className={ROW_NUMBER_CLASS}>{position}</span>}
          <RuleLine
            heading
            parts={rule.heading}
            title={card.title}
            badge={card.badges.heading}
            {...lineProps}
          />
          <RuleLine verdicts parts={rule.lead} badge={card.badges.lead} {...lineProps} />
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
