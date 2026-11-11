import type React from 'react';
import { DECISION_TEXT_HEADER_CLASS, HEADER_LABEL_CLASS } from './sentenceStyles';

/** The sticky line above the rules: a label and its hint. */
export interface SentenceHeader {
  label: string;
  hint: string;
}

export interface DecisionTextHeaderProps {
  header: SentenceHeader;
  dataTestId: string;
}

export const DecisionTextHeader: React.FC<DecisionTextHeaderProps> = ({ header, dataTestId }) => (
  <div className={DECISION_TEXT_HEADER_CLASS} data-testid={`${dataTestId}-header`}>
    <span className={HEADER_LABEL_CLASS}>{header.label}</span>
    <span>{header.hint}</span>
  </div>
);
