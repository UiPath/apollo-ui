import { cn } from '@uipath/apollo-wind';
import { CSS } from '@dnd-kit/utilities';
import { ArrowUpDown } from 'lucide-react';
import type React from 'react';
import { memo } from 'react';
import { CitationButtons } from './CitationButton';
import { ConditionLine } from './ConditionLine';
import { type DiffChange, type RuleDiff, removedLineKey } from './decisionTextDiff';
import { RuleActions, type RuleActionsLabels } from './RuleActions';
import { RuleLine, type RuleLineProps } from './RuleLine';
import type { RuleSortable } from './RuleSortable';
import {
  type CardMode,
  type RuleCardBase,
  type RuleRemovalLabels,
  ruleCardModel,
} from './ruleCardModel';
import { StopLabels } from './StopLabels';
import { isLineMark } from './sentenceMarks';
import { ruleTitleOf } from './sentenceParts';
import {
  CHANGE_SIGN_CLASS,
  CITED_LINE_CLASS,
  CITED_LINES_CLASS,
  CLAUSE_CLASS,
  HEADING_ACTIONS_SPACE_CLASS,
  INLINE_LINE_CLASS,
  LINES_CLASS,
  MOVED_ICON_CLASS,
  REVEALED_ACTION_CLASS,
  ROW_CHANGE_CLASS,
  ROW_NUMBER_CHANGE_CLASS,
  ROW_NUMBER_CLASS,
  ROW_SURFACE_CLASS,
  RULE_CARD_CLASS,
  RULE_CITATIONS_CLASS,
  RULE_TITLE_CLASS,
  SENTENCE_CLASS,
} from './sentenceStyles';
import type { RuleMenuKind } from './sentenceTargets';
import type { DecisionTextCitations } from './sentenceTypes';

/** A card's last line with its citation buttons after it, beside it when they fit, else below. */
const CitedLine: React.FC<{ citations: React.ReactNode; children: React.ReactNode }> = ({
  citations,
  children,
}) =>
  citations ? (
    <div className={CITED_LINES_CLASS}>
      {children}
      {citations}
    </div>
  ) : (
    children
  );

const NO_REMOVALS: RuleLineProps['removals'] = [];

/** A diff's sign for each change, as the Business Rules table diff marks them. */
const CHANGE_SIGNS = { add: '+', update: '~', delete: '−' } satisfies Record<DiffChange, string>;

/** A changed rule's sign, or arrows when it moved. */
const ChangeSign: React.FC<{ diff: RuleDiff }> = ({ diff }) => {
  const { change } = diff;
  if (diff.change === 'update' && diff.movedFrom !== undefined) {
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

/** A card's mode: read, editable with its strings, open menu and pending line, or a diff's. */
export type RuleCardMode =
  | Exclude<CardMode, { kind: 'edit' }>
  | {
      kind: 'edit';
      editLabels: RuleCardEditLabels;
      /** The card's menu that is open, if any. */
      openMenu: RuleMenuKind | undefined;
      /** The line of the condition the open editor adds, if any. */
      pendingColumnId: string | undefined;
      /** The card's sortable, when its rules can be dragged to reorder them. */
      sortable: RuleSortable | null;
    };

export type RuleCardProps = RuleCardBase &
  RuleCardMode & {
    setSize: number;
    /** The selected cell, null when the rule is selected, undefined when the row is not. */
    selectedColumnId: string | null | undefined;
    /** The table's citations; this card shows its rule's. */
    citations: DecisionTextCitations;
    dataTestId: string;
  };

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
    citations,
    idPrefix,
    dataTestId,
    labels,
    ...mode
  }) => {
    const diff = mode.kind === 'diff' ? mode.diff : undefined;
    const edit = mode.kind === 'edit' ? mode : undefined;
    const pendingColumnId = edit?.pendingColumnId;
    const sortable = edit?.sortable ?? null;
    const card = ruleCardModel({
      rule,
      position,
      numbered,
      mark,
      selectable,
      decisionLinks,
      idPrefix,
      labels,
      ...mode,
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
    const rowSelected = selectedColumnId !== undefined;
    const cited = citations.kind === 'cited' ? (citations.rules.get(rule.rowId) ?? []) : [];
    const lined = rule.lines.length + removedLines.length > 0;
    const title = ruleTitleOf(rule);
    const citationButtons =
      citations.kind === 'cited' && cited.length > 0 ? (
        <div className={RULE_CITATIONS_CLASS}>
          <CitationButtons
            citations={cited}
            owner={{ kind: 'rule', position: diff?.number ?? position }}
            onOpen={citations.onOpenCitation}
            selected={rowSelected}
            tabIndex={rowSelected && selectable ? 0 : -1}
            className={cn(!rowSelected && REVEALED_ACTION_CLASS)}
            labels={labels}
            dataTestId={`${dataTestId}-citation-${rule.rowId}`}
          />
        </div>
      ) : null;

    return (
      <li
        ref={sortable?.setNodeRef}
        style={
          sortable
            ? {
                transform: CSS.Translate.toString(sortable.transform),
                transition: sortable.transition,
              }
            : undefined
        }
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
        data-editable={edit !== undefined || undefined}
        data-dragging={sortable?.isDragging || undefined}
        data-testid={`${dataTestId}-row-${rule.rowId}`}
      >
        <div
          className={cn(ROW_SURFACE_CLASS, diff && ROW_CHANGE_CLASS)}
          data-selected={ruleSelected || undefined}
          data-row-selected={rowSelected || undefined}
        >
          {(card.number !== null || card.changeStatus) && (
            <span className={cn(ROW_NUMBER_CLASS, diff && ROW_NUMBER_CHANGE_CLASS)}>
              {diff && <ChangeSign diff={diff} />}
              {card.number}
              {card.changeStatus && <span className="sr-only">{card.changeStatus}</span>}
            </span>
          )}
          {title !== null && (
            <div
              className={cn(RULE_TITLE_CLASS, edit && HEADING_ACTIONS_SPACE_CLASS)}
              data-rule-title
            >
              {title}
            </div>
          )}
          <CitedLine citations={lined ? null : citationButtons}>
            <div
              className={cn(
                SENTENCE_CLASS,
                edit && HEADING_ACTIONS_SPACE_CLASS,
                citationButtons && !lined && CITED_LINE_CLASS
              )}
              data-sentence
            >
              <div
                className={CLAUSE_CLASS}
                style={
                  card.removals.lead.length > 1
                    ? { paddingInlineEnd: `calc(${card.removals.lead.length} * 1.25rem + 0.5rem)` }
                    : undefined
                }
              >
                <RuleLine
                  heading
                  parts={rule.heading}
                  title={isLineMark(mark) ? undefined : card.title}
                  badge={card.badges.heading}
                  removals={NO_REMOVALS}
                  unworded={diff?.removedOutcomes}
                  className={INLINE_LINE_CLASS}
                  {...lineProps}
                />{' '}
                <RuleLine
                  verdicts
                  className={INLINE_LINE_CLASS}
                  parts={rule.lead}
                  badge={card.badges.lead}
                  removals={card.removals.lead}
                  {...lineProps}
                />
              </div>
            </div>
          </CitedLine>
          {lined && (
            <CitedLine citations={citationButtons}>
              <ul
                className={cn(
                  LINES_CLASS,
                  edit && HEADING_ACTIONS_SPACE_CLASS,
                  citationButtons && CITED_LINE_CLASS
                )}
              >
                {rule.lines.map((line, index) => (
                  <ConditionLine
                    key={line.columnId}
                    line={line}
                    state={line.columnId === pendingColumnId ? 'pending' : 'held'}
                    badge={card.badges.lines[index] ?? null}
                    removal={
                      line.columnId === pendingColumnId
                        ? null
                        : (card.removals.lines[index] ?? null)
                    }
                    {...lineProps}
                  />
                ))}
                {removedLines.map((line) => (
                  <ConditionLine
                    key={removedLineKey(line)}
                    line={line}
                    state={line.change}
                    badge={null}
                    removal={null}
                    {...lineProps}
                  />
                ))}
              </ul>
            </CitedLine>
          )}
          {edit && (
            <RuleActions
              position={position}
              selected={rowSelected}
              labels={edit.editLabels}
              openMenu={edit.openMenu}
              sortable={sortable}
            />
          )}
        </div>
        {card.stops.length > 0 && <StopLabels stops={card.stops} />}
      </li>
    );
  }
);
