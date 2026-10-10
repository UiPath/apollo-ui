import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';

/**
 * The canonical display copy for the built-in guardrail validators.
 *
 * Until now this table lived twice, once in each product, and the two drifted. Here it is a
 * set of lingui messages in the shared canvas catalog, so both hosts get the same wording and
 * the same translations, and the strings sit in the real localization pipeline instead of a
 * host-side constant.
 *
 * Message ids follow the family's dotted convention:
 *
 * ```
 * guardrails.definitions.<validator>.display-name
 * guardrails.definitions.<validator>.description
 * guardrails.definitions.<validator>.usage-note
 * guardrails.definitions.<validator>.param.<paramId>.label
 * guardrails.definitions.<validator>.param.<paramId>.tooltip
 * guardrails.definitions.<validator>.option.<paramId>.<RawWireValue>
 * ```
 *
 * Validator, parameter and option segments are the **raw wire values**
 * (`pii_detection`, `entityThresholds`, `USSocialSecurityNumber`), never a transcribed slug.
 * Transcribing is how the two products ended up keying the same Finland entity as
 * `finNationalId` and `fiNationalId`.
 *
 * One builder holds every message, so the English source, the flat record hosts diff in CI
 * and the runtime lingui path cannot drift. Nothing here is extracted: `src/canvas` uses no
 * lingui macros, and `locales/en.json` is hand-authored against this builder and pinned by
 * `definitions-parity.test.ts` (see `__fixtures__/catalog-coverage.ts`). Where the two
 * products' English differed, the choice and its reason are recorded in that same test.
 */

/** Curated copy for one validator. Absent entries fall back to the wire, then to the id. */
export interface GuardrailValidatorCopy {
  displayName: string;
  description: string;
  /** Informational note rendered above the form, e.g. a cost caveat. */
  usageNote?: string;
  /** Keyed by raw parameter id. */
  paramLabels: Record<string, string>;
  /** Keyed by raw parameter id. */
  paramTooltips?: Record<string, string>;
  /** Keyed by raw parameter id, then by raw wire option value. */
  optionLabels?: Record<string, Record<string, string>>;
}

/** Curated copy keyed by raw validator id. */
export type GuardrailCopyTable = Record<string, GuardrailValidatorCopy>;

/** The subset of `useSafeLingui`'s translator this module needs. */
type CopyTranslate = (descriptor: { id: string; message: string }) => string;

function buildGuardrailCopy(_: CopyTranslate): GuardrailCopyTable {
  return {
    pii_detection: {
      displayName: _({
        id: 'guardrails.definitions.pii_detection.display-name',
        message: 'PII detection',
      }),
      description: _({
        id: 'guardrails.definitions.pii_detection.description',
        message: 'Detect personally identifiable information using Azure Cognitive Services.',
      }),
      paramLabels: {
        entities: _({
          id: 'guardrails.definitions.pii_detection.param.entities.label',
          message: 'Entities to detect',
        }),
        entityThresholds: _({
          id: 'guardrails.definitions.pii_detection.param.entityThresholds.label',
          message: 'Detection thresholds',
        }),
      },
      paramTooltips: {
        entityThresholds: _({
          id: 'guardrails.definitions.pii_detection.param.entityThresholds.tooltip',
          message:
            'Value between 0 and 1. The sensitivity level for PII detection. Higher thresholds detect more potential PII but may result in more false positives.',
        }),
      },
      optionLabels: {
        entities: {
          Person: _({
            id: 'guardrails.definitions.pii_detection.option.entities.Person',
            message: 'Person',
          }),
          Address: _({
            id: 'guardrails.definitions.pii_detection.option.entities.Address',
            message: 'Address',
          }),
          Date: _({
            id: 'guardrails.definitions.pii_detection.option.entities.Date',
            message: 'Date',
          }),
          PhoneNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.PhoneNumber',
            message: 'Phone Number',
          }),
          EugpsCoordinates: _({
            id: 'guardrails.definitions.pii_detection.option.entities.EugpsCoordinates',
            message: 'EU GPS Coordinates',
          }),
          Email: _({
            id: 'guardrails.definitions.pii_detection.option.entities.Email',
            message: 'Email',
          }),
          CreditCardNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.CreditCardNumber',
            message: 'Credit Card Number',
          }),
          InternationalBankingAccountNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.InternationalBankingAccountNumber',
            message: 'International Banking Account Number (IBAN)',
          }),
          SwiftCode: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SwiftCode',
            message: 'SWIFT Code',
          }),
          ABARoutingNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.ABARoutingNumber',
            message: 'ABA Routing Number',
          }),
          USDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.USDriversLicenseNumber',
            message: "US Driver's License Number",
          }),
          UKDriversLicenseNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UKDriversLicenseNumber',
            message: "UK Driver's License Number",
          }),
          USIndividualTaxpayerIdentification: _({
            id: 'guardrails.definitions.pii_detection.option.entities.USIndividualTaxpayerIdentification',
            message: 'US Individual Taxpayer Identification Number (ITIN)',
          }),
          UKUniqueTaxpayerNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UKUniqueTaxpayerNumber',
            message: 'UK Unique Taxpayer Number (UTR)',
          }),
          USBankAccountNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.USBankAccountNumber',
            message: 'US Bank Account Number',
          }),
          USSocialSecurityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.USSocialSecurityNumber',
            message: 'US Social Security Number (SSN)',
          }),
          UsukPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.UsukPassportNumber',
            message: 'US/UK Passport Number',
          }),
          NOIdentityNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NOIdentityNumber',
            message: 'Norway Identity Number',
          }),
          FINationalID: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FINationalID',
            message: 'Finland National ID',
          }),
          FIPassportNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.FIPassportNumber',
            message: 'Finland Passport Number',
          }),
          SENationalID: _({
            id: 'guardrails.definitions.pii_detection.option.entities.SENationalID',
            message: 'Sweden National ID',
          }),
          DKPersonalIdentificationNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.DKPersonalIdentificationNumber',
            message: 'Danish Personal Identification Number',
          }),
          NLCitizensServiceNumber: _({
            id: 'guardrails.definitions.pii_detection.option.entities.NLCitizensServiceNumber',
            message: 'Netherlands Citizens Service Number',
          }),
          URL: _({
            id: 'guardrails.definitions.pii_detection.option.entities.URL',
            message: 'URL',
          }),
          IPAddress: _({
            id: 'guardrails.definitions.pii_detection.option.entities.IPAddress',
            message: 'IP Address',
          }),
        },
      },
    },

    prompt_injection: {
      displayName: _({
        id: 'guardrails.definitions.prompt_injection.display-name',
        message: 'Prompt injection',
      }),
      // Keeps its "This validator is provided by..." form: the third-party vendor attribution
      // is load-bearing and only Agents carries it.
      description: _({
        id: 'guardrails.definitions.prompt_injection.description',
        message:
          'This validator is provided by Noma Security and is built to detect malicious attack attempts (e.g. prompt injection, jailbreak) in LLM calls.',
      }),
      paramLabels: {
        threshold: _({
          id: 'guardrails.definitions.prompt_injection.param.threshold.label',
          message: 'Detection threshold',
        }),
      },
      paramTooltips: {
        threshold: _({
          id: 'guardrails.definitions.prompt_injection.param.threshold.tooltip',
          message:
            'Value between 0 and 1. The sensitivity level for Prompt Injection detection. Higher thresholds detect more potential Prompt Injection but may result in more false positives.',
        }),
      },
    },

    harmful_content: {
      displayName: _({
        id: 'guardrails.definitions.harmful_content.display-name',
        message: 'Harmful content',
      }),
      description: _({
        id: 'guardrails.definitions.harmful_content.description',
        message: 'Detect harmful content (e.g. hate, violence) using Azure AI Content Safety.',
      }),
      paramLabels: {
        harmfulContentEntities: _({
          id: 'guardrails.definitions.harmful_content.param.harmfulContentEntities.label',
          message: 'Content categories',
        }),
        harmfulContentEntityThresholds: _({
          id: 'guardrails.definitions.harmful_content.param.harmfulContentEntityThresholds.label',
          message: 'Severity thresholds',
        }),
      },
      paramTooltips: {
        harmfulContentEntityThresholds: _({
          id: 'guardrails.definitions.harmful_content.param.harmfulContentEntityThresholds.tooltip',
          message:
            'Integer value between 0 and 6 (step 2). The severity threshold for harmful content detection. Higher values require more severe content before triggering.',
        }),
      },
      optionLabels: {
        harmfulContentEntities: {
          Hate: _({
            id: 'guardrails.definitions.harmful_content.option.harmfulContentEntities.Hate',
            message: 'Hate',
          }),
          SelfHarm: _({
            id: 'guardrails.definitions.harmful_content.option.harmfulContentEntities.SelfHarm',
            message: 'Self-harm',
          }),
          Sexual: _({
            id: 'guardrails.definitions.harmful_content.option.harmfulContentEntities.Sexual',
            message: 'Sexual',
          }),
          Violence: _({
            id: 'guardrails.definitions.harmful_content.option.harmfulContentEntities.Violence',
            message: 'Violence',
          }),
        },
      },
    },

    user_prompt_attacks: {
      displayName: _({
        id: 'guardrails.definitions.user_prompt_attacks.display-name',
        message: 'User prompt attacks',
      }),
      description: _({
        id: 'guardrails.definitions.user_prompt_attacks.description',
        message:
          'Detect user prompt attacks that attempt to bypass system instructions using Azure AI Content Safety.',
      }),
      paramLabels: {},
    },

    intellectual_property: {
      displayName: _({
        id: 'guardrails.definitions.intellectual_property.display-name',
        message: 'Intellectual property',
      }),
      description: _({
        id: 'guardrails.definitions.intellectual_property.description',
        message:
          'Detect potential intellectual property violations in text and code using Azure AI Content Safety.',
      }),
      paramLabels: {
        ipEntities: _({
          id: 'guardrails.definitions.intellectual_property.param.ipEntities.label',
          message: 'Content types',
        }),
      },
      optionLabels: {
        ipEntities: {
          Text: _({
            id: 'guardrails.definitions.intellectual_property.option.ipEntities.Text',
            message: 'Text',
          }),
          Code: _({
            id: 'guardrails.definitions.intellectual_property.option.ipEntities.Code',
            message: 'Code',
          }),
        },
      },
    },

    llm_as_judge: {
      displayName: _({
        id: 'guardrails.definitions.llm_as_judge.display-name',
        message: 'LLM as Judge',
      }),
      description: _({
        id: 'guardrails.definitions.llm_as_judge.description',
        message: 'Detect violations of a rule you define, using an LLM as the judge.',
      }),
      usageNote: _({
        id: 'guardrails.definitions.llm_as_judge.usage-note',
        message:
          "Judge model calls consume Agent units the same way the agent's own LLM calls do. Apply selectively to keep cost predictable, and choose the judge model with cost in mind — rates vary by model.",
      }),
      paramLabels: {
        guardrailText: _({
          id: 'guardrails.definitions.llm_as_judge.param.guardrailText.label',
          message: 'Rule prompt',
        }),
        model: _({
          id: 'guardrails.definitions.llm_as_judge.param.model.label',
          message: 'Judge model',
        }),
        positiveExamples: _({
          id: 'guardrails.definitions.llm_as_judge.param.positiveExamples.label',
          message: 'Positive examples',
        }),
        negativeExamples: _({
          id: 'guardrails.definitions.llm_as_judge.param.negativeExamples.label',
          message: 'Negative examples',
        }),
        threshold: _({
          id: 'guardrails.definitions.llm_as_judge.param.threshold.label',
          message: 'Strictness',
        }),
      },
      paramTooltips: {
        guardrailText: _({
          id: 'guardrails.definitions.llm_as_judge.param.guardrailText.tooltip',
          message:
            'Describe the rule the judge will enforce. Be specific about what should pass and what should fail.',
        }),
        model: _({
          id: 'guardrails.definitions.llm_as_judge.param.model.tooltip',
          message: 'The model used to evaluate the policy against each payload.',
        }),
        positiveExamples: _({
          id: 'guardrails.definitions.llm_as_judge.param.positiveExamples.tooltip',
          message:
            'Optional payloads that should pass the policy. Used by the judge as calibration anchors.',
        }),
        negativeExamples: _({
          id: 'guardrails.definitions.llm_as_judge.param.negativeExamples.tooltip',
          message:
            'Optional payloads that should fail the policy. Used by the judge as calibration anchors.',
        }),
        threshold: _({
          id: 'guardrails.definitions.llm_as_judge.param.threshold.tooltip',
          message:
            'Strictness on a 0–6 scale. Lower values are stricter — the judge flags anything that hints at a violation. Higher values are more lenient — only clear, unambiguous violations are flagged.',
        }),
      },
    },

    // Agents' wording throughout: Flow has no sentiment guardrail yet.
    sentiment: {
      displayName: _({
        id: 'guardrails.definitions.sentiment.display-name',
        message: 'Sentiment',
      }),
      description: _({
        id: 'guardrails.definitions.sentiment.description',
        message:
          'This validator is provided by Microsoft Azure AI Language and detects the sentiment of text in LLM calls, so a configured tone can be blocked.',
      }),
      paramLabels: {
        sentiments: _({
          id: 'guardrails.definitions.sentiment.param.sentiments.label',
          message: 'Sentiments',
        }),
        sentimentThresholds: _({
          id: 'guardrails.definitions.sentiment.param.sentimentThresholds.label',
          message: 'Confidence thresholds',
        }),
        language: _({
          id: 'guardrails.definitions.sentiment.param.language.label',
          message: 'Languages',
        }),
      },
      paramTooltips: {
        sentiments: _({
          id: 'guardrails.definitions.sentiment.param.sentiments.tooltip',
          message:
            'The guardrail trips when the detected sentiment is one of these. Mixed has no confidence score, so selecting it trips on the label alone and its threshold is ignored.',
        }),
        sentimentThresholds: _({
          id: 'guardrails.definitions.sentiment.param.sentimentThresholds.tooltip',
          message:
            'Minimum confidence, from 0 to 1, before a selected sentiment trips the guardrail. The threshold for Mixed has no effect.',
        }),
        language: _({
          id: 'guardrails.definitions.sentiment.param.language.tooltip',
          message:
            'Which language the text is scored as. One language is used directly; listing several detects the language first, which doubles the calls made to Azure.',
        }),
      },
      optionLabels: {
        sentiments: {
          Positive: _({
            id: 'guardrails.definitions.sentiment.option.sentiments.Positive',
            message: 'Positive',
          }),
          Neutral: _({
            id: 'guardrails.definitions.sentiment.option.sentiments.Neutral',
            message: 'Neutral',
          }),
          Negative: _({
            id: 'guardrails.definitions.sentiment.option.sentiments.Negative',
            message: 'Negative',
          }),
          Mixed: _({
            id: 'guardrails.definitions.sentiment.option.sentiments.Mixed',
            message: 'Mixed',
          }),
        },
        language: {
          en: _({ id: 'guardrails.definitions.sentiment.option.language.en', message: 'English' }),
          es: _({ id: 'guardrails.definitions.sentiment.option.language.es', message: 'Spanish' }),
          fr: _({ id: 'guardrails.definitions.sentiment.option.language.fr', message: 'French' }),
          de: _({ id: 'guardrails.definitions.sentiment.option.language.de', message: 'German' }),
          it: _({ id: 'guardrails.definitions.sentiment.option.language.it', message: 'Italian' }),
          'pt-BR': _({
            id: 'guardrails.definitions.sentiment.option.language.pt-BR',
            message: 'Portuguese (Brazil)',
          }),
          'pt-PT': _({
            id: 'guardrails.definitions.sentiment.option.language.pt-PT',
            message: 'Portuguese (Portugal)',
          }),
          nl: _({ id: 'guardrails.definitions.sentiment.option.language.nl', message: 'Dutch' }),
          sv: _({ id: 'guardrails.definitions.sentiment.option.language.sv', message: 'Swedish' }),
          da: _({ id: 'guardrails.definitions.sentiment.option.language.da', message: 'Danish' }),
          no: _({
            id: 'guardrails.definitions.sentiment.option.language.no',
            message: 'Norwegian',
          }),
          fi: _({ id: 'guardrails.definitions.sentiment.option.language.fi', message: 'Finnish' }),
          pl: _({ id: 'guardrails.definitions.sentiment.option.language.pl', message: 'Polish' }),
          cs: _({ id: 'guardrails.definitions.sentiment.option.language.cs', message: 'Czech' }),
          ru: _({ id: 'guardrails.definitions.sentiment.option.language.ru', message: 'Russian' }),
          uk: _({
            id: 'guardrails.definitions.sentiment.option.language.uk',
            message: 'Ukrainian',
          }),
          tr: _({ id: 'guardrails.definitions.sentiment.option.language.tr', message: 'Turkish' }),
          el: _({ id: 'guardrails.definitions.sentiment.option.language.el', message: 'Greek' }),
          he: _({ id: 'guardrails.definitions.sentiment.option.language.he', message: 'Hebrew' }),
          ar: _({ id: 'guardrails.definitions.sentiment.option.language.ar', message: 'Arabic' }),
          hi: _({ id: 'guardrails.definitions.sentiment.option.language.hi', message: 'Hindi' }),
          ja: _({ id: 'guardrails.definitions.sentiment.option.language.ja', message: 'Japanese' }),
          ko: _({ id: 'guardrails.definitions.sentiment.option.language.ko', message: 'Korean' }),
          'zh-hans': _({
            id: 'guardrails.definitions.sentiment.option.language.zh-hans',
            message: 'Chinese (Simplified)',
          }),
          'zh-hant': _({
            id: 'guardrails.definitions.sentiment.option.language.zh-hant',
            message: 'Chinese (Traditional)',
          }),
          id: _({
            id: 'guardrails.definitions.sentiment.option.language.id',
            message: 'Indonesian',
          }),
          vi: _({
            id: 'guardrails.definitions.sentiment.option.language.vi',
            message: 'Vietnamese',
          }),
          th: _({ id: 'guardrails.definitions.sentiment.option.language.th', message: 'Thai' }),
        },
      },
    },

    // Agents' wording throughout: Flow has no Jev classifier yet. The backend also labels
    // `questionPack` and `jevModel` itself, and the wire wins at parameter level, so these two
    // only show where it does not.
    jev_classifier: {
      displayName: _({
        id: 'guardrails.definitions.jev_classifier.display-name',
        message: 'Jev Classifier',
      }),
      description: _({
        id: 'guardrails.definitions.jev_classifier.description',
        message:
          "Evaluate yes/no questions against the payload with TypeSafe's Jev classifier. Pick a curated question pack, add your own questions, and flag when any answer's probability reaches the threshold.",
      }),
      paramLabels: {
        questionPack: _({
          id: 'guardrails.definitions.jev_classifier.param.questionPack.label',
          message: 'Question pack',
        }),
        questions: _({
          id: 'guardrails.definitions.jev_classifier.param.questions.label',
          message: 'Your questions',
        }),
        threshold: _({
          id: 'guardrails.definitions.jev_classifier.param.threshold.label',
          message: 'Flag threshold',
        }),
        jevModel: _({
          id: 'guardrails.definitions.jev_classifier.param.jevModel.label',
          message: 'Model',
        }),
      },
      paramTooltips: {
        questionPack: _({
          id: 'guardrails.definitions.jev_classifier.param.questionPack.tooltip',
          message:
            "A curated set of yes/no questions mirroring a built-in category. Pick 'Custom' to use only your own questions.",
        }),
        questions: _({
          id: 'guardrails.definitions.jev_classifier.param.questions.tooltip',
          message:
            "Yes/no questions about the payload, where 'yes' means the payload should be flagged. Added on top of the selected pack; required when the pack is 'Custom'.",
        }),
        threshold: _({
          id: 'guardrails.definitions.jev_classifier.param.threshold.tooltip',
          message:
            "Probability between 0 and 1. The guardrail flags the payload when any question's P(yes) reaches this value. Lower values are stricter.",
        }),
      },
      optionLabels: {
        questionPack: {
          custom: _({
            id: 'guardrails.definitions.jev_classifier.option.questionPack.custom',
            message: 'Custom (own questions only)',
          }),
          pii: _({
            id: 'guardrails.definitions.jev_classifier.option.questionPack.pii',
            message: 'PII',
          }),
          harmful_content: _({
            id: 'guardrails.definitions.jev_classifier.option.questionPack.harmful_content',
            message: 'Harmful content',
          }),
          prompt_injection: _({
            id: 'guardrails.definitions.jev_classifier.option.questionPack.prompt_injection',
            message: 'Prompt injection',
          }),
          intellectual_property: _({
            id: 'guardrails.definitions.jev_classifier.option.questionPack.intellectual_property',
            message: 'Intellectual property',
          }),
          secrets_and_credentials: _({
            id: 'guardrails.definitions.jev_classifier.option.questionPack.secrets_and_credentials',
            message: 'Secrets & credentials',
          }),
          compliance_commitments: _({
            id: 'guardrails.definitions.jev_classifier.option.questionPack.compliance_commitments',
            message: 'Compliance & commitments',
          }),
          scope_and_conduct: _({
            id: 'guardrails.definitions.jev_classifier.option.questionPack.scope_and_conduct',
            message: 'Scope & conduct',
          }),
          unsafe_tool_use: _({
            id: 'guardrails.definitions.jev_classifier.option.questionPack.unsafe_tool_use',
            message: 'Unsafe tool use',
          }),
          code_safety: _({
            id: 'guardrails.definitions.jev_classifier.option.questionPack.code_safety',
            message: 'Code safety',
          }),
        },
      },
    },
  };
}

/** The raw validator ids this package ships curated copy for. */
export const CURATED_GUARDRAIL_VALIDATORS: readonly string[] = Object.freeze([
  'pii_detection',
  'prompt_injection',
  'harmful_content',
  'user_prompt_attacks',
  'intellectual_property',
  'llm_as_judge',
  'sentiment',
  'jev_classifier',
]);

/**
 * The English copy, resolved without a lingui provider. This is the default
 * `enrichGuardrailDefinitions` uses, so the pure layer stays usable outside React.
 */
export const GUARDRAIL_COPY_EN: GuardrailCopyTable = buildGuardrailCopy(
  (descriptor) => descriptor.message
);

function collectEnglishMessages(): Record<string, string> {
  const messages: Record<string, string> = {};
  buildGuardrailCopy((descriptor) => {
    messages[descriptor.id] = descriptor.message;
    return descriptor.message;
  });
  return messages;
}

/**
 * The same copy flattened to message id to English string. Exported so hosts can diff their
 * remaining local tables against it in CI while they migrate off them.
 */
export const GUARDRAIL_COPY_EN_MESSAGES: Readonly<Record<string, string>> = Object.freeze(
  collectEnglishMessages()
);

/**
 * The curated copy in the active locale. Recomputes when the lingui context changes, which is
 * what makes a locale switch re-enrich in `useGuardrailDefinitions`. Without a provider every
 * string resolves to its English default.
 */
export function useGuardrailDefinitionCopy(): GuardrailCopyTable {
  const { _ } = useSafeLingui();
  return useMemo(() => buildGuardrailCopy(_), [_]);
}
