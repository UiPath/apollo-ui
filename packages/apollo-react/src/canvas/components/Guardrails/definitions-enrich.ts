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
 * Pure and React-free on purpose: non-React hosts (Flow's vsix bridge) call it directly.
 */

/**
 * A `GuardrailDefinition` plus the wire fields the builder does not read but hosts do
 * (palette grouping, BYO notices, folder resolution). It extends the family's display type,
 * so it feeds `GuardrailBuilder` unchanged.
 */
export interface EnrichedGuardrailDefinition extends GuardrailDefinition {
  /** Resolved description, `''` when neither the curated table nor the wire has one. */
  description: string;
  /** Narrowed from `GuardrailDefinition`'s `ReactNode`: enrichment only yields text. */
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
   * Non-BYO validators to drop entirely, e.g. Flow hides `prompt_injection`. Defaults to none:
   * which validators a product exposes is an entitlement decision, not a copy one. BYO is never
   * hidden, since its validator id is not the product's to judge.
   */
  hiddenValidators?: readonly string[];
}

/** Both products already use this test; it decides copy resolution and palette grouping. */
export function isByoGuardrailDefinition<T extends { byoValidatorName?: string }>(
  definition: T
): definition is T & { byoValidatorName: string } {
  return definition.byoValidatorName !== undefined;
}

/**
 * Fallback label for a parameter no curated table names: `entityThresholds` reads as "Entity
 * thresholds". Acronym runs stay whole (`URLAllowList` -> "URL allow list"); splitting on every
 * capital would read worse than the raw id this exists to improve on.
 */
export function humanizeGuardrailParameterId(id: string): string {
  // A linear scan, not a regex: every concise pattern for this needs an ambiguous repetition
  // (`[A-Z]+` plus a lookahead) that backtracks quadratically on a long run of capitals, and
  // the id arrives over the wire. CodeQL flags those as js/polynomial-redos.
  const words: string[] = [];
  let word = '';
  // Whether `word` is still an unbroken run of capitals, so `URLAllow` can hand its last
  // capital to the next word and keep `URL` whole.
  let allCaps = true;

  const flush = () => {
    if (word !== '') words.push(word);
    word = '';
    allCaps = true;
  };

  for (const char of id) {
    const isUpper = char >= 'A' && char <= 'Z';
    const isWordChar = isUpper || (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9');
    if (!isWordChar) {
      flush();
    } else if (isUpper) {
      if (!allCaps) flush();
      word += char;
    } else {
      if (allCaps && word.length > 1) {
        const carried = word.slice(-1);
        word = word.slice(0, -1);
        flush();
        word = carried;
      }
      allCaps = false;
      word += char;
    }
  }
  flush();

  if (words.length === 0) return id;
  const spaced = words
    .map((entry) =>
      entry.length > 1 && entry === entry.toUpperCase() ? entry : entry.toLowerCase()
    )
    .join(' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function toParameterDefinition(
  param: GuardrailParameterDefinitionWire,
  curated: GuardrailValidatorCopy | undefined
): GuardrailParameterDefinition {
  const definition: GuardrailParameterDefinition = {
    id: param.id,
    type: param.type,
    // Wire wins at parameter level: a BYO manifest and a newly shipped backend parameter
    // describe themselves, and only they know their own copy.
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
    // Wire last: a manifest may relabel a subset without restating the rest. Options nobody
    // labelled stay absent; the editors fall back to the raw wire value.
    definition.optionLabels = { ...curatedOptionLabels, ...wireOptionLabels };
  }

  switch (param.type) {
    case 'enum':
    case 'enum-list':
      definition.options = param.options;
      break;
    case 'map-enum':
      definition.keySource = param.keySource;
      // Bounds only when the backend states them: `getOutOfRangeParameterIds` range-checks
      // map rows and hosts gate Save on it, so an invented bound would reject a threshold on
      // a scale nobody published. `step` stays a hint (nothing enforces it) but is defaulted,
      // or the row spinners step by 1 through a 0..1 score.
      if (param.min != null) definition.min = param.min;
      if (param.max != null) definition.max = param.max;
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
  // Zero curated copy at every level for BYO: the validator id is the customer's, and a
  // collision with a UiPath id must not borrow UiPath's wording.
  //
  // `Object.hasOwn` rather than a bare lookup: `validator` is an arbitrary wire string, so
  // `copy['toString']` would return a prototype member the table never declared. Its
  // `paramLabels` is then undefined and the first parameter lookup throws, taking a whole
  // panel down over one definition.
  const curated = isByo || !Object.hasOwn(copy, wire.validator) ? undefined : copy[wire.validator];

  const enriched: EnrichedGuardrailDefinition = {
    validator: wire.validator,
    // Curated wins at definition level: the backend ships terse internal names, and this
    // table is what product and localization review.
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
 * Copy precedence:
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
 * Stamp folder placement onto BYO definitions from a host lookup. Resolution stays host-side
 * because it needs each product's connections API (Agents pages `fetchResources`, Flow calls
 * `getConnectionById`). Anything unresolvable passes through untouched rather than dropped.
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
