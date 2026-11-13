import { useState } from 'react';
import type { AllowedValueListProps } from './AllowedValueList';
import type { RangeFieldsProps } from './RangeFields';
import type { ValueChecklistProps } from './ValueChecklist';
import type {
  RangeEnds,
  ValueCommit,
  ValueField,
  ValueOperatorOption,
  ValueShape,
} from './valueTypes';

const NO_OPERATORS: readonly ValueOperatorOption[] = [];

const NO_VALUES: readonly string[] = [];

const BOTH_INCLUDED: RangeEnds = { lowInclusive: true, highInclusive: true };

const filled = (values: readonly string[]): string[] => [
  ...new Set(values.filter((value) => value.trim() !== '')),
];

/** The host's operators, after the condition's own when they lack it, so it shows and stays offered with the shape its values have. */
export const operatorsOf = ({
  operators = NO_OPERATORS,
  operator,
  values,
  ends,
}: ValueField): readonly ValueOperatorOption[] => {
  const usable = operators.filter(({ id }) => id !== '');
  return !operator || usable.length === 0 || usable.some(({ id }) => id === operator)
    ? usable
    : [
        { id: operator, label: operator, shape: ends ? 'range' : values ? 'list' : 'single' },
        ...usable,
      ];
};

/** The operator a condition starts on: its own, else the first of `operators`. */
export const operatorOf = (field: ValueField): string | undefined =>
  field.operator || operatorsOf(field)[0]?.id;

/** The messages that say why Apply is off. */
export interface DraftProblemLabels {
  /** A condition being added that has no value yet, e.g. "Enter a value". */
  missingValue: string;
  /** A range with an empty end, e.g. "Enter both ends". */
  missingEnd: string;
  /** A range whose low end is past its high end, e.g. "From must not be past To". */
  endsOutOfOrder: string;
  /** A list with no value checked, e.g. "Check a value". */
  noValueChecked: string;
}

/** Why the draft cannot be applied yet. */
export type DraftProblem = keyof DraftProblemLabels;

type ValuesCommit = Extract<ValueCommit, { kind: 'values' }>;

const problemOf = (
  shape: ValueShape,
  { values }: ValuesCommit,
  field: ValueField,
  adds: boolean
): DraftProblem | null => {
  const [low = '', high = ''] = values;
  if (shape === 'range') {
    if (low.trim() === '' || high.trim() === '') return 'missingEnd';
    return (field.inOrder?.(low, high) ?? true) ? null : 'endsOutOfOrder';
  }
  if (shape === 'list') return values.length > 0 ? null : 'noValueChecked';
  return adds && low.trim() === '' ? 'missingValue' : null;
};

/** The popover's draft: its operator, the values, range ends and listed values it takes, and what it commits. */
export interface ShapeDraft {
  operators: readonly ValueOperatorOption[];
  operator: string | undefined;
  /** The operator a commit carries: undefined without operators. */
  picked: string | undefined;
  shape: ValueShape;
  values: readonly string[];
  text: string;
  high: string;
  ends: RangeEnds;
  allowedValues: readonly string[];
  listed: readonly string[];
  checked: readonly string[];
  /** The text in a list's add field, which a commit adds to the list. */
  adding: string;
  current: ValuesCommit;
  /** Why Apply is off, or null while the draft can be applied. */
  problem: DraftProblem | null;
  setText: AllowedValueListProps['onChoose'];
  setRange: RangeFieldsProps['onChange'];
  toggle: ValueChecklistProps['onToggle'];
  add: NonNullable<ValueChecklistProps['onAdd']>;
  setAdding: ValueChecklistProps['onAddingChange'];
  changeOperator: (id: string) => void;
}

/** `adds` when the condition is one the rule does not have yet, which needs a value to apply. */
export const useShapeDraft = (field: ValueField, value: string, adds: boolean): ShapeDraft => {
  const [values, setValues] = useState<readonly string[]>(field.values ?? [value]);
  const [ends, setEnds] = useState(field.ends ?? BOTH_INCLUDED);
  const [held] = useState(() => filled(field.values ?? [value]));
  const [entries, setEntries] = useState(held);
  const [adding, setAdding] = useState('');
  const [operator, setOperator] = useState(() => operatorOf(field));
  const operators = operatorsOf(field);
  const allowedValues = field.allowedValues ?? NO_VALUES;
  const picked = operators.length === 0 ? undefined : operator;
  const shapeOf = (id: string | undefined): ValueShape =>
    operators.find((option) => option.id === id)?.shape ?? 'single';
  const shape = shapeOf(picked);
  const [text = '', high = ''] = values;
  const listed = filled([...allowedValues, ...entries]);
  const offered = new Set(listed);
  const checked = filled(values).filter((value) => offered.has(value));
  const withChecked = (option: string): string[] => {
    const next = filled([...checked, option]);
    const rank = (candidate: string) => {
      const index = held.indexOf(candidate);
      return index < 0 ? held.length + next.indexOf(candidate) : index;
    };
    return next.sort((left, right) => rank(left) - rank(right));
  };
  const typed = adding.trim();
  const byShape: Record<ValueShape, ValuesCommit> = {
    single: { kind: 'values', values: [text], operator: picked },
    range: { kind: 'values', values: [text, high], operator: picked, ends },
    list: { kind: 'values', values: typed ? withChecked(typed) : checked, operator: picked },
  };
  const current = byShape[shape];

  return {
    operators,
    operator,
    picked,
    shape,
    values,
    text,
    high,
    ends,
    allowedValues,
    listed,
    checked,
    adding,
    current,
    problem: problemOf(shape, current, field, adds),
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
    changeOperator: (id: string) => {
      if (shapeOf(id) === 'list') setEntries(filled([...entries, ...values]));
      setOperator(id);
    },
  };
};
