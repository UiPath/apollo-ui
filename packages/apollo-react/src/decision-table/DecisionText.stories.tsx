import type { Meta, StoryObj } from '@storybook/react';
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
import { DecisionText, type DecisionTextProps } from './DecisionText';
import type { DecisionTextEdit } from './decisionTextTypes';
import type { GridMenuEntry } from './GridMenu';
import type { Mark, RowMark, TableMarks } from './marks';
import { pickedOption } from './PolicyOptionItem';
import { valueTokenOf } from './sentenceParts';
import type {
  SentenceCellId,
  SentenceRule,
  SentenceSelection,
  SentenceValueId,
} from './sentenceTypes';
import type { SentenceEditorContext } from './valueTypes';

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
        bands={GRID_SENTENCE_BANDS}
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

interface SelectionDemoProps extends ReadOnlyDemoProps {
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

/** What the story host writes a committed value with. */
type ValueWrite = (table: EditableTable, target: SentenceValueId, text: string) => EditableTable;

/** How much of the view a host wires: rules only, then selection, then editing. */
type HostMode = 'read' | 'select' | 'edit';

const NUMERIC_INPUTS = new Set(['age', 'income']);

const NO_MARKS: TableMarks = { rows: new Map(), columns: new Map() };

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
  const rules = useMemo(() => wordedRules(table), [table]);
  const bands = useMemo(() => tableBands(table), [table]);
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
      { label: 'New input', focusesOwnSurface: true, onClick: addInput },
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
    onCommit: (value, text) => {
      if (!isOutput(table, value.columnId) && text.trim() === '') {
        setRefusal(
          `Not saved: the ${columnName(value.columnId)} condition needs a value. Type one, press Escape, or remove the condition.`
        );
        return;
      }
      setTable(writeValue(table, value, text));
      open(null);
    },
    onCancel: () => open(null),
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
        {cellText(hovered)} · Opened decision: {openedDecision ?? 'none'}
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
      caption="The grid's marks on values, rules, band columns and the header. Each glyph's message is read with its line; a host shows it on hover from data-mark-title, as the grid's host does."
    />
  ),
};

export const Selection: Story = {
  render: () => (
    <div className="w-[420px]">
      <SelectionDemo
        numbered
        initialSelected={{ rowId: 'r2', columnId: 'income' }}
        caption="Click a value or a rule. Arrows, Home and End move, Escape clears."
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
      caption="Click a value, or press Enter on a cell, to edit it. Enter commits and moves down, Tab goes to the next value and then the next cell, Escape cancels. Delete, Backspace or a ✕ removes a condition or clears an outcome. + adds a condition. ⋯ inserts, duplicates, moves, clears or deletes the rule, and the bin deletes it. The header picks the hit policy; Collect and total opens its totals, Sum refused. income and channel come from other decisions: click either, or press Alt+Enter on its cell, to open it."
    />
  ),
};

interface ExpressionSwitchEditorProps {
  context: SentenceEditorContext;
  expression: boolean;
  onSwitch: () => void;
}

const keepEditorFocus = (event: React.MouseEvent) => event.preventDefault();

/** The story's host editor: the plain input, and a switch that edits the value as an expression in place. */
const ExpressionSwitchEditor = ({ context, expression, onSwitch }: ExpressionSwitchEditorProps) => (
  <div className={expression ? 'font-mono' : undefined}>
    <CellTextEditor
      value={context.value}
      ariaLabel={context.ariaLabel}
      dataTestId="decision-text-host-editor"
      onCommit={context.onCommit}
      onCancel={context.onCancel}
    />
    <div className="flex items-center justify-between border-t border-border-de-emp px-2 py-1 text-xs text-foreground-de-emp">
      <span>{expression ? 'FEEL expression' : 'Value'}</span>
      <button
        type="button"
        className="font-medium text-primary"
        onMouseDown={keepEditorFocus}
        onClick={onSwitch}
      >
        {expression ? 'Edit as value' : 'Edit as expression'}
      </button>
    </div>
  </div>
);

const HostEditorDemo = () => {
  const [expression, setExpression] = useState(false);
  const renderEditor = (context: SentenceEditorContext) => (
    <ExpressionSwitchEditor
      context={context}
      expression={expression}
      onSwitch={() => setExpression((current) => !current)}
    />
  );
  return (
    <TableHost
      initialTable={EDITABLE_TABLE}
      renderEditor={renderEditor}
      writeValue={expression ? tableWithExpression : tableWithValue}
      onStartEdit={() => setExpression(false)}
      caption="The host renders its own editor through renderEditor. Its switch flips the mode while the value stays open, and a condition committed as an expression reads as matches."
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
