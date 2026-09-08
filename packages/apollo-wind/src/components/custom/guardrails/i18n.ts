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

/**
 * Layer sparse sources over a complete English default set, later source wins per key.
 * Only keys the defaults declare are copied, so a catalog carrying stale keys cannot inject
 * them, and an explicit `undefined` override falls through to the layer below.
 */
function mergeLabels<T extends object>(defaults: T, sources: Array<Partial<T> | undefined>): T {
  const merged: T = { ...defaults };
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(merged) as Array<keyof T>) {
      const value = source[key];
      if (value !== undefined) merged[key] = value;
    }
  }
  return merged;
}

/** Merge English defaults, a loaded catalog, and per-string overrides (undefined skipped). */
export function resolveGuardrailBuilderLabels(
  catalog?: Partial<GuardrailBuilderLabels>,
  overrides?: Partial<GuardrailBuilderLabels>
): GuardrailBuilderLabels {
  return mergeLabels(GUARDRAIL_BUILDER_EN_LABELS, [catalog, overrides]);
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
  return mergeLabels(GUARDRAIL_FORM_EN_LABELS, [catalog, overrides]);
}

/**
 * Chrome strings of the guardrail list section (header, row affordances, status chips, and
 * the two BYO row notices). Domain strings stay host-resolved: scope names and action types
 * are printed as given, or reshaped through the list's `formatScopes` / `formatAction` slots.
 *
 * Strings shared with the builder are referenced from `GUARDRAIL_BUILDER_EN_LABELS` rather
 * than retyped, so the two label sets cannot drift apart the way the two products' tables did.
 */
export interface GuardrailListLabels {
  headerTitle: string;
  addButton: string;
  emptyState: string;
  /** Aria-label template of a row's drag handle: `{{name}}`. */
  reorderHandleAriaLabel: string;
  /** Aria-label template of the whole row when `rowActivatesEdit` is set: `{{name}}`. */
  editRowAriaLabel: string;
  editButtonAriaLabel: string;
  deleteButtonAriaLabel: string;
  providerLabel: string;
  previewChip: string;
  originGovernanceChip: string;
  statusDisabledChip: string;
  statusUnauthorizedChip: string;
  statusFeatureDisabledChip: string;
  statusUnavailableChip: string;
  /** Row notice for a BYO guardrail whose configuration was disabled. */
  byoDisabledNotice: string;
  /** Row notice for a BYO guardrail whose configuration no longer exists. */
  byoUnavailableNotice: string;
  // Mixed scopes banner (shared with the builder)
  mixedScopesAlsoApplied: string;
  mixedScopesSaveAsNewHint: string;
}

export const GUARDRAIL_LIST_EN_LABELS: GuardrailListLabels = {
  headerTitle: 'Guardrails',
  addButton: 'Add',
  emptyState: 'No guardrails configured',
  reorderHandleAriaLabel: 'Reorder guardrail {{name}}',
  editRowAriaLabel: 'Edit guardrail {{name}}',
  editButtonAriaLabel: 'Edit guardrail',
  deleteButtonAriaLabel: 'Delete guardrail',
  providerLabel: 'Provider',
  previewChip: 'Preview',
  originGovernanceChip: 'Governance',
  statusDisabledChip: 'Disabled',
  statusUnauthorizedChip: 'Not entitled',
  statusFeatureDisabledChip: 'Feature disabled',
  statusUnavailableChip: 'Unavailable',
  byoDisabledNotice: GUARDRAIL_BUILDER_EN_LABELS.byoDisabledMessage,
  byoUnavailableNotice:
    "This guardrail's configuration is no longer available. Replace it before running the agent.",
  mixedScopesAlsoApplied: GUARDRAIL_BUILDER_EN_LABELS.mixedScopesAlsoApplied,
  mixedScopesSaveAsNewHint: GUARDRAIL_BUILDER_EN_LABELS.mixedScopesSaveAsNewHint,
};

/** Merge English defaults, a loaded catalog, and per-string overrides (undefined skipped). */
export function resolveGuardrailListLabels(
  catalog?: Partial<GuardrailListLabels>,
  overrides?: Partial<GuardrailListLabels>
): GuardrailListLabels {
  return mergeLabels(GUARDRAIL_LIST_EN_LABELS, [catalog, overrides]);
}
