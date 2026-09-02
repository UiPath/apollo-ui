import { describe, expect, it } from 'vitest';
import {
  type GuardrailAction,
  type GuardrailDefinition,
  GuardrailRecipientType,
} from './builder-types';
import {
  createDefaultGuardrailAction,
  generateGuardrailId,
  getGuardrailActionErrorFields,
  getGuardrailSelectorErrorFields,
  initGuardrailBuilderFormData,
} from './builder-utils';

function makeDef(overrides?: Partial<GuardrailDefinition>): GuardrailDefinition {
  return {
    validator: 'pii_detection',
    displayName: 'PII Detection',
    allowedScopes: ['Agent', 'Llm', 'Tool'],
    parameters: [],
    status: 'Available',
    ...overrides,
  };
}

describe('generateGuardrailId', () => {
  it('produces the guardrail-<timestamp>-<random> format', () => {
    expect(generateGuardrailId()).toMatch(/^guardrail-[a-z0-9]+-[a-z0-9]{5}$/);
  });
});

describe('createDefaultGuardrailAction', () => {
  it('creates the per-type default payloads', () => {
    expect(createDefaultGuardrailAction('log')).toEqual({
      $actionType: 'log',
      severityLevel: 'Info',
    });
    expect(createDefaultGuardrailAction('block')).toEqual({ $actionType: 'block', reason: '' });
    expect(createDefaultGuardrailAction('filter')).toEqual({ $actionType: 'filter', fields: [] });
    expect(createDefaultGuardrailAction('escalate')).toEqual({
      $actionType: 'escalate',
      app: { id: '', version: '', name: '' },
      recipient: { type: GuardrailRecipientType.User, value: '', displayName: '' },
    });
  });
});

describe('getGuardrailActionErrorFields', () => {
  it('flags an empty block reason', () => {
    expect(getGuardrailActionErrorFields({ $actionType: 'block', reason: '  ' })).toEqual([
      'blockReason',
    ]);
    expect(getGuardrailActionErrorFields({ $actionType: 'block', reason: 'why' })).toEqual([]);
  });

  it('flags an empty filter field selection', () => {
    expect(getGuardrailActionErrorFields({ $actionType: 'filter', fields: [] })).toEqual([
      'filterFields',
    ]);
    expect(getGuardrailActionErrorFields({ $actionType: 'filter', fields: [{}] })).toEqual([]);
  });

  it('flags missing escalate recipient and app', () => {
    const empty: GuardrailAction = {
      $actionType: 'escalate',
      app: { id: '', version: '', name: '' },
      recipient: { type: GuardrailRecipientType.User, value: '', displayName: '' },
    };
    expect(getGuardrailActionErrorFields(empty)).toEqual(['recipient', 'actionApp']);

    const filled: GuardrailAction = {
      $actionType: 'escalate',
      app: { id: 'app-1', version: '1', name: 'Escalation app' },
      recipient: { type: GuardrailRecipientType.StaticEmail, value: 'a@b.c' },
    };
    expect(getGuardrailActionErrorFields(filled)).toEqual([]);
  });

  it('treats an asset recipient (no value field) as missing', () => {
    const assetRecipient: GuardrailAction = {
      $actionType: 'escalate',
      app: { id: 'app-1', version: '1', name: 'App' },
      recipient: { type: GuardrailRecipientType.AssetEmail, assetName: 'asset' },
    };
    expect(getGuardrailActionErrorFields(assetRecipient)).toEqual(['recipient']);
  });

  it('never flags a log action', () => {
    expect(getGuardrailActionErrorFields({ $actionType: 'log', severityLevel: 'Info' })).toEqual(
      []
    );
  });
});

describe('getGuardrailSelectorErrorFields', () => {
  it('requires at least one scope', () => {
    expect(getGuardrailSelectorErrorFields({ scopes: [] })).toEqual(['scopes']);
  });

  it('requires tools when the Tool scope is selected', () => {
    expect(getGuardrailSelectorErrorFields({ scopes: ['Tool'] })).toEqual(['toolNames']);
    expect(getGuardrailSelectorErrorFields({ scopes: ['Tool'], matchNames: [] })).toEqual([
      'toolNames',
    ]);
    expect(getGuardrailSelectorErrorFields({ scopes: ['Tool'], matchNames: ['ToolA'] })).toEqual(
      []
    );
  });

  it('accepts non-Tool scopes without matchNames', () => {
    expect(getGuardrailSelectorErrorFields({ scopes: ['Agent', 'Llm'] })).toEqual([]);
  });
});

describe('initGuardrailBuilderFormData', () => {
  it('copies an existing guardrail verbatim', () => {
    const existing = {
      id: 'g1',
      $guardrailType: 'builtInValidator' as const,
      name: 'Mine',
      description: 'desc',
      selector: { scopes: ['Tool' as const], matchNames: ['OtherTool'] },
      action: { $actionType: 'log' as const, severityLevel: 'Info' as const },
      enabledForEvals: false,
      validatorType: 'pii_detection',
      validatorParameters: [],
    };

    const form = initGuardrailBuilderFormData(makeDef(), 'Tool', existing, 'MyTool');
    expect(form.id).toBe('g1');
    expect(form.selector.matchNames).toEqual(['OtherTool']);
    expect(form.enabledForEvals).toBe(false);
  });

  it('sets matchNames when scope is Tool and toolName is provided', () => {
    const form = initGuardrailBuilderFormData(makeDef(), 'Tool', undefined, 'MyTool');
    expect(form.selector.scopes).toEqual(['Tool']);
    expect(form.selector.matchNames).toEqual(['MyTool']);
  });

  it('does not set matchNames when scope is Tool but no toolName', () => {
    const form = initGuardrailBuilderFormData(makeDef(), 'Tool');
    expect(form.selector.scopes).toEqual(['Tool']);
    expect(form.selector.matchNames).toBeUndefined();
  });

  it('falls back to first allowedScope when Agent is not allowed', () => {
    const form = initGuardrailBuilderFormData(
      makeDef({ allowedScopes: ['Llm', 'Tool'] }),
      'Agent',
      undefined,
      'MyTool'
    );
    expect(form.selector.scopes).toEqual(['Llm']);
    expect(form.selector.matchNames).toBeUndefined();
  });

  it('sets matchNames when Agent scope falls back to Tool', () => {
    const form = initGuardrailBuilderFormData(
      makeDef({ allowedScopes: ['Tool'] }),
      'Agent',
      undefined,
      'MyTool'
    );
    expect(form.selector.scopes).toEqual(['Tool']);
    expect(form.selector.matchNames).toEqual(['MyTool']);
  });

  it('seeds defaults with null coercion for create mode', () => {
    const definition = makeDef({
      parameters: [
        { id: 'prompt', type: 'text', label: 'Prompt', required: true, defaultValue: null },
        {
          id: 'examples',
          type: 'text-list',
          label: 'Examples',
          required: false,
          defaultValue: null,
        },
      ],
    });
    const form = initGuardrailBuilderFormData(definition, 'Agent');

    expect(form.validatorParameters).toEqual([
      { $parameterType: 'text', id: 'prompt', value: '' },
      { $parameterType: 'text-list', id: 'examples', value: [] },
    ]);
    expect(form.action).toEqual({ $actionType: 'log', severityLevel: 'Info' });
    expect(form.enabledForEvals).toBe(true);
    expect(form.name).toBe('PII Detection');
  });
});
