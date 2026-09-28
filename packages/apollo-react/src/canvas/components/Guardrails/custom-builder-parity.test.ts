import { describe, expect, it } from 'vitest';
import { CUSTOM_GUARDRAIL_BUILDER_EN_LABELS, type CustomGuardrailBuilderLabels } from './i18n';

/**
 * Pins the custom builder's English against each product's custom-guardrail screen, by the rules
 * of `rules-parity.test.ts`. Transcribed from Agents `origin/main`
 * (`frontend-sw/src/components/definition/ToolGuardrailPolicyBuilder/ToolGuardrailPolicyBuilder{Legacy,.utils}.tsx`,
 * `GuardrailRulesSection/GuardrailDeterministicRulesSection.tsx`) and Flow `origin/develop`
 * (`packages/canvas/src/components/properties-panel/guardrails/{DeterministicGuardrailsBuilder,guardrail-utils,MixedScopesBannerLegacy,GuardrailFormLayout}.ts(x)`,
 * `packages/canvas/locales/en.json`), plus Flow's draft rules adapter (flow-workbench#4392) for the
 * one per-rule message it adds. Templates are written in this package's `{{token}}` convention.
 * The shared builder chrome comes from `GuardrailBuilder`'s block and is pinned here too, since it
 * is what a custom guardrail's screen shows.
 */

type Host = 'agents' | 'flow';
type Label = keyof CustomGuardrailBuilderLabels;

interface HostCopy {
  agents?: string;
  flow?: string;
}

/** What each product says today, keyed by our label. `undefined` means it has no equivalent. */
const HOST_COPY: Record<Label, HostCopy> = {
  // Agents has one title for both, naming the tool.
  addTitle: { agents: 'Custom guardrail builder for {{toolName}}', flow: 'Add custom guardrail' },
  editTitle: { agents: 'Custom guardrail builder for {{toolName}}', flow: 'Edit custom guardrail' },
  // Both emphasize "all"; the text is the same, and here it renders plain.
  helpText: {
    agents:
      'Guardrail is a collection of rules and action that should happen when all of the rules are met.',
    flow: 'Guardrail is a collection of rules and action that should happen when all of the rules are met.',
  },
  helpDocs: {
    agents: 'Learn more about Tool Guardrail rules and actions {{docsLink}}',
    flow: 'Learn more about Guardrail rules and actions {{docsLink}}',
  },
  docsLink: { agents: 'here', flow: 'here' },
  rulesRequiredError: {
    agents: 'At least one rule is required to be present',
    flow: 'At least one rule is required',
  },
  rulesInvalidError: {
    agents: 'One or more rules are invalid. Please check that all required fields are filled.',
    flow: 'One or more rules are invalid',
  },
  // Flow never reports the mix; it saves it.
  rulesAlwaysCombinedError: {
    agents: "You cannot combine an 'Always enforce guardrail' with any other rule type",
  },
  ruleFieldsRequiredError: { agents: 'Fields selection is required' },
  // Flow's is the draft rules adapter's, flow-workbench#4392; `develop` shows no per-rule message.
  ruleValueRequiredError: { agents: 'Value is required', flow: 'Enter a value' },
  nameLabel: { agents: 'Guardrail name', flow: 'Guardrail name' },
  // Agents' fields are MUI text fields with a floating label and no placeholder.
  namePlaceholder: { flow: 'Enter guardrail name' },
  descriptionLabel: { agents: 'Guardrail description', flow: 'Guardrail description' },
  descriptionPlaceholder: { flow: 'Enter guardrail description' },
  evalsLabel: {
    agents: 'Enable guardrail for evaluations',
    flow: 'Enable guardrail for evaluations',
  },
  // Agents names its info icon with the whole tooltip text instead.
  evalsInfoAriaLabel: { flow: 'More information' },
  evalsTooltip: {
    agents: 'When enabled, this guardrail will be applied during evaluation runs',
    flow: 'When enabled, this guardrail will be applied during evaluation runs.',
  },
  saveAsNew: { agents: 'Save as new', flow: 'Save as new' },
  cancel: { agents: 'Cancel', flow: 'Cancel' },
  save: { agents: 'Save', flow: 'Save' },
  mixedScopesAlsoApplied: {
    agents:
      'This guardrail is already used for other scopes or tools. By saving the changes, you will also update it for:',
    flow: 'This guardrail is also applied to:',
  },
  mixedScopesSaveAsNewHint: {
    flow: 'Use "Save as new" to create a separate copy for this tool only.',
  },
  nameRequiredError: { agents: 'Guardrail name is required', flow: 'Guardrail name is required' },
  nameDuplicateError: {
    agents: 'A guardrail with this name already exists',
    flow: 'A guardrail with this name already exists',
  },
  blockReasonRequiredError: {
    agents: 'Block reason is required',
    flow: 'Block reason is required',
  },
  filterFieldsRequiredError: {
    agents: 'Fields selection is required',
    flow: 'Fields selection is required',
  },
  recipientRequiredError: { agents: 'Recipient is required', flow: 'Recipient is required' },
  actionAppRequiredError: { agents: 'Action app is required', flow: 'Action app is required' },
};

interface CopyDivergence {
  label: Label;
  chosen: Host;
  reason: string;
}

const TITLE_REASON =
  'The built-in screen’s "Add/Edit {{name}} guardrail" pattern, which needs no tool name; a host that wants Agents’ title passes it as `title`';

const BUILDER_CHROME_REASON =
  'GuardrailBuilder’s own wording, shared with the built-in screen and already shown on Agents’ Apollo built-in path';

const EXPECTED_DIVERGENCES: CopyDivergence[] = [
  { label: 'addTitle', chosen: 'flow', reason: TITLE_REASON },
  { label: 'editTitle', chosen: 'flow', reason: TITLE_REASON },
  {
    label: 'helpDocs',
    chosen: 'flow',
    reason: 'Custom guardrails are tool guardrails in both products, so "Tool" restates the screen',
  },
  {
    label: 'rulesRequiredError',
    chosen: 'flow',
    reason: 'Reads like the family’s other "At least one … is required" messages (scopes, tools)',
  },
  {
    label: 'rulesInvalidError',
    chosen: 'flow',
    reason:
      'Each failing rule names its own field now, so the section line need not send the user looking',
  },
  {
    label: 'ruleValueRequiredError',
    chosen: 'agents',
    reason:
      'Reads like every other required message on the screen (name, block reason, recipient, fields selection)',
  },
  { label: 'evalsTooltip', chosen: 'flow', reason: BUILDER_CHROME_REASON },
  { label: 'mixedScopesAlsoApplied', chosen: 'flow', reason: BUILDER_CHROME_REASON },
];

/** Labels only one product has; adopting it costs the other nothing. */
const SINGLE_SOURCE: Label[] = [
  'rulesAlwaysCombinedError',
  'ruleFieldsRequiredError',
  'namePlaceholder',
  'descriptionPlaceholder',
  'evalsInfoAriaLabel',
  'mixedScopesSaveAsNewHint',
];

describe('custom builder copy', () => {
  const divergenceFor = (label: Label) =>
    EXPECTED_DIVERGENCES.find((entry) => entry.label === label);

  it('says exactly what both products say wherever they already agree', () => {
    const invented: string[] = [];
    for (const [label, hosts] of Object.entries(HOST_COPY) as Array<[Label, HostCopy]>) {
      if (hosts.agents === undefined || hosts.flow === undefined) continue;
      if (hosts.agents !== hosts.flow) continue;
      const ours = CUSTOM_GUARDRAIL_BUILDER_EN_LABELS[label];
      if (ours !== hosts.agents)
        invented.push(`${label}\n    both: ${hosts.agents}\n    ours: ${ours}`);
    }

    expect(invented).toEqual([]);
  });

  it('matches the chosen product verbatim wherever they disagree', () => {
    const wrong: string[] = [];
    for (const divergence of EXPECTED_DIVERGENCES) {
      const chosen = HOST_COPY[divergence.label][divergence.chosen];
      const ours = CUSTOM_GUARDRAIL_BUILDER_EN_LABELS[divergence.label];
      if (chosen !== ours) {
        wrong.push(`${divergence.label}\n    ${divergence.chosen}: ${chosen}\n    ours: ${ours}`);
      }
    }

    expect(wrong).toEqual([]);
  });

  it('declares every disagreement, so a silent third wording cannot slip in', () => {
    const undeclared: string[] = [];
    for (const [label, hosts] of Object.entries(HOST_COPY) as Array<[Label, HostCopy]>) {
      const disagree =
        hosts.agents !== undefined && hosts.flow !== undefined && hosts.agents !== hosts.flow;
      if (disagree && divergenceFor(label) === undefined) undeclared.push(label);
      if (!disagree && divergenceFor(label) !== undefined) {
        undeclared.push(`${label} (declared, but the products agree)`);
      }
    }

    expect(undeclared).toEqual([]);
  });

  it('accounts for every string the screen shows', () => {
    expect(Object.keys(HOST_COPY).sort()).toEqual(
      Object.keys(CUSTOM_GUARDRAIL_BUILDER_EN_LABELS).sort()
    );
  });

  it('adopts a single-source label verbatim from the product that has it, and lists it', () => {
    const singleSourced = (Object.entries(HOST_COPY) as Array<[Label, HostCopy]>)
      .filter(([, hosts]) => (hosts.agents === undefined) !== (hosts.flow === undefined))
      .map(([label]) => label);

    expect([...singleSourced].sort()).toEqual([...SINGLE_SOURCE].sort());
    for (const label of SINGLE_SOURCE) {
      const hosts = HOST_COPY[label];
      expect(CUSTOM_GUARDRAIL_BUILDER_EN_LABELS[label]).toBe(hosts.agents ?? hosts.flow);
    }
  });
});
