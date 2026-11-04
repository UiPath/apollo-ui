import type { ConditionValueMode } from './model';

/** Picks the operators and the Fixed value control. `enum` needs `options`. */
export type ConditionFieldType = 'string' | 'number' | 'date' | 'enum';

export interface ConditionFieldOption {
  value: string;
  label: string;
}

/** What a value is compared in, for an operator's `valueError`. */
export interface ConditionValueContext {
  field: ConditionField;
  mode: ConditionValueMode;
}

/** A field a condition can compare. */
export interface ConditionField {
  value: string;
  label: string;
  type: ConditionFieldType;
  options?: readonly ConditionFieldOption[];
}

export interface ConditionOperator {
  value: string;
  label: string;
  /** False for operators like "Is empty", which hide the value. */
  hasValue?: boolean;
  /** Takes several options in Fixed value, e.g. "Is one of". For `enum` fields. */
  multiple?: boolean;
  /**
   * The value modes it can compare against. A mode left out stays in the mode menu, disabled, and
   * picking this operator while the row is in it resets the row to the first mode allowed.
   * Omitted, it allows every mode the editor offers.
   */
  valueModes?: readonly ConditionValueMode[];
  /**
   * The message for a value it cannot use, such as a pattern that does not compile, or `undefined`
   * for one it can, given the row's field and value mode too. A row it flags is incomplete.
   * English, as `label` is.
   */
  valueError?: (value: string, row: ConditionValueContext) => string | undefined;
}

function patternError(pattern: string) {
  try {
    new RegExp(pattern);
    return undefined;
  } catch {
    return 'Enter a valid pattern.';
  }
}

/** The operators each field type offers, in menu order. */
export type ConditionOperators = Record<ConditionFieldType, readonly ConditionOperator[]>;

/**
 * English operators. The ids are shared across types, so `lessThan` reads "Before" on a date, which
 * keeps whatever turns them into rules to one case per id. Map the labels to translate them.
 */
export const DEFAULT_CONDITION_OPERATORS: ConditionOperators = {
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'matches', label: 'Matches pattern', valueError: patternError },
    { value: 'isEmpty', label: 'Is empty', hasValue: false },
    { value: 'isNotEmpty', label: 'Is not empty', hasValue: false },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'isEmpty', label: 'Is empty', hasValue: false },
    { value: 'isNotEmpty', label: 'Is not empty', hasValue: false },
  ],
  date: [
    { value: 'equals', label: 'On' },
    { value: 'lessThan', label: 'Before' },
    { value: 'greaterThan', label: 'After' },
    { value: 'isEmpty', label: 'Is empty', hasValue: false },
    { value: 'isNotEmpty', label: 'Is not empty', hasValue: false },
  ],
  enum: [
    { value: 'equals', label: 'Is' },
    { value: 'notEquals', label: 'Is not' },
    { value: 'isOneOf', label: 'Is one of', multiple: true },
    { value: 'isNotOneOf', label: 'Is not one of', multiple: true },
  ],
};
