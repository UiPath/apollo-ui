import type { GuardrailDefinition } from './builder-types';
import type { GuardrailCopyTranslator } from './definitions-copy';
import { resolveGuardrailValidatorCopy } from './definitions-copy';
import type { GuardrailDefinitionWire, GuardrailParameterDefinitionWire } from './definitions-wire';
import type { GuardrailParameterDefinition } from './types';

/**
 * Turn parsed wire definitions into the display-ready shape the guardrail components render.
 *
 * This is the step that used to exist twice. It resolves curated copy for built-in validators,
 * lets BYO manifest copy win, flattens the parameter union, and applies the numeric defaults the
 * `map-enum` editor needs. Output feeds `GuardrailBuilder` / `GuardrailValidatorForm` directly.
 */

/**
 * `GuardrailDefinition` plus the wire fields hosts read outside the form: palette grouping,
 * definition matching, telemetry. Extending rather than replacing is deliberate, so an enriched
 * definition still satisfies `GuardrailDefinition` and drops straight into the shipped
 * components, while no host has to keep a parallel copy of the raw definition alongside it.
 */
export interface EnrichedGuardrailDefinition extends GuardrailDefinition {
  /**
   * Resolved description. Optional because the catalog may not cover a validator and a BYO
   * manifest need not carry one, so consumers must handle its absence rather than render `''`.
   */
  description?: string;
  byoConnectorName?: string;
  byoConnectorKey?: string;
  byoGuardrailConnectionId?: string;
  byoConfigurationId?: string;
  /**
   * Human-readable folder of the BYO connection. The API never sends this; it is stitched on by
   * `withGuardrailFolderMetadata` from a host-side connection lookup.
   */
  folderPath?: string;
  folderKey?: string;
  guardrailStages?: Record<string, string[]>;
  payloadMinSizeLimit?: number;
  payloadMaxSizeLimit?: number;
  isByogSubscription?: boolean;
}

export interface EnrichGuardrailDefinitionsOptions {
  /**
   * Host translation lookup for the curated copy. Omit for pure English.
   *
   * Enrichment is a locale *snapshot*: every string is resolved eagerly, so re-run it when the
   * host locale changes.
   */
  translate?: GuardrailCopyTranslator;
  /**
   * Validator ids to omit entirely, for validators a product manages itself rather than exposing.
   * Hiding is product policy, which is why it is a parameter and not baked into the catalog.
   *
   * BYO guardrails are never hidden by this, even when their `validator` matches: a BYO manifest
   * can legitimately declare `validator: "pii_detection"`.
   */
  hiddenValidators?: readonly string[];
}

/**
 * Fallback label for a parameter no catalog entry and no manifest describes, e.g.
 * `entityThresholds` becomes `Entity thresholds`. Better than showing the raw id, which is what
 * one product does today.
 */
export function humanizeGuardrailParameterId(id: string): string {
  const spaced = id.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/**
 * Whether a definition is a bring-your-own guardrail. `byoValidatorName` is the discriminator on
 * the wire, and the parser rejects it as an empty string precisely so this check cannot be
 * flipped by one.
 */
export function isByoGuardrailDefinition<T extends { byoValidatorName?: string }>(
  definition: T
): definition is T & { byoValidatorName: string } {
  return definition.byoValidatorName !== undefined;
}

/**
 * Flatten one parameter of the wire union into the renderer's flat definition.
 *
 * `optionLabels` is only meaningful for `enum` / `enum-list`: a `map-enum` looks its row labels up
 * through its `keySource` sibling at render time.
 */
function toParameterDefinition(
  parameter: GuardrailParameterDefinitionWire,
  label: string,
  tooltip: string | undefined,
  optionLabels: Record<string, string> | undefined
): GuardrailParameterDefinition {
  const base: GuardrailParameterDefinition = {
    id: parameter.id,
    type: parameter.type,
    label,
    required: parameter.required,
    defaultValue: parameter.defaultValue,
  };
  if (tooltip) base.tooltip = tooltip;

  switch (parameter.type) {
    case 'enum':
    case 'enum-list':
      base.options = parameter.options;
      if (optionLabels) base.optionLabels = optionLabels;
      break;
    case 'map-enum':
      base.keySource = parameter.keySource;
      // The API leaves these unset for PII entity thresholds, which would render an
      // unconstrained number input for what is a 0-to-1 confidence. These defaults are the
      // scale the backend actually validates against.
      base.min = parameter.min ?? 0;
      base.max = parameter.max ?? 1;
      base.step = parameter.step ?? 0.1;
      break;
    case 'number':
      if (parameter.min !== undefined) base.min = parameter.min;
      if (parameter.max !== undefined) base.max = parameter.max;
      if (parameter.step !== undefined) base.step = parameter.step;
      break;
    case 'text':
      if (parameter.maxLength !== undefined) base.maxLength = parameter.maxLength;
      break;
    case 'text-list':
      if (parameter.maxLength !== undefined) base.maxLength = parameter.maxLength;
      if (parameter.maxItems !== undefined) base.maxItems = parameter.maxItems;
      break;
    default:
      break;
  }

  return base;
}

/** Copy an optional wire field onto the enriched definition only when it is present. */
function assignIfPresent<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | undefined
): void {
  if (value !== undefined) target[key] = value;
}

/**
 * Enrich parsed guardrail definitions with display copy and render-ready parameters.
 *
 * Copy precedence is asymmetric between the two levels, and deliberately so, because it is what
 * both products already render:
 *
 * - **Definition level** the curated catalog wins over the wire `displayName`. Built-ins never
 *   send one, and where a tenant somehow does, the catalog is the reviewed string.
 * - **Parameter level** the wire `displayName` / `description` win over the catalog. That is the
 *   channel a BYO manifest describes its own parameters through.
 * - **Option labels** merge, manifest over curated, so a manifest can relabel a subset.
 * - **BYO definitions** take no curated copy at all, at either level, including `usageNote`.
 *
 * @param definitions - Output of `parseGuardrailDefinitions`.
 * @returns Enriched definitions in input order, minus any hidden validator.
 *
 * @example
 * const { definitions } = parseGuardrailDefinitions(body);
 * const enriched = enrichGuardrailDefinitions(definitions, {
 *   translate: (key, defaultValue) => t(key, { defaultValue }),
 *   hiddenValidators: ['prompt_injection'],
 * });
 */
export function enrichGuardrailDefinitions(
  definitions: readonly GuardrailDefinitionWire[],
  options: EnrichGuardrailDefinitionsOptions = {}
): EnrichedGuardrailDefinition[] {
  const { translate, hiddenValidators } = options;
  const hidden = hiddenValidators?.length ? new Set(hiddenValidators) : undefined;

  const enriched: EnrichedGuardrailDefinition[] = [];

  for (const definition of definitions) {
    const isByo = isByoGuardrailDefinition(definition);
    if (hidden && !isByo && hidden.has(definition.validator)) continue;

    const copy = isByo ? undefined : resolveGuardrailValidatorCopy(definition.validator, translate);

    const parameters = definition.parameters.map((parameter) => {
      const curatedOptions = copy?.optionLabels[parameter.id];
      const manifestOptions =
        parameter.type === 'enum' || parameter.type === 'enum-list'
          ? parameter.optionLabels
          : undefined;
      const optionLabels =
        curatedOptions || manifestOptions ? { ...curatedOptions, ...manifestOptions } : undefined;

      return toParameterDefinition(
        parameter,
        parameter.displayName ??
          copy?.paramLabels[parameter.id] ??
          humanizeGuardrailParameterId(parameter.id),
        parameter.description ?? copy?.paramTooltips[parameter.id],
        optionLabels
      );
    });

    const result: EnrichedGuardrailDefinition = {
      validator: definition.validator,
      displayName: copy?.displayName ?? definition.displayName ?? definition.validator,
      allowedScopes: definition.allowedScopes,
      parameters,
      status: definition.status,
    };

    assignIfPresent(result, 'description', copy?.description ?? definition.description);
    assignIfPresent(result, 'usageNote', copy?.usageNote);
    assignIfPresent(result, 'byoValidatorName', definition.byoValidatorName);
    assignIfPresent(result, 'byoConnectorName', definition.byoConnectorName);
    assignIfPresent(result, 'byoConnectorKey', definition.byoConnectorKey);
    assignIfPresent(result, 'byoGuardrailConnectionId', definition.byoGuardrailConnectionId);
    assignIfPresent(result, 'byoConfigurationId', definition.byoConfigurationId);
    assignIfPresent(result, 'folderKey', definition.folderKey);
    assignIfPresent(result, 'guardrailStages', definition.guardrailStages);
    assignIfPresent(result, 'payloadMinSizeLimit', definition.payloadMinSizeLimit);
    assignIfPresent(result, 'payloadMaxSizeLimit', definition.payloadMaxSizeLimit);
    assignIfPresent(result, 'isByogSubscription', definition.isByogSubscription);

    enriched.push(result);
  }

  return enriched;
}

/** Folder metadata for one BYO connection, as a host connection lookup returns it. */
export interface GuardrailFolderMetadata {
  folderPath?: string;
  folderKey?: string;
}

/**
 * Stitch folder metadata onto BYO definitions, keyed by `byoGuardrailConnectionId`. The API never
 * sends `folderPath`, but the palette groups BYO guardrails by it, so it has to be resolved from
 * the host's connection list and merged back in.
 *
 * Returns the input array itself when there is nothing to apply, and leaves untouched entries by
 * reference, so a host memo keyed on the result does not invalidate needlessly.
 *
 * @param folderByConnectionId - Metadata per `byoGuardrailConnectionId`. Present keys with
 *   `undefined` values are no-ops, so a partially resolved lookup is safe to pass.
 */
export function withGuardrailFolderMetadata(
  definitions: readonly EnrichedGuardrailDefinition[],
  folderByConnectionId: Readonly<Record<string, GuardrailFolderMetadata>>
): EnrichedGuardrailDefinition[] {
  if (Object.keys(folderByConnectionId).length === 0) {
    return definitions as EnrichedGuardrailDefinition[];
  }

  let changed = false;
  const next = definitions.map((definition) => {
    const connectionId = definition.byoGuardrailConnectionId;
    if (connectionId === undefined) return definition;
    const metadata = folderByConnectionId[connectionId];
    if (!metadata) return definition;

    const folderPath = metadata.folderPath ?? definition.folderPath;
    const folderKey = metadata.folderKey ?? definition.folderKey;
    if (folderPath === definition.folderPath && folderKey === definition.folderKey) {
      return definition;
    }

    changed = true;
    const merged: EnrichedGuardrailDefinition = { ...definition };
    assignIfPresent(merged, 'folderPath', folderPath);
    assignIfPresent(merged, 'folderKey', folderKey);
    return merged;
  });

  return changed ? next : (definitions as EnrichedGuardrailDefinition[]);
}
