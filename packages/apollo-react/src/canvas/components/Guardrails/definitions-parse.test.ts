import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ALL_BUILT_IN_WIRE,
  LLM_AS_JUDGE_WIRE,
  PII_DETECTION_WIRE,
  PROMPT_INJECTION_WIRE,
  RAW_PAYLOAD_WITH_NOISE,
} from './__fixtures__/definitions-wire.fixtures';
import { parseGuardrailDefinitions } from './definitions-parse';

describe('parseGuardrailDefinitions', () => {
  it('returns every definition of a well-formed payload, in order', () => {
    const result = parseGuardrailDefinitions(ALL_BUILT_IN_WIRE);

    expect(result.definitions.map((d) => d.validator)).toEqual([
      'pii_detection',
      'prompt_injection',
      'harmful_content',
      'user_prompt_attacks',
      'intellectual_property',
      'llm_as_judge',
    ]);
    expect(result.invalid).toEqual([]);
    expect(result.inputError).toBeUndefined();
  });

  it('round-trips a definition unchanged', () => {
    const result = parseGuardrailDefinitions([PII_DETECTION_WIRE]);

    expect(result.definitions[0]).toEqual(PII_DETECTION_WIRE);
  });

  describe('never throws', () => {
    // The payload crosses a trust boundary (a backend, or Flow's postMessage bridge), and a
    // properties panel must not disappear because it arrived malformed.
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['a string', 'not json'],
      ['a number', 42],
      ['an object', { definitions: [] }],
    ])('reports %s as an input error rather than throwing', (_label, input) => {
      const result = parseGuardrailDefinitions(input);

      expect(result.definitions).toEqual([]);
      expect(result.invalid).toEqual([]);
      expect(result.inputError).toMatch(/Expected an array/);
    });

    it('survives hostile entries', () => {
      const hostile = [
        null,
        undefined,
        'string',
        [],
        { __proto__: { validator: 'injected' } },
        { validator: 'x', allowedScopes: 'not-an-array', status: 'Available' },
      ];

      const result = parseGuardrailDefinitions(hostile);

      expect(result.definitions).toEqual([]);
      expect(result.invalid).toHaveLength(hostile.length);
      // The `__proto__` entry must not have reached the prototype chain.
      expect(Object.prototype).not.toHaveProperty('validator');
    });
  });

  it('drops a bad definition whole and keeps the rest', () => {
    const result = parseGuardrailDefinitions(RAW_PAYLOAD_WITH_NOISE);

    expect(result.definitions.map((d) => d.validator)).toEqual([
      'prompt_injection',
      'user_prompt_attacks',
    ]);
    expect(result.invalid).toEqual([
      { index: 1, validator: 'broken_validator', message: expect.stringContaining('status') },
    ]);
  });

  it('drops a definition when a single parameter is malformed', () => {
    const result = parseGuardrailDefinitions([
      {
        ...PROMPT_INJECTION_WIRE,
        parameters: [{ id: 'threshold', type: 'number', required: true, defaultValue: 'high' }],
      },
    ]);

    expect(result.definitions).toEqual([]);
    expect(result.invalid[0]).toMatchObject({ index: 0, validator: 'prompt_injection' });
  });

  it('omits the validator on an issue when the entry has no readable one', () => {
    const result = parseGuardrailDefinitions([{ allowedScopes: ['Llm'] }]);

    expect(result.invalid[0]).toEqual({ index: 0, message: expect.any(String) });
    expect(result.invalid[0]).not.toHaveProperty('validator');
  });

  it('strips keys this package does not model', () => {
    const result = parseGuardrailDefinitions(RAW_PAYLOAD_WITH_NOISE);

    expect(result.definitions[0]).not.toHaveProperty('executionStage');
    expect(result.definitions[0]).not.toHaveProperty('internalRanking');
  });

  describe('normalization', () => {
    it('treats an empty display string as absent, so it cannot beat curated copy', () => {
      const result = parseGuardrailDefinitions(RAW_PAYLOAD_WITH_NOISE);

      expect(result.definitions[0]?.displayName).toBeUndefined();
      expect(result.definitions[0]?.description).toBeUndefined();
    });

    it('treats an empty parameter displayName as absent', () => {
      const result = parseGuardrailDefinitions([
        {
          ...PROMPT_INJECTION_WIRE,
          parameters: [
            {
              id: 'threshold',
              type: 'number',
              required: true,
              defaultValue: 0.7,
              displayName: '',
              description: '',
            },
          ],
        },
      ]);

      const param = result.definitions[0]?.parameters[0];
      expect(param?.displayName).toBeUndefined();
      expect(param?.description).toBeUndefined();
    });

    it('treats an empty byoValidatorName as "not bring-your-own"', () => {
      const result = parseGuardrailDefinitions([
        { ...PROMPT_INJECTION_WIRE, byoValidatorName: '' },
      ]);

      expect(result.definitions[0]?.byoValidatorName).toBeUndefined();
    });

    it('defaults a missing parameters array to empty', () => {
      const result = parseGuardrailDefinitions([
        { validator: 'x', allowedScopes: ['Llm'], status: 'Available' },
      ]);

      expect(result.definitions[0]?.parameters).toEqual([]);
    });
  });

  describe('accepts both products nullability variants', () => {
    it('accepts null text and enum defaults, and a missing text-list default', () => {
      const result = parseGuardrailDefinitions([LLM_AS_JUDGE_WIRE]);

      const byId = new Map(result.definitions[0]?.parameters.map((p) => [p.id, p]));
      expect(byId.get('guardrailText')).toMatchObject({ defaultValue: null });
      expect(byId.get('model')).toMatchObject({ defaultValue: null });
      expect(byId.get('positiveExamples')).not.toHaveProperty('defaultValue');
      expect(byId.get('negativeExamples')).toMatchObject({ defaultValue: null });
    });

    it('accepts null numeric constraints', () => {
      const result = parseGuardrailDefinitions([
        {
          ...PROMPT_INJECTION_WIRE,
          parameters: [
            {
              id: 'threshold',
              type: 'number',
              required: true,
              defaultValue: 0.7,
              min: null,
              max: null,
              step: null,
            },
          ],
        },
      ]);

      expect(result.definitions).toHaveLength(1);
    });
  });

  it('rejects a scope the display layer cannot render', () => {
    const result = parseGuardrailDefinitions([
      { ...PROMPT_INJECTION_WIRE, allowedScopes: ['Llm', 'Workflow'] },
    ]);

    expect(result.definitions).toEqual([]);
  });
});

describe('zod boundary', () => {
  const folder = dirname(fileURLToPath(import.meta.url));

  function sourceFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.tsx?$/.test(entry.name) ? [full] : [];
    });
  }

  it('is confined to definitions-parse.ts', () => {
    // Anything else importing zod would put schema types in this folder's emitted
    // declarations and force the dependency on every consumer of the subpath.
    const importers = sourceFiles(folder)
      .filter((file) => !file.includes('.test.'))
      .filter((file) => /from ['"]zod['"]|require\(['"]zod['"]\)/.test(readFileSync(file, 'utf8')))
      .map((file) => file.slice(folder.length + 1).replace(/\\/g, '/'));

    expect(importers).toEqual(['definitions-parse.ts']);
  });

  it('produces exactly the keys the public wire type declares', () => {
    // Assignability alone would not catch a schema field the public type never named, so
    // the key set is pinned at runtime too.
    const everyField = {
      validator: 'x',
      allowedScopes: ['Llm'],
      parameters: [],
      status: 'Available',
      displayName: 'X',
      description: 'D',
      byoConnectorName: 'C',
      byoConnectorKey: 'ck',
      byoValidatorName: 'bv',
      byoGuardrailConnectionId: 'bc',
      byoConfigurationId: 'bcfg',
      folderPath: 'Shared/A',
      folderKey: 'fk',
    };

    const result = parseGuardrailDefinitions([everyField]);

    expect(Object.keys(result.definitions[0] ?? {}).sort()).toEqual(Object.keys(everyField).sort());
  });
});
