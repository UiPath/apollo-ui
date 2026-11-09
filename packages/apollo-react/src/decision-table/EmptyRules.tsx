import { Button, EmptyState } from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import type React from 'react';
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
      {addRule && (
        <Button variant="outline" size="sm" onClick={addRule.onAdd}>
          <Plus aria-hidden />
          {addRule.label}
        </Button>
      )}
    </EmptyState>
  </div>
);
