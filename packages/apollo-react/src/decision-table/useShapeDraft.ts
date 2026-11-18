import { useState } from 'react';
import type { AllowedValueListProps } from './AllowedValueList';
import type { PopoverSelectOption } from './PopoverSelect';
import type { RangeFieldsProps } from './RangeFields';
import type { ValueChecklistProps } from './ValueChecklist';
import type { HeldValues, RangeEnds, ValueCommit, ValueFieldData, ValueShape } from './valueTypes';

/** An operator the select offers by its place among the host's, worded, with how many values it takes. */
export interface OperatorChoice extends PopoverSelectOption {
  place: number;
  shape: ValueShape;
}

const NO_OPERATORS: readonly OperatorChoice[] = [];

const BOTH_INCLUDED: RangeEnds = { lowInclusive: true, highInclusive: true };

const filled = (values: readonly string[]): string[] => [
  ...new Set(values.filter((value) => value.trim() !== '')),
];

/** The host's operators as the select offers them. */
export const operatorsOf = (field: ValueFieldData<number>): readonly OperatorChoice[] =>
  field.kind === 'condition'
    ? field.operators.map(({ operator, label, shape }) => ({
        id: String(operator),
        place: operator,
        label,
        shape,
      }))
    : NO_OPERATORS;

const heldValuesOf = (held: HeldValues<number>): readonly string[] => {
  switch (held.shape) {
    case 'single':
      return [held.value];
    case 'range':
      return [held.low, held.high];
    case 'list':
      return held.values;
    case 'valueless':
      return [];
  }
};

/** The messages that say why Apply is off. */
export interface DraftProblemLabels {
  /** A condition being added that has no value yet, e.g. "Enter a value". */
  missingValue: string;
  /** A range with an empty end, e.g. "Enter both ends". */
  missingEnd: string;
  /** A list with no value checked, e.g. "Check a value". */
  noValueChecked: string;
}

/** Why the draft cannot be applied yet. */
export type DraftProblem = keyof DraftProblemLabels;

/** `hidesHeld` when the cell holds a value that allowed values show in place of, which a blank pick would hide. */
const problemOf = (
  commit: ValueCommit<number>,
  adds: boolean,
  hidesHeld: boolean
): DraftProblem | null => {
  switch (commit.kind) {
    case 'range':
      return commit.low.trim() === '' || commit.high.trim() === '' ? 'missingEnd' : null;
    case 'list':
      return commit.values.length > 0 ? null : 'noValueChecked';
    case 'valueless':
      return null;
    case 'expression':
      return (adds || hidesHeld) && commit.text.trim() === '' ? 'missingValue' : null;
    default:
      return (adds || hidesHeld) && commit.value.trim() === '' ? 'missingValue' : null;
  }
};

/** The popover's draft: its operator, the values, range ends and listed values it takes, and what it commits. */
export interface ShapeDraft {
  /** A condition's operators and the picked one; null for an outcome or an expression. */
  picker: { operators: readonly OperatorChoice[]; operator: number } | null;
  shape: ValueShape;
  values: readonly string[];
  text: string;
  high: string;
  ends: RangeEnds;
  allowedValues: readonly string[];
  listed: readonly string[];
  checked: readonly string[];
  /** The values of a list the condition held when it opened, else none. */
  heldList: readonly string[];
  /** The value the host holds at a sentence index: a condition's by index, else the whole cell's. */
  heldValueAt: (index: number) => string | undefined;
  /** The text in a list's add field, which a commit adds to the list. */
  adding: string;
  current: ValueCommit<number>;
  /** The commit of one value picked in place of the text. */
  commitOf: (text: string) => ValueCommit<number>;
  /** Why Apply is off, or null while the draft can be applied. */
  problem: DraftProblem | null;
  setText: AllowedValueListProps['onChoose'];
  setRange: RangeFieldsProps['onChange'];
  toggle: ValueChecklistProps['onToggle'];
  add: NonNullable<ValueChecklistProps['onAdd']>;
  setAdding: ValueChecklistProps['onAddingChange'];
  changeOperator: (place: number) => void;
}

/** `adds` when the condition is one the rule does not have yet, which needs a value to apply. */
export const useShapeDraft = (
  field: ValueFieldData<number>,
  value: string,
  adds: boolean
): ShapeDraft => {
  const opened =
    field.kind === 'condition'
      ? heldValuesOf(field.held)
      : [field.kind === 'expression' ? field.expression : value];
  const [values, setValues] = useState<readonly string[]>(opened);
  const [ends, setEnds] = useState(
    field.kind === 'condition' && field.held.shape === 'range' ? field.held.ends : BOTH_INCLUDED
  );
  const [held] = useState(() => filled(opened));
  const [entries, setEntries] = useState(held);
  const [adding, setAdding] = useState('');
  const [operator, setOperator] = useState(() =>
    field.kind === 'condition' ? field.held.operator : undefined
  );
  const operators = operatorsOf(field);
  const allowedValues = filled(field.allowedValues);
  const shapeOf = (place: number | undefined): ValueShape =>
    operators.find((option) => option.place === place)?.shape ?? 'single';
  const shape = shapeOf(operator);
  const [text = '', high = ''] = values;
  const listed = filled([...allowedValues, ...entries]);
  const offered = new Set(listed);
  const checked = filled(values).filter((candidate) => offered.has(candidate));
  const withChecked = (option: string): string[] => {
    const next = filled([...checked, option]);
    const rank = (candidate: string) => {
      const index = held.indexOf(candidate);
      return index < 0 ? held.length + next.indexOf(candidate) : index;
    };
    return next.sort((left, right) => rank(left) - rank(right));
  };
  const typed = adding.trim();
  const commitOf = (single: string): ValueCommit<number> => {
    if (field.kind === 'outcome') return { kind: 'outcome', value: single };
    if (field.kind === 'expression' || operator === undefined)
      return { kind: 'expression', text: single };
    switch (shape) {
      case 'range':
        return { kind: 'range', operator, low: single, high, ends };
      case 'list':
        return { kind: 'list', operator, values: typed ? withChecked(typed) : checked };
      case 'valueless':
        return { kind: 'valueless', operator };
      default:
        return { kind: 'single', operator, value: single };
    }
  };
  const current = commitOf(text);

  return {
    picker: operator === undefined ? null : { operators, operator },
    shape,
    values,
    text,
    high,
    ends,
    allowedValues,
    listed,
    checked,
    heldList: field.kind === 'condition' && field.held.shape === 'list' ? field.held.values : [],
    heldValueAt: (index: number) => (field.kind === 'condition' ? opened[index] : opened[0]),
    adding,
    current,
    commitOf,
    problem: problemOf(current, adds, held.length > 0 && allowedValues.length > 0),
    setText: (next: string) => setValues([next, ...values.slice(1)]),
    setRange: (low: string, nextHigh: string, nextEnds: RangeEnds) => {
      setValues([low, nextHigh, ...values.slice(2)]);
      setEnds(nextEnds);
    },
    toggle: (option: string, on: boolean) =>
      setValues(on ? withChecked(option) : checked.filter((candidate) => candidate !== option)),
    add: (option: string) => {
      setEntries(filled([...entries, option]));
      setValues(withChecked(option));
      setAdding('');
    },
    setAdding,
    changeOperator: (place: number) => {
      if (shapeOf(place) === 'list') setEntries(filled([...entries, ...values]));
      setOperator(place);
    },
  };
};
