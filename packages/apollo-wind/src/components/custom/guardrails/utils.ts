import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from './types';

/**
 * Seed parameter values for a guardrail: existing values verbatim when editing, otherwise
 * one entry per definition from its `defaultValue`. The wire schema permits
 * `defaultValue: null` for text / enum / text-list / boolean; coerce so the resulting
 * parameter satisfies the union (`value` is never null at runtime).
 */
export function seedGuardrailParameters(
  definitions: GuardrailParameterDefinition[],
  existing?: GuardrailValidatorParameter[]
): GuardrailValidatorParameter[] {
  if (existing) return existing;
  return definitions.map((paramDef) => {
    let value: unknown = paramDef.defaultValue;
    if (paramDef.type === 'text' || paramDef.type === 'enum') {
      if (value == null) value = '';
    } else if (paramDef.type === 'text-list') {
      if (value == null) value = [];
    } else if (paramDef.type === 'boolean') {
      if (value == null) value = false;
    }
    return {
      $parameterType: paramDef.type,
      id: paramDef.id,
      value,
    } as GuardrailValidatorParameter;
  });
}

/**
 * Keep `map-enum` parameters (e.g. PII entity thresholds) in lockstep with the selection of
 * their source `enum-list` parameter (e.g. the selected entities). The backend ships a
 * default threshold map covering *every* possible entity, so an untouched guardrail would
 * otherwise persist dozens of thresholds while only a few entities are selected — and stale
 * thresholds would linger after an entity is deselected. Returns parameters whose map keys
 * exactly match the current selection, preserving user-edited values (falling back to the
 * per-entity default, then the parameter's `min`, then 0).
 *
 * Mirrors the map-enum editor's key resolution exactly so the persisted map matches the
 * rendered rows. Call at save time.
 */
export function syncMapEnumParameters(
  parameters: GuardrailValidatorParameter[],
  definitions: GuardrailParameterDefinition[]
): GuardrailValidatorParameter[] {
  const selectionBySourceId = new Map<string, string[]>();
  for (const param of parameters) {
    // Defend against non-array wire values: the type says `string[]`, but persisted data
    // could be null/malformed, which would corrupt syncing downstream.
    if (param.$parameterType === 'enum-list' && Array.isArray(param.value)) {
      selectionBySourceId.set(param.id, param.value);
    }
  }
  const defById = new Map(definitions.map((d) => [d.id, d]));

  return parameters.map((param) => {
    if (param.$parameterType !== 'map-enum') return param;
    const def = defById.get(param.id);
    const keySource = def?.keySource;
    if (!keySource) return param;
    const sourceDef = defById.get(keySource);
    const allowedKeys =
      selectionBySourceId.get(keySource) ??
      (Array.isArray(sourceDef?.defaultValue) ? (sourceDef.defaultValue as string[]) : undefined);
    if (!allowedKeys) return param;

    // Guard against a null/non-object persisted map before indexing into it.
    const currentMap = param.value && typeof param.value === 'object' ? param.value : {};
    const defaults = (def?.defaultValue as Record<string, number> | undefined) ?? {};
    const fallback = def?.min ?? 0;
    const synced: Record<string, number> = {};
    for (const key of allowedKeys) {
      synced[key] = currentMap[key] ?? defaults[key] ?? fallback;
    }
    return { ...param, value: synced };
  });
}

/**
 * Drop optional parameters whose value is an empty string or an empty array. Runtimes
 * typically require persisted values to be non-empty, so an empty optional value would
 * reject the configuration at publish/run time. Required parameters are kept (empty) so the
 * form can surface their error.
 */
export function dropEmptyOptionalParameters(
  parameters: readonly GuardrailValidatorParameter[],
  definitions: readonly GuardrailParameterDefinition[]
): GuardrailValidatorParameter[] {
  return parameters.filter((param) => {
    const parameterDefinition = definitions.find((p) => p.id === param.id);
    if (!parameterDefinition || parameterDefinition.required) {
      return true;
    }
    const isEmpty =
      (typeof param.value === 'string' && param.value === '') ||
      (Array.isArray(param.value) && param.value.length === 0);
    return !isEmpty;
  });
}

/**
 * Ids of required parameters whose current value counts as empty: a missing entry, a
 * blank/whitespace-only text or enum, an empty enum-list, a text-list whose rows are all
 * blank, or a map-enum with no keys. Numbers and booleans are never empty once present.
 *
 * This is the validation predicate matching what the form's editors visually treat as
 * unfilled — hosts map the returned ids to their own error messages.
 */
export function getRequiredEmptyParameterIds(
  definitions: readonly GuardrailParameterDefinition[],
  parameters: readonly GuardrailValidatorParameter[]
): string[] {
  const emptyIds: string[] = [];
  for (const paramDef of definitions) {
    if (!paramDef.required) continue;
    const param = parameters.find((p) => p.id === paramDef.id);
    if (!param) {
      emptyIds.push(paramDef.id);
      continue;
    }
    const value = param.value;
    let isEmpty = false;
    if (paramDef.type === 'enum-list' && Array.isArray(value)) {
      isEmpty = value.length === 0;
    } else if (paramDef.type === 'text-list' && Array.isArray(value)) {
      isEmpty = value.every((entry) => typeof entry === 'string' && entry.trim().length === 0);
    } else if (
      (paramDef.type === 'text' || paramDef.type === 'enum') &&
      typeof value === 'string'
    ) {
      isEmpty = value.trim().length === 0;
    } else if (
      paramDef.type === 'map-enum' &&
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      isEmpty = Object.keys(value).length === 0;
    }
    if (isEmpty) emptyIds.push(paramDef.id);
  }
  return emptyIds;
}
