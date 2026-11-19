import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { CitationButtons, type CitationLabels } from './CitationButton';
import { forwardRef, useId } from 'react';
import type { DiffLabels } from './decisionTextDiff';
import { MarkBadge, type MarkBadgeProps, markIds } from './MarkBadge';
import type { Mark } from './marks';
import { PolicyPicker, type PolicyPickerProps } from './PolicyPicker';
import { isLineMark, type LineMarks } from './sentenceMarks';
import type { OpenCitation, SentenceCitation } from './sentenceTypes';
import {
  CHANGED_CHIP_CLASS,
  DECISION_TEXT_HEADER_CLASS,
  HEADER_CITATION_REVEAL_CLASS,
  HEADER_CITATIONS_CLASS,
  HEADER_LABEL_CLASS,
  HIT_POLICY_CHANGE_CLASS,
  STRUCK_VALUE_CLASS,
} from './sentenceStyles';

export interface DecisionTextHeaderProps {
  /** The hit policy: its label, the picker in its place, or its change in a diff. */
  title:
    | { kind: 'label'; label: string }
    | { kind: 'picker'; policy: Omit<PolicyPickerProps, 'dataTestId' | 'describedBy'> }
    | { kind: 'change'; before: string; after: string };
  /** What the hit policy does. */
  hint: string;
  /** The mark of the decision as a whole. */
  mark: Mark | undefined;
  /** Where the decision was read from, or null. */
  citations: { citations: readonly SentenceCitation[]; onOpen: OpenCitation } | null;
  labels: MarkBadgeProps['labels'] &
    Pick<DiffLabels, 'previousValue' | 'currentValue'> &
    CitationLabels;
  /** Sticks to the top of the view's own scroll frame. */
  sticky: boolean;
  dataTestId: string;
}

type HitPolicyChangeProps = Pick<DecisionTextHeaderProps, 'labels'> & {
  change: Extract<DecisionTextHeaderProps['title'], { kind: 'change' }>;
  describedBy: string | undefined;
};

/** The hit policy before, struck, then after on the changed wash. */
const HitPolicyChange: React.FC<HitPolicyChangeProps> = ({ change, describedBy, labels }) => (
  <span className={HIT_POLICY_CHANGE_CLASS} aria-describedby={describedBy}>
    <del className={STRUCK_VALUE_CLASS}>
      <span className="sr-only">{labels.previousValue} </span>
      {change.before}
    </del>
    <span aria-hidden>→</span>
    <span className={cn('rounded px-0.5', CHANGED_CHIP_CLASS)} data-change="update">
      <span className="sr-only">{labels.currentValue} </span>
      {change.after}
    </span>
  </span>
);

/** The sticky line above the rules: its label, or the picker in its place, its mark, then its hint. */
export const DecisionTextHeader = forwardRef<HTMLDivElement, DecisionTextHeaderProps>(
  ({ title, hint, mark, citations, labels, sticky, dataTestId }, ref) => {
    const badgeId = useId();
    const marks: LineMarks | null = isLineMark(mark) ? [mark] : null;
    const describedBy = marks ? markIds(badgeId, marks).join(' ') : undefined;
    return (
      <div
        ref={ref}
        className={sticky ? DECISION_TEXT_HEADER_CLASS : cn(DECISION_TEXT_HEADER_CLASS, 'static')}
        data-testid={`${dataTestId}-header`}
      >
        {title.kind === 'change' && (
          <HitPolicyChange change={title} describedBy={describedBy} labels={labels} />
        )}
        {title.kind === 'picker' && (
          <PolicyPicker {...title.policy} describedBy={describedBy} dataTestId={dataTestId} />
        )}
        {title.kind === 'label' && (
          <span className={HEADER_LABEL_CLASS} aria-describedby={describedBy}>
            {title.label}
          </span>
        )}
        {marks && <MarkBadge id={badgeId} marks={marks} labels={labels} />}
        <span>{hint}</span>
        {citations && (
          <span className={HEADER_CITATIONS_CLASS}>
            <CitationButtons
              citations={citations.citations}
              onOpen={citations.onOpen}
              selected={false}
              tabIndex={0}
              className={HEADER_CITATION_REVEAL_CLASS}
              labels={labels}
              dataTestId={`${dataTestId}-citation`}
            />
          </span>
        )}
      </div>
    );
  }
);

DecisionTextHeader.displayName = 'DecisionTextHeader';
