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

/** The 134 the backend adds, also listed in `previewOptions`, while `EnablePreviewPiiEntities` is on. */
export const PREVIEW_PII_ENTITY_OPTIONS: string[] = [
  'Age',
  'Organization',
  'AzureDocumentDBAuthKey',
  'AzureIAASDatabaseConnectionAndSQLString',
  'AzureIoTConnectionString',
  'AzurePublishSettingPassword',
  'AzureRedisCacheString',
  'AzureSAS',
  'AzureServiceBusString',
  'AzureStorageAccountGeneric',
  'AzureStorageAccountKey',
  'SQLServerConnectionString',
  'ARNationalIdentityNumber',
  'AUBankAccountNumber',
  'AUBusinessNumber',
  'AUCompanyNumber',
  'AUDriversLicenseNumber',
  'AUMedicalAccountNumber',
  'AUPassportNumber',
  'AUTaxFileNumber',
  'ATIdentityCard',
  'ATTaxIdentificationNumber',
  'ATValueAddedTaxNumber',
  'BENationalNumber',
  'BEValueAddedTaxNumber',
  'BRCPFNumber',
  'BRLegalEntityNumber',
  'BRNationalIDRG',
  'BGUniformCivilNumber',
  'CABankAccountNumber',
  'CADriversLicenseNumber',
  'CAHealthServiceNumber',
  'CAPassportNumber',
  'CAPersonalHealthIdentification',
  'CASocialInsuranceNumber',
  'CLIdentityCardNumber',
  'CNResidentIdentityCardNumber',
  'HRIdentityCardNumber',
  'HRNationalIDNumber',
  'HRPersonalIdentificationNumber',
  'CYIdentityCard',
  'CYTaxIdentificationNumber',
  'CZPersonalIdentityNumber',
  'EEPersonalIdentificationCode',
  'EUDebitCardNumber',
  'EUDriversLicenseNumber',
  'EUNationalIdentificationNumber',
  'EUPassportNumber',
  'EUSocialSecurityNumber',
  'EUTaxIdentificationNumber',
  'FIEuropeanHealthNumber',
  'FRDriversLicenseNumber',
  'FRHealthInsuranceNumber',
  'FRNationalID',
  'FRPassportNumber',
  'FRSocialSecurityNumber',
  'FRTaxIdentificationNumber',
  'FRValueAddedTaxNumber',
  'DEDriversLicenseNumber',
  'DEIdentityCardNumber',
  'DEPassportNumber',
  'DETaxIdentificationNumber',
  'DEValueAddedNumber',
  'GRNationalIDCard',
  'GRTaxIdentificationNumber',
  'HKIdentityCardNumber',
  'HUPersonalIdentificationNumber',
  'HUTaxIdentificationNumber',
  'HUValueAddedNumber',
  'INPermanentAccount',
  'INUniqueIdentificationNumber',
  'IDIdentityCardNumber',
  'IEPersonalPublicServiceNumber',
  'ILBankAccountNumber',
  'ILNationalID',
  'ITDriversLicenseNumber',
  'ITFiscalCode',
  'ITValueAddedTaxNumber',
  'JPBankAccountNumber',
  'JPDriversLicenseNumber',
  'JPMyNumberCorporate',
  'JPMyNumberPersonal',
  'JPPassportNumber',
  'JPResidenceCardNumber',
  'JPResidentRegistrationNumber',
  'JPSocialInsuranceNumber',
  'LVPersonalCode',
  'LTPersonalCode',
  'LUNationalIdentificationNumberNatural',
  'LUNationalIdentificationNumberNonNatural',
  'MYIdentityCardNumber',
  'MTIdentityCardNumber',
  'MTTaxIDNumber',
  'NLTaxIdentificationNumber',
  'NLValueAddedTaxNumber',
  'NZBankAccountNumber',
  'NZDriversLicenseNumber',
  'NZInlandRevenueNumber',
  'NZMinistryOfHealthNumber',
  'NZSocialWelfareNumber',
  'PHUnifiedMultiPurposeIDNumber',
  'PLIdentityCard',
  'PLNationalID',
  'PLPassportNumber',
  'PLREGONNumber',
  'PLTaxIdentificationNumber',
  'PTCitizenCardNumber',
  'PTTaxIdentificationNumber',
  'ROPersonalNumericalCode',
  'RUPassportNumberDomestic',
  'RUPassportNumberInternational',
  'SANationalID',
  'SGNationalRegistrationIdentityCardNumber',
  'SKPersonalNumber',
  'SITaxIdentificationNumber',
  'SIUniqueMasterCitizenNumber',
  'ZAIdentificationNumber',
  'KRResidentRegistrationNumber',
  'ESDNI',
  'ESSocialSecurityNumber',
  'ESTaxIdentificationNumber',
  'SEPassportNumber',
  'SETaxIdentificationNumber',
  'CHSocialSecurityNumber',
  'TWNationalID',
  'TWPassportNumber',
  'TWResidentCertificate',
  'THPopulationIdentificationCode',
  'TRNationalIdentificationNumber',
  'UAPassportNumberDomestic',
  'UAPassportNumberInternational',
  'UKElectoralRollNumber',
  'UKNationalHealthNumber',
  'UKNationalInsuranceNumber',
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

/** `PII_DETECTION_WIRE` with `EnablePreviewPiiEntities` on. */
export const PII_DETECTION_PREVIEW_WIRE: GuardrailDefinitionWire = {
  ...PII_DETECTION_WIRE,
  parameters: PII_DETECTION_WIRE.parameters.map((param) =>
    param.type === 'enum-list'
      ? {
          ...param,
          options: [...PII_ENTITY_OPTIONS, ...PREVIEW_PII_ENTITY_OPTIONS],
          previewOptions: PREVIEW_PII_ENTITY_OPTIONS,
        }
      : param
  ),
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

/** The classifier question catalog's group ids, in the order the backend sends them. */
export const CLASSIFIER_CATEGORY_IDS: string[] = [
  'pii',
  'harmful_content',
  'prompt_injection',
  'intellectual_property',
  'secrets_and_credentials',
  'compliance_commitments',
  'scope_and_conduct',
];

/** Every predefined classifier question name, `ClassifierQuestionPacks.AllQuestionNames`. */
export const CLASSIFIER_QUESTION_NAMES: string[] = [
  'pii_contact_information',
  'pii_government_identifiers',
  'pii_financial_identifiers',
  'pii_health_information',
  'harmful_hate',
  'harmful_self_harm',
  'harmful_sexual',
  'harmful_violence',
  'harmful_illegal_activity',
  'injection_instruction_override',
  'injection_jailbreak',
  'injection_exfiltration',
  'injection_indirect',
  'ip_verbatim_text',
  'ip_proprietary_code',
  'secrets_api_keys_tokens',
  'secrets_passwords',
  'secrets_private_keys',
  'secrets_connection_strings',
  'compliance_financial_advice',
  'compliance_legal_medical_advice',
  'compliance_binding_commitments',
  'conduct_off_topic',
  'conduct_competitor_steering',
  'conduct_politics_religion',
  'conduct_profanity_abuse',
];

/**
 * Agents' `OutOfTheBoxGuardrailDefinitions.Classifier` (UiPath/Agents#6449), as the definitions
 * endpoint sends it. The wire describes `selectedQuestions`, `model` and `modelVendor` itself;
 * `questions` carries no copy.
 */
export const CLASSIFIER_WIRE: GuardrailDefinitionWire = {
  validator: 'classifier',
  allowedScopes: ['Agent', 'Llm', 'Tool'],
  status: 'Available',
  parameters: [
    {
      id: 'selectedQuestions',
      type: 'enum-list',
      required: false,
      defaultValue: [],
      options: CLASSIFIER_QUESTION_NAMES,
      displayName: 'Predefined questions',
      description:
        'Curated yes/no and severity questions the classifier evaluates against the payload. Pick any across categories, and/or add your own questions below.',
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
      id: 'questionThresholds',
      type: 'map-enum',
      required: false,
      defaultValue: {},
      keySource: 'selectedQuestions',
      step: 0.05,
      min: 0,
      max: 1,
    },
    {
      // No options: LLM Gateway's Model Hub owns the list, and the host's model picker finds it.
      id: 'model',
      type: 'enum',
      required: true,
      defaultValue: '',
      options: [],
      displayName: 'Model',
    },
    {
      id: 'modelVendor',
      type: 'text',
      required: true,
      defaultValue: '',
      displayName: 'Model vendor',
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
  CLASSIFIER_WIRE,
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
