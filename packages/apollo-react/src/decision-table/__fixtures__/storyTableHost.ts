import type { ColumnChange, ColumnFieldData } from '../ColumnPopover';
import type { DecisionGraphBody } from '../DecisionGraphText';
import type { DecisionGraphDecisionNode } from '../decisionGraphTypes';
import type { DecisionTextEdit } from '../decisionTextTypes';
import { policyHeaderOf } from '../hitPolicyMenu';
import type { SentenceBandColumn, SentenceCellId, SentenceSelection } from '../sentenceTypes';
import type { HeldValues, OperatorOffer, RangeEnds, ValueFieldData } from '../valueTypes';
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
import {
  type FixturePick,
  type FixturePolicy,
  type FixtureRefusal,
  type FixtureTotal,
  type FixtureType,
  HIT_POLICIES,
  wordRefusal,
} from './sentences.fixtures';
import type { FixtureMode } from './textMode';

/** How much of the view a host wires: rules only, then selection, then editing. */
export type HostMode = 'read' | 'select' | 'edit';

export const NUMERIC_INPUTS = new Set(['age', 'income']);

/** The words a one-value condition of the story switches between, each its own operator. */
const SINGLE_VALUE_OPERATORS = [
  'is',
  'is not',
  'is less than',
  'is at most',
  'is greater than',
  'is at least',
] as const;

/** The story's operators, each its own words. */
type StoryOperator =
  | (typeof SINGLE_VALUE_OPERATORS)[number]
  | 'is between'
  | 'is one of'
  | 'is none of';

/** A graph body in the story's operators and the fixtures' hit policies, column types and refusals. */
export type StoryGraphBody = DecisionGraphBody<
  StoryOperator,
  FixturePolicy,
  FixtureTotal,
  FixtureType,
  FixtureRefusal
>;

/** The story's operators: the one-value ones, then a range and two lists. */
const CONDITION_OPERATORS: readonly OperatorOffer<StoryOperator>[] = [
  ...SINGLE_VALUE_OPERATORS.map(
    (operator): OperatorOffer<StoryOperator> => ({ operator, label: operator, shape: 'single' })
  ),
  { operator: 'is between', label: 'is between', shape: 'range' },
  { operator: 'is one of', label: 'is one of', shape: 'list' },
  { operator: 'is none of', label: 'is none of', shape: 'list' },
];

const BOTH_INCLUDED: RangeEnds = { lowInclusive: true, highInclusive: true };

/** The story's conditions as FEEL unary tests, which its expression editor edits. */
const FEEL_TESTS: Readonly<
  Record<StoryOperator, (values: readonly string[], ends: RangeEnds | undefined) => string>
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

/** What the story host keeps of a column beyond its name, once the column popover changes it. */
export type ColumnEdits = Readonly<
  Record<string, { binding?: string; type?: FixtureType; allowedValues?: string }>
>;

export const NO_COLUMN_EDITS: ColumnEdits = {};

const columnTypeOf = (columnId: string, edits: ColumnEdits = NO_COLUMN_EDITS): FixtureType =>
  edits[columnId]?.type ?? (NUMERIC_INPUTS.has(columnId) ? 'number' : 'text');

const allowedValuesOf = (columnId: string, edits: ColumnEdits): readonly string[] | undefined => {
  const text = edits[columnId]?.allowedValues;
  if (text === undefined) return ALLOWED_VALUES[columnId];
  const values = text.split(',').flatMap((value) => (value.trim() ? [value.trim()] : []));
  return values.length > 0 ? values : undefined;
};

/** The table's columns, each with its kind of value. */
const typedColumns = (table: EditableTable, edits?: ColumnEdits) => {
  const { inputs, outputs } = tableColumns(table);
  const typed = (columns: readonly SentenceBandColumn<FixtureType>[]) =>
    columns.map((column) => ({ ...column, type: columnTypeOf(column.id, edits) }));
  return { inputs: typed(inputs), outputs: typed(outputs) };
};

/** What the story host's column popover edits: the column's name as its label, and what the popover changed. */
const storyColumnField = (
  table: EditableTable,
  edits: ColumnEdits,
  columnId: string
): ColumnFieldData<FixtureType> => {
  const column = [...table.inputs, ...table.outputs].find((candidate) => candidate.id === columnId);
  const common = {
    label: column?.name ?? columnId,
    type: columnTypeOf(columnId, edits),
  };
  const binding = edits[columnId]?.binding ?? columnId;
  return isOutput(table, columnId)
    ? {
        kind: 'output',
        ...common,
        name: binding,
        nameRequired: false,
        allowedValues:
          edits[columnId]?.allowedValues ?? (ALLOWED_VALUES[columnId] ?? []).join(', '),
      }
    : { kind: 'input', ...common, expression: binding };
};

const columnEditOf = ({ label: _label, ...change }: ColumnChange<FixtureType>) => {
  const { type } = change;
  const binding = change.kind === 'input' ? change.expression : change.name;
  const allowedValues = change.kind === 'output' ? change.allowedValues : undefined;
  return {
    ...(binding === undefined ? {} : { binding }),
    ...(type === undefined ? {} : { type }),
    ...(allowedValues === undefined ? {} : { allowedValues }),
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

/** A held condition's values in the shape of its offered operator. */
const heldOf = (
  { operator, shape }: OperatorOffer<StoryOperator>,
  values: readonly string[],
  ends: RangeEnds | undefined
): HeldValues<StoryOperator> => {
  const [first = '', second = ''] = values;
  switch (shape) {
    case 'range':
      return { shape, operator, low: first, high: second, ends: ends ?? BOTH_INCLUDED };
    case 'list':
      return { shape, operator, values };
    case 'valueless':
      return { shape, operator };
    default:
      return { shape: 'single', operator, value: first };
  }
};

/** What the story host's popover edits: an outcome, a condition by its operator and values, or one the operators lack as its expression, with the column's allowed values. */
const storyValueField = (
  table: EditableTable,
  edits: ColumnEdits,
  cell: SentenceCellId
): ValueFieldData<StoryOperator> => {
  const allowedValues = allowedValuesOf(cell.columnId, edits) ?? [];
  if (isOutput(table, cell.columnId)) return { kind: 'outcome', allowedValues };
  const condition = table.rules
    .find((rule) => rule.rowId === cell.rowId)
    ?.conditions.find((candidate) => candidate.inputId === cell.columnId);
  const offered = condition
    ? CONDITION_OPERATORS.find((option) => option.operator === condition.operator)
    : CONDITION_OPERATORS[0];
  if (!offered) {
    const expression = condition ? condition.values.join(condition.joiner) : '';
    return { kind: 'expression', allowedValues, expression };
  }
  const values = condition?.values ?? [];
  return {
    kind: 'condition',
    allowedValues,
    expression: FEEL_TESTS[offered.operator](values, condition?.ends),
    operators: CONDITION_OPERATORS,
    held: heldOf(offered, values, condition?.ends),
  };
};

/** The rule a host selects once one is deleted: the next, else the previous. */
const neighbourOf = (table: EditableTable, rowId: string): SentenceSelection | null => {
  const index = table.rules.findIndex((rule) => rule.rowId === rowId);
  const neighbour = table.rules[index + 1] ?? table.rules[index - 1];
  return neighbour ? { kind: 'rule', rowId: neighbour.rowId } : null;
};

/** What a story host keeps of one table: its rules and columns, what the column popover changed, and its hit policy. */
export interface StoryTable {
  table: EditableTable;
  columnEdits: ColumnEdits;
  hitPolicy: FixturePick;
}

type EditMode = Extract<FixtureMode, { kind: 'edit' }>;

export const storyTableOf = (table: EditableTable): StoryTable => ({
  table,
  columnEdits: NO_COLUMN_EDITS,
  hitPolicy: { kind: 'policy', policy: 'unique' },
});

/** What a graph heading shows of a story table as it stands: its hit policy and rule count. */
export const storyHeadingOf = (state: StoryTable): Pick<DecisionGraphDecisionNode, 'logic'> => ({
  logic: {
    kind: 'table',
    hitPolicy: policyHeaderOf(HIT_POLICIES, state.hitPolicy).label,
    ruleCount: state.table.rules.length,
  },
});

export interface StoryTableHost {
  state: StoryTable;
  onChange: (next: StoryTable) => void;
  onSelect: (selection: SentenceSelection | null) => void;
  onMoreProperties: (columnId: string) => void;
  renderEditor?: DecisionTextEdit<StoryOperator, FixtureType, FixtureRefusal>['renderEditor'];
}

/** A story host's props for an editable view of one table: its typed columns, hit policy and its change, every edit action, and Add rule. */
export const storyTableProps = ({
  state,
  onChange,
  onSelect,
  onMoreProperties,
  renderEditor,
}: StoryTableHost) => {
  const { table, columnEdits, hitPolicy } = state;
  const setTable = (next: EditableTable) => onChange({ ...state, table: next });
  const addRuleAt = (index: number) => {
    const [next, rowId] = tableWithRuleAt(table, index);
    setTable(next);
    onSelect({ kind: 'rule', rowId });
  };
  const columnName = (columnId: string) =>
    [...table.inputs, ...table.outputs].find((column) => column.id === columnId)?.name ?? columnId;
  const edit: DecisionTextEdit<StoryOperator, FixtureType, FixtureRefusal> = {
    renderEditor,
    wordRefusal,
    onCommit: (value, commit) => {
      const text =
        commit.kind === 'expression' ? commit.text : commit.kind === 'single' ? commit.value : '-';
      if (!isOutput(table, value.columnId) && text.trim() === '') {
        return {
          reason: 'note',
          text: `Not saved: the ${columnName(value.columnId)} condition needs a value. Type one, press Escape, or remove the condition.`,
        };
      }
      setTable(
        commit.kind === 'expression'
          ? tableWithExpression(table, value, commit.text)
          : commit.kind === 'outcome'
            ? tableWithValue(table, value, commit.value)
            : tableWithCondition(table, value, commit)
      );
      return undefined;
    },
    valueField: (cell) => storyValueField(table, columnEdits, cell),
    column: {
      field: (columnId) => storyColumnField(table, columnEdits, columnId),
      onCommit: (columnId, change) =>
        onChange({
          ...state,
          table:
            change.label === undefined ? table : tableWithColumnName(table, columnId, change.label),
          columnEdits: {
            ...columnEdits,
            [columnId]: { ...columnEdits[columnId], ...columnEditOf(change) },
          },
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
      onSelect({ kind: 'rule', rowId: copyId });
    },
    onClearRule: (rowId) => setTable(tableWithClearedRule(table, rowId)),
    onMoveRule: (from, to) => setTable(tableWithMovedRule(table, from, to)),
    onDeleteRule: (rowId) => {
      setTable(tableWithoutRule(table, rowId));
      onSelect(neighbourOf(table, rowId));
    },
  };
  const onPolicyChange: EditMode['onPolicyChange'] = (next) =>
    onChange({ ...state, hitPolicy: next });
  const onAddRule = () => addRuleAt(table.rules.length);
  return { columns: typedColumns(table, columnEdits), hitPolicy, edit, onPolicyChange, onAddRule };
};
