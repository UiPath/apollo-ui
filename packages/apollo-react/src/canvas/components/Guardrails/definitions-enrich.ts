import type { GuardrailDefinition } from './builder-types';
import {
  GUARDRAIL_COPY_EN,
  type GuardrailCopyTable,
  type GuardrailValidatorCopy,
} from './definitions-copy';
import type { GuardrailDefinitionWire, GuardrailParameterDefinitionWire } from './definitions-wire';
import type { GuardrailParameterDefinition } from './types';

/**
 * Turn validated wire definitions into the display-ready shape the builder renders.
 *
 * Pure and React-free on purpose: hosts outside React (Flow's vsix bridge, node-side tests)
 * call it directly, and `useGuardrailDefinitions` is only a thin composition over it.
 */

/**
 * A `GuardrailDefinition` plus the wire fields the builder does not read but hosts do
 * (palette grouping, BYO connection notices, folder resolution). Because it extends the
 * family's display type it feeds `GuardrailBuilder` and `GuardrailValidatorForm` unchanged.
 */
export interface EnrichedGuardrailDefinition extends GuardrailDefinition {
  /** Resolved description, `''` when neither the curated table nor the wire has one. */
  description: string;
  /** Narrowed from `GuardrailDefinition`'s `ReactNode`: enrichment only ever yields text. */
  usageNote?: string;
  byoConnectorName?: string;
  byoConnectorKey?: string;
  byoGuardrailConnectionId?: string;
  byoConfigurationId?: string;
  folderPath?: string;
  folderKey?: string;
}

export interface EnrichGuardrailDefinitionsOptions {
  /**
   * Copy table to resolve curated strings from. Defaults to `GUARDRAIL_COPY_EN`; pass
   * `useGuardrailDefinitionCopy()`'s table for the active locale.
   */
  copy?: GuardrailCopyTable;
  /**
   * Non-BYO validators to drop entirely, e.g. Flow hides `prompt_injection`. Defaults to
   * none: which validators a product exposes is an entitlement decision, not a copy one.
   * BYO definitions are never hidden, since their validator id is not the product's to judge.
   */
  hiddenValidators?: readonly string[];
}

/**
 * A definition is bring-your-own exactly when it names a BYO validator. Both products
 * already use this test; it decides copy resolution, palette grouping and the BYO notices.
 */
export function isByoGuardrailDefinition<T extends { byoValidatorName?: string }>(
  definition: T
): definition is T & { byoValidatorName: string } {
  return definition.byoValidatorName !== undefined;
}

/**
 * Fallback label for a parameter no curated table names: `entityThresholds` reads as
 * "Entity thresholds". Better than surfacing the raw id, which is what a host would
 * otherwise show for a validator the UI has not learned yet.
 */
export function humanizeGuardrailParameterId(id: string): string {
  const spaced = id.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function toParameterDefinition(
  param: GuardrailParameterDefinitionWire,
  curated: GuardrailValidatorCopy | undefined
): GuardrailParameterDefinition {
  const definition: GuardrailParameterDefinition = {
    id: param.id,
    type: param.type,
    // Wire wins at parameter level: a BYO manifest and a newly shipped backend parameter
    // both describe themselves, and only they know their own copy.
    label:
      param.displayName ?? curated?.paramLabels[param.id] ?? humanizeGuardrailParameterId(param.id),
    required: param.required,
    defaultValue: param.defaultValue,
  };

  const tooltip = param.description ?? curated?.paramTooltips?.[param.id];
  if (tooltip !== undefined) definition.tooltip = tooltip;

  const curatedOptionLabels = curated?.optionLabels?.[param.id];
  const wireOptionLabels =
    param.type === 'enum' || param.type === 'enum-list' ? param.optionLabels : undefined;
  if (curatedOptionLabels !== undefined || wireOptionLabels !== undefined) {
    // Merged, wire last: a manifest may relabel a subset of options without restating the
    // rest. Options nobody labelled are deliberately absent, since the editors already fall
    // back to the raw wire value.
    definition.optionLabels = { ...curatedOptionLabels, ...wireOptionLabels };
  }

  switch (param.type) {
    case 'enum':
    case 'enum-list':
      definition.options = param.options;
      break;
    case 'map-enum':
      definition.keySource = param.keySource;
      // The threshold maps arrive without bounds from some backends, and an unbounded
      // numeric editor for a 0..1 confidence score is a data-entry hazard.
      //
      // The 0..1 step 0.1 default is a **product assumption**, not a wire fact: it is PII
      // detection's confidence range, and it is the only unbounded map the backend sends
      // today. Harmful content is 0..6 step 2 and arrives with its bounds, so nothing is
      // silently mislabelled. This holds only while these numbers stay editor hints:
      // `buildFieldValidation` and `getOutOfRangeParameterIds` both look at `number`
      // parameters only, so a map-enum is never rejected against them (pinned by a test in
      // `definitions-enrich.test.ts`). Before widening either to map-enum, replace this
      // default with something the backend states.
      definition.min = param.min ?? 0;
      definition.max = param.max ?? 1;
      definition.step = param.step ?? 0.1;
      break;
    case 'number':
      if (param.min != null) definition.min = param.min;
      if (param.max != null) definition.max = param.max;
      if (param.step != null) definition.step = param.step;
      break;
    case 'text':
      if (param.maxLength != null) definition.maxLength = param.maxLength;
      break;
    case 'text-list':
      if (param.maxLength != null) definition.maxLength = param.maxLength;
      if (param.maxItems != null) definition.maxItems = param.maxItems;
      break;
    default:
      break;
  }

  return definition;
}

function enrichOne(
  wire: GuardrailDefinitionWire,
  copy: GuardrailCopyTable
): EnrichedGuardrailDefinition {
  const isByo = isByoGuardrailDefinition(wire);
  // A BYO guardrail gets zero curated copy at every level: its validator id is the
  // customer's, and a collision with a UiPath id must not borrow UiPath's wording.
  const curated = isByo ? undefined : copy[wire.validator];

  const enriched: EnrichedGuardrailDefinition = {
    validator: wire.validator,
    // Curated wins at definition level for non-BYO: the backend ships terse internal names
    // and this table is what product and localization actually review.
    displayName:
      (isByo ? wire.displayName : (curated?.displayName ?? wire.displayName)) ?? wire.validator,
    description: (isByo ? wire.description : (curated?.description ?? wire.description)) ?? '',
    allowedScopes: wire.allowedScopes,
    parameters: wire.parameters.map((param) => toParameterDefinition(param, curated)),
    status: wire.status,
  };

  if (curated?.usageNote !== undefined) enriched.usageNote = curated.usageNote;
  if (wire.byoValidatorName !== undefined) enriched.byoValidatorName = wire.byoValidatorName;
  if (wire.byoConnectorName !== undefined) enriched.byoConnectorName = wire.byoConnectorName;
  if (wire.byoConnectorKey !== undefined) enriched.byoConnectorKey = wire.byoConnectorKey;
  if (wire.byoGuardrailConnectionId !== undefined) {
    enriched.byoGuardrailConnectionId = wire.byoGuardrailConnectionId;
  }
  if (wire.byoConfigurationId !== undefined) enriched.byoConfigurationId = wire.byoConfigurationId;
  if (wire.folderPath !== undefined) enriched.folderPath = wire.folderPath;
  if (wire.folderKey !== undefined) enriched.folderKey = wire.folderKey;

  return enriched;
}

/**
 * Resolve display copy onto validated wire definitions, in payload order.
 *
 * Copy precedence, re-derived from what both products do today:
 *
 * | level | non-BYO | BYO |
 * | --- | --- | --- |
 * | display name | curated, wire, `validator` | wire, `validator` |
 * | description | curated, wire, `''` | wire, `''` |
 * | usage note | curated only | none |
 * | parameter label | **wire**, curated, humanized id | wire, humanized id |
 * | parameter tooltip | **wire**, curated | wire |
 * | option labels | curated merged under wire | wire only |
 */
export function enrichGuardrailDefinitions(
  definitions: readonly GuardrailDefinitionWire[],
  options: EnrichGuardrailDefinitionsOptions = {}
): EnrichedGuardrailDefinition[] {
  const copy = options.copy ?? GUARDRAIL_COPY_EN;
  const hidden = new Set(options.hiddenValidators ?? []);
  const result: EnrichedGuardrailDefinition[] = [];
  for (const wire of definitions) {
    if (!isByoGuardrailDefinition(wire) && hidden.has(wire.validator)) continue;
    result.push(enrichOne(wire, copy));
  }
  return result;
}

/** Folder placement for one BYO guardrail connection. */
export interface GuardrailFolderMetadata {
  folderPath?: string;
  folderKey?: string;
}

/**
 * Stamp folder placement onto BYO definitions from a host lookup.
 *
 * Resolution stays host-side because it needs each product's connections API, which this
 * package deliberately does not reach for: Agents pages `fetchResources`, Flow calls
 * `getConnectionById`. Definitions without a connection id, and connections the host cannot
 * resolve, pass through untouched rather than being dropped.
 */
export function withGuardrailFolderMetadata<T extends EnrichedGuardrailDefinition>(
  definitions: readonly T[],
  resolve: (connectionId: string) => GuardrailFolderMetadata | undefined
): T[] {
  return definitions.map((definition) => {
    const connectionId = definition.byoGuardrailConnectionId;
    if (connectionId === undefined) return definition;
    const metadata = resolve(connectionId);
    if (metadata === undefined) return definition;
    const next: T = { ...definition };
    if (metadata.folderPath !== undefined) next.folderPath = metadata.folderPath;
    if (metadata.folderKey !== undefined) next.folderKey = metadata.folderKey;
    return next;
  });
}
