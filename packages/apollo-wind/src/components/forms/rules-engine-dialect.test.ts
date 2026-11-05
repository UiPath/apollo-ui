import { describe, expect, it } from 'vitest';
import {
  type Condition,
  type ConditionGroup,
  type ConditionNode,
  type ConditionOperators,
  type ConditionVocabulary,
  createCondition,
  createConditionGroup,
  DEFAULT_CONDITION_OPERATORS,
} from '@/components/ui/conditions-editor';
import { RulesEngine } from './rules-engine';
import {
  canName,
  canRun,
  createRulesEngineVocabulary,
  type FieldRuleField,
  parseExpression,
  printNode,
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
  {
    value: 'stage',
    label: 'Stage',
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

  it('adapts translated operators, and translates the message for unnamed keys', () => {
    const translated = Object.fromEntries(
      Object.entries(DEFAULT_CONDITION_OPERATORS).map(([type, operators]) => [
        type,
        operators.map((operator) => ({ ...operator, label: `fr:${operator.label}` })),
      ])
    ) as ConditionOperators;
    const { operators } = createRulesEngineVocabulary({
      operators: translated,
      strings: { errorUnnamedField: 'Champ sans nom' },
    });
    const contains = operators.string.find((operator) => operator.value === 'contains');
    expect(contains).toMatchObject({ label: 'fr:Contains', valueModes: ['literal'] });
    const greater = operators.number.find((operator) => operator.value === 'greaterThan');
    const field = { value: 'due-date', label: 'Due', type: 'number' as const };
    expect(greater?.valueError?.('1', { field, mode: 'literal' })).toBe('Champ sans nom');
  });
});

describe('printNode', () => {
  it('keeps the parentheses a member or call needs', () => {
    for (const text of ['(-amount).x', '(a ? b : c).d', '(a + b)(c)', 'String(a).includes("x")']) {
      const node = parseExpression(text);
      expect(node && printNode(node)).toBe(text);
    }
  });
});

describe('canName', () => {
  it('names identifier paths, but not keys jsep reads as something else', () => {
    expect(canName('user.role')).toBe(true);
    expect(canName('user.null')).toBe(true);
    for (const key of ['first-name', 'null', 'true.x', 'this', 'undefined', '1st', '']) {
      expect(canName(key)).toBe(false);
    }
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

  it('wraps option lists and empty checks in parentheses', () => {
    const text = write(
      all(
        row({ field: 'status', operator: 'isOneOf', values: ['open', 'closed'] }),
        row({ field: 'amount', operator: 'lessThan', value: '-1' }),
        row({ field: 'name', operator: 'isEmpty' })
      )
    );
    expect(text).toBe(
      '(status === "open" || status === "closed") && amount < -1 && (name == null || name === "")'
    );
    expect(holds(text ?? '', { status: 'closed', amount: -2 })).toBe(true);
    expect(holds(text ?? '', { status: 'held', amount: -2 })).toBe(false);
    expect(holds(text ?? '', { status: 'open', amount: -2, name: 'x' })).toBe(false);
  });

  it('writes an expression value in parentheses, as it parses', () => {
    const expression = (value: string) =>
      write(all(row({ field: 'amount', operator: 'equals', valueMode: 'expression', value })));
    expect(expression('limit * 2')).toBe('amount === (limit * 2)');
    expect(expression(' limit*2 ')).toBe('amount === (limit * 2)');
    // One that does not parse cannot be written, nor reach past its parentheses.
    expect(expression('limit *')).toBeUndefined();
    expect(expression('limit) || (true')).toBeUndefined();
  });

  it('writes no conditions as always true, and blank rows as nothing yet', () => {
    expect(write(createConditionGroup())).toBe('true');
    expect(write(all(createCondition()))).toBe('');
  });

  it('cannot write text matching, an incomplete row, or a group', () => {
    expect(write(all(row({ field: 'name', operator: 'contains', value: 'a' })))).toBeUndefined();
    expect(write(all(row({ field: 'amount', operator: 'equals' })))).toBeUndefined();
    expect(
      write(
        all(
          row({ field: 'name', operator: 'equals', value: 'a' }),
          any(row({ field: 'amount', operator: 'greaterThan', value: '1' }))
        )
      )
    ).toBeUndefined();
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

  it('reads option lists as Is one of and Is not one of, alone or in a chain', () => {
    expect(shape(read('status === "open" || status === "closed"') as ConditionGroup)).toEqual({
      mode: 'all',
      children: [{ field: 'status', operator: 'isOneOf', values: ['open', 'closed'] }],
    });
    expect(
      shape(read('amount > 1 && (status === "open" || status === "closed")') as ConditionGroup)
    ).toEqual({
      mode: 'all',
      children: [
        { field: 'amount', operator: 'greaterThan', value: '1' },
        { field: 'status', operator: 'isOneOf', values: ['open', 'closed'] },
      ],
    });
    expect(
      shape(read('amount > 1 || (status !== "open" && status !== "closed")') as ConditionGroup)
    ).toEqual({
      mode: 'any',
      children: [
        { field: 'amount', operator: 'greaterThan', value: '1' },
        { field: 'status', operator: 'isNotOneOf', values: ['open', 'closed'] },
      ],
    });
    // A field without options offers no list, so its chain reads as rows.
    expect(shape(read('name === "a" || name === "b"') as ConditionGroup)).toEqual({
      mode: 'any',
      children: [
        { field: 'name', operator: 'equals', value: 'a' },
        { field: 'name', operator: 'equals', value: 'b' },
      ],
    });
  });

  it('cannot read a part joined the other way, as a rule’s conditions are flat', () => {
    expect(read('name == "a" || (amount < -1 && amount != 0)')).toBeUndefined();
    expect(read('amount > 1 && (status === "open" || name === "a")')).toBeUndefined();
    // Two fields with the same options are still not one list.
    expect(read('amount > 1 && (stage === "open" || status === "closed")')).toBeUndefined();
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

  it('reads only the loose null check as empty, as an unset field is undefined', () => {
    expect(read('name === null || name === ""')).toBeUndefined();
    expect(read('name !== null && name !== ""')).toBeUndefined();
  });

  it('reads an expression value only when the editor offers Expression', () => {
    const fixedOnly = { ...VOCABULARY, valueModes: ['literal'] as const };
    expect(read('name === other')).toBeDefined();
    expect(rulesEngineDialect.fromExpression?.('name === other', fixedOnly)).toBeUndefined();
  });

  it('reads always true as no conditions', () => {
    expect(read('true')?.children).toEqual([]);
  });

  it('cannot read what a row cannot show', () => {
    for (const text of [
      'unknown === 1',
      '10 < amount',
      'String(name).includes(name)',
      'RegExp("[").test(String(name))',
      'amount * 2 === 4',
      'name === "a" &&',
      'name ? 1 : 2',
      'name === ""',
      'status === "held"',
    ]) {
      expect(read(text)).toBeUndefined();
    }
  });

  it('reads only strict comparisons with a value of the field’s type, which keep their meaning as rows', () => {
    for (const text of [
      'name == 1',
      'name != 1',
      'amount === "5"',
      'amount !== "5"',
      'status == "open" || status == "closed"',
      'amount == (limit)',
    ]) {
      expect(read(text)).toBeUndefined();
    }
    // The row would have said `name === "1"`, which "01" does not match.
    expect(holds('name == 1', { name: '01' })).toBe(true);
    expect(holds('name === "1"', { name: '01' })).toBe(false);
    expect(holds('amount === "5"', { amount: 5 })).toBe(false);
    expect(holds('amount === 5', { amount: 5 })).toBe(true);
    expect(shape(read('amount === 5 && name === "1"') as ConditionGroup)).toEqual({
      mode: 'all',
      children: [
        { field: 'amount', operator: 'equals', value: '5' },
        { field: 'name', operator: 'equals', value: '1' },
      ],
    });
  });

  it('reads no text matching from calls, which RulesEngine cannot run', () => {
    for (const text of [
      'String(name).includes("a")',
      'String(name).startsWith("x")',
      'RegExp("^a+$").test(String(name))',
    ]) {
      expect(read(text)).toBeUndefined();
    }
  });

  it('round-trips what it writes', () => {
    const group = all(
      row({ field: 'name', operator: 'notEquals', value: 'x' }),
      row({ field: 'status', operator: 'isOneOf', values: ['open', 'closed'] }),
      row({ field: 'amount', operator: 'greaterThan', value: '5' }),
      row({ field: 'amount', operator: 'lessThan', valueMode: 'expression', value: 'limit' }),
      row({ field: 'name', operator: 'isNotEmpty' })
    );
    expect(shape(read(write(group) ?? '') as ConditionGroup)).toEqual(shape(group));
  });
});

describe('checking what RulesEngine runs', () => {
  it('runs comparisons, arithmetic, and conditionals, but not calls or unknown syntax', () => {
    for (const text of ['amount > 1 && !(name === "a")', 'amount * 2 === 4', 'name ? 1 : 2']) {
      expect(canRun(text, FIELDS)).toBe(true);
    }
    for (const text of [
      'String(name).includes("a")',
      'new RegExp("a").test(name)',
      'name === "a" &&',
      '[1, 2]',
    ]) {
      expect(canRun(text, FIELDS)).toBe(false);
    }
  });

  it('runs `undefined`, as a missing field reads, but not `NaN` or `Infinity`, which read as fields', () => {
    expect(canRun('name === undefined', FIELDS)).toBe(true);
    expect(canRun('amount === NaN', FIELDS)).toBe(false);
    expect(canRun('amount < Infinity', FIELDS)).toBe(false);
    expect(RulesEngine.evaluateExpression('amount < Infinity', { amount: 1 })).toBe(false);
  });

  it('flags an expression it cannot run', () => {
    const check = (expression: string) =>
      rulesEngineDialect.checkExpression?.(
        { id: 'r', outcome: 'show', mode: 'expression', expression },
        VOCABULARY
      );
    expect(check('amount > 1')).toBeUndefined();
    expect(check('String(name).includes("a")')).toBe('invalid');
  });
});

describe('fieldsOf', () => {
  it('lists the field paths an expression names', () => {
    expect(rulesEngineDialect.fieldsOf?.('user.role === "a" && amount > limit')).toEqual([
      'user.role',
      'amount',
      'limit',
    ]);
    // A computed key names its object, as RulesEngine reads it: no field `my key`.
    expect(rulesEngineDialect.fieldsOf?.('values["my key"] === 1 && f(amount)')).toEqual([
      'values',
      'amount',
    ]);
  });

  it('names no function it calls, and no global', () => {
    expect(
      rulesEngineDialect.fieldsOf?.(
        'RegExp("a").test(String(name)) && amount.toFixed(2) === "1" && limit !== undefined'
      )
    ).toEqual(['name', 'amount', 'limit']);
    expect(rulesEngineDialect.fieldsOf?.('amount === NaN || amount < Infinity')).toEqual([
      'amount',
    ]);
  });
});
