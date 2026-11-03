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
import { defaultValueModes, resolveCondition } from '@/components/ui/conditions-editor/status';
import type { VariablePickerItem } from '@/components/ui/variable-picker';

/** How an author writes when a rule applies: rows of conditions, or one written expression. */
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

/**
 * A rule the host stored in a form neither mode can show, which still runs. It is kept as stored
 * and shown read-only as `preservedSource`; its outcome can change, and switching its mode replaces it.
 */
export interface PreservedRule extends RuleBase {
  mode: 'preserved';
  preservedSource: string;
}

/** A rule. Other properties a host adds, such as its own metadata, are kept through every edit. */
export type Rule = ConditionsRule | ExpressionRule | PreservedRule;

/** What a rule does when it applies. */
export interface RuleOutcome {
  value: string;
  label: string;
}

/** Why a rule's expression cannot run. */
export type RuleExpressionProblem = 'invalid';

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
  /**
   * The field keys an expression names, so the editor can flag the ones `fields` no longer lists,
   * such as after a field is removed.
   */
  fieldsOf?: (expression: string) => string[];
  /** Whether the host can run a rule's expression. Each problem shows on the rule. */
  checkExpression?: (
    rule: ExpressionRule,
    vocabulary: ConditionVocabulary
  ) => RuleExpressionProblem | undefined;
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
    Object.entries(rule).filter(
      ([key]) => key !== 'conditions' && key !== 'expression' && key !== 'preservedSource'
    )
  );
  return { ...rest, ...next } as Rule;
}

function conditionsOf(node: ConditionNode): Condition[] {
  return node.kind === 'condition' ? [node] : node.children.flatMap(conditionsOf);
}

/** Nothing typed or picked, so switching away loses nothing. */
export function isBlank(rule: Rule) {
  if (rule.mode === 'preserved') return false;
  return rule.mode === 'expression'
    ? rule.expression.trim() === ''
    : conditionsOf(rule.conditions).every(
        (c) => !c.field && !c.value && (c.values?.length ?? 0) === 0
      );
}

/** A rule with no conditions, which always applies. */
export function isUnconditionalRule(rule: Rule): rule is ConditionsRule {
  return rule.mode === 'conditions' && rule.conditions.children.length === 0;
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
 * the rule then always applies, and so is a preserved rule, which runs as stored.
 */
export function isRuleComplete(rule: Rule, vocabulary: RuleVocabulary) {
  if (!vocabulary.outcomes.some((option) => option.value === rule.outcome)) return false;
  if (rule.mode === 'preserved') return true;
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

/** The keys an expression names that are no fields, a field's own sub-paths aside. */
export function unknownFields(
  expression: string,
  fields: ConditionVocabulary['fields'],
  dialect: RulesDialect | undefined
): string[] {
  const names = dialect?.fieldsOf?.(expression) ?? [];
  return names.filter(
    (name) => !fields.some((field) => name === field.value || name.startsWith(`${field.value}.`))
  );
}

/** The keys a row's Expression value names that are no fields, as `unknownFields` finds them. */
export function unknownValueFields(
  c: Condition,
  vocabulary: ConditionVocabulary,
  dialect: RulesDialect | undefined
): string[] {
  const value = c.value?.trim();
  if (!value || resolveCondition(c, vocabulary).mode !== 'expression') return [];
  return unknownFields(value, vocabulary.fields, dialect);
}

/** What makes a rule need attention. */
export type RuleIssueKind = 'outcome' | 'incomplete' | 'unknownField' | 'expression';

export interface RuleIssue {
  ruleId: string;
  /** The condition or group it is on, for a row's issue. */
  nodeId?: string;
  kind: RuleIssueKind;
}

/**
 * Everything the editor would flag in the rules, by the same checks: an outcome it does not offer,
 * a condition on a field `fields` no longer lists, an unfinished condition or blank expression,
 * an expression or a row's Expression value naming such a field, and one the dialect cannot
 * run. An unfinished rule counts, as it is not stored until it is finished.
 */
export function findRuleIssues(
  rules: readonly Rule[],
  vocabulary: RuleVocabulary,
  dialect?: RulesDialect
): RuleIssue[] {
  const resolved: ConditionVocabulary = {
    fields: vocabulary.fields,
    operators: vocabulary.operators ?? DEFAULT_CONDITION_OPERATORS,
    valueModes: vocabulary.valueModes ?? defaultValueModes(vocabulary.variables),
  };
  const issues: RuleIssue[] = [];
  for (const rule of rules) {
    const ruleId = rule.id;
    if (!vocabulary.outcomes.some((option) => option.value === rule.outcome)) {
      issues.push({ ruleId, kind: 'outcome' });
    }
    // A preserved rule runs as the host stored it, so only its outcome is the editor's to check.
    if (rule.mode === 'preserved') continue;
    if (rule.mode === 'expression') {
      if (rule.expression.trim() === '') {
        issues.push({ ruleId, kind: 'incomplete' });
        continue;
      }
      if (unknownFields(rule.expression, resolved.fields, dialect).length > 0) {
        issues.push({ ruleId, kind: 'unknownField' });
      }
      if (dialect?.checkExpression?.(rule, resolved) === 'invalid') {
        issues.push({ ruleId, kind: 'expression' });
      }
      continue;
    }
    const visit = (group: ConditionGroup, nested: boolean) => {
      if (nested && group.children.length === 0) {
        issues.push({ ruleId, nodeId: group.id, kind: 'incomplete' });
      }
      for (const child of group.children) {
        if (child.kind === 'group') {
          visit(child, true);
        } else if (child.field && !resolved.fields.some((field) => field.value === child.field)) {
          issues.push({ ruleId, nodeId: child.id, kind: 'unknownField' });
        } else if (!isConditionComplete(child, resolved)) {
          issues.push({ ruleId, nodeId: child.id, kind: 'incomplete' });
        } else if (unknownValueFields(child, resolved, dialect).length > 0) {
          issues.push({ ruleId, nodeId: child.id, kind: 'unknownField' });
        }
      }
    };
    visit(rule.conditions, false);
  }
  return issues;
}

/** The ids of the rules and nodes with issues, as `defaultTouched` takes them to show at once. */
export function issueIds(issues: readonly RuleIssue[]): string[] {
  return issues.flatMap((issue) => [issue.ruleId, ...(issue.nodeId ? [issue.nodeId] : [])]);
}
