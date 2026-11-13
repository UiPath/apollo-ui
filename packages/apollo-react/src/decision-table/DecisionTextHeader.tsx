import { forwardRef, useId } from 'react';
import { MarkBadge, type MarkBadgeProps, markIds } from './MarkBadge';
import type { Mark } from './marks';
import { PolicyPicker, type PolicyPickerProps } from './PolicyPicker';
import { isLineMark, type LineMarks } from './sentenceMarks';
import { DECISION_TEXT_HEADER_CLASS, HEADER_LABEL_CLASS } from './sentenceStyles';
import type { SentenceHeader } from './sentenceTypes';

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
    const marks: LineMarks | null = isLineMark(mark) ? [mark] : null;
    const describedBy = marks ? markIds(badgeId, marks).join(' ') : undefined;
    return (
      <div ref={ref} className={DECISION_TEXT_HEADER_CLASS} data-testid={`${dataTestId}-header`}>
        {policy ? (
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
