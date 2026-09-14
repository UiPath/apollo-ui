import type { GuardrailScope } from './builder-types';
import type {
  CentralizedGuardrail,
  CentralizedGuardrailActionType,
  CentralizedGuardrailDefinition,
  CentralizedGuardrailParameter,
  CentralizedGuardrailParameterDefinition,
  CentralizedGuardrailParameterRow,
} from './centralized-types';
import type { GuardrailCopyTable } from './definitions-copy';
import type { CentralizedGuardrailsLabels } from './i18n';

/**
 * Pure helpers behind `CentralizedGuardrailsSection` and `CentralizedGuardrailDetails`.
 * React-free, so a host can run the same filtering and matching outside a render (both
 * products decide elsewhere whether the section appears at all).
 */

/** The identity fields the display and matching helpers read. */
export type CentralizedGuardrailIdentity = Pick<
  CentralizedGuardrail,
  'validator' | 'name' | 'isByo'
>;

/**
 * The guardrails a policy applies to one kind of agent. Exported rather than taken as a prop
 * on the section: the host filters and the component renders (the `GuardrailList` rule), and
 * both products already run exactly this predicate.
 */
export function getApplicableCentralizedGuardrails<T extends CentralizedGuardrail>(
  guardrails: readonly T[],
  { isConversational }: { isConversational?: boolean }
): T[] {
  return guardrails.filter((guardrail) =>
    isConversational ? guardrail.appliesToConversationalAgents : guardrail.appliesToAutonomousAgents
  );
}

/**
 * Stable row key. `validator` alone is not unique (a policy can enforce the same validator at
 * two execution stages, and a BYO configuration can reuse a built-in's validator id), so the
 * key is validator + stage + the BYO configuration's name. An index would be unique too, but
 * it changes under every policy edit, which throws away React's row identity.
 */
export function getCentralizedGuardrailItemId(guardrail: CentralizedGuardrail): string {
  const origin = guardrail.isByo ? (guardrail.name ?? 'byo') : 'builtin';
  return `${guardrail.validator}-${guardrail.executionStage}-${origin}`;
}

/**
 * The BYO definition describing this guardrail's configuration. Matched on the admin-given
 * name (unique per tenant) **and** the validator id, so a stale policy row pointing at a
 * same-named configuration for another validator does not match. Both products already match
 * exactly this way.
 */
export function findCentralizedByoDefinition<T extends CentralizedGuardrailDefinition>(
  guardrail: CentralizedGuardrailIdentity,
  definitions: readonly T[] | undefined
): T | undefined {
  if (!guardrail.isByo || guardrail.name == null) return undefined;
  return definitions?.find(
    (definition) =>
      definition.byoValidatorName === guardrail.name && definition.validator === guardrail.validator
  );
}

/**
 * The built-in definition describing this guardrail, used only to label its configuration
 * (which parameter is the entity list, which the thresholds, and what the entities are
 * called). Neither product looks this up today, so an absent definition falls back to exactly
 * what they render.
 */
export function findCentralizedBuiltInDefinition<T extends CentralizedGuardrailDefinition>(
  guardrail: CentralizedGuardrailIdentity,
  definitions: readonly T[] | undefined
): T | undefined {
  if (guardrail.isByo) return undefined;
  return definitions?.find(
    (definition) =>
      definition.validator === guardrail.validator && definition.byoValidatorName === undefined
  );
}

/**
 * Whether a BYO guardrail's configuration has gone missing from the tenant's catalog.
 *
 * Only answerable once the definitions have loaded: `undefined` means "cannot tell yet" and
 * reports `false`, so a row never claims a configuration was deleted while the catalog is
 * still in flight. That distinction is why `definitions` is optional rather than defaulted.
 */
export function isCentralizedGuardrailConfigMissing(
  guardrail: CentralizedGuardrailIdentity,
  definitions: readonly CentralizedGuardrailDefinition[] | undefined
): boolean {
  if (!guardrail.isByo || definitions === undefined) return false;
  return findCentralizedByoDefinition(guardrail, definitions) === undefined;
}

/**
 * Display name and description.
 *
 * A BYO description comes from the connector definition and never from the curated table: a
 * connector may expose a validator id a built-in also uses (`pii_detection`), and the curated
 * description would then describe the wrong thing. A built-in's comes from the curated table
 * and never from the definitions array, because a policy can enforce a validator this tenant
 * is not entitled to and therefore has no definition for.
 */
export function getCentralizedGuardrailDisplay(
  guardrail: CentralizedGuardrailIdentity,
  {
    definition,
    copy,
  }: { definition?: CentralizedGuardrailDefinition; copy?: GuardrailCopyTable } = {}
): { name: string; description?: string } {
  const curated = copy?.[guardrail.validator];
  const description = guardrail.isByo ? definition?.description : curated?.description;
  return {
    name: guardrail.name ?? curated?.displayName ?? guardrail.validator,
    description: description === undefined || description === '' ? undefined : description,
  };
}

/** Labels the parameter resolver needs when neither a definition nor the value supplies one. */
export interface CentralizedParameterFallbackLabels {
  enabled: string;
  disabled: string;
  entities: string;
  thresholds: string;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const asNumberRecord = (value: unknown): Record<string, number> =>
  isPlainObject(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          (entry): entry is [string, number] => typeof entry[1] === 'number'
        )
      )
    : {};

/**
 * A built-in guardrail states its configuration as two fixed policy fields rather than as
 * parameters, so they are lifted onto the parameter shape and rendered by the one resolver
 * below. The ids come from the matching definition when there is one, which is what labels
 * the rows "Content categories" / "Severity thresholds" instead of generically, and are
 * synthesized alongside fallback definitions when there is not.
 */
function liftBuiltInConfiguration(
  guardrail: CentralizedGuardrail,
  definition: CentralizedGuardrailDefinition | undefined,
  labels: CentralizedParameterFallbackLabels
): {
  parameters: CentralizedGuardrailParameter[];
  definitions: CentralizedGuardrailParameterDefinition[];
} {
  const declared = definition?.parameters ?? [];
  const thresholdsDefinition = declared.find((parameter) => parameter.type === 'map-enum');
  const entitiesDefinition = thresholdsDefinition?.keySource
    ? declared.find((parameter) => parameter.id === thresholdsDefinition.keySource)
    : declared.find((parameter) => parameter.type === 'enum-list');

  const entitiesId = entitiesDefinition?.id ?? 'entities';
  const thresholdsId = thresholdsDefinition?.id ?? 'entityThresholds';

  const parameters: CentralizedGuardrailParameter[] = [];
  if (guardrail.entities != null) {
    parameters.push({ id: entitiesId, parameterType: 'enum-list', value: guardrail.entities });
  }
  if (guardrail.entityThresholds != null) {
    parameters.push({
      id: thresholdsId,
      parameterType: 'map-enum',
      value: guardrail.entityThresholds,
    });
  }

  // Keep the declared definitions where they exist: they carry the entity option labels, so
  // the read-only view names an entity the way the guardrail editor names it.
  const definitions: CentralizedGuardrailParameterDefinition[] =
    declared.length > 0
      ? declared
      : [
          { id: entitiesId, type: 'enum-list', label: labels.entities },
          { id: thresholdsId, type: 'map-enum', label: labels.thresholds, keySource: entitiesId },
        ];

  return { parameters, definitions };
}

/**
 * Resolve a centralized guardrail's configuration into display rows.
 *
 * One resolver for both origins. A BYO guardrail states its configuration as connector
 * parameters and a built-in as `entities` / `entityThresholds`; both products render those
 * through two separate code paths, and lifting the built-in fields onto the parameter shape
 * collapses them into one with no behaviour change.
 *
 * Driven by each value's own shape rather than by `parameterType`, which is an unvalidated
 * wire string: any plain object renders as a threshold table, so an unrecognized spelling
 * cannot stringify a map into "[object Object]".
 */
export function resolveCentralizedGuardrailParameters(
  guardrail: CentralizedGuardrail,
  {
    definition,
    labels,
  }: { definition?: CentralizedGuardrailDefinition; labels: CentralizedParameterFallbackLabels }
): CentralizedGuardrailParameterRow[] {
  const { parameters, definitions } = guardrail.isByo
    ? { parameters: guardrail.parameters ?? [], definitions: definition?.parameters ?? [] }
    : liftBuiltInConfiguration(guardrail, definition, labels);

  const valuesById = new Map(parameters.map((parameter) => [parameter.id, parameter.value]));
  const typesById = new Map(
    parameters.map((parameter) => [parameter.id, parameter.parameterType ?? undefined])
  );
  const definitionsById = new Map(
    definitions.map((parameterDefinition) => [parameterDefinition.id, parameterDefinition])
  );

  const rendersAsThresholds = (id: string): boolean =>
    definitionsById.get(id)?.type === 'map-enum' ||
    typesById.get(id) === 'map-enum' ||
    isPlainObject(valuesById.get(id));

  const optionLabel = (
    parameterDefinition: CentralizedGuardrailParameterDefinition | undefined,
    option: string
  ): string => parameterDefinition?.optionLabels?.[option] ?? option;

  const formatValue = (
    parameterDefinition: CentralizedGuardrailParameterDefinition | undefined,
    value: unknown
  ): string => {
    if (typeof value === 'boolean') return value ? labels.enabled : labels.disabled;
    if (Array.isArray(value)) {
      return asStringArray(value)
        .map((item) => optionLabel(parameterDefinition, item))
        .join(', ');
    }
    if (value === null || value === undefined) return '';
    return typeof value === 'string' ? optionLabel(parameterDefinition, value) : String(value);
  };

  // A threshold map absorbs its `keySource` list into its own key column, but only when it
  // has a value to render, else a configured key list with an unset map would vanish.
  const consumedIds = new Set<string>();
  for (const parameterDefinition of definitions) {
    if (
      parameterDefinition.keySource !== undefined &&
      valuesById.has(parameterDefinition.id) &&
      rendersAsThresholds(parameterDefinition.id)
    ) {
      consumedIds.add(parameterDefinition.keySource);
    }
  }

  const toThresholdRow = (
    id: string,
    parameterDefinition: CentralizedGuardrailParameterDefinition | undefined
  ): CentralizedGuardrailParameterRow | undefined => {
    const thresholds = asNumberRecord(valuesById.get(id));
    const keySourceDefinition =
      parameterDefinition?.keySource !== undefined
        ? definitionsById.get(parameterDefinition.keySource)
        : undefined;
    const keySourceList =
      keySourceDefinition?.type === 'enum-list' ? keySourceDefinition : undefined;
    const selectedKeys = keySourceList ? asStringArray(valuesById.get(keySourceList.id)) : [];
    const keys = Array.from(new Set([...Object.keys(thresholds), ...selectedKeys]));
    if (keys.length === 0) return undefined;

    return {
      id,
      kind: 'thresholds',
      label: parameterDefinition?.label ?? labels.thresholds,
      thresholds: keys.map((key) => ({
        key,
        label: optionLabel(keySourceList, key),
        value: thresholds[key],
      })),
    };
  };

  const toValueRow = (
    id: string,
    parameterDefinition: CentralizedGuardrailParameterDefinition | undefined
  ): CentralizedGuardrailParameterRow | undefined => {
    const value = formatValue(parameterDefinition, valuesById.get(id));
    if (value === '') return undefined;
    return { id, kind: 'value', label: parameterDefinition?.label ?? id, value };
  };

  // The declared order first, then any configured value with no matching definition, so a
  // connector whose definitions are unavailable still shows everything it persisted.
  const orderedIds = [
    ...definitions.map((parameterDefinition) => parameterDefinition.id),
    ...parameters.map((parameter) => parameter.id).filter((id) => !definitionsById.has(id)),
  ];

  return orderedIds
    .filter((id) => !consumedIds.has(id) && valuesById.has(id))
    .map((id) => {
      const parameterDefinition = definitionsById.get(id);
      return rendersAsThresholds(id)
        ? toThresholdRow(id, parameterDefinition)
        : toValueRow(id, parameterDefinition);
    })
    .filter((row): row is CentralizedGuardrailParameterRow => row !== undefined);
}
/**
 * Localized execution-stage label, falling back to the raw wire value. The stage is typed
 * open in both products' schemas, so an unknown one must still render as something.
 */
export function formatCentralizedExecutionStage(
  executionStage: string,
  labels: CentralizedGuardrailsLabels
): string {
  switch (executionStage) {
    case 'Pre':
      return labels.stagePre;
    case 'Post':
      return labels.stagePost;
    case 'Both':
      return labels.stageBoth;
    default:
      return executionStage;
  }
}

/**
 * Localized scope label. Defaulted rather than left to a `formatScope` prop: the family
 * already owns these three strings with exactly the wording both products use, so defaulting
 * removes the one prop an adapter can forget for a visible regression ("Llm" for "LLM calls").
 */
export function formatCentralizedScope(
  scope: GuardrailScope,
  labels: CentralizedGuardrailsLabels
): string {
  switch (scope) {
    case 'Agent':
      return labels.scopeAgent;
    case 'Llm':
      return labels.scopeLlm;
    case 'Tool':
      return labels.scopeTool;
    default:
      return scope;
  }
}

/** Localized action label. Both products close this set to the same four values. */
export function formatCentralizedAction(
  action: CentralizedGuardrailActionType,
  labels: CentralizedGuardrailsLabels
): string {
  switch (action) {
    case 'block':
      return labels.actionBlock;
    case 'escalate':
      return labels.actionEscalate;
    case 'filter':
      return labels.actionFilter;
    case 'log':
      return labels.actionLog;
    default:
      return action;
  }
}
