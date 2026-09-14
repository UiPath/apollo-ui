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
 *   `displayName` / `paramTooltips` / `optionLabels` here)
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
      entities: { ...SHARED_PII_ENTITY_LABELS, FIPassportNumber: 'Finland Passport Number' },
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
