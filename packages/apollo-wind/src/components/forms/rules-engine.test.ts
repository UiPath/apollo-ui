import { describe, it, expect } from 'vitest';
import { RulesEngine, RuleBuilder, ExpressionBuilder } from './rules-engine';
import type { FieldCondition, FieldRule, FormContext } from './form-schema';

describe('RulesEngine', () => {
  describe('evaluateCondition', () => {
    it("evaluates 'is' condition correctly when matching", () => {
      const condition: FieldCondition = { when: 'status', is: 'active' };
      expect(RulesEngine.evaluateCondition(condition, { status: 'active' })).toBe(true);
    });

    it("evaluates 'is' condition correctly when not matching", () => {
      const condition: FieldCondition = { when: 'status', is: 'active' };
      expect(RulesEngine.evaluateCondition(condition, { status: 'inactive' })).toBe(false);
    });

    it("evaluates 'isNot' condition correctly when matching", () => {
      const condition: FieldCondition = { when: 'status', isNot: 'deleted' };
      expect(RulesEngine.evaluateCondition(condition, { status: 'active' })).toBe(true);
    });

    it("evaluates 'isNot' condition correctly when not matching", () => {
      const condition: FieldCondition = { when: 'status', isNot: 'deleted' };
      expect(RulesEngine.evaluateCondition(condition, { status: 'deleted' })).toBe(false);
    });

    it("evaluates 'in' condition correctly when value is in array", () => {
      const condition: FieldCondition = {
        when: 'role',
        in: ['admin', 'moderator'],
      };
      expect(RulesEngine.evaluateCondition(condition, { role: 'admin' })).toBe(true);
    });

    it("evaluates 'in' condition correctly when value is not in array", () => {
      const condition: FieldCondition = {
        when: 'role',
        in: ['admin', 'moderator'],
      };
      expect(RulesEngine.evaluateCondition(condition, { role: 'user' })).toBe(false);
    });

    it("evaluates 'notIn' condition correctly when value is not in array", () => {
      const condition: FieldCondition = {
        when: 'role',
        notIn: ['banned', 'suspended'],
      };
      expect(RulesEngine.evaluateCondition(condition, { role: 'active' })).toBe(true);
    });

    it("evaluates 'notIn' condition correctly when value is in array", () => {
      const condition: FieldCondition = {
        when: 'role',
        notIn: ['banned', 'suspended'],
      };
      expect(RulesEngine.evaluateCondition(condition, { role: 'banned' })).toBe(false);
    });

    it("evaluates 'matches' regex condition correctly when pattern matches", () => {
      const condition: FieldCondition = {
        when: 'email',
        matches: '^[a-z]+@example\\.com$',
      };
      expect(RulesEngine.evaluateCondition(condition, { email: 'test@example.com' })).toBe(true);
    });

    it("evaluates 'matches' regex condition correctly when pattern does not match", () => {
      const condition: FieldCondition = {
        when: 'email',
        matches: '^[a-z]+@example\\.com$',
      };
      expect(RulesEngine.evaluateCondition(condition, { email: 'test@other.com' })).toBe(false);
    });

    it("evaluates 'custom' expression condition", () => {
      const condition: FieldCondition = { when: '', custom: 'age > 18' };
      expect(RulesEngine.evaluateCondition(condition, { age: 21 })).toBe(true);
      expect(RulesEngine.evaluateCondition(condition, { age: 16 })).toBe(false);
    });

    it('handles undefined field values', () => {
      const condition: FieldCondition = { when: 'missing', is: 'value' };
      expect(RulesEngine.evaluateCondition(condition, {})).toBe(false);
    });

    it('returns false for condition with no operators', () => {
      const condition: FieldCondition = { when: 'field' };
      expect(RulesEngine.evaluateCondition(condition, { field: 'value' })).toBe(false);
    });
  });

  describe('evaluateConditions', () => {
    it('returns true for empty conditions array', () => {
      expect(RulesEngine.evaluateConditions([], {})).toBe(true);
    });

    it('evaluates AND operator - all true', () => {
      const conditions: FieldCondition[] = [
        { when: 'a', is: 1 },
        { when: 'b', is: 2 },
      ];
      expect(RulesEngine.evaluateConditions(conditions, { a: 1, b: 2 }, 'AND')).toBe(true);
    });

    it('evaluates AND operator - one false', () => {
      const conditions: FieldCondition[] = [
        { when: 'a', is: 1 },
        { when: 'b', is: 2 },
      ];
      expect(RulesEngine.evaluateConditions(conditions, { a: 1, b: 3 }, 'AND')).toBe(false);
    });

    it('evaluates OR operator - one true', () => {
      const conditions: FieldCondition[] = [
        { when: 'a', is: 1 },
        { when: 'b', is: 2 },
      ];
      expect(RulesEngine.evaluateConditions(conditions, { a: 1, b: 3 }, 'OR')).toBe(true);
    });

    it('evaluates OR operator - all false', () => {
      const conditions: FieldCondition[] = [
        { when: 'a', is: 1 },
        { when: 'b', is: 2 },
      ];
      expect(RulesEngine.evaluateConditions(conditions, { a: 5, b: 6 }, 'OR')).toBe(false);
    });

    it('defaults to AND operator', () => {
      const conditions: FieldCondition[] = [
        { when: 'a', is: 1 },
        { when: 'b', is: 2 },
      ];
      expect(RulesEngine.evaluateConditions(conditions, { a: 1, b: 3 })).toBe(false);
    });
  });

  describe('evaluateExpression', () => {
    it('evaluates literal values', () => {
      expect(RulesEngine.evaluateExpression('42', {})).toBe(42);
      expect(RulesEngine.evaluateExpression("'hello'", {})).toBe('hello');
      expect(RulesEngine.evaluateExpression('true', {})).toBe(true);
    });

    it('evaluates identifiers from values', () => {
      expect(RulesEngine.evaluateExpression('name', { name: 'John' })).toBe('John');
      expect(RulesEngine.evaluateExpression('count', { count: 5 })).toBe(5);
    });

    it('evaluates comparison operators', () => {
      expect(RulesEngine.evaluateExpression('age > 18', { age: 21 })).toBe(true);
      expect(RulesEngine.evaluateExpression('age < 18', { age: 21 })).toBe(false);
      expect(RulesEngine.evaluateExpression('age >= 21', { age: 21 })).toBe(true);
      expect(RulesEngine.evaluateExpression('age <= 21', { age: 21 })).toBe(true);
    });

    it('evaluates equality operators', () => {
      expect(
        RulesEngine.evaluateExpression("status == 'active'", {
          status: 'active',
        })
      ).toBe(true);
      expect(
        RulesEngine.evaluateExpression("status === 'active'", {
          status: 'active',
        })
      ).toBe(true);
      expect(
        RulesEngine.evaluateExpression("status != 'deleted'", {
          status: 'active',
        })
      ).toBe(true);
      expect(
        RulesEngine.evaluateExpression("status !== 'deleted'", {
          status: 'active',
        })
      ).toBe(true);
    });

    it('evaluates logical operators', () => {
      expect(RulesEngine.evaluateExpression('a && b', { a: true, b: true })).toBe(true);
      expect(RulesEngine.evaluateExpression('a && b', { a: true, b: false })).toBe(false);
      expect(RulesEngine.evaluateExpression('a || b', { a: false, b: true })).toBe(true);
      expect(RulesEngine.evaluateExpression('a || b', { a: false, b: false })).toBe(false);
    });

    it('evaluates arithmetic operators', () => {
      expect(RulesEngine.evaluateExpression('a + b', { a: 5, b: 3 })).toBe(8);
      expect(RulesEngine.evaluateExpression('a - b', { a: 5, b: 3 })).toBe(2);
      expect(RulesEngine.evaluateExpression('a * b', { a: 5, b: 3 })).toBe(15);
      expect(RulesEngine.evaluateExpression('a / b', { a: 6, b: 2 })).toBe(3);
      expect(RulesEngine.evaluateExpression('a % b', { a: 7, b: 3 })).toBe(1);
    });

    it('evaluates unary operators', () => {
      expect(RulesEngine.evaluateExpression('!active', { active: true })).toBe(false);
      expect(RulesEngine.evaluateExpression('!active', { active: false })).toBe(true);
      expect(RulesEngine.evaluateExpression('-num', { num: 5 })).toBe(-5);
      expect(RulesEngine.evaluateExpression('+num', { num: 5 })).toBe(5);
    });

    it('evaluates member expressions', () => {
      expect(RulesEngine.evaluateExpression('user.name', { user: { name: 'John' } })).toBe('John');
      expect(RulesEngine.evaluateExpression('user.age', { user: { age: 30 } })).toBe(30);
    });

    it('evaluates conditional (ternary) expressions', () => {
      expect(
        RulesEngine.evaluateExpression("age >= 18 ? 'adult' : 'minor'", {
          age: 21,
        })
      ).toBe('adult');
      expect(
        RulesEngine.evaluateExpression("age >= 18 ? 'adult' : 'minor'", {
          age: 15,
        })
      ).toBe('minor');
    });

    it('handles invalid expressions gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      expect(RulesEngine.evaluateExpression('invalid ??? syntax', {})).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Expression evaluation error:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('handles undefined values in expressions', () => {
      expect(RulesEngine.evaluateExpression('missing > 10', {})).toBe(false);
    });
  });

  describe('applyRules', () => {
    const mockContext = {} as FormContext;

    it('applies visible effect when condition is met', () => {
      const rules: FieldRule[] = [
        {
          id: 'show-rule',
          conditions: [{ when: 'toggle', is: true }],
          effects: { visible: true },
        },
      ];
      const result = RulesEngine.applyRules(rules, { toggle: true }, mockContext);
      expect(result.visible).toBe(true);
    });

    it('applies disabled effect when condition is met', () => {
      const rules: FieldRule[] = [
        {
          id: 'disable-rule',
          conditions: [{ when: 'locked', is: true }],
          effects: { disabled: true },
        },
      ];
      const result = RulesEngine.applyRules(rules, { locked: true }, mockContext);
      expect(result.disabled).toBe(true);
    });

    it('applies required effect when condition is met', () => {
      const rules: FieldRule[] = [
        {
          id: 'require-rule',
          conditions: [{ when: 'type', is: 'business' }],
          effects: { required: true },
        },
      ];
      const result = RulesEngine.applyRules(rules, { type: 'business' }, mockContext);
      expect(result.required).toBe(true);
    });

    it('applies value effect when condition is met', () => {
      const rules: FieldRule[] = [
        {
          id: 'value-rule',
          conditions: [{ when: 'preset', is: 'default' }],
          effects: { value: 'default-value' },
        },
      ];
      const result = RulesEngine.applyRules(rules, { preset: 'default' }, mockContext);
      expect(result.value).toBe('default-value');
    });

    it('does not apply effects when condition is not met', () => {
      const rules: FieldRule[] = [
        {
          id: 'show-rule',
          conditions: [{ when: 'toggle', is: true }],
          effects: { visible: true },
        },
      ];
      const result = RulesEngine.applyRules(rules, { toggle: false }, mockContext);
      expect(result.visible).toBeUndefined();
    });

    it('applies multiple rules in order (last wins)', () => {
      const rules: FieldRule[] = [
        {
          id: 'rule-1',
          conditions: [{ when: 'a', is: 1 }],
          effects: { visible: true },
        },
        {
          id: 'rule-2',
          conditions: [{ when: 'b', is: 2 }],
          effects: { visible: false },
        },
      ];
      const result = RulesEngine.applyRules(rules, { a: 1, b: 2 }, mockContext);
      expect(result.visible).toBe(false);
    });

    it('returns empty state when no rules match', () => {
      const rules: FieldRule[] = [
        {
          id: 'rule-1',
          conditions: [{ when: 'a', is: 1 }],
          effects: { visible: true },
        },
      ];
      const result = RulesEngine.applyRules(rules, { a: 99 }, mockContext);
      expect(result).toEqual({});
    });
  });

  describe('isFieldVisible', () => {
    it('returns true when no rules provided', () => {
      expect(RulesEngine.isFieldVisible(undefined, {})).toBe(true);
      expect(RulesEngine.isFieldVisible([], {})).toBe(true);
    });

    it('returns visible state from matching rule', () => {
      const rules: FieldRule[] = [
        {
          id: 'show-rule',
          conditions: [{ when: 'toggle', is: true }],
          effects: { visible: true },
        },
      ];
      expect(RulesEngine.isFieldVisible(rules, { toggle: true })).toBe(true);
      expect(RulesEngine.isFieldVisible(rules, { toggle: false })).toBe(false);
    });

    it('returns false by default when field has show rule but no match', () => {
      const rules: FieldRule[] = [
        {
          id: 'show-rule',
          conditions: [{ when: 'type', is: 'special' }],
          effects: { visible: true },
        },
      ];
      expect(RulesEngine.isFieldVisible(rules, { type: 'normal' })).toBe(false);
    });

    it('returns true by default when field has hide rule but no match', () => {
      const rules: FieldRule[] = [
        {
          id: 'hide-rule',
          conditions: [{ when: 'type', is: 'hidden' }],
          effects: { visible: false },
        },
      ];
      expect(RulesEngine.isFieldVisible(rules, { type: 'visible' })).toBe(true);
    });
  });

  describe('buildDependencyGraph', () => {
    it('builds graph from rules with conditions', () => {
      const rules: FieldRule[] = [
        {
          id: 'rule-1',
          conditions: [{ when: 'fieldA', is: 1 }],
          effects: { visible: true },
        },
        {
          id: 'rule-2',
          conditions: [{ when: 'fieldB', is: 2 }],
          effects: { disabled: true },
        },
      ];
      const graph = RulesEngine.buildDependencyGraph(rules);

      expect(graph.get('fieldA')).toContain('rule-1');
      expect(graph.get('fieldB')).toContain('rule-2');
    });

    it('groups multiple rules depending on same field', () => {
      const rules: FieldRule[] = [
        {
          id: 'rule-1',
          conditions: [{ when: 'status', is: 'active' }],
          effects: { visible: true },
        },
        {
          id: 'rule-2',
          conditions: [{ when: 'status', is: 'inactive' }],
          effects: { disabled: true },
        },
      ];
      const graph = RulesEngine.buildDependencyGraph(rules);

      expect(graph.get('status')?.size).toBe(2);
      expect(graph.get('status')).toContain('rule-1');
      expect(graph.get('status')).toContain('rule-2');
    });

    it('handles rules with multiple conditions', () => {
      const rules: FieldRule[] = [
        {
          id: 'rule-1',
          conditions: [
            { when: 'fieldA', is: 1 },
            { when: 'fieldB', is: 2 },
          ],
          effects: { visible: true },
        },
      ];
      const graph = RulesEngine.buildDependencyGraph(rules);

      expect(graph.get('fieldA')).toContain('rule-1');
      expect(graph.get('fieldB')).toContain('rule-1');
    });
  });
});

describe('RuleBuilder', () => {
  it("creates a rule with 'is' condition", () => {
    const rule = new RuleBuilder('test-rule').when('status').is('active').show().build();

    expect(rule.id).toBe('test-rule');
    expect(rule.conditions).toHaveLength(1);
    expect(rule.conditions[0]).toEqual({ when: 'status', is: 'active' });
    expect(rule.effects.visible).toBe(true);
  });

  it("creates a rule with 'isNot' condition", () => {
    const rule = new RuleBuilder('test-rule').when('status').isNot('deleted').enable().build();

    expect(rule.conditions[0]).toEqual({ when: 'status', isNot: 'deleted' });
    expect(rule.effects.disabled).toBe(false);
  });

  it("creates a rule with 'in' condition", () => {
    const rule = new RuleBuilder('test-rule')
      .when('role')
      .in(['admin', 'moderator'])
      .require()
      .build();

    expect(rule.conditions[0]).toEqual({
      when: 'role',
      in: ['admin', 'moderator'],
    });
    expect(rule.effects.required).toBe(true);
  });

  it("creates a rule with 'notIn' condition", () => {
    const rule = new RuleBuilder('test-rule').when('role').notIn(['banned']).optional().build();

    expect(rule.conditions[0]).toEqual({ when: 'role', notIn: ['banned'] });
    expect(rule.effects.required).toBe(false);
  });

  it("creates a rule with 'matches' condition", () => {
    const rule = new RuleBuilder('test-rule').when('email').matches('@company.com$').hide().build();

    expect(rule.conditions[0]).toEqual({
      when: 'email',
      matches: '@company.com$',
    });
    expect(rule.effects.visible).toBe(false);
  });

  it('creates a rule with custom expression', () => {
    const rule = new RuleBuilder('test-rule').withCustomExpression('age > 18').require().build();

    expect(rule.conditions[0]).toEqual({ when: '', custom: 'age > 18' });
  });

  it('sets operator to OR', () => {
    const rule = new RuleBuilder('test-rule')
      .when('a')
      .is(1)
      .when('b')
      .is(2)
      .useOperator('OR')
      .show()
      .build();

    expect(rule.operator).toBe('OR');
    expect(rule.conditions).toHaveLength(2);
  });

  it('chains multiple effects', () => {
    const rule = new RuleBuilder('test-rule')
      .when('status')
      .is('locked')
      .disable()
      .require()
      .setValue('locked')
      .build();

    expect(rule.effects.disabled).toBe(true);
    expect(rule.effects.required).toBe(true);
    expect(rule.effects.value).toBe('locked');
  });
});

describe('ExpressionBuilder', () => {
  it('builds equals expression', () => {
    const expr = ExpressionBuilder.equals('status', 'active');
    expect(expr).toBe('status == "active"');
    expect(RulesEngine.evaluateExpression(expr, { status: 'active' })).toBe(true);
  });

  it('builds notEquals expression', () => {
    const expr = ExpressionBuilder.notEquals('status', 'deleted');
    expect(expr).toBe('status != "deleted"');
    expect(RulesEngine.evaluateExpression(expr, { status: 'active' })).toBe(true);
  });

  it('builds greaterThan expression', () => {
    const expr = ExpressionBuilder.greaterThan('age', 18);
    expect(expr).toBe('age > 18');
    expect(RulesEngine.evaluateExpression(expr, { age: 21 })).toBe(true);
  });

  it('builds lessThan expression', () => {
    const expr = ExpressionBuilder.lessThan('age', 18);
    expect(expr).toBe('age < 18');
    expect(RulesEngine.evaluateExpression(expr, { age: 15 })).toBe(true);
  });

  it('builds and expression', () => {
    const expr = ExpressionBuilder.and('a > 0', 'b > 0');
    expect(expr).toBe('(a > 0 && b > 0)');
    expect(RulesEngine.evaluateExpression(expr, { a: 1, b: 2 })).toBe(true);
  });

  it('builds or expression', () => {
    const expr = ExpressionBuilder.or('a > 0', 'b > 0');
    expect(expr).toBe('(a > 0 || b > 0)');
    expect(RulesEngine.evaluateExpression(expr, { a: 0, b: 1 })).toBe(true);
  });

  it('builds not expression', () => {
    const expr = ExpressionBuilder.not('active');
    expect(expr).toBe('!(active)');
    expect(RulesEngine.evaluateExpression(expr, { active: false })).toBe(true);
  });

  it('builds between expression', () => {
    const expr = ExpressionBuilder.between('age', 18, 65);
    expect(expr).toBe('age >= 18 && age <= 65');
    expect(RulesEngine.evaluateExpression(expr, { age: 30 })).toBe(true);
    expect(RulesEngine.evaluateExpression(expr, { age: 10 })).toBe(false);
  });

  it('builds sum expression', () => {
    const expr = ExpressionBuilder.sum(['a', 'b', 'c']);
    expect(expr).toBe('(a || 0) + (b || 0) + (c || 0)');
    expect(RulesEngine.evaluateExpression(expr, { a: 1, b: 2, c: 3 })).toBe(6);
  });

  it('builds inArray expression', () => {
    const expr = ExpressionBuilder.inArray('role', ['admin', 'mod']);
    expect(expr).toBe('(role == "admin" || role == "mod")');
    expect(RulesEngine.evaluateExpression(expr, { role: 'admin' })).toBe(true);
    expect(RulesEngine.evaluateExpression(expr, { role: 'user' })).toBe(false);
  });
});
