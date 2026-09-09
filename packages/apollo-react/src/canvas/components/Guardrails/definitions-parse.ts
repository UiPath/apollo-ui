import { z } from 'zod';
import type { GuardrailDefinitionWire } from './definitions-wire';

/**
 * Runtime validation for the guardrail definitions payload.
 *
 * zod is private to this module. Everything exported is annotated with the hand-written
 * types from `definitions-wire.ts`, so the emitted declarations for this folder carry no
 * schema types and consumers never take a zod dependency (asserted by the source guard in
 * `definitions-parse.test.ts` and by grepping the built `.d.ts`).
 */

/**
 * Optional display string that treats `''` as absent. The empty string is load-bearing: it
 * would otherwise win the copy precedence and render a blank label where the curated table
 * or a humanized id belongs. `.optional()` must wrap the transform, not the reverse, or the
 * inferred key stops being optional.
 */
const emptyToUndefined = z
  .string()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const parameterDisplayFields = {
  displayName: emptyToUndefined,
  description: emptyToUndefined,
};

const enumParameterSchema = z.object({
  ...parameterDisplayFields,
  id: z.string().min(1),
  type: z.literal('enum'),
  defaultValue: z.string().nullish(),
  required: z.boolean(),
  options: z.array(z.string()),
  optionLabels: z.record(z.string(), z.string()).optional(),
});

const enumListParameterSchema = z.object({
  ...parameterDisplayFields,
  id: z.string().min(1),
  type: z.literal('enum-list'),
  defaultValue: z.array(z.string()),
  required: z.boolean(),
  options: z.array(z.string()),
  optionLabels: z.record(z.string(), z.string()).optional(),
});

const mapEnumParameterSchema = z.object({
  ...parameterDisplayFields,
  id: z.string().min(1),
  type: z.literal('map-enum'),
  defaultValue: z.record(z.string(), z.number()),
  required: z.boolean(),
  keySource: z.string().min(1),
  min: z.number().nullish(),
  max: z.number().nullish(),
  step: z.number().nullish(),
});

const numberParameterSchema = z.object({
  ...parameterDisplayFields,
  id: z.string().min(1),
  type: z.literal('number'),
  defaultValue: z.number(),
  required: z.boolean(),
  min: z.number().nullish(),
  max: z.number().nullish(),
  step: z.number().nullish(),
});

const textParameterSchema = z.object({
  ...parameterDisplayFields,
  id: z.string().min(1),
  type: z.literal('text'),
  defaultValue: z.string().nullish(),
  required: z.boolean(),
  maxLength: z.number().nullish(),
});

const textListParameterSchema = z.object({
  ...parameterDisplayFields,
  id: z.string().min(1),
  type: z.literal('text-list'),
  defaultValue: z.array(z.string()).nullish(),
  required: z.boolean(),
  maxItems: z.number().nullish(),
  maxLength: z.number().nullish(),
});

const booleanParameterSchema = z.object({
  ...parameterDisplayFields,
  id: z.string().min(1),
  type: z.literal('boolean'),
  defaultValue: z.boolean(),
  required: z.boolean(),
});

const parameterSchema = z.discriminatedUnion('type', [
  enumParameterSchema,
  enumListParameterSchema,
  mapEnumParameterSchema,
  numberParameterSchema,
  textParameterSchema,
  textListParameterSchema,
  booleanParameterSchema,
]);

const definitionSchema = z.object({
  validator: z.string().min(1),
  allowedScopes: z.array(z.enum(['Agent', 'Llm', 'Tool'])).min(1),
  parameters: z.array(parameterSchema).default([]),
  status: z.enum(['Available', 'FeatureDisabled', 'Unauthorised', 'Disabled']),
  displayName: emptyToUndefined,
  description: emptyToUndefined,
  byoConnectorName: emptyToUndefined,
  byoConnectorKey: emptyToUndefined,
  // `.min(1)` rather than `emptyToUndefined`: an empty string here would make a UiPath
  // validator read as bring-your-own, which changes copy resolution and palette grouping.
  byoValidatorName: z.string().min(1).optional(),
  byoGuardrailConnectionId: z.string().min(1).optional(),
  byoConfigurationId: emptyToUndefined,
  folderPath: emptyToUndefined,
  folderKey: emptyToUndefined,
});

type DefinitionSchemaOutput = z.infer<typeof definitionSchema>;

/**
 * The bidirectional pin between the private schema and the public mirror: a field the schema
 * gained but `GuardrailDefinitionWire` did not, or the reverse, fails to compile here. Both
 * directions sit on `parseGuardrailDefinitions`' hot path, so neither can be dropped as dead
 * code, and that function's explicit return type keeps the schema types out of the `.d.ts`.
 */
function toWireDefinition(parsed: DefinitionSchemaOutput): GuardrailDefinitionWire {
  const asWire: GuardrailDefinitionWire = parsed;
  const asSchemaOutput: DefinitionSchemaOutput = asWire;
  return asSchemaOutput;
}

/** One definition the payload carried that could not be validated. */
export interface GuardrailDefinitionParseIssue {
  /** Position in the input array, so a host can correlate with its own logging. */
  index: number;
  /** The entry's `validator`, when it at least had a readable one. */
  validator?: string;
  /** Human-readable summary of what failed, for logs. Not user-facing copy. */
  message: string;
}

export interface GuardrailDefinitionsParseResult {
  /** Every definition that validated, in payload order. */
  definitions: GuardrailDefinitionWire[];
  /** Every definition that did not, dropped whole. */
  invalid: GuardrailDefinitionParseIssue[];
  /** Set when the payload was not an array at all; `definitions` is then empty. */
  inputError?: string;
}

function describeInput(input: unknown): string {
  if (input === null) return 'null';
  if (Array.isArray(input)) return 'array';
  return typeof input;
}

function readValidator(entry: unknown): string | undefined {
  if (typeof entry !== 'object' || entry === null) return undefined;
  const validator = (entry as { validator?: unknown }).validator;
  return typeof validator === 'string' && validator !== '' ? validator : undefined;
}

function describeIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 5)
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');
}

/**
 * Validate an unknown definitions payload.
 *
 * **Never throws.** A payload that is not an array yields an empty result plus `inputError`;
 * an individual definition that fails validation is dropped whole and reported in `invalid`,
 * which is what both products already do entry by entry today. Unknown keys are stripped.
 *
 * The only normalizations applied are the two that would otherwise corrupt display: empty
 * display strings become `undefined`, and an empty `byoValidatorName` is treated as absent.
 * Nothing else is reshaped here. Turning the wire shape into something renderable is
 * `enrichGuardrailDefinitions`' job.
 */
export function parseGuardrailDefinitions(input: unknown): GuardrailDefinitionsParseResult {
  if (!Array.isArray(input)) {
    return {
      definitions: [],
      invalid: [],
      inputError: `Expected an array of guardrail definitions, received ${describeInput(input)}.`,
    };
  }

  const definitions: GuardrailDefinitionWire[] = [];
  const invalid: GuardrailDefinitionParseIssue[] = [];

  input.forEach((entry: unknown, index: number) => {
    // A hostile payload must not be able to take a host panel down, so even an unexpected
    // throw out of zod degrades to a dropped definition.
    let message: string;
    try {
      const result = definitionSchema.safeParse(entry);
      if (result.success) {
        definitions.push(toWireDefinition(result.data));
        return;
      }
      message = describeIssues(result.error);
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : String(error);
    }
    const validator = readValidator(entry);
    invalid.push(validator === undefined ? { index, message } : { index, validator, message });
  });

  return { definitions, invalid };
}
