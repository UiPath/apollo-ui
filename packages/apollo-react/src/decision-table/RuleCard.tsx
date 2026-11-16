import { cn } from '@uipath/apollo-wind';
import { ArrowUpDown } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import { ConditionLine } from './ConditionLine';
import type { DiffChange, RuleDiff } from './decisionTextDiff';
import { RuleActions, type RuleActionsLabels } from './RuleActions';
import { RuleLine } from './RuleLine';
import { type RuleCardModelParams, type RuleRemovalLabels, ruleCardModel } from './ruleCardModel';
import { StopLabels } from './StopLabels';
import {
  CHANGE_SIGN_CLASS,
  HEADING_ACTIONS_SPACE_CLASS,
  LINES_CLASS,
  MOVED_ICON_CLASS,
  ROW_CHANGE_CLASS,
  ROW_NUMBER_CHANGE_CLASS,
  ROW_NUMBER_CLASS,
  ROW_SURFACE_CLASS,
  RULE_CARD_CLASS,
} from './sentenceStyles';
import type { RuleMenuKind } from './sentenceTargets';

/** A diff's sign for each change, as the Business Rules table diff marks them. */
const CHANGE_SIGNS = { add: '+', update: '~', delete: '−' } satisfies Record<DiffChange, string>;

/** A changed rule's sign, or arrows when it moved. */
const ChangeSign: React.FC<Pick<RuleDiff, 'change' | 'movedFrom'>> = ({ change, movedFrom }) => {
  if (movedFrom !== undefined) {
    return <ArrowUpDown aria-hidden className={MOVED_ICON_CLASS} strokeWidth={2.5} />;
  }
  return change ? (
    <span aria-hidden className={CHANGE_SIGN_CLASS}>
      {CHANGE_SIGNS[change]}
    </span>
  ) : null;
};

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
  /** The line of the condition the open editor adds, if any. */
  pendingColumnId: string | undefined;
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
    pendingColumnId,
    diff,
    idPrefix,
    dataTestId,
    labels,
  }) => {
    const card = ruleCardModel({
      diff,
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
      diffOf: card.diffOf,
      labels,
    };
    const removedLines = diff?.removedLines ?? [];
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
        data-change={diff?.change}
        data-dim={card.dim}
        data-testid={`${dataTestId}-row-${rule.rowId}`}
      >
        <div
          className={cn(ROW_SURFACE_CLASS, diff && ROW_CHANGE_CLASS)}
          data-selected={ruleSelected || undefined}
        >
          {(card.number !== null || card.changeStatus) && (
            <span className={cn(ROW_NUMBER_CLASS, diff && ROW_NUMBER_CHANGE_CLASS)}>
              {diff && <ChangeSign change={diff.change} movedFrom={diff.movedFrom} />}
              {card.number}
              {card.changeStatus && <span className="sr-only">{card.changeStatus}</span>}
            </span>
          )}
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
          {rule.lines.length + removedLines.length > 0 && (
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
              {removedLines.map((line) => (
                <ConditionLine
                  key={`removed-${line.columnId}`}
                  line={line}
                  pending={false}
                  removed
                  badge={null}
                  removal={null}
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
