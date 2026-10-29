import * as React from 'react';
import type {
  ConditionsEditorStrings,
  ConditionVocabulary,
  RenderConditionValue,
} from '@/components/ui/conditions-editor';
import type { ValueModeStrings } from '@/components/ui/field-addons';
import type { MultiSelectStrings } from '@/components/ui/multi-select';
import type { VariablePickerItem } from '@/components/ui/variable-picker';
import type { ExpressionRule, Rule, RuleOutcome, RulesDialect } from './model';
import type { RulesEditorStrings } from './strings';

export interface RuleExpressionEditorProps {
  rule: ExpressionRule;
  /** For the control, so the rule's hidden label names it. */
  id: string;
  value: string;
  onChange: (expression: string) => void;
  /** Call when focus leaves the editor, so its message can show. */
  onBlur: () => void;
  /** Ids of the rule name and the editor's label, for `aria-labelledby`. */
  labelledBy: string;
  invalid: boolean;
  /** The message's id, for `aria-describedby` and `aria-errormessage`, while it shows. */
  errorId?: string;
  disabled: boolean;
  placeholder?: string;
}

/**
 * Replaces a rule's expression editor with the host's own, such as a code editor that knows its
 * variables. Return `undefined` to keep the built-in one.
 *
 * It is called during render, not mounted as a component, so it cannot call hooks itself. Return
 * a component that does.
 */
export type RenderRuleExpressionEditor = (
  props: RuleExpressionEditorProps
) => React.ReactNode | undefined;

export interface RulesEditorContextValue {
  outcomes: readonly RuleOutcome[];
  vocabulary: ConditionVocabulary;
  variables?: VariablePickerItem[];
  renderValue?: RenderConditionValue;
  maxDepth: number;
  showMatchMode: boolean;
  allowExpressions: boolean;
  dialect?: RulesDialect;
  renderExpressionEditor?: RenderRuleExpressionEditor;
  forceErrors: boolean;
  defaultTouched?: readonly string[];
  disabled: boolean;
  strings: RulesEditorStrings;
  conditionsStrings: Partial<ConditionsEditorStrings>;
  valueModeStrings?: Partial<ValueModeStrings>;
  multiSelectStrings?: Partial<MultiSelectStrings>;
  /** Stable: replaces the rule with the same id. */
  updateRule: (rule: Rule) => void;
}

export const RulesEditorContext = React.createContext<RulesEditorContextValue | null>(null);

export function useRulesEditor() {
  const value = React.useContext(RulesEditorContext);
  if (!value) throw new Error('RuleCard must be rendered inside a RulesEditor.');
  return value;
}
