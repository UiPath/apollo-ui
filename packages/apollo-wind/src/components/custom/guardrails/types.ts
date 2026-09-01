import type * as React from 'react';
import type { GuardrailValidatorFormLabels } from './i18n';

/**
 * A configured guardrail validator parameter value, discriminated on `$parameterType`.
 *
 * Structurally mirrors the wire shape both consuming products (Flow, Agents) persist for
 * OOTB validator guardrails — hosts can pass their own equivalent union without mapping.
 */
export type GuardrailValidatorParameter =
  | { $parameterType: 'number'; id: string; value: number }
  | { $parameterType: 'text'; id: string; value: string }
  | { $parameterType: 'boolean'; id: string; value: boolean }
  | { $parameterType: 'enum'; id: string; value: string }
  | { $parameterType: 'enum-list'; id: string; value: string[] }
  | { $parameterType: 'text-list'; id: string; value: string[] }
  | { $parameterType: 'map-enum'; id: string; value: Record<string, number> };

export type GuardrailParameterType = GuardrailValidatorParameter['$parameterType'];

/**
 * The flat, display-ready definition of one configurable guardrail parameter.
 *
 * `label`, `tooltip` and `optionLabels` arrive pre-resolved (already localized by the host):
 * catalog/domain strings such as PII entity names belong to the products, not to this
 * component. Only the component's own chrome strings are localized here (see i18n.ts).
 */
export interface GuardrailParameterDefinition {
  id: string;
  type: GuardrailParameterType;
  /** Pre-resolved, host-localized display label. */
  label: string;
  required: boolean;
  defaultValue: unknown;
  /** Optional per-parameter info tooltip (pre-resolved). */
  tooltip?: string;
  /** For enum / enum-list: available options (raw values). */
  options?: string[];
  /** Friendly per-option labels keyed by raw option value. */
  optionLabels?: Record<string, string>;
  /** For map-enum: id of the sibling enum-list parameter whose selection provides the keys. */
  keySource?: string;
  /** For number / map-enum: numeric constraints. */
  min?: number;
  max?: number;
  step?: number;
  /** For text / text-list: per-item character cap. */
  maxLength?: number;
  /** For text-list: cap on how many entries can be added. */
  maxItems?: number;
}

/**
 * Everything a `renderParameter` override needs to replace one parameter's default editor,
 * e.g. mounting a product-specific model picker for a judge-model parameter.
 */
export interface GuardrailParameterRenderContext {
  definition: GuardrailParameterDefinition;
  /** The parameter's current raw value, if one is stored. */
  value: GuardrailValidatorParameter['value'] | undefined;
  /** Host-supplied error message for this parameter, if any. */
  error?: string;
  /** All current parameter values (for editors that read or write siblings). */
  parameters: GuardrailValidatorParameter[];
  /** Upsert this parameter's value; the form emits the full updated array via `onChange`. */
  onValueChange: (value: GuardrailValidatorParameter['value']) => void;
  /**
   * Replace the whole parameters array. Needed by overrides that write sidecar parameters
   * alongside their own (e.g. a model picker persisting connection metadata).
   */
  onParametersChange: (parameters: GuardrailValidatorParameter[]) => void;
}

export interface GuardrailValidatorFormProps {
  /** The guardrail definition's configurable parameters, in render order. */
  parameterDefinitions: GuardrailParameterDefinition[];
  /** Current parameter values (controlled). */
  parameters: GuardrailValidatorParameter[];
  /** Called with the full updated parameters array on every edit. */
  onChange: (parameters: GuardrailValidatorParameter[]) => void;
  /**
   * Host-supplied validation errors keyed by parameter id. The form never validates on its
   * own: compute errors host-side (see `getRequiredEmptyParameterIds`) and pass them here.
   */
  errors?: Record<string, string>;
  /** Called with the parameter id before `onChange` whenever that parameter is edited. */
  onClearError?: (paramId: string) => void;
  /**
   * Override the editor for individual parameters. Return `undefined` to fall through to the
   * default editor for that parameter type.
   */
  renderParameter?: (ctx: GuardrailParameterRenderContext) => React.ReactNode | undefined;
  /**
   * Locale for the component's own strings (placeholders, aria labels). Loads the built-in
   * catalog asynchronously; unsupported or missing locales fall back to English per key.
   */
  locale?: string;
  /** Per-string overrides; take precedence over the locale catalog. */
  labels?: Partial<GuardrailValidatorFormLabels>;
  className?: string;
}
