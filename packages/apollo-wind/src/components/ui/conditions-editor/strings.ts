import { format } from 'date-fns';

export interface ConditionsEditorStrings {
  /** Column labels in one-line rows, and each control's own label in stacked rows. */
  fieldLabel: string;
  operatorLabel: string;
  valueLabel: string;
  fieldPlaceholder: string;
  operatorPlaceholder: string;
  valuePlaceholder: string;
  /** An example of a valid expression, never the field's name. Empty shows none. */
  expressionPlaceholder: string;
  optionPlaceholder: string;
  optionsPlaceholder: string;
  datePlaceholder: string;
  /** The group mode switch's options. */
  matchAll: string;
  matchAny: string;
  addCondition: string;
  addGroup: string;
  /** Says what happens with no conditions, e.g. "No conditions. The rule always applies." */
  empty: string;
  emptyGroup: string;
  /** The row half of every control's name, e.g. "Condition 2" + "Field". */
  conditionName: (position: number) => string;
  removeCondition: (position: number) => string;
  groupName: (position: number) => string;
  groupActions: (group: string) => string;
  groupMatchMode: (group: string) => string;
  /** Names a value's mode menu, e.g. "Condition 2 Value mode: Expression". */
  valueModeMenu: (condition: string, mode: string) => string;
  /** A disabled mode's description in the mode menu. */
  valueModeUnavailable: (operator: string) => string;
  deleteGroup: string;
  deleteGroupTitle: string;
  deleteGroupDescription: (conditions: number) => string;
  cancel: string;
  errorFieldAndValue: string;
  errorField: string;
  errorOperator: string;
  errorNumber: string;
  errorDate: string;
  errorOptions: string;
  errorValue: string;
  /** Below the group while any row shows a message, or a nested group is empty. */
  incomplete: string;
  /** A collapsible editor's header. */
  count: (conditions: number) => string;
  /** Leads the plain-language reading below the rows. */
  summaryLabel: string;
  /** One condition in the reading. `value` is omitted for operators that take none. */
  summaryCondition: (field: string, operator: string, value?: string) => string;
  /** Several chosen options in the reading. */
  summaryList: (values: string[]) => string;
  summaryAnd: string;
  summaryOr: string;
  /** A date in the reading. */
  formatDate: (date: Date) => string;
}

export const DEFAULT_CONDITIONS_EDITOR_STRINGS: ConditionsEditorStrings = {
  fieldLabel: 'Field',
  operatorLabel: 'Operator',
  valueLabel: 'Value',
  fieldPlaceholder: 'Select a field',
  operatorPlaceholder: 'Select an operator',
  valuePlaceholder: 'Enter a value',
  expressionPlaceholder: '',
  optionPlaceholder: 'Choose a value',
  optionsPlaceholder: 'Choose values',
  datePlaceholder: 'Pick a date',
  matchAll: 'All (AND)',
  matchAny: 'Any (OR)',
  addCondition: 'Add condition',
  addGroup: 'Add group',
  empty: 'No conditions.',
  emptyGroup: 'No conditions in this group.',
  conditionName: (position) => `Condition ${position}`,
  removeCondition: (position) => `Remove condition ${position}`,
  groupName: (position) => `Group ${position}`,
  groupActions: (group) => `${group} actions`,
  groupMatchMode: (group) => `${group} match mode`,
  valueModeMenu: (condition, mode) => `${condition} mode: ${mode}`,
  valueModeUnavailable: (operator) => `Not available with ${operator}`,
  deleteGroup: 'Delete group',
  deleteGroupTitle: 'Delete this group?',
  deleteGroupDescription: (conditions) =>
    conditions === 1
      ? 'The group and its condition will be removed.'
      : `The group and its ${conditions} conditions will be removed.`,
  cancel: 'Cancel',
  errorFieldAndValue: 'Select a field and enter a value.',
  errorField: 'Select a field.',
  errorOperator: 'Select an operator.',
  errorNumber: 'Enter a number.',
  errorDate: 'Enter a valid date.',
  errorOptions: 'Choose at least one value.',
  errorValue: 'Enter a value.',
  incomplete: 'Some conditions are incomplete and will be ignored.',
  count: (conditions) => (conditions === 1 ? '1 condition' : `${conditions} conditions`),
  summaryLabel: 'Reads as:',
  summaryCondition: (field, operator, value) =>
    [field, operator.toLowerCase(), value].filter((part) => part !== undefined).join(' '),
  summaryList: (values) => `(${values.join(', ')})`,
  summaryAnd: 'and',
  summaryOr: 'or',
  // The date picker's own format, so the reading matches the control.
  formatDate: (date) => format(date, 'PPP'),
};
