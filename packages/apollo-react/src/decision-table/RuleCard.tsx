import { memo } from 'react';
import { ConditionLine } from './ConditionLine';
import { RuleActions, type RuleActionsLabels } from './RuleActions';
import { RuleLine } from './RuleLine';
import { type RuleCardModelParams, type RuleRemovalLabels, ruleCardModel } from './ruleCardModel';
import { StopLabels } from './StopLabels';
import {
  HEADING_ACTIONS_SPACE_CLASS,
  LINES_CLASS,
  ROW_NUMBER_CLASS,
  ROW_SURFACE_CLASS,
  RULE_CARD_CLASS,
} from './sentenceStyles';
import type { RuleMenuKind } from './sentenceTargets';

/** A card's editing strings: its actions', and its remove and clear buttons'. */
export interface RuleCardEditLabels extends RuleActionsLabels, RuleRemovalLabels {}

export interface RuleCardProps extends RuleCardModelParams {
  setSize: number;
  /** The selected cell, null when the rule is selected, undefined when the row is not. */
  selectedColumnId: string | null | undefined;
  /** The editing strings, or undefined for a read-only card. */
  editLabels: RuleCardEditLabels | undefined;
  /** The card's menu that is open, if any. */
  openMenu: RuleMenuKind | undefined;
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
    decisionLinks,
    editLabels,
    openMenu,
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
      decisionLinks,
      idPrefix,
      labels,
      editLabels,
    });
    const lineProps = {
      cells: card.cells,
      selectedColumnId,
      stopOf: card.stopOf,
      linkOf: card.linkOf,
      labels,
    };
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
            removals={card.removals.heading}
            className={editLabels && HEADING_ACTIONS_SPACE_CLASS}
            {...lineProps}
          />
          <RuleLine
            verdicts
            parts={rule.lead}
            badge={card.badges.lead}
            removals={card.removals.lead}
            {...lineProps}
          />
          {rule.lines.length > 0 && (
            <ul className={LINES_CLASS}>
              {rule.lines.map((line, index) => (
                <ConditionLine
                  key={line.columnId}
                  line={line}
                  badge={card.badges.lines[index] ?? null}
                  removal={card.removals.lines[index] ?? null}
                  {...lineProps}
                />
              ))}
            </ul>
          )}
          {editLabels && (
            <RuleActions
              position={position}
              selected={selectedColumnId !== undefined}
              labels={editLabels}
              openMenu={openMenu}
            />
          )}
        </div>
        {card.stops.length > 0 && <StopLabels stops={card.stops} />}
      </li>
    );
  }
);
