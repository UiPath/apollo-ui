import { describe, expect, it } from 'vitest';
import { hostCommitOf, refusedValuesOf, viewFieldOf } from './hostValues';
import type { OperatorOffer, ValueCommit, ValueFieldData } from './valueTypes';

type Op = 'eq' | 'in' | 'none';

const OFFERS: readonly OperatorOffer<Op>[] = [
  { operator: 'eq', label: 'equals', shape: 'single' },
  { operator: 'in', label: 'is in', shape: 'list' },
];

const conditionOf = (held: Extract<ValueFieldData<Op>, { kind: 'condition' }>['held']) =>
  ({
    kind: 'condition',
    allowedValues: [],
    expression: 'x',
    operators: OFFERS,
    held,
  }) satisfies ValueFieldData<Op>;

describe('viewFieldOf', () => {
  it('addresses each operator by its place among the offers', () => {
    expect(viewFieldOf(conditionOf({ shape: 'list', operator: 'in', values: ['a'] }))).toEqual({
      kind: 'condition',
      allowedValues: [],
      expression: 'x',
      operators: [
        { operator: 0, label: 'equals', shape: 'single' },
        { operator: 1, label: 'is in', shape: 'list' },
      ],
      held: { shape: 'list', operator: 1, values: ['a'] },
    });
  });

  it('opens a held operator the host does not offer as its expression', () => {
    expect(viewFieldOf(conditionOf({ shape: 'valueless', operator: 'none' }))).toEqual({
      kind: 'expression',
      allowedValues: [],
      expression: 'x',
    });
  });

  it('passes an outcome through', () => {
    expect(viewFieldOf<Op>({ kind: 'outcome', allowedValues: ['a'] })).toEqual({
      kind: 'outcome',
      allowedValues: ['a'],
    });
  });
});

describe('hostCommitOf', () => {
  it("turns an operator's place back into the host's operator", () => {
    expect(hostCommitOf({ kind: 'list', operator: 1, values: ['a', 'b'] }, OFFERS)).toEqual({
      kind: 'list',
      operator: 'in',
      values: ['a', 'b'],
    });
  });

  it('gives nothing for a place no offer holds', () => {
    expect(hostCommitOf({ kind: 'single', operator: 2, value: 'a' }, OFFERS)).toBeUndefined();
  });

  it('passes an outcome and an expression through', () => {
    expect(hostCommitOf({ kind: 'expression', text: 'x > 1' }, OFFERS)).toEqual({
      kind: 'expression',
      text: 'x > 1',
    });
  });
});

describe('refusedValuesOf', () => {
  it.each<[ValueCommit<Op>, string]>([
    [{ kind: 'single', operator: 'eq', value: '1' }, '1'],
    [
      {
        kind: 'range',
        operator: 'eq',
        low: '1',
        high: '2',
        ends: { lowInclusive: true, highInclusive: false },
      },
      '1, 2',
    ],
    [{ kind: 'list', operator: 'in', values: ['a', 'b'] }, 'a, b'],
    [{ kind: 'valueless', operator: 'none' }, ''],
    [{ kind: 'expression', text: 'x' }, 'x'],
  ])('joins the values of %o', (commit, values) => {
    expect(refusedValuesOf(commit)).toBe(values);
  });
});
