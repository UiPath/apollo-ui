import { EmptyState } from '@uipath/apollo-wind';
import type React from 'react';
import { AddRuleButton } from './AddRuleButton';
import type { DecisionTextAddRule } from './DecisionText';
import { EMPTY_STATE_CLASS, EMPTY_STATE_FRAME_CLASS } from './sentenceStyles';

export interface EmptyRulesProps {
  title: string;
  addRule: DecisionTextAddRule | undefined;
  dataTestId: string;
}

/** What the view shows with no rules: its message and, when given, the add action. */
export const EmptyRules: React.FC<EmptyRulesProps> = ({ title, addRule, dataTestId }) => (
  <div className={EMPTY_STATE_FRAME_CLASS}>
    <EmptyState
      size="compact"
      title={title}
      className={EMPTY_STATE_CLASS}
      data-testid={`${dataTestId}-empty`}
    >
      {addRule && <AddRuleButton addRule={addRule} />}
    </EmptyState>
  </div>
);
