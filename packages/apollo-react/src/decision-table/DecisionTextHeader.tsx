import { cn } from '@uipath/apollo-wind';
import type React from 'react';
import { forwardRef, useId } from 'react';
import type { DecisionTextDiff, DiffLabels } from './decisionTextDiff';
import { MarkBadge, type MarkBadgeProps, markIds } from './MarkBadge';
import type { Mark } from './marks';
import { PolicyPicker, type PolicyPickerProps } from './PolicyPicker';
import { isLineMark, type LineMarks } from './sentenceMarks';
import {
  CHANGED_CHIP_CLASS,
  DECISION_TEXT_HEADER_CLASS,
  HEADER_LABEL_CLASS,
  HIT_POLICY_CHANGE_CLASS,
  STRUCK_VALUE_CLASS,
} from './sentenceStyles';
import type { SentenceHeader } from './sentenceTypes';

export interface DecisionTextHeaderProps {
  header: SentenceHeader;
  policy: Omit<PolicyPickerProps, 'dataTestId' | 'describedBy'> | undefined;
  /** The mark of the decision as a whole. */
  mark: Mark | undefined;
  /** The hit policy's change in a diff, shown in place of the label or picker. */
  hitPolicy: DecisionTextDiff['hitPolicy'];
  labels: MarkBadgeProps['labels'] & Pick<DiffLabels, 'previousValue' | 'currentValue'>;
  dataTestId: string;
}

type HitPolicyChangeProps = Pick<DecisionTextHeaderProps, 'labels'> & {
  change: NonNullable<DecisionTextHeaderProps['hitPolicy']>;
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
  ({ header, policy, mark, hitPolicy, labels, dataTestId }, ref) => {
    const badgeId = useId();
    const marks: LineMarks | null = isLineMark(mark) ? [mark] : null;
    const describedBy = marks ? markIds(badgeId, marks).join(' ') : undefined;
    return (
      <div ref={ref} className={DECISION_TEXT_HEADER_CLASS} data-testid={`${dataTestId}-header`}>
        {hitPolicy ? (
          <HitPolicyChange change={hitPolicy} describedBy={describedBy} labels={labels} />
        ) : policy ? (
          <PolicyPicker {...policy} describedBy={describedBy} dataTestId={dataTestId} />
        ) : (
          <span className={HEADER_LABEL_CLASS} aria-describedby={describedBy}>
            {header.label}
          </span>
        )}
        {marks && <MarkBadge id={badgeId} marks={marks} labels={labels} />}
        <span>{header.hint}</span>
      </div>
    );
  }
);

DecisionTextHeader.displayName = 'DecisionTextHeader';
