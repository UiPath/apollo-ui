import type { GuardrailDefinitionStatus, GuardrailScope } from './builder-types';
import type { GuardrailParameterType } from './types';

/**
 * The guardrail definitions contract as it arrives from the guardrails API, after parsing.
 *
 * Hand-written on purpose: no type here may transitively reference zod, so that the package's
 * public surface stays independent of the zod major a host happens to run (`definitions-parse.ts`
 * is the only module in the family allowed to import zod, and a source-level guard test enforces
 * that). Mutual assignability against the private schemas is asserted at compile time there.
 *
 * "After parsing" means two normalizations have already happened, so consumers never re-guard:
 * every `defaultValue` is present and non-null, and every absent-or-null optional is `undefined`.
 */

/** Shared fields of every parameter definition. Display fields are only sent for BYO guardrails. */
interface GuardrailParameterWireBase {
  id: string;
  required: boolean;
  /** Manifest-supplied label. Present for BYO guardrails; built-ins resolve copy in-package. */
  displayName?: string;
  /** Manifest-supplied help text, rendered as the parameter's info tooltip. */
  description?: string;
}

export interface GuardrailNumberParameterWire extends GuardrailParameterWireBase {
  type: 'number';
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface GuardrailTextParameterWire extends GuardrailParameterWireBase {
  type: 'text';
  /** Normalized: the API permits `null`, which becomes `''`. */
  defaultValue: string;
  maxLength?: number;
}

export interface GuardrailBooleanParameterWire extends GuardrailParameterWireBase {
  type: 'boolean';
  defaultValue: boolean;
}

export interface GuardrailEnumParameterWire extends GuardrailParameterWireBase {
  type: 'enum';
  /** Normalized: the API permits `null`, which becomes `''`. */
  defaultValue: string;
  options: string[];
  optionLabels?: Record<string, string>;
}

export interface GuardrailEnumListParameterWire extends GuardrailParameterWireBase {
  type: 'enum-list';
  defaultValue: string[];
  options: string[];
  optionLabels?: Record<string, string>;
}

export interface GuardrailTextListParameterWire extends GuardrailParameterWireBase {
  type: 'text-list';
  /** Normalized: the API may omit this or send `null`, both of which become `[]`. */
  defaultValue: string[];
  maxItems?: number;
  maxLength?: number;
}

export interface GuardrailMapEnumParameterWire extends GuardrailParameterWireBase {
  type: 'map-enum';
  defaultValue: Record<string, number>;
  /** Id of the sibling `enum-list` parameter whose selection supplies this map's keys. */
  keySource: string;
  min?: number;
  max?: number;
  step?: number;
}

/** One configurable parameter, discriminated on `type`. */
export type GuardrailParameterDefinitionWire =
  | GuardrailNumberParameterWire
  | GuardrailTextParameterWire
  | GuardrailBooleanParameterWire
  | GuardrailEnumParameterWire
  | GuardrailEnumListParameterWire
  | GuardrailTextListParameterWire
  | GuardrailMapEnumParameterWire;

/** Compile-time check that the wire union stays in step with the rendered parameter types. */
export type GuardrailParameterWireType = GuardrailParameterDefinitionWire['type'] &
  GuardrailParameterType;

/**
 * One guardrail validator definition as the API describes it.
 *
 * Built-in (UiPath-managed) validators carry no display copy: the backend marks their friendly
 * name `[JsonIgnore]` and never populates `displayName`, `description` or `optionLabels`, so
 * those strings are resolved from the in-package catalog (`definitions-copy.ts`) instead. BYO
 * guardrails do carry manifest copy, and it always wins for them.
 */
export interface GuardrailDefinitionWire {
  validator: string;
  allowedScopes: GuardrailScope[];
  parameters: GuardrailParameterDefinitionWire[];
  status: GuardrailDefinitionStatus;
  /** Manifest display name. Set for BYO guardrails; absent for built-ins. */
  displayName?: string;
  /** Manifest description. Set for BYO guardrails; absent for built-ins. */
  description?: string;
  /** Present exactly for bring-your-own guardrails; its presence is the BYO discriminator. */
  byoValidatorName?: string;
  byoConnectorName?: string;
  byoConnectorKey?: string;
  byoGuardrailConnectionId?: string;
  byoConfigurationId?: string;
  folderKey?: string;
  /**
   * Execution stages the validator runs at, keyed by scope. Values stay unvalidated strings so
   * that adding a stage backend-side can never reject a definition frontend-side.
   */
  guardrailStages?: Record<string, string[]>;
  /** Payload size bounds the validator accepts, in characters. */
  payloadMinSizeLimit?: number;
  payloadMaxSizeLimit?: number;
  /** Whether the tenant holds a BYO guardrails subscription. */
  isByogSubscription?: boolean;
}

/** One parse issue, with its path pre-joined so this type carries no zod reference. */
export interface GuardrailDefinitionParseIssue {
  /** Dot-joined path to the offending field, relative to the definition (e.g. `parameters.1.id`). */
  path: string;
  message: string;
}

/**
 * One dropped definition. A definition with a single bad parameter is dropped whole, matching
 * what both products do today: a partially parsed definition renders a form that cannot be saved.
 */
export interface GuardrailDefinitionParseFailure {
  /** Index in the input array. */
  index: number;
  /** Best-effort validator id, so a caller can log which guardrail vanished. */
  validator?: string;
  issues: GuardrailDefinitionParseIssue[];
}

/**
 * The result of parsing a definitions response. Never a thrown error: guardrail surfaces render
 * inside shadow roots with no error boundary, where a throw blanks the whole panel.
 */
export interface GuardrailDefinitionsParseResult {
  /** Every definition that parsed, in input order. */
  definitions: GuardrailDefinitionWire[];
  /** One entry per dropped definition. Empty when everything parsed. */
  invalid: GuardrailDefinitionParseFailure[];
  /** Set when the input was not an array at all, in which case `definitions` is empty. */
  inputError?: 'not-an-array';
}
