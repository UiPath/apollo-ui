import type { Meta, StoryObj } from '@storybook/react';
import { Calendar, Hash, Plus, ToggleLeft, Type } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  EDITABLE_TABLE,
  type EditableTable,
  EMPTY_TABLE,
  isOutput,
  manyRulesTable,
  tableBands,
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
  unusedInputs,
  wordedRules,
} from './__fixtures__/editableSentences.fixtures';
import {
  DECISION_TEXT_EDIT_LABELS,
  DECISION_TEXT_LABELS,
  HIT_POLICY_GROUPS,
} from './__fixtures__/sentences.fixtures';
import { CellTextEditor } from './CellTextEditor';
import type { ColumnChange, ColumnField, ColumnTypeOption } from './ColumnPopover';
import { DecisionText, type DecisionTextProps } from './DecisionText';
import type { DecisionTextEdit } from './decisionTextTypes';
import type { GridMenuEntry } from './GridMenu';
import type { Mark, RowMark, TableMarks } from './marks';
import { pickedOption } from './PolicyOptionItem';
import { valueTokenOf } from './sentenceParts';
import type {
  SentenceBand,
  SentenceCellId,
  SentenceRule,
  SentenceSelection,
  SentenceValueId,
} from './sentenceTypes';
import type {
  RangeEnds,
  SentenceEditorContext,
  ValueField,
  ValueOperatorOption,
} from './valueTypes';

const selectionText = (selection: SentenceSelection | null) =>
  selection ? [selection.rowId, selection.columnId ?? 'rule'].join(' / ') : 'none';

const cellText = (cell: SentenceCellId | null) =>
  cell ? `${cell.rowId} / ${cell.columnId}` : 'none';

const editingText = (editing: SentenceValueId | null) =>
  editing ? `${editing.rowId} / ${editing.columnId} / value ${editing.index + 1}` : 'none';

interface StoryCaptionProps {
  children: React.ReactNode;
}

const StoryCaption = ({ children }: StoryCaptionProps) => (
  <p className="text-xs text-foreground-de-emp">{children}</p>
);

/** How much of the view a host wires: rules only, then selection, then editing. */
type HostMode = 'read' | 'select' | 'edit';

const NUMERIC_INPUTS = new Set(['age', 'income']);

const NO_MARKS: TableMarks = { rows: new Map(), columns: new Map() };

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

const TYPE_ICON_CLASS = 'text-foreground-de-emp';

/** The types the story's column popover offers, each with its glyph and an example of its values. */
const COLUMN_TYPES: readonly ColumnTypeOption[] = [
  {
    id: 'string',
    label: 'Text',
    icon: <Type className={TYPE_ICON_CLASS} />,
    allowedValuesPlaceholder: 'e.g. "web", "app"',
  },
  {
    id: 'number',
    label: 'Number',
    icon: <Hash className={TYPE_ICON_CLASS} />,
    allowedValuesPlaceholder: 'e.g. 10, 20, [30..40]',
  },
  {
    id: 'boolean',
    label: 'Boolean',
    icon: <ToggleLeft className={TYPE_ICON_CLASS} />,
    allowedValuesPlaceholder: 'e.g. true',
  },
  {
    id: 'date',
    label: 'Date',
    icon: <Calendar className={TYPE_ICON_CLASS} />,
    allowedValuesPlaceholder: 'e.g. date("2026-01-01")',
  },
];

/** What the story host keeps of a column beyond its name, once the column popover changes it. */
type ColumnEdits = Readonly<Record<string, Omit<ColumnChange, 'label'>>>;

const NO_COLUMN_EDITS: ColumnEdits = {};

const columnTypeOf = (columnId: string, edits: ColumnEdits = NO_COLUMN_EDITS): string =>
  edits[columnId]?.typeRef ?? (NUMERIC_INPUTS.has(columnId) ? 'number' : 'string');

const columnIcon = (columnId: string, edits?: ColumnEdits) =>
  COLUMN_TYPES.find((type) => type.id === columnTypeOf(columnId, edits))?.icon;

const allowedValuesOf = (columnId: string, edits: ColumnEdits): readonly string[] | undefined => {
  const text = edits[columnId]?.allowedValues;
  if (text === undefined) return ALLOWED_VALUES[columnId];
  const values = text.split(',').flatMap((value) => (value.trim() ? [value.trim()] : []));
  return values.length > 0 ? values : undefined;
};

/** Bands whose columns carry their type glyph, as a host draws them. */
const typedBands = (bands: readonly SentenceBand[], edits?: ColumnEdits): SentenceBand[] =>
  bands.map((band) => ({
    ...band,
    columns: band.columns.map((column) => ({ ...column, icon: columnIcon(column.id, edits) })),
  }));

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
    icon: columnIcon(cell.columnId, edits),
    operators: switchable ? CONDITION_OPERATORS : undefined,
    operator: condition?.operator ?? 'is',
    allowedValues: allowedValuesOf(cell.columnId, edits),
    values: multiple ? condition?.values : undefined,
    ends: condition?.ends,
    inOrder: columnTypeOf(cell.columnId, edits) === 'number' ? numberOrder : undefined,
    expression: switchable ? test : undefined,
  };
};

/** The host's validation, as the grid's host marks its cells: a number input holding text, and an empty outcome. */
const validationMarks = (table: EditableTable): TableMarks => {
  const rows = new Map<string, RowMark>();
  for (const rule of table.rules) {
    const cells: Record<string, Mark> = {};
    for (const condition of rule.conditions) {
      if (
        NUMERIC_INPUTS.has(condition.inputId) &&
        condition.operator !== 'matches' &&
        condition.values.some((value) => Number.isNaN(Number(value)))
      ) {
        cells[condition.inputId] = { tone: 'error', title: 'Not a number', glyph: true };
      }
    }
    for (const output of table.outputs) {
      if (!rule.outcomes[output.id]) {
        cells[output.id] = { tone: 'warning', title: `No ${output.name} set`, glyph: true };
      }
    }
    if (Object.keys(cells).length > 0) rows.set(rule.rowId, { cells });
  }
  return { rows, columns: new Map() };
};

/** The host's selection once its rule or cell is gone: the rule, or nothing. The edited cell stays. */
const liveSelection = (
  rules: readonly SentenceRule[],
  selected: SentenceSelection | null,
  editing: SentenceValueId | null
): SentenceSelection | null => {
  const rule = selected && rules.find((candidate) => candidate.rowId === selected.rowId);
  if (!selected || !rule) return null;
  const { columnId } = selected;
  if (columnId === undefined) return selected;
  if (editing?.rowId === selected.rowId && editing.columnId === columnId) return selected;
  return valueTokenOf(rule, { rowId: rule.rowId, columnId, index: 0 })
    ? selected
    : { rowId: rule.rowId };
};

const sameSelection = (left: SentenceSelection | null, right: SentenceSelection | null) =>
  left?.rowId === right?.rowId && left?.columnId === right?.columnId;

/** The rule a host selects once one is deleted: the next, else the previous. */
const neighbourOf = (table: EditableTable, rowId: string): SentenceSelection | null => {
  const index = table.rules.findIndex((rule) => rule.rowId === rowId);
  const neighbour = table.rules[index + 1] ?? table.rules[index - 1];
  return neighbour ? { rowId: neighbour.rowId } : null;
};

interface TableHostProps {
  initialTable: EditableTable;
  caption: string;
  mode?: HostMode;
  validate?: boolean;
  marks?: TableMarks;
  headerMark?: DecisionTextProps['headerMark'];
  renderEditor?: DecisionTextEdit['renderEditor'];
  frameClassName?: string;
}

/** A host that owns the table, the selection and the edit, words the table back after every write, and refuses an empty condition. */
const TableHost = ({
  initialTable,
  caption,
  mode = 'edit',
  validate = false,
  marks: fixedMarks,
  headerMark,
  renderEditor,
  frameClassName = 'h-[600px]',
}: TableHostProps) => {
  const [table, setTable] = useState(initialTable);
  const [selected, setSelected] = useState<SentenceSelection | null>(null);
  const [editing, setEditing] = useState<SentenceValueId | null>(null);
  const [hovered, setHovered] = useState<SentenceCellId | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [hitPolicy, setHitPolicy] = useState('UNIQUE');
  const [openedDecision, setOpenedDecision] = useState<string | null>(null);
  const [columnEdits, setColumnEdits] = useState<ColumnEdits>(NO_COLUMN_EDITS);
  const [moreProperties, setMoreProperties] = useState<string | null>(null);
  const rules = useMemo(() => wordedRules(table), [table]);
  const bands = useMemo(() => typedBands(tableBands(table), columnEdits), [table, columnEdits]);
  const marks = useMemo(
    () => fixedMarks ?? (validate ? validationMarks(table) : NO_MARKS),
    [fixedMarks, table, validate]
  );

  useEffect(() => {
    setSelected((current) => {
      const live = liveSelection(rules, current, editing);
      return sameSelection(live, current) ? current : live;
    });
  }, [rules, editing]);

  const open = (value: SentenceValueId | null) => {
    setRefusal(null);
    setEditing(value);
  };
  const addRuleAt = (index: number) => {
    const [next, rowId] = tableWithRuleAt(table, index);
    setTable(next);
    setSelected({ rowId });
  };
  const deleteRule = (rowId: string) => {
    setTable(tableWithoutRule(table, rowId));
    setSelected(neighbourOf(table, rowId));
  };
  const columnName = (columnId: string) =>
    [...table.inputs, ...table.outputs].find((column) => column.id === columnId)?.name ?? columnId;

  const conditionEntries = (rowId: string): GridMenuEntry[] => {
    const unused = unusedInputs(table, rowId).map(
      (input): GridMenuEntry => ({
        label: input.name,
        icon: columnIcon(input.id, columnEdits),
        focusesOwnSurface: true,
        onClick: () => open({ rowId, columnId: input.id, index: 0 }),
      })
    );
    const addInput = () => {
      const [next, columnId] = tableWithNewInput(table);
      setTable(next);
      open({ rowId, columnId, index: 0 });
    };
    return [
      ...unused,
      ...(unused.length > 0 ? [{ divider: true } as const] : []),
      { label: 'New input', icon: <Plus />, focusesOwnSurface: true, onClick: addInput },
    ];
  };

  const ruleEntries = (rowId: string): GridMenuEntry[] => {
    const index = table.rules.findIndex((rule) => rule.rowId === rowId);
    const duplicate = () => {
      const [next, copyId] = tableWithDuplicate(table, rowId);
      setTable(next);
      setSelected({ rowId: copyId });
    };
    return [
      { label: 'Insert rule above', onClick: () => addRuleAt(index) },
      { label: 'Insert rule below', onClick: () => addRuleAt(index + 1) },
      { label: 'Duplicate rule', onClick: duplicate },
      { divider: true },
      {
        label: 'Move up',
        disabled: index === 0,
        disabledReason: 'Already the first rule',
        onClick: () => setTable(tableWithMovedRule(table, rowId, -1)),
      },
      {
        label: 'Move down',
        disabled: index === table.rules.length - 1,
        disabledReason: 'Already the last rule',
        onClick: () => setTable(tableWithMovedRule(table, rowId, 1)),
      },
      { divider: true },
      { label: 'Clear rule', onClick: () => setTable(tableWithClearedRule(table, rowId)) },
      { label: 'Delete rule', destructive: true, onClick: () => deleteRule(rowId) },
    ];
  };

  const edit: DecisionTextEdit = {
    editing,
    renderEditor,
    onStartEdit: open,
    onCommit: (value, commit) => {
      const text = commit.kind === 'expression' ? commit.text : (commit.values[0] ?? '');
      if (!isOutput(table, value.columnId) && text.trim() === '') {
        setRefusal(
          `Not saved: the ${columnName(value.columnId)} condition needs a value. Type one, press Escape, or remove the condition.`
        );
        return;
      }
      setTable(
        commit.kind === 'expression'
          ? tableWithExpression(table, value, commit.text)
          : commit.operator === undefined
            ? tableWithValue(table, value, text)
            : tableWithCondition(table, value, commit)
      );
      open(null);
    },
    onCancel: () => open(null),
    valueField: (cell) => storyValueField(table, columnEdits, cell),
    column: {
      field: (columnId) => storyColumnField(table, columnEdits, columnId),
      types: COLUMN_TYPES,
      onCommit: (columnId, { label, ...rest }) => {
        if (label !== undefined) setTable(tableWithColumnName(table, columnId, label));
        setColumnEdits({ ...columnEdits, [columnId]: { ...columnEdits[columnId], ...rest } });
      },
      onMoreProperties: setMoreProperties,
    },
    onClearCell: (cell) => setTable(tableWithoutCell(table, cell)),
    conditionEntries,
    ruleEntries,
    onDeleteRule: deleteRule,
    labels: DECISION_TEXT_EDIT_LABELS,
  };
  const editable = mode === 'edit';
  const picked = pickedOption(
    HIT_POLICY_GROUPS.flatMap((group) => group.options),
    hitPolicy
  );
  const header = { label: picked?.label ?? '', hint: picked?.hint ?? '' };
  const policy = {
    value: hitPolicy,
    groups: HIT_POLICY_GROUPS,
    onChange: setHitPolicy,
    label: `Hit policy: ${header.label}`,
  };

  return (
    <div className={`flex flex-col gap-2 ${frameClassName}`}>
      <DecisionText
        rules={rules}
        bands={bands}
        header={header}
        labels={DECISION_TEXT_LABELS}
        ariaLabel="Rules"
        dataTestId="decision-text"
        numbered
        marks={marks}
        headerMark={headerMark}
        onCellHover={setHovered}
        {...(mode === 'read'
          ? { selected: null }
          : { selected, onSelect: setSelected, edit: editable ? edit : undefined })}
        policy={editable ? policy : undefined}
        onOpenDecision={setOpenedDecision}
        addRule={
          editable ? { label: 'Add rule', onAdd: () => addRuleAt(table.rules.length) } : undefined
        }
      />
      {refusal && (
        <p role="alert" className="text-xs font-medium text-error-text">
          {refusal}
        </p>
      )}
      <StoryCaption>
        Selected: {selectionText(selected)} · Editing: {editingText(editing)} · Hovered:{' '}
        {cellText(hovered)} · Opened decision: {openedDecision ?? 'none'} · More properties:{' '}
        {moreProperties ?? 'none'}
      </StoryCaption>
      <StoryCaption>{caption}</StoryCaption>
    </div>
  );
};

const meta: Meta<typeof DecisionText> = {
  title: 'Decision Text',
  component: DecisionText,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof DecisionText>;

export const Default: Story = {
  render: () => (
    <TableHost
      initialTable={EDITABLE_TABLE}
      caption="The rules as they come: click a value, a column or a rule's ⋯ to edit."
    />
  ),
};

export const ReadOnly: Story = {
  render: () => (
    <TableHost
      initialTable={EDITABLE_TABLE}
      mode="select"
      caption="Read-only: click a value or a rule to select it, arrows move, nothing edits."
    />
  ),
};

const ERRORS_TABLE: EditableTable = {
  ...EDITABLE_TABLE,
  rules: [
    {
      rowId: 'e1',
      outcomes: { risk: '"high"' },
      conditions: [
        { inputId: 'age', operator: 'is less than', values: ['"25"'], joiner: ', ' },
        { inputId: 'channel', operator: 'is', values: ['"kiosk"'], joiner: ', ' },
      ],
    },
    {
      rowId: 'e2',
      outcomes: { risk: '' },
      conditions: [
        { inputId: 'age', operator: 'is between', values: ['25', '60'], joiner: ' and ' },
      ],
    },
    {
      rowId: 'e3',
      outcomes: { risk: '"review"' },
      conditions: [{ inputId: 'age', operator: 'is at most', values: ['30'], joiner: ', ' }],
    },
    {
      rowId: 'e4',
      outcomes: { risk: '"standard"' },
      conditions: [
        { inputId: 'age', operator: 'is greater than', values: ['60'], joiner: ', ' },
        { inputId: 'income', operator: 'is greater than', values: ['40000'], joiner: ', ' },
      ],
    },
    {
      rowId: 'e5',
      outcomes: { risk: '"high"' },
      conditions: [
        { inputId: 'age', operator: 'is greater than', values: ['60'], joiner: ', ' },
        { inputId: 'income', operator: 'is at most', values: ['40000'], joiner: ', ' },
      ],
    },
    { rowId: 'e6', outcomes: { risk: '"review"' }, conditions: [] },
  ],
};

const ERRORS_MARKS: TableMarks = {
  rows: new Map<string, RowMark>([
    [
      'e1',
      {
        cells: {
          age: {
            tone: 'error',
            glyph: true,
            title: 'Type mismatch: age is a number, "25" is text',
          },
          channel: { tone: 'warning', glyph: true, title: '"kiosk" is not an allowed channel' },
        },
      },
    ],
    [
      'e2',
      {
        tone: 'error',
        glyph: true,
        title: 'Set a risk.',
        cells: { risk: { tone: 'error', glyph: true, title: 'Set a risk.' } },
      },
    ],
    ['e3', { tone: 'warning', glyph: true, title: 'Overlaps rule 2' }],
    [
      'e4',
      {
        tone: 'success',
        cells: {
          age: { matched: true, title: 'age: 67' },
          income: { matched: true, title: 'income: 52000' },
        },
      },
    ],
    [
      'e5',
      {
        cells: {
          age: { tone: 'success', matched: true, title: 'age: 67' },
          income: { tone: 'error', matched: false, title: 'income: 52000' },
        },
      },
    ],
    ['e6', { dim: true, title: 'Not evaluated' }],
  ]),
  columns: new Map([
    ['income', { tone: 'warning', glyph: true, title: 'income has no allowed values' }],
  ]),
};

export const Errors: Story = {
  render: () => (
    <TableHost
      initialTable={ERRORS_TABLE}
      marks={ERRORS_MARKS}
      headerMark={{ tone: 'error', glyph: true, title: 'Unique: rules 2 and 3 overlap' }}
      caption="Validation and run marks on values, rules, a column and the header; hover a glyph for its message."
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <TableHost
        initialTable={EMPTY_TABLE}
        frameClassName="h-[480px]"
        caption="Add rule adds an empty rule and selects it."
      />
      <TableHost
        initialTable={EMPTY_TABLE}
        mode="select"
        frameClassName="h-[480px]"
        caption="Read-only: no add action."
      />
    </div>
  ),
};

/** The story's expression editor: a monospace input. */
const renderExpressionEditor = (context: SentenceEditorContext) => (
  <div className="overflow-hidden rounded-md border border-input font-mono">
    <CellTextEditor
      value={context.value}
      ariaLabel={context.ariaLabel}
      dataTestId="decision-text-host-editor"
      onCommit={context.onCommit}
      onCancel={context.onCancel}
      onDraftChange={context.onDraftChange}
    />
  </div>
);

export const HostEditor: Story = {
  render: () => (
    <TableHost
      initialTable={EDITABLE_TABLE}
      renderEditor={renderExpressionEditor}
      caption="renderEditor adds Edit expression, which opens the host's editor on the whole condition."
    />
  ),
};

const HOST_MODES: readonly HostMode[] = ['read', 'select', 'edit'];

const MODE_LABELS: Record<HostMode, string> = {
  read: 'Read',
  select: 'Select',
  edit: 'Edit',
};

const EndToEndDemo = () => {
  const [mode, setMode] = useState<HostMode>('read');
  return (
    <div className="flex flex-col gap-2">
      <fieldset className="flex items-center gap-4 text-sm text-foreground">
        <legend className="sr-only">What the host wires</legend>
        {HOST_MODES.map((option) => (
          <label key={option} className="flex items-center gap-1.5">
            <input
              type="radio"
              name="decision-text-mode"
              value={option}
              checked={mode === option}
              onChange={() => setMode(option)}
            />
            {MODE_LABELS[option]}
          </label>
        ))}
      </fieldset>
      <TableHost
        initialTable={EDITABLE_TABLE}
        mode={mode}
        validate
        caption="One host wired a step at a time, Read, Select then Edit, validating after each write."
      />
    </div>
  );
};

export const EndToEnd: Story = {
  render: () => <EndToEndDemo />,
};

const LARGE_TABLE = manyRulesTable(50_000, 10_000, 50);

export const LargeTable: Story = {
  render: () => (
    <TableHost
      initialTable={LARGE_TABLE}
      validate
      caption={`${LARGE_TABLE.rules.length.toLocaleString('en-US')} rules over ${LARGE_TABLE.inputs.length} inputs, windowed, on the same editing stack.`}
    />
  ),
};
