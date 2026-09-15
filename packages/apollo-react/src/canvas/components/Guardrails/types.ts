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
   * Host-supplied validation errors keyed by parameter id — domain validation the form cannot
   * know about, plus anything you gate Save on. Compute them with
   * `getRequiredEmptyParameterIds` / `getOutOfRangeParameterIds` and pass them here.
   *
   * These are additional to, not instead of, the form's own validation: the schema declares
   * `required`/`min`/`max` from the definitions and the resolver evaluates them as the user
   * types, so a field can show an error with no `errors` entry. Where the two disagree the
   * host's verdict is what renders (see `guardrail-validator-form.test.tsx`).
   */
  errors?: Record<string, string>;
  /** Called with the parameter id before `onChange` whenever that parameter is edited. */
  onClearError?: (paramId: string) => void;
  /**
   * Override the editor for individual parameters. Return `undefined` to fall through to the
   * default editor for that parameter type.
   *
   * Pair it with `overrideParameterIds`. Without that list the form has no way to know which
   * parameters you claim except by calling this speculatively — see that prop for what the
   * fallback costs and why it is deprecated.
   */
  renderParameter?: (ctx: GuardrailParameterRenderContext) => React.ReactNode | undefined;
  /**
   * Ids `renderParameter` overrides. Declaring them lets the form build its schema without
   * calling your renderer to find out.
   *
   * Strongly preferred. When omitted, the form falls back to probing: it invokes
   * `renderParameter` once per definition on every render — with **no-op** `onValueChange` /
   * `onParametersChange` — purely to test for `undefined` fallthrough. That means your renderer
   * must be pure, cheap, and decide solely on `ctx.definition` (id/type); branching on
   * `ctx.value`, memoising on the ctx object, or doing any work with side effects will misbehave
   * in ways that are hard to trace back here. The probe is deprecated and will be removed once
   * both consuming products pass this prop.
   */
  overrideParameterIds?: readonly string[];
  /** Per-string overrides; take precedence over the ambient lingui catalog. */
  labels?: Partial<GuardrailValidatorFormLabels>;
  className?: string;
}
