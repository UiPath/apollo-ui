import { describe, expect, it } from 'vitest';
import {
  BYO_WIRE,
  HARMFUL_CONTENT_WIRE,
  LLM_AS_JUDGE_WIRE,
  PII_DETECTION_WIRE,
  PROMPT_INJECTION_WIRE,
  UNCURATED_WIRE,
} from './__fixtures__/definitions-wire.fixtures';
import type { GuardrailDefinition } from './builder-types';
import { GUARDRAIL_COPY_EN, type GuardrailCopyTable } from './definitions-copy';
import {
  type EnrichedGuardrailDefinition,
  enrichGuardrailDefinitions,
  humanizeGuardrailParameterId,
  isByoGuardrailDefinition,
  withGuardrailFolderMetadata,
} from './definitions-enrich';
import type { GuardrailDefinitionWire } from './definitions-wire';

function enrichOne(wire: GuardrailDefinitionWire, copy?: GuardrailCopyTable) {
  const [definition] = enrichGuardrailDefinitions([wire], copy ? { copy } : undefined);
  if (!definition) throw new Error('expected one enriched definition');
  return definition;
}

function param(definition: EnrichedGuardrailDefinition, id: string) {
  const found = definition.parameters.find((p) => p.id === id);
  if (!found) throw new Error(`no parameter ${id}`);
  return found;
}

describe('enrichGuardrailDefinitions', () => {
  it('feeds GuardrailBuilder without mapping', () => {
    // The whole point of extending the family's display type: an enriched definition is a
    // GuardrailDefinition, so no host adapter has to translate between the two.
    const definition: GuardrailDefinition = enrichOne(PII_DETECTION_WIRE);

    expect(definition.displayName).toBe('PII detection');
    expect(definition.status).toBe('Available');
    expect(definition.allowedScopes).toEqual(['Agent', 'Llm', 'Tool']);
  });

  it('preserves payload order', () => {
    const result = enrichGuardrailDefinitions([PROMPT_INJECTION_WIRE, PII_DETECTION_WIRE]);

    expect(result.map((d) => d.validator)).toEqual(['prompt_injection', 'pii_detection']);
  });

  describe('copy precedence', () => {
    it('prefers curated over wire at definition level for a UiPath validator', () => {
      const definition = enrichOne({
        ...PII_DETECTION_WIRE,
        displayName: 'Backend name',
        description: 'Backend description',
      });

      expect(definition.displayName).toBe('PII detection');
      expect(definition.description).toBe(
        'Detect personally identifiable information using Azure Cognitive Services.'
      );
    });

    it('falls back to the wire, then the validator id, when nothing is curated', () => {
      expect(enrichOne({ ...UNCURATED_WIRE, displayName: 'Topic drift' }).displayName).toBe(
        'Topic drift'
      );
      expect(enrichOne(UNCURATED_WIRE).displayName).toBe('topic_drift');
      expect(enrichOne(UNCURATED_WIRE).description).toBe('');
    });

    it('prefers wire over curated at parameter level', () => {
      const definition = enrichOne({
        ...PII_DETECTION_WIRE,
        parameters: [
          {
            id: 'entities',
            type: 'enum-list',
            required: true,
            defaultValue: [],
            options: ['Email'],
            displayName: 'Fields to scan',
            description: 'Chosen by the manifest.',
          },
        ],
      });

      expect(param(definition, 'entities').label).toBe('Fields to scan');
      expect(param(definition, 'entities').tooltip).toBe('Chosen by the manifest.');
    });

    it('uses curated parameter copy when the wire says nothing', () => {
      const definition = enrichOne(PII_DETECTION_WIRE);

      expect(param(definition, 'entities').label).toBe('Entities to detect');
      expect(param(definition, 'entityThresholds').label).toBe('Detection thresholds');
      expect(param(definition, 'entityThresholds').tooltip).toMatch(/sensitivity level for PII/);
    });

    it('humanizes an uncurated parameter id rather than showing it raw', () => {
      const definition = enrichOne(UNCURATED_WIRE);

      expect(param(definition, 'maxDriftScore').label).toBe('Max drift score');
    });

    it('omits the tooltip entirely when there is none', () => {
      expect(param(enrichOne(PII_DETECTION_WIRE), 'entities')).not.toHaveProperty('tooltip');
    });

    it('attaches the curated usage note', () => {
      expect(enrichOne(LLM_AS_JUDGE_WIRE).usageNote).toMatch(/consume Agent units/);
      expect(enrichOne(PII_DETECTION_WIRE)).not.toHaveProperty('usageNote');
    });
  });

  describe('option labels', () => {
    it('resolves curated labels for every wire option', () => {
      const labels = param(enrichOne(PII_DETECTION_WIRE), 'entities').optionLabels;

      expect(labels?.USSocialSecurityNumber).toBe('US Social Security Number (SSN)');
      expect(labels?.SwiftCode).toBe('SWIFT Code');
    });

    it('merges wire labels over curated ones, per option', () => {
      const definition = enrichOne({
        ...HARMFUL_CONTENT_WIRE,
        parameters: [
          {
            id: 'harmfulContentEntities',
            type: 'enum-list',
            required: true,
            defaultValue: [],
            options: ['Hate', 'SelfHarm'],
            optionLabels: { Hate: 'Hateful content' },
          },
        ],
      });

      const labels = param(definition, 'harmfulContentEntities').optionLabels;
      expect(labels).toEqual({
        Hate: 'Hateful content',
        SelfHarm: 'Self-harm',
        Sexual: 'Sexual',
        Violence: 'Violence',
      });
    });

    it('leaves unlabelled options out, since the editors fall back to the raw value', () => {
      const labels = param(enrichOne(UNCURATED_WIRE), 'allowedTopics');

      expect(labels).not.toHaveProperty('optionLabels');
      expect(labels.options).toEqual(['finance', 'legal']);
    });
  });

  describe('bring-your-own definitions', () => {
    it('takes zero curated copy even when the validator id collides with a UiPath one', () => {
      // BYO_WIRE deliberately reuses `pii_detection` as its validator id.
      const definition = enrichOne(BYO_WIRE);

      expect(definition.displayName).toBe('Acme PII scan');
      expect(definition.description).toBe('Runs the Acme detector over prompts and completions.');
      expect(definition).not.toHaveProperty('usageNote');
    });

    it('carries the BYO and folder fields through', () => {
      const definition = enrichOne({ ...BYO_WIRE, folderPath: 'Shared/AI', folderKey: 'fk' });

      expect(definition).toMatchObject({
        byoValidatorName: 'acme-pii',
        byoConnectorName: 'Acme AI Guardrails',
        byoConnectorKey: 'acme',
        byoGuardrailConnectionId: 'conn-1',
        byoConfigurationId: 'cfg-1',
        folderPath: 'Shared/AI',
        folderKey: 'fk',
      });
    });

    it('omits absent optional fields instead of setting them undefined', () => {
      const definition = enrichOne(PII_DETECTION_WIRE);

      expect(definition).not.toHaveProperty('byoValidatorName');
      expect(definition).not.toHaveProperty('folderPath');
    });

    it('uses manifest parameter copy and merges its partial option labels', () => {
      const definition = enrichOne(BYO_WIRE);

      expect(param(definition, 'sensitivity').label).toBe('Sensitivity');
      expect(param(definition, 'sensitivity').optionLabels).toEqual({ low: 'Low', high: 'High' });
    });
  });

  describe('parameter constraints', () => {
    it('gives an unbounded map-enum the 0..1 step 0.1 the thresholds need', () => {
      const thresholds = param(enrichOne(PII_DETECTION_WIRE), 'entityThresholds');

      expect(thresholds).toMatchObject({ keySource: 'entities', min: 0, max: 1, step: 0.1 });
    });

    it('keeps map-enum bounds the backend does send', () => {
      const thresholds = param(enrichOne(HARMFUL_CONTENT_WIRE), 'harmfulContentEntityThresholds');

      expect(thresholds).toMatchObject({ min: 0, max: 6, step: 2 });
    });

    it('copies number, text and text-list constraints only when present', () => {
      const judge = enrichOne(LLM_AS_JUDGE_WIRE);

      expect(param(judge, 'threshold')).toMatchObject({ min: 0, max: 6, step: 2 });
      expect(param(judge, 'guardrailText')).toMatchObject({ maxLength: 4000 });
      expect(param(judge, 'positiveExamples')).toMatchObject({ maxItems: 5, maxLength: 1000 });
      expect(param(enrichOne(UNCURATED_WIRE), 'maxDriftScore')).not.toHaveProperty('min');
    });

    it('passes defaultValue through untouched, nulls included', () => {
      const judge = enrichOne(LLM_AS_JUDGE_WIRE);

      // `seedGuardrailParameters` is what coerces these into the value union at form time.
      expect(param(judge, 'guardrailText').defaultValue).toBeNull();
      expect(param(judge, 'positiveExamples').defaultValue).toBeUndefined();
      expect(param(judge, 'threshold').defaultValue).toBe(4);
    });
  });

  describe('hiddenValidators', () => {
    it('hides nothing by default', () => {
      const result = enrichGuardrailDefinitions([PROMPT_INJECTION_WIRE, PII_DETECTION_WIRE]);

      expect(result).toHaveLength(2);
    });

    it('drops the named UiPath validators', () => {
      const result = enrichGuardrailDefinitions([PROMPT_INJECTION_WIRE, PII_DETECTION_WIRE], {
        hiddenValidators: ['prompt_injection'],
      });

      expect(result.map((d) => d.validator)).toEqual(['pii_detection']);
    });

    it('never hides a BYO definition, whatever its validator id', () => {
      const result = enrichGuardrailDefinitions([BYO_WIRE], {
        hiddenValidators: ['pii_detection'],
      });

      expect(result).toHaveLength(1);
    });
  });

  it('resolves copy from the supplied table, not the English one', () => {
    const localized: GuardrailCopyTable = {
      ...GUARDRAIL_COPY_EN,
      pii_detection: {
        ...(GUARDRAIL_COPY_EN.pii_detection ?? {
          displayName: '',
          description: '',
          paramLabels: {},
        }),
        displayName: 'Erkennung personenbezogener Daten',
      },
    };

    expect(enrichOne(PII_DETECTION_WIRE, localized).displayName).toBe(
      'Erkennung personenbezogener Daten'
    );
  });
});

describe('isByoGuardrailDefinition', () => {
  it('is exactly "names a BYO validator"', () => {
    expect(isByoGuardrailDefinition(BYO_WIRE)).toBe(true);
    expect(isByoGuardrailDefinition(PII_DETECTION_WIRE)).toBe(false);
  });
});

describe('humanizeGuardrailParameterId', () => {
  it.each([
    ['entityThresholds', 'Entity thresholds'],
    ['threshold', 'Threshold'],
    ['maxDriftScore', 'Max drift score'],
    ['harmfulContentEntities', 'Harmful content entities'],
  ])('%s reads as %s', (id, expected) => {
    expect(humanizeGuardrailParameterId(id)).toBe(expected);
  });
});

describe('withGuardrailFolderMetadata', () => {
  const [byo] = enrichGuardrailDefinitions([BYO_WIRE]);
  const [builtIn] = enrichGuardrailDefinitions([PII_DETECTION_WIRE]);
  if (!byo || !builtIn) throw new Error('fixture setup failed');

  it('stamps the resolved placement onto BYO definitions', () => {
    const [stamped] = withGuardrailFolderMetadata([byo], (id) =>
      id === 'conn-1' ? { folderPath: 'Shared/AI', folderKey: 'fk-1' } : undefined
    );

    expect(stamped).toMatchObject({ folderPath: 'Shared/AI', folderKey: 'fk-1' });
  });

  it('leaves definitions without a connection id alone', () => {
    const [passed] = withGuardrailFolderMetadata([builtIn], () => ({ folderPath: 'Shared/X' }));

    expect(passed).toBe(builtIn);
  });

  it('keeps a definition the host could not resolve rather than dropping it', () => {
    const result = withGuardrailFolderMetadata([byo], () => undefined);

    expect(result).toEqual([byo]);
  });

  it('does not mutate its input', () => {
    withGuardrailFolderMetadata([byo], () => ({ folderPath: 'Shared/AI' }));

    expect(byo).not.toHaveProperty('folderPath');
  });
});
