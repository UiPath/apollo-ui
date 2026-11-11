import { useState } from 'react';
import type { RangeEnds, ValueCommit, ValueField, ValueOperatorOption } from './ValuePopover';

type Shape = NonNullable<ValueOperatorOption['shape']>;

const NO_OPERATORS: readonly ValueOperatorOption[] = [];

const NO_VALUES: readonly string[] = [];

const BOTH_INCLUDED: RangeEnds = { lowInclusive: true, highInclusive: true };

const filled = (values: readonly string[]): string[] => [
  ...new Set(values.filter((value) => value.trim() !== '')),
];

const isComplete = (shape: Shape, { values }: ValueCommit, field: ValueField): boolean => {
  const [low = '', high = ''] = values;
  if (shape === 'range') {
    return low.trim() !== '' && high.trim() !== '' && (field.inOrder?.(low, high) ?? true);
  }
  return shape !== 'list' || values.length > 0;
};

/** The popover's draft: its operator, the values, range ends and listed values it takes, and what it commits. */
export interface ShapeDraft {
  operators: readonly ValueOperatorOption[];
  operator: string | undefined;
  /** The operator a commit carries: undefined without operators or in the expression editor. */
  picked: string | undefined;
  shape: Shape;
  values: readonly string[];
  text: string;
  high: string;
  ends: RangeEnds;
  allowedValues: readonly string[];
  listed: readonly string[];
  checked: readonly string[];
  current: ValueCommit;
  complete: boolean;
  setText: (text: string) => void;
  setRange: (low: string, high: string, ends: RangeEnds) => void;
  toggle: (option: string, on: boolean) => void;
  add: (option: string) => void;
  changeOperator: (id: string) => void;
}

export const useShapeDraft = (
  field: ValueField,
  value: string,
  expression: boolean
): ShapeDraft => {
  const [values, setValues] = useState<readonly string[]>(field.values ?? [value]);
  const [ends, setEnds] = useState(field.ends ?? BOTH_INCLUDED);
  const [entries, setEntries] = useState(() => filled(field.values ?? [value]));
  const [operator, setOperator] = useState(field.operator);
  const operators = field.operators ?? NO_OPERATORS;
  const allowedValues = field.allowedValues ?? NO_VALUES;
  const picked = expression || operators.length === 0 ? undefined : operator;
  const shapeOf = (id: string | undefined): Shape =>
    operators.find((option) => option.id === id)?.shape ?? 'single';
  const shape = shapeOf(picked);
  const [text = '', high = ''] = values;
  const listed = filled([...allowedValues, ...entries]);
  const checked = listed.filter((option) => values.includes(option));
  const byShape: Record<Shape, ValueCommit> = {
    single: { values: [text], operator: picked },
    range: { values: [text, high], operator: picked, ends },
    list: { values: checked, operator: picked },
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
    current,
    complete: isComplete(shape, current, field),
    setText: (next: string) => setValues([next, ...values.slice(1)]),
    setRange: (low: string, nextHigh: string, nextEnds: RangeEnds) => {
      setValues([low, nextHigh, ...values.slice(2)]);
      setEnds(nextEnds);
    },
    toggle: (option: string, on: boolean) =>
      setValues(
        listed.filter((candidate) => (candidate === option ? on : values.includes(candidate)))
      ),
    add: (option: string) => {
      setEntries(filled([...entries, option]));
      setValues(filled([...checked, option]));
    },
    changeOperator: (id: string) => {
      if (shapeOf(id) === 'list') setEntries(filled([...entries, ...values]));
      setOperator(id);
    },
  };
};
