import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { FixtureDiff } from './__fixtures__/diffSentences.fixtures';
import {
  DIFF_COLUMNS,
  DIFF_POLICY,
  DIFF_RULES,
  largeDiffTable,
} from './__fixtures__/diffSentences.fixtures';
import { HIT_POLICIES, COLUMN_TYPES } from './__fixtures__/sentences.fixtures';
import { type FlatTextProps, textPropsOf } from './__fixtures__/textMode';
import { DecisionText } from './DecisionText';
import { withRemoved } from './decisionTextDiff';
import type { SentencePart, SentenceRule } from './sentenceTypes';

const renderDiff = (diff: FixtureDiff, props: Partial<Pick<FlatTextProps, 'rules'>> = {}) =>
  render(
    <DecisionText
      {...textPropsOf({
        rules: DIFF_RULES,
        ...DIFF_COLUMNS,
        hitPolicy: DIFF_POLICY,
        numbered: true,
        ariaLabel: 'Rules',
        dataTestId: 'nl',
        ...props,
        diff,
      })}
    />
  );

const manyValues = (count: number): SentencePart[] =>
  Array.from({ length: count }, (_, index) => [
    ...(index > 0 ? [', '] : []),
    { kind: 'value' as const, columnId: 'channel', index, text: `"c${index}"` },
  ]).flat();

const LONG_RULE: SentenceRule = {
  rowId: 'long',
  heading: [
    { kind: 'output', columnId: 'risk', text: 'risk' },
    ' is ',
    { kind: 'value', columnId: 'risk', index: 0, text: '"high"' },
  ],
  lead: [
    'when ',
    { kind: 'input', columnId: 'channel', text: 'channel' },
    ' is one of ',
    ...manyValues(25),
  ],
  lines: [],
};

describe('DecisionText diff edges', () => {
  it('shows a changed value that the line clamps behind "+N more"', () => {
    renderDiff(
      {
        mode: 'full',
        values: [
          {
            kind: 'value',
            rowId: 'long',
            columnId: 'channel',
            index: 22,
            change: 'update',
            previous: '"old"',
          },
        ],
      },
      { rules: [LONG_RULE] }
    );
    const card = screen.getByTestId('nl-row-long');
    expect(card).toHaveAttribute('data-change', 'update');
    expect(within(card).queryByText('"old"', { selector: 'del' })).not.toBeNull();
  });

  it('shows a value added past the cell end', () => {
    renderDiff({
      mode: 'full',
      values: [{ kind: 'value', rowId: 'r1', columnId: 'age', index: 5, change: 'add' }],
    });
    const card = screen.getByTestId('nl-row-r1');
    expect(card).toHaveAttribute('data-change', 'update');
    expect(card.querySelector('[data-change="add"]')).not.toBeNull();
  });

  it('keeps a removed rule whose rowId a kept rule reuses as its own card', () => {
    const kept = DIFF_RULES[0] as SentenceRule;
    const removed: SentenceRule = { ...kept, heading: [...kept.heading] };
    renderDiff({ mode: 'full', removedRules: [{ rule: removed, after: null }] });
    expect(screen.getByTestId('nl-row-removed:0')).toHaveAttribute('data-change', 'delete');
    expect(screen.getByTestId(`nl-row-${kept.rowId}`)).not.toHaveAttribute('data-change');
  });

  it('closes every fold for a new diff', async () => {
    const user = userEvent.setup();
    const { rules, diff } = largeDiffTable(300);
    const { rerender } = renderDiff({ mode: 'compact', ...diff }, { rules });
    await user.click(within(screen.getByTestId('nl-fold-row-1')).getByRole('button'));
    expect(screen.queryByTestId('nl-fold-row-1')).toBeNull();
    const next: FixtureDiff = {
      mode: 'compact',
      rules: [{ rowId: 'row-200', change: 'update' }],
    };
    rerender(
      <DecisionText
        citations={{ kind: 'none' }}
        table={{ rules: rules, ...DIFF_COLUMNS, hitPolicy: DIFF_POLICY }}
        hitPolicies={HIT_POLICIES}
        columnTypes={COLUMN_TYPES}
        numbered
        ariaLabel="Rules"
        dataTestId="nl"
        mode={{ kind: 'diff', diff: next }}
      />
    );
    expect(screen.queryByTestId('nl-fold-row-1')).not.toBeNull();
  });
});

const valuelessRule = (rowId: string): SentenceRule => ({
  rowId,
  heading: [
    { kind: 'output', columnId: 'risk', text: 'risk' },
    ' is ',
    { kind: 'value', columnId: 'risk', index: 0, text: '"high"' },
  ],
  lead: ['when ', { kind: 'input', columnId: 'income', text: 'income' }, ' is not empty'],
  lines: [],
});

describe('DecisionText diff review edges', () => {
  it('shows no hit-policy picker on a diff', () => {
    render(
      <DecisionText
        citations={{ kind: 'none' }}
        table={{ rules: DIFF_RULES, ...DIFF_COLUMNS, hitPolicy: DIFF_POLICY }}
        hitPolicies={HIT_POLICIES}
        columnTypes={COLUMN_TYPES}
        ariaLabel="Rules"
        dataTestId="nl"
        mode={{
          kind: 'diff',
          diff: { mode: 'full' },
          // @ts-expect-error
          policy: { value: 'FIRST', groups: [], onChange: () => undefined, label: 'Hit policy' },
        }}
      />
    );
    expect(screen.queryByTestId('nl-policy')).toBeNull();
  });

  it('keeps a long line clamped around its one changed value', () => {
    const rule: SentenceRule = {
      ...LONG_RULE,
      lead: [...LONG_RULE.lead.slice(0, 3), ...manyValues(10_000)],
    };
    renderDiff(
      {
        mode: 'full',
        values: [
          {
            kind: 'value',
            rowId: 'long',
            columnId: 'channel',
            index: 5000,
            change: 'update',
            previous: '"old"',
          },
        ],
      },
      { rules: [rule] }
    );
    const card = screen.getByTestId('nl-row-long');
    const chips = card.querySelectorAll('[data-kind="value"][data-column-id="channel"]');
    const hidden = [...card.querySelectorAll('[data-more-values]')].reduce(
      (sum, more) => sum + Number(more.getAttribute('data-more-values')),
      0
    );
    expect(chips.length).toBeLessThanOrEqual(25);
    expect(chips.length + hidden).toBe(10_000);
    expect(card.querySelector('[data-value-index="5000"]')).toHaveAttribute(
      'data-change',
      'update'
    );
    expect(within(card).queryByText('"old"', { selector: 'del' })).not.toBeNull();
  });

  it.each([
    ['update', { change: 'update' as const, previous: 'is at most 20000' }],
    ['add', { change: 'add' as const }],
  ])('marks a valueless condition line for a cell %s', (change, value) => {
    renderDiff(
      { mode: 'full', values: [{ kind: 'cell', rowId: 'ne', columnId: 'income', ...value }] },
      { rules: [valuelessRule('ne')] }
    );
    const card = screen.getByTestId('nl-row-ne');
    const names = card.querySelectorAll('[data-kind="input"][data-column-id="income"]');
    expect(names).toHaveLength(1);
    expect(names[0]).toHaveAttribute('data-change', change);
  });

  it('keeps a fold apart from a rule whose id is the fold id', () => {
    const first = DIFF_RULES[0] as SentenceRule;
    const last = DIFF_RULES.at(-1) as SentenceRule;
    const rules = [...DIFF_RULES.slice(0, -1), { ...last, rowId: `fold:${first.rowId}` }];
    renderDiff(
      {
        mode: 'compact',
        rules: [
          { rowId: 'r3', change: 'update' },
          { rowId: `fold:${first.rowId}`, change: 'update' },
        ],
      },
      { rules }
    );
    expect(screen.getByTestId(`nl-fold-${first.rowId}`)).not.toBeNull();
    expect(screen.getByTestId(`nl-row-fold:${first.rowId}`)).toHaveAttribute(
      'data-change',
      'update'
    );
  });

  it('places a 20,000-long chain of removed items in order', () => {
    const chain = Array.from({ length: 20_000 }, (_, index) => ({
      item: `x${index}`,
      after: index === 0 ? 'k' : `x${index - 1}`,
    }));
    const placed = withRemoved(
      ['k'],
      chain,
      (id) => id,
      ({ item }) => item
    );
    expect(placed.map((entry) => (entry.kind === 'kept' ? entry.item : entry.item.item))).toEqual([
      'k',
      ...chain.map(({ item }) => item),
    ]);
  });
});
