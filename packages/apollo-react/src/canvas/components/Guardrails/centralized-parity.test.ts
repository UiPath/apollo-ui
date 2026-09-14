import { describe, expect, it } from 'vitest';
import { CENTRALIZED_GUARDRAILS_EN_LABELS, type CentralizedGuardrailsLabels } from './i18n';

/**
 * Pins the centralized section's English against what each product ships today.
 *
 * Same two rules as `definitions-parity.test.ts`: where the products already agree this
 * package says the same thing, and where they disagree the choice is declared with a reason
 * and matches the chosen product verbatim so its translations harvest cleanly.
 *
 * Transcribed from Agents `origin/main`
 * (`frontend-sw/src/components/definition/CentralizedGuardrailsSection/*`) and Flow
 * `origin/develop`
 * (`packages/canvas/src/components/properties-panel/guardrails/Centralized*`). When a product
 * changes its copy, update the baselines here and this suite says whether the choice holds.
 */

type Host = 'agents' | 'flow';

interface HostCopy {
  agents?: string;
  flow?: string;
}

/** What each product says today, keyed by our label. `undefined` means it has no equivalent. */
const HOST_COPY: Partial<Record<keyof CentralizedGuardrailsLabels, HostCopy>> = {
  title: { agents: 'Centralized guardrails', flow: 'Centralized guardrails' },
  info: {
    agents:
      "These guardrails are enforced by your organization's AI Trust Layer governance policy and cannot be edited here.",
    flow: "Your organization's AI Trust Layer governance policy enforces these guardrails. You cannot edit them here.",
  },
  docsLink: {
    agents: 'Learn more about centralized guardrails',
    flow: 'View centralized guardrails documentation',
  },
  policyCaption: {
    agents: 'Enforced by AI Trust Layer policy: {{policyName}}',
    flow: 'Enforced by AI Trust Layer policy: {{policyName}}',
  },
  viewDetails: { agents: 'View details for {{name}}', flow: 'View details for {{name}}' },
  guardrailType: { flow: 'Guardrail type' },
  policyField: { flow: 'AI Trust Layer policy' },
  provider: { agents: 'Provider', flow: 'Provider' },
  description: { agents: 'Description', flow: 'Guardrail description' },
  noDescription: { agents: 'No description available.', flow: 'No description available.' },
  executionStage: { agents: 'Execution stage', flow: 'Execution stage' },
  scopes: { agents: 'Scopes', flow: 'Scopes' },
  action: { agents: 'Action', flow: 'Action' },
  configuration: { agents: 'Configuration' },
  managedMessage: {
    agents:
      "This configuration is managed by your organization's AI Trust Layer governance policy and cannot be edited here.",
    flow: "Your organization's AI Trust Layer governance policy manages this configuration. You cannot edit it here.",
  },
  originByo: { agents: 'BYO', flow: 'BYO' },
  originUiPath: { agents: 'UiPath managed', flow: 'UiPath managed' },
  missingConfigMessage: {
    agents:
      "This guardrail's configuration could not be found — it may have been deleted. Contact your administrator to fix the AI Trust Layer policy.",
    flow: "This guardrail's configuration could not be found — it may have been deleted. Contact your administrator to fix the AI Trust Layer policy.",
  },
  disabledConfigMessage: {
    agents:
      "This guardrail's configuration has been disabled. Contact your administrator to re-enable it.",
    flow: "This guardrail's configuration has been disabled. Contact your administrator to re-enable it.",
  },
  stagePre: { agents: 'Pre-execution', flow: 'Pre-execution' },
  stagePost: { agents: 'Post-execution', flow: 'Post-execution' },
  stageBoth: { agents: 'Pre & post-execution', flow: 'Pre & post-execution' },
  scopeAgent: { agents: 'Agent', flow: 'Agent' },
  scopeLlm: { agents: 'LLM calls', flow: 'LLM calls' },
  scopeTool: { agents: 'Tools', flow: 'Tools' },
  actionBlock: { agents: 'Block', flow: 'Block' },
  actionEscalate: { agents: 'Escalate', flow: 'Escalate' },
  actionFilter: { agents: 'Filter', flow: 'Filter' },
  actionLog: { agents: 'Log', flow: 'Log' },
  parameterEnabled: { agents: 'Enabled', flow: 'Enabled' },
  parameterDisabled: { agents: 'Disabled', flow: 'Disabled' },
  entitiesFallback: { agents: 'Entities to detect', flow: 'Entities to detect' },
  thresholdsFallback: { agents: 'Detection threshold', flow: 'Detection thresholds' },
};

interface CopyDivergence {
  label: keyof CentralizedGuardrailsLabels;
  chosen: Host;
  reason: string;
}

const EXPECTED_DIVERGENCES: CopyDivergence[] = [
  {
    label: 'info',
    chosen: 'flow',
    reason:
      'Active voice and two short sentences; Agents buries the subject in a relative clause. Also the only one of the pair that is translated anywhere',
  },
  {
    label: 'docsLink',
    chosen: 'flow',
    reason:
      'Agents’ "Learn more about…" reads better, but it ships untranslated in all twelve locales while Flow’s is at 100%, and an untranslated link label is worse than a plainer one',
  },
  {
    label: 'description',
    chosen: 'flow',
    reason:
      'Matches the builder’s own field label, whose id this reuses, so one string covers both screens',
  },
  {
    label: 'managedMessage',
    chosen: 'flow',
    reason: 'Same voice as the section’s info text, which is also Flow’s',
  },
  {
    label: 'thresholdsFallback',
    chosen: 'flow',
    reason:
      'Plural: this labels a list of per-entity thresholds, not one column header as in Agents’ table',
  },
];

/** Labels only one product has; adopting it costs the other nothing. */
const SINGLE_SOURCE: Array<keyof CentralizedGuardrailsLabels> = [
  'guardrailType',
  'policyField',
  'configuration',
];

/** This component's own additions: no product ships an equivalent string. */
const OWN_ADDITIONS: Array<keyof CentralizedGuardrailsLabels> = [
  'statusMissingConfig',
  'statusDisabledConfig',
];

describe('centralized guardrails copy', () => {
  const divergenceFor = (label: keyof CentralizedGuardrailsLabels) =>
    EXPECTED_DIVERGENCES.find((entry) => entry.label === label);

  it('says exactly what both products say wherever they already agree', () => {
    const invented: string[] = [];
    for (const [label, hosts] of Object.entries(HOST_COPY) as Array<
      [keyof CentralizedGuardrailsLabels, HostCopy]
    >) {
      if (hosts.agents === undefined || hosts.flow === undefined) continue;
      if (hosts.agents !== hosts.flow) continue;
      const ours = CENTRALIZED_GUARDRAILS_EN_LABELS[label];
      if (ours !== hosts.agents)
        invented.push(`${label}\n    both: ${hosts.agents}\n    ours: ${ours}`);
    }

    expect(invented).toEqual([]);
  });

  it('matches the chosen product verbatim wherever they disagree', () => {
    const wrong: string[] = [];
    for (const divergence of EXPECTED_DIVERGENCES) {
      const chosen = HOST_COPY[divergence.label]?.[divergence.chosen];
      const ours = CENTRALIZED_GUARDRAILS_EN_LABELS[divergence.label];
      if (chosen !== ours) {
        wrong.push(`${divergence.label}\n    ${divergence.chosen}: ${chosen}\n    ours: ${ours}`);
      }
    }

    expect(wrong).toEqual([]);
  });

  it('declares every disagreement, so a silent third wording cannot slip in', () => {
    const undeclared: string[] = [];
    for (const [label, hosts] of Object.entries(HOST_COPY) as Array<
      [keyof CentralizedGuardrailsLabels, HostCopy]
    >) {
      const disagree =
        hosts.agents !== undefined && hosts.flow !== undefined && hosts.agents !== hosts.flow;
      if (disagree && divergenceFor(label) === undefined) undeclared.push(label);
      if (!disagree && divergenceFor(label) !== undefined) {
        undeclared.push(`${label} (declared, but the products agree)`);
      }
    }

    expect(undeclared).toEqual([]);
  });

  it('accounts for every string this component owns', () => {
    const unaccounted = (
      Object.keys(CENTRALIZED_GUARDRAILS_EN_LABELS) as Array<keyof CentralizedGuardrailsLabels>
    ).filter(
      (label) =>
        HOST_COPY[label] === undefined &&
        !SINGLE_SOURCE.includes(label) &&
        !OWN_ADDITIONS.includes(label)
    );

    expect(unaccounted).toEqual([]);
  });

  it('adopts a single-source label verbatim from the product that has it', () => {
    for (const label of SINGLE_SOURCE) {
      const hosts = HOST_COPY[label];
      const only = hosts?.agents ?? hosts?.flow;
      expect(CENTRALIZED_GUARDRAILS_EN_LABELS[label]).toBe(only);
    }
  });
});
