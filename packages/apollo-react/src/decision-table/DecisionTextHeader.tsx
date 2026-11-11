import { forwardRef, useId } from 'react';
import { MarkBadge, type MarkBadgeProps, markIds } from './MarkBadge';
import type { Mark } from './marks';
import { PolicyPicker, type PolicyPickerProps } from './PolicyPicker';
import { isLineMark } from './sentenceMarks';
import { DECISION_TEXT_HEADER_CLASS, HEADER_LABEL_CLASS } from './sentenceStyles';

/** The sticky line above the rules: a label and its hint. */
export interface SentenceHeader {
  label: string;
  hint: string;
}

export interface DecisionTextHeaderProps {
  header: SentenceHeader;
  policy: Omit<PolicyPickerProps, 'dataTestId' | 'describedBy'> | undefined;
  /** The mark of the decision as a whole. */
  mark: Mark | undefined;
  labels: MarkBadgeProps['labels'];
  dataTestId: string;
}

/** The sticky line above the rules: its label, or the picker in its place, its mark, then its hint. */
export const DecisionTextHeader = forwardRef<HTMLDivElement, DecisionTextHeaderProps>(
  ({ header, policy, mark, labels, dataTestId }, ref) => {
    const badgeId = useId();
    const marks = isLineMark(mark) ? [mark] : [];
    const describedBy = marks.length > 0 ? markIds(badgeId, marks).join(' ') : undefined;
    return (
      <div ref={ref} className={DECISION_TEXT_HEADER_CLASS} data-testid={`${dataTestId}-header`}>
        {policy ? (
          <PolicyPicker {...policy} describedBy={describedBy} dataTestId={dataTestId} />
        ) : (
          <span className={HEADER_LABEL_CLASS} aria-describedby={describedBy}>
            {header.label}
          </span>
        )}
        {marks.length > 0 && <MarkBadge id={badgeId} marks={marks} labels={labels} />}
        <span>{header.hint}</span>
      </div>
    );
  }
);

DecisionTextHeader.displayName = 'DecisionTextHeader';
