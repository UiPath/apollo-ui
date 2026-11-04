import { describe, expect, it } from 'vitest';
import {
  type Condition,
  createCondition,
  createConditionGroup,
  DEFAULT_CONDITIONS_EDITOR_STRINGS,
  isConditionComplete,
} from '@/components/ui/conditions-editor';
import { conditionError } from '@/components/ui/conditions-editor/status';
import {
  type ConditionsRule,
  createRule,
  type ExpressionRule,
  type PreservedRule,
  type Rule,
} from '@/components/ui/rules-editor';
import {
  alwaysApplying,
  type FieldRuleOutcome,
  type FieldRulesOptions,
  fromFieldRules,
  readStoredRules,
  renameFieldInRules,
  rulesReferencing,
  settleAlways,
  toFieldRules,
  writeStoredRules,
} from './field-rules';
import type { FieldCondition, FieldRule, FormContext } from './form-schema';
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
const VOCABULARY = { fields: FIELDS, ...rulesEngineVocabulary };

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

/** The parts of each row that matter, without their ids. */
const shapeOf = (group: { children: readonly unknown[] }) =>
  (group.children as Condition[]).map(({ kind: _kind, id: _id, ...row }) => row);

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

  it('writes an expression rule as one expression condition, on the first field it reads', () => {
    const [rule] = toFieldRules(
      [createRule({ id: 'r', outcome: 'hide', expression: ' amount > limit ' })],
      OPTIONS
    );
    expect(rule).toEqual({
      id: 'r',
      conditions: [{ when: 'amount', custom: 'amount > limit' }],
      operator: 'AND',
      effects: { visible: false },
    });
    expect(RulesEngine.applyRules([rule], { amount: 3, limit: 2 }, {} as FormContext)).toEqual({
      visible: false,
    });
  });

  it('writes an expression rule that reads no field on no field', () => {
    const [rule] = toFieldRules(
      [createRule({ id: 'r', outcome: 'hide', expression: 'true' })],
      OPTIONS
    );
    expect(rule.conditions).toEqual([{ when: '', custom: 'true' }]);
  });

  it('writes an empty check as an empty string on a key no expression can name', () => {
    const options = {
      ...OPTIONS,
      fields: [{ value: 'first-name', label: 'First name', type: 'string' as const }],
    };
    const [written] = toFieldRules(
      [
        showWhen(
          createCondition({ field: 'first-name', operator: 'isEmpty' }),
          createCondition({ field: 'first-name', operator: 'isNotEmpty' })
        ),
      ],
      options
    );
    expect(written.conditions).toEqual([
      { when: 'first-name', is: '' },
      { when: 'first-name', isNot: '' },
    ]);
  });

  it('flags a comparison only an expression can store, on a key no expression can name', () => {
    const fields = [{ value: 'due-date', label: 'Due', type: 'number' as const }];
    const vocabulary = { fields, ...rulesEngineVocabulary };
    const greater = createCondition({ field: 'due-date', operator: 'greaterThan', value: '5' });
    const fromExpression = createCondition({
      field: 'due-date',
      operator: 'equals',
      valueMode: 'expression',
      value: 'limit',
    });
    for (const row of [greater, fromExpression]) {
      expect(isConditionComplete(row, vocabulary)).toBe(false);
      expect(conditionError(row, vocabulary, DEFAULT_CONDITIONS_EDITOR_STRINGS)).toBe(
        "Expressions can't name this field, so this comparison can't run."
      );
    }
    const fixed = createCondition({ field: 'due-date', operator: 'equals', value: '5' });
    expect(isConditionComplete(fixed, vocabulary)).toBe(true);
    expect(toFieldRules([showWhen(fixed)], { ...OPTIONS, fields })[0].conditions).toEqual([
      { when: 'due-date', is: 5 },
    ]);
    // The same rows on a key an expression names are stored.
    const named = { fields: [{ ...fields[0], value: 'due' }], ...rulesEngineVocabulary };
    expect(isConditionComplete({ ...greater, field: 'due' }, named)).toBe(true);
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

  it('leaves out a pattern that does not compile while it is typed, so RulesEngine never sees it', () => {
    const typing = showWhen(createCondition({ field: 'name', operator: 'matches', value: '[' }));
    expect(toFieldRules([typing], OPTIONS)).toEqual([]);
    const done = showWhen(createCondition({ field: 'name', operator: 'matches', value: '[ab]' }));
    const written = toFieldRules([done], OPTIONS);
    expect(() => visible(written, { name: 'a' })).not.toThrow();
    expect(visible(written, { name: 'a' })).toBe(true);
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

  it('picks the first of outcomes that claim as much', () => {
    const outcomes = [
      { value: 'show', label: 'Show', effects: { visible: true } },
      { value: 'reveal', label: 'Reveal', effects: { visible: true } },
    ];
    const [read] = fromFieldRules([stored([])], { ...OPTIONS, outcomes });
    expect(read.outcome).toBe('show');
  });

  it('reads an operator the options leave out as an expression', () => {
    const operators = {
      ...RULES_ENGINE_OPERATORS,
      number: RULES_ENGINE_OPERATORS.number.filter((option) => option.value !== 'greaterThan'),
    };
    const [read] = fromFieldRules([stored([{ when: 'amount', custom: 'amount > 5' }])], {
      ...OPTIONS,
      operators,
    });
    expect(read).toMatchObject({ mode: 'expression', expression: 'amount > 5' });
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

    it('reads hitl’s text matching calls as rows, which store them so they run', () => {
      const [read] = fromFieldRules(
        [stored([{ when: '', custom: 'String(values["name"]).includes("x")' }])],
        OPTIONS
      );
      expect(rowOf(read)).toEqual({ field: 'name', operator: 'contains', value: 'x' });
      const [written] = toFieldRules([{ ...read, id: 'edited' }], OPTIONS);
      expect(written.conditions).toEqual([{ when: 'name', matches: 'x' }]);
      expect(visible([written], { name: 'axe' })).toBe(true);
    });

    it('opens expressions RulesEngine cannot run, or a row cannot show, as an expression', () => {
      for (const custom of ['new RegExp("x").test(String(values["name"]))', '(amount * 2) === 4']) {
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

    describe('a rule no expression RulesEngine runs can say', () => {
      // A pattern beside an expression joined the other way: neither flat rows nor an expression.
      const rule = stored(
        [
          { when: 'name', matches: '^a+$' },
          { when: '', custom: 'amount === 2 && name === "x"' },
        ],
        { operator: 'OR' }
      );
      const expression = '(RegExp("^a+$").test(String(name))) || (amount === 2 && name === "x")';

      it('opens preserved, showing its stored conditions', () => {
        const [read] = fromFieldRules([rule], OPTIONS);
        expect(read).toMatchObject({ mode: 'preserved' });
        expect(JSON.parse((read as PreservedRule).preservedSource)).toEqual({
          operator: 'OR',
          conditions: rule.conditions,
        });
      });

      it('is stored as it was, so a new outcome keeps the pattern', () => {
        const [read] = fromFieldRules([rule], OPTIONS);
        const [written] = toFieldRules([{ ...read, outcome: 'hide' }], OPTIONS);
        expect(written).toEqual({ ...rule, effects: { visible: false } });
        expect(visible([written], { name: 'aa' })).toBe(false);
      });

      it('would read as an expression RulesEngine cannot run', () => {
        const check = { id: 'r', outcome: 'show', mode: 'expression', expression } as const;
        expect(rulesEngineDialect.checkExpression?.(check, VOCABULARY)).toBe('invalid');
        expect(rulesEngineDialect.fromExpression?.(expression, VOCABULARY)).toBeUndefined();
      });
    });

    it('preserves a pattern beside an expression, and stores rows written in its place so they run', () => {
      const rule = stored([
        { when: 'name', matches: '^a+$' },
        { when: '', custom: '(amount * 2) === 4' },
      ]);
      const [read] = fromFieldRules([rule], OPTIONS);
      expect(read.mode).toBe('preserved');
      // The author starts over with an expression rows can say, then switches.
      const flat = '(RegExp("^a+$").test(String(name))) && (amount === 2)';
      const group = rulesEngineDialect.fromExpression?.(flat, VOCABULARY);
      expect(group && shapeOf(group)).toEqual([
        { field: 'name', operator: 'matches', value: '^a+$' },
        { field: 'amount', operator: 'equals', value: '2' },
      ]);
      const asRows = { ...read, mode: 'conditions', conditions: group } as ConditionsRule;
      const [written] = toFieldRules([asRows], OPTIONS);
      expect(written.conditions).toEqual([
        { when: 'name', matches: '^a+$' },
        { when: 'amount', is: 2 },
      ]);
      expect(visible([written], { name: 'aa', amount: 2 })).toBe(true);
      expect(visible([written], { name: 'b', amount: 2 })).toBe(false);
    });

    it('opens a condition RulesEngine cannot run as stored as an expression, flagged', () => {
      const [read] = fromFieldRules([stored([{ when: 'name', matches: '[' }])], OPTIONS);
      expect(read).toMatchObject({
        mode: 'expression',
        expression: 'RegExp("[").test(String(name))',
      });
      expect(rulesEngineDialect.checkExpression?.(read as ExpressionRule, VOCABULARY)).toBe(
        'invalid'
      );
      for (const custom of ['name === ""', 'status === "held"']) {
        const [expression] = fromFieldRules([stored([{ when: '', custom }])], OPTIONS);
        expect(expression).toMatchObject({ mode: 'expression', expression: custom });
      }
    });

    it('opens a condition with several keys as the one RulesEngine reads', () => {
      const [read] = fromFieldRules([stored([{ when: 'name', is: 'a', isNot: 'b' }])], OPTIONS);
      expect(read).toMatchObject({ mode: 'expression', expression: 'name === "a"' });
    });

    it('reads a condition on a field the form no longer has, flagged in the editor', () => {
      const [read] = fromFieldRules([stored([{ when: 'gone', is: 'x' }])], OPTIONS);
      expect(rowOf(read)).toEqual({ field: 'gone', operator: 'equals', value: 'x' });
    });

    it('keeps such a condition while the rest of its rule changes, until it is edited', () => {
      const gone: FieldCondition = { when: 'gone', is: 'x' };
      const [read] = fromFieldRules([stored([gone, { when: 'amount', is: 2 }])], OPTIONS);
      const rule = read as ConditionsRule;
      const [kept, other] = rule.conditions.children as Condition[];
      const edited = {
        ...rule,
        outcome: 'hide',
        conditions: { ...rule.conditions, children: [kept, { ...other, value: '3' }] },
      };
      expect(toFieldRules([edited], OPTIONS)[0]).toMatchObject({
        conditions: [gone, { when: 'amount', is: 3 }],
        effects: { visible: false },
      });
      // Only one: still kept, rather than the rule dropped.
      const [alone] = fromFieldRules([stored([gone])], OPTIONS);
      expect(toFieldRules([{ ...alone, outcome: 'hide' }], OPTIONS)[0].conditions).toEqual([gone]);
      // Once edited, it is written as the editor says: incomplete, so left out.
      const changed = {
        ...rule,
        conditions: { ...rule.conditions, children: [{ ...kept, value: 'y' }, other] },
      };
      expect(toFieldRules([changed], OPTIONS)[0].conditions).toEqual([{ when: 'amount', is: 2 }]);
    });
  });
});

describe('the required flag', () => {
  const FLAG: FieldRulesOptions = { ...OPTIONS, requiredOutcome: 'require' };
  const always = (outcome: string, id = 'a') =>
    createRule({ id, outcome, conditions: createConditionGroup('all', []) });
  const legacyRequired: FieldRule = {
    id: 'legacy',
    conditions: [],
    operator: 'AND',
    effects: { required: true },
  };

  it('reads the flag as a rule of the required outcome with no conditions, first', () => {
    const rules = readStoredRules(
      { rules: [stored([{ when: 'name', is: 'Ada' }])], required: true },
      FLAG
    );
    expect(rules).toHaveLength(2);
    expect(rules[0]).toMatchObject({ outcome: 'require', conditions: { children: [] } });
    expect(readStoredRules({ required: true }, FLAG)).toEqual(
      readStoredRules({ required: true }, FLAG)
    );
  });

  it('reads nothing for the flag without requiredOutcome, or with the flag unset', () => {
    expect(readStoredRules({ required: true }, OPTIONS)).toEqual([]);
    expect(readStoredRules({ required: false }, FLAG)).toEqual([]);
  });

  it('lets a stored rule that already is one stand for the flag', () => {
    const rules = readStoredRules({ rules: [legacyRequired], required: true }, FLAG);
    expect(rules).toHaveLength(1);
    expect(writeStoredRules(rules, FLAG)).toEqual({ rules: [], required: true });
  });

  it('writes the first such rule as the flag and the rest as rules', () => {
    const written = writeStoredRules([showWhen(), always('require'), always('require', 'b')], FLAG);
    expect(written.required).toBe(true);
    expect(written.rules).toEqual([
      expect.objectContaining({ effects: { visible: true } }),
      expect.objectContaining({ id: 'b', conditions: [], effects: { required: true } }),
    ]);
  });

  it('writes no flag for another outcome, or without requiredOutcome', () => {
    expect(writeStoredRules([always('show')], FLAG).required).toBe(false);
    const asRule = writeStoredRules([always('require')], OPTIONS);
    expect(asRule).toEqual({
      rules: [{ id: 'a', conditions: [], operator: 'AND', effects: { required: true } }],
      required: false,
    });
  });

  it('leaves the flag alone for an outcome that does more than require', () => {
    const outcomes = OUTCOMES.map((outcome) =>
      outcome.value === 'require'
        ? { ...outcome, effects: { required: true, visible: true } }
        : outcome
    );
    const options: FieldRulesOptions = { ...FLAG, outcomes };
    const rules = [always('hide', 'h'), always('require', 'r')];
    const { rules: written, required } = writeStoredRules(rules, options);
    expect(required).toBe(false);
    expect(written.map((rule) => rule.effects)).toEqual([
      { visible: false },
      { required: true, visible: true },
    ]);
    // The later rule still shows the field, as it did.
    expect(visible(written, {})).toBe(true);
    expect(readStoredRules({ rules: [], required: true }, options)).toEqual([]);
  });

  it('keeps a Required rule a rule when an earlier rule makes the field optional', () => {
    const outcomes = [
      ...OUTCOMES,
      { value: 'optional', label: 'Optional', effects: { required: false } },
    ];
    const options: FieldRulesOptions = { ...FLAG, outcomes };
    const rules = [always('optional', 'o'), always('require', 'r')];
    const { rules: written, required } = writeStoredRules(rules, options);
    expect(required).toBe(false);
    expect(written.map((rule) => rule.id)).toEqual(['o', 'r']);
    expect(RulesEngine.applyRules(written, {}, {} as FormContext).required).toBe(true);
    // Required first still becomes the flag: the Optional rule overrides it either way.
    expect(writeStoredRules([...rules].reverse(), options)).toMatchObject({
      rules: [expect.objectContaining({ id: 'o' })],
      required: true,
    });
  });

  it('keeps a rule with effects of its own a rule', () => {
    const rules = fromFieldRules(
      [{ ...legacyRequired, effects: { required: true, disabled: true } }],
      FLAG
    );
    expect(writeStoredRules(rules, FLAG)).toEqual({
      rules: [expect.objectContaining({ effects: { required: true, disabled: true } })],
      required: false,
    });
  });
});

describe('rules that applied always', () => {
  const blank = showWhen(createCondition());
  const done = showWhen(createCondition({ field: 'name', operator: 'equals', value: 'Ada' }));

  it('lists the rules with no conditions', () => {
    expect([...alwaysApplying([showWhen(), done])]).toEqual(['r']);
    expect(alwaysApplying([done]).size).toBe(0);
  });

  it('keeps one applying always while none of its conditions is finished', () => {
    const [settled] = settleAlways([blank], OPTIONS, new Set(['r']));
    expect(settled).toMatchObject({ conditions: { children: [] } });
    expect(settleAlways([done], OPTIONS, new Set(['r']))[0]).toBe(done);
  });

  it('leaves alone a rule that did not apply always', () => {
    expect(settleAlways([blank], OPTIONS, new Set())[0]).toBe(blank);
  });
});

describe('renaming and finding field references', () => {
  const rules: FieldRule[] = [
    stored([{ when: 'amount', is: 1 }], { id: 'when' }),
    stored([{ when: '', custom: 'amount > limit && name === "amount"' }], { id: 'expression' }),
    stored([{ when: '', custom: 'user.role === "a" || values["amount"] === 2' }], { id: 'paths' }),
    stored([{ when: 'name', is: 'a' }], { id: 'other' }),
  ];

  it('renames the field in `when` and in expressions, leaving string literals alone', () => {
    const renamed = renameFieldInRules(rules, 'amount', 'total');
    expect(renamed[0].conditions).toEqual([{ when: 'total', is: 1 }]);
    expect(renamed[1].conditions[0].custom).toBe('(total > limit) && (name === "amount")');
    expect(renamed[2].conditions[0].custom).toBe('(user.role === "a") || (values["total"] === 2)');
    // A rule that names neither is the same object.
    expect(renamed[3]).toBe(rules[3]);
    expect(visible([renamed[1]], { total: 3, limit: 2, name: 'amount' })).toBe(true);
  });

  it('renames paths into a field, and leaves text that does not parse as it is', () => {
    const [path] = renameFieldInRules(
      [stored([{ when: 'user.role', custom: 'user.role === "a"' }])],
      'user',
      'member'
    );
    expect(path.conditions).toEqual([{ when: 'member.role', custom: 'member.role === "a"' }]);
    const broken = stored([{ when: '', custom: 'amount ===' }]);
    expect(renameFieldInRules([broken], 'amount', 'total')[0]).toBe(broken);
  });

  it('renames a field named like a function only where it is the field', () => {
    const calls = stored([
      { when: '', custom: 'String(name).includes(String) && RegExp("a").test(String.trim())' },
    ]);
    expect(rulesReferencing([calls], 'String')).toEqual(['r']);
    const [renamed] = renameFieldInRules([calls], 'String', 'label');
    expect(renamed.conditions[0].custom).toBe(
      'String(name).includes(label) && RegExp("a").test(label.trim())'
    );
    const [untouched] = renameFieldInRules(
      [stored([{ when: '', custom: 'String(name).includes("x")' }])],
      'String',
      'label'
    );
    expect(untouched.conditions[0].custom).toBe('String(name).includes("x")');
  });

  it('renames nothing to the same name, or from or to no name', () => {
    for (const [from, to] of [
      ['amount', 'amount'],
      ['', 'total'],
      ['amount', ''],
    ]) {
      renameFieldInRules(rules, from, to).forEach((rule, index) => {
        expect(rule).toBe(rules[index]);
      });
    }
  });

  it('lists the rules that name a field', () => {
    expect(rulesReferencing(rules, 'amount')).toEqual(['when', 'expression', 'paths']);
    expect(rulesReferencing(rules, 'user')).toEqual(['paths']);
    expect(rulesReferencing(rules, 'gone')).toEqual([]);
    expect(rulesReferencing([...rules, stored([{ when: '', custom: 'true' }])], '')).toEqual([]);
  });
});
