import type { GuardrailDefinitionWire } from '../definitions-wire';

/**
 * Wire payloads shaped like what `GET /api/execution/guardrails/definitions` actually
 * returns, trimmed to the fields the definitions layer reads. Kept close to the real
 * payload (option lists, threshold bounds, BYO fields) so the enrichment tests exercise the
 * same shapes the products see.
 */

/** The 25 PII entities the backend offers today. */
export const PII_ENTITY_OPTIONS: string[] = [
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
  'NOIdentityNumber',
  'FINationalID',
  'FIPassportNumber',
  'SENationalID',
  'DKPersonalIdentificationNumber',
  'NLCitizensServiceNumber',
  'URL',
  'IPAddress',
];

export const PII_DETECTION_WIRE: GuardrailDefinitionWire = {
  validator: 'pii_detection',
  allowedScopes: ['Agent', 'Llm', 'Tool'],
  status: 'Available',
  parameters: [
    {
      id: 'entities',
      type: 'enum-list',
      required: true,
      defaultValue: ['Email', 'CreditCardNumber'],
      options: PII_ENTITY_OPTIONS,
    },
    {
      // The backend omits the bounds here, and enrichment leaves them off: only `step` is
      // defaulted. See the map-enum branch in `definitions-enrich.ts`.
      id: 'entityThresholds',
      type: 'map-enum',
      required: false,
      defaultValue: { Email: 0.8, CreditCardNumber: 0.8 },
      keySource: 'entities',
    },
  ],
};

export const HARMFUL_CONTENT_WIRE: GuardrailDefinitionWire = {
  validator: 'harmful_content',
  allowedScopes: ['Llm', 'Tool'],
  status: 'Available',
  parameters: [
    {
      id: 'harmfulContentEntities',
      type: 'enum-list',
      required: true,
      defaultValue: ['Hate', 'Violence'],
      options: ['Hate', 'SelfHarm', 'Sexual', 'Violence'],
    },
    {
      id: 'harmfulContentEntityThresholds',
      type: 'map-enum',
      required: false,
      defaultValue: { Hate: 2, Violence: 2 },
      keySource: 'harmfulContentEntities',
      min: 0,
      max: 6,
      step: 2,
    },
  ],
};

export const PROMPT_INJECTION_WIRE: GuardrailDefinitionWire = {
  validator: 'prompt_injection',
  allowedScopes: ['Llm'],
  status: 'Available',
  parameters: [
    {
      id: 'threshold',
      type: 'number',
      required: true,
      defaultValue: 0.7,
      min: 0,
      max: 1,
      step: 0.1,
    },
  ],
};

export const USER_PROMPT_ATTACKS_WIRE: GuardrailDefinitionWire = {
  validator: 'user_prompt_attacks',
  allowedScopes: ['Llm'],
  status: 'Available',
  parameters: [],
};

export const INTELLECTUAL_PROPERTY_WIRE: GuardrailDefinitionWire = {
  validator: 'intellectual_property',
  allowedScopes: ['Llm', 'Tool'],
  status: 'FeatureDisabled',
  parameters: [
    {
      id: 'ipEntities',
      type: 'enum-list',
      required: true,
      defaultValue: ['Text'],
      options: ['Text', 'Code'],
    },
  ],
};

export const LLM_AS_JUDGE_WIRE: GuardrailDefinitionWire = {
  validator: 'llm_as_judge',
  allowedScopes: ['Agent', 'Llm', 'Tool'],
  status: 'Available',
  parameters: [
    {
      id: 'guardrailText',
      type: 'text',
      required: true,
      defaultValue: null,
      maxLength: 4000,
    },
    {
      id: 'model',
      type: 'enum',
      required: true,
      defaultValue: null,
      options: ['gpt-4o-mini-2024-07-18', 'gpt-4o-2024-11-20'],
    },
    {
      // Agents' schema has no `defaultValue` for text-list at all; this mirrors that.
      id: 'positiveExamples',
      type: 'text-list',
      required: false,
      maxItems: 5,
      maxLength: 1000,
    },
    {
      id: 'negativeExamples',
      type: 'text-list',
      required: false,
      defaultValue: null,
      maxItems: 5,
      maxLength: 1000,
    },
    {
      id: 'threshold',
      type: 'number',
      required: true,
      defaultValue: 4,
      min: 0,
      max: 6,
      step: 2,
    },
  ],
};

/** The four labels Azure AI Language returns. */
export const SENTIMENT_OPTIONS: string[] = ['Positive', 'Neutral', 'Negative', 'Mixed'];

/** The language codes the sentiment validator scores, spelled as the backend sends them. */
export const SENTIMENT_LANGUAGE_OPTIONS: string[] = [
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt-BR',
  'pt-PT',
  'nl',
  'sv',
  'da',
  'no',
  'fi',
  'pl',
  'cs',
  'ru',
  'uk',
  'tr',
  'el',
  'he',
  'ar',
  'hi',
  'ja',
  'ko',
  'zh-hans',
  'zh-hant',
  'id',
  'vi',
  'th',
];

export const SENTIMENT_WIRE: GuardrailDefinitionWire = {
  validator: 'sentiment',
  allowedScopes: ['Llm'],
  status: 'Available',
  parameters: [
    {
      id: 'sentiments',
      type: 'enum-list',
      required: true,
      defaultValue: ['Negative'],
      options: SENTIMENT_OPTIONS,
    },
    {
      // No bounds on the wire: the backend relies on the 0..1 step 0.1 the editors default to.
      id: 'sentimentThresholds',
      type: 'map-enum',
      required: true,
      defaultValue: { Positive: 0.5, Neutral: 0.5, Negative: 0.5, Mixed: 0.5 },
      keySource: 'sentiments',
    },
    {
      id: 'language',
      type: 'enum-list',
      required: false,
      defaultValue: ['en'],
      options: SENTIMENT_LANGUAGE_OPTIONS,
    },
  ],
};

/** The question packs the Jev classifier offers, in the backend's order. */
export const JEV_QUESTION_PACK_OPTIONS: string[] = [
  'custom',
  'pii',
  'harmful_content',
  'prompt_injection',
  'intellectual_property',
  'secrets_and_credentials',
  'compliance_commitments',
  'scope_and_conduct',
  'unsafe_tool_use',
  'code_safety',
];

/**
 * As UiPath/Agents#6449 declares it. The backend labels `questionPack` and `jevModel` itself;
 * `questions` and `threshold` come with no copy.
 */
export const JEV_CLASSIFIER_WIRE: GuardrailDefinitionWire = {
  validator: 'jev_classifier',
  allowedScopes: ['Agent', 'Llm', 'Tool'],
  status: 'Available',
  parameters: [
    {
      id: 'questionPack',
      type: 'enum',
      required: true,
      defaultValue: 'custom',
      displayName: 'Question pack',
      description:
        "A curated set of yes/no questions Jev evaluates against the payload. Pick a predefined pack or 'Custom' to use only your own questions.",
      options: JEV_QUESTION_PACK_OPTIONS,
      optionLabels: {
        custom: 'Custom (own questions only)',
        pii: 'PII',
        harmful_content: 'Harmful content',
        prompt_injection: 'Prompt injection',
        intellectual_property: 'Intellectual property',
        secrets_and_credentials: 'Secrets & credentials',
        compliance_commitments: 'Compliance & commitments',
        scope_and_conduct: 'Scope & conduct',
        unsafe_tool_use: 'Unsafe tool use',
        code_safety: 'Code safety',
      },
    },
    {
      id: 'questions',
      type: 'text-list',
      required: false,
      defaultValue: [],
      maxItems: 10,
      maxLength: 500,
    },
    {
      id: 'threshold',
      type: 'number',
      required: false,
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
    },
    {
      id: 'jevModel',
      type: 'enum',
      required: false,
      defaultValue: 'jev-1.13.0',
      displayName: 'Model',
      options: ['jev-1.13.0'],
    },
  ],
};

/** A bring-your-own guardrail: manifest copy only, no curated table entry applies. */
export const BYO_WIRE: GuardrailDefinitionWire = {
  validator: 'pii_detection',
  allowedScopes: ['Llm'],
  status: 'Available',
  displayName: 'Acme PII scan',
  description: 'Runs the Acme detector over prompts and completions.',
  byoValidatorName: 'acme-pii',
  byoConnectorName: 'Acme AI Guardrails',
  byoConnectorKey: 'acme',
  byoGuardrailConnectionId: 'conn-1',
  byoConfigurationId: 'cfg-1',
  parameters: [
    {
      id: 'sensitivity',
      type: 'enum',
      required: true,
      defaultValue: 'medium',
      displayName: 'Sensitivity',
      description: 'How aggressively to flag.',
      options: ['low', 'medium', 'high'],
      optionLabels: { low: 'Low', high: 'High' },
    },
  ],
};

/** A UiPath validator the curated table has never heard of. */
export const UNCURATED_WIRE: GuardrailDefinitionWire = {
  validator: 'topic_drift',
  allowedScopes: ['Llm'],
  status: 'Available',
  parameters: [
    { id: 'maxDriftScore', type: 'number', required: true, defaultValue: 0.5 },
    {
      id: 'allowedTopics',
      type: 'enum-list',
      required: false,
      defaultValue: [],
      options: ['finance', 'legal'],
    },
  ],
};

export const ALL_BUILT_IN_WIRE: GuardrailDefinitionWire[] = [
  PII_DETECTION_WIRE,
  PROMPT_INJECTION_WIRE,
  HARMFUL_CONTENT_WIRE,
  USER_PROMPT_ATTACKS_WIRE,
  INTELLECTUAL_PROPERTY_WIRE,
  LLM_AS_JUDGE_WIRE,
  SENTIMENT_WIRE,
  JEV_CLASSIFIER_WIRE,
];

/**
 * A raw payload as it arrives over the wire: unknown keys the backend added, one entry that
 * fails validation, and the empty display strings Flow's schema normalizes away.
 */
export const RAW_PAYLOAD_WITH_NOISE: unknown = [
  {
    ...PROMPT_INJECTION_WIRE,
    // Fields a newer backend added that this package does not model.
    executionStage: 'PreLlm',
    internalRanking: 3,
    displayName: '',
    description: '',
  },
  {
    // Missing `status`, so the whole definition is dropped.
    validator: 'broken_validator',
    allowedScopes: ['Llm'],
    parameters: [],
  },
  USER_PROMPT_ATTACKS_WIRE,
];
