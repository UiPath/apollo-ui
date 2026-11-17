import type { ColumnChange, ColumnField, ColumnTypeOption } from '../ColumnPopover';
import type { DecisionTextProps } from '../DecisionText';
import type { DecisionGraphDecisionNode } from '../decisionGraphTypes';
import type { DecisionTextEdit } from '../decisionTextTypes';
import { pickedOption } from '../PolicyOptionItem';
import type { SentenceBandColumn, SentenceCellId, SentenceSelection } from '../sentenceTypes';
import type { RangeEnds, ValueField, ValueOperatorOption } from '../valueTypes';
import {
  type EditableTable,
  isOutput,
  tableColumns,
  tableWithClearedRule,
  tableWithCondition,
  tableWithDuplicate,
  tableWithExpression,
  tableWithMovedRule,
  tableWithNewInput,
  tableWithoutCell,
  tableWithoutRule,
  tableWithRuleAt,
  tableWithValue,
} from './editableSentences.fixtures';
import { HIT_POLICY_GROUPS } from './sentences.fixtures';

/** How much of the view a host wires: rules only, then selection, then editing. */
export type HostMode = 'read' | 'select' | 'edit';

export const NUMERIC_INPUTS = new Set(['age', 'income']);

/** The words a one-value condition of the story switches between, each its own id. */
const SINGLE_VALUE_OPERATORS = [
  'is',
  'is not',
  'is less than',
  'is at most',
  'is greater than',
  'is at least',
].map((label) => ({ id: label, label }));

/** The story's operators: the one-value ones, then a range and two lists. */
const CONDITION_OPERATORS: readonly ValueOperatorOption[] = [
  ...SINGLE_VALUE_OPERATORS,
  { id: 'is between', label: 'is between', shape: 'range' },
  { id: 'is one of', label: 'is one of', shape: 'list' },
  { id: 'is none of', label: 'is none of', shape: 'list' },
];

/** The story's conditions as FEEL unary tests, which its expression editor edits. */
const FEEL_TESTS: Readonly<
  Record<string, (values: readonly string[], ends: RangeEnds | undefined) => string>
> = {
  is: (values) => values.join(', '),
  'is not': (values) => `not(${values.join(', ')})`,
  'is less than': ([value = '']) => `< ${value}`,
  'is at most': ([value = '']) => `<= ${value}`,
  'is greater than': ([value = '']) => `> ${value}`,
  'is at least': ([value = '']) => `>= ${value}`,
  'is between': ([low = '', high = ''], ends) =>
    `${ends?.lowInclusive === false ? '(' : '['}${low}..${high}${ends?.highInclusive === false ? ')' : ']'}`,
  'is one of': (values) => values.join(', '),
  'is none of': (values) => `not(${values.join(', ')})`,
};

/** The values the story's columns allow. */
const ALLOWED_VALUES: Readonly<Record<string, readonly string[]>> = {
  risk: ['"high"', '"standard"', '"review"'],
  channel: ['"web"', '"app"', '"branch"'],
};

/** The types the story's column popover offers, each with its kind of value and an example of its values. */
const COLUMN_TYPES: readonly ColumnTypeOption[] = [
  { id: 'string', label: 'Text', type: 'text', allowedValuesPlaceholder: 'e.g. "web", "app"' },
  {
    id: 'number',
    label: 'Number',
    type: 'number',
    allowedValuesPlaceholder: 'e.g. 10, 20, [30..40]',
  },
  { id: 'boolean', label: 'Boolean', type: 'boolean', allowedValuesPlaceholder: 'e.g. true' },
  { id: 'date', label: 'Date', type: 'date', allowedValuesPlaceholder: 'e.g. date("2026-01-01")' },
];

/** What the story host keeps of a column beyond its name, once the column popover changes it. */
export type ColumnEdits = Readonly<Record<string, Omit<ColumnChange, 'label'>>>;

export const NO_COLUMN_EDITS: ColumnEdits = {};

const columnTypeOf = (columnId: string, edits: ColumnEdits = NO_COLUMN_EDITS): string =>
  edits[columnId]?.typeRef ?? (NUMERIC_INPUTS.has(columnId) ? 'number' : 'string');

const columnValueType = (columnId: string, edits?: ColumnEdits) =>
  COLUMN_TYPES.find((type) => type.id === columnTypeOf(columnId, edits))?.type;

const allowedValuesOf = (columnId: string, edits: ColumnEdits): readonly string[] | undefined => {
  const text = edits[columnId]?.allowedValues;
  if (text === undefined) return ALLOWED_VALUES[columnId];
  const values = text.split(',').flatMap((value) => (value.trim() ? [value.trim()] : []));
  return values.length > 0 ? values : undefined;
};

/** The table's columns, each with its kind of value. */
const typedColumns = (table: EditableTable, edits?: ColumnEdits) => {
  const { inputs, outputs } = tableColumns(table);
  const typed = (columns: readonly SentenceBandColumn[]) =>
    columns.map((column) => ({ ...column, type: columnValueType(column.id, edits) }));
  return { inputs: typed(inputs), outputs: typed(outputs) };
};

/** What the story host's column popover edits: the column's name as its label, and what the popover changed. */
const storyColumnField = (
  table: EditableTable,
  edits: ColumnEdits,
  columnId: string
): ColumnField => {
  const output = isOutput(table, columnId);
  const column = [...table.inputs, ...table.outputs].find((candidate) => candidate.id === columnId);
  return {
    kind: output ? 'output' : 'input',
    label: column?.name ?? columnId,
    binding: edits[columnId]?.binding ?? columnId,
    required: !output,
    typeRef: columnTypeOf(columnId, edits),
    allowedValues: edits[columnId]?.allowedValues ?? (ALLOWED_VALUES[columnId] ?? []).join(', '),
  };
};

/** The table with a column renamed. */
const tableWithColumnName = (
  table: EditableTable,
  columnId: string,
  name: string
): EditableTable => {
  const rename = (columns: EditableTable['inputs']) =>
    columns.map((column) => (column.id === columnId ? { ...column, name } : column));
  return { ...table, inputs: rename(table.inputs), outputs: rename(table.outputs) };
};

const numberOrder = (low: string, high: string) => Number(low) <= Number(high);

/** What the story host's popover offers: the column's type glyph, a condition's operators, its values and ends, and the column's allowed values. */
const storyValueField = (
  table: EditableTable,
  edits: ColumnEdits,
  cell: SentenceCellId
): ValueField => {
  const condition = table.rules
    .find((rule) => rule.rowId === cell.rowId)
    ?.conditions.find((candidate) => candidate.inputId === cell.columnId);
  const offered = CONDITION_OPERATORS.find((option) => option.id === condition?.operator);
  const switchable = !isOutput(table, cell.columnId) && (condition === undefined || offered);
  const multiple = offered?.shape !== undefined && offered.shape !== 'single';
  const test = condition ? FEEL_TESTS[condition.operator]?.(condition.values, condition.ends) : '';
  return {
    operators: switchable ? CONDITION_OPERATORS : undefined,
    operator: condition?.operator ?? 'is',
    allowedValues: allowedValuesOf(cell.columnId, edits),
    values: multiple ? condition?.values : undefined,
    ends: condition?.ends,
    inOrder: columnTypeOf(cell.columnId, edits) === 'number' ? numberOrder : undefined,
    expression: switchable ? test : undefined,
  };
};

/** The rule a host selects once one is deleted: the next, else the previous. */
const neighbourOf = (table: EditableTable, rowId: string): SentenceSelection | null => {
  const index = table.rules.findIndex((rule) => rule.rowId === rowId);
  const neighbour = table.rules[index + 1] ?? table.rules[index - 1];
  return neighbour ? { rowId: neighbour.rowId } : null;
};

/** What a story host keeps of one table: its rules and columns, what the column popover changed, and its hit policy. */
export interface StoryTable {
  table: EditableTable;
  columnEdits: ColumnEdits;
  hitPolicy: string;
}

export const storyTableOf = (table: EditableTable): StoryTable => ({
  table,
  columnEdits: NO_COLUMN_EDITS,
  hitPolicy: 'UNIQUE',
});

const headerOf = ({ hitPolicy }: StoryTable) => {
  const picked = pickedOption(
    HIT_POLICY_GROUPS.flatMap((group) => group.options),
    hitPolicy
  );
  return { label: picked?.label ?? '', hint: picked?.hint ?? '' };
};

/** What a graph heading shows of a story table as it stands: its hit policy and rule count. */
export const storyHeadingOf = (
  state: StoryTable
): Pick<DecisionGraphDecisionNode, 'hitPolicy' | 'ruleCount'> => ({
  hitPolicy: headerOf(state).label,
  ruleCount: state.table.rules.length,
});

export interface StoryTableHost {
  state: StoryTable;
  onChange: (next: StoryTable) => void;
  onSelect: (selection: SentenceSelection | null) => void;
  onMoreProperties: (columnId: string) => void;
  renderEditor?: DecisionTextEdit['renderEditor'];
  editLabels?: DecisionTextEdit['labels'];
}

/** A story host's props for an editable view of one table: its typed columns, header and hit-policy picker, every edit action, and Add rule. */
export const storyTableProps = ({
  state,
  onChange,
  onSelect,
  onMoreProperties,
  renderEditor,
  editLabels,
}: StoryTableHost) => {
  const { table, columnEdits, hitPolicy } = state;
  const setTable = (next: EditableTable) => onChange({ ...state, table: next });
  const addRuleAt = (index: number) => {
    const [next, rowId] = tableWithRuleAt(table, index);
    setTable(next);
    onSelect({ rowId });
  };
  const columnName = (columnId: string) =>
    [...table.inputs, ...table.outputs].find((column) => column.id === columnId)?.name ?? columnId;
  const edit: DecisionTextEdit = {
    renderEditor,
    onCommit: (value, commit) => {
      const text = commit.kind === 'expression' ? commit.text : (commit.values[0] ?? '');
      if (!isOutput(table, value.columnId) && text.trim() === '') {
        return `Not saved: the ${columnName(value.columnId)} condition needs a value. Type one, press Escape, or remove the condition.`;
      }
      setTable(
        commit.kind === 'expression'
          ? tableWithExpression(table, value, commit.text)
          : commit.operator === undefined
            ? tableWithValue(table, value, text)
            : tableWithCondition(table, value, commit)
      );
      return undefined;
    },
    valueField: (cell) => storyValueField(table, columnEdits, cell),
    column: {
      field: (columnId) => storyColumnField(table, columnEdits, columnId),
      types: COLUMN_TYPES,
      onCommit: (columnId, { label, ...rest }) =>
        onChange({
          ...state,
          table: label === undefined ? table : tableWithColumnName(table, columnId, label),
          columnEdits: { ...columnEdits, [columnId]: { ...columnEdits[columnId], ...rest } },
        }),
      onMoreProperties,
    },
    onClearCell: (cell) => setTable(tableWithoutCell(table, cell)),
    inputIds: table.inputs.map((input) => input.id),
    onAddInput: () => {
      const [next, columnId] = tableWithNewInput(table);
      setTable(next);
      return columnId;
    },
    onInsertRule: addRuleAt,
    onDuplicateRule: (rowId) => {
      const [next, copyId] = tableWithDuplicate(table, rowId);
      setTable(next);
      onSelect({ rowId: copyId });
    },
    onClearRule: (rowId) => setTable(tableWithClearedRule(table, rowId)),
    onMoveRule: (from, to) => setTable(tableWithMovedRule(table, from, to)),
    onDeleteRule: (rowId) => {
      setTable(tableWithoutRule(table, rowId));
      onSelect(neighbourOf(table, rowId));
    },
    labels: editLabels,
  };
  const header = headerOf(state);
  const policy: DecisionTextProps['policy'] = {
    value: hitPolicy,
    groups: HIT_POLICY_GROUPS,
    onChange: (next) => onChange({ ...state, hitPolicy: next }),
    label: `Hit policy: ${header.label}`,
  };
  const addRule: DecisionTextProps['addRule'] = {
    label: 'Add rule',
    onAdd: () => addRuleAt(table.rules.length),
  };
  return { columns: typedColumns(table, columnEdits), header, edit, policy, addRule };
};
