import { describe, expect, it } from 'vitest';
import {
  buildGuardrailFormSchema,
  coerceGuardrailParameterValue,
  GUARDRAIL_ENUM_LIST_CHIPS_COMPONENT,
  GUARDRAIL_MAP_ENUM_COMPONENT,
  GUARDRAIL_RENDER_PARAMETER_COMPONENT,
  MAX_INLINE_ENUM_OPTIONS,
} from './form-schema-builder';
import { GUARDRAIL_FORM_EN_LABELS } from './i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from './types';

const LABELS = GUARDRAIL_FORM_EN_LABELS;

function fieldFor(
  def: GuardrailParameterDefinition,
  options?: Parameters<typeof buildGuardrailFormSchema>[2],
  siblings: GuardrailParameterDefinition[] = []
) {
  const schema = buildGuardrailFormSchema([def, ...siblings], LABELS, options);
  const field = schema.sections?.[0]?.fields.find((f) => f.name === def.id);
  if (!field) throw new Error(`no field built for ${def.id}`);
  return field;
}

describe('buildGuardrailFormSchema', () => {
  it('builds a submit-less single-section schema', () => {
    const schema = buildGuardrailFormSchema([], LABELS);
    expect(schema.actions).toEqual([]);
    expect(schema.sections).toHaveLength(1);
  });

  it('maps common metadata: label, tooltip, required asterisk config', () => {
    const field = fieldFor({
      id: 'threshold',
      type: 'number',
      label: 'Threshold',
      required: true,
      tooltip: 'How strict.',
      defaultValue: 0.5,
    });
    expect(field).toMatchObject({
      name: 'threshold',
      label: 'Threshold',
      tooltip: 'How strict.',
      tooltipAriaLabel: LABELS.moreInformation,
      validation: { required: true },
    });
  });

  it('maps number -> number with constraints and a 0 fallback default', () => {
    const field = fieldFor({
      id: 'n',
      type: 'number',
      label: 'N',
      required: false,
      defaultValue: null,
      min: 0,
      max: 1,
      step: 0.1,
    });
    expect(field).toMatchObject({ type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0 });
  });

  it('maps text -> textarea with minRows and maxLength', () => {
    const field = fieldFor({
      id: 't',
      type: 'text',
      label: 'T',
      required: false,
      defaultValue: null,
      maxLength: 100,
    });
    expect(field).toMatchObject({ type: 'textarea', minRows: 3, maxLength: 100, defaultValue: '' });
  });

  it('maps boolean -> switch and text-list -> string-list with localized chrome', () => {
    expect(
      fieldFor({ id: 'b', type: 'boolean', label: 'B', required: false, defaultValue: true })
    ).toMatchObject({ type: 'switch', defaultValue: true });

    expect(
      fieldFor({
        id: 'phrases',
        type: 'text-list',
        label: 'Phrases',
        required: false,
        defaultValue: null,
        maxItems: 3,
        maxLength: 50,
      })
    ).toMatchObject({
      type: 'string-list',
      maxItems: 3,
      maxLength: 50,
      minRows: 2,
      addItemLabel: LABELS.addItem,
      removeItemAriaLabel: LABELS.removeItem,
      defaultValue: [],
    });
  });

  it('maps enum -> select and appends a synthetic option for a stale stored value', () => {
    const def: GuardrailParameterDefinition = {
      id: 'model',
      type: 'enum',
      label: 'Model',
      required: true,
      defaultValue: 'gpt-4o',
      options: ['gpt-4o', 'gpt-4o-mini'],
      optionLabels: { 'gpt-4o': 'GPT-4o' },
    };

    const plain = fieldFor(def);
    expect(plain).toMatchObject({ type: 'select', placeholder: LABELS.enumPlaceholder });
    if (plain.type !== 'select') throw new Error('expected select');
    expect(plain.options).toEqual([
      { value: 'gpt-4o', label: 'GPT-4o' },
      { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
    ]);

    const withStale = fieldFor(def, { enumSyntheticValues: { model: 'retired-model' } });
    if (withStale.type !== 'select') throw new Error('expected select');
    expect(withStale.options).toContainEqual({ value: 'retired-model', label: 'retired-model' });
  });

  it('splits enum-list at the inline-chip cap: chips custom component vs multiselect', () => {
    const small: GuardrailParameterDefinition = {
      id: 'few',
      type: 'enum-list',
      label: 'Few',
      required: true,
      defaultValue: [],
      options: Array.from({ length: MAX_INLINE_ENUM_OPTIONS }, (_, i) => `o${i}`),
    };
    const large: GuardrailParameterDefinition = {
      ...small,
      id: 'many',
      options: Array.from({ length: MAX_INLINE_ENUM_OPTIONS + 1 }, (_, i) => `o${i}`),
    };

    expect(fieldFor(small)).toMatchObject({
      type: 'custom',
      component: GUARDRAIL_ENUM_LIST_CHIPS_COMPONENT,
    });
    const many = fieldFor(large);
    expect(many).toMatchObject({ type: 'multiselect', placeholder: LABELS.enumListPlaceholder });
  });

  it('maps map-enum to its custom component with the source definition and mount-time selection', () => {
    const entities: GuardrailParameterDefinition = {
      id: 'entities',
      type: 'enum-list',
      label: 'Entities',
      required: true,
      defaultValue: ['Email'],
      options: ['Email', 'Address'],
    };
    const thresholds: GuardrailParameterDefinition = {
      id: 'thresholds',
      type: 'map-enum',
      label: 'Thresholds',
      required: false,
      defaultValue: { Email: 0.5, Address: 0.5 },
      keySource: 'entities',
    };
    const initialParameters: GuardrailValidatorParameter[] = [
      { $parameterType: 'enum-list', id: 'entities', value: ['Email', 'Address'] },
    ];

    const field = fieldFor(thresholds, { initialParameters }, [entities]);
    expect(field).toMatchObject({ type: 'custom', component: GUARDRAIL_MAP_ENUM_COMPONENT });
    if (field.type !== 'custom') throw new Error('expected custom');
    expect(field.componentProps).toMatchObject({
      sourceDef: entities,
      sourceSelection: ['Email', 'Address'],
    });
  });

  it('routes overridden ids to the renderParameter bridge regardless of type', () => {
    const field = fieldFor(
      {
        id: 'model',
        type: 'enum',
        label: 'Model',
        required: true,
        defaultValue: 'a',
        options: ['a'],
      },
      { overriddenIds: new Set(['model']) }
    );
    expect(field).toMatchObject({
      type: 'custom',
      component: GUARDRAIL_RENDER_PARAMETER_COMPONENT,
    });
  });

  it('seeds field defaults from initialParameters over definition defaults', () => {
    const field = fieldFor(
      { id: 'n', type: 'number', label: 'N', required: false, defaultValue: 0.5 },
      {
        initialParameters: [{ $parameterType: 'number', id: 'n', value: 0.8 }],
      }
    );
    expect(field.defaultValue).toBe(0.8);
  });
});

describe('coerceGuardrailParameterValue', () => {
  const def = (type: GuardrailParameterDefinition['type']): GuardrailParameterDefinition => ({
    id: 'x',
    type,
    label: 'X',
    required: false,
    defaultValue: null,
  });

  it('coerces a cleared number input (NaN) to 0, like the pre-convergence editor', () => {
    expect(coerceGuardrailParameterValue(Number.NaN, def('number'))).toBe(0);
    expect(coerceGuardrailParameterValue(0.7, def('number'))).toBe(0.7);
  });

  it('never persists null/undefined for text, enum, or boolean', () => {
    expect(coerceGuardrailParameterValue(undefined, def('text'))).toBe('');
    expect(coerceGuardrailParameterValue(undefined, def('enum'))).toBe('');
    expect(coerceGuardrailParameterValue(undefined, def('boolean'))).toBe(false);
  });

  it('passes arrays and maps through untouched', () => {
    expect(coerceGuardrailParameterValue(['a'], def('enum-list'))).toEqual(['a']);
    expect(coerceGuardrailParameterValue({ a: 1 }, def('map-enum'))).toEqual({ a: 1 });
  });
});
