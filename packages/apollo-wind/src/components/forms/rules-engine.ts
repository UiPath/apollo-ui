import jsep from 'jsep';
import type { FieldRule, FieldCondition, FormContext, FieldOption } from './form-schema';
import { get } from '@/lib';

/**
 * Rules Engine - Evaluates conditions and applies effects using jsep
 * Powers show/hide, enable/disable, validation changes, etc.
 * Uses jsep for safe expression parsing with minimal evaluator
 */

export class RulesEngine {
  /**
   * Evaluate if conditions are met
   */
  static evaluateConditions(
    conditions: FieldCondition[],
    values: Record<string, unknown>,
    operator: 'AND' | 'OR' = 'AND'
  ): boolean {
    if (conditions.length === 0) return true;

    const results = conditions.map((condition) => RulesEngine.evaluateCondition(condition, values));

    return operator === 'AND' ? results.every(Boolean) : results.some(Boolean);
  }

  /**
   * Evaluate a single condition
   */
  static evaluateCondition(condition: FieldCondition, values: Record<string, unknown>): boolean {
    const fieldValue = get(values, condition.when);

    // Custom expression evaluation using expr-eval
    if (condition.custom) {
      const result = RulesEngine.evaluateExpression(condition.custom, values);
      return typeof result === 'boolean' ? result : Boolean(result);
    }

    // Direct equality check
    if (condition.is !== undefined) {
      return fieldValue === condition.is;
    }

    // Negation check
    if (condition.isNot !== undefined) {
      return fieldValue !== condition.isNot;
    }

    // Array inclusion check
    if (condition.in !== undefined) {
      return condition.in.includes(fieldValue);
    }

    // Array exclusion check
    if (condition.notIn !== undefined) {
      return !condition.notIn.includes(fieldValue);
    }

    // Regex pattern matching
    if (condition.matches !== undefined) {
      const regex = new RegExp(condition.matches);
      return regex.test(String(fieldValue));
    }

    return false;
  }

  /**
   * Apply all rules for a field and return the resulting state
   */
  static applyRules(
    rules: FieldRule[],
    values: Record<string, unknown>,
    _context: FormContext
  ): {
    visible?: boolean;
    disabled?: boolean;
    required?: boolean;
    value?: unknown;
    options?: FieldOption[];
  } {
    const state: {
      visible?: boolean;
      disabled?: boolean;
      required?: boolean;
      value?: unknown;
      options?: FieldOption[];
    } = {};

    for (const rule of rules) {
      const conditionsMet = RulesEngine.evaluateConditions(rule.conditions, values, rule.operator);

      if (conditionsMet) {
        // Apply effects
        if (rule.effects.visible !== undefined) {
          state.visible = rule.effects.visible;
        }
        if (rule.effects.disabled !== undefined) {
          state.disabled = rule.effects.disabled;
        }
        if (rule.effects.required !== undefined) {
          state.required = rule.effects.required;
        }
        if (rule.effects.value !== undefined) {
          state.value = rule.effects.value;
        }
        // Note: effects.options is a DataSource and should be handled separately by the field renderer
        // It cannot be directly assigned to state.options which expects FieldOption[]
      }
    }

    return state;
  }

  /**
   * Evaluate custom expression using jsep
   *
   * Supports expressions like:
   * - "age > 18"
   * - "quantity * price"
   * - "status == 'active' && role == 'admin'"
   * - "total >= 100 ? 'discount' : 'regular'"
   */
  static evaluateExpression(expression: string, values: Record<string, unknown>): unknown {
    try {
      const ast = jsep(expression);
      return RulesEngine.evaluateNode(ast, values);
    } catch (error) {
      console.error('Expression evaluation error:', error);
      return false;
    }
  }

  /**
   * Minimal AST evaluator - only supports operators needed for form rules
   */
  private static evaluateNode(node: jsep.Expression, values: Record<string, unknown>): unknown {
    switch (node.type) {
      case 'Literal':
        return (node as jsep.Literal).value;

      case 'Identifier':
        return get(values, (node as jsep.Identifier).name);

      case 'BinaryExpression': {
        const binary = node as jsep.BinaryExpression;
        const left = RulesEngine.evaluateNode(binary.left, values);
        const right = RulesEngine.evaluateNode(binary.right, values);

        switch (binary.operator) {
          case '==':
            return left == right;
          case '===':
            return left === right;
          case '!=':
            return left != right;
          case '!==':
            return left !== right;
          case '<':
            return (left as number) < (right as number);
          case '>':
            return (left as number) > (right as number);
          case '<=':
            return (left as number) <= (right as number);
          case '>=':
            return (left as number) >= (right as number);
          case '&&':
            return left && right;
          case '||':
            return left || right;
          case '+':
            return (left as number) + (right as number);
          case '-':
            return (left as number) - (right as number);
          case '*':
            return (left as number) * (right as number);
          case '/':
            return (left as number) / (right as number);
          case '%':
            return (left as number) % (right as number);
          default:
            throw new Error(`Unsupported operator: ${binary.operator}`);
        }
      }

      case 'UnaryExpression': {
        const unary = node as jsep.UnaryExpression;
        const arg = RulesEngine.evaluateNode(unary.argument, values);

        switch (unary.operator) {
          case '!':
            return !arg;
          case '-':
            return -(arg as number);
          case '+':
            return +(arg as number);
          default:
            throw new Error(`Unsupported unary operator: ${unary.operator}`);
        }
      }

      case 'MemberExpression': {
        const member = node as jsep.MemberExpression;
        const obj = RulesEngine.evaluateNode(member.object, values);
        const prop = member.computed
          ? RulesEngine.evaluateNode(member.property, values)
          : (member.property as jsep.Identifier).name;
        return (obj as Record<string, unknown>)?.[prop as string];
      }

      case 'ConditionalExpression': {
        const cond = node as jsep.ConditionalExpression;
        return RulesEngine.evaluateNode(cond.test, values)
          ? RulesEngine.evaluateNode(cond.consequent, values)
          : RulesEngine.evaluateNode(cond.alternate, values);
      }

      default:
        throw new Error(`Unsupported expression type: ${node.type}`);
    }
  }

  /**
   * Determine if a field is visible based on its rules and current form values
   * Extracted for reuse in validation and field rendering
   */
  static isFieldVisible(rules: FieldRule[] | undefined, values: Record<string, unknown>): boolean {
    if (!rules || rules.length === 0) return true;

    const ruleResult = RulesEngine.applyRules(rules, values, {} as FormContext);

    // Check if field has show/hide rules
    const hasShowRule = rules.some((rule) => rule.effects?.visible === true);
    const hasHideRule = rules.some((rule) => rule.effects?.visible === false);

    if (ruleResult.visible !== undefined) {
      return ruleResult.visible;
    } else if (hasShowRule) {
      // Field has show rule but no rule matched - hidden by default
      return false;
    } else if (hasHideRule) {
      // Field has hide rule but no rule matched - visible by default
      return true;
    }

    return true; // Default visible
  }

  /**
   * Build a dependency graph for optimized field watching
   */
  static buildDependencyGraph(rules: FieldRule[]): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();

    for (const rule of rules) {
      for (const condition of rule.conditions) {
        if (!graph.has(condition.when)) {
          graph.set(condition.when, new Set());
        }
        graph.get(condition.when)!.add(rule.id);
      }
    }

    return graph;
  }
}

/**
 * Expression Builder - Helper for creating common expressions
 */
export class ExpressionBuilder {
  static equals(field: string, value: unknown): string {
    return `${field} == ${JSON.stringify(value)}`;
  }

  static notEquals(field: string, value: unknown): string {
    return `${field} != ${JSON.stringify(value)}`;
  }

  static greaterThan(field: string, value: number): string {
    return `${field} > ${value}`;
  }

  static lessThan(field: string, value: number): string {
    return `${field} < ${value}`;
  }

  static greaterThanOrEqual(field: string, value: number): string {
    return `${field} >= ${value}`;
  }

  static lessThanOrEqual(field: string, value: number): string {
    return `${field} <= ${value}`;
  }

  static isEmpty(field: string): string {
    return `!${field} || ${field} == ''`;
  }

  static isNotEmpty(field: string): string {
    return `${field} && ${field} != ''`;
  }

  static and(...expressions: string[]): string {
    return `(${expressions.join(' && ')})`;
  }

  static or(...expressions: string[]): string {
    return `(${expressions.join(' || ')})`;
  }

  static not(expression: string): string {
    return `!(${expression})`;
  }

  static between(field: string, min: number, max: number): string {
    return `${field} >= ${min} && ${field} <= ${max}`;
  }

  static sum(fields: string[]): string {
    return fields.map((f) => `(${f} || 0)`).join(' + ');
  }

  static product(fields: string[]): string {
    return fields.map((f) => `(${f} || 0)`).join(' * ');
  }

  static average(fields: string[]): string {
    const sum = ExpressionBuilder.sum(fields);
    return `(${sum}) / ${fields.length}`;
  }

  static inArray(field: string, values: unknown[]): string {
    const checks = values.map((v) => `${field} == ${JSON.stringify(v)}`);
    return ExpressionBuilder.or(...checks);
  }
}

/**
 * Rule Builder - Fluent API for creating rules
 */
export class RuleBuilder {
  private rule: FieldRule;

  constructor(id: string) {
    this.rule = {
      id,
      conditions: [],
      operator: 'AND',
      effects: {},
    };
  }

  when(field: string): ConditionBuilder {
    return new ConditionBuilder(this, field);
  }

  withCustomExpression(expression: string): this {
    this.rule.conditions.push({
      when: '',
      custom: expression,
    });
    return this;
  }

  useOperator(operator: 'AND' | 'OR'): this {
    this.rule.operator = operator;
    return this;
  }

  show(): this {
    this.rule.effects.visible = true;
    return this;
  }

  hide(): this {
    this.rule.effects.visible = false;
    return this;
  }

  enable(): this {
    this.rule.effects.disabled = false;
    return this;
  }

  disable(): this {
    this.rule.effects.disabled = true;
    return this;
  }

  require(): this {
    this.rule.effects.required = true;
    return this;
  }

  optional(): this {
    this.rule.effects.required = false;
    return this;
  }

  setValue(value: unknown): this {
    this.rule.effects.value = value;
    return this;
  }

  build(): FieldRule {
    return this.rule;
  }
}

class ConditionBuilder {
  constructor(
    private ruleBuilder: RuleBuilder,
    private field: string
  ) {}

  is(value: unknown): RuleBuilder {
    this.ruleBuilder['rule'].conditions.push({
      when: this.field,
      is: value,
    });
    return this.ruleBuilder;
  }

  isNot(value: unknown): RuleBuilder {
    this.ruleBuilder['rule'].conditions.push({
      when: this.field,
      isNot: value,
    });
    return this.ruleBuilder;
  }

  in(values: unknown[]): RuleBuilder {
    this.ruleBuilder['rule'].conditions.push({
      when: this.field,
      in: values,
    });
    return this.ruleBuilder;
  }

  notIn(values: unknown[]): RuleBuilder {
    this.ruleBuilder['rule'].conditions.push({
      when: this.field,
      notIn: values,
    });
    return this.ruleBuilder;
  }

  matches(pattern: string): RuleBuilder {
    this.ruleBuilder['rule'].conditions.push({
      when: this.field,
      matches: pattern,
    });
    return this.ruleBuilder;
  }
}
