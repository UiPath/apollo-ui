import * as React from 'react';
import {
  type ConditionField,
  type ConditionOperators,
  type ConditionsEditorStrings,
  type ConditionValueMode,
  type ConditionVocabulary,
  DEFAULT_CONDITION_OPERATORS,
  type RenderConditionValue,
} from '@/components/ui/conditions-editor';
import { defaultValueModes } from '@/components/ui/conditions-editor/status';
import type { ValueModeStrings } from '@/components/ui/field-addons';
import type { MultiSelectStrings } from '@/components/ui/multi-select';
import { AddRowButton, EmptyRows, useRowFocus } from '@/components/ui/row-groups';
import type { VariablePickerItem } from '@/components/ui/variable-picker';
import { cn } from '@/lib';
import {
  type RenderRuleExpressionEditor,
  RulesEditorContext,
  type RulesEditorContextValue,
} from './context';
import { createRule, type Rule, type RuleOutcome, type RulesDialect } from './model';
import { RuleCard } from './rule-card';
import { DEFAULT_RULES_EDITOR_STRINGS, type RulesEditorStrings } from './strings';

export interface RulesEditorProps {
  value: readonly Rule[];
  onChange: (next: Rule[]) => void;
  /** Names the list for assistive technology, e.g. "Field behavior". */
  label: string;
  /** What a rule can do, in the order the outcome select lists them. */
  outcomes: readonly RuleOutcome[];
  /** A new rule's outcome. Defaults to the first of `outcomes`. */
  defaultOutcome?: string;
  /** What a condition can compare. */
  fields: readonly ConditionField[];
  /** The operators per field type. Defaults to the English set. */
  operators?: ConditionOperators;
  /** The value modes each condition's value offers. See `ConditionsEditor`. */
  valueModes?: readonly ConditionValueMode[];
  /** What a condition's Variable mode picks from. */
  variables?: VariablePickerItem[];
  /** Replaces a condition value's control. See `RenderConditionValue`. */
  renderValue?: RenderConditionValue;
  /** How many levels of groups may nest in a rule's conditions. 0 keeps them flat. */
  maxDepth?: number;
  /** Whether a rule's All / Any switch can show. See `ConditionsEditor`. */
  showMatchMode?: boolean;
  /**
   * Offer each rule a switch to one written expression. A rule that already is one always shows
   * the switch, so it can go back to conditions.
   */
  allowExpressions?: boolean;
  /** Carries a rule across when it switches between conditions and an expression. */
  dialect?: RulesDialect;
  /** Replaces the built-in expression editor. See `RenderRuleExpressionEditor`. */
  renderExpressionEditor?: RenderRuleExpressionEditor;
  /** Show every incomplete condition's and blank expression's message, as after a submit. */
  forceErrors?: boolean;
  /**
   * Ids of rules and conditions to treat as already left, so their messages show, e.g. when
   * restoring a draft. Read when each rule mounts.
   */
  defaultTouched?: readonly string[];
  disabled?: boolean;
  className?: string;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<RulesEditorStrings>;
  /**
   * Overrides for the conditions' strings. Their `empty` defaults to `strings.emptyConditions`.
   */
  conditionsStrings?: Partial<ConditionsEditorStrings>;
  /** Overrides for the value-mode menu, indicator, and variable control. */
  valueModeStrings?: Partial<ValueModeStrings>;
  /** Overrides for the options control of an operator that takes several. */
  multiSelectStrings?: Partial<MultiSelectStrings>;
}

/**
 * Edits a list of rules. Each rule has an outcome, and either conditions or one written
 * expression that decide when it applies. Controlled: it holds no rules of its own.
 *
 * Pass the vocabulary, strings, and render functions with a stable identity, such as module
 * constants or memoised values: a new object on each render re-renders every rule.
 */
export function RulesEditor({
  value,
  onChange,
  label,
  outcomes,
  defaultOutcome,
  fields,
  operators = DEFAULT_CONDITION_OPERATORS,
  valueModes,
  variables,
  renderValue,
  maxDepth = 0,
  showMatchMode = true,
  allowExpressions = true,
  dialect,
  renderExpressionEditor,
  forceErrors = false,
  defaultTouched,
  disabled = false,
  className,
  strings,
  conditionsStrings,
  valueModeStrings,
  multiSelectStrings,
}: RulesEditorProps) {
  const focus = useRowFocus();

  // The actions read the latest list, so they stay stable and memoised cards stay put.
  const latest = React.useRef({ value, onChange });
  latest.current = { value, onChange };
  const updateRule = React.useCallback(
    (rule: Rule) =>
      latest.current.onChange(
        latest.current.value.map((current) => (current.id === rule.id ? rule : current))
      ),
    []
  );
  const { afterDelete } = focus;
  const deleteRule = React.useCallback(
    (id: string, position: number) => {
      afterDelete(position);
      latest.current.onChange(latest.current.value.filter((rule) => rule.id !== id));
    },
    [afterDelete]
  );

  const text = React.useMemo(() => ({ ...DEFAULT_RULES_EDITOR_STRINGS, ...strings }), [strings]);
  const ruleConditionsStrings = React.useMemo(
    () => ({ empty: text.emptyConditions, ...conditionsStrings }),
    [text, conditionsStrings]
  );
  const modes = valueModes ?? defaultValueModes(variables);
  const vocabulary = React.useMemo<ConditionVocabulary>(
    () => ({ fields, operators, valueModes: modes }),
    [fields, operators, modes]
  );
  const editor = React.useMemo<RulesEditorContextValue>(
    () => ({
      outcomes,
      vocabulary,
      variables,
      renderValue,
      maxDepth,
      showMatchMode,
      allowExpressions,
      dialect,
      renderExpressionEditor,
      forceErrors,
      defaultTouched,
      disabled,
      strings: text,
      conditionsStrings: ruleConditionsStrings,
      valueModeStrings,
      multiSelectStrings,
      updateRule,
    }),
    [
      outcomes,
      vocabulary,
      variables,
      renderValue,
      maxDepth,
      showMatchMode,
      allowExpressions,
      dialect,
      renderExpressionEditor,
      forceErrors,
      defaultTouched,
      disabled,
      text,
      ruleConditionsStrings,
      valueModeStrings,
      multiSelectStrings,
      updateRule,
    ]
  );

  return (
    <RulesEditorContext.Provider value={editor}>
      <fieldset
        aria-label={label}
        className={cn('m-0 flex min-w-0 flex-col gap-2 border-0 p-0', className)}
      >
        <div ref={focus.listRef} className="flex flex-col gap-2">
          {value.length === 0 ? (
            <EmptyRows>{text.empty}</EmptyRows>
          ) : (
            value.map((rule, position) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                index={position + 1}
                position={position}
                onDelete={deleteRule}
              />
            ))
          )}
        </div>
        <div>
          <AddRowButton
            ref={focus.addRef}
            disabled={disabled}
            onClick={() => {
              focus.afterAdd();
              onChange([
                ...value,
                createRule({ outcome: defaultOutcome ?? outcomes[0]?.value ?? '' }),
              ]);
            }}
          >
            {text.addRule}
          </AddRowButton>
        </div>
      </fieldset>
    </RulesEditorContext.Provider>
  );
}
