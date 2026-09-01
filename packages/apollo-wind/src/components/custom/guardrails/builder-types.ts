import type * as React from 'react';
import type { GuardrailParameterDefinition, GuardrailValidatorParameter } from './types';

/**
 * Structural mirrors of the guardrail wire shapes both consuming products persist. Hosts
 * pass their own equivalent types without mapping; mutual assignability is asserted on the
 * host side (see the Flow adapter's type-assertion file).
 */

export type GuardrailScope = 'Agent' | 'Llm' | 'Tool';

export interface GuardrailSelector {
  scopes: GuardrailScope[];
  matchNames?: string[];
}

export type GuardrailSeverityLevel = 'Info' | 'Warning' | 'Error';

/** Recipient type discriminators (numeric on the wire). */
export const GuardrailRecipientType = {
  User: 1,
  Group: 2,
  StaticEmail: 3,
  AssetEmail: 4,
  StaticGroupName: 5,
  AssetGroupName: 6,
} as const;
export type GuardrailRecipientTypeValue =
  (typeof GuardrailRecipientType)[keyof typeof GuardrailRecipientType];

/**
 * Escalation recipient union. The editor offers User/Group/StaticEmail/StaticGroupName;
 * the asset variants (4/6) exist so values using them round-trip through the form unedited.
 */
export type GuardrailEscalateRecipient =
  | { type: 1; value: string; displayName: string }
  | { type: 2; value: string; displayName: string }
  | { type: 3; value: string }
  | { type: 4; folderPath?: string; assetName: string }
  | { type: 5; value: string }
  | { type: 6; folderPath?: string; assetName: string };

export interface GuardrailEscalateApp {
  id: string;
  version: string;
  name: string;
  folderId?: string;
  folderName?: string;
  appProcessKey?: string;
  runtime?: string;
}

export type GuardrailAction =
  | { $actionType: 'log'; severityLevel: GuardrailSeverityLevel }
  | { $actionType: 'block'; reason: string }
  // Field references are product-shaped; the OOTB builder never edits them (pass-through
  // only, the filter option is custom-guardrail territory), so they stay opaque here.
  | { $actionType: 'filter'; fields: unknown[] }
  | { $actionType: 'escalate'; app: GuardrailEscalateApp; recipient: GuardrailEscalateRecipient };

export type GuardrailDefinitionStatus =
  | 'Available'
  | 'FeatureDisabled'
  | 'Unauthorised'
  | 'Disabled';

/**
 * The display-ready definition of an OOTB guardrail validator. `displayName` and `usageNote`
 * arrive pre-resolved (host-localized); `parameters` reuses the validator-form definition
 * type.
 */
export interface GuardrailDefinition {
  validator: string;
  displayName: string;
  allowedScopes: GuardrailScope[];
  parameters: GuardrailParameterDefinition[];
  status: GuardrailDefinitionStatus;
  /** Pre-localized informational note rendered above the form. */
  usageNote?: string;
  /** Present for bring-your-own guardrail definitions; stamped onto saved values. */
  byoValidatorName?: string;
}

/** `validatorType` persisted for bring-your-own guardrail definitions. */
export const GUARDRAIL_BYO_VALIDATOR_TYPE = 'byo';

/** The builder's in/out value — mirrors the persisted built-in-validator guardrail shape. */
export interface GuardrailBuilderValue {
  id: string;
  $guardrailType: 'builtInValidator';
  name: string;
  description?: string;
  selector: GuardrailSelector;
  action: GuardrailAction;
  enabledForEvals: boolean;
  validatorType: string;
  validatorParameters: GuardrailValidatorParameter[];
  byoValidatorName?: string;
}

/**
 * Host-supplied validation errors, merged over the builder's internal validation (the host
 * message wins per field). Any present error gates Save.
 */
export interface GuardrailBuilderErrors {
  name?: string;
  blockReason?: string;
  filterFields?: string;
  recipient?: string;
  actionApp?: string;
  scopes?: string;
  toolNames?: string;
  /** Per-parameter messages keyed by parameter id. */
  parameters?: Record<string, string>;
}

/** Context handed to the `renderRecipientSearch` slot (user/group directory autosuggest). */
export interface GuardrailRecipientSearchContext {
  kind: 'user' | 'group';
  /** Current display value (displayName, falling back to the raw value). */
  displayValue: string;
  /** Localized placeholder for the current kind. */
  placeholder: string;
  /** Whether the recipient currently fails validation (style the input accordingly). */
  invalid: boolean;
  onSelect: (selection: { value: string; displayName: string }) => void;
  onClear: () => void;
}

/** Context handed to the `renderAppPicker` slot (escalation action app). */
export interface GuardrailAppPickerContext {
  /** The selected app, or null when unset. */
  app: GuardrailEscalateApp | null;
  onChange: (app: GuardrailEscalateApp | null) => void;
  /** Localized field label. */
  label: string;
  /** Validation message to surface, if any. */
  error?: string;
}

export interface GuardrailBuilderSlots {
  /** Replace the recipient autosuggest for User/Group recipients. Fallback: a plain input. */
  renderRecipientSearch?: (ctx: GuardrailRecipientSearchContext) => React.ReactNode;
  /** Render the escalation app picker. Fallback: a localized "picker unavailable" note. */
  renderAppPicker?: (ctx: GuardrailAppPickerContext) => React.ReactNode;
  /** Rendered under the escalation grid (e.g. a marketplace help line). */
  escalateHelp?: React.ReactNode;
}
