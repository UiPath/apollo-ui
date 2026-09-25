import type {
  GuardrailAlwaysRule,
  GuardrailBooleanRule,
  GuardrailFieldGroup,
  GuardrailFieldReference,
  GuardrailFieldRule,
  GuardrailFieldRuleType,
  GuardrailFieldSelector,
  GuardrailNumberRule,
  GuardrailRule,
  GuardrailRuleFields,
  GuardrailRuleOperator,
  GuardrailRuleType,
  GuardrailWordRule,
} from './rules-types';

type RuleOfType<T extends GuardrailRuleType> = Extract<GuardrailRule, { $ruleType: T }>;

const FIELD_RULE_TYPES: readonly GuardrailFieldRuleType[] = ['word', 'number', 'boolean'];

const EMPTY_FIELD_GROUP: GuardrailFieldGroup = { input: [], output: [] };

/** A fresh rule of the given type: every field, the type's first operator, an empty value. */
export function createGuardrailRule<T extends GuardrailRuleType>(type: T): RuleOfType<T>;
export function createGuardrailRule(type: GuardrailRuleType): GuardrailRule {
  switch (type) {
    case 'number':
      return {
        $ruleType: 'number',
        fieldSelector: { $selectorType: 'all' },
        operator: 'equals',
        value: 0,
      } satisfies GuardrailNumberRule;
    case 'boolean':
      return {
        $ruleType: 'boolean',
        fieldSelector: { $selectorType: 'all' },
        operator: 'equals',
        value: false,
      } satisfies GuardrailBooleanRule;
    case 'always':
      return { $ruleType: 'always', applyTo: 'inputAndOutput' } satisfies GuardrailAlwaysRule;
    default:
      return {
        $ruleType: 'word',
        fieldSelector: { $selectorType: 'all' },
        operator: 'contains',
        value: '',
      } satisfies GuardrailWordRule;
  }
}

/**
 * The rule after its type select changes. A new type starts over: the field selection belonged
 * to the old type's fields, and its operator and value may not exist in the new one.
 */
export function changeGuardrailRuleType(
  rule: GuardrailRule,
  type: GuardrailRuleType
): GuardrailRule {
  return rule.$ruleType === type ? rule : createGuardrailRule(type);
}

/** Whether a rule with this operator compares against a value. */
export function guardrailOperatorTakesValue(operator: GuardrailRuleOperator): boolean {
  return operator !== 'isEmpty' && operator !== 'isNotEmpty';
}

export type GuardrailRuleErrorField = 'fields' | 'value';

/** Rule fields whose current value fails required validation. Message text is caller-owned. */
export function getGuardrailRuleErrorFields(rule: GuardrailRule): GuardrailRuleErrorField[] {
  if (rule.$ruleType === 'always') return [];
  const fields: GuardrailRuleErrorField[] = [];
  if (rule.fieldSelector.$selectorType === 'specific' && rule.fieldSelector.fields.length === 0) {
    fields.push('fields');
  }
  switch (rule.$ruleType) {
    case 'word':
      if (guardrailOperatorTakesValue(rule.operator) && !(rule.value ?? '').trim()) {
        fields.push('value');
      }
      break;
    case 'number':
      if (typeof rule.value !== 'number' || !Number.isFinite(rule.value)) fields.push('value');
      break;
    case 'boolean':
      if (typeof rule.value !== 'boolean') fields.push('value');
      break;
  }
  return fields;
}

/**
 * `required`: no rules at all. `alwaysCombined`: an always rule next to field rules, which
 * neither product's runtime reads as intended. `invalidRules`: at least one rule has error fields.
 */
export type GuardrailRulesErrorField = 'required' | 'alwaysCombined' | 'invalidRules';

/** Section-level failures of a rule list. Message text is caller-owned. */
export function getGuardrailRulesErrorFields(
  rules: readonly GuardrailRule[]
): GuardrailRulesErrorField[] {
  if (rules.length === 0) return ['required'];
  const fields: GuardrailRulesErrorField[] = [];
  const hasAlways = rules.some((rule) => rule.$ruleType === 'always');
  if (hasAlways && rules.some((rule) => rule.$ruleType !== 'always')) {
    fields.push('alwaysCombined');
  }
  if (rules.some((rule) => getGuardrailRuleErrorFields(rule).length > 0)) {
    fields.push('invalidRules');
  }
  return fields;
}

/**
 * Field rule types a host's fields can serve, in select order. Without fields (no schema) every
 * type is offered and targets all fields.
 *
 * @internal Exported for testing only
 */
export function getGuardrailRuleTypeOptions(
  fields?: GuardrailRuleFields
): GuardrailFieldRuleType[] {
  if (fields === undefined) return [...FIELD_RULE_TYPES];
  return FIELD_RULE_TYPES.filter((type) => {
    const group = fields[type];
    return group !== undefined && group.input.length + group.output.length > 0;
  });
}

/** @internal Exported for testing only */
export function getGuardrailFieldGroup(
  fields: GuardrailRuleFields | undefined,
  type: GuardrailFieldRuleType
): GuardrailFieldGroup {
  return fields?.[type] ?? EMPTY_FIELD_GROUP;
}

/** @internal Exported for testing only */
export function isGuardrailAlwaysEnforced(rules: readonly GuardrailRule[]): boolean {
  return rules.some((rule) => rule.$ruleType === 'always');
}

/**
 * Whether a rule still holds only what `createGuardrailRule` gave it, so replacing it loses
 * nothing the user entered.
 *
 * @internal Exported for testing only
 */
export function isPristineGuardrailRule(rule: GuardrailFieldRule): boolean {
  const fresh = createGuardrailRule(rule.$ruleType);
  const value = rule.$ruleType === 'word' ? (rule.value ?? '') : rule.value;
  return (
    rule.fieldSelector.$selectorType === 'all' &&
    rule.operator === fresh.operator &&
    value === fresh.value
  );
}

/**
 * The rules after the always-enforce switch moves. On: the one always rule (an existing one
 * keeps its stage). Off: the field rules, or one fresh rule of `defaultType` when there are none.
 *
 * @internal Exported for testing only
 */
export function setGuardrailAlwaysEnforced(
  rules: readonly GuardrailRule[],
  enforced: boolean,
  defaultType: GuardrailFieldRuleType
): GuardrailRule[] {
  if (enforced) {
    return [rules.find((rule) => rule.$ruleType === 'always') ?? createGuardrailRule('always')];
  }
  const kept = rules.filter((rule) => rule.$ruleType !== 'always');
  return kept.length > 0 ? kept : [createGuardrailRule(defaultType)];
}

const sameField = (a: GuardrailFieldReference, b: GuardrailFieldReference) =>
  a.source === b.source && a.path === b.path;

/** @internal Exported for testing only */
export function isGuardrailFieldSelected(
  fields: readonly GuardrailFieldReference[],
  field: GuardrailFieldReference
): boolean {
  return fields.some((candidate) => sameField(candidate, field));
}

/**
 * Add or remove one field. Only `path`, `source` and `title` are kept, so an option carrying
 * extra schema data (a `type`, say) stores as a plain reference.
 *
 * @internal Exported for testing only
 */
export function toggleGuardrailFieldReference(
  fields: readonly GuardrailFieldReference[],
  field: GuardrailFieldReference
): GuardrailFieldReference[] {
  if (isGuardrailFieldSelected(fields, field)) {
    return fields.filter((candidate) => !sameField(candidate, field));
  }
  const { path, source, title } = field;
  return [...fields, title === undefined ? { path, source } : { path, source, title }];
}

/**
 * A rule's selector after one field is toggled. Removing the last field returns the rule to
 * all fields rather than leaving a selection that matches nothing.
 *
 * @internal Exported for testing only
 */
export function toggleGuardrailSelectorField(
  selector: GuardrailFieldSelector,
  field: GuardrailFieldReference
): GuardrailFieldSelector {
  const current = selector.$selectorType === 'specific' ? selector.fields : [];
  const next = toggleGuardrailFieldReference(current, field);
  return next.length === 0 ? { $selectorType: 'all' } : { $selectorType: 'specific', fields: next };
}

/**
 * How a referenced field reads: the offered field's title, then the reference's own, then its
 * path. The reference's title covers a field the schema no longer lists.
 *
 * @internal Exported for testing only
 */
export function getGuardrailFieldName(
  field: GuardrailFieldReference,
  offered: GuardrailFieldGroup
): string {
  const match = offered[field.source].find((candidate) => candidate.path === field.path);
  return match?.title || field.title || field.path;
}
