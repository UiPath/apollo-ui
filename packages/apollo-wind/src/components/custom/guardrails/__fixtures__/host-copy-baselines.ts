/**
 * The two products' English copy for built-in guardrails, transcribed verbatim and re-keyed onto
 * this package's canonical copy keys, plus the reviewed list of every place they disagree.
 *
 * This is the review artifact for the copy convergence. `definitions-parity.test.ts` asserts the
 * list both ways: every actual difference between a baseline and `GUARDRAIL_COPY_EN` has an entry
 * here, and every entry still corresponds to a real difference. So the table cannot rot, and its
 * diff tells a reviewer exactly which strings change, in which product, and why.
 *
 * Sources, pinned:
 * - Agents `frontend-sw/src/components/definition/AddGuardrailPalette/AddGuardrailPalette.utils.tsx`
 *   at `06bf3db71c97` (`origin/main` = `ff9e8ef44796`), lingui lazy getters.
 * - Flow `packages/canvas/src/components/properties-panel/guardrails/ootb-guardrail-definitions.ts`
 *   at `3ed1e53828b2` (`origin/develop` = `313d4ec977b9`), i18next `t(key, { defaultValue })`.
 *
 * Only keys a product actually has are listed. An absent key means that product renders no such
 * string today, which is itself a divergence and is recorded as `addedIn`.
 */

/** Agents' English, re-keyed. Note it carries no `usageNote` for any validator. */
export const AGENTS_EN_COPY: Readonly<Record<string, string>> = {
  'guardrail/pii_detection/displayName': 'PII detection',
  'guardrail/pii_detection/description':
    'This validator is designed to detect personally identifiable information using Azure Cognitive Services',
  'guardrail/pii_detection/param/entities/label': 'Entities to detect',
  'guardrail/pii_detection/param/entityThresholds/label': 'Detection threshold',
  'guardrail/pii_detection/param/entityThresholds/tooltip':
    'Value between 0 and 1. The sensitivity level for PII detection. Higher thresholds detect more potential PII but may result in more false positives.',
  'guardrail/pii_detection/option/entities/Person': 'Person',
  'guardrail/pii_detection/option/entities/Address': 'Address',
  'guardrail/pii_detection/option/entities/Date': 'Date',
  'guardrail/pii_detection/option/entities/PhoneNumber': 'Phone Number',
  'guardrail/pii_detection/option/entities/EugpsCoordinates': 'EU GPS Coordinates',
  'guardrail/pii_detection/option/entities/Email': 'Email',
  'guardrail/pii_detection/option/entities/CreditCardNumber': 'Credit Card Number',
  'guardrail/pii_detection/option/entities/InternationalBankingAccountNumber':
    'International Banking Account Number (IBAN)',
  'guardrail/pii_detection/option/entities/SwiftCode': 'SWIFT Code',
  'guardrail/pii_detection/option/entities/ABARoutingNumber': 'ABA Routing Number',
  'guardrail/pii_detection/option/entities/USDriversLicenseNumber': "US Driver's License Number",
  'guardrail/pii_detection/option/entities/UKDriversLicenseNumber': "UK Driver's License Number",
  'guardrail/pii_detection/option/entities/USIndividualTaxpayerIdentification':
    'US Individual Taxpayer Identification Number (ITIN)',
  'guardrail/pii_detection/option/entities/UKUniqueTaxpayerNumber':
    'UK Unique Taxpayer Number (UTR)',
  'guardrail/pii_detection/option/entities/USBankAccountNumber': 'US Bank Account Number',
  'guardrail/pii_detection/option/entities/USSocialSecurityNumber':
    'US Social Security Number (SSN)',
  'guardrail/pii_detection/option/entities/UsukPassportNumber': 'US/UK Passport Number',
  'guardrail/pii_detection/option/entities/NOIdentityNumber': 'Norway Identity Number',
  'guardrail/pii_detection/option/entities/FINationalID': 'Finland National ID',
  'guardrail/pii_detection/option/entities/FIPassportNumber': 'Finland Passport Number',
  'guardrail/pii_detection/option/entities/SENationalID': 'Sweden National ID',
  'guardrail/pii_detection/option/entities/DKPersonalIdentificationNumber':
    'Danish Personal Identification Number',
  'guardrail/pii_detection/option/entities/NLCitizensServiceNumber':
    'Netherlands Citizens Service Number',
  'guardrail/pii_detection/option/entities/URL': 'URL',
  'guardrail/pii_detection/option/entities/IPAddress': 'IP Address',

  'guardrail/prompt_injection/displayName': 'Prompt injection',
  'guardrail/prompt_injection/description':
    'This validator is provided by Noma Security and is built to detect malicious attack attempts (e.g. prompt injection, jailbreak) in LLM calls.',
  'guardrail/prompt_injection/param/threshold/label': 'Detection threshold',
  'guardrail/prompt_injection/param/threshold/tooltip':
    'Value between 0 and 1. The sensitivity level for Prompt Injection detection. Higher thresholds detect more potential Prompt Injection but may result in more false positives.',

  'guardrail/harmful_content/displayName': 'Harmful content',
  'guardrail/harmful_content/description':
    'This validator is provided by Microsoft Azure AI Content Safety and is built to detect harmful content (e.g. hate, violence, etc.) in LLM calls.',
  'guardrail/harmful_content/param/harmfulContentEntities/label': 'Entities to detect',
  'guardrail/harmful_content/param/harmfulContentEntityThresholds/label': 'Detection threshold',
  'guardrail/harmful_content/param/harmfulContentEntityThresholds/tooltip':
    'Integer value between 0 and 6 (step 2). The severity threshold for harmful content detection. Higher values require more severe content before triggering.',
  'guardrail/harmful_content/option/harmfulContentEntities/Hate': 'Hate',
  'guardrail/harmful_content/option/harmfulContentEntities/SelfHarm': 'SelfHarm',
  'guardrail/harmful_content/option/harmfulContentEntities/Sexual': 'Sexual',
  'guardrail/harmful_content/option/harmfulContentEntities/Violence': 'Violence',

  'guardrail/intellectual_property/displayName': 'Intellectual property',
  'guardrail/intellectual_property/description':
    'This validator is provided by Microsoft Azure AI Content Safety and is built to detect potential intellectual property violations in text and code.',
  'guardrail/intellectual_property/param/ipEntities/label': 'Entities to detect',
  'guardrail/intellectual_property/option/ipEntities/Text': 'Text',
  'guardrail/intellectual_property/option/ipEntities/Code': 'Code',

  'guardrail/user_prompt_attacks/displayName': 'User prompt attacks',
  'guardrail/user_prompt_attacks/description':
    'This validator is provided by Microsoft Azure AI Content Safety and is built to detect user prompt attacks (e.g. jailbreak, prompt injection) that attempt to bypass system instructions.',

  'guardrail/llm_as_judge/displayName': 'LLM as Judge',
  'guardrail/llm_as_judge/description':
    'Detect violations of a rule you define, using an LLM as the judge.',
  'guardrail/llm_as_judge/param/guardrailText/label': 'Rule prompt',
  'guardrail/llm_as_judge/param/guardrailText/tooltip':
    'Describe the rule the judge will enforce. Be specific about what should pass and what should fail.',
  'guardrail/llm_as_judge/param/model/label': 'Judge model',
  'guardrail/llm_as_judge/param/model/tooltip':
    'The model used to evaluate the policy against each payload.',
  'guardrail/llm_as_judge/param/positiveExamples/label': 'Positive examples',
  'guardrail/llm_as_judge/param/positiveExamples/tooltip':
    'Optional payloads that should pass the policy. Used by the judge as calibration anchors.',
  'guardrail/llm_as_judge/param/negativeExamples/label': 'Negative examples',
  'guardrail/llm_as_judge/param/negativeExamples/tooltip':
    'Optional payloads that should fail the policy. Used by the judge as calibration anchors.',
  'guardrail/llm_as_judge/param/threshold/label': 'Threshold',
  'guardrail/llm_as_judge/param/threshold/tooltip':
    'Integer value between 0 and 6 (step 2). Lower values are stricter — borderline payloads will fail. Higher values are more lenient — only clear violations are flagged.',
};

/**
 * Flow's English, re-keyed. Note it carries no threshold tooltips outside `llm_as_judge`, and no
 * `FIPassportNumber` option label even though the backend offers that entity.
 */
export const FLOW_EN_COPY: Readonly<Record<string, string>> = {
  'guardrail/pii_detection/displayName': 'PII detection',
  'guardrail/pii_detection/description':
    'Detect personally identifiable information using Azure Cognitive Services.',
  'guardrail/pii_detection/param/entities/label': 'Entities to detect',
  'guardrail/pii_detection/param/entityThresholds/label': 'Detection thresholds',
  'guardrail/pii_detection/option/entities/Person': 'Person',
  'guardrail/pii_detection/option/entities/Address': 'Address',
  'guardrail/pii_detection/option/entities/Date': 'Date',
  'guardrail/pii_detection/option/entities/PhoneNumber': 'Phone Number',
  'guardrail/pii_detection/option/entities/EugpsCoordinates': 'EU GPS Coordinates',
  'guardrail/pii_detection/option/entities/Email': 'Email',
  'guardrail/pii_detection/option/entities/CreditCardNumber': 'Credit Card Number',
  'guardrail/pii_detection/option/entities/InternationalBankingAccountNumber':
    'International Banking Account Number (IBAN)',
  'guardrail/pii_detection/option/entities/SwiftCode': 'SWIFT Code',
  'guardrail/pii_detection/option/entities/ABARoutingNumber': 'ABA Routing Number',
  'guardrail/pii_detection/option/entities/USDriversLicenseNumber': "US Driver's License Number",
  'guardrail/pii_detection/option/entities/UKDriversLicenseNumber': "UK Driver's License Number",
  'guardrail/pii_detection/option/entities/USIndividualTaxpayerIdentification':
    'US Individual Taxpayer Identification Number (ITIN)',
  'guardrail/pii_detection/option/entities/UKUniqueTaxpayerNumber':
    'UK Unique Taxpayer Number (UTR)',
  'guardrail/pii_detection/option/entities/USBankAccountNumber': 'US Bank Account Number',
  'guardrail/pii_detection/option/entities/USSocialSecurityNumber':
    'US Social Security Number (SSN)',
  'guardrail/pii_detection/option/entities/UsukPassportNumber': 'US/UK Passport Number',
  'guardrail/pii_detection/option/entities/NOIdentityNumber': 'Norway Identity Number',
  'guardrail/pii_detection/option/entities/FINationalID': 'Finland National ID',
  'guardrail/pii_detection/option/entities/SENationalID': 'Sweden National ID',
  'guardrail/pii_detection/option/entities/DKPersonalIdentificationNumber':
    'Danish Personal Identification Number',
  'guardrail/pii_detection/option/entities/NLCitizensServiceNumber':
    'Netherlands Citizens Service Number',
  'guardrail/pii_detection/option/entities/URL': 'URL',
  'guardrail/pii_detection/option/entities/IPAddress': 'IP Address',

  'guardrail/prompt_injection/displayName': 'Prompt injection',
  'guardrail/prompt_injection/description':
    'Detect malicious attack attempts (e.g. prompt injection, jailbreak) in LLM calls.',
  'guardrail/prompt_injection/param/threshold/label': 'Detection threshold',

  'guardrail/harmful_content/displayName': 'Harmful content',
  'guardrail/harmful_content/description':
    'Detect harmful content (e.g. hate, violence) using Azure AI Content Safety.',
  'guardrail/harmful_content/param/harmfulContentEntities/label': 'Content categories',
  'guardrail/harmful_content/param/harmfulContentEntityThresholds/label': 'Severity thresholds',
  'guardrail/harmful_content/option/harmfulContentEntities/Hate': 'Hate',
  'guardrail/harmful_content/option/harmfulContentEntities/SelfHarm': 'Self-harm',
  'guardrail/harmful_content/option/harmfulContentEntities/Sexual': 'Sexual',
  'guardrail/harmful_content/option/harmfulContentEntities/Violence': 'Violence',

  'guardrail/intellectual_property/displayName': 'Intellectual property',
  'guardrail/intellectual_property/description':
    'Detect potential intellectual property violations in text and code using Azure AI Content Safety.',
  'guardrail/intellectual_property/param/ipEntities/label': 'Content types',
  'guardrail/intellectual_property/option/ipEntities/Text': 'Text',
  'guardrail/intellectual_property/option/ipEntities/Code': 'Code',

  'guardrail/user_prompt_attacks/displayName': 'User prompt attacks',
  'guardrail/user_prompt_attacks/description':
    'Detect user prompt attacks that attempt to bypass system instructions using Azure AI Content Safety.',

  'guardrail/llm_as_judge/displayName': 'LLM as Judge',
  'guardrail/llm_as_judge/description':
    'Detect violations of a rule you define, using an LLM as the judge.',
  'guardrail/llm_as_judge/usageNote':
    "Judge model calls consume Agent units the same way the agent's own LLM calls do. Apply selectively to keep cost predictable, and choose the judge model with cost in mind — rates vary by model.",
  'guardrail/llm_as_judge/param/guardrailText/label': 'Rule prompt',
  'guardrail/llm_as_judge/param/guardrailText/tooltip':
    'Describe the rule the judge will enforce. Be specific about what should pass and what should fail.',
  'guardrail/llm_as_judge/param/model/label': 'Judge model',
  'guardrail/llm_as_judge/param/model/tooltip':
    'The model used to evaluate the policy against each payload.',
  'guardrail/llm_as_judge/param/positiveExamples/label': 'Positive examples',
  'guardrail/llm_as_judge/param/positiveExamples/tooltip':
    'Optional payloads that should pass the policy. Used by the judge as calibration anchors.',
  'guardrail/llm_as_judge/param/negativeExamples/label': 'Negative examples',
  'guardrail/llm_as_judge/param/negativeExamples/tooltip':
    'Optional payloads that should fail the policy. Used by the judge as calibration anchors.',
  'guardrail/llm_as_judge/param/threshold/label': 'Strictness',
  'guardrail/llm_as_judge/param/threshold/tooltip':
    'Strictness on a 0–6 scale. Lower values are stricter — the judge flags anything that hints at a violation. Higher values are more lenient — only clear, unambiguous violations are flagged.',
};

/**
 * One reviewed copy decision. `changesIn` names the products whose rendered English changes when
 * they adopt the canonical table; `addedIn` names the products that gain a string they render
 * nowhere today.
 */
export interface ExpectedCopyDivergence {
  key: string;
  changesIn: readonly ('agents' | 'flow')[];
  addedIn?: readonly ('agents' | 'flow')[];
  reason: string;
}

/**
 * Every place the canonical table differs from a host's English today, and why that winner was
 * chosen. Anything not listed here is byte-identical in both products, which is the majority.
 */
export const EXPECTED_DIVERGENCES: readonly ExpectedCopyDivergence[] = [
  // ---------------------------------------------------------------------------------------
  // Descriptions. Four adopt Flow's concise imperative phrasing over Agents' "This validator
  // is designed to ..." preamble. One does not, because Agents' carries information.
  // ---------------------------------------------------------------------------------------
  {
    key: 'guardrail/pii_detection/description',
    changesIn: ['agents'],
    reason:
      'Adopts Flow: drops the "This validator is designed to" preamble and adds the missing full stop. No information lost.',
  },
  {
    key: 'guardrail/harmful_content/description',
    changesIn: ['agents'],
    reason:
      'Adopts Flow: same preamble trim, and "(e.g. hate, violence)" over "(e.g. hate, violence, etc.)". Azure attribution retained in both.',
  },
  {
    key: 'guardrail/intellectual_property/description',
    changesIn: ['agents'],
    reason: 'Adopts Flow: preamble trim, Azure attribution retained.',
  },
  {
    key: 'guardrail/user_prompt_attacks/description',
    changesIn: ['agents'],
    reason: 'Adopts Flow: preamble trim, Azure attribution retained.',
  },
  {
    key: 'guardrail/prompt_injection/description',
    changesIn: ['flow'],
    reason:
      'Adopts Agents against the pattern above, because Flow\'s phrasing drops the "provided by Noma Security" attribution. Vendor attribution is information, not style, and may be contractual. Flow hides this validator today, so nothing user-facing changes there until it stops.',
  },

  // ---------------------------------------------------------------------------------------
  // Parameter labels. Flow's are more specific, and specificity wins in a form where several
  // parameters would otherwise share one label.
  // ---------------------------------------------------------------------------------------
  {
    key: 'guardrail/pii_detection/param/entityThresholds/label',
    changesIn: ['agents'],
    reason:
      'Adopts Flow\'s plural "Detection thresholds". The control is a map of one threshold per selected entity, so the singular misdescribes it.',
  },
  {
    key: 'guardrail/harmful_content/param/harmfulContentEntities/label',
    changesIn: ['agents'],
    reason:
      'Adopts Flow\'s "Content categories". Agents labels three different parameters "Entities to detect" across three validators; the specific noun is what the user is choosing.',
  },
  {
    key: 'guardrail/harmful_content/param/harmfulContentEntityThresholds/label',
    changesIn: ['agents'],
    reason:
      'Adopts Flow\'s "Severity thresholds". These are 0-to-6 severities, not 0-to-1 detection confidences, and naming both "Detection threshold" hid that.',
  },
  {
    key: 'guardrail/intellectual_property/param/ipEntities/label',
    changesIn: ['agents'],
    reason: 'Adopts Flow\'s "Content types". Same reason as the harmful-content categories.',
  },
  {
    key: 'guardrail/llm_as_judge/param/threshold/label',
    changesIn: ['agents'],
    reason:
      'Adopts Flow\'s "Strictness". "Threshold" does not say which direction is stricter, and the parameter is inverted from every other threshold in the catalog.',
  },

  // ---------------------------------------------------------------------------------------
  // Tooltips. Flow ships none for the three non-judge thresholds, so it gains Agents' text.
  // ---------------------------------------------------------------------------------------
  {
    key: 'guardrail/pii_detection/param/entityThresholds/tooltip',
    changesIn: ['flow'],
    addedIn: ['flow'],
    reason:
      'Adopts Agents, which is the only product that explains the 0-to-1 scale. Flow renders no tooltip here today.',
  },
  {
    key: 'guardrail/prompt_injection/param/threshold/tooltip',
    changesIn: ['flow'],
    addedIn: ['flow'],
    reason: 'Adopts Agents. Flow renders no tooltip here today.',
  },
  {
    key: 'guardrail/harmful_content/param/harmfulContentEntityThresholds/tooltip',
    changesIn: ['flow'],
    addedIn: ['flow'],
    reason:
      'Adopts Agents, which explains the 0-to-6 severity scale and its step of 2. Flow renders no tooltip here today.',
  },
  {
    key: 'guardrail/llm_as_judge/param/threshold/tooltip',
    changesIn: ['agents'],
    reason:
      'Adopts Flow, which says what strictness means in judging terms rather than restating the numeric range that the control already enforces.',
  },

  // ---------------------------------------------------------------------------------------
  // Content only one product has.
  // ---------------------------------------------------------------------------------------
  {
    key: 'guardrail/llm_as_judge/usageNote',
    changesIn: ['agents'],
    addedIn: ['agents'],
    reason:
      'Adopts Flow. Judge calls bill Agent units, and Agents shows no cost warning at all today. A cost surprise is the more expensive omission.',
  },
  {
    key: 'guardrail/harmful_content/option/harmfulContentEntities/SelfHarm',
    changesIn: ['agents'],
    reason:
      'Adopts Flow\'s "Self-harm". Agents shows the raw wire value "SelfHarm", which reads as a bug next to "Hate" and "Violence".',
  },
  {
    key: 'guardrail/pii_detection/option/entities/FIPassportNumber',
    changesIn: ['flow'],
    addedIn: ['flow'],
    reason:
      'Adopts Agents. The backend offers this entity whenever Nordic detection is on, and Flow has no label for it, so it renders the raw value today.',
  },
];
