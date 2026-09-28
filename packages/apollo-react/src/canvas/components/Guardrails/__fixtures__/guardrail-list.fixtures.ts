import type { GuardrailListDefinition, GuardrailListItem } from '../list-types';

/**
 * Rows and definitions shaped like what the two products pass: one UiPath validator, one
 * bring-your-own validator resolved through a connector, and one custom guardrail with no
 * definition at all. Between them they cover every branch a row can take.
 */

export const PII_GUARDRAIL: GuardrailListItem = {
  id: 'g1',
  name: 'PII detection 1',
  description: 'Scans agent output for personal data.',
  $guardrailType: 'builtInValidator',
  selector: { scopes: ['Agent', 'Tool'], matchNames: ['Send email'] },
  action: { $actionType: 'log' },
  validatorType: 'pii_detection',
};

export const BYO_GUARDRAIL: GuardrailListItem = {
  id: 'g2',
  name: 'Noma prompt shield',
  $guardrailType: 'builtInValidator',
  selector: { scopes: ['Llm'] },
  action: { $actionType: 'block' },
  validatorType: 'byo',
  byoValidatorName: 'noma_prompt_injection',
};

export const CUSTOM_GUARDRAIL: GuardrailListItem = {
  id: 'g3',
  name: 'Blocked words',
  $guardrailType: 'custom',
  selector: { scopes: ['Tool'], matchNames: ['Send email'] },
  action: { $actionType: 'filter' },
};

export const GUARDRAILS: GuardrailListItem[] = [PII_GUARDRAIL, BYO_GUARDRAIL, CUSTOM_GUARDRAIL];

export const PII_DEFINITION: GuardrailListDefinition = {
  validator: 'pii_detection',
  status: 'Available',
};

export const BYO_DEFINITION: GuardrailListDefinition = {
  validator: 'byo',
  status: 'Available',
  byoValidatorName: 'noma_prompt_injection',
  byoConnectorName: 'Noma Security',
};

export const DEFINITIONS: GuardrailListDefinition[] = [PII_DEFINITION, BYO_DEFINITION];
