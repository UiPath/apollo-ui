/**
 * Raw guardrail definitions for the six UiPath-managed validators, as the API sends them.
 *
 * Hand-derived from the backend's `OutOfTheBoxGuardrailDefinitions.cs` and
 * `OutOfTheBoxGuardrailDefinitionDto.cs`, so these are deterministic and carry no tenant data.
 * Two details are faithful to the DTO rather than convenient, and both are load-bearing:
 *
 * - No built-in carries `displayName`, `description` or `optionLabels`. The DTO marks the
 *   validator's friendly name `[JsonIgnore]` and the definitions never set the others, which is
 *   the whole reason the curated catalog exists.
 * - `payloadMinSizeLimit` / `payloadMaxSizeLimit` are `int?` *without* `WhenWritingNull`, so they
 *   serialize as an explicit `null` when unset. The parser has to normalize that to `undefined`.
 *
 * Deliberately untyped: these are parser *inputs*, and typing them as the parsed shape would
 * defeat the point.
 */

/** The 25 entities the backend offers when Nordic/Dutch detection is enabled. */
export const PII_ENTITY_OPTIONS = [
  'Person',
  'Address',
  'Date',
  'PhoneNumber',
  'EugpsCoordinates',
  'Email',
  'CreditCardNumber',
  'InternationalBankingAccountNumber',
  'SwiftCode',
  'ABARoutingNumber',
  'USDriversLicenseNumber',
  'UKDriversLicenseNumber',
  'USIndividualTaxpayerIdentification',
  'UKUniqueTaxpayerNumber',
  'USBankAccountNumber',
  'USSocialSecurityNumber',
  'UsukPassportNumber',
  'URL',
  'IPAddress',
  'NOIdentityNumber',
  'FINationalID',
  'FIPassportNumber',
  'SENationalID',
  'DKPersonalIdentificationNumber',
  'NLCitizensServiceNumber',
];

const HARMFUL_CONTENT_ENTITIES = ['Hate', 'SelfHarm', 'Sexual', 'Violence'];

const uniformThresholds = (keys: string[], value: number): Record<string, number> =>
  Object.fromEntries(keys.map((key) => [key, value]));

/** Stage values stay unvalidated strings on purpose, so a new backend stage cannot reject a row. */
const ALL_SCOPES_PRE_AND_POST = {
  Agent: ['PreExecution', 'PostExecution'],
  Llm: ['PreExecution', 'PostExecution'],
  Tool: ['PreExecution', 'PostExecution'],
};

export const WIRE_PII_DETECTION = {
  validator: 'pii_detection',
  allowedScopes: ['Agent', 'Llm', 'Tool'],
  guardrailStages: ALL_SCOPES_PRE_AND_POST,
  parameters: [
    {
      id: 'entities',
      type: 'enum-list',
      defaultValue: ['Email', 'Address'],
      required: true,
      options: PII_ENTITY_OPTIONS,
    },
    {
      // No min/max/step from the backend: these are the thresholds that render as an
      // unconstrained number input unless enrichment supplies the 0-to-1 scale.
      id: 'entityThresholds',
      type: 'map-enum',
      defaultValue: uniformThresholds(PII_ENTITY_OPTIONS, 0.5),
      required: true,
      keySource: 'entities',
    },
  ],
  payloadMinSizeLimit: null,
  payloadMaxSizeLimit: null,
  status: 'Available',
  isByogSubscription: false,
};

export const WIRE_PROMPT_INJECTION = {
  validator: 'prompt_injection',
  allowedScopes: ['Llm'],
  guardrailStages: { Llm: ['PreExecution'] },
  parameters: [
    {
      id: 'threshold',
      type: 'number',
      defaultValue: 0.5,
      required: false,
      step: 0.1,
      min: 0,
      max: 1,
    },
  ],
  payloadMinSizeLimit: null,
  payloadMaxSizeLimit: null,
  status: 'Available',
  isByogSubscription: false,
};

export const WIRE_HARMFUL_CONTENT = {
  validator: 'harmful_content',
  allowedScopes: ['Agent', 'Llm', 'Tool'],
  guardrailStages: ALL_SCOPES_PRE_AND_POST,
  parameters: [
    {
      id: 'harmfulContentEntities',
      type: 'enum-list',
      defaultValue: ['Hate', 'SelfHarm'],
      required: true,
      options: HARMFUL_CONTENT_ENTITIES,
    },
    {
      id: 'harmfulContentEntityThresholds',
      type: 'map-enum',
      defaultValue: uniformThresholds(HARMFUL_CONTENT_ENTITIES, 2),
      required: true,
      keySource: 'harmfulContentEntities',
      step: 2,
      min: 0,
      max: 6,
    },
  ],
  payloadMinSizeLimit: null,
  payloadMaxSizeLimit: 10000,
  status: 'Available',
  isByogSubscription: false,
};

export const WIRE_INTELLECTUAL_PROPERTY = {
  validator: 'intellectual_property',
  allowedScopes: ['Llm', 'Agent'],
  guardrailStages: { Llm: ['PostExecution'], Agent: ['PostExecution'] },
  parameters: [
    {
      id: 'ipEntities',
      type: 'enum-list',
      defaultValue: ['Text'],
      required: true,
      options: ['Text', 'Code'],
    },
  ],
  payloadMinSizeLimit: 111,
  payloadMaxSizeLimit: 10000,
  status: 'Available',
  isByogSubscription: false,
};

export const WIRE_USER_PROMPT_ATTACKS = {
  validator: 'user_prompt_attacks',
  allowedScopes: ['Llm'],
  guardrailStages: { Llm: ['PreExecution'] },
  parameters: [],
  payloadMinSizeLimit: null,
  payloadMaxSizeLimit: 10000,
  status: 'Available',
  isByogSubscription: false,
};

export const WIRE_LLM_AS_JUDGE = {
  validator: 'llm_as_judge',
  allowedScopes: ['Agent', 'Llm', 'Tool'],
  guardrailStages: ALL_SCOPES_PRE_AND_POST,
  parameters: [
    // The judging criteria are user-authored, hence the empty default.
    { id: 'guardrailText', type: 'text', defaultValue: '', required: true, maxLength: 4000 },
    // Empty options and empty default: the `enum` discriminator is the signal for a host
    // `renderParameter` override (a model picker) to take this parameter over.
    { id: 'model', type: 'enum', defaultValue: '', options: [], required: true },
    {
      id: 'positiveExamples',
      type: 'text-list',
      defaultValue: [],
      required: false,
      maxItems: 2,
      maxLength: 1000,
    },
    {
      id: 'negativeExamples',
      type: 'text-list',
      defaultValue: [],
      required: false,
      maxItems: 2,
      maxLength: 1000,
    },
    { id: 'threshold', type: 'number', defaultValue: 2, required: false, step: 2, min: 0, max: 6 },
  ],
  payloadMinSizeLimit: null,
  payloadMaxSizeLimit: null,
  status: 'Available',
  isByogSubscription: false,
};

/** All six built-ins, in the order the backend's dictionary declares them. */
export const WIRE_BUILTIN_DEFINITIONS = [
  WIRE_PII_DETECTION,
  WIRE_PROMPT_INJECTION,
  WIRE_HARMFUL_CONTENT,
  WIRE_INTELLECTUAL_PROPERTY,
  WIRE_USER_PROMPT_ATTACKS,
  WIRE_LLM_AS_JUDGE,
];
