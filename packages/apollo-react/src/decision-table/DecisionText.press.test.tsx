import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { onTestFinished, vi } from 'vitest';
import {
  EDITABLE_TABLE,
  type EditableTable,
  tableBands,
  tableWithoutCell,
  tableWithoutRule,
  tableWithValue,
  unusedInputs,
  wordedRules,
} from './__fixtures__/editableSentences.fixtures';
import {
  DECISION_TEXT_EDIT_LABELS,
  DECISION_TEXT_LABELS,
  GRID_SENTENCE_HEADER,
} from './__fixtures__/sentences.fixtures';
import { CellTextEditor } from './CellTextEditor';
import { DecisionText, type DecisionTextProps } from './DecisionText';
import type { DecisionTextEdit } from './decisionTextTypes';
import type { CellCommitMove } from './gridTypes';
import type { SentenceSelection, SentenceValueId } from './sentenceTypes';

const card = (rowId: string) => screen.getByTestId(`nl-row-${rowId}`);
const button = (rowId: string, name: string) => within(card(rowId)).getByRole('button', { name });
const valueChip = (rowId: string, columnId: string) => {
  const chip = card(rowId).querySelector<HTMLElement>(
    `[data-kind="value"][data-column-id="${columnId}"]`
  );
  if (!chip) throw new Error(`no ${columnId} value in ${rowId}`);
  return chip;
};
const editor = () => screen.getByTestId('nl-editor') as HTMLInputElement;

/** Microtasks a host queued, run in a browser before the click reaches its target. */
const microtasks: (() => void)[] = [];
/** A click as a browser runs it: React flushes what the capture phase scheduled, then the queued microtasks render too, all before the target's own listeners. */
const browserClick = (target: HTMLElement, init: MouseEventInit = {}) => {
  target.addEventListener(
    'click',
    () => {
      flushSync(() => {});
      while (microtasks.length) {
        const task = microtasks.shift();
        flushSync(() => task?.());
      }
    },
    { once: true }
  );
  fireEvent.click(target, { detail: 1, ...init });
};
const mousePress = (target: HTMLElement) => {
  fireEvent.pointerDown(target, { pointerType: 'mouse' });
  fireEvent.mouseDown(target);
  act(() => target.focus());
  fireEvent.pointerUp(target, { pointerType: 'mouse' });
  fireEvent.mouseUp(target);
};

interface HostProps {
  start?: EditableTable;
  /** Closes the editor at once and writes the table a microtask later. */
  twoStep?: boolean;
  /** Writes the edit and closes the editor inside flushSync. */
  syncWrite?: boolean;
  containerProps?: DecisionTextProps['containerProps'];
  onStartEdit?: (value: SentenceValueId) => void;
  onOpenDecision?: (id: string) => void;
  onCommit?: (value: SentenceValueId, text: string, move: CellCommitMove) => void;
  closeOnEditorBlur?: boolean | 'later';
  controls?: { setTable?: (t: (table: EditableTable) => EditableTable) => void };
}

const Host = ({
  start = EDITABLE_TABLE,
  twoStep = false,
  syncWrite = false,
  containerProps,
  onStartEdit,
  onOpenDecision,
  onCommit,
  closeOnEditorBlur = false,
  controls,
}: HostProps) => {
  const [table, setTable] = useState(start);
  const [selected, setSelected] = useState<SentenceSelection | null>({ rowId: 'r1' });
  const [editing, setEditing] = useState<SentenceValueId | null>(null);
  if (controls) controls.setTable = setTable;
  const edit: DecisionTextEdit = {
    editing,
    labels: DECISION_TEXT_EDIT_LABELS,
    ruleEntries: () => [{ label: 'Delete rule', onClick: vi.fn() }],
    conditionEntries: (rowId) =>
      unusedInputs(table, rowId).map((input) => ({
        label: input.name,
        focusesOwnSurface: true,
        onClick: () => setEditing({ rowId, columnId: input.id, index: 0 }),
      })),
    onStartEdit: (value) => {
      onStartEdit?.(value);
      setEditing(value);
    },
    onCommit: (value, commit, move) => {
      const text = commit.kind === 'expression' ? commit.text : (commit.values[0] ?? '');
      onCommit?.(value, text, move);
      const write = () =>
        setTable((current) =>
          text === '' ? tableWithoutCell(current, value) : tableWithValue(current, value, text)
        );
      if (syncWrite) {
        flushSync(() => {
          write();
          setEditing(null);
        });
      } else if (twoStep) {
        setEditing(null);
        microtasks.push(write);
      } else {
        write();
        setEditing(null);
      }
    },
    onCancel: () => setEditing(null),
    onClearCell: (cell) => setTable((current) => tableWithoutCell(current, cell)),
    onDeleteRule: (rowId) => setTable((current) => tableWithoutRule(current, rowId)),
    renderEditor: closeOnEditorBlur
      ? (context) => (
          <div
            onBlur={() =>
              closeOnEditorBlur === 'later' ? setTimeout(() => setEditing(null)) : setEditing(null)
            }
          >
            <CellTextEditor
              value={context.value}
              ariaLabel={context.ariaLabel}
              dataTestId="host-editor"
              onCommit={context.onCommit}
              onCancel={context.onCancel}
            />
          </div>
        )
      : undefined,
  };
  return (
    <DecisionText
      rules={wordedRules(table)}
      bands={tableBands(table)}
      header={GRID_SENTENCE_HEADER}
      labels={DECISION_TEXT_LABELS}
      ariaLabel="Rules"
      dataTestId="nl"
      selected={selected}
      onSelect={setSelected}
      onOpenDecision={onOpenDecision}
      containerProps={containerProps}
      edit={edit}
    />
  );
};

const addChannelToR1 = () => {
  fireEvent.click(button('r1', 'Add condition to rule 1'));
  fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'channel' }));
  fireEvent.change(editor(), { target: { value: '"web"' } });
};

interface SharedViewProps {
  id: string;
  table: EditableTable;
  setTable: (change: (table: EditableTable) => EditableTable) => void;
  onStartEdit: (value: SentenceValueId) => void;
}

/** One of two views over the same table, each with its own editor. */
const SharedView = ({ id, table, setTable, onStartEdit }: SharedViewProps) => {
  const [selected, setSelected] = useState<SentenceSelection | null>({ rowId: 'r1' });
  const [editing, setEditing] = useState<SentenceValueId | null>(null);
  const edit: DecisionTextEdit = {
    editing,
    labels: DECISION_TEXT_EDIT_LABELS,
    ruleEntries: () => [],
    conditionEntries: (rowId) =>
      unusedInputs(table, rowId).map((input) => ({
        label: input.name,
        focusesOwnSurface: true,
        onClick: () => setEditing({ rowId, columnId: input.id, index: 0 }),
      })),
    onStartEdit: (value) => {
      onStartEdit(value);
      setEditing(value);
    },
    onCommit: (value, commit) => {
      const text = commit.kind === 'expression' ? commit.text : (commit.values[0] ?? '');
      setTable((current) => tableWithValue(current, value, text));
      setEditing(null);
    },
    onCancel: () => setEditing(null),
    onClearCell: (cell) => setTable((current) => tableWithoutCell(current, cell)),
    onDeleteRule: () => {},
  };
  return (
    <DecisionText
      rules={wordedRules(table)}
      bands={tableBands(table)}
      header={GRID_SENTENCE_HEADER}
      labels={DECISION_TEXT_LABELS}
      ariaLabel={`Rules ${id}`}
      dataTestId={id}
      selected={selected}
      onSelect={setSelected}
      edit={edit}
    />
  );
};

interface TwoViewsProps {
  onStartEdit: (value: SentenceValueId) => void;
}

const TwoViews = ({ onStartEdit }: TwoViewsProps) => {
  const [table, setTable] = useState(EDITABLE_TABLE);
  return (
    <>
      <SharedView id="a" table={table} setTable={setTable} onStartEdit={() => {}} />
      <SharedView id="b" table={table} setTable={setTable} onStartEdit={onStartEdit} />
    </>
  );
};

describe('DecisionText presses a commit from elsewhere moves', () => {
  it("runs a press on a value of one view that another view's blur commit moves out from under the pointer", () => {
    const onStartEdit = vi.fn();
    render(<TwoViews onStartEdit={onStartEdit} />);
    const a = screen.getByTestId('a');
    const aAge = a.querySelector<HTMLElement>('[data-kind="value"][data-column-id="age"]');
    if (!aAge) throw new Error('no age value in view a');
    fireEvent.click(aAge);
    fireEvent.change(screen.getByTestId('a-editor'), { target: { value: '3' } });
    const income = screen
      .getByTestId('b-row-r1')
      .querySelector<HTMLElement>('[data-kind="value"][data-column-id="income"]');
    if (!income) throw new Error('no income value');
    let left = 100;
    vi.spyOn(income, 'getBoundingClientRect').mockImplementation(() =>
      DOMRect.fromRect({ x: left, y: 0, width: 40, height: 20 })
    );
    screen.getByTestId('a-editor').addEventListener('blur', () => {
      left = 80;
    });
    const view = screen.getByTestId('b');
    fireEvent.pointerDown(income, { pointerType: 'mouse' });
    fireEvent.mouseDown(income);
    act(() => income.focus());
    expect(income.isConnected).toBe(true);
    fireEvent.pointerUp(view, { pointerType: 'mouse' });
    fireEvent.mouseUp(view);
    browserClick(view);
    expect(onStartEdit.mock.calls).toEqual([[{ rowId: 'r1', columnId: 'income', index: 0 }]]);
  });

  it.each<[string, 'none' | 'view' | 'value']>([
    ['no click', 'none'],
    ['a click on the view', 'view'],
    ['a click on the value that took its place', 'value'],
  ])("runs once a press on a value another view's blur commit unmounts, with %s after the release", (_, clicks) => {
    const onStartEdit = vi.fn();
    render(<TwoViews onStartEdit={onStartEdit} />);
    const a = screen.getByTestId('a');
    fireEvent.click(within(a).getByRole('button', { name: 'Add condition to rule 1' }));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'channel' }));
    fireEvent.change(screen.getByTestId('a-editor'), { target: { value: '"web"' } });
    const age = screen
      .getByTestId('b-row-r1')
      .querySelector<HTMLElement>('[data-kind="value"][data-column-id="age"]');
    if (!age) throw new Error('no age value');
    const view = screen.getByTestId('b');
    fireEvent.pointerDown(age, { pointerType: 'mouse' });
    fireEvent.mouseDown(age);
    act(() => age.focus());
    expect(age.isConnected).toBe(false);
    fireEvent.pointerUp(view, { pointerType: 'mouse' });
    fireEvent.mouseUp(view);
    const placed = screen
      .getByTestId('b-row-r1')
      .querySelector<HTMLElement>('[data-kind="value"][data-column-id="age"]');
    if (clicks === 'view') browserClick(view);
    if (clicks === 'value' && placed) browserClick(placed);
    expect(onStartEdit.mock.calls).toEqual([[{ rowId: 'r1', columnId: 'age', index: 0 }]]);
  });

  it('runs nothing for a press dragged away from a value nothing moved', () => {
    const onStartEdit = vi.fn();
    render(<TwoViews onStartEdit={onStartEdit} />);
    const age = screen
      .getByTestId('b-row-r1')
      .querySelector<HTMLElement>('[data-kind="value"][data-column-id="age"]');
    if (!age) throw new Error('no age value');
    const view = screen.getByTestId('b');
    fireEvent.pointerDown(age, { pointerType: 'mouse' });
    fireEvent.mouseDown(age);
    fireEvent.pointerUp(view, { pointerType: 'mouse' });
    fireEvent.mouseUp(view);
    browserClick(view);
    expect(onStartEdit).not.toHaveBeenCalled();
  });
});

describe('DecisionText presses that end an edit', () => {
  afterEach(() => {
    microtasks.length = 0;
  });

  it('edits a lead value the commit moves into lines, for a host that closes the editor before it writes the edit', () => {
    const onStartEdit = vi.fn();
    render(<Host twoStep onStartEdit={onStartEdit} />);
    addChannelToR1();
    onStartEdit.mockClear();
    const age = valueChip('r1', 'age');
    mousePress(age);
    browserClick(age);
    expect(valueChip('r1', 'channel')).toHaveTextContent('"web"');
    expect(onStartEdit.mock.calls).toEqual([[{ rowId: 'r1', columnId: 'age', index: 0 }]]);
  });

  it('opens a lead decision link the commit moves into lines, for a host that closes the editor before it writes the edit', () => {
    const onOpenDecision = vi.fn();
    render(<Host twoStep onOpenDecision={onOpenDecision} />);
    addChannelToR1();
    const link = button('r1', 'Open the income decision');
    mousePress(link);
    browserClick(link);
    expect(valueChip('r1', 'channel')).toHaveTextContent('"web"');
    expect(onOpenDecision.mock.calls).toEqual([['net-income']]);
  });

  it('edits the pressed value whose chip the commit reuses for another, for a host that closes the editor before it writes the edit', () => {
    const onStartEdit = vi.fn();
    render(
      <Host
        twoStep
        onStartEdit={onStartEdit}
        start={tableWithoutCell(EDITABLE_TABLE, { rowId: 'r1', columnId: 'age' })}
      />
    );
    fireEvent.click(button('r1', 'Add condition to rule 1'));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'age' }));
    fireEvent.change(editor(), { target: { value: '30' } });
    onStartEdit.mockClear();
    const income = valueChip('r1', 'income');
    mousePress(income);
    browserClick(income);
    expect(valueChip('r1', 'age')).toHaveTextContent('30');
    expect(onStartEdit.mock.calls).toEqual([[{ rowId: 'r1', columnId: 'income', index: 0 }]]);
    expect(editor()).toHaveValue('40000');
  });

  it('edits the pressed value whose chip the commit reuses, for a host that writes the edit with flushSync', () => {
    const onStartEdit = vi.fn();
    render(
      <Host
        syncWrite
        onStartEdit={onStartEdit}
        start={tableWithoutCell(EDITABLE_TABLE, { rowId: 'r1', columnId: 'age' })}
      />
    );
    fireEvent.click(button('r1', 'Add condition to rule 1'));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'age' }));
    fireEvent.change(editor(), { target: { value: '30' } });
    onStartEdit.mockClear();
    const income = valueChip('r1', 'income');
    mousePress(income);
    browserClick(income);
    expect(valueChip('r1', 'age')).toHaveTextContent('30');
    expect(onStartEdit.mock.calls).toEqual([[{ rowId: 'r1', columnId: 'income', index: 0 }]]);
  });

  it("runs the host's onClick for a press whose commit unmounts the pressed value", () => {
    const onClick = vi.fn();
    const onStartEdit = vi.fn();
    render(<Host containerProps={{ onClick }} onStartEdit={onStartEdit} />);
    addChannelToR1();
    onClick.mockClear();
    onStartEdit.mockClear();
    const age = valueChip('r1', 'age');
    mousePress(age);
    browserClick(age);
    expect(onStartEdit).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0]?.[0].currentTarget).toBe(screen.getByTestId('nl'));
  });

  it("runs the host's onClick once for a press whose commit reuses the pressed chip for another value", () => {
    const onClick = vi.fn();
    render(
      <Host
        twoStep
        containerProps={{ onClick }}
        start={tableWithoutCell(EDITABLE_TABLE, { rowId: 'r1', columnId: 'age' })}
      />
    );
    fireEvent.click(button('r1', 'Add condition to rule 1'));
    fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'age' }));
    fireEvent.change(editor(), { target: { value: '30' } });
    onClick.mockClear();
    const income = valueChip('r1', 'income');
    mousePress(income);
    browserClick(income);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('never runs a click whose bubble a native listener stops, once a later render unmounts its target', async () => {
    const onOpenDecision = vi.fn();
    const controls: HostProps['controls'] = {};
    render(<Host controls={controls} onOpenDecision={onOpenDecision} />);
    const link = button('r1', 'Open the income decision');
    link.addEventListener('click', (event) => event.stopPropagation());
    fireEvent.click(link, { detail: 1 });
    await act(() => new Promise((resolve) => setTimeout(resolve)));
    act(() => controls.setTable?.((table) => tableWithoutRule(table, 'r1')));
    expect(onOpenDecision).not.toHaveBeenCalled();
  });

  it("runs the host's onClick for a press whose commit leaves the pressed action in place", () => {
    const onClick = vi.fn();
    render(<Host containerProps={{ onClick }} />);
    addChannelToR1();
    onClick.mockClear();
    const remove = button('r2', 'Remove age from rule 2');
    mousePress(remove);
    browserClick(remove);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it.each<[string, true | 'later']>([
    ['as it loses focus', true],
    ['a task after it loses focus', 'later'],
  ])('commits the text of a host editor that closes %s, then runs the press inside the view', async (_, closes) => {
    const onCommit = vi.fn();
    render(<Host closeOnEditorBlur={closes} onCommit={onCommit} />);
    addChannelToR1();
    fireEvent.click(screen.getByRole('button', { name: 'Edit expression' }));
    act(() => screen.getByTestId('host-editor').focus());
    const remove = button('r2', 'Remove age from rule 2');
    fireEvent.pointerDown(remove, { pointerType: 'mouse' });
    fireEvent.mouseDown(remove);
    act(() => remove.focus());
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    fireEvent.pointerUp(remove, { pointerType: 'mouse' });
    fireEvent.mouseUp(remove);
    browserClick(remove);
    expect(onCommit.mock.calls).toEqual([
      [{ rowId: 'r1', columnId: 'channel', index: 0 }, '"web"', 'none'],
    ]);
    expect(card('r2').querySelector('[data-column-id="age"]')).toBeNull();
  });

  it.each<[string, string]>([
    ['its text', '"web"'],
    ['no text', ''],
  ])('keeps a pending line whose host editor closes as it loses focus, with %s, until the press it lost focus to ends', (_, text) => {
    render(<Host closeOnEditorBlur />);
    addChannelToR1();
    fireEvent.change(editor(), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Edit expression' }));
    act(() => screen.getByTestId('host-editor').focus());
    const pendingLine = () => card('r1').querySelector('li[data-pending]');
    expect(pendingLine()).not.toBeNull();
    const remove = button('r2', 'Remove age from rule 2');
    fireEvent.pointerDown(remove, { pointerType: 'mouse' });
    fireEvent.mouseDown(remove);
    act(() => remove.focus());
    expect(screen.queryByTestId('host-editor')).toBeNull();
    expect(pendingLine()).not.toBeNull();
    fireEvent.pointerUp(remove, { pointerType: 'mouse' });
    fireEvent.mouseUp(remove);
    browserClick(remove);
    expect(pendingLine()).toBeNull();
    expect(card('r2').querySelector('[data-column-id="age"]')).toBeNull();
  });

  it('commits the text of a host editor that closes when it loses focus to a press outside the view', () => {
    const onCommit = vi.fn();
    render(<Host closeOnEditorBlur onCommit={onCommit} />);
    addChannelToR1();
    fireEvent.click(screen.getByRole('button', { name: 'Edit expression' }));
    act(() => screen.getByTestId('host-editor').focus());
    const outside = document.body.appendChild(document.createElement('button'));
    onTestFinished(() => outside.remove());
    fireEvent.pointerDown(outside);
    fireEvent.mouseDown(outside);
    act(() => outside.focus());
    expect(onCommit.mock.calls).toEqual([
      [{ rowId: 'r1', columnId: 'channel', index: 0 }, '"web"', 'none'],
    ]);
  });

  it('never runs a click the host stops at capture, though a later render unmounts its target', () => {
    const onOpenDecision = vi.fn();
    const controls: HostProps['controls'] = {};
    render(
      <Host
        controls={controls}
        onOpenDecision={onOpenDecision}
        containerProps={{ onClickCapture: (event) => event.stopPropagation() }}
      />
    );
    fireEvent.click(button('r1', 'Open the income decision'), { detail: 1 });
    expect(onOpenDecision).not.toHaveBeenCalled();
    act(() =>
      controls.setTable?.((table) =>
        tableWithValue(table, { rowId: 'r1', columnId: 'channel', index: 0 }, '"app"')
      )
    );
    expect(onOpenDecision).not.toHaveBeenCalled();
  });
});
