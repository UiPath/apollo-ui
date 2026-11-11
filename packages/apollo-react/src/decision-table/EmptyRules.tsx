import { EmptyState } from '@uipath/apollo-wind';
import type React from 'react';
import { AddRuleButton, type AddRuleButtonProps } from './AddRuleButton';
import { EMPTY_STATE_CLASS, GUTTER_CLASS } from './sentenceStyles';

export interface EmptyRulesProps {
  title: string;
  addRule: AddRuleButtonProps | undefined;
  dataTestId: string;
}

/** What the view shows with no rules: its message and, when given, the add action. */
export const EmptyRules: React.FC<EmptyRulesProps> = ({ title, addRule, dataTestId }) => (
  <div className={GUTTER_CLASS}>
    <EmptyState
      size="compact"
      title={title}
      className={EMPTY_STATE_CLASS}
      data-testid={`${dataTestId}-empty`}
    >
      {addRule && <AddRuleButton {...addRule} />}
    </EmptyState>
  </div>
);
