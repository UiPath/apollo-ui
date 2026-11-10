import { Button } from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import type React from 'react';
import type { DecisionTextAddRule } from './DecisionText';

export interface AddRuleButtonProps {
  addRule: DecisionTextAddRule;
}

/** The view's add-rule action. */
export const AddRuleButton: React.FC<AddRuleButtonProps> = ({ addRule }) => (
  <Button variant="outline" size="sm" onClick={addRule.onAdd}>
    <Plus aria-hidden />
    {addRule.label}
  </Button>
);
