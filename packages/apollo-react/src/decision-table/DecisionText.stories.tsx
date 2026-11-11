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
  GRID_SENTENCE_BANDS,
  GRID_SENTENCE_HEADER,
  GRID_SENTENCE_RULES,
  HIT_POLICY_GROUPS,
  MULTI_SENTENCE_BANDS,
  MULTI_SENTENCE_HEADER,
  MULTI_SENTENCE_RULES,
  manyColumnBands,
  manyLinesRule,
} from './__fixtures__/sentences.fixtures';
import { CellTextEditor } from './CellTextEditor';
import type { ColumnChange, ColumnField, ColumnTypeOption } from './ColumnPopover';
import { DecisionText, type DecisionTextEdit, type DecisionTextProps } from './DecisionText';
import type { GridMenuEntry } from './GridMenu';
import type { Mark, RowMark, TableMarks } from './marks';
import { pickedOption } from './PolicyOptionItem';
import { valueTokenOf } from './sentenceParts';
import type {
  SentenceBand,
  SentenceCellId,
  SentenceLine,
  SentenceNameToken,
  SentencePart,
  SentenceRule,
  SentenceSelection,
  SentenceValueId,
  SentenceValueToken,
} from './sentenceTypes';
import type { SentenceEditorContext, ValueField, ValueOperatorOption } from './ValuePopover';

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

interface ReadOnlyDemoProps
  extends Partial<Omit<DecisionTextProps, 'selected' | 'onSelect' | 'edit'>> {
  caption: string;
}

/** A host that only shows the rules and reports the hovered cell. */
const ReadOnlyDemo = ({ caption, ...props }: ReadOnlyDemoProps) => {
  const [hovered, setHovered] = useState<SentenceCellId | null>(null);
  return (
    <div className="flex h-[480px] flex-col gap-2">
      <DecisionText
        rules={GRID_SENTENCE_RULES}
        bands={TYPED_GRID_BANDS}
        header={GRID_SENTENCE_HEADER}
        labels={DECISION_TEXT_LABELS}
        ariaLabel="Rules"
        dataTestId="decision-text"
        onCellHover={setHovered}
        {...props}
      />
      <StoryCaption>Hovered cell: {cellText(hovered)}</StoryCaption>
      <StoryCaption>{caption}</StoryCaption>
    </div>
  );
};

interface SelectionDemoProps
  extends Partial<Omit<DecisionTextProps, 'selected' | 'onSelect' | 'edit'>> {
  caption: string;
  initialSelected?: SentenceSelection | null;
}

/** A host that owns the selection, as it owns the grid's. */
const SelectionDemo = ({ caption, initialSelected = null, ...props }: SelectionDemoProps) => {
  const [selected, setSelected] = useState(initialSelected);
  return (
    <div className="flex h-[480px] flex-col gap-2">
      <DecisionText
        rules={GRID_SENTENCE_RULES}
        bands={GRID_SENTENCE_BANDS}
        header={GRID_SENTENCE_HEADER}
        labels={DECISION_TEXT_LABELS}
        ariaLabel="Rules"
        dataTestId="decision-text"
        selected={selected}
        onSelect={setSelected}
        {...props}
      />
      <StoryCaption>Selected: {selectionText(selected)}</StoryCaption>
      <StoryCaption>{caption}</StoryCaption>
    </div>
  );
};

const DEMO_MARKS: TableMarks = {
  rows: new Map<string, RowMark>([
    [
      'm1',
      {
        cells: {
          debt: { tone: 'error', title: 'Not a number', glyph: true },
          country: { tone: 'warning', title: 'Overlaps row 2', glyph: true },
        },
      },
    ],
    [
      'm3',
      {
        cells: {
          score: { tone: 'warning', title: 'Overlaps row 4', glyph: true },
          channel: { tone: 'error', title: 'Unknown channel', glyph: true },
        },
      },
    ],
    ['m5', { tone: 'warning', title: 'Never reached', glyph: true }],
  ]),
  columns: new Map([['start', { tone: 'warning', title: 'No type', glyph: true }]]),
};

/** What the story host writes a value committed without an operator with. */
type ValueWrite = (table: EditableTable, target: SentenceValueId, text: string) => EditableTable;

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

const TYPED_GRID_BANDS = typedBands(GRID_SENTENCE_BANDS);

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
  return {
    icon: columnIcon(cell.columnId, edits),
    operators: switchable ? CONDITION_OPERATORS : undefined,
    operator: condition?.operator ?? 'is',
    allowedValues: allowedValuesOf(cell.columnId, edits),
    values: multiple ? condition?.values : undefined,
    ends: condition?.ends,
    inOrder: columnTypeOf(cell.columnId, edits) === 'number' ? numberOrder : undefined,
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
  renderEditor?: DecisionTextEdit['renderEditor'];
  writeValue?: ValueWrite;
  onStartEdit?: () => void;
  frameClassName?: string;
}

/** A host that owns the table, the selection and the edit, words the table back after every write, and refuses an empty condition. */
const TableHost = ({
  initialTable,
  caption,
  mode = 'edit',
  validate = false,
  renderEditor,
  writeValue = tableWithValue,
  onStartEdit,
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
  const marks = useMemo(() => (validate ? validationMarks(table) : NO_MARKS), [table, validate]);

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
    onStartEdit: (value) => {
      onStartEdit?.();
      open(value);
    },
    onCommit: (value, commit) => {
      const [text = ''] = commit.values;
      if (!isOutput(table, value.columnId) && text.trim() === '') {
        setRefusal(
          `Not saved: the ${columnName(value.columnId)} condition needs a value. Type one, press Escape, or remove the condition.`
        );
        return;
      }
      setTable(
        commit.operator === undefined
          ? writeValue(table, value, text)
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
  render: () => <ReadOnlyDemo caption="Read only: no selection and no editing." />,
};

export const WithMarks: Story = {
  render: () => (
    <ReadOnlyDemo
      rules={MULTI_SENTENCE_RULES}
      bands={MULTI_SENTENCE_BANDS}
      header={MULTI_SENTENCE_HEADER}
      numbered
      marks={DEMO_MARKS}
      headerMark={{ tone: 'error', title: 'Collect returns a list, not one value', glyph: true }}
      caption="The grid's marks on values, rules, band columns and the header. Each glyph's message is read with its line, and shows as a tooltip on hover or focus."
    />
  ),
};

export const Selection: Story = {
  render: () => (
    <div className="w-[420px]">
      <SelectionDemo
        numbered
        initialSelected={{ rowId: 'r2', columnId: 'income' }}
        caption="Click a value or a rule. Arrows, Home and End move, Tab walks a rule's values, Escape clears."
      />
    </div>
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
      <ReadOnlyDemo
        rules={[]}
        ariaLabel="Rules without an add action"
        dataTestId="decision-text-no-add"
        caption="Without addRule there is no add action."
      />
    </div>
  ),
};

const MANY_COLUMNS = manyColumnBands(50);
const MANY_LINES = [manyLinesRule(50)];

export const ManyColumns: Story = {
  render: () => (
    <SelectionDemo
      bands={MANY_COLUMNS}
      rules={MANY_LINES}
      header={MULTI_SENTENCE_HEADER}
      caption="50 band columns scroll on one line, and a 50-line rule is taller than the view."
    />
  ),
};

const MANY_RULES = manyRulesTable(50_000, 10_000);

export const ManyRules: Story = {
  render: () => (
    <TableHost
      initialTable={MANY_RULES}
      validate
      caption="50,001 rules, windowed, with editing on. Rule 1 lists 10,000 channels: 20 show, then a count. Marks follow each edit, and an empty condition is refused."
    />
  ),
};

export const Editing: Story = {
  render: () => (
    <TableHost
      initialTable={EDITABLE_TABLE}
      caption="Click an input or output above the rules to edit its label, expression or name, type and allowed values: Enter applies, Escape cancels, and More properties hands the column to the host. Click a value, or press Enter on a cell, to open its popover: the column, the condition's operator, and the value, a range's two ends or a list's values, or the column's allowed values. Enter applies and moves down, Tab moves through the popover's fields and from its last one to the next cell, Escape cancels, and a click outside applies in place. Delete or a ✕ removes a condition or clears an outcome. + adds a condition: its line waits in the rule until Apply. ⋯ inserts, duplicates, moves, clears or deletes the rule, and the bin deletes it. The header picks the hit policy; Collect and total opens its totals, Sum refused. income and channel come from other decisions: click either, or press Alt+Enter on its cell, to open it."
    />
  ),
};

interface ExpressionEditorProps {
  context: SentenceEditorContext;
  onOpen: () => void;
}

/** The story's expression editor: a monospace input that tells the host it opened, so its commit writes an expression. */
const ExpressionEditor = ({ context, onOpen }: ExpressionEditorProps) => {
  useEffect(() => onOpen(), [onOpen]);
  return (
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
};

const HostEditorDemo = () => {
  const [expression, setExpression] = useState(false);
  const renderEditor = (context: SentenceEditorContext) => (
    <ExpressionEditor context={context} onOpen={() => setExpression(true)} />
  );
  return (
    <TableHost
      initialTable={EDITABLE_TABLE}
      renderEditor={renderEditor}
      writeValue={expression ? tableWithExpression : tableWithValue}
      onStartEdit={() => setExpression(false)}
      caption="With renderEditor the popover offers Edit expression, which swaps the value for the host's editor; a condition applied from it reads as matches."
    />
  );
};

export const HostEditor: Story = {
  render: () => <HostEditorDemo />,
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
        caption="One host, wired a step at a time. Read passes the rules, the marks and onOpenDecision for the linked income and channel, Select adds selected and onSelect, Edit adds edit, addRule and the hit policy picker. The host validates after each write and marks a number input holding text or an empty outcome."
      />
    </div>
  );
};

export const EndToEnd: Story = {
  render: () => <EndToEndDemo />,
};

/** A rule-card state: what drives it, and the card it draws. */
interface CardState {
  id: string;
  label: string;
  source: string;
  rules: readonly SentenceRule[];
  marks?: TableMarks;
  selected?: SentenceSelection;
  readOnly?: boolean;
  editing?: SentenceValueId;
  /** The card's width when not the canvas's 704px. */
  cardWidth?: number;
}

interface CardSection {
  id: string;
  label: string;
  states: readonly CardState[];
}

const stateName = (
  kind: SentenceNameToken['kind'],
  columnId: string,
  text: string
): SentenceNameToken => ({ kind, columnId, text });

const stateValue = (columnId: string, text: string, index = 0): SentenceValueToken => ({
  kind: 'value',
  columnId,
  index,
  text,
});

const SCORE = stateName('input', 'score', 'Score');
const MONTHS = stateName('input', 'months', 'Months employed');
const FIELD = stateName('input', 'field', 'Field');
const DEBT = stateName('input', 'debt', 'Debt ratio');
const RATE = stateName('output', 'rate', 'Rate');
const TERM = stateName('output', 'term', 'Term');

const rateIs = (text: string): SentencePart[] => [RATE, ' is ', stateValue('rate', text)];
const atLeast = (name: SentenceNameToken, text: string): SentenceLine => ({
  columnId: name.columnId,
  parts: [name, ' is at least ', stateValue(name.columnId, text)],
});
const whenScoreAtLeast = (text: string): SentencePart[] => [
  'when ',
  SCORE,
  ' is at least ',
  stateValue('score', text),
];
const ALL_TRUE = ['when all of these are true:'];

const NAMED: SentenceRule = {
  rowId: 'named',
  heading: rateIs('Prime'),
  lead: ALL_TRUE,
  lines: [atLeast(SCORE, '700'), atLeast(MONTHS, '12')],
};
const SECOND: SentenceRule = {
  rowId: 'second',
  heading: rateIs('Standard'),
  lead: ALL_TRUE,
  lines: [atLeast(SCORE, '640'), atLeast(MONTHS, '6')],
};
const ALWAYS: SentenceRule = {
  rowId: 'third',
  heading: rateIs('Refer'),
  lead: ['in every case'],
  lines: [],
};
const ONE: SentenceRule = {
  rowId: 'one',
  heading: rateIs('Prime'),
  lead: whenScoreAtLeast('700'),
  lines: [],
};
const MANY: SentenceRule = {
  rowId: 'many',
  heading: rateIs('Prime'),
  lead: ALL_TRUE,
  lines: [
    atLeast(SCORE, '700'),
    atLeast(MONTHS, '12'),
    {
      columnId: 'field',
      parts: [
        FIELD,
        ' is ',
        stateValue('field', 'Medicine'),
        ' or ',
        stateValue('field', 'Law', 1),
      ],
    },
    { columnId: 'debt', parts: [DEBT, ' is less than ', stateValue('debt', '0.4')] },
  ],
};
const UNSET: SentenceRule = {
  rowId: 'unset',
  heading: rateIs(''),
  lead: whenScoreAtLeast('650'),
  lines: [],
};
const FEEL: SentenceRule = {
  rowId: 'feel',
  heading: rateIs('base * 1.2'),
  lead: whenScoreAtLeast('600'),
  lines: [],
};
const TWO: SentenceRule = {
  rowId: 'two',
  heading: [...rateIs('Prime'), ' and ', TERM, ' is ', stateValue('term', '30 years')],
  lead: whenScoreAtLeast('700'),
  lines: [],
};
const FIELDS = ['Medicine', 'Law', 'Engineering', 'Architecture', 'Accounting'];
const LONG: SentenceRule = {
  rowId: 'longsentence',
  heading: rateIs('Prime'),
  lead: ALL_TRUE,
  lines: [
    {
      columnId: 'score',
      parts: [
        SCORE,
        ' is between ',
        stateValue('score', '700'),
        ' and ',
        stateValue('score', '850', 1),
      ],
    },
    atLeast(MONTHS, '120'),
    {
      columnId: 'field',
      parts: [
        FIELD,
        ' is ',
        ...FIELDS.flatMap((text, index): SentencePart[] => [
          ...(index === 0 ? [] : [index === FIELDS.length - 1 ? ' or ' : ', ']),
          stateValue('field', text, index),
        ]),
      ],
    },
    { columnId: 'debt', parts: [DEBT, ' is less than ', stateValue('debt', '0.25')] },
  ],
};

const rowMarks = (entries: Record<string, RowMark>): TableMarks => ({
  rows: new Map(Object.entries(entries)),
  columns: new Map(),
});

const RULE_WARNING = rowMarks({
  named: { tone: 'warning', glyph: true, title: 'This rule overlaps rule 2.' },
});
const RULE_ERROR = rowMarks({
  named: { tone: 'error', glyph: true, title: 'This rule can never match.' },
});
const FIRED = rowMarks({
  named: {
    tone: 'success',
    cells: {
      score: { matched: true, title: 'Score: 742' },
      months: { matched: true, title: 'Months employed: 26' },
    },
  },
});

const RULE_SELECTED = { rowId: 'named' };

const CARD_SECTIONS: readonly CardSection[] = [
  {
    id: 'interaction',
    label: 'Interaction',
    states: [
      { id: 'rest', label: 'Rest', source: '—', rules: [NAMED] },
      {
        id: 'selected',
        label: 'Selected',
        source: 'selected: rule',
        rules: [NAMED],
        selected: RULE_SELECTED,
      },
      { id: 'read-only', label: 'Read-only', source: 'no edit', rules: [NAMED], readOnly: true },
      {
        id: 'read-only-selected',
        label: 'Read-only, selected',
        source: 'no edit + selected',
        rules: [NAMED],
        readOnly: true,
        selected: RULE_SELECTED,
      },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    states: [
      {
        id: 'always',
        label: 'No conditions (last rule)',
        source: 'every input "-"',
        rules: [ALWAYS],
      },
      { id: 'one', label: 'One condition', source: 'one input set', rules: [ONE] },
      { id: 'many', label: 'Many conditions', source: 'four inputs set', rules: [MANY] },
      { id: 'unset', label: 'Result not set', source: 'output ""', rules: [UNSET] },
      {
        id: 'unset-ro',
        label: 'Result not set, read-only',
        source: 'output "", no edit',
        rules: [UNSET],
        readOnly: true,
      },
      { id: 'feel', label: 'Expression result', source: 'output base * 1.2', rules: [FEEL] },
      { id: 'two-outputs', label: 'Two outputs', source: 'two outputs', rules: [TWO] },
      { id: 'long-sentence', label: 'Long conditions', source: 'wraps', rules: [LONG] },
      {
        id: 'long-sentence-narrow',
        label: 'Long conditions, 420px',
        source: 'wraps; Field selected',
        rules: [LONG],
        selected: { rowId: 'longsentence', columnId: 'field' },
        cardWidth: 420,
      },
    ],
  },
  {
    id: 'validation',
    label: 'Validation',
    states: [
      {
        id: 'rule-warning',
        label: 'Rule warning',
        source: 'rows: warning, glyph',
        rules: [NAMED],
        marks: RULE_WARNING,
      },
      {
        id: 'rule-error',
        label: 'Rule error',
        source: 'rows: error, glyph',
        rules: [NAMED],
        marks: RULE_ERROR,
      },
      {
        id: 'rule-error-selected',
        label: 'Rule error, selected',
        source: 'rows: error + selected',
        rules: [NAMED],
        marks: RULE_ERROR,
        selected: RULE_SELECTED,
      },
      {
        id: 'rule-warning-read-only',
        label: 'Rule warning, read-only',
        source: 'rows: warning + no edit',
        rules: [NAMED],
        marks: RULE_WARNING,
        readOnly: true,
      },
      {
        id: 'condition-warning',
        label: 'Condition warning',
        source: 'cells[score]: warning, glyph',
        rules: [NAMED],
        marks: rowMarks({
          named: {
            cells: {
              score: {
                tone: 'warning',
                glyph: true,
                title: "700 is outside Score's allowed values.",
              },
            },
          },
        }),
      },
      {
        id: 'result-error',
        label: 'Result error',
        source: 'rows + cells[rate]: error',
        rules: [UNSET],
        marks: rowMarks({
          unset: {
            tone: 'error',
            glyph: true,
            title: 'Set a result.',
            cells: { rate: { tone: 'error', glyph: true, title: 'Set a result.' } },
          },
        }),
      },
    ],
  },
  {
    id: 'execution',
    label: 'Execution',
    states: [
      {
        id: 'fired',
        label: 'Fired',
        source: 'rows: success; cells matched',
        rules: [NAMED],
        marks: FIRED,
      },
      {
        id: 'not-fired',
        label: 'Evaluated, not fired',
        source: 'cells: success / error',
        rules: [NAMED],
        marks: rowMarks({
          named: {
            cells: {
              score: { tone: 'success', matched: true, title: 'Score: 742' },
              months: { tone: 'error', matched: false, title: 'Months employed: 8' },
            },
          },
        }),
      },
      {
        id: 'not-evaluated',
        label: 'Not evaluated',
        source: 'rows: dim',
        rules: [NAMED],
        marks: rowMarks({ named: { dim: true, title: 'Not evaluated' } }),
      },
      {
        id: 'not-reached',
        label: 'Not reached',
        source: 'rows: dim (after the fired rule)',
        rules: [SECOND],
        marks: rowMarks({ second: { dim: true, title: 'Not reached: an earlier rule fired' } }),
      },
      {
        id: 'fired-ro',
        label: 'Fired, read-only',
        source: 'no edit + success',
        rules: [NAMED],
        marks: FIRED,
        readOnly: true,
      },
    ],
  },
  {
    id: 'editing',
    label: 'Editing',
    states: [
      {
        id: 'condition-editor',
        label: 'Condition editor open',
        source: 'editing: score',
        rules: [NAMED],
        selected: { rowId: 'named', columnId: 'score' },
        editing: { rowId: 'named', columnId: 'score', index: 0 },
      },
      {
        id: 'outcome-editor',
        label: 'Result editor open',
        source: 'editing: rate',
        rules: [NAMED],
        selected: { rowId: 'named', columnId: 'rate' },
        editing: { rowId: 'named', columnId: 'rate', index: 0 },
      },
    ],
  },
];

const STATE_HEADER = { label: 'First', hint: 'Stops at the first matching rule.' };

const ignore = () => undefined;

/** The editing a state tile wires: the open value, its popover and its menus, every action a no-op. */
const stateEdit = (editing: SentenceValueId | undefined): DecisionTextEdit => ({
  editing: editing ?? null,
  onStartEdit: ignore,
  onCommit: ignore,
  onCancel: ignore,
  valueField: (cell) =>
    cell.columnId === 'rate'
      ? { icon: <Type className={TYPE_ICON_CLASS} /> }
      : {
          icon: <Hash className={TYPE_ICON_CLASS} />,
          operators: SINGLE_VALUE_OPERATORS,
          operator: 'is at least',
        },
  onClearCell: ignore,
  conditionEntries: () => [],
  ruleEntries: () => [],
  onDeleteRule: ignore,
  labels: DECISION_TEXT_EDIT_LABELS,
});

/** The list's side padding, so a tile's card is its stated width. */
const LIST_GUTTERS_PX = 64;
const CARD_WIDTH_PX = 704;

interface StateTileProps {
  state: CardState;
}

const StateTile = ({ state }: StateTileProps) => {
  const width = (state.cardWidth ?? CARD_WIDTH_PX) + LIST_GUTTERS_PX;
  const host = state.readOnly
    ? { selected: state.selected ?? null }
    : {
        selected: state.selected ?? null,
        onSelect: ignore,
        edit: stateEdit(state.editing),
      };
  return (
    <figure className="m-0 flex flex-col gap-1" data-state={state.id}>
      <figcaption className="flex items-baseline gap-2 ps-8 text-xs">
        <span className="font-semibold text-foreground">{state.label}</span>
        <span className="font-mono text-[11px] text-foreground-de-emp">{state.source}</span>
      </figcaption>
      <div className={`flex flex-col ${state.editing ? 'h-[360px]' : ''}`} style={{ width }}>
        <DecisionText
          rules={state.rules}
          bands={[]}
          header={STATE_HEADER}
          numbered
          marks={state.marks}
          labels={DECISION_TEXT_LABELS}
          ariaLabel={state.label}
          dataTestId={`state-${state.id}`}
          {...host}
        />
      </div>
    </figure>
  );
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      {CARD_SECTIONS.map((section) => (
        <section key={section.id} id={`states-${section.id}`} className="flex flex-col gap-4">
          <h2 className="m-0 text-sm font-semibold text-foreground">{section.label}</h2>
          {section.states.map((state) => (
            <StateTile key={state.id} state={state} />
          ))}
        </section>
      ))}
    </div>
  ),
};
