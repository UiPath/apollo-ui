import {
  type Condition,
  type ConditionGroup,
  type ConditionNode,
  type ConditionVocabulary,
  createCondition,
  createConditionGroup,
  DEFAULT_CONDITION_OPERATORS,
  isConditionComplete,
} from '@/components/ui/conditions-editor';
import { defaultValueModes } from '@/components/ui/conditions-editor/status';
import type { VariablePickerItem } from '@/components/ui/variable-picker';

/** How a rule says when it applies: rows of conditions, or one written expression. */
export type RuleMode = 'conditions' | 'expression';

interface RuleBase {
  id: string;
  /** The outcome's `value`, such as "show" or "require". */
  outcome: string;
}

export interface ConditionsRule extends RuleBase {
  mode: 'conditions';
  conditions: ConditionGroup;
}

export interface ExpressionRule extends RuleBase {
  mode: 'expression';
  expression: string;
}

/** A rule. Other properties a host adds, such as its own metadata, are kept through every edit. */
export type Rule = ConditionsRule | ExpressionRule;

/** What a rule does when it applies. */
export interface RuleOutcome {
  value: string;
  label: string;
}

/**
 * Converts a rule's conditions to and from an expression in the host's language, so switching a
 * rule between them keeps what the author wrote. Without one, a switch that would lose content
 * asks first.
 */
export interface RulesDialect {
  /** The conditions as an expression, or `undefined` when they cannot be written as one. */
  toExpression?: (
    conditions: ConditionGroup,
    vocabulary: ConditionVocabulary
  ) => string | undefined;
  /** The expression as conditions, or `undefined` when it cannot be read as rows. */
  fromExpression?: (
    expression: string,
    vocabulary: ConditionVocabulary
  ) => ConditionGroup | undefined;
}

// Random, so a new rule never reuses the id of one saved in an earlier session.
function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

interface RuleInitBase {
  outcome: string;
  id?: string;
}

/** A conditions rule, starting with one empty condition, or an expression rule. */
export function createRule(
  init: RuleInitBase & { expression: string; conditions?: never }
): ExpressionRule;
export function createRule(
  init: RuleInitBase & { conditions?: ConditionGroup; expression?: never }
): ConditionsRule;
export function createRule(
  init: RuleInitBase & { conditions?: ConditionGroup; expression?: string }
): Rule;
export function createRule(
  init: RuleInitBase & { conditions?: ConditionGroup; expression?: string }
): Rule {
  const id = init.id ?? newId('rule');
  return init.expression !== undefined
    ? { id, outcome: init.outcome, mode: 'expression', expression: init.expression }
    : {
        id,
        outcome: init.outcome,
        mode: 'conditions',
        conditions: init.conditions ?? createConditionGroup('all', [createCondition()]),
      };
}

/** The rule in another mode, keeping its id, outcome, and any properties the host added. */
export function withMode(
  rule: Rule,
  next: Pick<ConditionsRule, 'mode' | 'conditions'> | Pick<ExpressionRule, 'mode' | 'expression'>
): Rule {
  const rest = Object.fromEntries(
    Object.entries(rule).filter(([key]) => key !== 'conditions' && key !== 'expression')
  );
  return { ...rest, ...next } as Rule;
}

function conditionsOf(node: ConditionNode): Condition[] {
  return node.kind === 'condition' ? [node] : node.children.flatMap(conditionsOf);
}

/** Nothing typed or picked, so switching away loses nothing. */
export function isBlank(rule: Rule) {
  return rule.mode === 'expression'
    ? rule.expression.trim() === ''
    : conditionsOf(rule.conditions).every(
        (c) => !c.field && !c.value && (c.values?.length ?? 0) === 0
      );
}

/** What the editor offers, so a check agrees with what it flags. Pass the editor's own props. */
export interface RuleVocabulary {
  outcomes: readonly RuleOutcome[];
  fields: ConditionVocabulary['fields'];
  /** Defaults to the English set, as the editor's does. */
  operators?: ConditionVocabulary['operators'];
  /** Defaults to the editor's: Fixed value and Expression, plus Variable with `variables`. */
  valueModes?: ConditionVocabulary['valueModes'];
  variables?: readonly VariablePickerItem[];
}

function groupComplete(
  group: ConditionGroup,
  vocabulary: ConditionVocabulary,
  nested: boolean
): boolean {
  // An empty nested group is flagged; an empty rule always applies.
  if (nested && group.children.length === 0) return false;
  return group.children.every((child) =>
    child.kind === 'condition'
      ? isConditionComplete(child, vocabulary)
      : groupComplete(child, vocabulary, true)
  );
}

/**
 * Whether the rule runs as written, by the same checks the editor flags: an outcome it offers, and
 * an expression that is not blank or conditions it flags none of. No conditions is complete, as
 * the rule then always applies.
 */
export function isRuleComplete(rule: Rule, vocabulary: RuleVocabulary) {
  if (!vocabulary.outcomes.some((option) => option.value === rule.outcome)) return false;
  if (rule.mode === 'expression') return rule.expression.trim() !== '';
  return groupComplete(
    rule.conditions,
    {
      fields: vocabulary.fields,
      operators: vocabulary.operators ?? DEFAULT_CONDITION_OPERATORS,
      valueModes: vocabulary.valueModes ?? defaultValueModes(vocabulary.variables),
    },
    false
  );
}
