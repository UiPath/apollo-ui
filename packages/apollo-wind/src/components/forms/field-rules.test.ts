import { describe, expect, it } from 'vitest';
import {
  type Condition,
  createCondition,
  createConditionGroup,
} from '@/components/ui/conditions-editor';
import {
  type ConditionsRule,
  createRule,
  type ExpressionRule,
  type Rule,
} from '@/components/ui/rules-editor';
import {
  type FieldRuleOutcome,
  type FieldRulesOptions,
  fromFieldRules,
  toFieldRules,
} from './field-rules';
import type { FieldCondition, FieldRule, FormContext } from './form-schema';
import { RulesEngine } from './rules-engine';
import type { FieldRuleField } from './rules-engine-dialect';

const FIELDS: FieldRuleField[] = [
  { value: 'name', label: 'Name', type: 'string' },
  { value: 'amount', label: 'Amount', type: 'number' },
  { value: 'limit', label: 'Limit', type: 'number' },
  { value: 'due', label: 'Due', type: 'date' },
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
    value: 'agree',
    label: 'Agree',
    type: 'enum',
    valueType: 'boolean',
    options: [
      { value: 'true', label: 'Yes' },
      { value: 'false', label: 'No' },
    ],
  },
];

const OUTCOMES: FieldRuleOutcome[] = [
  { value: 'show', label: 'Show', effects: { visible: true } },
  { value: 'hide', label: 'Hide', effects: { visible: false } },
  { value: 'require', label: 'Require', effects: { required: true } },
];

const OPTIONS: FieldRulesOptions = { outcomes: OUTCOMES, fields: FIELDS };

const showWhen = (...conditions: Condition[]) =>
  createRule({ id: 'r', outcome: 'show', conditions: createConditionGroup('all', conditions) });

const stored = (conditions: FieldCondition[], extra: Partial<FieldRule> = {}): FieldRule => ({
  id: 'r',
  conditions,
  operator: 'AND',
  effects: { visible: true },
  ...extra,
});

const visible = (rules: FieldRule[], values: Record<string, unknown>) =>
  RulesEngine.applyRules(rules, values, {} as FormContext).visible === true;

/** The parts of a row that matter, without its id. */
function rowOf(rule: Rule) {
  const {
    kind: _kind,
    id: _id,
    ...row
  } = (rule as ConditionsRule).conditions.children[0] as Condition;
  return row;
}

describe('writing and reading rows', () => {
  const CASES: {
    name: string;
    row: Omit<Condition, 'kind' | 'id'>;
    written: FieldCondition;
    matching: Record<string, unknown>;
    other: Record<string, unknown>;
  }[] = [
    {
      name: 'text equals',
      row: { field: 'name', operator: 'equals', value: 'Ada' },
      written: { when: 'name', is: 'Ada' },
      matching: { name: 'Ada' },
      other: { name: 'Bo' },
    },
    {
      name: 'number equals, as a number',
      row: { field: 'amount', operator: 'equals', value: '5' },
      written: { when: 'amount', is: 5 },
      matching: { amount: 5 },
      other: { amount: 6 },
    },
    {
      name: 'boolean equals, as a boolean',
      row: { field: 'agree', operator: 'equals', value: 'true' },
      written: { when: 'agree', is: true },
      matching: { agree: true },
      other: { agree: false },
    },
    {
      name: 'not equals',
      row: { field: 'name', operator: 'notEquals', value: 'Ada' },
      written: { when: 'name', isNot: 'Ada' },
      matching: { name: 'Bo' },
      other: { name: 'Ada' },
    },
    {
      name: 'one of',
      row: { field: 'status', operator: 'isOneOf', values: ['open', 'closed'] },
      written: { when: 'status', in: ['open', 'closed'] },
      matching: { status: 'closed' },
      other: { status: 'held' },
    },
    {
      name: 'not one of',
      row: { field: 'status', operator: 'isNotOneOf', values: ['open'] },
      written: { when: 'status', notIn: ['open'] },
      matching: { status: 'closed' },
      other: { status: 'open' },
    },
    {
      name: 'contains, with pattern characters escaped',
      row: { field: 'name', operator: 'contains', value: 'a.b' },
      written: { when: 'name', matches: 'a\\.b' },
      matching: { name: 'xa.by' },
      other: { name: 'axb' },
    },
    {
      name: 'starts with',
      row: { field: 'name', operator: 'startsWith', value: 'Ac' },
      written: { when: 'name', matches: '^Ac' },
      matching: { name: 'Acme' },
      other: { name: 'MacAc' },
    },
    {
      name: 'matches a pattern as written',
      row: { field: 'name', operator: 'matches', value: '^x+$' },
      written: { when: 'name', matches: '^x+$' },
      matching: { name: 'xxx' },
      other: { name: 'xy' },
    },
    {
      name: 'is empty, including a field never filled in',
      row: { field: 'name', operator: 'isEmpty' },
      written: { when: 'name', custom: 'name == null || name === ""' },
      matching: {},
      other: { name: 'Ada' },
    },
    {
      name: 'is not empty',
      row: { field: 'amount', operator: 'isNotEmpty' },
      written: { when: 'amount', custom: 'amount != null && amount !== ""' },
      matching: { amount: 0 },
      other: {},
    },
    {
      name: 'greater than',
      row: { field: 'amount', operator: 'greaterThan', value: '10' },
      written: { when: 'amount', custom: 'amount > 10' },
      matching: { amount: 11 },
      other: { amount: 10 },
    },
    {
      name: 'before a date',
      row: { field: 'due', operator: 'lessThan', value: '2026-12-31' },
      written: { when: 'due', custom: 'due < "2026-12-31"' },
      matching: { due: '2026-06-01' },
      other: { due: '2027-01-01' },
    },
    {
      name: 'an expression value',
      row: { field: 'amount', operator: 'equals', valueMode: 'expression', value: 'limit * 2' },
      written: { when: 'amount', custom: 'amount === (limit * 2)' },
      matching: { amount: 8, limit: 4 },
      other: { amount: 8, limit: 3 },
    },
  ];

  for (const { name, row, written, matching, other } of CASES) {
    it(`${name}: writes, runs, and reads back`, () => {
      const [rule] = toFieldRules([showWhen(createCondition(row))], OPTIONS);
      expect(rule.conditions).toEqual([written]);
      expect(visible([rule], matching)).toBe(true);
      expect(visible([rule], other)).toBe(false);
      const [read] = fromFieldRules([rule], OPTIONS);
      expect(read.mode).toBe('conditions');
      expect(rowOf(read)).toEqual(row);
    });
  }
});

describe('writing rules', () => {
  it('writes All and Any as the rule operator, and an outcome as its effects', () => {
    const rule = createRule({
      id: 'r',
      outcome: 'require',
      conditions: createConditionGroup('any', [
        createCondition({ field: 'name', operator: 'equals', value: 'a' }),
        createCondition({ field: 'name', operator: 'equals', value: 'b' }),
      ]),
    });
    expect(toFieldRules([rule], OPTIONS)).toEqual([
      {
        id: 'r',
        conditions: [
          { when: 'name', is: 'a' },
          { when: 'name', is: 'b' },
        ],
        operator: 'OR',
        effects: { required: true },
      },
    ]);
  });

  it('writes an expression rule as one expression condition', () => {
    const [rule] = toFieldRules(
      [createRule({ id: 'r', outcome: 'hide', expression: ' amount > limit ' })],
      OPTIONS
    );
    expect(rule).toEqual({
      id: 'r',
      conditions: [{ when: '', custom: 'amount > limit' }],
      operator: 'AND',
      effects: { visible: false },
    });
    expect(RulesEngine.applyRules([rule], { amount: 3, limit: 2 }, {} as FormContext)).toEqual({
      visible: false,
    });
  });

  it('writes a nested group as one expression', () => {
    const rule = showWhen(
      createCondition({ field: 'name', operator: 'equals', value: 'a' }),
      createConditionGroup('any', [
        createCondition({ field: 'amount', operator: 'greaterThan', value: '5' }),
        createCondition({ field: 'status', operator: 'equals', value: 'open' }),
      ])
    );
    const [written] = toFieldRules([rule], OPTIONS);
    expect(written.conditions).toEqual([
      { when: 'name', is: 'a' },
      { when: '', custom: 'amount > 5 || status === "open"' },
    ]);
    expect(visible([written], { name: 'a', status: 'open' })).toBe(true);
    expect(visible([written], { name: 'a', status: 'closed', amount: 1 })).toBe(false);
  });

  it('leaves out incomplete conditions, and a rule with none complete', () => {
    const partly = showWhen(
      createCondition({ field: 'name', operator: 'equals', value: 'a' }),
      createCondition({ field: 'amount' })
    );
    const unfinished = createRule({ id: 'u', outcome: 'show' });
    const blank = createRule({ id: 'b', outcome: 'show', expression: '  ' });
    const always = createRule({ id: 'x', outcome: 'require', conditions: createConditionGroup() });
    expect(toFieldRules([partly, unfinished, blank, always], OPTIONS)).toEqual([
      expect.objectContaining({ id: 'r', conditions: [{ when: 'name', is: 'a' }] }),
      expect.objectContaining({ id: 'x', conditions: [] }),
    ]);
  });

  it('keeps effects no outcome claims, and lets a new outcome replace the old', () => {
    const [read] = fromFieldRules(
      [stored([], { effects: { visible: true, disabled: true } })],
      OPTIONS
    );
    expect(read.outcome).toBe('show');
    const [written] = toFieldRules([{ ...read, outcome: 'hide' }], OPTIONS);
    expect(written.effects).toEqual({ disabled: true, visible: false });
  });
});

describe('reading stored rules', () => {
  it('gives an untouched rule back as the stored object', () => {
    const rules = [
      stored([{ when: 'name', is: 'Ada' }]),
      stored([{ when: '', custom: 'String(values["name"]).includes("x")' }], { id: 'legacy' }),
    ];
    const read = fromFieldRules(rules, OPTIONS);
    const written = toFieldRules(read, OPTIONS);
    expect(written[0]).toBe(rules[0]);
    expect(written[1]).toBe(rules[1]);
  });

  it('reads the same ids every time, falling back to the position', () => {
    const rules = [stored([{ when: 'name', is: 'a' }], { id: '' })];
    const first = fromFieldRules(rules, OPTIONS)[0] as ConditionsRule;
    const second = fromFieldRules(rules, OPTIONS)[0] as ConditionsRule;
    expect(first.id).toBe('rule-0');
    expect(second.conditions.children[0].id).toBe(first.conditions.children[0].id);
  });

  it('reads an outcome no option claims as unchosen, keeping its effects', () => {
    const [read] = fromFieldRules([stored([], { effects: { disabled: true } })], OPTIONS);
    expect(read.outcome).toBe('');
    const [written] = toFieldRules([{ ...read, id: 'edited' }], OPTIONS);
    expect(written.effects).toEqual({ disabled: true });
  });

  describe('hitl’s earlier forms', () => {
    it('reads a placeholder row as a blank row', () => {
      const [read] = fromFieldRules([stored([{ when: '' }])], OPTIONS);
      expect(rowOf(read)).toEqual({});
    });

    it('reads empty-string checks as Is empty and Is not empty', () => {
      const [read] = fromFieldRules(
        [
          stored([
            { when: 'name', is: '' },
            { when: 'name', isNot: '' },
          ]),
        ],
        OPTIONS
      );
      const rows = (read as ConditionsRule).conditions.children as Condition[];
      expect(rows.map((row) => row.operator)).toEqual(['isEmpty', 'isNotEmpty']);
    });

    it('reads a number stored as text, and writes it as a number once edited', () => {
      const [read] = fromFieldRules([stored([{ when: 'amount', is: '5' }])], OPTIONS);
      expect(rowOf(read)).toEqual({ field: 'amount', operator: 'equals', value: '5' });
      const [written] = toFieldRules([{ ...read, outcome: 'hide' }], OPTIONS);
      expect(written.conditions).toEqual([{ when: 'amount', is: 5 }]);
    });

    it('reads hitl’s expression values and empty checks as rows', () => {
      const [read] = fromFieldRules(
        [
          stored([
            { when: 'amount', custom: 'values["amount"] === (limit + 1)' },
            { when: 'name', custom: 'values["name"] == null || values["name"] === ""' },
          ]),
        ],
        OPTIONS
      );
      const rows = (read as ConditionsRule).conditions.children as Condition[];
      expect(rows[0]).toMatchObject({
        field: 'amount',
        operator: 'equals',
        valueMode: 'expression',
        value: 'limit + 1',
      });
      expect(rows[1]).toMatchObject({ field: 'name', operator: 'isEmpty' });
      // Rewritten so they run: hitl's `values[...]` never resolved.
      const [written] = toFieldRules([{ ...read, outcome: 'show', id: 'edited' }], OPTIONS);
      expect(visible([written], { amount: 3, limit: 2 })).toBe(true);
    });

    it('opens expressions RulesEngine cannot run, or a row cannot show, as an expression', () => {
      for (const custom of [
        'String(values["name"]).includes("x")',
        'new RegExp("x").test(String(values["name"]))',
        '(amount * 2) === 4',
      ]) {
        const [read] = fromFieldRules([stored([{ when: '', custom }])], OPTIONS);
        expect(read).toMatchObject({ mode: 'expression', expression: custom });
      }
    });

    it('opens a rule that mixes rows and expressions as one expression', () => {
      const [read] = fromFieldRules(
        [
          stored(
            [
              { when: 'name', is: 'a' },
              { when: '', custom: '(amount * 2) === 4' },
            ],
            { operator: 'OR' }
          ),
        ],
        OPTIONS
      );
      expect((read as ExpressionRule).expression).toBe('(name === "a") || ((amount * 2) === 4)');
    });

    it('keeps a pattern beside an expression as stored, joined the same way', () => {
      const rule = stored(
        [
          { when: 'name', matches: '^a+$' },
          { when: '', custom: '(amount * 2) === 4' },
        ],
        { operator: 'OR' }
      );
      const [read] = fromFieldRules([rule], OPTIONS);
      expect((read as ExpressionRule).expression).toBe('(amount * 2) === 4');
      const edited = { ...(read as ExpressionRule), expression: '(amount * 3) === 6' };
      const [written] = toFieldRules([edited], OPTIONS);
      expect(written).toMatchObject({
        operator: 'OR',
        conditions: [
          { when: 'name', matches: '^a+$' },
          { when: '', custom: '(amount * 3) === 6' },
        ],
      });
      expect(visible([written], { name: 'aa', amount: 0 })).toBe(true);
      expect(visible([written], { name: 'b', amount: 2 })).toBe(true);
      expect(visible([written], { name: 'b', amount: 1 })).toBe(false);
    });

    it('reads a condition on a field the form no longer has, flagged in the editor', () => {
      const [read] = fromFieldRules([stored([{ when: 'gone', is: 'x' }])], OPTIONS);
      expect(rowOf(read)).toEqual({ field: 'gone', operator: 'equals', value: 'x' });
    });
  });
});
