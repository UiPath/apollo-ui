import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  WIRE_BUILTIN_DEFINITIONS,
  WIRE_HARMFUL_CONTENT,
  WIRE_LLM_AS_JUDGE,
  WIRE_PII_DETECTION,
} from './__fixtures__/wire-builtins';
import { WIRE_BYO_DEFINITIONS } from './__fixtures__/wire-byo';
import { parseGuardrailDefinitions } from './definitions-parse';
import type { GuardrailDefinitionWire } from './definitions-wire';

const GUARDRAILS_DIR = dirname(fileURLToPath(import.meta.url));

/** Local type-level assertion helper: instantiating it fails to compile if A is not a B. */
type AssertAssignableTo<A extends B, B> = A;

/**
 * The full key set of `GuardrailDefinitionWire`, pinned in both directions: `satisfies` rejects a
 * key the type does not have, and `_NoMissingKeys` rejects a key the type has but this list
 * omits. The runtime assertion further down then compares this against what the schema actually
 * produces, which is the check bidirectional assignability alone cannot make.
 */
const WIRE_KEYS = [
  'validator',
  'allowedScopes',
  'parameters',
  'status',
  'displayName',
  'description',
  'byoValidatorName',
  'byoConnectorName',
  'byoConnectorKey',
  'byoGuardrailConnectionId',
  'byoConfigurationId',
  'folderKey',
  'guardrailStages',
  'payloadMinSizeLimit',
  'payloadMaxSizeLimit',
  'isByogSubscription',
] as const satisfies readonly (keyof GuardrailDefinitionWire)[];

type _NoMissingKeys = AssertAssignableTo<keyof GuardrailDefinitionWire, (typeof WIRE_KEYS)[number]>;

/** Every field set, so parsing it yields the maximal key set the schema can produce. */
const MAXIMAL_DEFINITION = {
  validator: 'maximal',
  allowedScopes: ['Agent', 'Llm', 'Tool'],
  parameters: [
    { id: 'n', type: 'number', defaultValue: 1, required: true, min: 0, max: 2, step: 1 },
  ],
  status: 'Available',
  displayName: 'Maximal',
  description: 'Everything set.',
  byoValidatorName: 'maximal-byo',
  byoConnectorName: 'Connector',
  byoConnectorKey: 'connector-key',
  byoGuardrailConnectionId: 'connection-id',
  byoConfigurationId: 'configuration-id',
  folderKey: 'folder-key',
  guardrailStages: { Llm: ['PreExecution'] },
  payloadMinSizeLimit: 1,
  payloadMaxSizeLimit: 2,
  isByogSubscription: true,
};

const parseOne = (definition: unknown) => parseGuardrailDefinitions([definition]);

/** The single parsed definition, or a failure if the input was rejected. */
function expectAccepted(definition: unknown): GuardrailDefinitionWire {
  const result = parseOne(definition);
  expect(result.invalid).toEqual([]);
  expect(result.definitions).toHaveLength(1);
  return result.definitions[0];
}

function expectRejected(definition: unknown) {
  const result = parseOne(definition);
  expect(result.definitions).toEqual([]);
  expect(result.invalid).toHaveLength(1);
  return result.invalid[0];
}

describe('the zod seal', () => {
  it('exports exactly one runtime symbol, so nothing zod-shaped can leak out', async () => {
    const parseModule = await import('./definitions-parse');
    expect(Object.keys(parseModule)).toEqual(['parseGuardrailDefinitions']);
  });

  it('is the only module in the family that imports zod', () => {
    const offenders = readdirSync(GUARDRAILS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
      .filter((entry) => {
        const source = readFileSync(join(GUARDRAILS_DIR, entry.name), 'utf8');
        return /from\s+'zod(\/[^']*)?'/.test(source);
      })
      .map((entry) => entry.name);

    // Hosts sit on different zod majors, so a second importer is how a zod type reaches the
    // public surface and breaks one of them at typecheck time.
    expect(offenders).toEqual(['definitions-parse.ts']);
  });

  it('produces exactly the key set the hand-written wire type declares', () => {
    const parsed = expectAccepted(MAXIMAL_DEFINITION);
    expect(Object.keys(parsed).sort()).toEqual([...WIRE_KEYS].sort());
  });
});

describe('parseGuardrailDefinitions', () => {
  it('reports a non-array body instead of throwing', () => {
    for (const input of [null, undefined, {}, 'nope', 42, { definitions: [] }]) {
      expect(parseGuardrailDefinitions(input)).toEqual({
        definitions: [],
        invalid: [],
        inputError: 'not-an-array',
      });
    }
  });

  it('accepts an empty array', () => {
    expect(parseGuardrailDefinitions([])).toEqual({ definitions: [], invalid: [] });
  });

  it('parses every built-in definition the backend ships', () => {
    const result = parseGuardrailDefinitions(WIRE_BUILTIN_DEFINITIONS);
    expect(result.invalid).toEqual([]);
    expect(result.definitions.map((definition) => definition.validator)).toEqual([
      'pii_detection',
      'prompt_injection',
      'harmful_content',
      'intellectual_property',
      'user_prompt_attacks',
      'llm_as_judge',
    ]);
  });

  it('parses every bring-your-own definition shape', () => {
    const result = parseGuardrailDefinitions(WIRE_BYO_DEFINITIONS);
    expect(result.invalid).toEqual([]);
    expect(result.definitions).toHaveLength(3);
  });

  it('never throws, whatever the array holds', () => {
    const hostile = [null, undefined, 0, '', [], { validator: {} }, { parameters: 'no' }];
    expect(() => parseGuardrailDefinitions(hostile)).not.toThrow();
    const result = parseGuardrailDefinitions(hostile);
    expect(result.definitions).toEqual([]);
    expect(result.invalid).toHaveLength(hostile.length);
  });

  it('defaults a missing parameters array to empty', () => {
    const parsed = expectAccepted({
      validator: 'no_params',
      allowedScopes: ['Llm'],
      status: 'Available',
    });
    expect(parsed.parameters).toEqual([]);
  });

  it('keeps the five backend fields both products discard today', () => {
    const parsed = expectAccepted(WIRE_HARMFUL_CONTENT);
    expect(parsed.guardrailStages).toEqual({
      Agent: ['PreExecution', 'PostExecution'],
      Llm: ['PreExecution', 'PostExecution'],
      Tool: ['PreExecution', 'PostExecution'],
    });
    expect(parsed.payloadMaxSizeLimit).toBe(10000);
    expect(parsed.isByogSubscription).toBe(false);
  });

  it('accepts a stage value it has never seen, so a backend addition cannot reject a row', () => {
    const parsed = expectAccepted({
      validator: 'future',
      allowedScopes: ['Llm'],
      status: 'Available',
      guardrailStages: { Llm: ['PreExecution', 'MidFlightRecheck'] },
    });
    expect(parsed.guardrailStages).toEqual({ Llm: ['PreExecution', 'MidFlightRecheck'] });
  });

  it('drops tenantId and any other unknown key rather than rejecting the definition', () => {
    // Deliberately `strip`, not `strict`. The API adds fields without a frontend release, and a
    // strict schema would turn every such addition into a catalog that renders nothing. Note this
    // schema only ever sees *definitions*: persisted guardrail values, including sidecar
    // parameters such as `byomConnectionId`, never pass through here and cannot be stripped by it.
    const parsed = expectAccepted({
      ...WIRE_PII_DETECTION,
      tenantId: '8f14e45f-ceea-467a-9adc-1d1a1f1a1b1c',
      somethingTheBackendAddedLater: true,
    });
    expect(parsed).not.toHaveProperty('tenantId');
    expect(parsed).not.toHaveProperty('somethingTheBackendAddedLater');
    expect(parsed.validator).toBe('pii_detection');
  });

  describe('normalizes what the two products disagree about', () => {
    const withParameter = (parameter: unknown) => ({
      validator: 'v',
      allowedScopes: ['Llm'],
      status: 'Available',
      parameters: [parameter],
    });

    it('turns a null or missing text default into an empty string', () => {
      // Agents accepts a missing key, Flow requires it but accepts null. Both now land on ''.
      for (const defaultValue of [null, undefined]) {
        const parsed = expectAccepted(
          withParameter({ id: 't', type: 'text', defaultValue, required: true })
        );
        expect(parsed.parameters[0].defaultValue).toBe('');
      }
    });

    it('turns a null or missing enum default into an empty string', () => {
      for (const defaultValue of [null, undefined]) {
        const parsed = expectAccepted(
          withParameter({ id: 'e', type: 'enum', defaultValue, required: true, options: ['a'] })
        );
        expect(parsed.parameters[0].defaultValue).toBe('');
      }
    });

    it('turns a null or missing text-list default into an empty array', () => {
      // Absent from Agents' schema entirely, so Agents gains text-list defaults here.
      for (const defaultValue of [null, undefined]) {
        const parsed = expectAccepted(
          withParameter({ id: 'tl', type: 'text-list', defaultValue, required: false })
        );
        expect(parsed.parameters[0].defaultValue).toEqual([]);
      }
    });

    it('normalizes a null numeric bound to an absent key', () => {
      const parsed = expectAccepted(
        withParameter({
          id: 'n',
          type: 'number',
          defaultValue: 1,
          required: false,
          min: null,
          max: null,
          step: null,
        })
      );
      const parameter = parsed.parameters[0];
      expect(parameter).not.toHaveProperty('min');
      expect(parameter).not.toHaveProperty('max');
      expect(parameter).not.toHaveProperty('step');
    });

    it('normalizes a null payload limit to an absent key', () => {
      const parsed = expectAccepted(WIRE_LLM_AS_JUDGE);
      expect(parsed).not.toHaveProperty('payloadMinSizeLimit');
      expect(parsed).not.toHaveProperty('payloadMaxSizeLimit');
    });

    it('treats an empty display string as absent', () => {
      const parsed = expectAccepted({
        validator: 'v',
        allowedScopes: ['Llm'],
        status: 'Available',
        displayName: '',
        description: '',
        byoConnectorName: '',
        byoConnectorKey: '',
        byoConfigurationId: '',
        folderKey: '',
      });
      expect(parsed).not.toHaveProperty('displayName');
      expect(parsed).not.toHaveProperty('description');
      expect(parsed).not.toHaveProperty('byoConnectorName');
      expect(parsed).not.toHaveProperty('byoConnectorKey');
      expect(parsed).not.toHaveProperty('byoConfigurationId');
      expect(parsed).not.toHaveProperty('folderKey');
    });

    it('treats an empty parameter display string as absent', () => {
      const parsed = expectAccepted(
        withParameter({
          id: 'p',
          type: 'boolean',
          defaultValue: false,
          required: false,
          displayName: '',
          description: '',
        })
      );
      expect(parsed.parameters[0]).not.toHaveProperty('displayName');
      expect(parsed.parameters[0]).not.toHaveProperty('description');
    });

    it('rejects an empty byoValidatorName rather than emptying it', () => {
      // An empty string here reads as "present" to the BYO check, which would apply UiPath's
      // curated copy to a third-party guardrail and break definition matching on save.
      const failure = expectRejected({
        validator: 'v',
        allowedScopes: ['Llm'],
        status: 'Available',
        byoValidatorName: '',
      });
      expect(failure.issues.some((issue) => issue.path === 'byoValidatorName')).toBe(true);
    });

    it('rejects an empty byoGuardrailConnectionId rather than emptying it', () => {
      const failure = expectRejected({
        validator: 'v',
        allowedScopes: ['Llm'],
        status: 'Available',
        byoGuardrailConnectionId: '',
      });
      expect(failure.issues.some((issue) => issue.path === 'byoGuardrailConnectionId')).toBe(true);
    });
  });

  describe('accepts all seven parameter types', () => {
    const cases: Array<[string, Record<string, unknown>, unknown]> = [
      ['number', { id: 'a', type: 'number', defaultValue: 0.5, required: false }, 0.5],
      ['text', { id: 'b', type: 'text', defaultValue: 'hi', required: true }, 'hi'],
      ['boolean', { id: 'c', type: 'boolean', defaultValue: true, required: false }, true],
      ['enum', { id: 'd', type: 'enum', defaultValue: 'x', required: true, options: ['x'] }, 'x'],
      [
        'enum-list',
        { id: 'e', type: 'enum-list', defaultValue: ['x'], required: true, options: ['x', 'y'] },
        ['x'],
      ],
      ['text-list', { id: 'f', type: 'text-list', defaultValue: ['a'], required: false }, ['a']],
      [
        'map-enum',
        {
          id: 'g',
          type: 'map-enum',
          defaultValue: { x: 0.5 },
          required: true,
          keySource: 'e',
        },
        { x: 0.5 },
      ],
    ];

    it.each(cases)('%s', (type, parameter, expectedDefault) => {
      const parsed = expectAccepted({
        validator: 'v',
        allowedScopes: ['Llm'],
        status: 'Available',
        parameters: [parameter],
      });
      expect(parsed.parameters[0].type).toBe(type);
      expect(parsed.parameters[0].defaultValue).toEqual(expectedDefault);
    });

    it('preserves manifest option labels on enum and enum-list', () => {
      const parsed = expectAccepted({
        validator: 'v',
        allowedScopes: ['Llm'],
        status: 'Available',
        parameters: [
          {
            id: 'e',
            type: 'enum-list',
            defaultValue: [],
            required: false,
            options: ['a'],
            optionLabels: { a: 'Alpha' },
          },
        ],
      });
      expect(parsed.parameters[0]).toMatchObject({ optionLabels: { a: 'Alpha' } });
    });
  });

  describe('rejects what it cannot render', () => {
    const base = { validator: 'v', allowedScopes: ['Llm'], status: 'Available' };

    it.each([
      ['a missing validator', { allowedScopes: ['Llm'], status: 'Available' }],
      ['an empty validator', { ...base, validator: '' }],
      ['no allowed scopes', { ...base, allowedScopes: [] }],
      ['an unknown scope', { ...base, allowedScopes: ['Workflow'] }],
      ['an unknown status', { ...base, status: 'Pending' }],
      ['a missing status', { validator: 'v', allowedScopes: ['Llm'] }],
      [
        'an unknown parameter type',
        { ...base, parameters: [{ id: 'p', type: 'colour-picker', required: true }] },
      ],
      [
        'a parameter with no id',
        { ...base, parameters: [{ type: 'boolean', defaultValue: false, required: true }] },
      ],
      [
        'a parameter with an empty id',
        { ...base, parameters: [{ id: '', type: 'boolean', defaultValue: false, required: true }] },
      ],
      [
        'a map-enum with no keySource',
        { ...base, parameters: [{ id: 'm', type: 'map-enum', defaultValue: {}, required: true }] },
      ],
      [
        'a map-enum whose keySource is empty',
        {
          ...base,
          parameters: [
            { id: 'm', type: 'map-enum', defaultValue: {}, required: true, keySource: '' },
          ],
        },
      ],
      [
        'a number default that is a string',
        { ...base, parameters: [{ id: 'n', type: 'number', defaultValue: '1', required: false }] },
      ],
    ])('%s', (_name, definition) => {
      expectRejected(definition);
    });
  });

  describe('reports what it dropped', () => {
    it('drops a definition whole when one parameter is bad, and keeps its neighbours', () => {
      // Both products already drop the whole definition: a partially parsed one renders a form
      // that cannot be saved, which is worse than the guardrail being absent.
      const broken = {
        validator: 'half_good',
        allowedScopes: ['Llm'],
        status: 'Available',
        parameters: [
          { id: 'fine', type: 'boolean', defaultValue: false, required: false },
          { id: 'broken', type: 'number', defaultValue: 'not a number', required: false },
        ],
      };
      const result = parseGuardrailDefinitions([WIRE_PII_DETECTION, broken, WIRE_LLM_AS_JUDGE]);

      expect(result.definitions.map((definition) => definition.validator)).toEqual([
        'pii_detection',
        'llm_as_judge',
      ]);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].index).toBe(1);
      expect(result.invalid[0].validator).toBe('half_good');
    });

    it('pre-joins the issue path so the failure type carries no zod reference', () => {
      const failure = expectRejected({
        validator: 'v',
        allowedScopes: ['Llm'],
        status: 'Available',
        parameters: [
          { id: 'ok', type: 'boolean', defaultValue: false, required: false },
          { id: 'bad', type: 'number', defaultValue: 'nope', required: false },
        ],
      });
      expect(failure.issues.some((issue) => issue.path === 'parameters.1.defaultValue')).toBe(true);
      for (const issue of failure.issues) {
        expect(typeof issue.path).toBe('string');
        expect(typeof issue.message).toBe('string');
        expect(Object.keys(issue).sort()).toEqual(['message', 'path']);
      }
    });

    it('omits the validator hint when the input cannot supply one', () => {
      const failure = expectRejected({ allowedScopes: ['Llm'], status: 'Available' });
      expect(failure).not.toHaveProperty('validator');
      expect(failure.index).toBe(0);
    });

    it('names the guardrail that vanished even when the rest is unparseable', () => {
      const failure = expectRejected({ validator: 'ghost', allowedScopes: 'not an array' });
      expect(failure.validator).toBe('ghost');
    });

    it('indexes failures against the input array, not the surviving output', () => {
      const bad = { validator: 'bad', allowedScopes: [] };
      const result = parseGuardrailDefinitions([bad, WIRE_PII_DETECTION, bad]);
      expect(result.invalid.map((failure) => failure.index)).toEqual([0, 2]);
      expect(result.definitions).toHaveLength(1);
    });

    it('leaves inputError unset when the body was an array', () => {
      expect(parseGuardrailDefinitions([{ nope: true }])).not.toHaveProperty('inputError');
    });
  });
});
