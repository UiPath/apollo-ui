import { describe, expect, it } from 'vitest';
import {
  type Condition,
  type ConditionGroup,
  type ConditionNode,
  type ConditionVocabulary,
  createCondition,
  createConditionGroup,
} from '@/components/ui/conditions-editor';
import { RulesEngine } from './rules-engine';
import {
  type FieldRuleField,
  RULES_ENGINE_OPERATORS,
  rulesEngineDialect,
  rulesEngineVocabulary,
} from './rules-engine-dialect';

const FIELDS: FieldRuleField[] = [
  { value: 'name', label: 'Name', type: 'string' },
  { value: 'amount', label: 'Amount', type: 'number' },
  { value: 'limit', label: 'Limit', type: 'number' },
  {
    value: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'closed', label: 'Closed' },
    ],
  },
  { value: 'user.role', label: 'Role', type: 'string' },
];

const VOCABULARY: ConditionVocabulary = { fields: FIELDS, ...rulesEngineVocabulary };
const write = (group: ConditionGroup) => rulesEngineDialect.toExpression?.(group, VOCABULARY);
const read = (expression: string) => rulesEngineDialect.fromExpression?.(expression, VOCABULARY);
const holds = (expression: string, values: Record<string, unknown>) =>
  RulesEngine.evaluateExpression(expression, values);

/** A group without ids, to compare what it says. */
function shape(node: ConditionNode): unknown {
  if (node.kind === 'group') return { mode: node.mode, children: node.children.map(shape) };
  const { id: _id, kind: _kind, ...row } = node as Condition;
  return row;
}

const all = (...children: ConditionNode[]) => createConditionGroup('all', children);
const any = (...children: ConditionNode[]) => createConditionGroup('any', children);
const row = (init: Omit<Condition, 'kind' | 'id'>) => createCondition(init);

describe('rulesEngineVocabulary', () => {
  it('offers text matching and option lists with a fixed value only', () => {
    const fixedOnly = Object.values(RULES_ENGINE_OPERATORS)
      .flat()
      .filter((operator) => operator.valueModes?.length === 1)
      .map((operator) => operator.value);
    expect(new Set(fixedOnly)).toEqual(
      new Set(['contains', 'startsWith', 'matches', 'isOneOf', 'isNotOneOf'])
    );
    expect(rulesEngineVocabulary.valueModes).toEqual(['literal', 'expression']);
  });
});

describe('toExpression', () => {
  it('writes comparisons joined by the group’s mode, which RulesEngine runs', () => {
    const text = write(
      all(
        row({ field: 'name', operator: 'equals', value: 'Ada' }),
        row({ field: 'amount', operator: 'greaterThan', value: '10' })
      )
    );
    expect(text).toBe('name === "Ada" && amount > 10');
    expect(holds(text ?? '', { name: 'Ada', amount: 11 })).toBe(true);
    expect(holds(text ?? '', { name: 'Ada', amount: 9 })).toBe(false);
  });

  it('wraps nested groups and option lists in parentheses', () => {
    const text = write(
      any(
        row({ field: 'status', operator: 'isOneOf', values: ['open', 'closed'] }),
        all(
          row({ field: 'amount', operator: 'lessThan', value: '-1' }),
          row({ field: 'name', operator: 'isEmpty' })
        )
      )
    );
    expect(text).toBe(
      '(status === "open" || status === "closed") || (amount < -1 && (name == null || name === ""))'
    );
    expect(holds(text ?? '', { status: 'held', amount: -2 })).toBe(true);
    expect(holds(text ?? '', { status: 'held', amount: -2, name: 'x' })).toBe(false);
  });

  it('writes an expression value in parentheses', () => {
    expect(
      write(
        all(
          row({ field: 'amount', operator: 'equals', valueMode: 'expression', value: 'limit * 2' })
        )
      )
    ).toBe('amount === (limit * 2)');
  });

  it('writes no conditions as always true, and blank rows as nothing yet', () => {
    expect(write(createConditionGroup())).toBe('true');
    expect(write(all(createCondition()))).toBe('');
  });

  it('cannot write text matching or an incomplete row', () => {
    expect(write(all(row({ field: 'name', operator: 'contains', value: 'a' })))).toBeUndefined();
    expect(write(all(row({ field: 'amount', operator: 'equals' })))).toBeUndefined();
  });
});

describe('fromExpression', () => {
  it('reads a chain of comparisons as rows', () => {
    expect(shape(read('name === "Ada" && amount > 10') as ConditionGroup)).toEqual({
      mode: 'all',
      children: [
        { field: 'name', operator: 'equals', value: 'Ada' },
        { field: 'amount', operator: 'greaterThan', value: '10' },
      ],
    });
  });

  it('reads a part with the other operator as a nested group', () => {
    expect(shape(read('name == "a" || (amount < -1 && amount != 0)') as ConditionGroup)).toEqual({
      mode: 'any',
      children: [
        { field: 'name', operator: 'equals', value: 'a' },
        {
          mode: 'all',
          children: [
            { field: 'amount', operator: 'lessThan', value: '-1' },
            { field: 'amount', operator: 'notEquals', value: '0' },
          ],
        },
      ],
    });
  });

  it('reads empty checks, expression values, and dotted paths', () => {
    expect(
      shape(
        read(
          'name == null || name === "" || amount === limit + 1 || user.role != null && user.role !== ""'
        ) as ConditionGroup
      )
    ).toEqual({
      mode: 'any',
      children: [
        { field: 'name', operator: 'isEmpty' },
        { field: 'amount', operator: 'equals', valueMode: 'expression', value: 'limit + 1' },
        { field: 'user.role', operator: 'isNotEmpty' },
      ],
    });
  });

  it('reads always true as no conditions', () => {
    expect(read('true')?.children).toEqual([]);
  });

  it('cannot read what a row cannot show', () => {
    for (const text of [
      'unknown === 1',
      '10 < amount',
      'String(name).includes("a")',
      'amount * 2 === 4',
      'name === "a" &&',
      'name ? 1 : 2',
    ]) {
      expect(read(text)).toBeUndefined();
    }
  });

  it('round-trips what it writes', () => {
    const group = any(
      row({ field: 'name', operator: 'notEquals', value: 'x' }),
      all(
        row({ field: 'amount', operator: 'greaterThan', value: '5' }),
        row({ field: 'amount', operator: 'lessThan', valueMode: 'expression', value: 'limit' })
      )
    );
    expect(shape(read(write(group) ?? '') as ConditionGroup)).toEqual(shape(group));
  });
});
