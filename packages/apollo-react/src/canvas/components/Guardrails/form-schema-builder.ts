import { formatTemplate } from '@uipath/apollo-wind';
import type { FieldMetadata, FormSchema } from '@uipath/apollo-wind';
import type { GuardrailValidatorFormLabels } from './i18n';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from './types';

/** Registered custom-component names for the parameter editors that stay guardrail-owned. */
export const GUARDRAIL_ENUM_LIST_CHIPS_COMPONENT = 'guardrail-enum-list-chips';
export const GUARDRAIL_MAP_ENUM_COMPONENT = 'guardrail-map-enum';
export const GUARDRAIL_RENDER_PARAMETER_COMPONENT = 'guardrail-render-parameter';

/** enum-list option sets at or below this render as inline chips; larger sets as MultiSelect. */
export const MAX_INLINE_ENUM_OPTIONS = 8;

export interface BuildGuardrailFormSchemaOptions {
  /** Definition ids claimed by the host's `renderParameter` override. */
  overriddenIds?: ReadonlySet<string>;
  /**
   * Mount-time parameter values: they seed each field's `defaultValue` so the first paint is
   * correct before the controlled `values` sync-in runs. Later external changes arrive
   * through `values`, never through a schema rebuild.
   */
  initialParameters?: GuardrailValidatorParameter[];
  /**
   * Per-enum-definition stored values missing from the option catalog (e.g. an option removed
   * after the guardrail was saved); each is appended as a synthetic option so the select never
   * silently blanks.
   */
  enumSyntheticValues?: Record<string, string>;
}

/**
 * Metadata-expressed validation for a parameter. `min`/`max` also reach the number input as
 * DOM attributes, but those only bind on native form submission, which this form never does —
 * declaring them here is what makes the range enforceable.
 */
function buildFieldValidation(
  def: GuardrailParameterDefinition,
  labels: GuardrailValidatorFormLabels
) {
  const validation: {
    required?: boolean;
    min?: number;
    max?: number;
    messages?: { required?: string; min?: string; max?: string };
  } = {};
  const messages: { required?: string; min?: string; max?: string } = {};

  if (def.required) {
    validation.required = true;
    messages.required = labels.requiredError;
  }
  if (def.type === 'number') {
    if (def.min != null) {
      validation.min = def.min;
      messages.min = formatTemplate(labels.minError, { min: String(def.min) });
    }
    if (def.max != null) {
      validation.max = def.max;
      messages.max = formatTemplate(labels.maxError, { max: String(def.max) });
    }
  }

  if (Object.keys(validation).length === 0) return undefined;
  // Supplied unconditionally once any constraint exists: an omitted message is apollo-wind's
  // hardcoded English, which is the one untranslated string this family would otherwise ship.
  validation.messages = messages;
  return validation;
}

/**
 * Map guardrail parameter definitions onto the forms/ `MetadataForm` schema. Five of the
 * seven parameter types map to first-class field types (`number`, `textarea`, `switch`,
 * `select`, `multiselect`/`string-list`); enum-lists small enough for the chip UX, `map-enum`
 * (keySource-driven rows), and host `renderParameter` overrides register as custom
 * components. `required`/`min`/`max` are enforced by MetadataForm's resolver (the controlled
 * seam that once suppressed it was removed in review); the host's own predicate runs alongside
 * it and reaches the form as `type: 'external'` errors through `useMetadataFormBridge`.
 */
export function buildGuardrailFormSchema(
  definitions: GuardrailParameterDefinition[],
  labels: GuardrailValidatorFormLabels,
  options?: BuildGuardrailFormSchemaOptions
): FormSchema {
  const initialById = new Map((options?.initialParameters ?? []).map((p) => [p.id, p]));

  const fields = definitions.map((def) =>
    buildGuardrailField(def, definitions, labels, initialById, options)
  );

  return {
    id: 'guardrail-validator-form',
    title: '',
    actions: [],
    sections: [{ id: 'parameters', fields }],
  };
}

function buildGuardrailField(
  def: GuardrailParameterDefinition,
  definitions: GuardrailParameterDefinition[],
  labels: GuardrailValidatorFormLabels,
  initialById: Map<string, GuardrailValidatorParameter>,
  options?: BuildGuardrailFormSchemaOptions
): FieldMetadata {
  const initial = initialById.get(def.id);
  const base = {
    name: def.id,
    label: def.label,
    tooltip: def.tooltip,
    tooltipAriaLabel: labels.moreInformation,
    validation: buildFieldValidation(def, labels),
  };

  if (options?.overriddenIds?.has(def.id)) {
    return {
      ...base,
      type: 'custom',
      component: GUARDRAIL_RENDER_PARAMETER_COMPONENT,
      defaultValue: initial?.value,
    };
  }

  switch (def.type) {
    case 'number':
      return {
        ...base,
        type: 'number',
        min: def.min,
        max: def.max,
        step: def.step,
        defaultValue:
          (initial?.$parameterType === 'number' ? initial.value : (def.defaultValue as number)) ??
          0,
      };

    case 'text':
      return {
        ...base,
        type: 'textarea',
        minRows: 3,
        maxLength: def.maxLength,
        defaultValue:
          initial?.$parameterType === 'text'
            ? initial.value
            : ((def.defaultValue as string | null) ?? ''),
      };

    case 'boolean':
      return {
        ...base,
        type: 'switch',
        defaultValue:
          initial?.$parameterType === 'boolean'
            ? initial.value
            : ((def.defaultValue as boolean | null | undefined) ?? false),
      };

    case 'enum': {
      const current =
        initial?.$parameterType === 'enum'
          ? initial.value
          : ((def.defaultValue as string | null) ?? '');
      const catalog = (def.options ?? []).map((opt) => ({
        value: opt,
        label: def.optionLabels?.[opt] ?? opt,
      }));
      const synthetic = options?.enumSyntheticValues?.[def.id];
      const opts =
        synthetic && !catalog.some((opt) => opt.value === synthetic)
          ? [...catalog, { value: synthetic, label: def.optionLabels?.[synthetic] ?? synthetic }]
          : catalog;
      return {
        ...base,
        type: 'select',
        placeholder: labels.enumPlaceholder,
        options: opts,
        defaultValue: current,
      };
    }

    case 'enum-list': {
      const selected =
        initial?.$parameterType === 'enum-list'
          ? initial.value
          : ((def.defaultValue as string[]) ?? []);
      if ((def.options ?? []).length <= MAX_INLINE_ENUM_OPTIONS) {
        return {
          ...base,
          type: 'custom',
          component: GUARDRAIL_ENUM_LIST_CHIPS_COMPONENT,
          defaultValue: selected,
          componentProps: { paramDef: def, labels },
        };
      }
      return {
        ...base,
        type: 'multiselect',
        placeholder: labels.enumListPlaceholder,
        options: (def.options ?? []).map((opt) => ({
          value: opt,
          label: def.optionLabels?.[opt] ?? opt,
        })),
        defaultValue: selected,
      };
    }

    case 'text-list':
      return {
        ...base,
        type: 'string-list',
        maxItems: def.maxItems,
        maxLength: def.maxLength,
        minRows: 2,
        addItemLabel: labels.addItem,
        removeItemAriaLabel: labels.removeItem,
        defaultValue:
          initial?.$parameterType === 'text-list'
            ? initial.value
            : ((def.defaultValue as string[] | null | undefined) ?? []),
      };

    case 'map-enum': {
      const sourceDef = def.keySource ? definitions.find((d) => d.id === def.keySource) : undefined;
      // The sibling's mount-time selection: `useWatch` in the editor returns undefined
      // until the sibling field's first change event, so the initial row keys are seeded
      // through componentProps.
      const sourceInitial = def.keySource ? initialById.get(def.keySource) : undefined;
      const sourceSelection =
        sourceInitial?.$parameterType === 'enum-list'
          ? sourceInitial.value
          : (sourceDef?.defaultValue as string[] | undefined);
      return {
        ...base,
        type: 'custom',
        component: GUARDRAIL_MAP_ENUM_COMPONENT,
        // No fallback to def.defaultValue here: the editor falls back at render time (and
        // never prunes), exactly like the pre-convergence editor.
        defaultValue: initial?.$parameterType === 'map-enum' ? initial.value : undefined,
        componentProps: { paramDef: def, sourceDef, labels, sourceSelection },
      };
    }
  }
}

/**
 * Coerce a form-emitted value to the parameter's wire shape, mirroring the pre-convergence
 * editors: number inputs emit NaN when cleared (`parseFloat('')`) which persisted as 0;
 * text/enum never persist null/undefined.
 */
export function coerceGuardrailParameterValue(
  value: unknown,
  def: GuardrailParameterDefinition
): unknown {
  switch (def.type) {
    case 'number':
      return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
    case 'text':
    case 'enum':
      return value ?? '';
    case 'boolean':
      return value ?? false;
    default:
      return value;
  }
}
