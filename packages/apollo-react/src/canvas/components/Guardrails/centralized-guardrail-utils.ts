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

/** The identity fields the display and matching helpers read. */
export type CentralizedGuardrailIdentity = Pick<
  CentralizedGuardrail,
  'validator' | 'name' | 'isByo'
>;

/** The guardrails a policy applies to one kind of agent. */
export function getApplicableCentralizedGuardrails<T extends CentralizedGuardrail>(
  guardrails: readonly T[],
  { isConversational }: { isConversational?: boolean }
): T[] {
  return guardrails.filter((guardrail) =>
    isConversational ? guardrail.appliesToConversationalAgents : guardrail.appliesToAutonomousAgents
  );
}

/** Row key: `validator` alone repeats across execution stages and BYO configurations. */
export function getCentralizedGuardrailItemId(guardrail: CentralizedGuardrail): string {
  // A tuple, not a joined string: free wire text in any field could run into the next.
  return JSON.stringify([
    guardrail.validator,
    guardrail.executionStage,
    guardrail.isByo ? (guardrail.name ?? null) : false,
  ]);
}

/** Matched on name and validator, so a same-named configuration of another validator misses. */
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

/** A built-in's definition, used only to label its configuration rows. */
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

/** Whether a BYO configuration is gone. `undefined` definitions (still loading) report `false`. */
export function isCentralizedGuardrailConfigMissing(
  guardrail: CentralizedGuardrailIdentity,
  definitions: readonly CentralizedGuardrailDefinition[] | undefined
): boolean {
  if (!guardrail.isByo || definitions === undefined) return false;
  return findCentralizedByoDefinition(guardrail, definitions) === undefined;
}

/**
 * A BYO guardrail never borrows curated copy, since its connector may reuse a built-in's
 * validator id; a built-in's comes from the curated table, as the tenant may have no definition.
 */
export function getCentralizedGuardrailDisplay(
  guardrail: CentralizedGuardrailIdentity,
  {
    definition,
    copy,
  }: { definition?: CentralizedGuardrailDefinition; copy?: GuardrailCopyTable } = {}
): { name: string; description?: string } {
  const curated = guardrail.isByo ? undefined : copy?.[guardrail.validator];
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

/** Lifts a built-in's `entities` / `entityThresholds` onto the parameter shape. */
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
    parameters.push({ id: entitiesId, value: guardrail.entities });
  }
  if (guardrail.entityThresholds != null) {
    parameters.push({ id: thresholdsId, value: guardrail.entityThresholds });
  }

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
 * A centralized guardrail's configuration as display rows, for either origin. A plain object is
 * a threshold table and anything else a value, whatever the unvalidated `parameterType` says.
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
  const definitionsById = new Map(
    definitions.map((parameterDefinition) => [parameterDefinition.id, parameterDefinition])
  );

  const rendersAsThresholds = (id: string): boolean => isPlainObject(valuesById.get(id));

  // Own properties only, as in `definitions-enrich.ts`: `option` is wire data, and a bare
  // lookup of `constructor` or `__proto__` returns something React cannot render.
  const optionLabel = (
    parameterDefinition: CentralizedGuardrailParameterDefinition | undefined,
    option: string
  ): string => {
    const optionLabels = parameterDefinition?.optionLabels;
    const label =
      optionLabels !== undefined && Object.hasOwn(optionLabels, option)
        ? optionLabels[option]
        : undefined;
    return typeof label === 'string' ? label : option;
  };

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

  // A threshold map absorbs its `keySource` list, but only when it has a value to render.
  const consumedIds = new Set<string>();
  for (const parameterDefinition of definitions) {
    if (
      parameterDefinition.keySource !== undefined &&
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
        value: Object.hasOwn(thresholds, key) ? thresholds[key] : undefined,
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

  // Declared order first, then values with no definition, so nothing persisted is hidden.
  const orderedIds = Array.from(
    new Set([
      ...definitions.map((parameterDefinition) => parameterDefinition.id),
      ...parameters.map((parameter) => parameter.id),
    ])
  );

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

/** Localized execution-stage label; an unknown stage renders raw. */
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

/** Localized scope label. */
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

/** Localized action label. */
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
