import { z } from 'zod';
import type {
  GuardrailDefinitionParseIssue,
  GuardrailDefinitionsParseResult,
  GuardrailDefinitionWire,
} from './definitions-wire';

/**
 * The only module in the guardrails family that imports zod (asserted by a source-level guard in
 * `definitions-parse.test.ts`). Every schema below is private and none of them reach the public
 * type surface: hosts sit on different zod majors, so a leaked schema object or a
 * `z.infer<typeof …>` export would make this package's types unusable in one of them.
 *
 * It also exports exactly one runtime symbol, `parseGuardrailDefinitions`, likewise asserted.
 */

/**
 * Absent-or-null optional number, normalized to `undefined`. `.optional()` is outermost for the
 * same reason as `emptyToUndefined` below: it is what keeps the inferred key optional.
 */
const optionalNumber = z
  .number()
  .nullable()
  .transform((value) => value ?? undefined)
  .optional();

/**
 * Optional display string treating the empty string as absent. `.optional()` must wrap the
 * transform rather than the reverse: under zod v4 an outer transform makes the inferred key
 * required with a `string | undefined` value, which then fails the wire-type assertion below.
 */
const emptyToUndefined = z
  .string()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const parameterDisplayFields = {
  displayName: emptyToUndefined,
  description: emptyToUndefined,
};

const parameterIdentity = {
  id: z.string().min(1),
  required: z.boolean(),
};

const optionLabelsField = z.record(z.string(), z.string()).optional();

const numberParameterSchema = z.object({
  ...parameterDisplayFields,
  ...parameterIdentity,
  type: z.literal('number'),
  defaultValue: z.number(),
  min: optionalNumber,
  max: optionalNumber,
  step: optionalNumber,
});

const textParameterSchema = z.object({
  ...parameterDisplayFields,
  ...parameterIdentity,
  type: z.literal('text'),
  // Agents accepts a missing `defaultValue` here, Flow requires the key but accepts `null`.
  // Normalize to always-present and never-null: the editors need a concrete seed value, and this
  // stops Flow rejecting definitions that Agents renders happily today.
  defaultValue: z
    .string()
    .nullish()
    .transform((value) => value ?? ''),
  maxLength: optionalNumber,
});

const booleanParameterSchema = z.object({
  ...parameterDisplayFields,
  ...parameterIdentity,
  type: z.literal('boolean'),
  defaultValue: z.boolean(),
});

const enumParameterSchema = z.object({
  ...parameterDisplayFields,
  ...parameterIdentity,
  type: z.literal('enum'),
  // Same normalization as `text`. The built-in judge-model parameter ships an empty default with
  // no options, which is the signal for a host `renderParameter` override to take it over.
  defaultValue: z
    .string()
    .nullish()
    .transform((value) => value ?? ''),
  options: z.array(z.string()),
  optionLabels: optionLabelsField,
});

const enumListParameterSchema = z.object({
  ...parameterDisplayFields,
  ...parameterIdentity,
  type: z.literal('enum-list'),
  defaultValue: z.array(z.string()),
  options: z.array(z.string()),
  optionLabels: optionLabelsField,
});

const textListParameterSchema = z.object({
  ...parameterDisplayFields,
  ...parameterIdentity,
  type: z.literal('text-list'),
  // Absent entirely from Agents' schema today, so Agents gains text-list defaults here.
  defaultValue: z
    .array(z.string())
    .nullish()
    .transform((value) => value ?? []),
  maxItems: optionalNumber,
  maxLength: optionalNumber,
});

const mapEnumParameterSchema = z.object({
  ...parameterDisplayFields,
  ...parameterIdentity,
  type: z.literal('map-enum'),
  defaultValue: z.record(z.string(), z.number()),
  keySource: z.string().min(1),
  min: optionalNumber,
  max: optionalNumber,
  step: optionalNumber,
});

const parameterSchema = z.discriminatedUnion('type', [
  numberParameterSchema,
  textParameterSchema,
  booleanParameterSchema,
  enumParameterSchema,
  enumListParameterSchema,
  textListParameterSchema,
  mapEnumParameterSchema,
]);

const scopeSchema = z.enum(['Agent', 'Llm', 'Tool']);
const statusSchema = z.enum(['Available', 'FeatureDisabled', 'Unauthorised', 'Disabled']);

const definitionSchema = z.object({
  validator: z.string().min(1),
  allowedScopes: z.array(scopeSchema).min(1),
  parameters: z.array(parameterSchema).default([]),
  status: statusSchema,
  displayName: emptyToUndefined,
  description: emptyToUndefined,
  // An empty string here would silently flip the BYO check and the definition matching that
  // depends on it, so both are rejected rather than emptied.
  byoValidatorName: z.string().min(1).optional(),
  byoGuardrailConnectionId: z.string().min(1).optional(),
  byoConnectorName: emptyToUndefined,
  byoConnectorKey: emptyToUndefined,
  byoConfigurationId: emptyToUndefined,
  folderKey: emptyToUndefined,
  // Preserved rather than dropped (both products discard these today). Stage values stay
  // unvalidated strings so that a new backend stage cannot reject an otherwise-valid definition.
  guardrailStages: z.record(z.string(), z.array(z.string())).optional(),
  payloadMinSizeLimit: optionalNumber,
  payloadMaxSizeLimit: optionalNumber,
  isByogSubscription: z.boolean().optional(),
});

/**
 * Compile-time seal on the hand-written wire types: the schema's output and
 * `GuardrailDefinitionWire` must be assignable in both directions, so the two cannot drift.
 * Bidirectional assignability cannot catch an extra *optional* property on either side, so
 * `definitions-parse.test.ts` also asserts that the two key sets match at runtime.
 *
 * Kept unexported deliberately. TypeScript omits an unexported type alias from the emitted
 * declaration file, which is what keeps `import { z } from 'zod'` out of
 * `definitions-parse.d.ts`. That matters because the barrel re-exports
 * `parseGuardrailDefinitions` from this module, so a host's compiler pulls this module's
 * declarations into its program: an exported assertion would put a zod reference back on the
 * path the seal exists to keep clear.
 */
type AssertAssignableTo<A extends B, B> = A;

/** The schema's output, asserted assignable to the public wire type. */
type ParsedDefinition = AssertAssignableTo<
  z.output<typeof definitionSchema>,
  GuardrailDefinitionWire
>;

/** The public wire type, asserted assignable back to the schema's output. */
type WireDefinition = AssertAssignableTo<
  GuardrailDefinitionWire,
  z.output<typeof definitionSchema>
>;

/**
 * Drop keys whose value is `undefined`.
 *
 * The `null`-and-empty-string normalizations above are transforms under an `.optional()`, and zod
 * only omits a key that was absent from the *input*: a present `"displayName": ""` comes back as
 * a present key holding `undefined`. Pruning makes the parsed shape mean what it says, so
 * `'folderKey' in definition` and `Object.keys(definition)` tell a caller the truth.
 */
function pruneUndefined<T extends object>(value: T): T {
  const pruned: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry !== undefined) pruned[key] = entry;
  }
  return pruned as T;
}

function normalize(definition: ParsedDefinition): WireDefinition {
  const pruned = pruneUndefined(definition);
  pruned.parameters = pruned.parameters.map(pruneUndefined);
  return pruned;
}

function toIssues(error: z.ZodError): GuardrailDefinitionParseIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map((segment) => String(segment)).join('.'),
    message: issue.message,
  }));
}

/** Best-effort validator id from an input that failed to parse, for diagnostics only. */
function readValidatorId(candidate: unknown): string | undefined {
  if (typeof candidate !== 'object' || candidate === null) return undefined;
  const validator = (candidate as { validator?: unknown }).validator;
  return typeof validator === 'string' && validator.length > 0 ? validator : undefined;
}

/**
 * Parse a guardrail definitions API response.
 *
 * Never throws, and never rejects the whole response over one bad entry: each definition is
 * parsed independently, valid ones are returned in input order, and each dropped one is reported
 * in `invalid` with its index, its best-effort validator id and its issues. Callers own the
 * reaction (logging, telemetry, an empty state) and own their transport.
 *
 * A definition with one bad parameter is dropped whole, matching what both products do today: a
 * partially parsed definition would render a form that cannot be saved.
 *
 * @param input - The raw decoded response body. Takes `unknown` rather than `unknown[]` so the
 *   non-array guard that every host call site duplicates lives here instead.
 *
 * @example
 * const { definitions, invalid } = parseGuardrailDefinitions(await response.json());
 * if (invalid.length > 0) logger.warn('guardrail definitions dropped', invalid);
 * const enriched = enrichGuardrailDefinitions(definitions, { translate });
 */
export function parseGuardrailDefinitions(input: unknown): GuardrailDefinitionsParseResult {
  if (!Array.isArray(input)) {
    return { definitions: [], invalid: [], inputError: 'not-an-array' };
  }

  const definitions: WireDefinition[] = [];
  const invalid: GuardrailDefinitionsParseResult['invalid'] = [];

  input.forEach((candidate, index) => {
    const result = definitionSchema.safeParse(candidate);
    if (result.success) {
      definitions.push(normalize(result.data));
      return;
    }
    const validator = readValidatorId(candidate);
    invalid.push({
      index,
      ...(validator === undefined ? {} : { validator }),
      issues: toIssues(result.error),
    });
  });

  return { definitions, invalid };
}
