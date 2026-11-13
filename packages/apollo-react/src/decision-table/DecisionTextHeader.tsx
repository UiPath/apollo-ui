import { forwardRef } from 'react';
import { DECISION_TEXT_HEADER_CLASS, HEADER_LABEL_CLASS } from './sentenceStyles';
import type { SentenceHeader } from './sentenceTypes';

export interface DecisionTextHeaderProps {
  header: SentenceHeader;
  dataTestId: string;
}

export const DecisionTextHeader = forwardRef<HTMLDivElement, DecisionTextHeaderProps>(
  ({ header, dataTestId }, ref) => (
    <div ref={ref} className={DECISION_TEXT_HEADER_CLASS} data-testid={`${dataTestId}-header`}>
      <span className={HEADER_LABEL_CLASS}>{header.label}</span>
      <span>{header.hint}</span>
    </div>
  )
);

DecisionTextHeader.displayName = 'DecisionTextHeader';
