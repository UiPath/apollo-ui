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

/**
 * The chrome strings `GuardrailActionSection` and `EscalateActionFields` read, for hosts that
 * mount either on its own rather than through `GuardrailBuilder`.
 *
 * A `Pick` over the builder's own keys, resolved from the same `guardrails.builder.*` ids, so
 * the two paths cannot word the same string differently. `GuardrailBuilderLabels` is therefore
 * accepted wherever these are.
 */
export const GUARDRAIL_ACTION_LABEL_KEYS = [
  // Action section
  'actionTypeLabel',
  'actionLogLabel',
  'actionBlockLabel',
  'actionFilterLabel',
  'actionEscalateLabel',
  'severityLabel',
  'severityInfoLabel',
  'severityWarningLabel',
  'severityErrorLabel',
  'blockReasonLabel',
  'blockReasonPlaceholder',
  // Escalation
  'assignToLabel',
  'recipientUserLabel',
  'recipientGroupLabel',
  'recipientEmailLabel',
  'recipientGroupNameLabel',
  'recipientFallbackLabel',
  'userSearchPlaceholder',
  'groupSearchPlaceholder',
  'emailPlaceholder',
  'groupNamePlaceholder',
  'actionAppLabel',
  'appPickerUnavailable',
] as const satisfies ReadonlyArray<keyof GuardrailBuilderLabels>;

export type GuardrailActionLabelKey = (typeof GUARDRAIL_ACTION_LABEL_KEYS)[number];

export type GuardrailActionLabels = Pick<GuardrailBuilderLabels, GuardrailActionLabelKey>;

function pickGuardrailActionLabels(source: GuardrailBuilderLabels): GuardrailActionLabels {
  const picked = {} as GuardrailActionLabels;
  for (const key of GUARDRAIL_ACTION_LABEL_KEYS) picked[key] = source[key];
  return picked;
}

export const GUARDRAIL_ACTION_EN_LABELS: GuardrailActionLabels = pickGuardrailActionLabels(
  GUARDRAIL_BUILDER_EN_LABELS
);

/** Merge English defaults, a loaded catalog, and per-string overrides (undefined skipped). */
export function resolveGuardrailActionLabels(
  catalog?: Partial<GuardrailActionLabels>,
  overrides?: Partial<GuardrailActionLabels>
): GuardrailActionLabels {
  return mergeLabels(GUARDRAIL_ACTION_EN_LABELS, catalog, overrides);
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
const TEMPLATE_TOKENS = {
  name: '{{name}}',
  label: '{{label}}',
  position: '{{position}}',
  min: '{{min}}',
  max: '{{max}}',
  toolName: '{{toolName}}',
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

/** Localized chrome strings of the action section and its escalation fields; `overrides` win. */
export function useGuardrailActionLabels(
  overrides?: Partial<GuardrailActionLabels>
): GuardrailActionLabels {
  const catalog = useGuardrailBuilderLabels();
  return useMemo(
    () => resolveGuardrailActionLabels(pickGuardrailActionLabels(catalog), overrides),
    [catalog, overrides]
  );
}

/**
 * Chrome strings of the guardrail list section (header, add affordance, row actions, status
 * chips, BYO notices). Domain copy stays out: scope and action wording arrive through
 * `formatScopes` / `formatAction`, and the guardrail's own name and description are data.
 *
 * Values may contain `{{placeholder}}` tokens; interpolate with `formatGuardrailFormMessage`.
 */
export interface GuardrailListLabels {
  /** Section header title. */
  title: string;
  /** Header add-button label. */
  add: string;
  /** Line shown instead of the rows when the list is empty. */
  empty: string;
  /** Aria-label template of a row's drag handle: `{{name}}`. */
  reorderItem: string;
  /** Aria-label of a row's edit button, and the fallback for a row with no name. */
  editItem: string;
  /**
   * Aria-label template of a row's edit button, and of the row body when `rowActivatesEdit`
   * is set: `{{name}}`. Naming the row is what tells a screen reader which of a dozen
   * identical buttons it is on.
   */
  editRow: string;
  /** Aria-label of a row's remove button, and the fallback for a row with no name. */
  removeItem: string;
  /** Aria-label template of a row's remove button: `{{name}}`. */
  removeRow: string;
  /** Lifecycle badge on built-in-validator rows (rendered only with `previewChip`). */
  preview: string;
  /** Provenance badge on BYO rows (rendered only with `byoChip`). */
  byo: string;
  /** Prefix of the BYO connector line, rendered as `{provider}: {connector}`. */
  provider: string;
  /** Action badge text for a row whose action is missing or unrecognized. */
  actionUnknown: string;
  /** Row notice: the BYO configuration this guardrail points at was disabled. */
  byoDisabledNotice: string;
  /** Row notice: the BYO configuration this guardrail points at is gone. */
  byoUnavailableNotice: string;
  /** Status chip: the validator's feature flag is off tenant-wide. */
  statusFeatureDisabled: string;
  /** Status chip: the tenant is not entitled to the validator. */
  statusUnauthorized: string;
  /** Status chip: the (BYO) configuration is disabled. */
  statusDisabled: string;
  /** Status chip: no definition resolves for this row any more. */
  statusUnavailable: string;
  /** Administration chip on rows a governance policy owns. */
  administrationGovernance: string;
}

/** The subset of `useSafeLingui`'s translator the list labels need. */
type ListTranslate = (descriptor: {
  id: string;
  message: string;
  values?: Record<string, string>;
}) => string;

// One builder holds every `_({ id, message })` call, so the English defaults, the flat record
// the catalog test diffs and the runtime lingui path cannot drift, and `lingui extract` still
// sees static calls. Same shape as `definitions-copy.ts`.
function buildGuardrailListLabels(_: ListTranslate): GuardrailListLabels {
  return {
    title: _({ id: 'guardrails.list.title', message: 'Guardrails' }),
    add: _({ id: 'guardrails.list.add', message: 'Add' }),
    empty: _({ id: 'guardrails.list.empty', message: 'No guardrails configured' }),
    reorderItem: _({
      id: 'guardrails.list.reorder-item',
      message: 'Reorder guardrail {name}',
      values: TEMPLATE_TOKENS,
    }),
    editItem: _({ id: 'guardrails.list.edit-item', message: 'Edit guardrail' }),
    editRow: _({
      id: 'guardrails.list.edit-row',
      message: 'Edit {name}',
      values: TEMPLATE_TOKENS,
    }),
    removeItem: _({ id: 'guardrails.list.remove-item', message: 'Remove guardrail' }),
    removeRow: _({
      id: 'guardrails.list.remove-row',
      message: 'Remove {name}',
      values: TEMPLATE_TOKENS,
    }),
    preview: _({ id: 'guardrails.list.preview', message: 'Preview' }),
    byo: _({ id: 'guardrails.list.byo', message: 'BYO' }),
    provider: _({ id: 'guardrails.list.provider', message: 'Provider' }),
    actionUnknown: _({ id: 'guardrails.list.action-unknown', message: 'Unknown' }),
    byoDisabledNotice: _({
      id: 'guardrails.list.byo-disabled-notice',
      message:
        "This guardrail's configuration has been disabled and can no longer be used. Contact your administrator to re-enable the configuration or replace this guardrail before running the agent.",
    }),
    byoUnavailableNotice: _({
      id: 'guardrails.list.byo-unavailable-notice',
      message:
        "This guardrail's configuration is no longer available. Replace it before running the agent.",
    }),
    statusFeatureDisabled: _({
      id: 'guardrails.list.status-feature-disabled',
      message: 'Feature disabled',
    }),
    statusUnauthorized: _({
      id: 'guardrails.list.status-unauthorized',
      message: 'Unauthorized',
    }),
    statusDisabled: _({ id: 'guardrails.list.status-disabled', message: 'Disabled' }),
    statusUnavailable: _({ id: 'guardrails.list.status-unavailable', message: 'Unavailable' }),
    administrationGovernance: _({
      id: 'guardrails.list.administration-governance',
      message: 'Governance managed',
    }),
  };
}

// Resolves a descriptor the way lingui does with `values: TEMPLATE_TOKENS`, so the English
// defaults carry the same `{{token}}` convention as a translated catalog entry.
const englishListTranslate: ListTranslate = ({ message, values }) =>
  values
    ? message.replace(/\{(\w+)\}/g, (match, token: string) => values[token] ?? match)
    : message;

/** The English chrome strings, resolved without a lingui provider. */
export const GUARDRAIL_LIST_EN_LABELS: GuardrailListLabels =
  buildGuardrailListLabels(englishListTranslate);

/**
 * The same strings flattened to message id to the **ICU source message**, which is the form
 * the catalogs store: the parity test compares these against `locales/en.json` verbatim.
 */
export const GUARDRAIL_LIST_EN_MESSAGES: Readonly<Record<string, string>> = Object.freeze(
  (() => {
    const messages: Record<string, string> = {};
    buildGuardrailListLabels((descriptor) => {
      messages[descriptor.id] = descriptor.message;
      return descriptor.message;
    });
    return messages;
  })()
);

/** Merge English defaults, a loaded catalog, and per-string overrides (undefined skipped). */
export function resolveGuardrailListLabels(
  catalog?: Partial<GuardrailListLabels>,
  overrides?: Partial<GuardrailListLabels>
): GuardrailListLabels {
  return mergeLabels(GUARDRAIL_LIST_EN_LABELS, catalog, overrides);
}

/** Localized chrome strings of the list section; per-string `overrides` always win. */
export function useGuardrailListLabels(
  overrides?: Partial<GuardrailListLabels>
): GuardrailListLabels {
  const { _ } = useSafeLingui();
  return useMemo(
    () => resolveGuardrailListLabels(buildGuardrailListLabels(_), overrides),
    [_, overrides]
  );
}

/**
 * Chrome strings of the add-guardrail palette. Definition copy (display names, descriptions,
 * connector and folder names) is not localized here: it arrives resolved on the definitions,
 * from the canonical copy table or the wire.
 */
export interface GuardrailPaletteLabels {
  /** Accessible name of the palette region. */
  listAriaLabel: string;
  /** Create-custom entry, rendered only when the host wires `onCreateCustom`. */
  createCustom: string;
  createCustomDescription: string;
  /** Line shown instead of the entries when there is nothing to pick. */
  empty: string;
  /** Line shown while the definitions are in flight. */
  loading: string;
  /** Banner message when the definitions failed to load. */
  loadError: string;
  /** Heading of the trailing group of UiPath validators, shown only alongside BYO groups. */
  uipathGroup: string;
  /** Lifecycle chip on definition entries (rendered only with `previewChip`). */
  preview: string;
  /** Status chip on an entry the tenant is not entitled to. */
  statusUnauthorized: string;
}

/** The subset of `useSafeLingui`'s translator the palette labels need. */
type PaletteTranslate = (descriptor: { id: string; message: string }) => string;

// One builder holds every `_({ id, message })` call, so the English defaults, the flat record
// the catalog test diffs and the runtime lingui path cannot drift, and `lingui extract` still
// sees static calls. Same shape as `definitions-copy.ts`.
function buildGuardrailPaletteLabels(_: PaletteTranslate): GuardrailPaletteLabels {
  return {
    listAriaLabel: _({
      id: 'guardrails.palette.list-aria-label',
      message: 'Available guardrails',
    }),
    createCustom: _({ id: 'guardrails.palette.create-custom', message: 'Custom guardrail' }),
    createCustomDescription: _({
      id: 'guardrails.palette.create-custom-description',
      message: 'Create a guardrail with custom rules',
    }),
    empty: _({ id: 'guardrails.palette.empty', message: 'No guardrails available' }),
    loading: _({ id: 'guardrails.palette.loading', message: 'Loading...' }),
    loadError: _({
      id: 'guardrails.palette.load-error',
      message: 'Failed to load built-in validators',
    }),
    uipathGroup: _({ id: 'guardrails.palette.uipath-group', message: 'UiPath guardrails' }),
    preview: _({ id: 'guardrails.palette.preview', message: 'Preview' }),
    statusUnauthorized: _({
      id: 'guardrails.palette.status-unauthorized',
      message: 'Unauthorized',
    }),
  };
}

/** The English chrome strings, resolved without a lingui provider. */
export const GUARDRAIL_PALETTE_EN_LABELS: GuardrailPaletteLabels = buildGuardrailPaletteLabels(
  ({ message }) => message
);

/**
 * The same strings flattened to message id to the **ICU source message**, which is the form
 * the catalogs store: the parity test compares these against `locales/en.json` verbatim.
 */
export const GUARDRAIL_PALETTE_EN_MESSAGES: Readonly<Record<string, string>> = Object.freeze(
  (() => {
    const messages: Record<string, string> = {};
    buildGuardrailPaletteLabels((descriptor) => {
      messages[descriptor.id] = descriptor.message;
      return descriptor.message;
    });
    return messages;
  })()
);

/** Merge English defaults, a loaded catalog, and per-string overrides (undefined skipped). */
export function resolveGuardrailPaletteLabels(
  catalog?: Partial<GuardrailPaletteLabels>,
  overrides?: Partial<GuardrailPaletteLabels>
): GuardrailPaletteLabels {
  return mergeLabels(GUARDRAIL_PALETTE_EN_LABELS, catalog, overrides);
}

/** Localized chrome strings of the palette; per-string `overrides` always win. */
export function useGuardrailPaletteLabels(
  overrides?: Partial<GuardrailPaletteLabels>
): GuardrailPaletteLabels {
  const { _ } = useSafeLingui();
  return useMemo(
    () => resolveGuardrailPaletteLabels(buildGuardrailPaletteLabels(_), overrides),
    [_, overrides]
  );
}

/**
 * Chrome strings of the remove-guardrail confirmation dialog. Domain values stay out: the
 * guardrail and tool names are user data, and scopes arrive raw for the host's `formatScope`.
 *
 * Values may contain `{{placeholder}}` tokens; interpolate with `formatGuardrailFormMessage`.
 */
export interface GuardrailRemoveDialogLabels {
  title: string;
  /** The question itself; `{{name}}` is the guardrail name. */
  confirmPrompt: string;
  /** Heading above what a full removal also takes the guardrail off. */
  alsoApplicable: string;
  /** Scoped-removal line; `{{toolName}}` is the tool being detached. */
  removedForTool: string;
  /** Heading above what survives a scoped removal. */
  stillApplicable: string;
  /** Aria-label of the corner close button. */
  close: string;
  cancel: string;
  remove: string;
}

/** The subset of `useSafeLingui`'s translator the remove-dialog labels need. */
type RemoveDialogTranslate = (descriptor: {
  id: string;
  message: string;
  values?: Record<string, string>;
}) => string;

// One builder holds every `_({ id, message })` call, so the English defaults, the flat record
// the catalog test diffs and the runtime lingui path cannot drift, and `lingui extract` still
// sees static calls. Same shape as `definitions-copy.ts`.
function buildGuardrailRemoveDialogLabels(_: RemoveDialogTranslate): GuardrailRemoveDialogLabels {
  return {
    title: _({ id: 'guardrails.remove-dialog.title', message: 'Remove guardrail' }),
    confirmPrompt: _({
      id: 'guardrails.remove-dialog.confirm-prompt',
      message: 'Please, confirm you’d like to remove "{name}" guardrail',
      values: TEMPLATE_TOKENS,
    }),
    alsoApplicable: _({
      id: 'guardrails.remove-dialog.also-applicable',
      message: 'This guardrail is also applicable to:',
    }),
    removedForTool: _({
      id: 'guardrails.remove-dialog.removed-for-tool',
      message: 'The guardrail will be removed for tool "{toolName}".',
      values: TEMPLATE_TOKENS,
    }),
    stillApplicable: _({
      id: 'guardrails.remove-dialog.still-applicable',
      message: 'It will still be applicable to:',
    }),
    close: _({ id: 'guardrails.remove-dialog.close', message: 'Close' }),
    cancel: _({ id: 'guardrails.remove-dialog.cancel', message: 'Cancel' }),
    remove: _({ id: 'guardrails.remove-dialog.remove', message: 'Remove' }),
  };
}

// Resolves a descriptor the way lingui does with `values: TEMPLATE_TOKENS`, so the English
// defaults carry the same `{{token}}` convention as a translated catalog entry.
const englishRemoveDialogTranslate: RemoveDialogTranslate = ({ message, values }) =>
  values
    ? message.replace(/\{(\w+)\}/g, (match, token: string) => values[token] ?? match)
    : message;

/** The English chrome strings, resolved without a lingui provider. */
export const GUARDRAIL_REMOVE_DIALOG_EN_LABELS: GuardrailRemoveDialogLabels =
  buildGuardrailRemoveDialogLabels(englishRemoveDialogTranslate);

/**
 * The same strings flattened to message id to the **ICU source message**, which is the form
 * the catalogs store: the parity test compares these against `locales/en.json` verbatim.
 */
export const GUARDRAIL_REMOVE_DIALOG_EN_MESSAGES: Readonly<Record<string, string>> = Object.freeze(
  (() => {
    const messages: Record<string, string> = {};
    buildGuardrailRemoveDialogLabels((descriptor) => {
      messages[descriptor.id] = descriptor.message;
      return descriptor.message;
    });
    return messages;
  })()
);

/** Merge English defaults, a loaded catalog, and per-string overrides (undefined skipped). */
export function resolveGuardrailRemoveDialogLabels(
  catalog?: Partial<GuardrailRemoveDialogLabels>,
  overrides?: Partial<GuardrailRemoveDialogLabels>
): GuardrailRemoveDialogLabels {
  return mergeLabels(GUARDRAIL_REMOVE_DIALOG_EN_LABELS, catalog, overrides);
}

/** Localized chrome strings of the remove dialog; per-string `overrides` always win. */
export function useGuardrailRemoveDialogLabels(
  overrides?: Partial<GuardrailRemoveDialogLabels>
): GuardrailRemoveDialogLabels {
  const { _ } = useSafeLingui();
  return useMemo(
    () => resolveGuardrailRemoveDialogLabels(buildGuardrailRemoveDialogLabels(_), overrides),
    [_, overrides]
  );
}

/**
 * Chrome strings of the centralized section and its details. Validator names and descriptions
 * come from `definitions-copy.ts` or the connector.
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
  // Configuration problems
  statusUnavailable: string;
  statusDisabled: string;
  missingConfigMessage: string;
  disabledConfigMessage: string;
  // Scopes and actions
  scopeAgent: string;
  scopeLlm: string;
  scopeTool: string;
  actionBlock: string;
  actionEscalate: string;
  actionFilter: string;
  actionLog: string;
  // Execution stages
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
// Labels the builder or the list already declare reuse their ids, so the two cannot drift.
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
    provider: _({ id: 'guardrails.list.provider', message: 'Provider' }),
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
    originByo: _({ id: 'guardrails.list.byo', message: 'BYO' }),
    originUiPath: _({ id: 'guardrails.centralized.origin-uipath', message: 'UiPath managed' }),
    statusUnavailable: _({ id: 'guardrails.list.status-unavailable', message: 'Unavailable' }),
    statusDisabled: _({ id: 'guardrails.list.status-disabled', message: 'Disabled' }),
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
