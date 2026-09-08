/**
 * Raw bring-your-own guardrail definitions, as `ByoGuardrailDefinitionsProvider` emits them.
 *
 * BYO is the mirror image of a built-in: the connector manifest supplies the display copy, so the
 * curated catalog must stay out of the way completely, at both the definition and the parameter
 * level. The three cases below are the ones that break naive implementations.
 */

/** A fully described, connected BYO guardrail. Manifest copy present at every level. */
export const WIRE_BYO_AVAILABLE = {
  validator: 'acme_toxicity',
  allowedScopes: ['Llm', 'Tool'],
  guardrailStages: { Llm: ['PreExecution'], Tool: ['PreExecution', 'PostExecution'] },
  parameters: [
    {
      id: 'sensitivity',
      type: 'enum',
      defaultValue: 'medium',
      required: true,
      options: ['low', 'medium', 'high'],
      optionLabels: { low: 'Low', medium: 'Medium', high: 'High' },
      displayName: 'Sensitivity',
      description: 'How aggressively Acme flags borderline content.',
    },
    {
      id: 'blockedTerms',
      type: 'text-list',
      required: false,
      maxItems: 50,
      maxLength: 120,
      displayName: 'Blocked terms',
    },
  ],
  status: 'Available',
  displayName: 'Acme Toxicity Filter',
  description: 'Acme Security toxicity classification.',
  byoValidatorName: 'acme-toxicity-v2',
  byoConnectorName: 'Acme Security',
  byoConnectorKey: 'uipath-acme-security',
  byoGuardrailConnectionId: '0f4c1e2a-6c31-4c07-9f2b-2c9a5d3e77b1',
  byoConfigurationId: 'b2ad9f18-5f7f-4a1d-8f2e-8a0d6c1f3b44',
  folderKey: '6b6b3f21-2d34-4a1e-9a77-1f7c0e6d5c92',
  isByogSubscription: true,
  payloadMinSizeLimit: null,
  payloadMaxSizeLimit: null,
};

/**
 * A configuration whose connection could not be resolved. `CreateDisabledDefinition` sets no
 * scopes and no parameters, so the DTO defaults fill both in: all three scopes, an empty
 * parameter list. It has to survive parsing, since it is what tells the user to fix the
 * connection.
 */
export const WIRE_BYO_DISABLED_MINIMAL = {
  validator: 'acme_pii',
  allowedScopes: ['Agent', 'Llm', 'Tool'],
  guardrailStages: {
    Agent: ['PreExecution', 'PostExecution'],
    Llm: ['PreExecution', 'PostExecution'],
    Tool: ['PreExecution', 'PostExecution'],
  },
  parameters: [],
  status: 'Disabled',
  displayName: 'acme-pii-detector',
  byoValidatorName: 'acme-pii-detector',
  byoGuardrailConnectionId: 'd41d8cd9-8f00-4b20-a204-9800998ecf84',
  byoConfigurationId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  isByogSubscription: true,
  payloadMinSizeLimit: null,
  payloadMaxSizeLimit: null,
};

/**
 * A BYO guardrail that declares `validator: "pii_detection"`, colliding with a built-in id. This
 * is legitimate, and it is why BYO is exempt from `hiddenValidators` and from curated copy: were
 * it not, this connector's guardrail would either vanish from a product that hides
 * `prompt_injection`-style validators, or silently render UiPath's PII copy over Acme's.
 */
export const WIRE_BYO_COLLIDING_VALIDATOR = {
  validator: 'pii_detection',
  allowedScopes: ['Llm'],
  parameters: [
    {
      id: 'entities',
      type: 'enum-list',
      defaultValue: ['Email'],
      required: true,
      options: ['Email', 'Person'],
      displayName: 'Acme entity set',
    },
  ],
  status: 'Available',
  displayName: 'Acme PII (third party)',
  description: 'Acme Security PII classification.',
  byoValidatorName: 'acme-pii-v1',
  byoConnectorName: 'Acme Security',
  byoGuardrailConnectionId: '0f4c1e2a-6c31-4c07-9f2b-2c9a5d3e77b1',
  isByogSubscription: true,
};

export const WIRE_BYO_DEFINITIONS = [
  WIRE_BYO_AVAILABLE,
  WIRE_BYO_DISABLED_MINIMAL,
  WIRE_BYO_COLLIDING_VALIDATOR,
];
