import { describe, expect, it, vi } from 'vitest';
import { selectSentenceInGrid, sentenceSelectionOf } from './sentenceGridSelection';
import { cellSelection, ruleSelection } from './sentenceSelection';
import type { SentenceRule } from './sentenceTypes';

const rules: SentenceRule[] = [
  {
    rowId: 'r1',
    heading: [
      { kind: 'output', columnId: 'out', text: 'Tier' },
      ' is ',
      { kind: 'value', columnId: 'out', index: 0, text: 'Gold' },
    ],
    lead: [
      'when ',
      { kind: 'input', columnId: 'age', text: 'Age' },
      ' is ',
      { kind: 'value', columnId: 'age', index: 0, text: '30' },
    ],
    lines: [],
  },
  {
    rowId: 'r2',
    heading: [{ kind: 'output', columnId: 'out', text: 'Tier' }],
    lead: ['when all of these are true:'],
    lines: [
      {
        columnId: 'income',
        parts: [{ kind: 'input', columnId: 'income', text: 'Income' }, ' is empty'],
      },
    ],
  },
];
const gridColumnIds = [undefined, 'age', 'income', 'out'];
const cell = (row: number, col: number) => ({
  axisSelection: null,
  focus: { row, col },
  singleSelection: { row, col },
});

describe('sentenceSelectionOf', () => {
  it.each([
    ['a condition the rule has', cell(0, 1), { kind: 'cell', rowId: 'r1', columnId: 'age' }],
    ['a condition on its own line', cell(1, 2), { kind: 'cell', rowId: 'r2', columnId: 'income' }],
    ['an output cell', cell(0, 3), { kind: 'cell', rowId: 'r1', columnId: 'out' }],
    ['an output cell with no value', cell(1, 3), { kind: 'rule', rowId: 'r2' }],
    ['an input the rule has no condition on', cell(0, 2), { kind: 'rule', rowId: 'r1' }],
    ['the row number column', cell(0, 0), { kind: 'rule', rowId: 'r1' }],
    [
      'a whole row',
      { axisSelection: 'row', focus: { row: 1, col: 3 }, singleSelection: null },
      { kind: 'rule', rowId: 'r2' },
    ],
    ['nothing', { axisSelection: null, focus: null, singleSelection: null }, null],
    ['a range', { axisSelection: null, focus: { row: 0, col: 1 }, singleSelection: null }, null],
    ['a row past the rules', cell(5, 1), null],
  ] as const)('selects %s', (_, navigation, selected) => {
    expect(sentenceSelectionOf(navigation, rules, gridColumnIds)).toEqual(selected);
  });
});

describe('selectSentenceInGrid', () => {
  const navigation = () => ({ clear: vi.fn(), select: vi.fn(), selectRow: vi.fn() });

  it('selects a cell at its rule and column', () => {
    const grid = navigation();
    selectSentenceInGrid(
      grid,
      { kind: 'cell', rowId: 'r2', columnId: 'income' },
      rules,
      gridColumnIds
    );
    expect(grid.select).toHaveBeenCalledWith({ row: 1, col: 2 });
  });

  it.each([
    ['a rule', ruleSelection('r2')],
    ['a column the grid lacks', cellSelection({ rowId: 'r2', columnId: 'gone' })],
  ])('selects the whole row for %s', (_, selection) => {
    const grid = navigation();
    selectSentenceInGrid(grid, selection, rules, gridColumnIds);
    expect(grid.selectRow).toHaveBeenCalledWith(1);
    expect(grid.select).not.toHaveBeenCalled();
  });

  it.each([
    ['null', null],
    ['a rule that is gone', ruleSelection('r9')],
  ])('clears for %s', (_, selection) => {
    const grid = navigation();
    selectSentenceInGrid(grid, selection, rules, gridColumnIds);
    expect(grid.clear).toHaveBeenCalled();
    expect(grid.selectRow).not.toHaveBeenCalled();
  });
});
