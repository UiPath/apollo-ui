import { describe, expect, it } from 'vitest';
import {
  findCentralizedBuiltInDefinition,
  findCentralizedByoDefinition,
  formatCentralizedAction,
  formatCentralizedExecutionStage,
  formatCentralizedScope,
  getApplicableCentralizedGuardrails,
  getCentralizedGuardrailDisplay,
  getCentralizedGuardrailItemId,
  isCentralizedGuardrailConfigMissing,
  resolveCentralizedGuardrailParameters,
} from './centralized-guardrail-utils';
import type { CentralizedGuardrail, CentralizedGuardrailDefinition } from './centralized-types';
import type { GuardrailCopyTable } from './definitions-copy';
import { GUARDRAIL_CENTRALIZED_EN_LABELS } from './i18n';

const FALLBACK_LABELS = {
  enabled: GUARDRAIL_CENTRALIZED_EN_LABELS.parameterEnabled,
  disabled: GUARDRAIL_CENTRALIZED_EN_LABELS.parameterDisabled,
  entities: GUARDRAIL_CENTRALIZED_EN_LABELS.entitiesFallback,
  thresholds: GUARDRAIL_CENTRALIZED_EN_LABELS.thresholdsFallback,
};

const guardrail = (overrides: Partial<CentralizedGuardrail> = {}): CentralizedGuardrail => ({
  validator: 'pii_detection',
  executionStage: 'Pre',
  appliesToAutonomousAgents: true,
  appliesToConversationalAgents: false,
  scopes: ['Agent'],
  action: 'block',
  ...overrides,
});

const PII_DEFINITION: CentralizedGuardrailDefinition = {
  validator: 'pii_detection',
  parameters: [
    {
      id: 'entities',
      type: 'enum-list',
      label: 'Entities to detect',
      optionLabels: { Email: 'Email address', USSocialSecurityNumber: 'US SSN' },
    },
    {
      id: 'entityThresholds',
      type: 'map-enum',
      label: 'Detection thresholds',
      keySource: 'entities',
    },
  ],
};

describe('getApplicableCentralizedGuardrails', () => {
  it('keeps the ones that apply to the agent kind being edited', () => {
    const autonomous = guardrail({ validator: 'a' });
    const conversational = guardrail({
      validator: 'b',
      appliesToAutonomousAgents: false,
      appliesToConversationalAgents: true,
    });

    expect(
      getApplicableCentralizedGuardrails([autonomous, conversational], {}).map((g) => g.validator)
    ).toEqual(['a']);
    expect(
      getApplicableCentralizedGuardrails([autonomous, conversational], {
        isConversational: true,
      }).map((g) => g.validator)
    ).toEqual(['b']);
  });
});

describe('getCentralizedGuardrailItemId', () => {
  it('separates the same validator enforced at two stages', () => {
    expect(getCentralizedGuardrailItemId(guardrail({ executionStage: 'Pre' }))).not.toBe(
      getCentralizedGuardrailItemId(guardrail({ executionStage: 'Post' }))
    );
  });

  it('separates a BYO configuration from a built-in sharing its validator id', () => {
    expect(getCentralizedGuardrailItemId(guardrail({ isByo: true, name: 'Acme PII' }))).not.toBe(
      getCentralizedGuardrailItemId(guardrail())
    );
  });

  it('stays the same for an unchanged guardrail in a reordered policy', () => {
    const one = guardrail({ isByo: true, name: 'Acme PII' });
    expect(getCentralizedGuardrailItemId(one)).toBe(
      getCentralizedGuardrailItemId({ ...one, action: 'log' })
    );
  });
});

describe('findCentralizedByoDefinition', () => {
  const definitions: CentralizedGuardrailDefinition[] = [
    { validator: 'pii_detection', byoValidatorName: 'Acme PII', byoConnectorName: 'Acme' },
    { validator: 'harmful_content', byoValidatorName: 'Acme PII', byoConnectorName: 'Acme' },
    { validator: 'pii_detection' },
  ];

  it('matches on the configuration name and the validator together', () => {
    const found = findCentralizedByoDefinition(
      { validator: 'pii_detection', name: 'Acme PII', isByo: true },
      definitions
    );

    expect(found?.validator).toBe('pii_detection');
    expect(found?.byoConnectorName).toBe('Acme');
  });

  it('does not match a same-named configuration for another validator', () => {
    expect(
      findCentralizedByoDefinition(
        { validator: 'user_prompt_attacks', name: 'Acme PII', isByo: true },
        definitions
      )
    ).toBeUndefined();
  });

  it('never matches a built-in guardrail, nor a BYO one with no name', () => {
    expect(
      findCentralizedByoDefinition({ validator: 'pii_detection', name: 'Acme PII' }, definitions)
    ).toBeUndefined();
    expect(
      findCentralizedByoDefinition({ validator: 'pii_detection', isByo: true }, definitions)
    ).toBeUndefined();
  });
});

describe('findCentralizedBuiltInDefinition', () => {
  const definitions: CentralizedGuardrailDefinition[] = [
    { validator: 'pii_detection', byoValidatorName: 'Acme PII' },
    { validator: 'pii_detection', description: 'the built-in one' },
  ];

  it('skips the BYO definition sharing the validator id', () => {
    expect(
      findCentralizedBuiltInDefinition({ validator: 'pii_detection' }, definitions)?.description
    ).toBe('the built-in one');
  });

  it('returns nothing for a BYO guardrail', () => {
    expect(
      findCentralizedBuiltInDefinition({ validator: 'pii_detection', isByo: true }, definitions)
    ).toBeUndefined();
  });
});

describe('isCentralizedGuardrailConfigMissing', () => {
  const identity = { validator: 'pii_detection', name: 'Acme PII', isByo: true };

  it('reports nothing while the catalog has not loaded', () => {
    expect(isCentralizedGuardrailConfigMissing(identity, undefined)).toBe(false);
  });

  it('reports a missing configuration once the catalog is in', () => {
    expect(isCentralizedGuardrailConfigMissing(identity, [])).toBe(true);
    expect(
      isCentralizedGuardrailConfigMissing(identity, [
        { validator: 'pii_detection', byoValidatorName: 'Acme PII' },
      ])
    ).toBe(false);
  });

  it('never reports one for a built-in guardrail', () => {
    expect(isCentralizedGuardrailConfigMissing({ validator: 'pii_detection' }, [])).toBe(false);
  });
});

describe('getCentralizedGuardrailDisplay', () => {
  const copy = {
    pii_detection: {
      displayName: 'PII detection',
      description: 'Detect personally identifiable information.',
      paramLabels: {},
    },
  } as unknown as GuardrailCopyTable;

  it('takes a built-in name and description from the curated table', () => {
    expect(getCentralizedGuardrailDisplay({ validator: 'pii_detection' }, { copy })).toEqual({
      name: 'PII detection',
      description: 'Detect personally identifiable information.',
    });
  });

  it('falls back to the raw validator id for a validator the table does not know', () => {
    expect(getCentralizedGuardrailDisplay({ validator: 'acme_custom' }, { copy })).toEqual({
      name: 'acme_custom',
      description: undefined,
    });
  });

  it('takes a BYO description from the connector, never the curated one', () => {
    expect(
      getCentralizedGuardrailDisplay(
        { validator: 'pii_detection', name: 'Acme PII', isByo: true },
        { copy, definition: { validator: 'pii_detection', description: "Acme's own check" } }
      )
    ).toEqual({ name: 'Acme PII', description: "Acme's own check" });
  });

  it('treats an empty description as absent, so the caller can offer its own line', () => {
    expect(
      getCentralizedGuardrailDisplay(
        { validator: 'pii_detection', name: 'Acme PII', isByo: true },
        { copy, definition: { validator: 'pii_detection', description: '' } }
      ).description
    ).toBeUndefined();
  });
});

describe('resolveCentralizedGuardrailParameters, built-in guardrails', () => {
  it('folds the entity list into the threshold rows through the definition keySource', () => {
    const rows = resolveCentralizedGuardrailParameters(
      guardrail({
        entities: ['Email', 'USSocialSecurityNumber'],
        entityThresholds: { Email: 0.8 },
      }),
      { definition: PII_DEFINITION, labels: FALLBACK_LABELS }
    );

    expect(rows).toEqual([
      {
        id: 'entityThresholds',
        kind: 'thresholds',
        label: 'Detection thresholds',
        thresholds: [
          { key: 'Email', label: 'Email address', value: 0.8 },
          { key: 'USSocialSecurityNumber', label: 'US SSN', value: undefined },
        ],
      },
    ]);
  });

  it('labels the rows from the definition, so each validator names its own configuration', () => {
    const rows = resolveCentralizedGuardrailParameters(
      guardrail({ validator: 'harmful_content', entityThresholds: { Hate: 2 } }),
      {
        definition: {
          validator: 'harmful_content',
          parameters: [
            { id: 'harmfulContentEntities', type: 'enum-list', label: 'Content categories' },
            {
              id: 'harmfulContentEntityThresholds',
              type: 'map-enum',
              label: 'Severity thresholds',
              keySource: 'harmfulContentEntities',
            },
          ],
        },
        labels: FALLBACK_LABELS,
      }
    );

    expect(rows.map((row) => row.label)).toEqual(['Severity thresholds']);
  });

  it('renders an entity list with no thresholds as its own line', () => {
    const rows = resolveCentralizedGuardrailParameters(
      guardrail({ validator: 'intellectual_property', entities: ['Text', 'Code'] }),
      {
        definition: {
          validator: 'intellectual_property',
          parameters: [{ id: 'ipEntities', type: 'enum-list', label: 'Content types' }],
        },
        labels: FALLBACK_LABELS,
      }
    );

    expect(rows).toEqual([
      { id: 'ipEntities', kind: 'value', label: 'Content types', value: 'Text, Code' },
    ]);
  });

  it('still folds and labels generically when no definition matched', () => {
    const rows = resolveCentralizedGuardrailParameters(
      guardrail({ entities: ['Email'], entityThresholds: { Email: 0.8 } }),
      { labels: FALLBACK_LABELS }
    );

    expect(rows).toEqual([
      {
        id: 'entityThresholds',
        kind: 'thresholds',
        label: 'Detection thresholds',
        thresholds: [{ key: 'Email', label: 'Email', value: 0.8 }],
      },
    ]);
  });

  it('has nothing to show for a guardrail the policy left unconfigured', () => {
    expect(
      resolveCentralizedGuardrailParameters(guardrail(), {
        definition: PII_DEFINITION,
        labels: FALLBACK_LABELS,
      })
    ).toEqual([]);
  });
});

describe('resolveCentralizedGuardrailParameters, BYO guardrails', () => {
  const byo = (parameters: CentralizedGuardrail['parameters']): CentralizedGuardrail =>
    guardrail({ isByo: true, name: 'Acme PII', parameters });

  it('renders each value type the way its own shape implies', () => {
    const rows = resolveCentralizedGuardrailParameters(
      byo([
        { id: 'strict', parameterType: 'boolean', value: true },
        { id: 'lenient', parameterType: 'boolean', value: false },
        { id: 'mode', parameterType: 'enum', value: 'Fast' },
        { id: 'count', parameterType: 'number', value: 3 },
        { id: 'terms', parameterType: 'text-list', value: ['alpha', 'beta'] },
      ]),
      { labels: FALLBACK_LABELS }
    );

    expect(rows).toEqual([
      { id: 'strict', kind: 'value', label: 'strict', value: 'Enabled' },
      { id: 'lenient', kind: 'value', label: 'lenient', value: 'Disabled' },
      { id: 'mode', kind: 'value', label: 'mode', value: 'Fast' },
      { id: 'count', kind: 'value', label: 'count', value: '3' },
      { id: 'terms', kind: 'value', label: 'terms', value: 'alpha, beta' },
    ]);
  });

  it('renders a plain object as a threshold table however `parameterType` is spelled', () => {
    const rows = resolveCentralizedGuardrailParameters(
      byo([{ id: 'scores', parameterType: 'mapEnum', value: { Email: 0.5 } }]),
      { labels: FALLBACK_LABELS }
    );

    expect(rows).toEqual([
      {
        id: 'scores',
        kind: 'thresholds',
        label: 'Detection thresholds',
        thresholds: [{ key: 'Email', label: 'Email', value: 0.5 }],
      },
    ]);
  });

  it('follows the connector order, then appends values it has no definition for', () => {
    const rows = resolveCentralizedGuardrailParameters(
      byo([
        { id: 'second', value: 'b' },
        { id: 'undeclared', value: 'c' },
        { id: 'first', value: 'a' },
      ]),
      {
        definition: {
          validator: 'pii_detection',
          byoValidatorName: 'Acme PII',
          parameters: [
            { id: 'first', type: 'text', label: 'First' },
            { id: 'second', type: 'text', label: 'Second' },
          ],
        },
        labels: FALLBACK_LABELS,
      }
    );

    expect(rows.map((row) => row.id)).toEqual(['first', 'second', 'undeclared']);
    expect(rows.map((row) => row.label)).toEqual(['First', 'Second', 'undeclared']);
  });

  it('keeps a selected key list visible when its threshold map has no value at all', () => {
    const rows = resolveCentralizedGuardrailParameters(
      byo([{ id: 'entities', value: ['Email'] }]),
      {
        definition: {
          validator: 'pii_detection',
          byoValidatorName: 'Acme PII',
          parameters: PII_DEFINITION.parameters,
        },
        labels: FALLBACK_LABELS,
      }
    );

    expect(rows).toEqual([
      { id: 'entities', kind: 'value', label: 'Entities to detect', value: 'Email address' },
    ]);
  });

  it('skips a parameter the connector persisted empty', () => {
    expect(
      resolveCentralizedGuardrailParameters(byo([{ id: 'note', value: null }]), {
        labels: FALLBACK_LABELS,
      })
    ).toEqual([]);
  });
});

describe('the label formatters', () => {
  const labels = GUARDRAIL_CENTRALIZED_EN_LABELS;

  it('names every scope and action both products close their sets to', () => {
    expect(
      (['Agent', 'Llm', 'Tool'] as const).map((s) => formatCentralizedScope(s, labels))
    ).toEqual(['Agent', 'LLM calls', 'Tools']);
    expect(
      (['block', 'escalate', 'filter', 'log'] as const).map((a) =>
        formatCentralizedAction(a, labels)
      )
    ).toEqual(['Block', 'Escalate', 'Filter', 'Log']);
  });

  it('names the three execution stages and passes an unknown one through', () => {
    expect(
      ['Pre', 'Post', 'Both'].map((stage) => formatCentralizedExecutionStage(stage, labels))
    ).toEqual(['Pre-execution', 'Post-execution', 'Pre & post-execution']);
    // The stage is `z.string()` in both products, so a new one has to render as something.
    expect(formatCentralizedExecutionStage('Streaming', labels)).toBe('Streaming');
  });
});
