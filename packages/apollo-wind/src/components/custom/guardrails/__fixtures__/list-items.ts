import type { GuardrailListItem } from '../list-types';

/**
 * Guardrail records as the two products persist them, for the list section's tests and
 * stories. Field-for-field what `GuardrailsListingSection` (Agents) and `GuardrailsEditor`
 * (Flow) hand their rows, so a fixture drifting from the hosts is a review signal.
 *
 * The validators line up with `GOLDEN_ENRICHED_DEFINITIONS`, so the two fixtures can be used
 * together to exercise definition matching.
 */

export const CUSTOM_GUARDRAIL: GuardrailListItem = {
  id: 'gr-custom',
  $guardrailType: 'custom',
  name: 'Block refunds over 500',
  description: 'Deterministic rule set for refund limits',
  selector: { scopes: ['Tool'], matchNames: ['issue_refund'] },
  action: { $actionType: 'block' },
};

export const BUILT_IN_GUARDRAIL: GuardrailListItem = {
  id: 'gr-pii',
  $guardrailType: 'builtInValidator',
  name: 'PII detection',
  description: 'Detect personally identifiable information',
  validatorType: 'pii_detection',
  selector: { scopes: ['Agent', 'Llm'] },
  action: { $actionType: 'log' },
};

/** Matches the enriched `acme_toxicity` definition: Available, provider "Acme Security". */
export const BYO_GUARDRAIL: GuardrailListItem = {
  id: 'gr-byo',
  $guardrailType: 'builtInValidator',
  name: 'Acme toxicity',
  validatorType: 'acme_toxicity',
  byoValidatorName: 'acme-toxicity-v2',
  selector: { scopes: ['Llm'] },
  action: { $actionType: 'escalate' },
};

/** Matches the enriched `acme_pii` definition, whose configuration is Disabled. */
export const BYO_DISABLED_GUARDRAIL: GuardrailListItem = {
  id: 'gr-byo-disabled',
  $guardrailType: 'builtInValidator',
  name: 'Acme PII detector',
  validatorType: 'acme_pii',
  byoValidatorName: 'acme-pii-detector',
  selector: { scopes: ['Agent'] },
  action: { $actionType: 'log' },
};

/** No definition carries this validator name, so the catalog resolves it as unavailable. */
export const BYO_UNAVAILABLE_GUARDRAIL: GuardrailListItem = {
  id: 'gr-byo-gone',
  $guardrailType: 'builtInValidator',
  name: 'Retired scanner',
  validatorType: 'acme_retired',
  byoValidatorName: 'acme-retired-v0',
  selector: { scopes: ['Tool'], matchNames: ['send_email'] },
  action: { $actionType: 'block' },
};

/** Agents persists no id; the list falls back to the (unique) name. */
export const UNIDENTIFIED_GUARDRAIL: GuardrailListItem = {
  $guardrailType: 'builtInValidator',
  name: 'Prompt injection',
  validatorType: 'prompt_injection',
  selector: { scopes: ['Llm'] },
  action: { $actionType: 'block' },
};

export const GUARDRAIL_LIST_ITEMS: GuardrailListItem[] = [
  BUILT_IN_GUARDRAIL,
  CUSTOM_GUARDRAIL,
  BYO_GUARDRAIL,
];
