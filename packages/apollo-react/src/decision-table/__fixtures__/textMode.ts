import type { DecisionGraphBody, DecisionGraphTextProps } from '../DecisionGraphText';
import type { DecisionTextMode, DecisionTextProps } from '../DecisionText';
import type { DecisionTextTable } from '../sentenceTypes';
import {
  COLUMN_TYPES,
  type FixtureOperator,
  type FixturePolicy,
  type FixtureRefusal,
  type FixtureTotal,
  type FixtureType,
  HIT_POLICIES,
  wordRefusal,
} from './sentences.fixtures';

/** The view's props in the fixtures' operators, hit policies, column types and refusals. */
export type FixtureTextProps = Omit<
  DecisionTextProps<FixtureOperator, FixturePolicy, FixtureTotal, FixtureType, FixtureRefusal>,
  'name'
>;

/** A graph body in the fixtures' operators, hit policies, column types and refusals. */
export type FixtureGraphBody = DecisionGraphBody<
  FixtureOperator,
  FixturePolicy,
  FixtureTotal,
  FixtureType,
  FixtureRefusal
>;

/** The graph's props with bodies in the fixtures' vocabulary and no decision refusals or logic. */
export type FixtureGraphProps = DecisionGraphTextProps<
  never,
  never,
  FixtureOperator,
  FixturePolicy,
  FixtureTotal,
  FixtureType,
  FixtureRefusal
>;

/** The view's mode in the fixtures' operators, hit policies, column types and refusals. */
export type FixtureMode = DecisionTextMode<
  FixtureOperator,
  FixturePolicy,
  FixtureTotal,
  FixtureType,
  FixtureRefusal
>;

/** The view's edit in the fixtures' operators, column types and refusals. */
export type FixtureEdit = Extract<FixtureMode, { kind: 'edit' }>['edit'];

type EditMode = Extract<FixtureMode, { kind: 'edit' }>;

/** A field the popover edits as an outcome. */
export const outcomeField = (): ReturnType<FixtureEdit['valueField']> => ({
  kind: 'outcome',
  allowedValues: [],
});

/** A test host's mode as separate props: a diff reads what changed, an edit, Add rule, policy change, undo or redo edits, an onSelect selects, else the view reads. */
export type ModeProps = Partial<
  Pick<
    EditMode,
    'selected' | 'onSelect' | 'edit' | 'onAddRule' | 'onPolicyChange' | 'onUndo' | 'onRedo'
  > &
    Pick<Extract<FixtureMode, { kind: 'diff' }>, 'diff'>
>;

/** The view's props with its mode and table given as separate props, in the fixtures' vocabulary unless it names another. */
export type FlatTextProps = Omit<
  FixtureTextProps,
  'mode' | 'table' | 'hitPolicies' | 'columnTypes'
> &
  ModeProps &
  DecisionTextTable<FixturePolicy, FixtureTotal, FixtureType> &
  Partial<Pick<FixtureTextProps, 'hitPolicies' | 'columnTypes'>>;

const noop = () => {};

/** The mode the separate props name. */
export const modeOf = ({
  selected = null,
  onSelect,
  edit,
  onAddRule,
  onPolicyChange,
  onUndo,
  onRedo,
  diff,
}: ModeProps): FixtureMode => {
  if (diff) return { kind: 'diff', diff };
  if (edit || onAddRule || onPolicyChange || onUndo || onRedo) {
    return {
      kind: 'edit',
      selected,
      onSelect: onSelect ?? noop,
      edit: edit ?? {
        onCommit: noop,
        onClearCell: noop,
        onDeleteRule: noop,
        valueField: outcomeField,
        wordRefusal,
      },
      onPolicyChange: onPolicyChange ?? noop,
      onAddRule: onAddRule ?? noop,
      onUndo: onUndo ?? noop,
      onRedo: onRedo ?? noop,
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
  onUndo,
  onRedo,
  diff,
  hitPolicy,
  inputs,
  outputs,
  rules,
  hitPolicies = HIT_POLICIES,
  columnTypes = COLUMN_TYPES,
  ...props
}: FlatTextProps): FixtureTextProps => ({
  ...props,
  table: { hitPolicy, inputs, outputs, rules },
  hitPolicies,
  columnTypes,
  mode: modeOf({ selected, onSelect, edit, onAddRule, onPolicyChange, onUndo, onRedo, diff }),
});
