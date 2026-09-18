import { z } from 'zod';
import type { GuardrailDefinitionWire } from './definitions-wire';

/**
 * Runtime validation for the definitions payload.
 *
 * zod is private to this module: everything exported is annotated with the hand-written types
 * from `definitions-wire.ts`, so no schema type reaches the emitted declarations and
 * consumers take no zod dependency. Guarded by two tests in `definitions-parse.test.ts`.
 */

/**
 * Optional display string, where *blank* means absent. Load-bearing: a blank string would
 * otherwise win the copy precedence and render an empty label where the curated table or a
 * humanized id belongs, and `'   '` looks identical to `''` on screen.
 *
 * A retained value is not trimmed: blank is absent, anything with content is the producer's
 * verbatim. `.optional()` must wrap the transform, or the inferred key stops being optional.
 */
const emptyToUndefined = z
  .string()
  .transform((value) => (value.trim() === '' ? undefined : value))
  .optional();

/**
 * A required identifier something dispatches on. `.min(1)` is not enough, since it accepts
 * `'   '`. A blank one is a data error rather than a missing value, so it fails the entry and
 * the definition is dropped whole rather than normalized away.
 */
const nonBlankString = z
  .string()
  .refine((value) => value.trim() !== '', 'Expected a non-blank string');

const parameterDisplayFields = {
  displayName: emptyToUndefined,
  description: emptyToUndefined,
};

const enumParameterSchema = z.object({
  ...parameterDisplayFields,
  id: nonBlankString,
  type: z.literal('enum'),
  defaultValue: z.string().nullish(),
  required: z.boolean(),
  options: z.array(z.string()),
  optionLabels: z.record(z.string(), z.string()).optional(),
});

const enumListParameterSchema = z.object({
  ...parameterDisplayFields,
  id: nonBlankString,
  type: z.literal('enum-list'),
  defaultValue: z.array(z.string()),
  required: z.boolean(),
  options: z.array(z.string()),
  optionLabels: z.record(z.string(), z.string()).optional(),
});

const mapEnumParameterSchema = z.object({
  ...parameterDisplayFields,
  id: nonBlankString,
  type: z.literal('map-enum'),
  defaultValue: z.record(z.string(), z.number()),
  required: z.boolean(),
  keySource: nonBlankString,
  min: z.number().nullish(),
  max: z.number().nullish(),
  step: z.number().nullish(),
});

const numberParameterSchema = z.object({
  ...parameterDisplayFields,
  id: nonBlankString,
  type: z.literal('number'),
  defaultValue: z.number(),
  required: z.boolean(),
  min: z.number().nullish(),
  max: z.number().nullish(),
  step: z.number().nullish(),
});

const textParameterSchema = z.object({
  ...parameterDisplayFields,
  id: nonBlankString,
  type: z.literal('text'),
  defaultValue: z.string().nullish(),
  required: z.boolean(),
  maxLength: z.number().nullish(),
});

const textListParameterSchema = z.object({
  ...parameterDisplayFields,
  id: nonBlankString,
  type: z.literal('text-list'),
  defaultValue: z.array(z.string()).nullish(),
  required: z.boolean(),
  maxItems: z.number().nullish(),
  maxLength: z.number().nullish(),
});

const booleanParameterSchema = z.object({
  ...parameterDisplayFields,
  id: nonBlankString,
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
  validator: nonBlankString,
  allowedScopes: z.array(z.enum(['Agent', 'Llm', 'Tool'])).min(1),
  parameters: z.array(parameterSchema).default([]),
  status: z.enum(['Available', 'FeatureDisabled', 'Unauthorised', 'Disabled']),
  displayName: emptyToUndefined,
  description: emptyToUndefined,
  byoConnectorName: emptyToUndefined,
  byoConnectorKey: emptyToUndefined,
  // Not `emptyToUndefined`: a blank display name degrades to curated copy, but a blank value
  // here would make a UiPath validator read as bring-your-own, changing copy resolution and
  // palette grouping. Better to drop the definition than to change its identity.
  byoValidatorName: nonBlankString.optional(),
  byoGuardrailConnectionId: nonBlankString.optional(),
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

/**
 * Best-effort validator name for a failed entry, so a host can correlate with its own logging.
 * Blank-checked, not `!== ''`: `validator: '   '` would read as a name in a log line.
 */
function readValidator(entry: unknown): string | undefined {
  if (typeof entry !== 'object' || entry === null) return undefined;
  const validator = (entry as { validator?: unknown }).validator;
  return typeof validator === 'string' && validator.trim() !== '' ? validator : undefined;
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
 * One normalization is applied, and only because it would otherwise corrupt display: a blank
 * display string becomes `undefined` so curated copy can win. Blank *identifiers* are not
 * normalized - they fail the entry, so the definition is dropped rather than silently
 * changing identity. Nothing else is reshaped here. Turning the wire shape into something
 * renderable is `enrichGuardrailDefinitions`' job.
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
    // throw degrades to a dropped definition. `readValidator` is inside the try as well: it
    // reads `entry.validator` a second time, and a throwing getter there would escape a
    // function whose whole contract is that it never throws.
    let message: string;
    let validator: string | undefined;
    try {
      const result = definitionSchema.safeParse(entry);
      if (result.success) {
        definitions.push(toWireDefinition(result.data));
        return;
      }
      message = describeIssues(result.error);
      validator = readValidator(entry);
    } catch (error: unknown) {
      message = error instanceof Error ? error.message : String(error);
    }
    invalid.push(validator === undefined ? { index, message } : { index, validator, message });
  });

  return { definitions, invalid };
}
