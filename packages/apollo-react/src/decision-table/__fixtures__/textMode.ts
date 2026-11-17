import type { DecisionTextMode, DecisionTextProps } from '../DecisionText';
import type { DecisionTextTable } from '../sentenceTypes';
import { type FixturePolicy, type FixtureTotal, HIT_POLICIES } from './sentences.fixtures';

/** The view's props in the fixtures' hit policies. */
export type FixtureTextProps = DecisionTextProps<FixturePolicy, FixtureTotal>;

/** The view's mode in the fixtures' hit policies. */
export type FixtureMode = DecisionTextMode<FixturePolicy, FixtureTotal>;

type EditMode = Extract<FixtureMode, { kind: 'edit' }>;

/** A test host's mode as separate props: a diff reads what changed, an edit, Add rule or policy change edits, an onSelect selects, else the view reads. */
export type ModeProps = Partial<
  Pick<EditMode, 'selected' | 'onSelect' | 'edit' | 'onAddRule' | 'onPolicyChange'> &
    Pick<Extract<FixtureMode, { kind: 'diff' }>, 'diff'>
>;

/** The view's props with its mode and table given as separate props, in the fixtures' hit policies unless it names others. */
export type FlatTextProps = Omit<FixtureTextProps, 'mode' | 'table' | 'hitPolicies'> &
  ModeProps &
  DecisionTextTable<FixturePolicy, FixtureTotal> &
  Partial<Pick<FixtureTextProps, 'hitPolicies'>>;

const noop = () => {};

/** The mode the separate props name. */
export const modeOf = ({
  selected = null,
  onSelect,
  edit,
  onAddRule,
  onPolicyChange,
  diff,
}: ModeProps): FixtureMode => {
  if (diff) return { kind: 'diff', diff };
  if (edit || onAddRule || onPolicyChange) {
    return {
      kind: 'edit',
      selected,
      onSelect: onSelect ?? noop,
      edit: edit ?? { onCommit: noop, onClearCell: noop, onDeleteRule: noop },
      onPolicyChange: onPolicyChange ?? noop,
      onAddRule: onAddRule ?? noop,
    };
  }
  return onSelect ? { kind: 'select', selected, onSelect } : { kind: 'read', selected };
};

/** The view's props with the table and mode the separate props name. */
export const textPropsOf = ({
  selected,
  onSelect,
  edit,
  onAddRule,
  onPolicyChange,
  diff,
  hitPolicy,
  inputs,
  outputs,
  rules,
  hitPolicies = HIT_POLICIES,
  ...props
}: FlatTextProps): FixtureTextProps => ({
  ...props,
  table: { hitPolicy, inputs, outputs, rules },
  hitPolicies,
  mode: modeOf({ selected, onSelect, edit, onAddRule, onPolicyChange, diff }),
});
