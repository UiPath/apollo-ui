import {
  type Condition,
  type ConditionGroup,
  type ConditionOperators,
  type ConditionVocabulary,
  createCondition,
  createConditionGroup,
} from '@/components/ui/conditions-editor';
import { isComplete, resolveCondition } from '@/components/ui/conditions-editor/status';
import {
  createRule,
  isUnconditionalRule,
  type Rule,
  type RuleOutcome,
} from '@/components/ui/rules-editor';
import type { FieldCondition, FieldRule } from './form-schema';
import {
  canName,
  canRun,
  conditionExpression,
  containsCall,
  emptyCheck,
  type FieldRuleField,
  fieldKeysOf,
  fieldName,
  notEmptyCheck,
  offered,
  parseCondition,
  parseExpression,
  patternCall,
  printLiteral,
  RULES_ENGINE_OPERATORS,
  renameInExpression,
  rulesEngineVocabulary,
  startsWithCall,
  typedValue,
  valueText,
} from './rules-engine-dialect';

export type FieldRuleEffects = FieldRule['effects'];

/** An outcome, with the effects it stands for, such as Show as `{ visible: true }`. */
export interface FieldRuleOutcome extends RuleOutcome {
  effects: FieldRuleEffects;
}

export interface FieldRulesOptions {
  outcomes: readonly FieldRuleOutcome[];
  fields: readonly FieldRuleField[];
  /** Defaults to `RULES_ENGINE_OPERATORS`. Pass the editor's own if it maps their labels. */
  operators?: ConditionOperators;
  /**
   * The outcome whose rule with no conditions `useFieldRules` stores as the field's own `required`
   * flag rather than as a rule, for a host that keeps one: hitl's carries its required message.
   * Its effects must be `{ required: true }` alone, as that is all the flag says; for any other
   * outcome the flag is left as it is. Omit to store the rule as a rule, which RulesEngine runs
   * the same.
   */
  requiredOutcome?: string;
}

/** A field's stored rules, and its own `required` flag when the host keeps one. */
export interface StoredFieldRules {
  rules?: readonly FieldRule[];
  required?: boolean;
}

/** What a rule carries from its stored form, as host properties, so writing it loses nothing. */
interface StoredParts {
  /** Effects no outcome claims, such as `disabled`. */
  otherEffects?: Record<string, unknown>;
  /**
   * A rule read as an expression or preserved: the stored conditions it came from, written back
   * unchanged while its text is, or always for a preserved rule, so an outcome change keeps them.
   */
  saved?: { expression?: string } & Pick<FieldRule, 'conditions' | 'operator'>;
}
type StoredRule = Rule & StoredParts;

// The stored rule each read rule came from: an untouched rule is written back as that object.
const originals = new WeakMap<Rule, FieldRule>();
// The stored condition each read row on a field the form no longer has came from. Untouched, it is
// written back as that, so changing the rest of its rule neither drops it nor widens the rule.
const unknownFieldConditions = new WeakMap<Condition, FieldCondition>();

function vocabularyOf(options: FieldRulesOptions): ConditionVocabulary {
  return {
    fields: options.fields,
    operators: options.operators ?? RULES_ENGINE_OPERATORS,
    valueModes: rulesEngineVocabulary.valueModes,
  };
}

// ── Patterns ───────────────────────────────────────────────────────────────

// The characters hitl escapes, so its stored "contains" values read back as typed.
const SPECIAL = /[.*+?^${}()|[\]\\]/g;
const escapePattern = (text: string) => text.replace(SPECIAL, '\\$&');
const unescapePattern = (text: string) => text.replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
/** The text a pattern matches literally, or `undefined` when it is a real pattern. */
function literalText(pattern: string) {
  const text = unescapePattern(pattern);
  return escapePattern(text) === pattern ? text : undefined;
}

// ── Reading ────────────────────────────────────────────────────────────────

function definedKeys(condition: FieldCondition) {
  return (Object.keys(condition) as (keyof FieldCondition)[]).filter(
    (key) => key !== 'when' && condition[key] !== undefined
  );
}

function readCondition(
  stored: FieldCondition,
  vocabulary: ConditionVocabulary,
  id: string
): Condition | undefined {
  const keys = definedKeys(stored);
  // An untouched row, which hitl saves as a placeholder.
  if (keys.length === 0) return createCondition({ id, field: stored.when || undefined });
  if (stored.custom !== undefined) {
    const node = parseExpression(stored.custom);
    return node ? parseCondition(node, vocabulary, id) : undefined;
  }
  // RulesEngine reads only the first of several keys; a row cannot say that.
  if (keys.length > 1) return undefined;
  const field = stored.when;
  let row: Omit<Condition, 'kind' | 'id'>;
  if (stored.is !== undefined) {
    row =
      stored.is === ''
        ? { field, operator: 'isEmpty' }
        : { field, operator: 'equals', value: valueText(stored.is) };
  } else if (stored.isNot !== undefined) {
    row =
      stored.isNot === ''
        ? { field, operator: 'isNotEmpty' }
        : { field, operator: 'notEquals', value: valueText(stored.isNot) };
  } else if (stored.in !== undefined) {
    row = { field, operator: 'isOneOf', values: stored.in.map(valueText) };
  } else if (stored.notIn !== undefined) {
    row = { field, operator: 'isNotOneOf', values: stored.notIn.map(valueText) };
  } else {
    const pattern = stored.matches ?? '';
    const text = literalText(pattern);
    const start = pattern.startsWith('^') ? literalText(pattern.slice(1)) : undefined;
    row =
      text !== undefined
        ? { field, operator: 'contains', value: text }
        : start !== undefined
          ? { field, operator: 'startsWith', value: start }
          : { field, operator: 'matches', value: pattern };
  }
  const condition = createCondition({ id, ...row });
  if (!offered(condition, vocabulary)) return undefined;
  // A row the editor would flag, such as `matches: ''`, is dropped on the next write, so it stays
  // as stored instead. A field the form no longer has is shown, flagged, so the author sees it.
  const known = vocabulary.fields.some((option) => option.value === field);
  return !known || isComplete(condition, vocabulary) ? condition : undefined;
}

function readStoredCondition(stored: FieldCondition, vocabulary: ConditionVocabulary, id: string) {
  const condition = readCondition(stored, vocabulary, id);
  const field = condition?.field;
  if (condition && field && !vocabulary.fields.some((option) => option.value === field)) {
    unknownFieldConditions.set(condition, stored);
  }
  return condition;
}

/**
 * A stored condition as expression text, or `null` for a placeholder, which says nothing. Of
 * several keys it says the one RulesEngine reads. Text matching reads as calls RulesEngine cannot
 * run, which a row can store again.
 */
function storedExpression(stored: FieldCondition): string | null {
  if (definedKeys(stored).length === 0) return null;
  if (stored.custom !== undefined) return stored.custom;
  const name = fieldName(stored.when);
  const list = (values: unknown[], symbol: string, joiner: string, none: string) =>
    values.length === 0
      ? none
      : values.map((value) => `${name} ${symbol} ${printLiteral(value)}`).join(joiner);
  if (stored.is !== undefined) return `${name} === ${printLiteral(stored.is)}`;
  if (stored.isNot !== undefined) return `${name} !== ${printLiteral(stored.isNot)}`;
  if (stored.in !== undefined) return list(stored.in, '===', ' || ', 'false');
  if (stored.notIn !== undefined) return list(stored.notIn, '!==', ' && ', 'true');
  const pattern = stored.matches ?? '';
  const text = literalText(pattern);
  const start = pattern.startsWith('^') ? literalText(pattern.slice(1)) : undefined;
  if (text !== undefined) return containsCall(name, text);
  return start !== undefined ? startsWithCall(name, start) : patternCall(name, pattern);
}

/** Whether RulesEngine runs a stored condition as it is. */
function storedRuns(stored: FieldCondition, fields: readonly FieldRuleField[]) {
  if (stored.custom !== undefined) return canRun(stored.custom, fields);
  if (stored.matches === undefined || definedKeys(stored).length > 1) return true;
  try {
    new RegExp(stored.matches);
    return true;
  } catch {
    return false;
  }
}

/** The outcome whose effects the stored ones include, preferring the one that claims the most. */
function matchOutcome(effects: FieldRuleEffects, outcomes: readonly FieldRuleOutcome[]) {
  let best: FieldRuleOutcome | undefined;
  let claims = -1;
  for (const outcome of outcomes) {
    const entries = Object.entries(outcome.effects);
    const matches = entries.every(
      ([key, value]) => (effects as Record<string, unknown>)[key] === value
    );
    if (matches && entries.length > claims) {
      best = outcome;
      claims = entries.length;
    }
  }
  return best;
}

function readRule(stored: FieldRule, index: number, options: FieldRulesOptions): Rule {
  const vocabulary = vocabularyOf(options);
  const id = stored.id || `rule-${index}`;
  const effects = stored.effects ?? {};
  const outcome = matchOutcome(effects, options.outcomes);
  const claimed = Object.keys(outcome?.effects ?? {});
  const otherEffects = Object.fromEntries(
    Object.entries(effects).filter(([key]) => !claimed.includes(key))
  );
  const base = {
    id,
    outcome: outcome?.value ?? '',
    ...(Object.keys(otherEffects).length > 0 ? { otherEffects } : {}),
  };

  const rows = stored.conditions.map((condition, position) =>
    readStoredCondition(condition, vocabulary, `${id}-condition-${position}`)
  );
  let rule: StoredRule;
  if (rows.every((row): row is Condition => row !== undefined)) {
    rule = {
      ...base,
      mode: 'conditions',
      conditions: createConditionGroup(
        stored.operator === 'OR' ? 'any' : 'all',
        rows,
        `${id}-conditions`
      ),
    };
  } else {
    // The whole rule as one expression, so what shows is all that applies.
    const parts = stored.conditions.flatMap((condition) => storedExpression(condition) ?? []);
    const joiner = stored.operator === 'OR' ? ' || ' : ' && ';
    const expression =
      parts.length === 1 ? parts[0] : parts.map((part) => `(${part})`).join(joiner);
    const saved = { conditions: stored.conditions, operator: stored.operator };
    const runs = stored.conditions.every((condition) => storedRuns(condition, options.fields));
    // A rule that runs only as stored, such as a pattern beside an expression, would read as an
    // expression RulesEngine cannot run, so it is kept as stored instead.
    rule =
      runs && !canRun(expression, options.fields)
        ? {
            ...base,
            mode: 'preserved',
            preservedSource: JSON.stringify(
              { operator: stored.operator ?? 'AND', conditions: stored.conditions },
              null,
              2
            ),
            saved,
          }
        : { ...base, mode: 'expression', expression, saved: { ...saved, expression } };
  }
  originals.set(rule, stored);
  return rule;
}

/**
 * Stored rules as editor rules. A rule whose conditions are all rows opens as conditions; any
 * other opens as one expression, unless only its stored form runs: then it is preserved, shown as
 * its stored conditions. Ids come from the stored rules, so reading twice gives the same.
 */
export function fromFieldRules(rules: readonly FieldRule[], options: FieldRulesOptions): Rule[] {
  return rules.map((rule, index) => readRule(rule, index, options));
}

// ── Writing ────────────────────────────────────────────────────────────────

function writeCondition(c: Condition, vocabulary: ConditionVocabulary): FieldCondition | undefined {
  const stored = unknownFieldConditions.get(c);
  if (stored) return stored;
  if (!isComplete(c, vocabulary)) return undefined;
  const resolved = resolveCondition(c, vocabulary);
  const when = c.field ?? '';
  const id = resolved.operator?.value;
  const typed = (text: string) => typedValue(resolved.field, text);
  // A null or blank check, as an unset field holds no value at all.
  if (id === 'isEmpty')
    return canName(when) ? { when, custom: emptyCheck(when) } : { when, is: '' };
  if (id === 'isNotEmpty') {
    return canName(when) ? { when, custom: notEmptyCheck(when) } : { when, isNot: '' };
  }
  if (resolved.mode === 'literal') {
    const value = c.value ?? '';
    switch (id) {
      case 'equals':
        return { when, is: typed(value) };
      case 'notEquals':
        return { when, isNot: typed(value) };
      case 'isOneOf':
        return { when, in: (c.values ?? []).map(typed) };
      case 'isNotOneOf':
        return { when, notIn: (c.values ?? []).map(typed) };
      case 'contains':
        return { when, matches: escapePattern(value) };
      case 'startsWith':
        return { when, matches: `^${escapePattern(value)}` };
      case 'matches':
        return { when, matches: value };
    }
  }
  const text = conditionExpression(c, vocabulary);
  return text === undefined ? undefined : { when, custom: text };
}

function writeGroup(group: ConditionGroup, vocabulary: ConditionVocabulary): FieldCondition[] {
  const written: FieldCondition[] = [];
  // A rule's conditions are flat, as a stored rule's are.
  for (const child of group.children) {
    const condition = child.kind === 'condition' ? writeCondition(child, vocabulary) : undefined;
    if (condition) written.push(condition);
  }
  return written;
}

function writeRule(rule: Rule, options: FieldRulesOptions): FieldRule | undefined {
  const original = originals.get(rule);
  if (original) return original;
  const stored = rule as StoredRule;
  const vocabulary = vocabularyOf(options);
  const outcome = options.outcomes.find((option) => option.value === rule.outcome);
  // The outcome's effects win, so a changed outcome replaces the old one's.
  const effects = { ...stored.otherEffects, ...outcome?.effects } as FieldRuleEffects;

  const { saved } = stored;
  if (rule.mode === 'preserved') {
    // Only a stored rule is preserved, so one without its conditions has nothing to write.
    return (
      saved && { id: rule.id, conditions: saved.conditions, operator: saved.operator, effects }
    );
  }
  if (rule.mode === 'expression') {
    if (saved && rule.expression === saved.expression) {
      return { id: rule.id, conditions: saved.conditions, operator: saved.operator, effects };
    }
    // Stored as typed, even if RulesEngine cannot run it, which the editor flags: it never applies.
    const expression = rule.expression.trim();
    if (!expression) return undefined;
    // Older RulesEngine releases re-check a rule only when its `when` field changes, so name one.
    const when = fieldKeysOf(expression)[0] ?? '';
    return {
      id: rule.id,
      conditions: [{ when, custom: expression }],
      operator: 'AND',
      effects,
    };
  }

  const written = writeGroup(rule.conditions, vocabulary);
  // Rows but none finished: writing no conditions would make the rule always apply.
  if (rule.conditions.children.length > 0 && written.length === 0) return undefined;
  return {
    id: rule.id,
    conditions: written,
    operator: rule.conditions.mode === 'any' ? 'OR' : 'AND',
    effects,
  };
}

/**
 * Editor rules as stored rules RulesEngine runs. Incomplete conditions are left out, as the
 * editor says, and a rule with none complete is left out whole. A rule read by `fromFieldRules`
 * and not edited since is written back as the stored object it came from.
 */
export function toFieldRules(rules: readonly Rule[], options: FieldRulesOptions): FieldRule[] {
  return rules.flatMap((rule) => writeRule(rule, options) ?? []);
}

// ── Required flag ──────────────────────────────────────────────────────────

// Reading twice gives the same, as for stored rules.
const REQUIRED_RULE_ID = 'required-flag';

/**
 * Editor rules from a field's stored rules and, with `requiredOutcome`, its `required` flag, read
 * as a rule of that outcome with no conditions, first. A stored rule that already is one stands
 * for the flag too.
 */
export function readStoredRules(stored: StoredFieldRules, options: FieldRulesOptions): Rule[] {
  const rules = fromFieldRules(stored.rules ?? [], options);
  const outcome = flagOutcome(options);
  if (!outcome || !stored.required || rules.some((rule) => isRequiredRule(rule, outcome))) {
    return rules;
  }
  const conditions = createConditionGroup('all', [], `${REQUIRED_RULE_ID}-conditions`);
  return [createRule({ id: REQUIRED_RULE_ID, outcome, conditions }), ...rules];
}

/**
 * Editor rules as a field's stored rules and `required` flag. With `requiredOutcome`, the first
 * rule of that outcome with no conditions is written as the flag, which applies before every
 * rule. It stays a rule where that would change the result: it carries effects the flag cannot,
 * or an earlier rule sets `required` otherwise, which it overrode.
 */
export function writeStoredRules(
  rules: readonly Rule[],
  options: FieldRulesOptions
): { rules: FieldRule[]; required: boolean } {
  const outcome = flagOutcome(options);
  const index = outcome ? rules.findIndex((rule) => isRequiredRule(rule, outcome)) : -1;
  const overrides = rules
    .slice(0, Math.max(index, 0))
    .some((rule) => (effectsOf(rule, options).required ?? true) !== true);
  if (index < 0 || (rules[index] as StoredRule).otherEffects || overrides) {
    return { rules: toFieldRules(rules, options), required: false };
  }
  return {
    rules: toFieldRules(
      rules.filter((_, position) => position !== index),
      options
    ),
    required: true,
  };
}

function isRequiredRule(rule: Rule, outcome: string) {
  return rule.outcome === outcome && isUnconditionalRule(rule);
}

/** `requiredOutcome`, when the flag can stand for it: its effects are `{ required: true }` alone. */
export function flagOutcome(options: FieldRulesOptions) {
  const value = options.requiredOutcome;
  const effects = options.outcomes.find((option) => option.value === value)?.effects ?? {};
  const keys = Object.keys(effects);
  return keys.length === 1 && effects.required === true ? value : undefined;
}

function effectsOf(rule: Rule, options: FieldRulesOptions): FieldRuleEffects {
  const outcome = options.outcomes.find((option) => option.value === rule.outcome);
  return { ...(rule as StoredRule).otherEffects, ...outcome?.effects } as FieldRuleEffects;
}

// ── Always-applying rules ──────────────────────────────────────────────────

/** The ids of the rules that apply always, having no conditions. */
export function alwaysApplying(rules: readonly Rule[]): Set<string> {
  return new Set(rules.filter(isUnconditionalRule).map((rule) => rule.id));
}

/**
 * The rules as they apply. A rule that applied always, by id in `always`, still does while none
 * of its conditions is finished, so giving it a first condition changes nothing until that one is
 * done.
 */
export function settleAlways(
  rules: readonly Rule[],
  options: FieldRulesOptions,
  always: ReadonlySet<string>
): Rule[] {
  const vocabulary = vocabularyOf(options);
  return rules.map((rule) =>
    rule.mode === 'conditions' &&
    rule.conditions.children.length > 0 &&
    always.has(rule.id) &&
    writeGroup(rule.conditions, vocabulary).length === 0
      ? { ...rule, conditions: { ...rule.conditions, children: [] } }
      : rule
  );
}

// ── Field references ───────────────────────────────────────────────────────

const namesField = (name: string, key: string) => name === key || name.startsWith(`${key}.`);

/**
 * The stored rules with field `from` renamed `to` wherever they name it: each condition's `when`
 * and the expressions in `custom`, paths into the field included. A rule that names neither is
 * returned as the same object, and an empty `from` or `to` renames nothing.
 *
 * A path is renamed with its parent even when the form lists it as a field of its own, as
 * `user.role` is with `user`. A `to` that is not an identifier path is written into expressions
 * as hitl's `values["to"]`, which RulesEngine does not run, so the editor flags those rules. An
 * expression the dialect cannot print again is left as it is.
 */
export function renameFieldInRules(
  rules: readonly FieldRule[],
  from: string,
  to: string
): FieldRule[] {
  if (from === to || !from || !to) return [...rules];
  return rules.map((rule) => {
    let changed = false;
    const conditions = rule.conditions.map((condition) => {
      const when = namesField(condition.when, from)
        ? `${to}${condition.when.slice(from.length)}`
        : condition.when;
      const custom =
        condition.custom === undefined ? undefined : renameInExpression(condition.custom, from, to);
      if (when === condition.when && custom === condition.custom) return condition;
      changed = true;
      return { ...condition, when, ...(custom === undefined ? {} : { custom }) };
    });
    return changed ? { ...rule, conditions } : rule;
  });
}

/**
 * The ids of the stored rules that name field `key`, or a path into it, in a condition's `when` or
 * expression, such as to say which rules removing it would leave flagged.
 */
export function rulesReferencing(rules: readonly FieldRule[], key: string): string[] {
  if (!key) return [];
  return rules.flatMap((rule, index) =>
    rule.conditions.some(
      (condition) =>
        namesField(condition.when, key) ||
        (condition.custom !== undefined &&
          fieldKeysOf(condition.custom).some((name) => namesField(name, key)))
    )
      ? [rule.id || `rule-${index}`]
      : []
  );
}
