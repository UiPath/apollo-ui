import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from './types';

/**
 * Coerce an arbitrary value into the shape `GuardrailValidatorParameter` declares for this
 * parameter type, so every entry satisfies the union at runtime.
 *
 * Applied to both sources of untrusted values: a definition's `defaultValue` (typed `unknown`
 * and a required key, so `undefined` type-checks) and a persisted parameter arriving from the
 * wire. Neither is guaranteed to match the union, and the downstream predicates all discriminate
 * on the value's runtime shape — `getRequiredEmptyParameterIds` silently reports nothing for an
 * `undefined`, which let a required parameter through the Save gate entirely.
 *
 * Numbers fall back to the definition's `min`, matching `syncMapEnumParameters` below.
 */
export function coerceParameterValueToType(
  value: unknown,
  paramDef: Pick<GuardrailParameterDefinition, 'type' | 'min'>
): GuardrailValidatorParameter['value'] {
  switch (paramDef.type) {
    case 'text':
    case 'enum':
      return typeof value === 'string' ? value : '';
    case 'boolean':
      return typeof value === 'boolean' ? value : false;
    case 'number':
      return typeof value === 'number' && !Number.isNaN(value) ? value : (paramDef.min ?? 0);
    case 'text-list':
    case 'enum-list':
      return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
    case 'map-enum':
      return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, number>)
        : {};
    default:
      return value as GuardrailValidatorParameter['value'];
  }
}

/**
 * Seed parameter values for a guardrail: existing values normalised when editing, otherwise
 * one entry per definition from its `defaultValue`. Both paths run through
 * `coerceParameterValueToType`, so `value` always satisfies the union — the wire schema permits
 * `null`, and `defaultValue` permits `undefined`, for types whose editors cannot render either.
 */
export function seedGuardrailParameters(
  definitions: GuardrailParameterDefinition[],
  existing?: GuardrailValidatorParameter[]
): GuardrailValidatorParameter[] {
  if (existing) return normalizeGuardrailParameters(existing, definitions);
  return definitions.map(
    (paramDef) =>
      ({
        $parameterType: paramDef.type,
        id: paramDef.id,
        value: coerceParameterValueToType(paramDef.defaultValue, paramDef),
      }) as GuardrailValidatorParameter
  );
}

/**
 * Normalise persisted parameters against their definitions.
 *
 * The edit path is the one that actually receives wire data, and it was the one with no guard:
 * a persisted `text-list` of `null` reached `param.value.filter(...)` in the builder's
 * `guardrailResult` memo and threw *during render*, so the builder failed to mount rather than
 * degrading. Parameters with no matching definition (host sidecars) pass through untouched —
 * their shape is the host's business, not ours.
 */
export function normalizeGuardrailParameters(
  parameters: readonly GuardrailValidatorParameter[],
  definitions: readonly GuardrailParameterDefinition[]
): GuardrailValidatorParameter[] {
  const defById = new Map(definitions.map((d) => [d.id, d]));
  let changed = false;
  const next = parameters.map((param) => {
    const paramDef = defById.get(param.id);
    if (!paramDef) return param;
    const value = coerceParameterValueToType(param.value, paramDef);
    // The discriminator is normalised alongside the value: a persisted entry can disagree with
    // its definition (a `number` parameter carrying `$parameterType: 'text'`), and coercing only
    // the value would emit a pair that satisfies no member of the union. The definition is the
    // authority — it is what the editors and predicates dispatch on.
    const type = paramDef.type;
    if (value === param.value && type === param.$parameterType) return param;
    changed = true;
    return { ...param, $parameterType: type, value } as GuardrailValidatorParameter;
  });
  // Identity is preserved when nothing needed coercing — the overwhelmingly common case. Hosts
  // seed into `useState` and compare parameter arrays by reference, so returning a fresh array
  // on every call would churn them for no reason.
  return changed ? next : (parameters as GuardrailValidatorParameter[]);
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

    // Guard against a null/array/non-object persisted map before indexing into it.
    const currentMap =
      param.value && typeof param.value === 'object' && !Array.isArray(param.value)
        ? param.value
        : {};
    const defaults = (def?.defaultValue as Record<string, number> | undefined) ?? {};
    const fallback = def?.min ?? 0;
    const synced: Record<string, number> = {};
    for (const key of allowedKeys) {
      // `??` alone let a malformed persisted threshold through — `{ Email: NaN }` or
      // `{ Email: 'bad' }` is neither null nor undefined, and `getOutOfRangeParameterIds` skips
      // non-numeric entries, so it reached onSave unchallenged. Only a finite number counts as
      // a value worth preserving; anything else falls back like a missing key.
      const persisted = currentMap[key];
      synced[key] =
        typeof persisted === 'number' && Number.isFinite(persisted)
          ? persisted
          : (defaults[key] ?? fallback);
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
 * Ids of parameters whose value falls outside the definition's `min`/`max`.
 *
 * `min`/`max` reach the input as DOM attributes, which browsers only enforce on native form
 * submission — and this form has none, since the host owns saving. Without this check an
 * out-of-range value saves silently, so hosts should gate Save on it alongside
 * `getRequiredEmptyParameterIds`.
 *
 * Covers `map-enum` as well as `number`: the bounds are documented for both (each map row is
 * edited as a number), and checking only the scalar let an out-of-range map threshold through.
 * A map is reported once, by parameter id, however many of its rows are out of range — the id
 * is what a host maps to an error message.
 */
export function getOutOfRangeParameterIds(
  definitions: readonly GuardrailParameterDefinition[],
  parameters: readonly GuardrailValidatorParameter[]
): string[] {
  const isOutOfRange = (value: number, paramDef: GuardrailParameterDefinition) =>
    (paramDef.min != null && value < paramDef.min) ||
    (paramDef.max != null && value > paramDef.max);

  const ids: string[] = [];
  for (const paramDef of definitions) {
    if (paramDef.type !== 'number' && paramDef.type !== 'map-enum') continue;
    if (paramDef.min == null && paramDef.max == null) continue;
    const value = parameters.find((p) => p.id === paramDef.id)?.value;

    if (paramDef.type === 'number') {
      if (typeof value !== 'number' || Number.isNaN(value)) continue;
      if (isOutOfRange(value, paramDef)) ids.push(paramDef.id);
      continue;
    }

    if (value == null || typeof value !== 'object' || Array.isArray(value)) continue;
    const entries = Object.values(value as Record<string, unknown>);
    if (
      entries.some(
        (entry) =>
          typeof entry === 'number' && !Number.isNaN(entry) && isOutOfRange(entry, paramDef)
      )
    ) {
      ids.push(paramDef.id);
    }
  }
  return ids;
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
