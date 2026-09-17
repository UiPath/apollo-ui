import type { GuardrailScope } from './builder-types';

// Structural mirrors of both products' policy schemas, so a host passes its own zod-inferred
// types unmapped.

/** Agents' `ActionType` string enum assigns to this union as well as Flow's `z.enum`. */
export type CentralizedGuardrailActionType = 'block' | 'escalate' | 'filter' | 'log';

/** A BYO guardrail's configured parameter; `parameterType` and `value` are unvalidated. */
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
  /** `Pre` / `Post` / `Both`, typed open as in both products' schemas. */
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

/** The parameter definition fields this component reads, so any host's shape satisfies it. */
export interface CentralizedGuardrailParameterDefinition {
  id: string;
  type: string;
  /** Pre-resolved display label; falls back to the parameter id. */
  label?: string;
  /** Keyed by the raw wire value. */
  optionLabels?: Record<string, string>;
  /** For `map-enum`: id of the sibling `enum-list` whose selection provides the keys. */
  keySource?: string;
}

/** The definition fields this component reads; the same array the palette and list take. */
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
      thresholds: Array<{ key: string; label: string; value: number | undefined }>;
    };
