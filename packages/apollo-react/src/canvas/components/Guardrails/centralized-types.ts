import type { GuardrailScope } from './builder-types';

/**
 * Structural mirrors of the governance guardrail shapes both products read from the AI Trust
 * Layer policy. Not a variant of `GuardrailBuilderValue`: no `id`, `scopes` at the top level
 * rather than under a `selector`, `action` a bare discriminator, parameters untyped wire
 * values. Hosts pass their own zod-inferred types without mapping.
 */

/**
 * What the policy does when the guardrail trips. A string enum member is assignable to its
 * literal type, so this closed union admits Agents' `ActionType` enum as well as Flow's
 * `z.enum`.
 */
export type CentralizedGuardrailActionType = 'block' | 'escalate' | 'filter' | 'log';

/**
 * One configured parameter of a BYO centralized guardrail. `value` is whatever the connector
 * persisted and `parameterType` an unvalidated wire string, so both stay opaque here.
 */
export interface CentralizedGuardrailParameter {
  id: string;
  parameterType?: string | null;
  value?: unknown;
}

/** One guardrail enforced by the organization's AI Trust Layer policy. */
export interface CentralizedGuardrail {
  validator: string;
  /** Admin-given display name. Only set for BYO guardrails; it is also their identity. */
  name?: string | null;
  /** Tells a BYO entry apart from a built-in validator sharing the same `validator` id. */
  isByo?: boolean | null;
  /** `Pre` / `Post` / `Both` today, but typed open: both products parse it as a free string. */
  executionStage: string;
  appliesToAutonomousAgents: boolean;
  appliesToConversationalAgents: boolean;
  scopes: GuardrailScope[];
  action: CentralizedGuardrailActionType;
  /** Built-in validators only: the detected entities, and their per-entity thresholds. */
  entities?: string[] | null;
  entityThresholds?: Record<string, number> | null;
  /** BYO only: connector-specific configuration, passed through from the policy. */
  parameters?: CentralizedGuardrailParameter[] | null;
}

/**
 * The parameter definition fields this component reads, and nothing more, so every host's
 * enriched shape satisfies it. `type` is `string` because the renderer only tests it against
 * two values.
 */
export interface CentralizedGuardrailParameterDefinition {
  id: string;
  type: string;
  /** Pre-resolved display label; falls back to the parameter id. */
  label?: string;
  /** Friendly per-option labels keyed by the raw wire value. */
  optionLabels?: Record<string, string>;
  /** For `map-enum`: id of the sibling `enum-list` whose selection provides the keys. */
  keySource?: string;
}

/**
 * The definition fields this component reads: a host feeds the same enriched array it already
 * feeds the palette and the list.
 */
export interface CentralizedGuardrailDefinition {
  validator: string;
  status?: string;
  description?: string;
  byoValidatorName?: string;
  byoConnectorName?: string;
  parameters?: CentralizedGuardrailParameterDefinition[];
}

/** One resolved row of a centralized guardrail's configuration, ready to render. */
export type CentralizedGuardrailParameterRow =
  | { id: string; label: string; kind: 'value'; value: string }
  | {
      id: string;
      label: string;
      kind: 'thresholds';
      /** Key labels are already resolved through the definition's `optionLabels`. */
      thresholds: Array<{ key: string; label: string; value: number | undefined }>;
    };
