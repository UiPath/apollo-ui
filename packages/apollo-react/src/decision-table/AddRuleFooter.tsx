import type React from 'react';
import { AddRuleButton } from './AddRuleButton';
import type { DecisionTextAddRule } from './DecisionText';
import type { SentenceListStyle } from './sentenceRuleHeights';
import { ADD_RULE_FOOTER_CLASS } from './sentenceStyles';

export interface AddRuleFooterProps {
  addRule: DecisionTextAddRule;
  /** The list's geometry, so the action lines up with the rules. */
  style: SentenceListStyle;
}

/** The add-rule action after the rules, as the grid's footer row. */
export const AddRuleFooter: React.FC<AddRuleFooterProps> = ({ addRule, style }) => (
  <div className={ADD_RULE_FOOTER_CLASS} style={style}>
    <AddRuleButton addRule={addRule} />
  </div>
);
