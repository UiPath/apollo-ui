import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';

/**
 * The component's own chrome strings. Domain strings (parameter labels, tooltips, option
 * labels) are NOT localized here — they arrive pre-resolved on `GuardrailParameterDefinition`.
 *
 * Values may contain `{{placeholder}}` tokens; interpolate with `formatGuardrailFormMessage`.
 * The required-error message is deliberately absent: validation policy and its messages are
 * host-owned and arrive through the `errors` prop.
 */
export interface GuardrailValidatorFormLabels {
  /** Aria label of the per-parameter info-tooltip trigger. */
  moreInformation: string;
  /** Placeholder of the single-select (enum) trigger. */
  enumPlaceholder: string;
  /** Placeholder of the multi-select (enum-list) popover trigger. */
  enumListPlaceholder: string;
  /** Label of the text-list "Add" button. */
  addItem: string;
  /** Aria-label template of a text-list row's remove button: `{{label}}`, `{{position}}`. */
  removeItem: string;
}

export const GUARDRAIL_FORM_EN_LABELS: GuardrailValidatorFormLabels = {
  moreInformation: 'More information',
  enumPlaceholder: 'Select...',
  enumListPlaceholder: 'Select options...',
  addItem: 'Add',
  removeItem: 'Remove {{label}} {{position}}',
};

/**
 * Chrome strings of the guardrail builder screen (labels, placeholders, buttons, banners,
 * and the builder's own validation messages — it gates its own Save, so the messages ship
 * with it; hosts override per string via `labels` or per field via `errors`). Domain strings
 * (`definition.displayName`, `usageNote`, `otherAppliedScopes` labels) stay pre-resolved.
 */
export interface GuardrailBuilderLabels {
  /** Dialog/header title templates; `{{name}}` is the definition display name. */
  editTitle: string;
  addTitle: string;
  typeLabel: string;
  nameLabel: string;
  namePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  evalsLabel: string;
  evalsInfoAriaLabel: string;
  evalsTooltip: string;
  saveAsNew: string;
  cancel: string;
  save: string;
  // Status banners
  byoDisabledMessage: string;
  unauthorizedMessage: string;
  featureDisabledMessage: string;
  // Scope selector
  scopesLabel: string;
  toolsLabel: string;
  scopeAgentLabel: string;
  scopeLlmLabel: string;
  scopeToolLabel: string;
  // Action section
  actionTypeLabel: string;
  actionLogLabel: string;
  actionBlockLabel: string;
  actionFilterLabel: string;
  actionEscalateLabel: string;
  severityLabel: string;
  severityInfoLabel: string;
  severityWarningLabel: string;
  severityErrorLabel: string;
  blockReasonLabel: string;
  blockReasonPlaceholder: string;
  // Escalation
  assignToLabel: string;
  recipientUserLabel: string;
  recipientGroupLabel: string;
  recipientEmailLabel: string;
  recipientGroupNameLabel: string;
  recipientFallbackLabel: string;
  userSearchPlaceholder: string;
  groupSearchPlaceholder: string;
  emailPlaceholder: string;
  groupNamePlaceholder: string;
  actionAppLabel: string;
  appPickerUnavailable: string;
  // Mixed scopes banner
  mixedScopesAlsoApplied: string;
  mixedScopesSaveAsNewHint: string;
  // Validation messages
  nameRequiredError: string;
  nameDuplicateError: string;
  parameterRequiredError: string;
  scopesRequiredError: string;
  toolsRequiredError: string;
  blockReasonRequiredError: string;
  filterFieldsRequiredError: string;
  recipientRequiredError: string;
  actionAppRequiredError: string;
}

export const GUARDRAIL_BUILDER_EN_LABELS: GuardrailBuilderLabels = {
  editTitle: 'Edit {{name}} guardrail',
  addTitle: 'Add {{name}} guardrail',
  typeLabel: 'Guardrail type',
  nameLabel: 'Guardrail name',
  namePlaceholder: 'Enter guardrail name',
  descriptionLabel: 'Guardrail description',
  descriptionPlaceholder: 'Enter guardrail description',
  evalsLabel: 'Enable guardrail for evaluations',
  evalsInfoAriaLabel: 'More information',
  evalsTooltip: 'When enabled, this guardrail will be applied during evaluation runs.',
  saveAsNew: 'Save as new',
  cancel: 'Cancel',
  save: 'Save',
  byoDisabledMessage:
    "This guardrail's configuration has been disabled and can no longer be used. Contact your administrator to re-enable the configuration or replace this guardrail before running the agent.",
  unauthorizedMessage:
    'You are not entitled to use guardrails. You can access the configuration settings, but modifications cannot be saved.',
  featureDisabledMessage:
    'This guardrail feature is disabled. You can access the configuration settings, but modifications cannot be saved. It is best to remove this guardrail as long as the feature is disabled.',
  scopesLabel: 'Scopes',
  toolsLabel: 'Tools',
  scopeAgentLabel: 'Agent',
  scopeLlmLabel: 'LLM calls',
  scopeToolLabel: 'Tools',
  actionTypeLabel: 'Action type',
  actionLogLabel: 'Log',
  actionBlockLabel: 'Block',
  actionFilterLabel: 'Filter',
  actionEscalateLabel: 'Escalate',
  severityLabel: 'Severity level',
  severityInfoLabel: 'Info',
  severityWarningLabel: 'Warning',
  severityErrorLabel: 'Error',
  blockReasonLabel: 'Blocking reason',
  blockReasonPlaceholder: 'Enter reason for blocking',
  assignToLabel: 'Assign to',
  recipientUserLabel: 'User',
  recipientGroupLabel: 'Group',
  recipientEmailLabel: 'Email address',
  recipientGroupNameLabel: 'Group name',
  recipientFallbackLabel: 'Recipient',
  userSearchPlaceholder: 'Search for a user...',
  groupSearchPlaceholder: 'Search for a group...',
  emailPlaceholder: 'Enter email address',
  groupNamePlaceholder: 'Enter group name',
  actionAppLabel: 'Action App',
  appPickerUnavailable: 'App picker unavailable — requires Studio Web host.',
  mixedScopesAlsoApplied: 'This guardrail is also applied to:',
  mixedScopesSaveAsNewHint: 'Use "Save as new" to create a separate copy for this tool only.',
  nameRequiredError: 'Guardrail name is required',
  nameDuplicateError: 'A guardrail with this name already exists',
  parameterRequiredError: 'Value is required',
  scopesRequiredError: 'At least one scope is required',
  toolsRequiredError: 'At least one tool is required',
  blockReasonRequiredError: 'Block reason is required',
  filterFieldsRequiredError: 'Fields selection is required',
  recipientRequiredError: 'Recipient is required',
  actionAppRequiredError: 'Action app is required',
};

/** Merge English defaults, a loaded catalog, and per-string overrides (undefined skipped). */
export function resolveGuardrailBuilderLabels(
  catalog?: Partial<GuardrailBuilderLabels>,
  overrides?: Partial<GuardrailBuilderLabels>
): GuardrailBuilderLabels {
  const merged: GuardrailBuilderLabels = { ...GUARDRAIL_BUILDER_EN_LABELS };
  for (const source of [catalog, overrides]) {
    if (!source) continue;
    for (const key of Object.keys(merged) as Array<keyof GuardrailBuilderLabels>) {
      const value = source[key];
      if (value !== undefined) merged[key] = value;
    }
  }
  return merged;
}

/** Interpolate `{{token}}` placeholders in a catalog message. Unknown tokens are left as-is. */
export function formatGuardrailFormMessage(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, token: string) =>
    token in vars ? String(vars[token]) : match
  );
}

/** Merge English defaults, a loaded catalog, and per-string overrides (undefined skipped). */
export function resolveGuardrailFormLabels(
  catalog?: Partial<GuardrailValidatorFormLabels>,
  overrides?: Partial<GuardrailValidatorFormLabels>
): GuardrailValidatorFormLabels {
  const merged: GuardrailValidatorFormLabels = { ...GUARDRAIL_FORM_EN_LABELS };
  for (const source of [catalog, overrides]) {
    if (!source) continue;
    for (const key of Object.keys(merged) as Array<keyof GuardrailValidatorFormLabels>) {
      const value = source[key];
      if (value !== undefined) merged[key] = value;
    }
  }
  return merged;
}

// Reifies each ICU placeholder back into the `{{token}}` template convention: the
// localized strings cross into plain-string template APIs (`formatGuardrailFormMessage`,
// wind's `formatTemplate`) as data, while translators work with standard ICU placeholders.
const TEMPLATE_TOKENS = { name: '{{name}}', label: '{{label}}', position: '{{position}}' };

/** Localized chrome strings of the validator form; per-string `overrides` always win. */
export function useGuardrailFormLabels(
  overrides?: Partial<GuardrailValidatorFormLabels>
): GuardrailValidatorFormLabels {
  const { _ } = useSafeLingui();
  return useMemo(
    () =>
      resolveGuardrailFormLabels(
        {
          moreInformation: _({
            id: 'guardrails.form.more-information',
            message: 'More information',
          }),
          enumPlaceholder: _({ id: 'guardrails.form.enum-placeholder', message: 'Select...' }),
          enumListPlaceholder: _({
            id: 'guardrails.form.enum-list-placeholder',
            message: 'Select options...',
          }),
          addItem: _({ id: 'guardrails.form.add-item', message: 'Add' }),
          removeItem: _({
            id: 'guardrails.form.remove-item',
            message: 'Remove {label} {position}',
            values: TEMPLATE_TOKENS,
          }),
        },
        overrides
      ),
    [_, overrides]
  );
}

/** Localized chrome strings of the builder screen; per-string `overrides` always win. */
export function useGuardrailBuilderLabels(
  overrides?: Partial<GuardrailBuilderLabels>
): GuardrailBuilderLabels {
  const { _ } = useSafeLingui();
  return useMemo(
    () =>
      resolveGuardrailBuilderLabels(
        {
          editTitle: _({
            id: 'guardrails.builder.edit-title',
            message: 'Edit {name} guardrail',
            values: TEMPLATE_TOKENS,
          }),
          addTitle: _({
            id: 'guardrails.builder.add-title',
            message: 'Add {name} guardrail',
            values: TEMPLATE_TOKENS,
          }),
          typeLabel: _({ id: 'guardrails.builder.type-label', message: 'Guardrail type' }),
          nameLabel: _({ id: 'guardrails.builder.name-label', message: 'Guardrail name' }),
          namePlaceholder: _({
            id: 'guardrails.builder.name-placeholder',
            message: 'Enter guardrail name',
          }),
          descriptionLabel: _({
            id: 'guardrails.builder.description-label',
            message: 'Guardrail description',
          }),
          descriptionPlaceholder: _({
            id: 'guardrails.builder.description-placeholder',
            message: 'Enter guardrail description',
          }),
          evalsLabel: _({
            id: 'guardrails.builder.evals-label',
            message: 'Enable guardrail for evaluations',
          }),
          evalsInfoAriaLabel: _({
            id: 'guardrails.builder.evals-info-aria-label',
            message: 'More information',
          }),
          evalsTooltip: _({
            id: 'guardrails.builder.evals-tooltip',
            message: 'When enabled, this guardrail will be applied during evaluation runs.',
          }),
          saveAsNew: _({ id: 'guardrails.builder.save-as-new', message: 'Save as new' }),
          cancel: _({ id: 'guardrails.builder.cancel', message: 'Cancel' }),
          save: _({ id: 'guardrails.builder.save', message: 'Save' }),
          byoDisabledMessage: _({
            id: 'guardrails.builder.byo-disabled-message',
            message:
              "This guardrail's configuration has been disabled and can no longer be used. Contact your administrator to re-enable the configuration or replace this guardrail before running the agent.",
          }),
          unauthorizedMessage: _({
            id: 'guardrails.builder.unauthorized-message',
            message:
              'You are not entitled to use guardrails. You can access the configuration settings, but modifications cannot be saved.',
          }),
          featureDisabledMessage: _({
            id: 'guardrails.builder.feature-disabled-message',
            message:
              'This guardrail feature is disabled. You can access the configuration settings, but modifications cannot be saved. It is best to remove this guardrail as long as the feature is disabled.',
          }),
          scopesLabel: _({ id: 'guardrails.builder.scopes-label', message: 'Scopes' }),
          toolsLabel: _({ id: 'guardrails.builder.tools-label', message: 'Tools' }),
          scopeAgentLabel: _({ id: 'guardrails.builder.scope-agent-label', message: 'Agent' }),
          scopeLlmLabel: _({ id: 'guardrails.builder.scope-llm-label', message: 'LLM calls' }),
          scopeToolLabel: _({ id: 'guardrails.builder.scope-tool-label', message: 'Tools' }),
          actionTypeLabel: _({
            id: 'guardrails.builder.action-type-label',
            message: 'Action type',
          }),
          actionLogLabel: _({ id: 'guardrails.builder.action-log-label', message: 'Log' }),
          actionBlockLabel: _({ id: 'guardrails.builder.action-block-label', message: 'Block' }),
          actionFilterLabel: _({ id: 'guardrails.builder.action-filter-label', message: 'Filter' }),
          actionEscalateLabel: _({
            id: 'guardrails.builder.action-escalate-label',
            message: 'Escalate',
          }),
          severityLabel: _({ id: 'guardrails.builder.severity-label', message: 'Severity level' }),
          severityInfoLabel: _({ id: 'guardrails.builder.severity-info-label', message: 'Info' }),
          severityWarningLabel: _({
            id: 'guardrails.builder.severity-warning-label',
            message: 'Warning',
          }),
          severityErrorLabel: _({
            id: 'guardrails.builder.severity-error-label',
            message: 'Error',
          }),
          blockReasonLabel: _({
            id: 'guardrails.builder.block-reason-label',
            message: 'Blocking reason',
          }),
          blockReasonPlaceholder: _({
            id: 'guardrails.builder.block-reason-placeholder',
            message: 'Enter reason for blocking',
          }),
          assignToLabel: _({ id: 'guardrails.builder.assign-to-label', message: 'Assign to' }),
          recipientUserLabel: _({ id: 'guardrails.builder.recipient-user-label', message: 'User' }),
          recipientGroupLabel: _({
            id: 'guardrails.builder.recipient-group-label',
            message: 'Group',
          }),
          recipientEmailLabel: _({
            id: 'guardrails.builder.recipient-email-label',
            message: 'Email address',
          }),
          recipientGroupNameLabel: _({
            id: 'guardrails.builder.recipient-group-name-label',
            message: 'Group name',
          }),
          recipientFallbackLabel: _({
            id: 'guardrails.builder.recipient-fallback-label',
            message: 'Recipient',
          }),
          userSearchPlaceholder: _({
            id: 'guardrails.builder.user-search-placeholder',
            message: 'Search for a user...',
          }),
          groupSearchPlaceholder: _({
            id: 'guardrails.builder.group-search-placeholder',
            message: 'Search for a group...',
          }),
          emailPlaceholder: _({
            id: 'guardrails.builder.email-placeholder',
            message: 'Enter email address',
          }),
          groupNamePlaceholder: _({
            id: 'guardrails.builder.group-name-placeholder',
            message: 'Enter group name',
          }),
          actionAppLabel: _({ id: 'guardrails.builder.action-app-label', message: 'Action App' }),
          appPickerUnavailable: _({
            id: 'guardrails.builder.app-picker-unavailable',
            message: 'App picker unavailable — requires Studio Web host.',
          }),
          mixedScopesAlsoApplied: _({
            id: 'guardrails.builder.mixed-scopes-also-applied',
            message: 'This guardrail is also applied to:',
          }),
          mixedScopesSaveAsNewHint: _({
            id: 'guardrails.builder.mixed-scopes-save-as-new-hint',
            message: 'Use "Save as new" to create a separate copy for this tool only.',
          }),
          nameRequiredError: _({
            id: 'guardrails.builder.name-required-error',
            message: 'Guardrail name is required',
          }),
          nameDuplicateError: _({
            id: 'guardrails.builder.name-duplicate-error',
            message: 'A guardrail with this name already exists',
          }),
          parameterRequiredError: _({
            id: 'guardrails.builder.parameter-required-error',
            message: 'Value is required',
          }),
          scopesRequiredError: _({
            id: 'guardrails.builder.scopes-required-error',
            message: 'At least one scope is required',
          }),
          toolsRequiredError: _({
            id: 'guardrails.builder.tools-required-error',
            message: 'At least one tool is required',
          }),
          blockReasonRequiredError: _({
            id: 'guardrails.builder.block-reason-required-error',
            message: 'Block reason is required',
          }),
          filterFieldsRequiredError: _({
            id: 'guardrails.builder.filter-fields-required-error',
            message: 'Fields selection is required',
          }),
          recipientRequiredError: _({
            id: 'guardrails.builder.recipient-required-error',
            message: 'Recipient is required',
          }),
          actionAppRequiredError: _({
            id: 'guardrails.builder.action-app-required-error',
            message: 'Action app is required',
          }),
        },
        overrides
      ),
    [_, overrides]
  );
}
