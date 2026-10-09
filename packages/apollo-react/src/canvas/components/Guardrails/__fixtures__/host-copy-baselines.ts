import type { GuardrailCopyTable } from '../definitions-copy';

/**
 * The English validator copy each product ships today, transcribed into this package's copy
 * shape so `definitions-parity.test.ts` can diff all three tables mechanically.
 *
 * Sources, both read at the time this layer was written:
 *
 * - Agents `origin/main`:
 *   `frontend-sw/src/components/definition/AddGuardrailPalette/AddGuardrailPalette.utils.tsx`
 *   (`OOB_GUARDRAILS_I8N`; its `name` / `params[].infoTooltip` / `params[].options` map onto
 *   `displayName` / `paramTooltips` / `optionLabels` here). The `sentiment` entry is read from
 *   the same file, as UiPath/Agents#6457 added it.
 * - Flow `origin/develop`:
 *   `packages/canvas/src/components/properties-panel/guardrails/ootb-guardrail-definitions.ts`
 *   (`buildValidatorDisplayInfo`)
 *
 * Only the English defaults are transcribed, never the products' message keys: the whole
 * point of the shared table is that the keys stop mattering. When a product changes its copy,
 * update the baseline here and the parity test will say whether our choice still holds.
 */

/**
 * The 24 PII entity labels the two products spell identically. Shared rather than duplicated
 * because they genuinely are the same strings; the one entity they disagree about
 * (`FIPassportNumber`, Agents only) is added below.
 */
const SHARED_PII_ENTITY_LABELS: Record<string, string> = {
  Person: 'Person',
  Address: 'Address',
  Date: 'Date',
  PhoneNumber: 'Phone Number',
  EugpsCoordinates: 'EU GPS Coordinates',
  Email: 'Email',
  CreditCardNumber: 'Credit Card Number',
  InternationalBankingAccountNumber: 'International Banking Account Number (IBAN)',
  SwiftCode: 'SWIFT Code',
  ABARoutingNumber: 'ABA Routing Number',
  USDriversLicenseNumber: "US Driver's License Number",
  UKDriversLicenseNumber: "UK Driver's License Number",
  USIndividualTaxpayerIdentification: 'US Individual Taxpayer Identification Number (ITIN)',
  UKUniqueTaxpayerNumber: 'UK Unique Taxpayer Number (UTR)',
  USBankAccountNumber: 'US Bank Account Number',
  USSocialSecurityNumber: 'US Social Security Number (SSN)',
  UsukPassportNumber: 'US/UK Passport Number',
  NOIdentityNumber: 'Norway Identity Number',
  FINationalID: 'Finland National ID',
  SENationalID: 'Sweden National ID',
  DKPersonalIdentificationNumber: 'Danish Personal Identification Number',
  NLCitizensServiceNumber: 'Netherlands Citizens Service Number',
  URL: 'URL',
  IPAddress: 'IP Address',
};

/**
 * The preview PII entities only Agents labels so far (UiPath/Agents#6566, read from the same
 * file). The parity test declares them as single-host options until Flow ships them.
 */
export const AGENTS_PREVIEW_PII_ENTITY_LABELS: Record<string, string> = {
  Age: 'Age',
  Organization: 'Organization',
  AzureDocumentDBAuthKey: 'Azure Document DB Auth Key',
  AzureIAASDatabaseConnectionAndSQLString: 'Azure IaaS Database Connection and SQL String',
  AzureIoTConnectionString: 'Azure IoT Connection String',
  AzurePublishSettingPassword: 'Azure Publish Setting Password',
  AzureRedisCacheString: 'Azure Redis Cache String',
  AzureSAS: 'Azure SAS',
  AzureServiceBusString: 'Azure Service Bus String',
  AzureStorageAccountGeneric: 'Azure Storage Account Generic',
  AzureStorageAccountKey: 'Azure Storage Account Key',
  SQLServerConnectionString: 'SQL Server Connection String',
  ARNationalIdentityNumber: 'Argentina National Identity Number',
  AUBankAccountNumber: 'Australia Bank Account Number',
  AUBusinessNumber: 'Australia Business Number',
  AUCompanyNumber: 'Australia Company Number',
  AUDriversLicenseNumber: "Australia Driver's License Number",
  AUMedicalAccountNumber: 'Australia Medical Account Number',
  AUPassportNumber: 'Australia Passport Number',
  AUTaxFileNumber: 'Australia Tax File Number',
  ATIdentityCard: 'Austria Identity Card',
  ATTaxIdentificationNumber: 'Austria Tax Identification Number',
  ATValueAddedTaxNumber: 'Austria Value Added Tax Number',
  BENationalNumber: 'Belgium National Number',
  BEValueAddedTaxNumber: 'Belgium Value Added Tax Number',
  BRCPFNumber: 'Brazil CPF Number',
  BRLegalEntityNumber: 'Brazil Legal Entity Number',
  BRNationalIDRG: 'Brazil National ID (RG)',
  BGUniformCivilNumber: 'Bulgaria Uniform Civil Number',
  CABankAccountNumber: 'Canada Bank Account Number',
  CADriversLicenseNumber: "Canada Driver's License Number",
  CAHealthServiceNumber: 'Canada Health Service Number',
  CAPassportNumber: 'Canada Passport Number',
  CAPersonalHealthIdentification: 'Canada Personal Health Identification',
  CASocialInsuranceNumber: 'Canada Social Insurance Number',
  CLIdentityCardNumber: 'Chile Identity Card Number',
  CNResidentIdentityCardNumber: 'China Resident Identity Card Number',
  HRIdentityCardNumber: 'Croatia Identity Card Number',
  HRNationalIDNumber: 'Croatia National ID Number',
  HRPersonalIdentificationNumber: 'Croatia Personal Identification Number',
  CYIdentityCard: 'Cyprus Identity Card',
  CYTaxIdentificationNumber: 'Cyprus Tax Identification Number',
  CZPersonalIdentityNumber: 'Czech Republic Personal Identity Number',
  EEPersonalIdentificationCode: 'Estonia Personal Identification Code',
  EUDebitCardNumber: 'EU Debit Card Number',
  EUDriversLicenseNumber: "EU Driver's License Number",
  EUNationalIdentificationNumber: 'EU National Identification Number',
  EUPassportNumber: 'EU Passport Number',
  EUSocialSecurityNumber: 'EU Social Security Number',
  EUTaxIdentificationNumber: 'EU Tax Identification Number',
  FIEuropeanHealthNumber: 'Finland European Health Number',
  FRDriversLicenseNumber: "France Driver's License Number",
  FRHealthInsuranceNumber: 'France Health Insurance Number',
  FRNationalID: 'France National ID',
  FRPassportNumber: 'France Passport Number',
  FRSocialSecurityNumber: 'France Social Security Number',
  FRTaxIdentificationNumber: 'France Tax Identification Number',
  FRValueAddedTaxNumber: 'France Value Added Tax Number',
  DEDriversLicenseNumber: "Germany Driver's License Number",
  DEIdentityCardNumber: 'Germany Identity Card Number',
  DEPassportNumber: 'Germany Passport Number',
  DETaxIdentificationNumber: 'Germany Tax Identification Number',
  DEValueAddedNumber: 'Germany Value Added Tax Number',
  GRNationalIDCard: 'Greece National ID Card',
  GRTaxIdentificationNumber: 'Greece Tax Identification Number',
  HKIdentityCardNumber: 'Hong Kong SAR Identity Card Number',
  HUPersonalIdentificationNumber: 'Hungary Personal Identification Number',
  HUTaxIdentificationNumber: 'Hungary Tax Identification Number',
  HUValueAddedNumber: 'Hungary Value Added Tax Number',
  INPermanentAccount: 'India Permanent Account Number (PAN)',
  INUniqueIdentificationNumber: 'India Unique Identification Number',
  IDIdentityCardNumber: 'Indonesia Identity Card Number',
  IEPersonalPublicServiceNumber: 'Ireland Personal Public Service Number',
  ILBankAccountNumber: 'Israel Bank Account Number',
  ILNationalID: 'Israel National ID',
  ITDriversLicenseNumber: "Italy Driver's License Number",
  ITFiscalCode: 'Italy Fiscal Code',
  ITValueAddedTaxNumber: 'Italy Value Added Tax Number',
  JPBankAccountNumber: 'Japan Bank Account Number',
  JPDriversLicenseNumber: "Japan Driver's License Number",
  JPMyNumberCorporate: 'Japan My Number (Corporate)',
  JPMyNumberPersonal: 'Japan My Number (Personal)',
  JPPassportNumber: 'Japan Passport Number',
  JPResidenceCardNumber: 'Japan Residence Card Number',
  JPResidentRegistrationNumber: 'Japan Resident Registration Number',
  JPSocialInsuranceNumber: 'Japan Social Insurance Number',
  LVPersonalCode: 'Latvia Personal Code',
  LTPersonalCode: 'Lithuania Personal Code',
  LUNationalIdentificationNumberNatural:
    'Luxembourg National Identification Number (Natural Persons)',
  LUNationalIdentificationNumberNonNatural:
    'Luxembourg National Identification Number (Non-natural Persons)',
  MYIdentityCardNumber: 'Malaysia Identity Card Number',
  MTIdentityCardNumber: 'Malta Identity Card Number',
  MTTaxIDNumber: 'Malta Tax ID Number',
  NLTaxIdentificationNumber: 'Netherlands Tax Identification Number',
  NLValueAddedTaxNumber: 'Netherlands Value Added Tax Number',
  NZBankAccountNumber: 'New Zealand Bank Account Number',
  NZDriversLicenseNumber: "New Zealand Driver's License Number",
  NZInlandRevenueNumber: 'New Zealand Inland Revenue Number',
  NZMinistryOfHealthNumber: 'New Zealand Ministry of Health Number',
  NZSocialWelfareNumber: 'New Zealand Social Welfare Number',
  PHUnifiedMultiPurposeIDNumber: 'Philippines Unified Multi-Purpose ID Number',
  PLIdentityCard: 'Poland Identity Card',
  PLNationalID: 'Poland National ID',
  PLPassportNumber: 'Poland Passport Number',
  PLREGONNumber: 'Poland REGON Number',
  PLTaxIdentificationNumber: 'Poland Tax Identification Number',
  PTCitizenCardNumber: 'Portugal Citizen Card Number',
  PTTaxIdentificationNumber: 'Portugal Tax Identification Number',
  ROPersonalNumericalCode: 'Romania Personal Numerical Code',
  RUPassportNumberDomestic: 'Russia Passport Number (Domestic)',
  RUPassportNumberInternational: 'Russia Passport Number (International)',
  SANationalID: 'Saudi Arabia National ID',
  SGNationalRegistrationIdentityCardNumber: 'Singapore National Registration Identity Card Number',
  SKPersonalNumber: 'Slovakia Personal Number',
  SITaxIdentificationNumber: 'Slovenia Tax Identification Number',
  SIUniqueMasterCitizenNumber: 'Slovenia Unique Master Citizen Number',
  ZAIdentificationNumber: 'South Africa Identification Number',
  KRResidentRegistrationNumber: 'South Korea Resident Registration Number',
  ESDNI: 'Spain DNI',
  ESSocialSecurityNumber: 'Spain Social Security Number',
  ESTaxIdentificationNumber: 'Spain Tax Identification Number',
  SEPassportNumber: 'Sweden Passport Number',
  SETaxIdentificationNumber: 'Sweden Tax Identification Number',
  CHSocialSecurityNumber: 'Switzerland Social Security Number',
  TWNationalID: 'Taiwan National ID',
  TWPassportNumber: 'Taiwan Passport Number',
  TWResidentCertificate: 'Taiwan Resident Certificate',
  THPopulationIdentificationCode: 'Thailand Population Identification Code',
  TRNationalIdentificationNumber: 'Türkiye National Identification Number',
  UAPassportNumberDomestic: 'Ukraine Passport Number (Domestic)',
  UAPassportNumberInternational: 'Ukraine Passport Number (International)',
  UKElectoralRollNumber: 'UK Electoral Roll Number',
  UKNationalHealthNumber: 'UK National Health Number',
  UKNationalInsuranceNumber: 'UK National Insurance Number',
};

const SHARED_LLM_AS_JUDGE_TOOLTIPS: Record<string, string> = {
  guardrailText:
    'Describe the rule the judge will enforce. Be specific about what should pass and what should fail.',
  model: 'The model used to evaluate the policy against each payload.',
  positiveExamples:
    'Optional payloads that should pass the policy. Used by the judge as calibration anchors.',
  negativeExamples:
    'Optional payloads that should fail the policy. Used by the judge as calibration anchors.',
};

/** Agents `frontend-sw`, `OOB_GUARDRAILS_I8N`. */
export const AGENTS_COPY_EN: GuardrailCopyTable = {
  pii_detection: {
    displayName: 'PII detection',
    description:
      'This validator is designed to detect personally identifiable information using Azure Cognitive Services',
    paramLabels: {
      entities: 'Entities to detect',
      entityThresholds: 'Detection threshold',
    },
    paramTooltips: {
      entityThresholds:
        'Value between 0 and 1. The sensitivity level for PII detection. Higher thresholds detect more potential PII but may result in more false positives.',
    },
    optionLabels: {
      entities: {
        ...SHARED_PII_ENTITY_LABELS,
        FIPassportNumber: 'Finland Passport Number',
        ...AGENTS_PREVIEW_PII_ENTITY_LABELS,
      },
    },
  },
  prompt_injection: {
    displayName: 'Prompt injection',
    description:
      'This validator is provided by Noma Security and is built to detect malicious attack attempts (e.g. prompt injection, jailbreak) in LLM calls.',
    paramLabels: { threshold: 'Detection threshold' },
    paramTooltips: {
      threshold:
        'Value between 0 and 1. The sensitivity level for Prompt Injection detection. Higher thresholds detect more potential Prompt Injection but may result in more false positives.',
    },
  },
  harmful_content: {
    displayName: 'Harmful content',
    description:
      'This validator is provided by Microsoft Azure AI Content Safety and is built to detect harmful content (e.g. hate, violence, etc.) in LLM calls.',
    paramLabels: {
      harmfulContentEntities: 'Entities to detect',
      harmfulContentEntityThresholds: 'Detection threshold',
    },
    paramTooltips: {
      harmfulContentEntityThresholds:
        'Integer value between 0 and 6 (step 2). The severity threshold for harmful content detection. Higher values require more severe content before triggering.',
    },
    optionLabels: {
      harmfulContentEntities: {
        Hate: 'Hate',
        SelfHarm: 'SelfHarm',
        Sexual: 'Sexual',
        Violence: 'Violence',
      },
    },
  },
  user_prompt_attacks: {
    displayName: 'User prompt attacks',
    description:
      'This validator is provided by Microsoft Azure AI Content Safety and is built to detect user prompt attacks (e.g. jailbreak, prompt injection) that attempt to bypass system instructions.',
    paramLabels: {},
  },
  intellectual_property: {
    displayName: 'Intellectual property',
    description:
      'This validator is provided by Microsoft Azure AI Content Safety and is built to detect potential intellectual property violations in text and code.',
    paramLabels: { ipEntities: 'Entities to detect' },
    optionLabels: { ipEntities: { Text: 'Text', Code: 'Code' } },
  },
  llm_as_judge: {
    displayName: 'LLM as Judge',
    description: 'Detect violations of a rule you define, using an LLM as the judge.',
    paramLabels: {
      guardrailText: 'Rule prompt',
      model: 'Judge model',
      positiveExamples: 'Positive examples',
      negativeExamples: 'Negative examples',
      threshold: 'Threshold',
    },
    paramTooltips: {
      ...SHARED_LLM_AS_JUDGE_TOOLTIPS,
      threshold:
        'Integer value between 0 and 6 (step 2). Lower values are stricter — borderline payloads will fail. Higher values are more lenient — only clear violations are flagged.',
    },
  },
  sentiment: {
    displayName: 'Sentiment',
    description:
      'This validator is provided by Microsoft Azure AI Language and detects the sentiment of text in LLM calls, so a configured tone can be blocked.',
    paramLabels: {
      sentiments: 'Sentiments',
      sentimentThresholds: 'Confidence thresholds',
      language: 'Languages',
    },
    paramTooltips: {
      sentiments:
        'The guardrail trips when the detected sentiment is one of these. Mixed has no confidence score, so selecting it trips on the label alone and its threshold is ignored.',
      sentimentThresholds:
        'Minimum confidence, from 0 to 1, before a selected sentiment trips the guardrail. The threshold for Mixed has no effect.',
      language:
        'Which language the text is scored as. One language is used directly; listing several detects the language first, which doubles the calls made to Azure.',
    },
    optionLabels: {
      sentiments: {
        Positive: 'Positive',
        Neutral: 'Neutral',
        Negative: 'Negative',
        Mixed: 'Mixed',
      },
      language: {
        en: 'English',
        es: 'Spanish',
        fr: 'French',
        de: 'German',
        it: 'Italian',
        'pt-BR': 'Portuguese (Brazil)',
        'pt-PT': 'Portuguese (Portugal)',
        nl: 'Dutch',
        sv: 'Swedish',
        da: 'Danish',
        no: 'Norwegian',
        fi: 'Finnish',
        pl: 'Polish',
        cs: 'Czech',
        ru: 'Russian',
        uk: 'Ukrainian',
        tr: 'Turkish',
        el: 'Greek',
        he: 'Hebrew',
        ar: 'Arabic',
        hi: 'Hindi',
        ja: 'Japanese',
        ko: 'Korean',
        'zh-hans': 'Chinese (Simplified)',
        'zh-hant': 'Chinese (Traditional)',
        id: 'Indonesian',
        vi: 'Vietnamese',
        th: 'Thai',
      },
    },
  },
};

/** Flow `packages/canvas`, `buildValidatorDisplayInfo()`. */
export const FLOW_COPY_EN: GuardrailCopyTable = {
  pii_detection: {
    displayName: 'PII detection',
    description: 'Detect personally identifiable information using Azure Cognitive Services.',
    paramLabels: {
      entities: 'Entities to detect',
      entityThresholds: 'Detection thresholds',
    },
    optionLabels: { entities: SHARED_PII_ENTITY_LABELS },
  },
  prompt_injection: {
    displayName: 'Prompt injection',
    description:
      'Detect malicious attack attempts (e.g. prompt injection, jailbreak) in LLM calls.',
    paramLabels: { threshold: 'Detection threshold' },
  },
  harmful_content: {
    displayName: 'Harmful content',
    description: 'Detect harmful content (e.g. hate, violence) using Azure AI Content Safety.',
    paramLabels: {
      harmfulContentEntities: 'Content categories',
      harmfulContentEntityThresholds: 'Severity thresholds',
    },
    optionLabels: {
      harmfulContentEntities: {
        Hate: 'Hate',
        SelfHarm: 'Self-harm',
        Sexual: 'Sexual',
        Violence: 'Violence',
      },
    },
  },
  user_prompt_attacks: {
    displayName: 'User prompt attacks',
    description:
      'Detect user prompt attacks that attempt to bypass system instructions using Azure AI Content Safety.',
    paramLabels: {},
  },
  intellectual_property: {
    displayName: 'Intellectual property',
    description:
      'Detect potential intellectual property violations in text and code using Azure AI Content Safety.',
    paramLabels: { ipEntities: 'Content types' },
    optionLabels: { ipEntities: { Text: 'Text', Code: 'Code' } },
  },
  llm_as_judge: {
    displayName: 'LLM as Judge',
    description: 'Detect violations of a rule you define, using an LLM as the judge.',
    usageNote:
      "Judge model calls consume Agent units the same way the agent's own LLM calls do. Apply selectively to keep cost predictable, and choose the judge model with cost in mind — rates vary by model.",
    paramLabels: {
      guardrailText: 'Rule prompt',
      model: 'Judge model',
      positiveExamples: 'Positive examples',
      negativeExamples: 'Negative examples',
      threshold: 'Strictness',
    },
    paramTooltips: {
      ...SHARED_LLM_AS_JUDGE_TOOLTIPS,
      threshold:
        'Strictness on a 0–6 scale. Lower values are stricter — the judge flags anything that hints at a violation. Higher values are more lenient — only clear, unambiguous violations are flagged.',
    },
  },
};
