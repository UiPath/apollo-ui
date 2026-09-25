import { describe, expect, it } from 'vitest';
import { GUARDRAIL_RULES_EN_LABELS, type GuardrailRulesLabels } from './i18n';

/**
 * Pins the rules section's English against each product, by the rules of
 * `centralized-parity.test.ts`. Transcribed from Agents `origin/main`
 * (`frontend-sw/src/components/definition/GuardrailRulesSection/*`,
 * `ToolGuardrailPolicyBuilder/{ToolGuardrailPolicyBuilder.utils,.elements,GuardrailActionBuilder}.tsx`)
 * and Flow `origin/develop`
 * (`packages/canvas/src/components/properties-panel/guardrails/{RulesSection,RuleFormItem,FieldSelectorPopover,FilterFieldSelector,guardrail-utils}.ts(x)`).
 * Templates are written in this package's `{{token}}` convention.
 */

type Host = 'agents' | 'flow';
type Label = keyof GuardrailRulesLabels;

interface HostCopy {
  agents?: string;
  flow?: string;
}

/** What each product says today, keyed by our label. `undefined` means it has no equivalent. */
const HOST_COPY: Partial<Record<Label, HostCopy>> = {
  alwaysEnforceLabel: {
    agents: 'Always enforce the guardrail',
    flow: 'Always enforce the guardrail',
  },
  alwaysEnforceEnabledHint: {
    agents: 'When enabled, the action will be applied during the selected tool execution stage.',
    flow: 'When enabled, the action will be applied during the selected tool execution stage.',
  },
  alwaysEnforceDisabledHint: {
    agents: 'Otherwise, action will be applied only when all of the defined rules are met.',
    flow: 'Otherwise, action will be applied only when all of the defined rules are met.',
  },
  // Agents names its info icon with the whole tooltip text instead.
  moreInformation: { flow: 'More information' },
  applyToLabel: {
    agents: 'Enforce guardrail action during',
    flow: 'Enforce guardrail action during',
  },
  applyToInput: { agents: 'Tool pre-execution', flow: 'Pre-execution (input)' },
  applyToOutput: { agents: 'Tool post-execution', flow: 'Post-execution (output)' },
  applyToInputAndOutput: {
    agents: 'Tool pre-execution and post-execution',
    flow: 'Pre-execution and post-execution',
  },
  // Agents' is the card's aria-label, `Rule` and the position concatenated.
  ruleTitle: { agents: 'Rule {{position}}', flow: 'Rule' },
  deleteRule: { agents: 'Delete rule {{position}}', flow: 'Delete rule' },
  addRule: { agents: 'Add rule', flow: 'Add rule' },
  ruleTypeLabel: { agents: 'Rule type', flow: 'Rule type' },
  ruleTypeWord: { agents: 'String', flow: 'String' },
  ruleTypeNumber: { agents: 'Number', flow: 'Number' },
  ruleTypeBoolean: { agents: 'Boolean', flow: 'Boolean' },
  // Agents writes the required marker into the visible text ("Apply to fields *").
  fieldsLabel: { agents: 'Apply to fields', flow: 'Apply to fields' },
  operatorLabel: { agents: 'Operator', flow: 'Operator' },
  operatorContains: { agents: 'contains', flow: 'Contains' },
  operatorDoesNotContain: { agents: 'does not contain', flow: 'Does not contain' },
  operatorEquals: { agents: 'equals', flow: 'Equals' },
  operatorDoesNotEqual: { agents: 'does not equal', flow: 'Does not equal' },
  operatorStartsWith: { agents: 'starts with', flow: 'Starts with' },
  operatorDoesNotStartWith: { agents: 'does not start with', flow: 'Does not start with' },
  operatorEndsWith: { agents: 'ends with', flow: 'Ends with' },
  operatorDoesNotEndWith: { agents: 'does not end with', flow: 'Does not end with' },
  operatorIsEmpty: { agents: 'is empty', flow: 'Is empty' },
  operatorIsNotEmpty: { agents: 'is not empty', flow: 'Is not empty' },
  operatorMatchesRegex: { agents: 'matches regex', flow: 'Matches regex' },
  operatorGreaterThan: { agents: 'greater than', flow: 'Greater than' },
  operatorGreaterThanOrEqual: { agents: 'greater than or equal', flow: 'Greater than or equal' },
  operatorLessThan: { agents: 'less than', flow: 'Less than' },
  operatorLessThanOrEqual: { agents: 'less than or equal', flow: 'Less than or equal' },
  valueLabel: { agents: 'Value', flow: 'Value' },
  valuePlaceholder: { flow: 'Enter value' },
  valueTrue: { agents: 'True', flow: 'True' },
  valueFalse: { agents: 'False', flow: 'False' },
  allFields: { agents: 'All', flow: 'All fields' },
  selectFields: { agents: 'Choose fields', flow: 'Select fields' },
  // Agents lists the picked fields as chips inside the input and has no summary.
  fieldsSelected: { flow: '{{count}} fields selected' },
  searchFields: { flow: 'Search fields...' },
  noFieldsFound: { agents: 'No options', flow: 'No fields found' },
  inputGroup: { agents: 'Input', flow: 'Input' },
  outputGroup: { agents: 'Output', flow: 'Output' },
  filterFieldsLabel: { agents: 'Select fields', flow: 'Fields to filter' },
  filterFieldsTooltip: {
    agents: 'Selected fields will be excluded from the input/output of the tool',
  },
  filterNoSchema: { flow: 'No schema available to show fields' },
};

interface CopyDivergence {
  label: Label;
  chosen: Host;
  reason: string;
}

const APPLY_TO_REASON =
  'Names the data the stage sees, the Input / Output the field picker groups by; Agents’ "Tool" prefix restates what the whole section is about';

const OPERATOR_REASON =
  'Sentence case, like every other option label in the family (Log, Block, Info); Agents lowercases them to read as a phrase';

const OPERATOR_LABELS: Label[] = [
  'operatorContains',
  'operatorDoesNotContain',
  'operatorEquals',
  'operatorDoesNotEqual',
  'operatorStartsWith',
  'operatorDoesNotStartWith',
  'operatorEndsWith',
  'operatorDoesNotEndWith',
  'operatorIsEmpty',
  'operatorIsNotEmpty',
  'operatorMatchesRegex',
  'operatorGreaterThan',
  'operatorGreaterThanOrEqual',
  'operatorLessThan',
  'operatorLessThanOrEqual',
];

const EXPECTED_DIVERGENCES: CopyDivergence[] = [
  { label: 'applyToInput', chosen: 'flow', reason: APPLY_TO_REASON },
  { label: 'applyToOutput', chosen: 'flow', reason: APPLY_TO_REASON },
  { label: 'applyToInputAndOutput', chosen: 'flow', reason: APPLY_TO_REASON },
  {
    label: 'ruleTitle',
    chosen: 'agents',
    reason:
      'Numbered, so a message about one rule can point at it; Flow repeats a bare "Rule" on every card, and here it also names the card’s group',
  },
  {
    label: 'deleteRule',
    chosen: 'agents',
    reason:
      'Names the rule it deletes; Flow’s identical "Delete rule" on every card cannot be told apart by a screen reader',
  },
  ...OPERATOR_LABELS.map((label) => ({ label, chosen: 'flow' as const, reason: OPERATOR_REASON })),
  {
    label: 'allFields',
    chosen: 'flow',
    reason: 'It is also the trigger’s summary of the selection, where a bare "All" says nothing',
  },
  {
    label: 'selectFields',
    chosen: 'flow',
    reason: 'The family’s pickers already say "Select…" (the validator form’s placeholders)',
  },
  {
    label: 'noFieldsFound',
    chosen: 'flow',
    reason: 'Says what is missing; Agents’ "No options" is the generic Autocomplete text',
  },
  {
    label: 'filterFieldsLabel',
    chosen: 'flow',
    reason:
      'Names the field rather than instructing; the empty trigger already says "Select fields"',
  },
];

/** Labels only one product has; adopting it costs the other nothing. */
const SINGLE_SOURCE: Label[] = [
  'moreInformation',
  'valuePlaceholder',
  'fieldsSelected',
  'searchFields',
  'filterFieldsTooltip',
  'filterNoSchema',
];

describe('rules section copy', () => {
  const divergenceFor = (label: Label) =>
    EXPECTED_DIVERGENCES.find((entry) => entry.label === label);

  it('says exactly what both products say wherever they already agree', () => {
    const invented: string[] = [];
    for (const [label, hosts] of Object.entries(HOST_COPY) as Array<[Label, HostCopy]>) {
      if (hosts.agents === undefined || hosts.flow === undefined) continue;
      if (hosts.agents !== hosts.flow) continue;
      const ours = GUARDRAIL_RULES_EN_LABELS[label];
      if (ours !== hosts.agents)
        invented.push(`${label}\n    both: ${hosts.agents}\n    ours: ${ours}`);
    }

    expect(invented).toEqual([]);
  });

  it('matches the chosen product verbatim wherever they disagree', () => {
    const wrong: string[] = [];
    for (const divergence of EXPECTED_DIVERGENCES) {
      const chosen = HOST_COPY[divergence.label]?.[divergence.chosen];
      const ours = GUARDRAIL_RULES_EN_LABELS[divergence.label];
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

  it('accounts for every string this component owns', () => {
    const unaccounted = (Object.keys(GUARDRAIL_RULES_EN_LABELS) as Label[]).filter(
      (label) => HOST_COPY[label] === undefined
    );

    expect(unaccounted).toEqual([]);
  });

  it('adopts a single-source label verbatim from the product that has it', () => {
    for (const label of SINGLE_SOURCE) {
      const hosts = HOST_COPY[label];
      const only = hosts?.agents ?? hosts?.flow;
      expect(GUARDRAIL_RULES_EN_LABELS[label]).toBe(only);
    }
  });

  it('declares every label only one product has as single-source', () => {
    const undeclared = (Object.entries(HOST_COPY) as Array<[Label, HostCopy]>)
      .filter(([, hosts]) => (hosts.agents === undefined) !== (hosts.flow === undefined))
      .map(([label]) => label)
      .filter((label) => !SINGLE_SOURCE.includes(label));

    expect(undeclared).toEqual([]);
  });
});
