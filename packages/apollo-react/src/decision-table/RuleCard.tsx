import { memo } from 'react';
import { ConditionLine, type ConditionLineLabels } from './ConditionLine';
import type { MarkBadgeLabels } from './MarkBadge';
import type { RowMark } from './marks';
import { RuleActions, type RuleActionsLabels } from './RuleActions';
import { RuleLine } from './RuleLine';
import { ruleCardModel } from './ruleCardModel';
import { StopLabels } from './StopLabels';
import {
  HEADING_ACTIONS_SPACE_CLASS,
  LINES_CLASS,
  ROW_NUMBER_CLASS,
  ROW_SURFACE_CLASS,
  RULE_CARD_CLASS,
} from './sentenceStyles';
import type { RuleMenuKind } from './sentenceTargets';
import type { SentenceRule } from './sentenceTypes';

export interface RuleCardLabels extends MarkBadgeLabels, ConditionLineLabels {
  /** A cell's name as a keyboard stop, e.g. "age 25 and 60, rule 2": its column, its values as shown and its row's 1-based position. */
  cell: (column: string, values: string, position: number) => string;
  /** An empty value as read aloud in a cell's name, e.g. "empty", where the line shows a dash. */
  emptyValue: string;
  /** An input's link to the decision that produces it, e.g. "Open the income decision". */
  openDecision: (input: string) => string;
}

/** A card's editing strings: its actions', and its remove and clear buttons'. */
export interface RuleCardEditLabels extends RuleActionsLabels {
  /** A condition's remove action, e.g. "Remove age from rule 2". */
  removeCondition: (column: string, position: number) => string;
  /** An outcome's clear action, e.g. "Clear risk in rule 2"; the output stays, its value empty. */
  clearOutcome: (column: string, position: number) => string;
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
  /** Whether an input another decision produces links to that decision. */
  decisionLinks: boolean;
  /** The editing strings, or undefined for a read-only card. */
  editLabels: RuleCardEditLabels | undefined;
  /** The card's menu that is open, if any. */
  openMenu: RuleMenuKind | undefined;
  /** The line of the condition the open editor adds, if any. */
  pendingColumnId: string | undefined;
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
    decisionLinks,
    editLabels,
    openMenu,
    pendingColumnId,
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
            removals={card.removals.heading}
            className={editLabels && HEADING_ACTIONS_SPACE_CLASS}
            {...lineProps}
          />
          <RuleLine
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
                  pending={line.columnId === pendingColumnId}
                  badge={card.badges.lines[index] ?? null}
                  removal={
                    line.columnId === pendingColumnId ? null : (card.removals.lines[index] ?? null)
                  }
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
