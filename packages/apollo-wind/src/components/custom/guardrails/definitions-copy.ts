/**
 * The canonical English copy for UiPath-managed (built-in) guardrail validators.
 *
 * Why this lives in the design system at all, against the family's usual rule that domain copy
 * stays host-side: the backend cannot supply it. `OutOfTheBoxGuardrailDefinitionDto` marks the
 * validator's friendly name `[JsonIgnore]`, and `OutOfTheBoxGuardrailDefinitions` never sets
 * `displayName`, `description` or `optionLabels` for any built-in. Only BYO guardrails carry
 * display metadata, from their connector manifest. So each frontend has had to describe the same
 * catalog itself, and the two hand-maintained tables have already drifted in 16 strings. Owning
 * it once here ends that; translations stay in each host's own toolchain, reached through the
 * `translate` seam.
 *
 * Copy keys are `guardrail/<validator>/<slot>` and are always built by the three helpers below,
 * never written by hand, so a typo is a compile error instead of a silently missing translation.
 * The separator is `/` deliberately: `.` is i18next's default `keySeparator`, and one host's
 * catalog is flat, so a dotted key would resolve as a nested path, miss, and fall back to the
 * English default. Every locale but English would go quietly untranslated while English looked
 * perfect. `:` is i18next's `nsSeparator`, and `_` cannot be split unambiguously because
 * validator ids are themselves snake_case.
 */

/** Prefix of every guardrail copy key. */
export const GUARDRAIL_COPY_KEY_PREFIX = 'guardrail/';

type CopyKeyPrefix = typeof GUARDRAIL_COPY_KEY_PREFIX;

interface GuardrailParameterCopy {
  label: string;
  tooltip?: string;
}

interface GuardrailValidatorCopy {
  displayName: string;
  description: string;
  /** Informational note shown above the form, e.g. a cost or licensing caveat. */
  usageNote?: string;
  params?: Record<string, GuardrailParameterCopy>;
  /** Friendly option labels, keyed by parameter id then by the raw wire option value. */
  optionLabels?: Record<string, Record<string, string>>;
}

/**
 * Option labels are keyed by the raw wire value (`USSocialSecurityNumber`), not a camelCased
 * slug, so the key is derivable from the data rather than transcribed. Transcribing is how the
 * two products ended up with `finNationalId` and `fiNationalId` for the same option.
 */
const PII_ENTITY_LABELS = {
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
  FIPassportNumber: 'Finland Passport Number',
  SENationalID: 'Sweden National ID',
  DKPersonalIdentificationNumber: 'Danish Personal Identification Number',
  NLCitizensServiceNumber: 'Netherlands Citizens Service Number',
  URL: 'URL',
  IPAddress: 'IP Address',
} as const;

/**
 * The authored source of truth. Every string here is the winner of a per-string decision between
 * the two products' tables; `definitions-copy.test.ts` pins each choice that changes what one of
 * them renders, with the reason, so the copy diff is reviewable rather than implicit.
 */
const GUARDRAIL_VALIDATOR_COPY = {
  pii_detection: {
    displayName: 'PII detection',
    description: 'Detect personally identifiable information using Azure Cognitive Services.',
    params: {
      entities: { label: 'Entities to detect' },
      entityThresholds: {
        label: 'Detection thresholds',
        tooltip:
          'Value between 0 and 1. The sensitivity level for PII detection. Higher thresholds detect more potential PII but may result in more false positives.',
      },
    },
    optionLabels: { entities: PII_ENTITY_LABELS },
  },
  prompt_injection: {
    displayName: 'Prompt injection',
    // Keeps the vendor attribution, which is information rather than phrasing.
    description:
      'This validator is provided by Noma Security and is built to detect malicious attack attempts (e.g. prompt injection, jailbreak) in LLM calls.',
    params: {
      threshold: {
        label: 'Detection threshold',
        tooltip:
          'Value between 0 and 1. The sensitivity level for Prompt Injection detection. Higher thresholds detect more potential Prompt Injection but may result in more false positives.',
      },
    },
  },
  harmful_content: {
    displayName: 'Harmful content',
    description: 'Detect harmful content (e.g. hate, violence) using Azure AI Content Safety.',
    params: {
      harmfulContentEntities: { label: 'Content categories' },
      harmfulContentEntityThresholds: {
        label: 'Severity thresholds',
        tooltip:
          'Integer value between 0 and 6 (step 2). The severity threshold for harmful content detection. Higher values require more severe content before triggering.',
      },
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
  intellectual_property: {
    displayName: 'Intellectual property',
    description:
      'Detect potential intellectual property violations in text and code using Azure AI Content Safety.',
    params: {
      ipEntities: { label: 'Content types' },
    },
    optionLabels: {
      ipEntities: { Text: 'Text', Code: 'Code' },
    },
  },
  user_prompt_attacks: {
    displayName: 'User prompt attacks',
    description:
      'Detect user prompt attacks that attempt to bypass system instructions using Azure AI Content Safety.',
  },
  llm_as_judge: {
    displayName: 'LLM as Judge',
    description: 'Detect violations of a rule you define, using an LLM as the judge.',
    usageNote:
      "Judge model calls consume Agent units the same way the agent's own LLM calls do. Apply selectively to keep cost predictable, and choose the judge model with cost in mind — rates vary by model.",
    params: {
      guardrailText: {
        label: 'Rule prompt',
        tooltip:
          'Describe the rule the judge will enforce. Be specific about what should pass and what should fail.',
      },
      model: {
        label: 'Judge model',
        tooltip: 'The model used to evaluate the policy against each payload.',
      },
      positiveExamples: {
        label: 'Positive examples',
        tooltip:
          'Optional payloads that should pass the policy. Used by the judge as calibration anchors.',
      },
      negativeExamples: {
        label: 'Negative examples',
        tooltip:
          'Optional payloads that should fail the policy. Used by the judge as calibration anchors.',
      },
      threshold: {
        label: 'Strictness',
        tooltip:
          'Strictness on a 0–6 scale. Lower values are stricter — the judge flags anything that hints at a violation. Higher values are more lenient — only clear, unambiguous violations are flagged.',
      },
    },
  },
} as const satisfies Record<string, GuardrailValidatorCopy>;

type CopyTable = typeof GUARDRAIL_VALIDATOR_COPY;
type CopyValidatorId = keyof CopyTable & string;

type DefinitionCopyKey<V extends CopyValidatorId> =
  | `${CopyKeyPrefix}${V}/displayName`
  | `${CopyKeyPrefix}${V}/description`
  | (CopyTable[V] extends { usageNote: string } ? `${CopyKeyPrefix}${V}/usageNote` : never);

type ParameterCopyKey<V extends CopyValidatorId> = CopyTable[V] extends { params: infer P }
  ? {
      [Id in keyof P & string]:
        | `${CopyKeyPrefix}${V}/param/${Id}/label`
        | (P[Id] extends { tooltip: string } ? `${CopyKeyPrefix}${V}/param/${Id}/tooltip` : never);
    }[keyof P & string]
  : never;

type OptionCopyKey<V extends CopyValidatorId> = CopyTable[V] extends { optionLabels: infer O }
  ? {
      [Id in keyof O & string]: {
        [Value in keyof O[Id] & string]: `${CopyKeyPrefix}${V}/option/${Id}/${Value}`;
      }[keyof O[Id] & string];
    }[keyof O & string]
  : never;

/**
 * Every copy key the package knows about, derived from the table above. Hosts can use it to type
 * their own catalogs; a key that is not in the table is a compile error.
 */
export type GuardrailCopyKey = {
  [V in CopyValidatorId]: DefinitionCopyKey<V> | ParameterCopyKey<V> | OptionCopyKey<V>;
}[CopyValidatorId];

/**
 * The host's translation lookup. Deliberately the shape both `i18next` and `lingui` reduce to:
 * `t(key, { defaultValue })` and `i18n._({ id, message })` are each a one-line adapter.
 *
 * Return the English `defaultValue` for anything the host catalog does not carry.
 */
export type GuardrailCopyTranslator = (key: GuardrailCopyKey, defaultValue: string) => string;

const definitionCopyKey = <V extends string, S extends string>(validator: V, slot: S) =>
  `${GUARDRAIL_COPY_KEY_PREFIX}${validator}/${slot}` as GuardrailCopyKey;

const parameterCopyKey = <V extends string, P extends string, S extends string>(
  validator: V,
  parameterId: P,
  slot: S
) => `${GUARDRAIL_COPY_KEY_PREFIX}${validator}/param/${parameterId}/${slot}` as GuardrailCopyKey;

const optionCopyKey = <V extends string, P extends string, O extends string>(
  validator: V,
  parameterId: P,
  option: O
) => `${GUARDRAIL_COPY_KEY_PREFIX}${validator}/option/${parameterId}/${option}` as GuardrailCopyKey;

function buildEnglishCopy(): Record<GuardrailCopyKey, string> {
  const flat: Record<string, string> = {};
  for (const [validator, copy] of Object.entries(GUARDRAIL_VALIDATOR_COPY)) {
    const entry: GuardrailValidatorCopy = copy;
    flat[definitionCopyKey(validator, 'displayName')] = entry.displayName;
    flat[definitionCopyKey(validator, 'description')] = entry.description;
    if (entry.usageNote !== undefined) {
      flat[definitionCopyKey(validator, 'usageNote')] = entry.usageNote;
    }
    for (const [parameterId, parameter] of Object.entries(entry.params ?? {})) {
      flat[parameterCopyKey(validator, parameterId, 'label')] = parameter.label;
      if (parameter.tooltip !== undefined) {
        flat[parameterCopyKey(validator, parameterId, 'tooltip')] = parameter.tooltip;
      }
    }
    for (const [parameterId, options] of Object.entries(entry.optionLabels ?? {})) {
      for (const [option, label] of Object.entries(options)) {
        flat[optionCopyKey(validator, parameterId, option)] = label;
      }
    }
  }
  // The keys are produced by the same helpers that generate `GuardrailCopyKey`, but TypeScript
  // cannot see that a loop covered the union exhaustively. `definitions-copy.test.ts` re-walks
  // the table independently and asserts the key sets match.
  return flat as Record<GuardrailCopyKey, string>;
}

/**
 * The canonical English copy, flat and keyed by `GuardrailCopyKey`. This is what a host feeds its
 * catalog-generation step, and what `t(key, { defaultValue })` falls back to at runtime.
 *
 * Note that both `i18next` and `lingui` prefer their own catalog's English over a supplied default,
 * so a host that bumps this package without regenerating its English catalog silently keeps the
 * old strings. Regenerate-and-diff in host CI is the only thing that prevents the drift returning.
 */
export const GUARDRAIL_COPY_EN: Readonly<Record<GuardrailCopyKey, string>> = Object.freeze(
  buildEnglishCopy()
);

/** Copy for one validator, with every string already resolved through the translator. */
export interface ResolvedGuardrailValidatorCopy {
  displayName: string;
  description: string;
  usageNote?: string;
  paramLabels: Record<string, string>;
  paramTooltips: Record<string, string>;
  optionLabels: Record<string, Record<string, string>>;
}

const passThrough: GuardrailCopyTranslator = (_key, defaultValue) => defaultValue;

/**
 * Resolve the curated copy for one validator, or `undefined` when the catalog has never heard of
 * it (a validator the backend added after this package was published, or a BYO guardrail, which
 * carries its own manifest copy).
 *
 * Internal to the definitions layer: hosts get `GUARDRAIL_COPY_EN` and the enrichment step, not
 * the structured table.
 */
export function resolveGuardrailValidatorCopy(
  validator: string,
  translate: GuardrailCopyTranslator = passThrough
): ResolvedGuardrailValidatorCopy | undefined {
  const entry: GuardrailValidatorCopy | undefined = (
    GUARDRAIL_VALIDATOR_COPY as Record<string, GuardrailValidatorCopy>
  )[validator];
  if (!entry) return undefined;

  const paramLabels: Record<string, string> = {};
  const paramTooltips: Record<string, string> = {};
  for (const [parameterId, parameter] of Object.entries(entry.params ?? {})) {
    paramLabels[parameterId] = translate(
      parameterCopyKey(validator, parameterId, 'label'),
      parameter.label
    );
    if (parameter.tooltip !== undefined) {
      paramTooltips[parameterId] = translate(
        parameterCopyKey(validator, parameterId, 'tooltip'),
        parameter.tooltip
      );
    }
  }

  const optionLabels: Record<string, Record<string, string>> = {};
  for (const [parameterId, options] of Object.entries(entry.optionLabels ?? {})) {
    const resolved: Record<string, string> = {};
    for (const [option, label] of Object.entries(options)) {
      resolved[option] = translate(optionCopyKey(validator, parameterId, option), label);
    }
    optionLabels[parameterId] = resolved;
  }

  return {
    displayName: translate(definitionCopyKey(validator, 'displayName'), entry.displayName),
    description: translate(definitionCopyKey(validator, 'description'), entry.description),
    ...(entry.usageNote === undefined
      ? {}
      : { usageNote: translate(definitionCopyKey(validator, 'usageNote'), entry.usageNote) }),
    paramLabels,
    paramTooltips,
    optionLabels,
  };
}

/** Validator ids the curated catalog covers, for tests and host catalog generation. */
export const GUARDRAIL_COPY_VALIDATORS = Object.keys(
  GUARDRAIL_VALIDATOR_COPY
) as readonly CopyValidatorId[];
