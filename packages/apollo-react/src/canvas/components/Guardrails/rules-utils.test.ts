import { describe, expect, it } from 'vitest';
import type { GuardrailFieldGroup, GuardrailRule, GuardrailWordRule } from './rules-types';
import {
  changeGuardrailRuleType,
  createGuardrailRule,
  getGuardrailFieldName,
  getGuardrailRuleErrorFields,
  getGuardrailRulesErrorFields,
  getGuardrailRuleTypeOptions,
  guardrailOperatorTakesValue,
  isPristineGuardrailRule,
  setGuardrailAlwaysEnforced,
  toggleGuardrailFieldReference,
  toggleGuardrailSelectorField,
} from './rules-utils';

const word = (overrides: Partial<GuardrailWordRule> = {}): GuardrailWordRule => ({
  ...createGuardrailRule('word'),
  ...overrides,
});

const group: GuardrailFieldGroup = {
  input: [{ path: 'customer.email', source: 'input', title: 'Customer email' }],
  output: [{ path: 'summary', source: 'output' }],
};

describe('createGuardrailRule', () => {
  it('builds the defaults both products seed', () => {
    expect(createGuardrailRule('word')).toEqual({
      $ruleType: 'word',
      fieldSelector: { $selectorType: 'all' },
      operator: 'contains',
      value: '',
    });
    expect(createGuardrailRule('number')).toEqual({
      $ruleType: 'number',
      fieldSelector: { $selectorType: 'all' },
      operator: 'equals',
      value: 0,
    });
    expect(createGuardrailRule('boolean')).toEqual({
      $ruleType: 'boolean',
      fieldSelector: { $selectorType: 'all' },
      operator: 'equals',
      value: false,
    });
    expect(createGuardrailRule('always')).toEqual({
      $ruleType: 'always',
      applyTo: 'inputAndOutput',
    });
  });

  it('returns a new object every time', () => {
    const a = createGuardrailRule('word');
    const b = createGuardrailRule('word');
    expect(a).not.toBe(b);
    expect(a.fieldSelector).not.toBe(b.fieldSelector);
  });
});

describe('changeGuardrailRuleType', () => {
  it('keeps the rule when the type does not change', () => {
    const rule = word({ value: 'secret' });
    expect(changeGuardrailRuleType(rule, 'word')).toBe(rule);
  });

  it('starts a new type over, field selection included', () => {
    const rule = word({
      fieldSelector: { $selectorType: 'specific', fields: [group.input[0]!] },
      operator: 'startsWith',
      value: 'abc',
    });
    expect(changeGuardrailRuleType(rule, 'number')).toEqual(createGuardrailRule('number'));
  });
});

describe('guardrailOperatorTakesValue', () => {
  it('is false only for the two emptiness checks', () => {
    expect(guardrailOperatorTakesValue('isEmpty')).toBe(false);
    expect(guardrailOperatorTakesValue('isNotEmpty')).toBe(false);
    for (const operator of ['contains', 'equals', 'matchesRegex', 'greaterThan'] as const) {
      expect(guardrailOperatorTakesValue(operator)).toBe(true);
    }
  });
});

describe('getGuardrailRuleErrorFields', () => {
  it('passes the defaults of number and boolean rules, and an always rule', () => {
    expect(getGuardrailRuleErrorFields(createGuardrailRule('number'))).toEqual([]);
    expect(getGuardrailRuleErrorFields(createGuardrailRule('boolean'))).toEqual([]);
    expect(getGuardrailRuleErrorFields(createGuardrailRule('always'))).toEqual([]);
  });

  it('requires a word value, ignoring surrounding whitespace', () => {
    expect(getGuardrailRuleErrorFields(word())).toEqual(['value']);
    expect(getGuardrailRuleErrorFields(word({ value: '   ' }))).toEqual(['value']);
    expect(getGuardrailRuleErrorFields(word({ value: undefined }))).toEqual(['value']);
    expect(getGuardrailRuleErrorFields(word({ value: 'x' }))).toEqual([]);
  });

  it('asks no value of the emptiness checks', () => {
    expect(getGuardrailRuleErrorFields(word({ operator: 'isEmpty' }))).toEqual([]);
    expect(getGuardrailRuleErrorFields(word({ operator: 'isNotEmpty' }))).toEqual([]);
  });

  it('flags a specific selection with no fields in it', () => {
    const rule = word({ value: 'x', fieldSelector: { $selectorType: 'specific', fields: [] } });
    expect(getGuardrailRuleErrorFields(rule)).toEqual(['fields']);
  });

  it('flags values that are not what the type stores', () => {
    const number = { ...createGuardrailRule('number'), value: Number.NaN };
    const boolean = { ...createGuardrailRule('boolean'), value: 'true' as unknown as boolean };
    expect(getGuardrailRuleErrorFields(number)).toEqual(['value']);
    expect(getGuardrailRuleErrorFields(boolean)).toEqual(['value']);
  });
});

describe('getGuardrailRulesErrorFields', () => {
  it('requires at least one rule', () => {
    expect(getGuardrailRulesErrorFields([])).toEqual(['required']);
  });

  it('passes a lone always rule and valid field rules', () => {
    expect(getGuardrailRulesErrorFields([createGuardrailRule('always')])).toEqual([]);
    expect(
      getGuardrailRulesErrorFields([word({ value: 'x' }), createGuardrailRule('number')])
    ).toEqual([]);
  });

  it('flags an always rule next to field rules', () => {
    const rules: GuardrailRule[] = [createGuardrailRule('always'), word({ value: 'x' })];
    expect(getGuardrailRulesErrorFields(rules)).toEqual(['alwaysCombined']);
  });

  it('flags a second always rule too', () => {
    const rules: GuardrailRule[] = [
      createGuardrailRule('always'),
      { $ruleType: 'always', applyTo: 'output' },
    ];
    expect(getGuardrailRulesErrorFields(rules)).toEqual(['alwaysCombined']);
  });

  it('flags invalid rules alongside a combination', () => {
    const rules: GuardrailRule[] = [createGuardrailRule('always'), word()];
    expect(getGuardrailRulesErrorFields(rules)).toEqual(['alwaysCombined', 'invalidRules']);
  });
});

describe('getGuardrailRuleTypeOptions', () => {
  it('offers every type when there is no schema', () => {
    expect(getGuardrailRuleTypeOptions(undefined)).toEqual(['word', 'number', 'boolean']);
  });

  it('offers only the types that have a field, in select order', () => {
    expect(
      getGuardrailRuleTypeOptions({
        boolean: { input: [{ path: 'flag', source: 'input' }], output: [] },
        number: { input: [], output: [] },
        word: group,
      })
    ).toEqual(['word', 'boolean']);
  });

  it('offers nothing for a schema without fields', () => {
    expect(getGuardrailRuleTypeOptions({})).toEqual([]);
  });
});

describe('isPristineGuardrailRule', () => {
  it('is true for fresh rules only', () => {
    expect(isPristineGuardrailRule(createGuardrailRule('word'))).toBe(true);
    expect(isPristineGuardrailRule(word({ value: undefined }))).toBe(true);
    expect(isPristineGuardrailRule(createGuardrailRule('boolean'))).toBe(true);
    expect(isPristineGuardrailRule(word({ value: 'x' }))).toBe(false);
    expect(isPristineGuardrailRule(word({ operator: 'equals' }))).toBe(false);
    expect(
      isPristineGuardrailRule(
        word({ fieldSelector: { $selectorType: 'specific', fields: [group.input[0]!] } })
      )
    ).toBe(false);
    expect(isPristineGuardrailRule({ ...createGuardrailRule('number'), value: 3 })).toBe(false);
  });
});

describe('setGuardrailAlwaysEnforced', () => {
  it('replaces every rule with one always rule', () => {
    expect(setGuardrailAlwaysEnforced([word({ value: 'x' })], true, 'word')).toEqual([
      createGuardrailRule('always'),
    ]);
  });

  it('keeps the stage of an always rule that is already there', () => {
    const always: GuardrailRule = { $ruleType: 'always', applyTo: 'output' };
    expect(setGuardrailAlwaysEnforced([always, word()], true, 'word')).toEqual([always]);
  });

  it('switching off keeps field rules, or starts one of the default type', () => {
    const rule = word({ value: 'x' });
    expect(
      setGuardrailAlwaysEnforced([createGuardrailRule('always'), rule], false, 'word')
    ).toEqual([rule]);
    expect(setGuardrailAlwaysEnforced([createGuardrailRule('always')], false, 'number')).toEqual([
      createGuardrailRule('number'),
    ]);
  });
});

describe('field toggling', () => {
  const email = group.input[0]!;

  it('adds a plain reference and removes it again', () => {
    const withExtra = { ...email, type: 'string' } as typeof email;
    const added = toggleGuardrailFieldReference([], withExtra);
    expect(added).toEqual([{ path: 'customer.email', source: 'input', title: 'Customer email' }]);
    expect(toggleGuardrailFieldReference(added, email)).toEqual([]);
  });

  it('tells fields apart by source as well as path', () => {
    const inputId = { path: 'id', source: 'input' as const };
    const outputId = { path: 'id', source: 'output' as const };
    expect(toggleGuardrailFieldReference([inputId], outputId)).toEqual([inputId, outputId]);
  });

  it('turns an all-fields selector specific, and back when the last field goes', () => {
    const specific = toggleGuardrailSelectorField({ $selectorType: 'all' }, email);
    expect(specific).toEqual({ $selectorType: 'specific', fields: [email] });
    expect(toggleGuardrailSelectorField(specific, email)).toEqual({ $selectorType: 'all' });
  });
});

describe('getGuardrailFieldName', () => {
  it('prefers the offered title, then the stored one, then the path', () => {
    expect(getGuardrailFieldName({ path: 'customer.email', source: 'input' }, group)).toBe(
      'Customer email'
    );
    expect(
      getGuardrailFieldName({ path: 'gone', source: 'input', title: 'Gone field' }, group)
    ).toBe('Gone field');
    expect(getGuardrailFieldName({ path: 'summary', source: 'output' }, group)).toBe('summary');
  });
});
