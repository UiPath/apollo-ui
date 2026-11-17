import { useMemo } from 'react';
import { useSafeLingui } from '../i18n/useSafeLingui';
import type { DiffChange } from './decisionTextDiff';
import type { DecisionTextEditLabels, DecisionTextLabels } from './decisionTextTypes';
import type { GlyphTone } from './sentenceMarks';

/** The view's own strings in the active locale. */
export const useDecisionTextLabels = (): DecisionTextLabels => {
  const { _ } = useSafeLingui();
  return useMemo((): DecisionTextLabels => {
    const tones = {
      error: _({ id: 'decision-text.mark_error', message: 'Error' }),
      warning: _({ id: 'decision-text.mark_warning', message: 'Warning' }),
    } satisfies Record<GlyphTone, string>;
    const matched = _({ id: 'decision-text.condition_matched', message: 'Matched' });
    const notMatched = _({ id: 'decision-text.condition_not_matched', message: 'Not matched' });
    const changes = {
      add: _({ id: 'decision-text.change_add', message: 'Added' }),
      update: _({ id: 'decision-text.change_update', message: 'Changed' }),
      delete: _({ id: 'decision-text.change_delete', message: 'Removed' }),
    } satisfies Record<DiffChange, string>;
    return {
      emptyRules: _({ id: 'decision-text.empty_rules', message: 'No rules yet' }),
      addRule: _({ id: 'decision-text.add_rule', message: 'Add rule' }),
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
          message: "Open {input}'s decision",
          values: { input },
        }),
      changeStatus: (change) => changes[change],
      movedFrom: (number) =>
        _({
          id: 'decision-text.moved_from',
          message: 'Moved from rule {number}',
          values: { number },
        }),
      previousValue: _({ id: 'decision-text.previous_value', message: 'was' }),
      currentValue: _({ id: 'decision-text.current_value', message: 'now' }),
      unchangedRules: (count) =>
        _({
          id: 'decision-text.unchanged_rules',
          message: '{count, plural, one {# unchanged rule} other {# unchanged rules}}',
          values: { count },
        }),
      showRules: (from, to) =>
        _({
          id: 'decision-text.show_rules',
          message: 'Show rules {from}–{to}',
          values: { from, to },
        }),
    };
  }, [_]);
};

/** The editing strings in the active locale. */
export const useDecisionTextEditLabels = (): DecisionTextEditLabels => {
  const { _ } = useSafeLingui();
  return useMemo(
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
      addInput: _({ id: 'decision-text.add_input', message: 'Add input column' }),
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
        message: 'This input column has no expression',
      }),
      missingOutputName: _({
        id: 'decision-text.missing_output_name',
        message:
          'This output column has no name — every output in a multi-output table must be named',
      }),
      dataType: _({ id: 'decision-text.data_type', message: 'Data type' }),
      allowedValues: _({ id: 'decision-text.allowed_values', message: 'Allowed values' }),
      allowedValuesHint: _({
        id: 'decision-text.allowed_values_hint',
        message: 'Separate values with commas, and write each one as the example shows.',
      }),
      moreProperties: _({ id: 'decision-text.more_properties', message: 'More properties' }),
    }),
    [_]
  );
};
