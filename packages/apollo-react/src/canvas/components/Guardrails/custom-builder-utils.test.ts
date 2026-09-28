import { describe, expect, it } from 'vitest';
import type { CustomGuardrailBuilderValue } from './custom-builder-types';
import {
  createDefaultCustomGuardrail,
  getCustomGuardrailErrorFields,
  initCustomGuardrailBuilderFormData,
} from './custom-builder-utils';
import { createGuardrailRule } from './rules-utils';

const existing: CustomGuardrailBuilderValue = {
  id: 'c1',
  $guardrailType: 'custom',
  name: 'Block secrets',
  description: 'Stops credentials leaving the tool',
  selector: { scopes: ['Agent', 'Tool'], matchNames: ['Search web', 'Send email'] },
  action: { $actionType: 'filter', fields: [{ path: 'query', source: 'input' }] },
  enabledForEvals: false,
  rules: [{ ...createGuardrailRule('word'), value: 'password' }],
};

describe('createDefaultCustomGuardrail', () => {
  it('starts the way both products start: always enforced, log/Info, evaluations on', () => {
    expect(createDefaultCustomGuardrail('Search web')).toEqual({
      id: expect.stringMatching(/^guardrail-/),
      $guardrailType: 'custom',
      name: '',
      selector: { scopes: ['Tool'], matchNames: ['Search web'] },
      action: { $actionType: 'log', severityLevel: 'Info' },
      enabledForEvals: true,
      rules: [{ $ruleType: 'always', applyTo: 'inputAndOutput' }],
    });
  });

  it('targets the Tool scope without names when no tool is given', () => {
    expect(createDefaultCustomGuardrail().selector).toEqual({ scopes: ['Tool'] });
  });

  it('mints a fresh id each time', () => {
    expect(createDefaultCustomGuardrail().id).not.toBe(createDefaultCustomGuardrail().id);
  });
});

describe('initCustomGuardrailBuilderFormData', () => {
  it('copies an existing guardrail verbatim, selector included', () => {
    const data = initCustomGuardrailBuilderFormData(existing, 'Other tool');

    expect(data).toEqual({
      id: 'c1',
      name: 'Block secrets',
      description: 'Stops credentials leaving the tool',
      selector: existing.selector,
      action: existing.action,
      enabledForEvals: false,
      rules: existing.rules,
    });
    expect(data.selector).toBe(existing.selector);
    expect(data.rules).toBe(existing.rules);
  });

  it('edits a missing description as an empty one', () => {
    const { description: _omitted, ...withoutDescription } = existing;
    expect(initCustomGuardrailBuilderFormData(withoutDescription).description).toBe('');
  });

  it('seeds a new guardrail from createDefaultCustomGuardrail', () => {
    const data = initCustomGuardrailBuilderFormData(undefined, 'Search web');

    expect(data.selector).toEqual({ scopes: ['Tool'], matchNames: ['Search web'] });
    expect(data.rules).toEqual([createGuardrailRule('always')]);
    expect(data.description).toBe('');
  });
});

describe('getCustomGuardrailErrorFields', () => {
  it('reports nothing for a valid guardrail', () => {
    expect(getCustomGuardrailErrorFields(existing, ['Other'])).toEqual({
      name: undefined,
      rules: [],
      perRule: [[]],
      action: [],
    });
  });

  it('requires a name that is not blank', () => {
    expect(getCustomGuardrailErrorFields({ ...existing, name: '  ' }).name).toBe('required');
  });

  it('matches existing names case-insensitively, ignoring surrounding space', () => {
    expect(
      getCustomGuardrailErrorFields({ ...existing, name: ' block SECRETS ' }, ['Block secrets'])
        .name
    ).toBe('duplicate');
  });

  it('reports the rules section and each rule, aligned by index', () => {
    const fields = getCustomGuardrailErrorFields({
      ...existing,
      rules: [
        createGuardrailRule('always'),
        {
          ...createGuardrailRule('word'),
          fieldSelector: { $selectorType: 'specific', fields: [] },
        },
      ],
    });

    expect(fields.rules).toEqual(['alwaysCombined', 'invalidRules']);
    expect(fields.perRule).toEqual([[], ['fields', 'value']]);
  });

  it('requires a rule', () => {
    expect(getCustomGuardrailErrorFields({ ...existing, rules: [] }).rules).toEqual(['required']);
  });

  it('reports the action fields', () => {
    expect(
      getCustomGuardrailErrorFields({ ...existing, action: { $actionType: 'filter', fields: [] } })
        .action
    ).toEqual(['filterFields']);
  });
});
