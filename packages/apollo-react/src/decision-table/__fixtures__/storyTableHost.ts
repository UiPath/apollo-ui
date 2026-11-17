import type { ColumnChange, ColumnFieldData } from '../ColumnPopover';
import type { DecisionGraphDecisionNode } from '../decisionGraphTypes';
import { policyHeaderOf } from '../hitPolicyMenu';
import { ruleSelection } from '../sentenceSelection';
import type { SentenceBandColumn, SentenceSelection } from '../sentenceTypes';
import type { ValueCommit } from '../valueTypes';
import {
  type EditableTable,
  editableValueField,
  isOutput,
  tableColumns,
  tableWithClearedRule,
  tableWithCommit,
  tableWithDuplicate,
  tableWithMovedRule,
  tableWithNewInput,
  tableWithoutCell,
  tableWithoutRule,
  tableWithRuleAt,
} from './editableSentences.fixtures';
import {
  type FixtureEdit,
  type FixtureMode,
  type FixtureOperator,
  type FixturePolicy,
  type FixtureRefusal,
  type FixtureType,
  fixtureHitPolicies,
  policyOf,
  wordFixtureRefusal,
} from './hostVocabulary';
import { SUM_REFUSED_OFFERS } from './sentences.fixtures';

/** The story host's hit policies, Sum refused as for a text output. */
export const STORY_HIT_POLICIES = fixtureHitPolicies(SUM_REFUSED_OFFERS);

/** How much of the view a host wires: rules only, then selection, then editing. */
export type HostMode = Exclude<FixtureMode['kind'], 'diff'>;

export const NUMERIC_INPUTS = new Set(['age', 'income']);

export const UNIQUE_POLICY: FixturePolicy = policyOf('UNIQUE');

/** The values the story's columns allow. */
const ALLOWED_VALUES: Readonly<Record<string, readonly string[]>> = {
  risk: ['"high"', '"standard"', '"review"'],
  channel: ['"web"', '"app"', '"branch"'],
};

/** What the story host keeps of each column beyond its name, once the column popover changes it. */
type ColumnEdits = Readonly<Record<string, ColumnChange<FixtureType>>>;

const NO_COLUMN_EDITS: ColumnEdits = {};

const mergedChange = (
  held: ColumnChange<FixtureType> | undefined,
  change: ColumnChange<FixtureType>
): ColumnChange<FixtureType> =>
  change.kind === 'input'
    ? { ...(held?.kind === 'input' ? held : {}), ...change }
    : { ...(held?.kind === 'output' ? held : {}), ...change };

const typeOf = (column: SentenceBandColumn<FixtureType>, edits: ColumnEdits): FixtureType =>
  edits[column.id]?.type ?? column.type;

const allowedValuesOf = (columnId: string, edits: ColumnEdits): readonly string[] => {
  const text = edits[columnId]?.allowedValues;
  if (text === undefined) return ALLOWED_VALUES[columnId] ?? [];
  return text.split(',').flatMap((value) => (value.trim() ? [value.trim()] : []));
};

/** What the story host's column popover edits: the column's name as its label, and what the popover changed. */
const storyColumnField = (
  table: EditableTable,
  edits: ColumnEdits,
  columnId: string
): ColumnFieldData<FixtureType> | undefined => {
  const column = [...table.inputs, ...table.outputs].find((candidate) => candidate.id === columnId);
  if (!column) return undefined;
  const held = edits[columnId];
  const common = {
    label: column.name,
    type: typeOf(column, edits),
    allowedValues: held?.allowedValues ?? (ALLOWED_VALUES[columnId] ?? []).join(', '),
  };
  return isOutput(table, columnId)
    ? {
        kind: 'output',
        ...common,
        name: (held?.kind === 'output' ? held.name : undefined) ?? columnId,
        nameRequired: false,
      }
    : {
        kind: 'input',
        ...common,
        expression: (held?.kind === 'input' ? held.expression : undefined) ?? columnId,
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

/** Whether a condition's commit leaves a value it needs empty. */
const missingValue = (commit: ValueCommit<FixtureOperator>): boolean => {
  switch (commit.kind) {
    case 'single':
      return commit.value.trim() === '';
    case 'range':
      return commit.low.trim() === '' || commit.high.trim() === '';
    case 'list':
      return commit.values.every((value) => value.trim() === '');
    case 'expression':
      return commit.text.trim() === '';
    case 'outcome':
    case 'valueless':
      return false;
  }
};

/** The rule a host selects once one is deleted: the next, else the previous. */
const neighbourOf = (table: EditableTable, rowId: string): SentenceSelection | null => {
  const index = table.rules.findIndex((rule) => rule.rowId === rowId);
  const neighbour = table.rules[index + 1] ?? table.rules[index - 1];
  return neighbour ? ruleSelection(neighbour.rowId) : null;
};

/** What a story host keeps of one table: its rules and columns, what the column popover changed, and its hit policy. */
export interface StoryTable {
  table: EditableTable;
  columnEdits: ColumnEdits;
  policy: FixturePolicy;
}

export const storyTableOf = (
  table: EditableTable,
  policy: FixturePolicy = UNIQUE_POLICY
): StoryTable => ({
  table,
  columnEdits: NO_COLUMN_EDITS,
  policy,
});

/** The table's columns, each with the type the column popover last gave it. */
export const storyColumnsOf = ({
  table,
  columnEdits,
}: Pick<StoryTable, 'table' | 'columnEdits'>) => {
  const { inputs, outputs } = tableColumns(table);
  const typed = (columns: readonly SentenceBandColumn<FixtureType>[]) =>
    columns.map((column) => ({ ...column, type: typeOf(column, columnEdits) }));
  return { inputs: typed(inputs), outputs: typed(outputs) };
};

/** What a graph heading shows of a story table as it stands: its hit policy and rule count. */
export const storyHeadingOf = ({
  table,
  policy,
}: StoryTable): Pick<DecisionGraphDecisionNode, 'logic'> => ({
  logic: {
    kind: 'table',
    hitPolicy: policyHeaderOf(STORY_HIT_POLICIES, policy).label,
    ruleCount: table.rules.length,
  },
});

export interface StoryTableHost {
  state: StoryTable;
  onChange: (next: StoryTable) => void;
  onSelect: (selection: SentenceSelection | null) => void;
  onMoreProperties: (columnId: string) => void;
  renderEditor?: FixtureEdit['renderEditor'];
}

/** What a story host wires into an editable view of one table: every edit action, refusing a condition left without a value, the hit-policy picker, and Add rule. */
export const storyTableProps = ({
  state,
  onChange,
  onSelect,
  onMoreProperties,
  renderEditor,
}: StoryTableHost) => {
  const { table, columnEdits } = state;
  const setTable = (next: EditableTable) => onChange({ ...state, table: next });
  const addRuleAt = (index: number) => {
    const [next, rowId] = tableWithRuleAt(table, index);
    setTable(next);
    onSelect(ruleSelection(rowId));
  };
  const columnName = (columnId: string) =>
    [...table.inputs, ...table.outputs].find((column) => column.id === columnId)?.name ?? columnId;
  const edit: FixtureEdit = {
    renderEditor,
    wordRefusal: wordFixtureRefusal,
    onCancel: () => {},
    onCommit: (value, commit): FixtureRefusal | undefined => {
      if (!isOutput(table, value.columnId) && missingValue(commit)) {
        return {
          reason: 'not-feel',
          columnId: value.columnId,
          problem: `the ${columnName(value.columnId)} condition needs a value. Type one, press Escape, or remove the condition.`,
        };
      }
      setTable(tableWithCommit(table, value, commit));
      return undefined;
    },
    valueField: (cell) => ({
      ...editableValueField(table, cell),
      allowedValues: allowedValuesOf(cell.columnId, columnEdits),
    }),
    column: {
      field: (columnId) => storyColumnField(table, columnEdits, columnId),
      onCommit: (columnId, change) =>
        onChange({
          ...state,
          table:
            change.label === undefined ? table : tableWithColumnName(table, columnId, change.label),
          columnEdits: {
            ...columnEdits,
            [columnId]: mergedChange(columnEdits[columnId], change),
          },
        }),
      onMoreProperties,
    },
    onClearCell: (cell) => setTable(tableWithoutCell(table, cell)),
    onAddInput: () => {
      const [next, columnId] = tableWithNewInput(table);
      setTable(next);
      return columnId;
    },
    onInsertRule: addRuleAt,
    onDuplicateRule: (rowId) => {
      const [next, copyId] = tableWithDuplicate(table, rowId);
      setTable(next);
      onSelect(ruleSelection(copyId));
    },
    onClearRule: (rowId) => setTable(tableWithClearedRule(table, rowId)),
    onMoveRule: (from, to) => setTable(tableWithMovedRule(table, from, to)),
    onDeleteRule: (rowId) => {
      setTable(tableWithoutRule(table, rowId));
      onSelect(neighbourOf(table, rowId));
    },
  };
  const onPolicyChange = (next: FixturePolicy) => onChange({ ...state, policy: next });
  return { edit, onPolicyChange, onAddRule: () => addRuleAt(table.rules.length) };
};

type StoryTableProps = ReturnType<typeof storyTableProps>;

/** The view's mode for what the host wires: the selection to read, then selecting, then editing. */
export const storyModeOf = (
  mode: HostMode,
  selected: SentenceSelection | null,
  onSelect: (selection: SentenceSelection | null) => void,
  { edit, onPolicyChange, onAddRule }: StoryTableProps
): FixtureMode => {
  switch (mode) {
    case 'read':
      return { kind: 'read', selected };
    case 'select':
      return { kind: 'select', selected, onSelect };
    case 'edit':
      return { kind: 'edit', selected, onSelect, edit, onPolicyChange, onAddRule };
  }
};
