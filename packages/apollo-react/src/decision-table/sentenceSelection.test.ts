import { liveSelection } from './sentenceSelection';
import type { SentenceRule } from './sentenceTypes';

const rule = (rowId: string, withIncome: boolean): SentenceRule => ({
  rowId,
  heading: [
    { kind: 'output', columnId: 'risk', text: 'risk' },
    ' is ',
    { kind: 'value', columnId: 'risk', index: 0, text: '"high"' },
  ],
  lead: [
    'when ',
    { kind: 'input', columnId: 'age', text: 'age' },
    ' is less than ',
    { kind: 'value', columnId: 'age', index: 0, text: '25' },
    ...(withIncome
      ? [' and ', { kind: 'input' as const, columnId: 'income', text: 'income' }]
      : []),
  ],
  lines: [],
});

describe('liveSelection', () => {
  const rules = [rule('r1', true), rule('r2', true)];

  it('keeps a selection whose rule and cell are still there', () => {
    expect(liveSelection(rules, { kind: 'rule', rowId: 'r2' })).toEqual({
      kind: 'rule',
      rowId: 'r2',
    });
    expect(liveSelection(rules, { kind: 'cell', rowId: 'r2', columnId: 'age' })).toEqual({
      kind: 'cell',
      rowId: 'r2',
      columnId: 'age',
    });
  });

  it('keeps an input with no value selected, as it is a stop of its rule', () => {
    expect(liveSelection(rules, { kind: 'cell', rowId: 'r1', columnId: 'income' })).toEqual({
      kind: 'cell',
      rowId: 'r1',
      columnId: 'income',
    });
  });

  it('demotes a cell an edit removed to its rule', () => {
    expect(
      liveSelection([rule('r1', false)], { kind: 'cell', rowId: 'r1', columnId: 'income' })
    ).toEqual({ kind: 'rule', rowId: 'r1' });
  });

  it('drops the selection once its rule is deleted, rule or cell', () => {
    const left = [rule('r1', true)];
    expect(liveSelection(left, { kind: 'rule', rowId: 'r2' })).toBeNull();
    expect(liveSelection(left, { kind: 'cell', rowId: 'r2', columnId: 'age' })).toBeNull();
  });

  it('keeps no selection as none', () => {
    expect(liveSelection(rules, null)).toBeNull();
  });
});
