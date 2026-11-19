import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import type { FixtureDiff } from './__fixtures__/diffSentences.fixtures';
import {
  DIFF_COLUMNS,
  DIFF_POLICY,
  DIFF_RULES,
  EVERY_STATE_DIFF,
  largeDiffTable,
} from './__fixtures__/diffSentences.fixtures';
import { manySentenceRules } from './__fixtures__/sentences.fixtures';
import { type FixtureMode, type FlatTextProps, textPropsOf } from './__fixtures__/textMode';
import { DecisionText } from './DecisionText';
import {
  DIFF_CONTEXT_RULES,
  DIFF_MIN_FOLDED,
  type DiffRow,
  type DiffValueChange,
  diffColumnsOf,
  diffRowsOf,
  type Placed,
  withRemoved,
} from './decisionTextDiff';
import type { SentenceNameToken, SentenceRule } from './sentenceTypes';

const nameOf = (columnId: string): SentenceNameToken => ({
  kind: 'input',
  columnId,
  text: columnId,
});

const NO_FOLDS: ReadonlySet<string> = new Set();

const ids = (rows: { rules: readonly SentenceRule[] }) => rows.rules.map(({ rowId }) => rowId);

const ruleRow = (row: DiffRow | undefined) => (row?.kind === 'rule' ? row.diff : undefined);

const renderDiff = (
  diff: FixtureDiff,
  props: Partial<Pick<FlatTextProps, 'rules' | 'marks'>> = {}
) =>
  render(
    <DecisionText
      {...textPropsOf({
        rules: DIFF_RULES,
        ...DIFF_COLUMNS,
        hitPolicy: DIFF_POLICY,
        ariaLabel: 'Rules',
        dataTestId: 'nl',
        ...props,
        diff,
      })}
    />
  );

describe('withRemoved', () => {
  const id = (item: string) => item;
  const itemOf = (placed: Placed<string, { item: string }>) =>
    placed.kind === 'kept' ? placed.item : placed.item.item;

  it('puts each removed item under the one it names, first when null, in the order given', () => {
    const placed = withRemoved(
      ['a', 'b', 'c'],
      [
        { item: 'x', after: 'b' },
        { item: 'y', after: null },
        { item: 'z', after: 'b' },
        { item: 'w', after: 'x' },
      ],
      id,
      ({ item }) => item
    );
    expect(placed.map(itemOf)).toEqual(['y', 'a', 'b', 'x', 'w', 'z', 'c']);
    expect(placed.filter(({ kind }) => kind === 'removed').map(itemOf)).toEqual([
      'y',
      'x',
      'w',
      'z',
    ]);
  });

  it('puts one whose after is unknown, itself or circular first, dropping none', () => {
    const placed = withRemoved(
      ['a'],
      [
        { item: 'p', after: 'q' },
        { item: 'q', after: 'p' },
        { item: 's', after: 's' },
        { item: 'u', after: 'gone' },
      ],
      id,
      ({ item }) => item
    );
    expect(placed.map(itemOf)).toEqual(['p', 'q', 's', 'u', 'a']);
  });
});

describe('diffRowsOf', () => {
  const rules = manySentenceRules(20);
  const changedAt = (...indexes: number[]): FixtureDiff => ({
    mode: 'compact',
    rules: indexes.map((index) => ({ rowId: rules[index]?.rowId ?? '', change: 'update' })),
  });

  it('numbers the rules as the after-state does, a removed rule not at all', () => {
    const { rows } = diffRowsOf(
      rules.slice(0, 3),
      {
        mode: 'full',
        removedRules: [
          { rule: { ...rules[5], rowId: 'gone' } as SentenceRule, after: rules[0]?.rowId ?? null },
        ],
      },
      nameOf,
      NO_FOLDS
    );
    expect([...rows.values()].map((row) => ruleRow(row)?.number)).toEqual([1, null, 2, 3]);
    expect(ruleRow(rows.get('removed:0'))?.change).toBe('delete');
  });

  it('marks a rule with only value changes as changed, and keeps its move', () => {
    const { rows } = diffRowsOf(
      rules.slice(0, 3),
      {
        mode: 'full',
        rules: [{ rowId: rules[2]?.rowId ?? '', change: 'update', movedFrom: 1 }],
        values: [
          {
            kind: 'cell',
            rowId: rules[1]?.rowId ?? '',
            columnId: 'risk',
            change: 'update',
            previous: '"low"',
          },
        ],
      },
      nameOf,
      NO_FOLDS
    );
    expect(ruleRow(rows.get(rules[0]?.rowId ?? ''))?.change).toBeUndefined();
    expect(ruleRow(rows.get(rules[1]?.rowId ?? ''))?.change).toBe('update');
    expect(ruleRow(rows.get(rules[2]?.rowId ?? ''))).toMatchObject({
      change: 'update',
      movedFrom: 1,
    });
  });

  it(`keeps ${DIFF_CONTEXT_RULES} rules each side of a change and folds longer runs, numbered by the whole table`, () => {
    const shown = diffRowsOf(rules, changedAt(10), nameOf, NO_FOLDS);
    expect(ids(shown)).toEqual([
      `fold:${rules[0]?.rowId}`,
      ...rules.slice(8, 13).map(({ rowId }) => rowId),
      `fold:${rules[13]?.rowId}`,
    ]);
    const folds = [...shown.rows.values()].flatMap((row) =>
      row.kind === 'fold' ? [row.fold] : []
    );
    expect(folds).toEqual([
      { firstRowId: rules[0]?.rowId, count: 8, from: 1, to: 8 },
      { firstRowId: rules[13]?.rowId, count: 7, from: 14, to: 20 },
    ]);
    expect(ruleRow(shown.rows.get(rules[8]?.rowId ?? ''))?.number).toBe(9);
  });

  it(`shows a run shorter than ${DIFF_MIN_FOLDED} whole and folds one of ${DIFF_MIN_FOLDED}`, () => {
    const short = diffRowsOf(rules.slice(0, 8), changedAt(0, 7), nameOf, NO_FOLDS);
    expect(short.rules).toHaveLength(8);
    const folded = diffRowsOf(rules.slice(0, 9), changedAt(0, 8), nameOf, NO_FOLDS);
    expect(ids(folded)).toEqual([
      ...rules.slice(0, 3).map(({ rowId }) => rowId),
      `fold:${rules[3]?.rowId}`,
      ...rules.slice(6, 9).map(({ rowId }) => rowId),
    ]);
  });

  it('opens a fold whose first rule is expanded, and folds a whole table with no change', () => {
    const open = diffRowsOf(rules, changedAt(10), nameOf, new Set([rules[0]?.rowId ?? '']));
    expect(ids(open).slice(0, 8)).toEqual(rules.slice(0, 8).map(({ rowId }) => rowId));
    expect(ids(diffRowsOf(rules, { mode: 'compact' }, nameOf, NO_FOLDS))).toEqual([
      `fold:${rules[0]?.rowId}`,
    ]);
    expect(diffRowsOf(rules, { mode: 'full' }, nameOf, NO_FOLDS).rules).toEqual(rules);
  });

  it('keeps context around a removed rule', () => {
    const shown = diffRowsOf(
      rules.slice(0, 10),
      {
        mode: 'compact',
        removedRules: [
          {
            rule: { ...DIFF_RULES[0], rowId: 'gone' } as SentenceRule,
            after: rules[5]?.rowId ?? null,
          },
        ],
      },
      nameOf,
      NO_FOLDS
    );
    expect(ids(shown)).toEqual([
      `fold:${rules[0]?.rowId}`,
      ...rules.slice(4, 6).map(({ rowId }) => rowId),
      'removed:0',
      ...rules.slice(6, 8).map(({ rowId }) => rowId),
      ...rules.slice(8, 10).map(({ rowId }) => rowId),
    ]);
  });

  it('strikes old values before what replaced them, after the cell for one past its end, and words a removed condition from its column', () => {
    const r5 = DIFF_RULES.find(({ rowId }) => rowId === 'r5');
    const { rows } = diffRowsOf(
      DIFF_RULES,
      { mode: 'full', ...EVERY_STATE_DIFF },
      nameOf,
      NO_FOLDS
    );
    const diff = ruleRow(rows.get('r5'));
    const tokenDiff = (columnId: string, index: number) =>
      [...(diff?.tokens ?? [])].find(
        ([token]) => token.kind === 'value' && token.columnId === columnId && token.index === index
      )?.[1];
    expect(r5).toBeDefined();
    expect(tokenDiff('age', 0)).toEqual({
      change: 'update',
      before: [{ text: '25', change: 'update' }],
      after: [],
    });
    expect(tokenDiff('channel', 1)).toEqual({
      change: 'update',
      before: [{ text: '"app"', change: 'update' }],
      after: [{ text: '"kiosk"', change: 'delete' }],
    });
    expect(tokenDiff('channel', 0)).toBeUndefined();
    expect(tokenDiff('risk', 0)?.before).toEqual([{ text: '"standard"', change: 'update' }]);
    expect(diff?.removedLines).toEqual([
      {
        columnId: 'income',
        change: 'delete',
        parts: [
          nameOf('income'),
          ' ',
          { kind: 'value', columnId: 'income', index: 0, text: 'is greater than 40000' },
        ],
      },
    ]);
    const added = ruleRow(rows.get('r11'));
    expect([...(added?.tokens.values() ?? [])]).toEqual([{ change: 'add', before: [], after: [] }]);
  });
});

describe('diffRowsOf value changes', () => {
  const r5 = DIFF_RULES.find(({ rowId }) => rowId === 'r5');

  it("keeps the kept rule's value changes off a removed rule that shares its id", () => {
    expect(r5).toBeDefined();
    const { rows } = diffRowsOf(
      DIFF_RULES,
      {
        mode: 'full',
        values: [
          {
            kind: 'value',
            rowId: 'r5',
            columnId: 'age',
            index: 0,
            change: 'update',
            previous: '25',
          },
        ],
        removedRules: r5 ? [{ rule: r5, after: 'r5' }] : [],
      },
      nameOf,
      NO_FOLDS
    );
    const removed = ruleRow(rows.get('removed:0'));
    expect(removed?.change).toBe('delete');
    expect(removed?.tokens.size).toBe(0);
    expect(removed?.removedLines).toEqual([]);
    expect(ruleRow(rows.get('r5'))?.tokens.size).toBe(1);
  });

  it('shows an added value on a cell the card does not word as a line', () => {
    const { rows } = diffRowsOf(
      DIFF_RULES,
      { mode: 'full', values: [{ kind: 'cell', rowId: 'r5', columnId: 'region', change: 'add' }] },
      nameOf,
      NO_FOLDS
    );
    const diff = ruleRow(rows.get('r5'));
    expect(diff?.change).toBe('update');
    expect(diff?.removedLines).toEqual([
      { columnId: 'region', change: 'add', parts: [nameOf('region')] },
    ]);
  });

  it('requires the old text of a deleted or updated value', () => {
    // @ts-expect-error
    const deleted: DiffValueChange = {
      kind: 'cell',
      rowId: 'r5',
      columnId: 'age',
      change: 'delete',
    };
    // @ts-expect-error
    const updated: DiffValueChange = {
      kind: 'cell',
      rowId: 'r5',
      columnId: 'age',
      change: 'update',
    };
    const added: DiffValueChange = { kind: 'cell', rowId: 'r5', columnId: 'age', change: 'add' };
    expect([deleted.change, updated.change, added.change]).toEqual(['delete', 'update', 'add']);
  });
});

describe('diffColumnsOf', () => {
  it('puts a removed column in its own band where it stood, and gives each column its change', () => {
    const columns = diffColumnsOf(DIFF_COLUMNS.inputs, DIFF_COLUMNS.outputs, {
      mode: 'full',
      ...EVERY_STATE_DIFF,
    });
    expect(columns.inputs.map(({ id }) => id)).toEqual([
      'age',
      'income',
      'segment',
      'channel',
      'region',
    ]);
    expect(columns.outputs.map(({ id }) => id)).toEqual(['risk']);
    expect(Object.fromEntries(columns.changes)).toEqual({
      region: 'add',
      channel: 'update',
      segment: 'delete',
    });
  });
});

describe('DecisionText diff', () => {
  const full: FixtureDiff = { mode: 'full', ...EVERY_STATE_DIFF };

  it('shows an added rule with its sign, number and status, and a removed one struck without a number', () => {
    renderDiff(full);
    const added = screen.getByTestId('nl-row-r3');
    expect(added).toHaveAttribute('data-change', 'add');
    expect(added).toHaveAccessibleName(expect.stringMatching(/^Added 9 /));
    expect(within(added).getByText('+')).toHaveAttribute('aria-hidden');
    expect(within(added).getByText('Added')).toHaveClass('sr-only');
    const removed = screen.getByTestId('nl-row-removed:0');
    expect(removed).toHaveAttribute('data-change', 'delete');
    expect(removed).toHaveAccessibleName(expect.stringMatching(/^Removed risk is/));
    expect(within(removed).getByText('−')).toHaveAttribute('aria-hidden');
    expect(within(removed).getByText('−').parentElement).toHaveTextContent(/^−Removed$/);
    expect(within(added).getByText('+').parentElement).toHaveTextContent(/^\+9Added$/);
    expect(screen.getByTestId('nl-row-r12')).toHaveAccessibleName(expect.stringMatching(/^18 /));
  });

  it('shows a moved rule with arrows and its old number', () => {
    renderDiff(full);
    const moved = screen.getByTestId('nl-row-r9');
    expect(moved.querySelector('.lucide-arrow-up-down')).toHaveAttribute('aria-hidden', 'true');
    expect(within(moved).getByText('Changed, Moved from rule 13')).toHaveClass('sr-only');
  });

  it('strikes a changed value before the new one, each read out as was and now', () => {
    renderDiff(full);
    const card = screen.getByTestId('nl-row-r5');
    const old = within(card).getByText('25', { selector: 'del' });
    expect(old).toHaveAttribute('data-change', 'update');
    expect(old).toHaveTextContent('was 25');
    const now = within(card).getByText('30');
    expect(now).toHaveAttribute('data-change', 'update');
    expect(now.previousElementSibling).toHaveTextContent('now');
    const kiosk = within(card).getByText('"kiosk"', { selector: 'del' });
    expect(kiosk).toHaveAttribute('data-change', 'delete');
    expect(kiosk).toHaveTextContent('Removed "kiosk"');
  });

  it('keeps a removed condition in its card, struck and read out as removed', () => {
    renderDiff(full);
    const line = within(screen.getByTestId('nl-row-r5'))
      .getByText('is greater than 40000')
      .closest('li');
    expect(line).toHaveAttribute('data-change', 'delete');
    expect(line).toHaveTextContent('Removedincome is greater than 40000');
  });

  it('paints each changed column pill and reads its change, a removed one in place', () => {
    renderDiff(full);
    const bands = screen.getByTestId('nl-bands');
    const pill = (id: string) => bands.querySelector(`li[data-column-id="${id}"]`);
    expect(pill('region')).toHaveAttribute('data-change', 'add');
    expect(pill('region')).toHaveTextContent('Added region');
    expect(pill('channel')).toHaveAttribute('data-change', 'update');
    expect(pill('segment')).toHaveAttribute('data-change', 'delete');
    expect(pill('segment')).toHaveTextContent('Removed segment');
    expect(pill('age')).not.toHaveAttribute('data-change');
  });

  it('shows the hit policy before, struck, then after', () => {
    renderDiff(full);
    const header = screen.getByTestId('nl-header');
    expect(within(header).getByText('First', { selector: 'del' })).toHaveTextContent('was First');
    expect(within(header).getByText('Unique')).toHaveAttribute('data-change', 'update');
    expect(header).toHaveTextContent('was First→now Unique');
  });

  it("layers a value's change over its validation mark: both paint and the glyph still reads", () => {
    renderDiff(full, {
      marks: {
        rows: new Map([
          ['r5', { cells: { age: { tone: 'warning', glyph: true, title: 'Overlaps rule 4' } } }],
        ]),
        columns: new Map(),
      },
    });
    const card = screen.getByTestId('nl-row-r5');
    const chip = within(card).getByText('30');
    expect(chip).toHaveAttribute('data-change', 'update');
    expect(chip).toHaveAttribute('data-tone', 'warning');
    expect(card).toHaveAccessibleDescription('Warning: Overlaps rule 4');
  });

  it('widens the start gutter for three-digit rule numbers in a diff, so their chips stay inside the view', () => {
    const { rules, diff } = largeDiffTable(300);
    renderDiff({ mode: 'compact', ...diff }, { rules });
    expect(screen.getByTestId('nl-bands').style.getPropertyValue('--sentence-number-digits')).toBe(
      '3'
    );
  });

  it('folds unchanged rules in compact mode and opens a fold by mouse, keeping each number', async () => {
    const user = userEvent.setup();
    const { rules, diff } = largeDiffTable(300);
    renderDiff({ mode: 'compact', ...diff }, { rules });
    const first = screen.getByTestId('nl-fold-row-1');
    const button = within(first).getByRole('button', { name: '28 unchanged rules' });
    expect(button).toHaveAttribute('title', 'Show rules 1–28');
    expect(screen.getByTestId('nl-row-row-29')).toHaveAccessibleName(expect.stringMatching(/^29 /));
    await user.click(button);
    expect(screen.queryByTestId('nl-fold-row-1')).toBeNull();
    expect(screen.getByTestId('nl-row-row-1')).toHaveAccessibleName(expect.stringMatching(/^1 /));
    expect(screen.getByRole('region', { name: 'Rules' })).toHaveFocus();
  });

  it('folds the runs far from every change, a removed rule among the changes', () => {
    renderDiff({ mode: 'compact', ...EVERY_STATE_DIFF });
    const folds = screen.getAllByRole('button', { name: /unchanged rules/ });
    expect(folds.map((fold) => [fold.textContent, fold.title])).toEqual([
      ['6 unchanged rules', 'Show rules 1–6'],
      ['4 unchanged rules', 'Show rules 21–24'],
    ]);
    expect(screen.getByTestId('nl-row-removed:0')).toBeInTheDocument();
    expect(screen.getByTestId('nl-row-r14')).toHaveAccessibleName(expect.stringMatching(/^20 /));
  });

  it('opens a fold from the keyboard', async () => {
    const user = userEvent.setup();
    const { rules, diff } = largeDiffTable(300);
    renderDiff({ mode: 'compact', ...diff }, { rules });
    within(screen.getByTestId('nl-fold-row-34')).getByRole('button').focus();
    await user.keyboard(' ');
    expect(screen.queryByTestId('nl-fold-row-34')).toBeNull();
    expect(screen.getByRole('region', { name: 'Rules' })).toHaveFocus();
    expect(screen.getByTestId('nl-row-row-34')).toBeInTheDocument();
    within(screen.getByTestId('nl-fold-row-1')).getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByTestId('nl-fold-row-1')).toBeNull();
    expect(screen.getByTestId('nl-row-row-1')).toBeInTheDocument();
  });

  it('shows the list when every rule was removed', () => {
    renderDiff(
      { mode: 'full', removedRules: [{ rule: DIFF_RULES[0] as SentenceRule, after: null }] },
      { rules: [] }
    );
    expect(screen.queryByTestId('nl-empty')).toBeNull();
    expect(screen.getByTestId('nl-row-removed:0')).toHaveAttribute('data-change', 'delete');
  });

  it('takes no edit, selection or add-rule action with a diff', () => {
    const edit = { onCommit: () => {}, onClearCell: () => {}, onDeleteRule: () => {} };
    const accepted: FixtureMode = { kind: 'diff', diff: full };
    // @ts-expect-error
    const withEdit: FixtureMode = { kind: 'diff', diff: full, edit };
    const withSelection: FixtureMode = {
      kind: 'diff',
      diff: full,
      // @ts-expect-error
      selected: null,
    };
    // @ts-expect-error
    const withAddRule: FixtureMode = { kind: 'diff', diff: full, onAddRule: () => {} };
    expect([accepted, withEdit, withSelection, withAddRule].map(({ kind }) => kind)).toEqual([
      'diff',
      'diff',
      'diff',
      'diff',
    ]);
  });

  it('has no axe violations in full or compact mode', async () => {
    const { container, unmount } = renderDiff(full);
    expect(await axe(container)).toHaveNoViolations();
    unmount();
    const compact = renderDiff({ mode: 'compact', ...EVERY_STATE_DIFF });
    expect(await axe(compact.container)).toHaveNoViolations();
  });
});
