import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DIFF_COLUMNS, DIFF_HEADER, DIFF_RULES } from './__fixtures__/diffSentences.fixtures';
import { DecisionText } from './DecisionText';
import {
  type DecisionTextDiff,
  type DiffRemovedRule,
  type DiffRow,
  diffColumnsOf,
  diffRowsOf,
} from './decisionTextDiff';
import type { SentenceNameToken, SentenceRule } from './sentenceTypes';

const nameOf = (columnId: string): SentenceNameToken => ({
  kind: columnId === 'fee' ? 'output' : 'input',
  columnId,
  text: columnId,
});

const NO_FOLDS: ReadonlySet<string> = new Set();

const ruleRow = (row: DiffRow | undefined) => (row?.kind === 'rule' ? row.diff : undefined);

const base = DIFF_RULES[0] as SentenceRule;

const removedRule = (rowId: string, after: string | null): DiffRemovedRule => ({
  rule: { ...base, rowId, heading: [rowId] },
  after,
});

const shownOrder = (kept: readonly SentenceRule[], removed: readonly DiffRemovedRule[]) =>
  diffRowsOf(kept, { mode: 'full', removedRules: removed }, nameOf, NO_FOLDS).rules.map((rule) =>
    rule.heading.join('')
  );

const keptRule = (rowId: string): SentenceRule => ({ ...base, rowId, heading: [rowId] });

describe('placing removed rules', () => {
  it('places 20,000 removed rules after one kept rule in linear time', () => {
    const removed = Array.from({ length: 20_000 }, (_, index) => removedRule(`x${index}`, 'k'));
    const started = performance.now();
    const shown = shownOrder([keptRule('k')], removed);
    expect(performance.now() - started).toBeLessThan(400);
    expect(shown).toEqual(['k', ...removed.map(({ rule }) => rule.rowId)]);
  });

  it('places 20,000 removed rules sharing one id in linear time', () => {
    const removed = Array.from({ length: 20_000 }, () => removedRule('k', 'k'));
    const started = performance.now();
    const { rules } = diffRowsOf(
      [keptRule('k')],
      { mode: 'compact', removedRules: removed },
      nameOf,
      NO_FOLDS
    );
    expect(performance.now() - started).toBeLessThan(400);
    expect(new Set(rules.map(({ rowId }) => rowId)).size).toBe(rules.length);
  });

  it('puts a removed rule that reuses a kept id after that kept rule when it names it', () => {
    expect(shownOrder([keptRule('a'), keptRule('b')], [removedRule('b', 'b')])).toEqual([
      'a',
      'b',
      'b',
    ]);
  });

  it('puts a removed column that reuses a kept id after that kept column when it names it', () => {
    const columns = diffColumnsOf(DIFF_COLUMNS.inputs, DIFF_COLUMNS.outputs, {
      mode: 'full',
      removedColumns: [
        {
          column: { id: 'income', name: 'income' },
          kind: 'input',
          after: 'income',
        },
      ],
    });
    const ids = DIFF_COLUMNS.inputs.map(({ id }) => id);
    const at = ids.indexOf('income') + 1;
    expect(columns.inputs.map(({ id }) => id)).toEqual([
      ...ids.slice(0, at),
      'income',
      ...ids.slice(at),
    ]);
  });

  it('orders a mix of self anchors, shared ids, cycles and null anchors exactly', () => {
    const shown = shownOrder(
      [keptRule('a'), keptRule('b')],
      [
        removedRule('p', 'q'),
        removedRule('q', 'p'),
        removedRule('s', 's'),
        removedRule('b', 'b'),
        removedRule('n', null),
        removedRule('c', 'b'),
        removedRule('d', 'c'),
        removedRule('c', 'd'),
        removedRule('e', 'p'),
        removedRule('g', 'gone'),
        removedRule('a', 'n'),
      ]
    );
    expect(shown).toEqual(['p', 'q', 'e', 's', 'n', 'a', 'g', 'a', 'b', 'b', 'c', 'd', 'c']);
  });

  it('gives each removed rule its own row id, apart from every kept id', () => {
    const kept = [keptRule('removed:0'), keptRule('a')];
    const { rules, rows } = diffRowsOf(
      kept,
      { mode: 'full', removedRules: [removedRule('a', 'a'), removedRule('a', 'a')] },
      nameOf,
      NO_FOLDS
    );
    const ids = rules.map(({ rowId }) => rowId);
    expect(ids.slice(0, 2)).toEqual(['removed:0', 'a']);
    expect(new Set(ids).size).toBe(4);
    expect(ids.slice(2).map((id) => ruleRow(rows.get(id))?.change)).toEqual(['delete', 'delete']);
  });
});

describe('values of a removed column', () => {
  const removedFee = {
    mode: 'full' as const,
    removedColumns: [
      {
        column: { id: 'fee', name: 'fee' },
        kind: 'output' as const,
        after: 'risk',
      },
    ],
    values: [
      { rowId: 'r5', columnId: 'fee', change: 'delete' as const, previous: '10' },
      { rowId: 'r5', columnId: 'segment', change: 'delete' as const, previous: 'is "retail"' },
    ],
  };

  it('keeps a removed output value in the outcome and a removed input value as a condition', () => {
    const diff = ruleRow(diffRowsOf(DIFF_RULES, removedFee, nameOf, NO_FOLDS).rows.get('r5'));
    const struck = (columnId: string, text: string) => ({
      columnId,
      change: 'delete',
      parts: [nameOf(columnId), ' ', { kind: 'value', columnId, index: 0, text }],
    });
    expect(diff?.removedOutcomes).toEqual([struck('fee', '10')]);
    expect(diff?.removedLines).toEqual([struck('segment', 'is "retail"')]);
  });

  it('shows the removed output value in the card heading, not among its conditions', () => {
    render(
      <DecisionText
        rules={DIFF_RULES}
        {...DIFF_COLUMNS}
        header={DIFF_HEADER}
        numbered
        ariaLabel="Rules"
        dataTestId="nl"
        diff={removedFee}
      />
    );
    const card = screen.getByTestId('nl-row-r5');
    const fee = within(card).getByText('10');
    expect(fee.closest('li')).toBe(card);
    expect(fee.closest('[data-change="delete"]')).toHaveTextContent('Removedfee 10');
    expect(within(card).getByText('is "retail"').closest('li')).toHaveAttribute(
      'data-change',
      'delete'
    );
  });
});

const renderDiff = (diff: DecisionTextDiff, rules: readonly SentenceRule[] = DIFF_RULES) =>
  render(
    <DecisionText
      rules={rules}
      {...DIFF_COLUMNS}
      header={DIFF_HEADER}
      numbered
      ariaLabel="Rules"
      dataTestId="nl"
      diff={diff}
    />
  );

const keyErrorsOf = (render: () => void) => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  render();
  return errors.mock.calls.filter((call) => String(call[0]).includes('same key'));
};

describe('a removed and an added value of one unworded column', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows both outcomes in the heading without duplicate keys', () => {
    const keyErrors = keyErrorsOf(() =>
      renderDiff({
        mode: 'full',
        removedColumns: [{ column: { id: 'fee', name: 'fee' }, kind: 'output', after: 'risk' }],
        values: [
          { rowId: 'r5', columnId: 'fee', index: 0, change: 'delete', previous: '10' },
          { rowId: 'r5', columnId: 'fee', index: 1, change: 'add' },
        ],
      })
    );
    const card = screen.getByTestId('nl-row-r5');
    expect(
      [...card.querySelectorAll('[data-column-id="fee"][data-change]')].map((node) =>
        node.getAttribute('data-change')
      )
    ).toEqual(['delete', 'add']);
    expect(keyErrors).toEqual([]);
  });

  it('shows both conditions without duplicate keys', () => {
    const keyErrors = keyErrorsOf(() =>
      renderDiff({
        mode: 'full',
        values: [
          { rowId: 'r5', columnId: 'segment', index: 0, change: 'delete', previous: 'is "retail"' },
          { rowId: 'r5', columnId: 'segment', index: 1, change: 'add' },
        ],
      })
    );
    const card = screen.getByTestId('nl-row-r5');
    expect(
      [...card.querySelectorAll('li[data-column-id="segment"][data-change]')].map((node) =>
        node.getAttribute('data-change')
      )
    ).toEqual(['delete', 'add']);
    expect(keyErrors).toEqual([]);
  });
});

describe('kept rules sharing a row id', () => {
  afterEach(() => vi.restoreAllMocks());

  const kept = ['a', 'a', 'b', 'a', 'c', 'd'].map((rowId, index) => ({
    ...base,
    rowId,
    heading: [`${rowId}${index}`],
  }));

  it('gives every shown rule its own id, keeping order and the first id', () => {
    const { rules, rows } = diffRowsOf(
      kept,
      { mode: 'full', rules: [{ rowId: 'a', change: 'update' }] },
      nameOf,
      NO_FOLDS
    );
    const ids = rules.map(({ rowId }) => rowId);
    expect(rules.map(({ heading }) => heading.join(''))).toEqual([
      'a0',
      'a1',
      'b2',
      'a3',
      'c4',
      'd5',
    ]);
    expect(new Set(ids).size).toBe(ids.length);
    expect([ids[0], ids[2], ids[4], ids[5]]).toEqual(['a', 'b', 'c', 'd']);
    expect(ids.map((id) => ruleRow(rows.get(id))?.change)).toEqual([
      'update',
      'update',
      undefined,
      'update',
      undefined,
      undefined,
    ]);
  });

  it('keeps folds, removed rules and duplicates apart in compact mode', () => {
    const many = [...kept, ...kept, ...kept];
    const { rules, rows } = diffRowsOf(
      many,
      {
        mode: 'compact',
        rules: [{ rowId: 'd', change: 'update' }],
        removedRules: [removedRule('a', 'a'), removedRule('a', 'a')],
      },
      nameOf,
      NO_FOLDS
    );
    const ids = rules.map(({ rowId }) => rowId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(rows.keys()).size).toBe(ids.length);
  });

  it('renders without duplicate keys', () => {
    const keyErrors = keyErrorsOf(() =>
      renderDiff({ mode: 'full', rules: [{ rowId: 'b', change: 'update' }] }, kept)
    );
    expect(screen.getAllByText(/^a\d$/)).toHaveLength(3);
    expect(keyErrors).toEqual([]);
  });
});
