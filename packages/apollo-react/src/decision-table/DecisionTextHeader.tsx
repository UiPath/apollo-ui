import { cn } from '@uipath/apollo-wind';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type React from 'react';
import { forwardRef, useId } from 'react';
import { CitationButtons, type CitationLabels } from './CitationButton';
import { type DecisionGraphCardActions, NameField, NodeMenu } from './DecisionGraphCard';
import {
  GRAPH_NAME_CLASS,
  GRAPH_TOGGLE_CLASS,
  MENU_BUTTON_CLASS,
  RULE_COUNT_CLASS,
} from './decisionGraphStyles';
import type { DiffLabels } from './decisionTextDiff';
import { MarkBadge, type MarkBadgeProps, markIds } from './MarkBadge';
import type { Mark } from './marks';
import { PolicyPicker, type PolicyPickerProps } from './PolicyPicker';
import { isLineMark, type LineMarks } from './sentenceMarks';
import {
  CHANGED_CHIP_CLASS,
  DECISION_TEXT_HEADER_CLASS,
  HEADER_CITATION_REVEAL_CLASS,
  HEADER_CITATIONS_CLASS,
  HEADER_LABEL_CLASS,
  HIT_POLICY_CHANGE_CLASS,
  STRUCK_VALUE_CLASS,
} from './sentenceStyles';
import type { OpenCitation, SentenceCitation } from './sentenceTypes';

/** A hit policy as a chip shows it: its code, or its label when it has none, and its label for assistive technology. */
export interface PolicyShown {
  code: string;
  label: string;
}

const PolicyText = ({ policy }: { policy: PolicyShown }) =>
  policy.code === '' ? (
    <>{policy.label}</>
  ) : (
    <>
      <span aria-hidden>{policy.code}</span>
      <span className="sr-only">{policy.label}</span>
    </>
  );

export interface DecisionTextHeaderProps {
  /** The decision's name, before the hit policy. */
  name: string;
  /** Whether the rules show, and the toggle that shows or hides them. */
  fold: { open: boolean; bodyId: string; onToggle: () => void };
  /** The hit policy: its label, the picker in its place, or its change in a diff. */
  title:
    | { kind: 'label'; code: string; label: string }
    | { kind: 'picker'; policy: Omit<PolicyPickerProps, 'dataTestId' | 'describedBy'> }
    | { kind: 'change'; before: PolicyShown; after: PolicyShown };
  /** What the hit policy does, read with the policy rather than shown. */
  hint: string;
  /** The mark of the decision as a whole. */
  mark: Mark | undefined;
  /** Where the decision was read from, or null. */
  citations: { citations: readonly SentenceCitation[]; onOpen: OpenCitation } | null;
  labels: MarkBadgeProps['labels'] &
    Pick<DiffLabels, 'previousValue' | 'currentValue'> &
    CitationLabels;
  /** How many rules the table has, e.g. "5 rules". */
  ruleCount: string;
  /** The decision's menu, keys and name field, or null when the host offers no action on it. */
  actions: DecisionGraphCardActions | null;
  /** Sticks to the top of the view's own scroll frame. */
  sticky: boolean;
  dataTestId: string;
}

type HitPolicyChangeProps = Pick<DecisionTextHeaderProps, 'labels'> & {
  change: Extract<DecisionTextHeaderProps['title'], { kind: 'change' }>;
  describedBy: string;
};

/** The hit policy before, struck, then after on the changed wash. */
const HitPolicyChange: React.FC<HitPolicyChangeProps> = ({ change, describedBy, labels }) => (
  <span className={HIT_POLICY_CHANGE_CLASS} aria-describedby={describedBy}>
    <del className={STRUCK_VALUE_CLASS}>
      <span className="sr-only">{labels.previousValue} </span>
      <PolicyText policy={change.before} />
    </del>
    <span aria-hidden>→</span>
    <span className={cn('rounded px-0.5', CHANGED_CHIP_CLASS)} data-change="update">
      <span className="sr-only">{labels.currentValue} </span>
      <PolicyText policy={change.after} />
    </span>
  </span>
);

type HitPolicyChipProps = Pick<DecisionTextHeaderProps, 'title' | 'labels' | 'dataTestId'> & {
  describedBy: string;
};

/** The hit policy chip of a table and of its graph card: its code or label, the picker in its place, or its change in a diff. */
export const HitPolicyChip: React.FC<HitPolicyChipProps> = ({
  title,
  describedBy,
  labels,
  dataTestId,
}) => {
  if (title.kind === 'change') {
    return <HitPolicyChange change={title} describedBy={describedBy} labels={labels} />;
  }
  if (title.kind === 'picker') {
    return <PolicyPicker {...title.policy} describedBy={describedBy} dataTestId={dataTestId} />;
  }
  return (
    <span className={HEADER_LABEL_CLASS} title={title.label} aria-describedby={describedBy}>
      <PolicyText policy={title} />
    </span>
  );
};

/** The sticky line above the rules: its label, or the picker in its place, then its mark; its hint describes the policy. */
export const DecisionTextHeader = forwardRef<HTMLDivElement, DecisionTextHeaderProps>(
  (
    { name, fold, title, hint, mark, citations, ruleCount, actions, labels, sticky, dataTestId },
    ref
  ) => {
    const badgeId = useId();
    const hintId = useId();
    const marks: LineMarks | null = isLineMark(mark) ? [mark] : null;
    const describedBy = [...(marks ? markIds(badgeId, marks) : []), hintId].join(' ');
    return (
      <div
        ref={ref}
        className={sticky ? DECISION_TEXT_HEADER_CLASS : cn(DECISION_TEXT_HEADER_CLASS, 'static')}
        data-testid={`${dataTestId}-header`}
      >
        <button
          type="button"
          className={GRAPH_TOGGLE_CLASS}
          aria-expanded={fold.open}
          aria-controls={fold.open ? fold.bodyId : undefined}
          onClick={fold.onToggle}
          onKeyDown={actions?.onKeyDown}
          aria-keyshortcuts={actions?.keyShortcuts.join(' ') || undefined}
          aria-label={actions?.rename ? name : undefined}
          data-text-toggle
          data-testid={`${dataTestId}-toggle`}
        >
          {fold.open ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
          {!actions?.rename && (
            <span className={GRAPH_NAME_CLASS} data-testid={`${dataTestId}-name`}>
              {name}
            </span>
          )}
        </button>
        {actions?.rename && (
          <NameField
            field={actions.rename}
            label={actions.nameField}
            dataTestId={`${dataTestId}-name-field`}
          />
        )}
        <HitPolicyChip
          title={title}
          describedBy={describedBy}
          labels={labels}
          dataTestId={dataTestId}
        />
        {marks && <MarkBadge id={badgeId} marks={marks} labels={labels} focus={{ kind: 'none' }} />}
        <span id={hintId} className="sr-only">
          {hint}
        </span>
        <span className={RULE_COUNT_CLASS} data-testid={`${dataTestId}-rule-count`}>
          {ruleCount}
        </span>
        {citations && (
          <span className={HEADER_CITATIONS_CLASS}>
            <CitationButtons
              citations={citations.citations}
              owner={{ kind: 'table' }}
              onOpen={citations.onOpen}
              selected
              tabIndex={0}
              className={HEADER_CITATION_REVEAL_CLASS}
              labels={labels}
              dataTestId={`${dataTestId}-citation`}
            />
          </span>
        )}
        {actions && (
          <NodeMenu
            actions={actions}
            className={MENU_BUTTON_CLASS}
            dataTestId={`${dataTestId}-menu`}
          />
        )}
      </div>
    );
  }
);

DecisionTextHeader.displayName = 'DecisionTextHeader';
