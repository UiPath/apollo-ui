import { describe, expect, it } from 'vitest';
import {
  WIRE_BUILTIN_DEFINITIONS,
  WIRE_HARMFUL_CONTENT,
  WIRE_LLM_AS_JUDGE,
  WIRE_PII_DETECTION,
} from './__fixtures__/wire-builtins';
import {
  WIRE_BYO_AVAILABLE,
  WIRE_BYO_COLLIDING_VALIDATOR,
  WIRE_BYO_DISABLED_MINIMAL,
} from './__fixtures__/wire-byo';
import type { GuardrailDefinition } from './builder-types';
import type { EnrichedGuardrailDefinition } from './definitions-enrich';
import {
  enrichGuardrailDefinitions,
  humanizeGuardrailParameterId,
  isByoGuardrailDefinition,
  withGuardrailFolderMetadata,
} from './definitions-enrich';
import { parseGuardrailDefinitions } from './definitions-parse';
import type { GuardrailDefinitionWire } from './definitions-wire';

/** Parse first, exactly as a host would: enrichment only ever sees parser output. */
function parse(input: unknown[]): GuardrailDefinitionWire[] {
  const result = parseGuardrailDefinitions(input);
  expect(result.invalid).toEqual([]);
  return result.definitions;
}

const enrich = (input: unknown[], options?: Parameters<typeof enrichGuardrailDefinitions>[1]) =>
  enrichGuardrailDefinitions(parse(input), options);

const only = (input: unknown, options?: Parameters<typeof enrichGuardrailDefinitions>[1]) => {
  const [definition] = enrich([input], options);
  return definition;
};

const parameterById = (definition: EnrichedGuardrailDefinition, id: string) => {
  const parameter = definition.parameters.find((candidate) => candidate.id === id);
  if (!parameter) throw new Error(`no parameter ${id}`);
  return parameter;
};

describe('enrichGuardrailDefinitions', () => {
  it('feeds the shipped builder without a cast', () => {
    // The point of extending rather than replacing `GuardrailDefinition`: assignability, not
    // identity. Hosts keep the extra wire fields they need and still pass the result straight to
    // `<GuardrailBuilder definition={...} />`.
    const enriched = only(WIRE_PII_DETECTION);
    const asBuilderInput: GuardrailDefinition = enriched;
    expect(asBuilderInput.validator).toBe('pii_detection');
  });

  it('enriches every built-in the backend ships', () => {
    const enriched = enrich(WIRE_BUILTIN_DEFINITIONS);
    expect(enriched).toHaveLength(6);
    for (const definition of enriched) {
      expect(definition.displayName).toBeTruthy();
      // No built-in falls back to its raw validator id: that would mean a catalog gap.
      expect(definition.displayName).not.toBe(definition.validator);
    }
  });

  it('preserves input order', () => {
    const enriched = enrich([WIRE_LLM_AS_JUDGE, WIRE_PII_DETECTION, WIRE_HARMFUL_CONTENT]);
    expect(enriched.map((definition) => definition.validator)).toEqual([
      'llm_as_judge',
      'pii_detection',
      'harmful_content',
    ]);
  });

  it('carries through the fields hosts read outside the form', () => {
    const enriched = only(WIRE_BYO_AVAILABLE);
    expect(enriched).toMatchObject({
      byoValidatorName: 'acme-toxicity-v2',
      byoConnectorName: 'Acme Security',
      byoConnectorKey: 'uipath-acme-security',
      byoGuardrailConnectionId: '0f4c1e2a-6c31-4c07-9f2b-2c9a5d3e77b1',
      byoConfigurationId: 'b2ad9f18-5f7f-4a1d-8f2e-8a0d6c1f3b44',
      folderKey: '6b6b3f21-2d34-4a1e-9a77-1f7c0e6d5c92',
      isByogSubscription: true,
      status: 'Available',
    });
    expect(enriched.guardrailStages).toEqual({
      Llm: ['PreExecution'],
      Tool: ['PreExecution', 'PostExecution'],
    });
  });

  it('omits absent optional fields rather than setting them undefined', () => {
    const enriched = only(WIRE_PII_DETECTION);
    expect(enriched).not.toHaveProperty('byoValidatorName');
    expect(enriched).not.toHaveProperty('folderKey');
    expect(enriched).not.toHaveProperty('payloadMaxSizeLimit');
  });

  it('keeps a parameter the catalog knows nothing about', () => {
    // Nothing in this layer prunes parameters, which is what makes it safe for a host to round
    // trip values it stores alongside them.
    const enriched = only({
      ...WIRE_PII_DETECTION,
      parameters: [
        ...WIRE_PII_DETECTION.parameters,
        { id: 'somethingNew', type: 'boolean', defaultValue: false, required: false },
      ],
    });
    expect(enriched.parameters.map((parameter) => parameter.id)).toEqual([
      'entities',
      'entityThresholds',
      'somethingNew',
    ]);
  });
});

describe('copy precedence', () => {
  const translate = (key: string, defaultValue: string) => `[${key}] ${defaultValue}`;

  describe('at definition level the curated catalog wins', () => {
    it('prefers curated copy over the wire displayName for a built-in', () => {
      const enriched = only({ ...WIRE_PII_DETECTION, displayName: 'From the wire' });
      expect(enriched.displayName).toBe('PII detection');
    });

    it('prefers curated copy over the wire description for a built-in', () => {
      const enriched = only({ ...WIRE_PII_DETECTION, description: 'From the wire' });
      expect(enriched.description).toBe(
        'Detect personally identifiable information using Azure Cognitive Services.'
      );
    });

    it('falls back to the wire displayName for an uncatalogued validator', () => {
      const enriched = only({
        validator: 'future_validator',
        allowedScopes: ['Llm'],
        status: 'Available',
        displayName: 'Future validator',
        description: 'Ships before the catalog knows it.',
      });
      expect(enriched.displayName).toBe('Future validator');
      expect(enriched.description).toBe('Ships before the catalog knows it.');
    });

    it('falls back to the validator id when neither catalog nor wire has a name', () => {
      const enriched = only({
        validator: 'nameless',
        allowedScopes: ['Llm'],
        status: 'Available',
      });
      expect(enriched.displayName).toBe('nameless');
      expect(enriched).not.toHaveProperty('description');
    });

    it('attaches a usage note only where the catalog has one', () => {
      expect(only(WIRE_LLM_AS_JUDGE).usageNote).toContain('Agent units');
      expect(only(WIRE_PII_DETECTION)).not.toHaveProperty('usageNote');
    });
  });

  describe('at parameter level the wire wins', () => {
    it('prefers a manifest displayName over the curated label', () => {
      const enriched = only({
        ...WIRE_PII_DETECTION,
        parameters: [{ ...WIRE_PII_DETECTION.parameters[0], displayName: 'Manifest label' }],
      });
      expect(parameterById(enriched, 'entities').label).toBe('Manifest label');
    });

    it('prefers a manifest description over the curated tooltip', () => {
      const enriched = only({
        ...WIRE_PII_DETECTION,
        parameters: [{ ...WIRE_PII_DETECTION.parameters[1], description: 'Manifest tooltip' }],
      });
      expect(parameterById(enriched, 'entityThresholds').tooltip).toBe('Manifest tooltip');
    });

    it('uses the curated label when the wire sends none', () => {
      const enriched = only(WIRE_HARMFUL_CONTENT);
      expect(parameterById(enriched, 'harmfulContentEntities').label).toBe('Content categories');
      expect(parameterById(enriched, 'harmfulContentEntityThresholds').label).toBe(
        'Severity thresholds'
      );
    });

    it('humanizes the id when neither the wire nor the catalog describes the parameter', () => {
      const enriched = only({
        ...WIRE_PII_DETECTION,
        parameters: [{ id: 'maxRetryCount', type: 'number', defaultValue: 1, required: false }],
      });
      expect(parameterById(enriched, 'maxRetryCount').label).toBe('Max retry count');
    });

    it('leaves the tooltip absent when nothing supplies one', () => {
      const enriched = only(WIRE_PII_DETECTION);
      expect(parameterById(enriched, 'entities')).not.toHaveProperty('tooltip');
    });
  });

  describe('option labels merge, manifest over curated', () => {
    it('uses curated labels when the wire sends none', () => {
      const enriched = only(WIRE_HARMFUL_CONTENT);
      expect(parameterById(enriched, 'harmfulContentEntities').optionLabels).toEqual({
        Hate: 'Hate',
        SelfHarm: 'Self-harm',
        Sexual: 'Sexual',
        Violence: 'Violence',
      });
    });

    it('lets a manifest relabel a subset without dropping the rest', () => {
      const enriched = only({
        ...WIRE_HARMFUL_CONTENT,
        parameters: [
          { ...WIRE_HARMFUL_CONTENT.parameters[0], optionLabels: { Hate: 'Hateful speech' } },
          WIRE_HARMFUL_CONTENT.parameters[1],
        ],
      });
      expect(parameterById(enriched, 'harmfulContentEntities').optionLabels).toEqual({
        Hate: 'Hateful speech',
        SelfHarm: 'Self-harm',
        Sexual: 'Sexual',
        Violence: 'Violence',
      });
    });

    it('leaves optionLabels absent when neither side has any', () => {
      const enriched = only({
        validator: 'uncatalogued',
        allowedScopes: ['Llm'],
        status: 'Available',
        parameters: [
          { id: 'mode', type: 'enum', defaultValue: 'a', required: true, options: ['a', 'b'] },
        ],
      });
      expect(parameterById(enriched, 'mode')).not.toHaveProperty('optionLabels');
      expect(parameterById(enriched, 'mode').options).toEqual(['a', 'b']);
    });

    it('never puts optionLabels on a map-enum, which reads them through its keySource', () => {
      const enriched = only(WIRE_PII_DETECTION);
      expect(parameterById(enriched, 'entityThresholds')).not.toHaveProperty('optionLabels');
      expect(parameterById(enriched, 'entities').optionLabels?.USSocialSecurityNumber).toBe(
        'US Social Security Number (SSN)'
      );
    });
  });

  describe('bring-your-own definitions take no curated copy at all', () => {
    it('keeps manifest copy even when the validator id collides with a built-in', () => {
      const enriched = only(WIRE_BYO_COLLIDING_VALIDATOR);
      expect(enriched.validator).toBe('pii_detection');
      expect(enriched.displayName).toBe('Acme PII (third party)');
      expect(enriched.description).toBe('Acme Security PII classification.');
      expect(parameterById(enriched, 'entities').label).toBe('Acme entity set');
      // Not UiPath's PII entity labels, which the curated table holds for this exact id.
      expect(parameterById(enriched, 'entities')).not.toHaveProperty('optionLabels');
    });

    it('never attaches a curated usage note to a BYO definition', () => {
      const enriched = only({ ...WIRE_BYO_AVAILABLE, validator: 'llm_as_judge' });
      expect(enriched).not.toHaveProperty('usageNote');
    });

    it('humanizes an undescribed BYO parameter rather than showing the raw id', () => {
      const enriched = only(WIRE_BYO_AVAILABLE);
      expect(parameterById(enriched, 'sensitivity').label).toBe('Sensitivity');
      expect(parameterById(enriched, 'blockedTerms').label).toBe('Blocked terms');
    });

    it('enriches a disabled BYO definition, which is what asks the user to fix it', () => {
      const enriched = only(WIRE_BYO_DISABLED_MINIMAL);
      expect(enriched.status).toBe('Disabled');
      expect(enriched.displayName).toBe('acme-pii-detector');
      expect(enriched.parameters).toEqual([]);
    });
  });

  describe('the translator seam', () => {
    it('routes every curated string through the host translator', () => {
      const enriched = only(WIRE_PII_DETECTION, { translate });
      expect(enriched.displayName).toBe('[guardrail/pii_detection/displayName] PII detection');
      expect(parameterById(enriched, 'entities').label).toBe(
        '[guardrail/pii_detection/param/entities/label] Entities to detect'
      );
      expect(parameterById(enriched, 'entities').optionLabels?.Email).toBe(
        '[guardrail/pii_detection/option/entities/Email] Email'
      );
    });

    it('never routes wire copy through the translator', () => {
      // Manifest copy is already in the tenant's own words; translating it would be wrong.
      const enriched = only({ ...WIRE_BYO_AVAILABLE }, { translate });
      expect(enriched.displayName).toBe('Acme Toxicity Filter');
      expect(parameterById(enriched, 'sensitivity').label).toBe('Sensitivity');
    });

    it('resolves eagerly, so a locale change needs a re-run', () => {
      // Documents the contract rather than a bug: the output is a locale snapshot.
      const english = only(WIRE_PII_DETECTION);
      const translated = only(WIRE_PII_DETECTION, { translate });
      expect(english.displayName).not.toBe(translated.displayName);
    });
  });
});

describe('hiddenValidators', () => {
  it('omits a hidden built-in', () => {
    const enriched = enrich(WIRE_BUILTIN_DEFINITIONS, { hiddenValidators: ['prompt_injection'] });
    expect(enriched.map((definition) => definition.validator)).not.toContain('prompt_injection');
    expect(enriched).toHaveLength(5);
  });

  it('never hides a BYO definition, even on a validator match', () => {
    // A BYO manifest can legitimately declare `validator: "pii_detection"`. Hiding it would make
    // a tenant's own purchased guardrail disappear because of a UiPath product policy.
    const enriched = enrich([WIRE_PII_DETECTION, WIRE_BYO_COLLIDING_VALIDATOR], {
      hiddenValidators: ['pii_detection'],
    });
    expect(enriched).toHaveLength(1);
    expect(enriched[0].byoValidatorName).toBe('acme-pii-v1');
  });

  it('hides nothing by default', () => {
    expect(enrich(WIRE_BUILTIN_DEFINITIONS)).toHaveLength(6);
    expect(enrich(WIRE_BUILTIN_DEFINITIONS, {})).toHaveLength(6);
    expect(enrich(WIRE_BUILTIN_DEFINITIONS, { hiddenValidators: [] })).toHaveLength(6);
  });
});

describe('numeric constraints', () => {
  it('gives a map-enum the 0-to-1 scale when the backend sends no bounds', () => {
    // A behaviour change for the product that renders these unconstrained today: PII entity
    // thresholds are confidences, and an unbounded input let a user save an unusable value.
    const parameter = parameterById(only(WIRE_PII_DETECTION), 'entityThresholds');
    expect(parameter).toMatchObject({ min: 0, max: 1, step: 0.1 });
  });

  it('respects the bounds a map-enum does send', () => {
    const parameter = parameterById(only(WIRE_HARMFUL_CONTENT), 'harmfulContentEntityThresholds');
    expect(parameter).toMatchObject({ min: 0, max: 6, step: 2 });
  });

  it('leaves a number parameter unconstrained when the backend sends no bounds', () => {
    // Only map-enum gets defaults. A plain number with no bounds genuinely has none.
    const parameter = parameterById(
      only({
        validator: 'uncatalogued',
        allowedScopes: ['Llm'],
        status: 'Available',
        parameters: [{ id: 'count', type: 'number', defaultValue: 1, required: false }],
      }),
      'count'
    );
    expect(parameter).not.toHaveProperty('min');
    expect(parameter).not.toHaveProperty('max');
    expect(parameter).not.toHaveProperty('step');
  });

  it('carries number bounds through', () => {
    const parameter = parameterById(only(WIRE_LLM_AS_JUDGE), 'threshold');
    expect(parameter).toMatchObject({ min: 0, max: 6, step: 2 });
  });

  it('carries text and text-list caps through', () => {
    const enriched = only(WIRE_LLM_AS_JUDGE);
    expect(parameterById(enriched, 'guardrailText')).toMatchObject({ maxLength: 4000 });
    expect(parameterById(enriched, 'positiveExamples')).toMatchObject({
      maxItems: 2,
      maxLength: 1000,
    });
  });

  it('keeps the keySource link a map-enum editor needs', () => {
    expect(parameterById(only(WIRE_PII_DETECTION), 'entityThresholds').keySource).toBe('entities');
  });
});

describe('humanizeGuardrailParameterId', () => {
  it.each([
    ['entityThresholds', 'Entity thresholds'],
    ['guardrailText', 'Guardrail text'],
    ['threshold', 'Threshold'],
    ['harmfulContentEntityThresholds', 'Harmful content entity thresholds'],
    ['URL', 'U r l'],
    ['', ''],
  ])('%s becomes %s', (id, expected) => {
    expect(humanizeGuardrailParameterId(id)).toBe(expected);
  });
});

describe('isByoGuardrailDefinition', () => {
  it('is true exactly when byoValidatorName is present', () => {
    expect(isByoGuardrailDefinition({ byoValidatorName: 'acme' })).toBe(true);
    expect(isByoGuardrailDefinition({})).toBe(false);
    expect(isByoGuardrailDefinition({ byoValidatorName: undefined })).toBe(false);
  });

  it('narrows the input type rather than a fixed one', () => {
    const enriched = only(WIRE_BYO_AVAILABLE);
    if (!isByoGuardrailDefinition(enriched)) throw new Error('expected a BYO definition');
    const name: string = enriched.byoValidatorName;
    expect(name).toBe('acme-toxicity-v2');
  });
});

describe('withGuardrailFolderMetadata', () => {
  const definitions = enrich([WIRE_BYO_AVAILABLE, WIRE_PII_DETECTION]);

  it('stitches the folder path the API never sends', () => {
    const next = withGuardrailFolderMetadata(definitions, {
      '0f4c1e2a-6c31-4c07-9f2b-2c9a5d3e77b1': { folderPath: 'Shared/Guardrails' },
    });
    expect(next[0].folderPath).toBe('Shared/Guardrails');
    expect(next[0].folderKey).toBe('6b6b3f21-2d34-4a1e-9a77-1f7c0e6d5c92');
  });

  it('returns the input array itself when there is nothing to apply', () => {
    // Protects host memos: a new array identity every render would invalidate them for nothing.
    expect(withGuardrailFolderMetadata(definitions, {})).toBe(definitions);
  });

  it('returns the input array itself when no definition matches the lookup', () => {
    expect(withGuardrailFolderMetadata(definitions, { 'unrelated-id': { folderPath: 'X' } })).toBe(
      definitions
    );
  });

  it('leaves untouched entries by reference', () => {
    const next = withGuardrailFolderMetadata(definitions, {
      '0f4c1e2a-6c31-4c07-9f2b-2c9a5d3e77b1': { folderPath: 'Shared/Guardrails' },
    });
    expect(next[0]).not.toBe(definitions[0]);
    expect(next[1]).toBe(definitions[1]);
  });

  it('treats a present but empty entry as a no-op', () => {
    // A partially resolved lookup is normal: one connection resolves, another 403s.
    expect(
      withGuardrailFolderMetadata(definitions, {
        '0f4c1e2a-6c31-4c07-9f2b-2c9a5d3e77b1': {},
      })
    ).toBe(definitions);
  });

  it('never overwrites a folderKey the wire already supplied', () => {
    const next = withGuardrailFolderMetadata(definitions, {
      '0f4c1e2a-6c31-4c07-9f2b-2c9a5d3e77b1': { folderPath: 'Shared' },
    });
    expect(next[0].folderKey).toBe(definitions[0].folderKey);
  });

  it('ignores definitions with no connection id', () => {
    const builtIns = enrich([WIRE_PII_DETECTION]);
    expect(withGuardrailFolderMetadata(builtIns, { anything: { folderPath: 'X' } })).toBe(builtIns);
  });
});
