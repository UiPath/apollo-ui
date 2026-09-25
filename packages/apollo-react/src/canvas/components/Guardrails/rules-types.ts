import type { ReactNode } from 'react';

/**
 * Structural mirrors of the custom-guardrail rule shapes both products persist, so a host maps
 * nothing; mutual assignability is asserted host-side. The operator lists are the wire's, in the
 * order the operator select offers them.
 */

export type GuardrailFieldSource = 'input' | 'output';

/** One tool input or output field, as rules and filter actions reference it. */
export interface GuardrailFieldReference {
  path: string;
  source: GuardrailFieldSource;
  /** Display name, when the schema has one; `path` otherwise. */
  title?: string;
}

export type GuardrailFieldSelector =
  | { $selectorType: 'all' }
  | { $selectorType: 'specific'; fields: GuardrailFieldReference[] };

export const GUARDRAIL_RULE_OPERATORS = {
  word: [
    'contains',
    'doesNotContain',
    'equals',
    'doesNotEqual',
    'startsWith',
    'doesNotStartWith',
    'endsWith',
    'doesNotEndWith',
    'isEmpty',
    'isNotEmpty',
    'matchesRegex',
  ],
  number: [
    'equals',
    'doesNotEqual',
    'greaterThan',
    'greaterThanOrEqual',
    'lessThan',
    'lessThanOrEqual',
  ],
  boolean: ['equals'],
} as const;

export type GuardrailWordOperator = (typeof GUARDRAIL_RULE_OPERATORS.word)[number];
export type GuardrailNumberOperator = (typeof GUARDRAIL_RULE_OPERATORS.number)[number];
export type GuardrailBooleanOperator = (typeof GUARDRAIL_RULE_OPERATORS.boolean)[number];
export type GuardrailRuleOperator =
  | GuardrailWordOperator
  | GuardrailNumberOperator
  | GuardrailBooleanOperator;

export interface GuardrailWordRule {
  $ruleType: 'word';
  fieldSelector: GuardrailFieldSelector;
  operator: GuardrailWordOperator;
  /** Absent or ignored for `isEmpty` / `isNotEmpty`. */
  value?: string;
}

export interface GuardrailNumberRule {
  $ruleType: 'number';
  fieldSelector: GuardrailFieldSelector;
  operator: GuardrailNumberOperator;
  value: number;
}

export interface GuardrailBooleanRule {
  $ruleType: 'boolean';
  fieldSelector: GuardrailFieldSelector;
  operator: GuardrailBooleanOperator;
  value: boolean;
}

/** When an always-enforced guardrail runs: before the tool, after it, or both. */
export type GuardrailRuleApplyTo = 'input' | 'output' | 'inputAndOutput';

/** The "always enforce" rule. It stands alone: no other rule belongs next to it. */
export interface GuardrailAlwaysRule {
  $ruleType: 'always';
  applyTo: GuardrailRuleApplyTo;
}

/** A rule that checks tool fields, as opposed to the always rule. */
export type GuardrailFieldRule = GuardrailWordRule | GuardrailNumberRule | GuardrailBooleanRule;

export type GuardrailRule = GuardrailFieldRule | GuardrailAlwaysRule;

export type GuardrailRuleType = GuardrailRule['$ruleType'];

export type GuardrailFieldRuleType = GuardrailFieldRule['$ruleType'];

/** Selectable fields for one rule type, split by where they live. */
export interface GuardrailFieldGroup {
  input: GuardrailFieldReference[];
  output: GuardrailFieldReference[];
}

/**
 * The fields a rule of each type may target (`word` string fields, `number` numeric ones,
 * `boolean` boolean ones). A type with no entry, or an empty one, is not offered.
 */
export type GuardrailRuleFields = Partial<Record<GuardrailFieldRuleType, GuardrailFieldGroup>>;

/** Messages for one rule; every one is host-owned. */
export interface GuardrailRuleErrors {
  /** A specific selection with no fields in it. */
  fields?: string;
  value?: string;
}

export interface GuardrailRulesErrors {
  /** Section-level message: no rules, an always rule next to others, invalid rules. */
  rules?: string;
  /** Per-rule messages, aligned with `rules` by index. */
  perRule?: ReadonlyArray<GuardrailRuleErrors | undefined>;
}

/** Context handed to the `renderFieldSelector` slot, once per field rule. */
export interface GuardrailRuleFieldSelectorContext {
  /** Position of the rule in `rules`. */
  index: number;
  ruleType: GuardrailFieldRuleType;
  selector: GuardrailFieldSelector;
  /** What this rule's type may target; both lists are empty when nothing is. */
  fields: GuardrailFieldGroup;
  /** Replace the selector wholesale. */
  onChange: (selector: GuardrailFieldSelector) => void;
  /** Localized field label. */
  label: string;
  /**
   * Id of the field's `<label>` element. Name the control with `aria-labelledby={ctx.labelId}`:
   * the label points at the built-in picker only, so without it a slot's control is unnamed.
   */
  labelId: string;
  /** Whether the selection currently fails validation (style the control accordingly). */
  invalid: boolean;
  /** The validation message, when there is one. A slot that renders it owns it. */
  error?: string;
}

export type GuardrailRuleFieldSelectorRenderer = (
  ctx: GuardrailRuleFieldSelectorContext
) => ReactNode | undefined;
