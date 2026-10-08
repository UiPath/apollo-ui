import { describe, expect, it } from 'vitest';
import { AGENTS_COPY_EN, FLOW_COPY_EN } from './__fixtures__/host-copy-baselines';
import {
  CURATED_GUARDRAIL_VALIDATORS,
  GUARDRAIL_COPY_EN,
  type GuardrailCopyTable,
} from './definitions-copy';

/**
 * Pins this package's English copy against what each product ships today.
 *
 * Three rules, all enforced mechanically:
 *
 * 1. Where the products already agree, this package says the same thing. Inventing a third
 *    wording is how a shared table stops being adoptable.
 * 2. Where they disagree, the choice is declared below with a reason, and this package says
 *    exactly what the chosen product says, so its existing translations harvest cleanly.
 * 3. A validator only one product ships takes that product's copy verbatim, and is declared
 *    as such below.
 *
 * When a product changes its copy, update `__fixtures__/host-copy-baselines.ts` first: this
 * suite then says whether the choice still holds.
 */

type Host = 'agents' | 'flow';

interface CopyDivergence {
  /** Dotted path into the flattened copy table. */
  path: string;
  chosen: Host;
  reason: string;
}

const EXPECTED_DIVERGENCES: CopyDivergence[] = [
  // Descriptions: Flow's are one sentence and say what the validator does. Agents' open with
  // "This validator is designed to..." / "...is provided by X and is built to...", which
  // costs a line of panel space to say nothing.
  {
    path: 'pii_detection.description',
    chosen: 'flow',
    reason: 'Concise, drops the "This validator is designed to" preamble',
  },
  {
    path: 'harmful_content.description',
    chosen: 'flow',
    reason: 'Concise; keeps the Azure AI Content Safety attribution',
  },
  {
    path: 'intellectual_property.description',
    chosen: 'flow',
    reason: 'Concise; keeps the Azure AI Content Safety attribution',
  },
  {
    path: 'user_prompt_attacks.description',
    chosen: 'flow',
    reason: 'Concise; keeps the Azure AI Content Safety attribution',
  },
  {
    path: 'prompt_injection.description',
    chosen: 'agents',
    reason:
      'The deliberate exception to the concision rule: Flow drops the Noma Security attribution, and naming the third-party vendor behind a validator is load-bearing',
  },

  // Parameter labels: Flow's name the thing being configured; Agents reuses one generic
  // label across validators, so two different parameters read identically in one panel.
  {
    path: 'pii_detection.paramLabels.entityThresholds',
    chosen: 'flow',
    reason: 'Plural: there is one threshold per selected entity',
  },
  {
    path: 'harmful_content.paramLabels.harmfulContentEntities',
    chosen: 'flow',
    reason: '"Content categories" beats "Entities to detect", which PII already uses',
  },
  {
    path: 'harmful_content.paramLabels.harmfulContentEntityThresholds',
    chosen: 'flow',
    reason: 'It is a severity scale, and there is one per category',
  },
  {
    path: 'intellectual_property.paramLabels.ipEntities',
    chosen: 'flow',
    reason: '"Content types" beats "Entities to detect", which PII already uses',
  },
  {
    path: 'llm_as_judge.paramLabels.threshold',
    chosen: 'flow',
    reason: '"Strictness" says which direction the number moves; "Threshold" does not',
  },
  {
    path: 'llm_as_judge.paramTooltips.threshold',
    chosen: 'flow',
    reason: 'Matches the "Strictness" label it explains',
  },

  // Option labels.
  {
    path: 'harmful_content.optionLabels.harmfulContentEntities.SelfHarm',
    chosen: 'flow',
    reason: 'Agents shows the raw enum value "SelfHarm"',
  },
  {
    path: 'pii_detection.optionLabels.entities.FIPassportNumber',
    chosen: 'agents',
    reason: 'Flow omits an entity the backend returns, so Flow renders the raw value today',
  },

  // Strings only one product has. Adopting them makes both products better off.
  {
    path: 'pii_detection.paramTooltips.entityThresholds',
    chosen: 'agents',
    reason: 'Real guidance on the 0..1 scale; Flow ships no tooltip',
  },
  {
    path: 'prompt_injection.paramTooltips.threshold',
    chosen: 'agents',
    reason: 'Real guidance on the 0..1 scale; Flow ships no tooltip',
  },
  {
    path: 'harmful_content.paramTooltips.harmfulContentEntityThresholds',
    chosen: 'agents',
    reason: 'Explains the 0..6 step-2 severity scale; Flow ships no tooltip',
  },
  {
    path: 'llm_as_judge.usageNote',
    chosen: 'flow',
    reason: 'Agent-unit cost caveat; Agents users need it just as much',
  },
];

/**
 * Validators only one product curates so far, so there is nothing to choose between. Remove the
 * entry once the other product ships the validator: its strings then fall under the rules above.
 */
const SINGLE_HOST_VALIDATORS: Readonly<Record<string, Host>> = {
  sentiment: 'agents',
  jev_classifier: 'agents',
};

function flatten(table: GuardrailCopyTable): Map<string, string> {
  const flat = new Map<string, string>();
  for (const [validator, copy] of Object.entries(table)) {
    flat.set(`${validator}.displayName`, copy.displayName);
    flat.set(`${validator}.description`, copy.description);
    if (copy.usageNote !== undefined) flat.set(`${validator}.usageNote`, copy.usageNote);
    for (const [id, label] of Object.entries(copy.paramLabels)) {
      flat.set(`${validator}.paramLabels.${id}`, label);
    }
    for (const [id, tooltip] of Object.entries(copy.paramTooltips ?? {})) {
      flat.set(`${validator}.paramTooltips.${id}`, tooltip);
    }
    for (const [paramId, options] of Object.entries(copy.optionLabels ?? {})) {
      for (const [option, label] of Object.entries(options)) {
        flat.set(`${validator}.optionLabels.${paramId}.${option}`, label);
      }
    }
  }
  return flat;
}

const agents = flatten(AGENTS_COPY_EN);
const flow = flatten(FLOW_COPY_EN);
const ours = flatten(GUARDRAIL_COPY_EN);
const allPaths = [...new Set([...agents.keys(), ...flow.keys(), ...ours.keys()])].sort();
const divergenceByPath = new Map(EXPECTED_DIVERGENCES.map((d) => [d.path, d]));

const validatorOf = (path: string) => path.slice(0, path.indexOf('.'));
/** The paths both products could have an opinion on. */
const sharedPaths = allPaths.filter(
  (path) => !Object.hasOwn(SINGLE_HOST_VALIDATORS, validatorOf(path))
);
const pathsOf = (flat: Map<string, string>, validator: string) =>
  new Map([...flat].filter(([path]) => validatorOf(path) === validator));

describe('canonical copy parity with both products', () => {
  it('covers every validator either product curates', () => {
    const hostValidators = new Set([...Object.keys(AGENTS_COPY_EN), ...Object.keys(FLOW_COPY_EN)]);

    expect([...CURATED_GUARDRAIL_VALIDATORS].sort()).toEqual([...hostValidators].sort());
    expect(Object.keys(GUARDRAIL_COPY_EN).sort()).toEqual([...CURATED_GUARDRAIL_VALIDATORS].sort());
  });

  it('declares every validator only one product curates', () => {
    const singleHost = CURATED_GUARDRAIL_VALIDATORS.filter(
      (validator) =>
        Object.hasOwn(AGENTS_COPY_EN, validator) !== Object.hasOwn(FLOW_COPY_EN, validator)
    );

    expect([...singleHost].sort()).toEqual(Object.keys(SINGLE_HOST_VALIDATORS).sort());
  });

  it.each(
    Object.entries(SINGLE_HOST_VALIDATORS)
  )('%s takes the %s wording verbatim, as the only product that ships it', (validator, host) => {
    const source = pathsOf(host === 'agents' ? agents : flow, validator);

    expect(source.size).toBeGreaterThan(0);
    expect(pathsOf(ours, validator)).toEqual(source);
  });

  it('matches both products wherever they already agree', () => {
    const invented = sharedPaths
      .filter((path) => agents.get(path) === flow.get(path))
      .filter((path) => ours.get(path) !== agents.get(path))
      .map((path) => `${path}\n    ours:  ${ours.get(path)}\n    hosts: ${agents.get(path)}`);

    expect(invented).toEqual([]);
  });

  it('declares every disagreement between the products', () => {
    const undeclared = sharedPaths
      .filter((path) => agents.get(path) !== flow.get(path))
      .filter((path) => !divergenceByPath.has(path))
      .map((path) => `${path}\n    agents: ${agents.get(path)}\n    flow:   ${flow.get(path)}`);

    expect(undeclared).toEqual([]);
  });

  it('has no stale divergence entries', () => {
    const settled = EXPECTED_DIVERGENCES.filter(
      ({ path }) => agents.get(path) === flow.get(path)
    ).map(({ path }) => path);

    expect(settled).toEqual([]);
  });

  it.each(EXPECTED_DIVERGENCES)('$path takes the $chosen wording: $reason', ({ path, chosen }) => {
    const expected = chosen === 'agents' ? agents.get(path) : flow.get(path);

    expect(expected).toBeDefined();
    expect(ours.get(path)).toBe(expected);
  });

  it('takes every string from one product or the other', () => {
    // A string in neither baseline would be copy nobody has translated and nobody reviewed.
    const unsourced = allPaths.filter(
      (path) => ours.has(path) && !agents.has(path) && !flow.has(path)
    );

    expect(unsourced).toEqual([]);
  });
});
