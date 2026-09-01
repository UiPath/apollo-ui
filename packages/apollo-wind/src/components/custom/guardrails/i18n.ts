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
