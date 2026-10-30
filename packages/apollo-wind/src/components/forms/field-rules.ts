import {
  type Condition,
  type ConditionGroup,
  type ConditionOperators,
  type ConditionVocabulary,
  createCondition,
  createConditionGroup,
} from '@/components/ui/conditions-editor';
import { isComplete, resolveCondition } from '@/components/ui/conditions-editor/status';
import type { Rule, RuleOutcome } from '@/components/ui/rules-editor';
import type { FieldCondition, FieldRule } from './form-schema';
import {
  canName,
  conditionExpression,
  emptyCheck,
  type FieldRuleField,
  notEmptyCheck,
  offered,
  parseCondition,
  parseExpression,
  printLiteral,
  RULES_ENGINE_OPERATORS,
  rulesEngineDialect,
  rulesEngineVocabulary,
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
}

/** What a rule carries from its stored form, as host properties, so writing it loses nothing. */
interface StoredParts {
  /** Effects no outcome claims, such as `disabled`. */
  otherEffects?: Record<string, unknown>;
  /**
   * Conditions neither a row nor an expression can say (a pattern match beside an expression),
   * written back unchanged and joined by `keptOperator`.
   */
  keptConditions?: FieldCondition[];
  keptOperator?: 'AND' | 'OR';
}
type StoredRule = Rule & StoredParts;

// The stored rule each read rule came from: an untouched rule is written back as that object.
const originals = new WeakMap<Rule, FieldRule>();

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
  return offered(condition, vocabulary) ? condition : undefined;
}

/**
 * A stored condition as expression text: `null` for a placeholder, which says nothing, and
 * `undefined` when an expression cannot say it.
 */
function storedExpression(stored: FieldCondition): string | null | undefined {
  const keys = definedKeys(stored);
  if (keys.length === 0) return null;
  if (stored.custom !== undefined) return stored.custom;
  if (keys.length > 1 || !canName(stored.when)) return undefined;
  const name = stored.when;
  const list = (values: unknown[], symbol: string, joiner: string, none: string) =>
    values.length === 0
      ? none
      : values.map((value) => `${name} ${symbol} ${printLiteral(value)}`).join(joiner);
  if (stored.is !== undefined) return `${name} === ${printLiteral(stored.is)}`;
  if (stored.isNot !== undefined) return `${name} !== ${printLiteral(stored.isNot)}`;
  if (stored.in !== undefined) return list(stored.in, '===', ' || ', 'false');
  if (stored.notIn !== undefined) return list(stored.notIn, '!==', ' && ', 'true');
  return undefined;
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
    readCondition(condition, vocabulary, `${id}-condition-${position}`)
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
    // One expression from every condition that can be one; the rest are kept as stored. All and
    // Any are associative, so joining the two parts by the rule's operator keeps its meaning.
    const parts: string[] = [];
    const kept: FieldCondition[] = [];
    for (const condition of stored.conditions) {
      const text = storedExpression(condition);
      if (text === undefined) kept.push(condition);
      else if (text !== null) parts.push(text);
    }
    const joiner = stored.operator === 'OR' ? ' || ' : ' && ';
    rule = {
      ...base,
      mode: 'expression',
      expression: parts.length === 1 ? parts[0] : parts.map((part) => `(${part})`).join(joiner),
      ...(kept.length > 0 ? { keptConditions: kept, keptOperator: stored.operator ?? 'AND' } : {}),
    };
  }
  originals.set(rule, stored);
  return rule;
}

/**
 * Stored rules as editor rules. A rule whose conditions are all rows opens as conditions; any
 * other opens as one expression. Ids come from the stored rules, so reading twice gives the same.
 */
export function fromFieldRules(rules: readonly FieldRule[], options: FieldRulesOptions): Rule[] {
  return rules.map((rule, index) => readRule(rule, index, options));
}

// ── Writing ────────────────────────────────────────────────────────────────

function writeCondition(c: Condition, vocabulary: ConditionVocabulary): FieldCondition | undefined {
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
  for (const child of group.children) {
    if (child.kind === 'condition') {
      const condition = writeCondition(child, vocabulary);
      if (condition) written.push(condition);
      continue;
    }
    // A stored rule is flat, so a nested group is written as one expression.
    const text = rulesEngineDialect.toExpression?.(child, vocabulary);
    if (text) written.push({ when: '', custom: text });
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
  const kept = stored.keptConditions ?? [];

  if (rule.mode === 'expression') {
    const expression = rule.expression.trim();
    if (!expression && kept.length === 0) return undefined;
    return {
      id: rule.id,
      conditions: [...kept, ...(expression ? [{ when: '', custom: expression }] : [])],
      operator: kept.length > 0 ? (stored.keptOperator ?? 'AND') : 'AND',
      effects,
    };
  }

  const written = writeGroup(rule.conditions, vocabulary);
  // Rows but none finished: writing no conditions would make the rule always apply.
  if (rule.conditions.children.length > 0 && written.length === 0 && kept.length === 0) {
    return undefined;
  }
  return {
    id: rule.id,
    // Kept conditions join by the rows' operator once the rule is conditions again.
    conditions: [...kept, ...written],
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
