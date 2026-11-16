import { useMemo } from 'react';
import { useSafeLingui } from '../i18n/useSafeLingui';
import type { DecisionTextEditLabels, DecisionTextLabels } from './decisionTextTypes';
import type { GlyphTone } from './sentenceMarks';

/** The defaults with each string the host gives in its place; a string left undefined keeps its default. */
export const withLabelOverrides = <Labels extends object>(
  defaults: Labels,
  overrides: Partial<Labels> | undefined
): Labels =>
  overrides
    ? {
        ...defaults,
        ...Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined)),
      }
    : defaults;

/** The view's own strings in the active locale, with the host's in place of any it gives. */
export const useDecisionTextLabels = (
  overrides: Partial<DecisionTextLabels> | undefined
): DecisionTextLabels => {
  const { _ } = useSafeLingui();
  const defaults = useMemo((): DecisionTextLabels => {
    const tones = {
      error: _({ id: 'decision-text.mark_error', message: 'Error' }),
      warning: _({ id: 'decision-text.mark_warning', message: 'Warning' }),
    } satisfies Record<GlyphTone, string>;
    const matched = _({ id: 'decision-text.condition_matched', message: 'Matched' });
    const notMatched = _({ id: 'decision-text.condition_not_matched', message: 'Not matched' });
    return {
      emptyRules: _({ id: 'decision-text.empty_rules', message: 'No rules yet' }),
      inputs: _({ id: 'decision-text.band_inputs', message: 'Inputs' }),
      outputs: _({ id: 'decision-text.band_outputs', message: 'Outputs' }),
      markStatus: (tone, message) =>
        message
          ? _({
              id: 'decision-text.mark_status',
              message: '{status}: {message}',
              values: { status: tones[tone], message },
            })
          : tones[tone],
      moreValues: (count) =>
        _({
          id: 'decision-text.more_values',
          message: '{count, plural, other {+# more}}',
          values: { count },
        }),
      conditionVerdict: (isMatched) => (isMatched ? matched : notMatched),
      cell: (column, values, position) =>
        _({
          id: 'decision-text.cell',
          message: '{cell}, rule {position}',
          values: { cell: [column, values].filter(Boolean).join(' '), position },
        }),
      emptyValue: _({ id: 'decision-text.empty_value', message: 'empty' }),
      openDecision: (input) =>
        _({
          id: 'decision-text.open_decision',
          message: 'Open the {input} decision',
          values: { input },
        }),
    };
  }, [_]);
  return useMemo(() => withLabelOverrides(defaults, overrides), [defaults, overrides]);
};

/** The editing strings in the active locale, with the host's in place of any it gives. */
export const useDecisionTextEditLabels = (
  overrides: Partial<DecisionTextEditLabels> | undefined
): DecisionTextEditLabels => {
  const { _ } = useSafeLingui();
  const defaults = useMemo(
    (): DecisionTextEditLabels => ({
      addCondition: (position) =>
        _({
          id: 'decision-text.add_condition',
          message: 'Add condition to rule {position}',
          values: { position },
        }),
      removeCondition: (column, position) =>
        _({
          id: 'decision-text.remove_condition',
          message: 'Remove {column} from rule {position}',
          values: { column, position },
        }),
      clearOutcome: (column, position) =>
        _({
          id: 'decision-text.clear_outcome',
          message: 'Clear {column} in rule {position}',
          values: { column, position },
        }),
      ruleActions: (position) =>
        _({
          id: 'decision-text.rule_actions',
          message: 'Rule {position} actions',
          values: { position },
        }),
      deleteRule: (position) =>
        _({
          id: 'decision-text.delete_rule',
          message: 'Delete rule {position}',
          values: { position },
        }),
      insertRuleAbove: _({ id: 'decision-text.insert_rule_above', message: 'Insert rule above' }),
      insertRuleBelow: _({ id: 'decision-text.insert_rule_below', message: 'Insert rule below' }),
      duplicateRule: _({ id: 'decision-text.duplicate_rule', message: 'Duplicate rule' }),
      clearRule: _({ id: 'decision-text.clear_rule', message: 'Clear rule' }),
      moveRuleUp: _({ id: 'decision-text.move_rule_up', message: 'Move up' }),
      moveRuleDown: _({ id: 'decision-text.move_rule_down', message: 'Move down' }),
      addInput: _({ id: 'decision-text.add_input', message: 'New input' }),
      newCondition: (column, position) =>
        _({
          id: 'decision-text.new_condition',
          message: 'New {column} condition, rule {position}',
          values: { column, position },
        }),
      setValue: _({ id: 'decision-text.set_value', message: 'Set a value' }),
      operator: _({ id: 'decision-text.operator', message: 'Operator' }),
      notAllowed: _({ id: 'decision-text.not_allowed', message: 'Not one of the allowed values' }),
      editExpression: _({ id: 'decision-text.edit_expression', message: 'Edit expression' }),
      clear: _({ id: 'decision-text.clear', message: 'Clear' }),
      rangeLow: _({ id: 'decision-text.range_low', message: 'From' }),
      rangeHigh: _({ id: 'decision-text.range_high', message: 'To' }),
      included: _({ id: 'decision-text.included', message: 'Included' }),
      addValue: _({ id: 'decision-text.add_value', message: 'Add value' }),
      missingValue: _({ id: 'decision-text.missing_value', message: 'Enter a value' }),
      missingEnd: _({ id: 'decision-text.missing_end', message: 'Enter both ends' }),
      endsOutOfOrder: _({
        id: 'decision-text.ends_out_of_order',
        message: 'From must not be past To',
      }),
      noValueChecked: _({ id: 'decision-text.no_value_checked', message: 'Check a value' }),
      cancel: _({ id: 'decision-text.cancel', message: 'Cancel' }),
      apply: _({ id: 'decision-text.apply', message: 'Apply' }),
      inputColumn: (name) =>
        _({ id: 'decision-text.input_column', message: 'Input · {name}', values: { name } }),
      outputColumn: (name) =>
        _({ id: 'decision-text.output_column', message: 'Output · {name}', values: { name } }),
      columnLabel: _({ id: 'decision-text.column_label', message: 'Label' }),
      missingLabel: _({ id: 'decision-text.missing_label', message: 'Enter a label' }),
      inputExpression: _({ id: 'decision-text.input_expression', message: 'Input expression' }),
      outputName: _({ id: 'decision-text.output_name', message: 'Output name' }),
      missingInputExpression: _({
        id: 'decision-text.missing_input_expression',
        message: 'This input has no expression',
      }),
      missingOutputName: _({
        id: 'decision-text.missing_output_name',
        message: 'This output has no name',
      }),
      dataType: _({ id: 'decision-text.data_type', message: 'Data type' }),
      allowedValues: _({ id: 'decision-text.allowed_values', message: 'Allowed values' }),
      allowedValuesHint: _({
        id: 'decision-text.allowed_values_hint',
        message: 'Separate values with commas.',
      }),
      moreProperties: _({ id: 'decision-text.more_properties', message: 'More properties' }),
    }),
    [_]
  );
  return useMemo(() => withLabelOverrides(defaults, overrides), [defaults, overrides]);
};
