import type React from 'react';
import { AddRuleButton, type AddRuleButtonProps } from './AddRuleButton';
import type { SentenceListStyle } from './sentenceRuleHeights';
import { ADD_RULE_FOOTER_CLASS } from './sentenceStyles';

export interface AddRuleFooterProps {
  addRule: AddRuleButtonProps;
  /** The list's geometry, so the action lines up with the rules. */
  style: SentenceListStyle;
}

/** The add-rule action after the rules, as the grid's footer row. */
export const AddRuleFooter: React.FC<AddRuleFooterProps> = ({ addRule, style }) => (
  <div className={ADD_RULE_FOOTER_CLASS} style={style} data-add-rule>
    <AddRuleButton {...addRule} />
  </div>
);
