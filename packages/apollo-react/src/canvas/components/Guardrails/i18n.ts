import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';

/**
 * The component's own chrome strings. Domain strings (parameter labels, tooltips, option
 * labels) are NOT localized here — they arrive pre-resolved on `GuardrailParameterDefinition`.
 * Not localized *here* rather than not localized at all: the definitions layer
 * (`definitions-copy.ts`) carries the built-in validators' own copy, in this same catalog. The
 * split is by ownership - chrome belongs to the component, validator copy to its definition.
 *
 * Values may contain `{{placeholder}}` tokens; interpolate with `formatGuardrailFormMessage`.
 *
 * This includes the resolver's own messages (`requiredError`, `minError`, `maxError`). The
 * schema declares those constraints from the parameter definitions, so the messages ship with
 * the component and translate with the rest of its chrome. Domain validation and its messages
 * remain host-owned and arrive through the `errors` prop.
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
  /**
   * Resolver messages for the constraints `buildGuardrailFormSchema` declares. Without these,
   * apollo-wind falls back to its own hardcoded English, which would be the only untranslated
   * string in an otherwise fully localized family.
   */
  requiredError: string;
  /** Range message below the minimum; `{{min}}` is the declared bound. */
  minError: string;
  /** Range message above the maximum; `{{max}}` is the declared bound. */
  maxError: string;
}

export const GUARDRAIL_FORM_EN_LABELS: GuardrailValidatorFormLabels = {
  moreInformation: 'More information',
  enumPlaceholder: 'Select...',
  enumListPlaceholder: 'Select options...',
  addItem: 'Add',
  removeItem: 'Remove {{label}} {{position}}',
  requiredError: 'Value is required',
  minError: 'Must be at least {{min}}',
  maxError: 'Must be at most {{max}}',
};

/**
 * Chrome strings of the guardrail builder screen (labels, placeholders, buttons, banners,
 * and the builder's own validation messages — it gates its own Save, so the messages ship
 * with it; hosts override per string via `labels` or per field via `errors`). Domain strings
 * (`definition.displayName`, `usageNote`, `otherAppliedScopes` labels) stay pre-resolved,
 * whether the host resolved them or `enrichGuardrailDefinitions` did.
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
  /** Shown on a parameter whose value falls outside its declared `min`/`max`. */
  parameterOutOfRangeError: string;
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
  parameterOutOfRangeError: 'Value is out of range',
  scopesRequiredError: 'At least one scope is required',
  toolsRequiredError: 'At least one tool is required',
  blockReasonRequiredError: 'Block reason is required',
  filterFieldsRequiredError: 'Fields selection is required',
  recipientRequiredError: 'Recipient is required',
  actionAppRequiredError: 'Action app is required',
};

// One merge for every label set: English defaults, then the catalog, then the host's
// overrides, skipping `undefined` so a partial source never blanks a string.
function mergeLabels<T extends object>(
  defaults: T,
  catalog?: Partial<T>,
  overrides?: Partial<T>
): T {
  const merged: T = { ...defaults };
  for (const source of [catalog, overrides]) {
    if (!source) continue;
    for (const key of Object.keys(merged) as Array<keyof T>) {
      const value = source[key];
      // `Partial<T>[keyof T]` is `T[keyof T] | undefined`; TS cannot follow the narrowing
      // through a generic index, hence the assertion.
      if (value !== undefined) merged[key] = value as T[keyof T];
    }
  }
  return merged;
}

/** Merge English defaults, a loaded catalog, and per-string overrides (undefined skipped). */
export function resolveGuardrailBuilderLabels(
  catalog?: Partial<GuardrailBuilderLabels>,
  overrides?: Partial<GuardrailBuilderLabels>
): GuardrailBuilderLabels {
  return mergeLabels(GUARDRAIL_BUILDER_EN_LABELS, catalog, overrides);
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
  return mergeLabels(GUARDRAIL_FORM_EN_LABELS, catalog, overrides);
}

// Reifies each ICU placeholder back into the `{{token}}` template convention: the
// localized strings cross into plain-string template APIs (`formatGuardrailFormMessage`,
// wind's `formatTemplate`) as data, while translators work with standard ICU placeholders.
// Every token any message here interpolates must be listed: lingui substitutes an absent one
// with the empty string, so a missing entry does not fail — it silently drops the value out of
// the translated message ("Must be at most 1" renders as "Must be at most ").
//
// One map for every label set; a token a message never declares is inert.
const TEMPLATE_TOKENS = {
  name: '{{name}}',
  label: '{{label}}',
  position: '{{position}}',
  min: '{{min}}',
  max: '{{max}}',
  policyName: '{{policyName}}',
};

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
          requiredError: _({
            id: 'guardrails.form.required-error',
            message: 'Value is required',
          }),
          minError: _({
            id: 'guardrails.form.min-error',
            message: 'Must be at least {min}',
            values: TEMPLATE_TOKENS,
          }),
          maxError: _({
            id: 'guardrails.form.max-error',
            message: 'Must be at most {max}',
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
          parameterOutOfRangeError: _({
            id: 'guardrails.builder.parameter-out-of-range-error',
            message: 'Value is out of range',
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

/**
 * Chrome strings of the centralized (governance) guardrails section and its read-only
 * details. Domain strings stay elsewhere: a validator's name and description come from
 * `definitions-copy.ts`, a BYO configuration's from the connector's own definition.
 */
export interface CentralizedGuardrailsLabels {
  /** Section heading. */
  title: string;
  /** Body of the section's info popover. */
  info: string;
  /** Link text inside the info popover; rendered only when the host passes `docsHref`. */
  docsLink: string;
  /** Caption under the heading; `{{policyName}}` is emphasized where it lands. */
  policyCaption: string;
  /** Accessible name of a row; `{{name}}` is the guardrail's display name. */
  viewDetails: string;
  // Row and detail fields
  guardrailType: string;
  policyField: string;
  provider: string;
  description: string;
  noDescription: string;
  executionStage: string;
  scopes: string;
  action: string;
  configuration: string;
  /** Advisory shown above the read-only details. */
  managedMessage: string;
  // Origin chips
  originByo: string;
  originUiPath: string;
  // Configuration problems: a short chip label, and the message that says what to do
  statusMissingConfig: string;
  statusDisabledConfig: string;
  missingConfigMessage: string;
  disabledConfigMessage: string;
  // Scopes and actions, reused from the builder's own ids (see the builder note below)
  scopeAgent: string;
  scopeLlm: string;
  scopeTool: string;
  actionBlock: string;
  actionEscalate: string;
  actionFilter: string;
  actionLog: string;
  // Execution stages (open on the wire: an unknown stage renders raw)
  stagePre: string;
  stagePost: string;
  stageBoth: string;
  // Configuration values
  parameterEnabled: string;
  parameterDisabled: string;
  /** Fallback label for the entity list when no definition names it. */
  entitiesFallback: string;
  /** Fallback label for the threshold map when no definition names it. */
  thresholdsFallback: string;
}

/** The subset of `useSafeLingui`'s translator the centralized labels need. */
type CentralizedTranslate = (descriptor: {
  id: string;
  message: string;
  values?: Record<string, string>;
}) => string;

// One builder holds every `_({ id, message })` call, so the English defaults, the flat record
// the catalog test diffs and the runtime lingui path cannot drift. Same shape as
// `definitions-copy.ts`.
//
// The scope, action, type and description labels reuse the builder's ids rather than declaring
// `guardrails.centralized.*` twins: same string, and a second id would let the two drift.
function buildCentralizedGuardrailsLabels(_: CentralizedTranslate): CentralizedGuardrailsLabels {
  return {
    title: _({ id: 'guardrails.centralized.title', message: 'Centralized guardrails' }),
    info: _({
      id: 'guardrails.centralized.info',
      message:
        "Your organization's AI Trust Layer governance policy enforces these guardrails. You cannot edit them here.",
    }),
    docsLink: _({
      id: 'guardrails.centralized.docs-link',
      message: 'View centralized guardrails documentation',
    }),
    policyCaption: _({
      id: 'guardrails.centralized.policy-caption',
      message: 'Enforced by AI Trust Layer policy: {policyName}',
      values: TEMPLATE_TOKENS,
    }),
    viewDetails: _({
      id: 'guardrails.centralized.view-details',
      message: 'View details for {name}',
      values: TEMPLATE_TOKENS,
    }),
    guardrailType: _({ id: 'guardrails.builder.type-label', message: 'Guardrail type' }),
    policyField: _({
      id: 'guardrails.centralized.policy-field',
      message: 'AI Trust Layer policy',
    }),
    provider: _({ id: 'guardrails.centralized.provider', message: 'Provider' }),
    description: _({
      id: 'guardrails.builder.description-label',
      message: 'Guardrail description',
    }),
    noDescription: _({
      id: 'guardrails.centralized.no-description',
      message: 'No description available.',
    }),
    executionStage: _({
      id: 'guardrails.centralized.execution-stage',
      message: 'Execution stage',
    }),
    scopes: _({ id: 'guardrails.builder.scopes-label', message: 'Scopes' }),
    action: _({ id: 'guardrails.centralized.action', message: 'Action' }),
    configuration: _({ id: 'guardrails.centralized.configuration', message: 'Configuration' }),
    managedMessage: _({
      id: 'guardrails.centralized.managed-message',
      message:
        "Your organization's AI Trust Layer governance policy manages this configuration. You cannot edit it here.",
    }),
    originByo: _({ id: 'guardrails.centralized.origin-byo', message: 'BYO' }),
    originUiPath: _({ id: 'guardrails.centralized.origin-uipath', message: 'UiPath managed' }),
    statusMissingConfig: _({
      id: 'guardrails.centralized.status-missing-config',
      message: 'Configuration missing',
    }),
    statusDisabledConfig: _({
      id: 'guardrails.centralized.status-disabled-config',
      message: 'Configuration disabled',
    }),
    missingConfigMessage: _({
      id: 'guardrails.centralized.missing-config-message',
      message:
        "This guardrail's configuration could not be found — it may have been deleted. Contact your administrator to fix the AI Trust Layer policy.",
    }),
    disabledConfigMessage: _({
      id: 'guardrails.centralized.disabled-config-message',
      message:
        "This guardrail's configuration has been disabled. Contact your administrator to re-enable it.",
    }),
    scopeAgent: _({ id: 'guardrails.builder.scope-agent-label', message: 'Agent' }),
    scopeLlm: _({ id: 'guardrails.builder.scope-llm-label', message: 'LLM calls' }),
    scopeTool: _({ id: 'guardrails.builder.scope-tool-label', message: 'Tools' }),
    actionBlock: _({ id: 'guardrails.builder.action-block-label', message: 'Block' }),
    actionEscalate: _({ id: 'guardrails.builder.action-escalate-label', message: 'Escalate' }),
    actionFilter: _({ id: 'guardrails.builder.action-filter-label', message: 'Filter' }),
    actionLog: _({ id: 'guardrails.builder.action-log-label', message: 'Log' }),
    stagePre: _({ id: 'guardrails.centralized.stage-pre', message: 'Pre-execution' }),
    stagePost: _({ id: 'guardrails.centralized.stage-post', message: 'Post-execution' }),
    stageBoth: _({ id: 'guardrails.centralized.stage-both', message: 'Pre & post-execution' }),
    parameterEnabled: _({ id: 'guardrails.centralized.parameter-enabled', message: 'Enabled' }),
    parameterDisabled: _({ id: 'guardrails.centralized.parameter-disabled', message: 'Disabled' }),
    entitiesFallback: _({
      id: 'guardrails.centralized.entities-fallback',
      message: 'Entities to detect',
    }),
    thresholdsFallback: _({
      id: 'guardrails.centralized.thresholds-fallback',
      message: 'Detection thresholds',
    }),
  };
}

// Resolves a descriptor the way lingui does with `values: TEMPLATE_TOKENS`, so the English
// defaults carry the same `{{token}}` convention as a translated catalog entry.
const englishCentralizedTranslate: CentralizedTranslate = ({ message, values }) =>
  values
    ? message.replace(/\{(\w+)\}/g, (match, token: string) => values[token] ?? match)
    : message;

/** The English chrome strings, resolved without a lingui provider. */
export const CENTRALIZED_GUARDRAILS_EN_LABELS: CentralizedGuardrailsLabels =
  buildCentralizedGuardrailsLabels(englishCentralizedTranslate);

/**
 * The same strings flattened to message id to ICU source message, the form the catalogs store:
 * the i18n test compares these against `locales/en.json` verbatim.
 */
export const CENTRALIZED_GUARDRAILS_EN_MESSAGES: Readonly<Record<string, string>> = Object.freeze(
  (() => {
    const messages: Record<string, string> = {};
    buildCentralizedGuardrailsLabels((descriptor) => {
      messages[descriptor.id] = descriptor.message;
      return descriptor.message;
    });
    return messages;
  })()
);

/** Merge English defaults, a loaded catalog, and per-string overrides (undefined skipped). */
export function resolveCentralizedGuardrailsLabels(
  catalog?: Partial<CentralizedGuardrailsLabels>,
  overrides?: Partial<CentralizedGuardrailsLabels>
): CentralizedGuardrailsLabels {
  return mergeLabels(CENTRALIZED_GUARDRAILS_EN_LABELS, catalog, overrides);
}

/** Localized chrome strings of the centralized section; per-string `overrides` always win. */
export function useCentralizedGuardrailsLabels(
  overrides?: Partial<CentralizedGuardrailsLabels>
): CentralizedGuardrailsLabels {
  const { _ } = useSafeLingui();
  return useMemo(
    () => resolveCentralizedGuardrailsLabels(buildCentralizedGuardrailsLabels(_), overrides),
    [_, overrides]
  );
}
