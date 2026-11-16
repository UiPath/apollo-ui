import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  DIFF_COLUMNS,
  DIFF_HEADER,
  DIFF_RULES,
  largeDiffTable,
} from './__fixtures__/diffSentences.fixtures';
import { DecisionText, type DecisionTextProps } from './DecisionText';
import type { DecisionTextDiff } from './decisionTextDiff';
import type { SentencePart, SentenceRule } from './sentenceTypes';

const renderDiff = (
  diff: DecisionTextDiff,
  props: Partial<Pick<DecisionTextProps, 'rules'>> = {}
) =>
  render(
    <DecisionText
      rules={DIFF_RULES}
      {...DIFF_COLUMNS}
      header={DIFF_HEADER}
      numbered
      ariaLabel="Rules"
      dataTestId="nl"
      {...props}
      diff={diff}
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
          { rowId: 'long', columnId: 'channel', index: 22, change: 'update', previous: '"old"' },
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
      values: [{ rowId: 'r1', columnId: 'age', index: 5, change: 'add' }],
    });
    const card = screen.getByTestId('nl-row-r1');
    expect(card).toHaveAttribute('data-change', 'update');
    expect(card.querySelector('[data-change="add"]')).not.toBeNull();
  });

  it('keeps a removed rule whose rowId a kept rule reuses as its own card', () => {
    const kept = DIFF_RULES[0] as SentenceRule;
    const removed: SentenceRule = { ...kept, heading: [...kept.heading] };
    renderDiff({ mode: 'full', removedRules: [{ rule: removed, after: null }] });
    expect(screen.getByTestId(`nl-row-removed:${kept.rowId}`)).toHaveAttribute(
      'data-change',
      'delete'
    );
    expect(screen.getByTestId(`nl-row-${kept.rowId}`)).not.toHaveAttribute('data-change');
  });

  it('closes every fold for a new diff', async () => {
    const user = userEvent.setup();
    const { rules, diff } = largeDiffTable(300);
    const { rerender } = renderDiff({ mode: 'compact', ...diff }, { rules });
    await user.click(within(screen.getByTestId('nl-fold-row-1')).getByRole('button'));
    expect(screen.queryByTestId('nl-fold-row-1')).toBeNull();
    const next: DecisionTextDiff = {
      mode: 'compact',
      rules: [{ rowId: 'row-200', change: 'update' }],
    };
    rerender(
      <DecisionText
        rules={rules}
        {...DIFF_COLUMNS}
        header={DIFF_HEADER}
        numbered
        ariaLabel="Rules"
        dataTestId="nl"
        diff={next}
      />
    );
    expect(screen.queryByTestId('nl-fold-row-1')).not.toBeNull();
  });
});
