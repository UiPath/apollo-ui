import { describe, expect, it, vi } from 'vitest';
import { PII_ENTITY_OPTIONS, WIRE_BUILTIN_DEFINITIONS } from './__fixtures__/wire-builtins';
import type { GuardrailCopyKey, GuardrailCopyTranslator } from './definitions-copy';
import {
  GUARDRAIL_COPY_EN,
  GUARDRAIL_COPY_KEY_PREFIX,
  GUARDRAIL_COPY_VALIDATORS,
  resolveGuardrailValidatorCopy,
} from './definitions-copy';

const keys = Object.keys(GUARDRAIL_COPY_EN) as GuardrailCopyKey[];

describe('copy key shape', () => {
  it('prefixes every key', () => {
    for (const key of keys) {
      expect(key.startsWith(GUARDRAIL_COPY_KEY_PREFIX)).toBe(true);
    }
  });

  it('never uses a dot or a colon in a key', () => {
    // The hazard this whole key convention exists for. One host's catalog is flat and its i18n
    // library splits on `.` by default, so a dotted key would resolve as a nested path, miss, and
    // fall back to the English default: English would look perfect while every other locale went
    // quietly untranslated. `:` is that library's namespace separator and fails the same way.
    for (const key of keys) {
      expect(key).not.toContain('.');
      expect(key).not.toContain(':');
    }
  });

  it('has no empty segment and no whitespace', () => {
    for (const key of keys) {
      expect(key).not.toMatch(/\s/);
      expect(key.split('/').every((segment) => segment.length > 0)).toBe(true);
    }
  });

  it('uses only the four documented key shapes', () => {
    const shapes = [
      /^guardrail\/[a-z_]+\/(displayName|description|usageNote)$/,
      /^guardrail\/[a-z_]+\/param\/[A-Za-z]+\/(label|tooltip)$/,
      /^guardrail\/[a-z_]+\/option\/[A-Za-z]+\/[A-Za-z]+$/,
    ];
    for (const key of keys) {
      expect(shapes.some((shape) => shape.test(key))).toBe(true);
    }
  });

  it('is frozen, so a host cannot mutate the shared table', () => {
    expect(Object.isFrozen(GUARDRAIL_COPY_EN)).toBe(true);
  });
});

describe('the English table', () => {
  it('covers exactly the validators the backend ships as built-ins', () => {
    const backendValidators = WIRE_BUILTIN_DEFINITIONS.map((definition) => definition.validator);
    expect([...GUARDRAIL_COPY_VALIDATORS].sort()).toEqual([...backendValidators].sort());
  });

  it('gives every validator a display name and a description', () => {
    for (const validator of GUARDRAIL_COPY_VALIDATORS) {
      expect(GUARDRAIL_COPY_EN[`guardrail/${validator}/displayName`]).toBeTruthy();
      expect(GUARDRAIL_COPY_EN[`guardrail/${validator}/description`]).toBeTruthy();
    }
  });

  it('never carries an empty string', () => {
    for (const key of keys) {
      expect(GUARDRAIL_COPY_EN[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('labels a parameter only where the backend actually sends one', () => {
    // Guards against a curated label for a parameter that no longer exists, which would be dead
    // copy sent to translators every release.
    const backendParameterIds = new Map(
      WIRE_BUILTIN_DEFINITIONS.map((definition) => [
        definition.validator,
        new Set(definition.parameters.map((parameter) => parameter.id)),
      ])
    );

    for (const key of keys) {
      const match = /^guardrail\/([a-z_]+)\/param\/([A-Za-z]+)\//.exec(key);
      if (!match) continue;
      const [, validator, parameterId] = match;
      expect(backendParameterIds.get(validator)?.has(parameterId)).toBe(true);
    }
  });

  it('keys PII option labels by the raw wire value the backend offers', () => {
    // The transcription hazard made real: keying by a camelCased slug is how the two products
    // ended up with `finNationalId` and `fiNationalId` for the same option.
    const labelled = keys
      .map((key) => /^guardrail\/pii_detection\/option\/entities\/(.+)$/.exec(key)?.[1])
      .filter((option): option is string => option !== undefined);

    expect(labelled.sort()).toEqual([...PII_ENTITY_OPTIONS].sort());
  });

  it('labels every option of every enum-list the backend ships', () => {
    for (const definition of WIRE_BUILTIN_DEFINITIONS) {
      for (const parameter of definition.parameters) {
        if (parameter.type !== 'enum-list') continue;
        for (const option of parameter.options ?? []) {
          const key = `guardrail/${definition.validator}/option/${parameter.id}/${option}`;
          expect(GUARDRAIL_COPY_EN[key as GuardrailCopyKey]).toBeTruthy();
        }
      }
    }
  });
});

describe('resolveGuardrailValidatorCopy', () => {
  it('returns undefined for a validator the catalog has never heard of', () => {
    // A validator the backend adds after this package is published must degrade to the wire copy,
    // not to a crash or to another validator's strings.
    expect(resolveGuardrailValidatorCopy('acme_toxicity')).toBeUndefined();
    expect(resolveGuardrailValidatorCopy('')).toBeUndefined();
  });

  it('resolves to English when no translator is supplied', () => {
    const copy = resolveGuardrailValidatorCopy('harmful_content');
    expect(copy?.displayName).toBe('Harmful content');
    expect(copy?.paramLabels.harmfulContentEntities).toBe('Content categories');
    expect(copy?.optionLabels.harmfulContentEntities.SelfHarm).toBe('Self-harm');
  });

  it('asks the translator for every string, with the English default as the fallback', () => {
    const translate = vi.fn<GuardrailCopyTranslator>((_key, defaultValue) => defaultValue);
    const copy = resolveGuardrailValidatorCopy('pii_detection', translate);

    const asked = translate.mock.calls.map(([key]) => key);
    expect(asked).toContain('guardrail/pii_detection/displayName');
    expect(asked).toContain('guardrail/pii_detection/description');
    expect(asked).toContain('guardrail/pii_detection/param/entityThresholds/label');
    expect(asked).toContain('guardrail/pii_detection/param/entityThresholds/tooltip');
    expect(asked).toContain('guardrail/pii_detection/option/entities/USSocialSecurityNumber');
    // Every string it resolved came through the seam, none read straight off the table.
    expect(asked.every((key) => key in GUARDRAIL_COPY_EN)).toBe(true);
    expect(copy?.displayName).toBe('PII detection');

    for (const [key, defaultValue] of translate.mock.calls) {
      expect(defaultValue).toBe(GUARDRAIL_COPY_EN[key]);
    }
  });

  it('uses whatever the translator returns', () => {
    const copy = resolveGuardrailValidatorCopy(
      'pii_detection',
      (key) => `translated:${key.split('/').pop()}`
    );
    expect(copy?.displayName).toBe('translated:displayName');
    expect(copy?.paramLabels.entities).toBe('translated:label');
    expect(copy?.optionLabels.entities.Email).toBe('translated:Email');
  });

  it('resolves a usage note only for the validator that has one', () => {
    expect(resolveGuardrailValidatorCopy('llm_as_judge')?.usageNote).toContain('Agent units');
    expect(resolveGuardrailValidatorCopy('pii_detection')).not.toHaveProperty('usageNote');
  });

  it('omits a tooltip for a parameter the table gives no tooltip', () => {
    const copy = resolveGuardrailValidatorCopy('pii_detection');
    expect(copy?.paramLabels.entities).toBe('Entities to detect');
    expect(copy?.paramTooltips).not.toHaveProperty('entities');
  });

  it('returns empty lookups rather than undefined for a validator with no parameters', () => {
    const copy = resolveGuardrailValidatorCopy('user_prompt_attacks');
    expect(copy?.paramLabels).toEqual({});
    expect(copy?.paramTooltips).toEqual({});
    expect(copy?.optionLabels).toEqual({});
  });
});
