import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  EDITABLE_TABLE,
  tableColumns,
  tableWithExpression,
  tableWithNewInput,
  tableWithValue,
  wordedRules,
} from './__fixtures__/editableSentences.fixtures';
import { installEscapeCloseRequest, pressOutside } from './__fixtures__/modalDialog';
import {
  GRID_SENTENCE_POLICY,
  HIT_POLICIES,
  COLUMN_TYPES,
  type FixtureOperator,
  type FixtureRefusal,
  wordRefusal,
} from './__fixtures__/sentences.fixtures';
import { type FixtureEdit, outcomeField } from './__fixtures__/textMode';
import { DecisionText } from './DecisionText';
import type { SentenceSelection, SentenceValueId } from './sentenceTypes';
import type { ValueCommit } from './valueTypes';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');
afterEach(cleanup);
let uninstallEscape: () => void = () => {};
beforeAll(() => {
  uninstallEscape = installEscapeCloseRequest();
});
afterAll(() => uninstallEscape());

const r3Age: SentenceValueId = { rowId: 'r3', columnId: 'age', index: 0 };
const NOT_A_NUMBER = 'Not saved: age needs a number.';

type Answer = (commit: ValueCommit<FixtureOperator>) => FixtureRefusal | undefined;

const textOf = (commit: ValueCommit<FixtureOperator>): string => {
  switch (commit.kind) {
    case 'expression':
      return commit.text;
    case 'outcome':
    case 'single':
      return commit.value;
    default:
      return '';
  }
};

/** Refuses any text that is not a number, as a host's validation would. */
const numbersOnly: Answer = (commit) => {
  const text = textOf(commit);
  return Number.isNaN(Number(text)) ? { reason: 'note', text: NOT_A_NUMBER } : undefined;
};

interface HostProps {
  answer?: Answer;
  addInput?: FixtureEdit['onAddInput'];
  /** The host keeps `editing`, starting here; undefined leaves it to the view. */
  controlled?: SentenceValueId | null;
  /** Whether a controlled host also closes the editor on a refusal. */
  closesOnRefusal?: boolean;
  onCommit?: FixtureEdit['onCommit'];
  valueField?: FixtureEdit['valueField'];
  clear?: FixtureEdit['onClearCell'];
  words?: FixtureEdit['wordRefusal'];
  editable?: boolean;
}

const Host = ({
  answer = () => undefined,
  controlled,
  closesOnRefusal = false,
  onCommit,
  valueField = outcomeField,
  clear = () => undefined,
  words = wordRefusal,
  editable = true,
  addInput,
}: HostProps) => {
  const [table, setTable] = useState(EDITABLE_TABLE);
  const [selected, setSelected] = useState<SentenceSelection | null>(null);
  const [editing, setEditing] = useState(controlled ?? null);
  const hostKeeps = controlled !== undefined;
  const edit: FixtureEdit = {
    ...(hostKeeps ? { editing, onStartEdit: setEditing, onCancel: () => setEditing(null) } : {}),
    valueField,
    wordRefusal: words,
    onCommit: (value, commit, move) => {
      onCommit?.(value, commit, move);
      const refusal = answer(commit);
      if (refusal === undefined || closesOnRefusal) setEditing(null);
      if (refusal !== undefined) return refusal;
      setTable((current) =>
        commit.kind === 'expression'
          ? tableWithExpression(current, value, commit.text)
          : tableWithValue(current, value, textOf(commit))
      );
      return undefined;
    },
    onClearCell: clear,
    onDeleteRule: vi.fn(),
    inputIds: table.inputs.map((input) => input.id),
    onAddInput:
      addInput ??
      (() => {
        const [next, columnId] = tableWithNewInput(table);
        setTable(next);
        return columnId;
      }),
  };
  return (
    <DecisionText
      table={{ rules: wordedRules(table), ...tableColumns(table), hitPolicy: GRID_SENTENCE_POLICY }}
      hitPolicies={HIT_POLICIES}
      columnTypes={COLUMN_TYPES}
      ariaLabel="Rules"
      dataTestId="nl"
      mode={
        editable
          ? {
              kind: 'edit',
              selected,
              onSelect: setSelected,
              edit,
              onPolicyChange: vi.fn(),
              onAddRule: vi.fn(),
              onUndo: () => {},
              onRedo: () => {},
            }
          : { kind: 'select', selected, onSelect: setSelected }
      }
    />
  );
};

const card = (rowId: string) => screen.getByTestId(`nl-row-${rowId}`);
const chip = (rowId: string, columnId: string) => {
  const found = card(rowId).querySelector<HTMLElement>(
    `[data-kind="value"][data-column-id="${columnId}"]`
  );
  if (!found) throw new Error(`no ${columnId} value in ${rowId}`);
  return found;
};
const dialog = () => screen.queryByTestId('nl-value-editor');
const popover = () => {
  const open = dialog();
  if (!open) throw new Error('no open popover');
  return within(open);
};
const field = () => screen.getByTestId('nl-editor') as HTMLInputElement;
const apply = () => fireEvent.click(popover().getByRole('button', { name: 'Apply' }));
const type = (text: string) => fireEvent.change(field(), { target: { value: text } });
const alerts = () => popover().queryAllByRole('alert');
const openAge = () => fireEvent.click(chip('r3', 'age'));

describe('DecisionText editing state', () => {
  describe('without `editing` from the host', () => {
    it('opens a clicked value, applies it and closes, with no onStartEdit or onCancel', () => {
      const onCommit = vi.fn();
      render(<Host onCommit={onCommit} />);
      openAge();
      expect(field()).toHaveValue('60');
      type('70');
      apply();
      expect(onCommit.mock.calls).toEqual([[r3Age, { kind: 'outcome', value: '70' }, 'none']]);
      expect(dialog()).toBeNull();
      expect(chip('r3', 'age')).toHaveTextContent('70');
    });

    it('closes on Escape without the host, and opens the next value clicked', () => {
      render(<Host />);
      openAge();
      fireEvent.keyDown(field(), { key: 'Escape' });
      expect(dialog()).toBeNull();
      fireEvent.click(chip('r1', 'income'));
      expect(field()).toHaveValue('40000');
    });

    it('opens a condition from the add-condition menu, and from Add input on the new input', () => {
      render(<Host />);
      const add = within(card('r3')).getByRole('button', { name: 'Add condition to rule 3' });
      fireEvent.click(add);
      fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'income' }));
      expect(field()).toHaveAccessibleName('New income condition, rule 3');
      fireEvent.keyDown(field(), { key: 'Escape' });
      fireEvent.click(add);
      fireEvent.click(
        within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Add input column' })
      );
      expect(field()).toHaveAccessibleName('New Input 4 condition, rule 3');
    });

    it.each<[string, SentenceValueId | null | undefined]>([
      ['the view', undefined],
      ['the host', null],
    ])('opens nothing, and keeps focus in the view, for an added input no band lists, while %s keeps editing', (_, controlled) => {
      render(<Host controlled={controlled} addInput={() => 'ghost'} />);
      fireEvent.click(within(card('r3')).getByRole('button', { name: 'Add condition to rule 3' }));
      fireEvent.click(
        within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Add input column' })
      );
      expect(dialog()).toBeNull();
      expect(card('r3').querySelector('li[data-pending]')).toBeNull();
      expect(screen.getByTestId('nl').contains(document.activeElement)).toBe(true);
    });

    it('drops the open value while the host removes editing, so it does not reopen when editing returns', () => {
      const { rerender } = render(<Host />);
      openAge();
      rerender(<Host editable={false} />);
      expect(dialog()).toBeNull();
      rerender(<Host />);
      expect(dialog()).toBeNull();
    });
  });

  describe('a host that refuses a commit', () => {
    it.each<[string, SentenceValueId | null | undefined]>([
      ['the view', undefined],
      ['the host', null],
    ])('keeps the draft and shows the reason in the popover, announced, while %s keeps editing', (_, controlled) => {
      const onCommit = vi.fn();
      render(<Host answer={numbersOnly} controlled={controlled} onCommit={onCommit} />);
      openAge();
      type('old');
      apply();
      expect(onCommit).toHaveBeenCalledTimes(1);
      expect(field()).toHaveValue('old');
      const [alert, ...more] = alerts();
      expect(more).toEqual([]);
      expect(alert).toHaveTextContent(NOT_A_NUMBER);
      expect(field().getAttribute('aria-describedby')?.split(' ')).toContain(alert?.id);
      expect(chip('r3', 'age')).toHaveTextContent('60');
    });

    it('announces a second refusal of the same draft again, from Enter pressed twice', () => {
      const onCommit = vi.fn();
      render(<Host answer={numbersOnly} onCommit={onCommit} />);
      openAge();
      type('old');
      fireEvent.keyDown(field(), { key: 'Enter' });
      const first = alerts()[0];
      fireEvent.keyDown(field(), { key: 'Enter' });
      const second = alerts()[0];
      expect(onCommit).toHaveBeenCalledTimes(2);
      expect(second).toHaveTextContent(NOT_A_NUMBER);
      expect(second).not.toBe(first);
      expect(first?.isConnected).toBe(false);
      expect(alerts()).toHaveLength(1);
    });

    it('keeps the reason while the draft is edited, and applies and closes once the host accepts', () => {
      render(<Host answer={numbersOnly} />);
      openAge();
      type('old');
      apply();
      type('7');
      expect(alerts()).toHaveLength(1);
      apply();
      expect(dialog()).toBeNull();
      expect(chip('r3', 'age')).toHaveTextContent('7');
    });

    it('closes on Escape after a refusal, and reopens the value without the reason', () => {
      const onCommit = vi.fn();
      render(<Host answer={numbersOnly} onCommit={onCommit} />);
      openAge();
      type('old');
      apply();
      fireEvent.keyDown(field(), { key: 'Escape' });
      expect(dialog()).toBeNull();
      expect(onCommit).toHaveBeenCalledTimes(1);
      openAge();
      expect(field()).toHaveValue('60');
      expect(alerts()).toEqual([]);
      expect(field()).not.toHaveAttribute('aria-describedby');
    });

    it('asks the host again on a press outside after a refusal, and stays open while it refuses', () => {
      const onCommit = vi.fn();
      render(<Host answer={numbersOnly} onCommit={onCommit} />);
      openAge();
      type('old');
      apply();
      const open = dialog();
      if (!open) throw new Error('no open popover');
      pressOutside(open);
      expect(onCommit).toHaveBeenCalledTimes(2);
      expect(dialog()).toBe(open);
      expect(alerts()).toHaveLength(1);
      expect(field()).toHaveValue('old');
    });

    it('moves nowhere on a refused Enter', () => {
      render(<Host answer={numbersOnly} />);
      openAge();
      type('old');
      fireEvent.keyDown(field(), { key: 'Enter' });
      expect(dialog()).not.toBeNull();
      expect(document.activeElement).toBe(field());
    });

    it('closes when a host that keeps editing closes it as it refuses', () => {
      render(<Host answer={numbersOnly} controlled={null} closesOnRefusal />);
      openAge();
      type('old');
      apply();
      expect(dialog()).toBeNull();
      openAge();
      expect(alerts()).toEqual([]);
    });

    it("words a refusal with the cell's column name and the values it refused", () => {
      render(<Host answer={() => ({ reason: 'not-a-value' })} />);
      openAge();
      type('old');
      apply();
      expect(alerts().map((alert) => alert.textContent)).toEqual([
        'Not saved: old is not a value age can take.',
      ]);
    });

    it('stays open without a reason for a blank refusal', () => {
      render(<Host answer={() => ({ reason: 'note', text: ' ' })} />);
      openAge();
      type('old');
      apply();
      expect(field()).toHaveValue('old');
      expect(alerts()).toEqual([]);
    });
  });

  describe('a host that refuses a clear', () => {
    it('keeps the open editor and shows the reason in it, announcing nothing else', () => {
      render(<Host controlled={r3Age} clear={() => ({ reason: 'not-a-value' })} />);
      fireEvent.click(screen.getByRole('button', { name: 'Remove age from rule 3' }));
      expect(dialog()).not.toBeNull();
      expect(alerts().map((alert) => alert.textContent)).toEqual([
        'Not saved: age cannot be empty.',
      ]);
      expect(screen.getByTestId('nl-live').textContent).toBe('');
    });

    it('words a refused clear apart from a refused commit of no values', () => {
      const words = vi.fn(wordRefusal);
      render(
        <Host
          answer={() => ({ reason: 'not-a-value' })}
          clear={() => ({ reason: 'not-a-value' })}
          words={words}
          controlled={r3Age}
        />
      );
      type('');
      apply();
      fireEvent.click(screen.getByRole('button', { name: 'Remove age from rule 3' }));
      expect(words.mock.calls.map(([, context]) => context)).toEqual([
        { action: 'commit', column: 'age', values: '' },
        { action: 'clear', column: 'age' },
      ]);
    });
  });

  describe('a host that refuses an expression', () => {
    const expression = () => screen.getByTestId('nl-editor-expression-editor') as HTMLInputElement;
    const editExpression = (text: string) => {
      openAge();
      fireEvent.click(popover().getByRole('button', { name: 'Edit expression' }));
      fireEvent.change(expression(), { target: { value: text } });
    };

    it.each<[string, SentenceValueId | null | undefined]>([
      ['the view', undefined],
      ['the host', null],
    ])('keeps the text and focus in the editor and shows the reason on a refused Enter, while %s keeps editing', (_, controlled) => {
      const onCommit = vi.fn();
      render(<Host answer={numbersOnly} controlled={controlled} onCommit={onCommit} />);
      editExpression('> x');
      fireEvent.keyDown(expression(), { key: 'Enter' });
      expect(onCommit.mock.calls).toEqual([[r3Age, { kind: 'expression', text: '> x' }, 'down']]);
      expect(alerts().map((alert) => alert.textContent)).toEqual([NOT_A_NUMBER]);
      expect(expression()).toHaveValue('> x');
      expect(document.activeElement).toBe(expression());
      expect(chip('r3', 'age')).toHaveTextContent('60');
    });

    it('keeps the reason while the text is edited, and applies and closes once the host accepts', () => {
      render(<Host answer={numbersOnly} />);
      editExpression('> x');
      apply();
      fireEvent.change(expression(), { target: { value: '7' } });
      expect(alerts()).toHaveLength(1);
      fireEvent.keyDown(expression(), { key: 'Enter' });
      expect(dialog()).toBeNull();
      expect(chip('r3', 'age')).toHaveTextContent('7');
    });

    it('closes on Escape after a refusal, and reopens the value without the reason', () => {
      const onCommit = vi.fn();
      render(<Host answer={numbersOnly} onCommit={onCommit} />);
      editExpression('> x');
      apply();
      fireEvent.keyDown(expression(), { key: 'Escape' });
      expect(dialog()).toBeNull();
      expect(onCommit).toHaveBeenCalledTimes(1);
      openAge();
      expect(field()).toHaveValue('60');
      expect(alerts()).toEqual([]);
    });

    it('asks the host again on a press outside after a refusal, and stays open while it refuses', () => {
      const onCommit = vi.fn();
      render(<Host answer={numbersOnly} onCommit={onCommit} />);
      editExpression('> x');
      apply();
      const open = dialog();
      if (!open) throw new Error('no open popover');
      pressOutside(open);
      expect(onCommit).toHaveBeenCalledTimes(2);
      expect(dialog()).toBe(open);
      expect(alerts()).toHaveLength(1);
      expect(expression()).toHaveValue('> x');
    });
  });

  describe('a host that switches', () => {
    it('keeps the open value when the host stops passing editing, and then runs it itself', () => {
      const { rerender } = render(<Host controlled={r3Age} />);
      expect(field()).toHaveValue('60');
      rerender(<Host />);
      expect(field()).toHaveValue('60');
      fireEvent.keyDown(field(), { key: 'Escape' });
      expect(dialog()).toBeNull();
      openAge();
      expect(dialog()).not.toBeNull();
    });

    it("follows the host's editing once it starts passing it", () => {
      const { rerender } = render(<Host />);
      openAge();
      rerender(<Host controlled={r3Age} />);
      expect(dialog()).toBeNull();
    });

    it('commits nothing more once a host unmounts the view from its commit', () => {
      const Unmounting = () => {
        const [shown, setShown] = useState(true);
        return shown ? <Host onCommit={() => setShown(false)} /> : null;
      };
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(<Unmounting />);
      openAge();
      act(() => apply());
      expect(screen.queryByTestId('nl')).toBeNull();
      expect(errors).not.toHaveBeenCalled();
      errors.mockRestore();
    });
  });
});
