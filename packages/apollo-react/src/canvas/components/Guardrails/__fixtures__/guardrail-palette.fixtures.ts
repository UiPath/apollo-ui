import type { GuardrailPaletteDefinition } from '../palette-types';

/**
 * Definitions shaped like what the two products pass a palette: UiPath validators (one of
 * them unauthorized), and bring-your-own validators across two connections, one of which has
 * no folder. Between them they cover every grouping and every chip branch.
 */

export const PII_DEFINITION: GuardrailPaletteDefinition = {
  validator: 'pii_detection',
  displayName: 'PII detection',
  description: 'Detects personally identifiable information in agent traffic.',
  status: 'Available',
};

export const PROMPT_ATTACKS_DEFINITION: GuardrailPaletteDefinition = {
  validator: 'user_prompt_attacks',
  displayName: 'Prompt attacks',
  description: 'Detects attempts to override the agent instructions.',
  status: 'Available',
};

export const UNAUTHORIZED_DEFINITION: GuardrailPaletteDefinition = {
  validator: 'harmful_content',
  displayName: 'Harmful content',
  description: 'Detects harmful content categories in agent traffic.',
  status: 'Unauthorised',
};

export const BYO_FOLDER_DEFINITION: GuardrailPaletteDefinition = {
  validator: 'byo',
  displayName: 'Noma prompt shield',
  description: 'Vendor-managed prompt injection detection.',
  status: 'Available',
  byoValidatorName: 'noma_prompt_injection',
  byoConnectorName: 'Noma Security',
  byoGuardrailConnectionId: 'connection-1',
  folderPath: 'Shared/Security',
};

/** The same validator name on a second connection: only the connection id keeps them apart. */
export const BYO_SECOND_CONNECTION_DEFINITION: GuardrailPaletteDefinition = {
  ...BYO_FOLDER_DEFINITION,
  displayName: 'Noma prompt shield (EU)',
  byoGuardrailConnectionId: 'connection-2',
  folderPath: 'Shared/Security EU',
};

/** No folder resolved, so the group falls back to the connector name. */
export const BYO_CONNECTOR_ONLY_DEFINITION: GuardrailPaletteDefinition = {
  validator: 'byo',
  displayName: 'Acme policy check',
  status: 'Available',
  byoValidatorName: 'acme_policy',
  byoConnectorName: 'Acme Guard',
  byoGuardrailConnectionId: 'connection-3',
};

export const UIPATH_DEFINITIONS: GuardrailPaletteDefinition[] = [
  PII_DEFINITION,
  PROMPT_ATTACKS_DEFINITION,
];

export const MIXED_DEFINITIONS: GuardrailPaletteDefinition[] = [
  PII_DEFINITION,
  BYO_FOLDER_DEFINITION,
  PROMPT_ATTACKS_DEFINITION,
  BYO_CONNECTOR_ONLY_DEFINITION,
];
