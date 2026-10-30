import jsep from 'jsep';
import {
  type Condition,
  type ConditionField,
  type ConditionGroup,
  type ConditionOperator,
  type ConditionOperators,
  type ConditionValueMode,
  type ConditionVocabulary,
  createCondition,
  createConditionGroup,
  DEFAULT_CONDITION_OPERATORS,
} from '@/components/ui/conditions-editor';
import {
  isComplete,
  operatorsFor,
  resolveCondition,
} from '@/components/ui/conditions-editor/status';
import type { RulesDialect } from '@/components/ui/rules-editor';

/** What a field's value is at run time, so fixed values are compared as the same type. */
export type FieldValueType = 'string' | 'number' | 'boolean';

/** A field the rules can compare. Its `value` is the key the form's values use. */
export interface FieldRuleField extends ConditionField {
  /** Defaults to `number` for number fields and `string` for the rest. */
  valueType?: FieldValueType;
}

// ── Vocabulary ─────────────────────────────────────────────────────────────

function operator(type: keyof ConditionOperators, value: string): ConditionOperator {
  const found = DEFAULT_CONDITION_OPERATORS[type].find((option) => option.value === value);
  if (!found) throw new Error(`No default ${type} operator ${value}`);
  return found;
}

// RulesEngine expressions have no function calls, so text and option matching only take a fixed
// value: there is no way to write "contains" against an expression.
const FIXED_ONLY: readonly ConditionValueMode[] = ['literal'];

const IS_NOT_EMPTY: ConditionOperator = {
  value: 'isNotEmpty',
  label: 'Is not empty',
  hasValue: false,
};

/**
 * The operators RulesEngine can run, per field type. Text matching and option lists take a fixed
 * value only. Labels are English: map them to translate.
 */
export const RULES_ENGINE_OPERATORS: ConditionOperators = {
  string: [
    operator('string', 'equals'),
    operator('string', 'notEquals'),
    { ...operator('string', 'contains'), valueModes: FIXED_ONLY },
    { ...operator('string', 'startsWith'), valueModes: FIXED_ONLY },
    { value: 'matches', label: 'Matches pattern', valueModes: FIXED_ONLY },
    operator('string', 'isEmpty'),
    operator('string', 'isNotEmpty'),
  ],
  number: [
    operator('number', 'equals'),
    operator('number', 'notEquals'),
    operator('number', 'greaterThan'),
    operator('number', 'lessThan'),
    operator('number', 'isEmpty'),
    IS_NOT_EMPTY,
  ],
  date: [
    operator('date', 'equals'),
    operator('date', 'lessThan'),
    operator('date', 'greaterThan'),
    operator('date', 'isEmpty'),
    IS_NOT_EMPTY,
  ],
  enum: [
    operator('enum', 'equals'),
    operator('enum', 'notEquals'),
    { ...operator('enum', 'isOneOf'), valueModes: FIXED_ONLY },
    { value: 'isNotOneOf', label: 'Is not one of', multiple: true, valueModes: FIXED_ONLY },
  ],
};

/**
 * What a ConditionsEditor or RulesEditor offers for rules RulesEngine runs. There is no Variable
 * mode: RulesEngine only sees the form's values.
 */
export const rulesEngineVocabulary = {
  operators: RULES_ENGINE_OPERATORS,
  valueModes: ['literal', 'expression'] as readonly ConditionValueMode[],
};

// ── Values ─────────────────────────────────────────────────────────────────

export function valueTypeOf(field: ConditionField | undefined): FieldValueType {
  return (
    (field as FieldRuleField | undefined)?.valueType ??
    (field?.type === 'number' ? 'number' : 'string')
  );
}

/** A fixed value as the type the field holds at run time. */
export function typedValue(field: ConditionField | undefined, text: string): unknown {
  const type = valueTypeOf(field);
  if (type === 'number') return Number(text);
  if (type === 'boolean') return text === 'true';
  return text;
}

/** A stored fixed value back as the text the editor shows. */
export function valueText(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function printLiteral(value: unknown): string {
  return value === undefined ? 'undefined' : JSON.stringify(value);
}

// A key RulesEngine reads as a path of identifiers, which is what an expression can name.
const IDENTIFIER_PATH = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/;

export function canName(key: string) {
  return IDENTIFIER_PATH.test(key);
}

// ── Printing ───────────────────────────────────────────────────────────────

/** Expression text for a node, parenthesising every compound operand so precedence never shifts. */
export function printNode(node: jsep.Expression): string {
  const operand = (child: jsep.Expression) =>
    child.type === 'BinaryExpression' || child.type === 'ConditionalExpression'
      ? `(${printNode(child)})`
      : printNode(child);
  switch (node.type) {
    case 'Literal': {
      const literal = node as jsep.Literal;
      return literal.raw ?? printLiteral(literal.value);
    }
    case 'Identifier':
      return (node as jsep.Identifier).name;
    case 'MemberExpression': {
      const member = node as jsep.MemberExpression;
      return member.computed
        ? `${operand(member.object)}[${printNode(member.property)}]`
        : `${operand(member.object)}.${printNode(member.property)}`;
    }
    case 'BinaryExpression': {
      const binary = node as jsep.BinaryExpression;
      return `${operand(binary.left)} ${binary.operator} ${operand(binary.right)}`;
    }
    case 'UnaryExpression': {
      const unary = node as jsep.UnaryExpression;
      return `${unary.operator}${operand(unary.argument)}`;
    }
    case 'ConditionalExpression': {
      const conditional = node as jsep.ConditionalExpression;
      return `${operand(conditional.test)} ? ${operand(conditional.consequent)} : ${operand(conditional.alternate)}`;
    }
    case 'CallExpression': {
      const call = node as jsep.CallExpression;
      return `${operand(call.callee)}(${call.arguments.map(printNode).join(', ')})`;
    }
    case 'ArrayExpression':
      return `[${(node as jsep.ArrayExpression).elements.map((element) => (element ? printNode(element) : '')).join(', ')}]`;
    default:
      throw new Error(`Cannot print ${node.type}`);
  }
}

export function parseExpression(text: string): jsep.Expression | undefined {
  try {
    return jsep(text);
  } catch {
    return undefined;
  }
}

// ── Writing conditions as expressions ──────────────────────────────────────

const COMPARISON: Record<string, string> = {
  equals: '===',
  notEquals: '!==',
  greaterThan: '>',
  lessThan: '<',
};

export const emptyCheck = (name: string) => `${name} == null || ${name} === ""`;
export const notEmptyCheck = (name: string) => `${name} != null && ${name} !== ""`;

/**
 * A complete condition as an expression, or `undefined` when RulesEngine cannot say it: text
 * matching, or a field key that is not a path of identifiers.
 */
export function conditionExpression(c: Condition, vocabulary: ConditionVocabulary) {
  const resolved = resolveCondition(c, vocabulary);
  const name = c.field ?? '';
  if (!canName(name) || !resolved.operator) return undefined;
  const id = resolved.operator.value;
  if (id === 'isEmpty') return emptyCheck(name);
  if (id === 'isNotEmpty') return notEmptyCheck(name);
  const symbol = COMPARISON[id];
  if (resolved.mode === 'expression') {
    return symbol ? `${name} ${symbol} (${c.value ?? ''})` : undefined;
  }
  if (resolved.mode !== 'literal') return undefined;
  if (symbol) return `${name} ${symbol} ${printLiteral(typedValue(resolved.field, c.value ?? ''))}`;
  if (id === 'isOneOf' || id === 'isNotOneOf') {
    const values = (c.values ?? []).map((value) => printLiteral(typedValue(resolved.field, value)));
    const parts = values.map((value) => `${name} ${id === 'isOneOf' ? '===' : '!=='} ${value}`);
    // Unwrapped: joining it with other conditions wraps it.
    return parts.join(id === 'isOneOf' ? ' || ' : ' && ');
  }
  return undefined;
}

const isBlankCondition = (c: Condition) => !c.field && !c.value && (c.values?.length ?? 0) === 0;

function groupExpression(
  group: ConditionGroup,
  vocabulary: ConditionVocabulary,
  nested: boolean
): string | undefined {
  // No conditions always applies; blank rows say nothing yet.
  if (group.children.length === 0) return nested ? undefined : 'true';
  const parts: string[] = [];
  for (const child of group.children) {
    if (child.kind === 'group') {
      const inner = groupExpression(child, vocabulary, true);
      if (inner === undefined) return undefined;
      if (inner === '') continue;
      parts.push(child.children.length > 1 ? `(${inner})` : inner);
      continue;
    }
    if (isBlankCondition(child)) continue;
    if (!isComplete(child, vocabulary)) return undefined;
    const text = conditionExpression(child, vocabulary);
    if (text === undefined) return undefined;
    // Joining wraps any part that has an operator of its own.
    parts.push(group.children.length > 1 && /&&|\|\|/.test(text) ? `(${text})` : text);
  }
  return parts.join(group.mode === 'all' ? ' && ' : ' || ');
}

// ── Reading expressions as conditions ──────────────────────────────────────

/**
 * The field a node names: an identifier path the vocabulary knows, or hitl's older
 * `values["key"]`.
 */
export function fieldRef(node: jsep.Expression, fields: readonly ConditionField[]) {
  let key: string | undefined;
  if (node.type === 'Identifier') key = (node as jsep.Identifier).name;
  else if (node.type === 'MemberExpression') {
    const member = node as jsep.MemberExpression;
    const object = member.object as jsep.Identifier;
    const property = member.property as jsep.Literal;
    if (member.computed && object.type === 'Identifier' && object.name === 'values') {
      key = typeof property.value === 'string' ? property.value : undefined;
    } else {
      try {
        key = printNode(node);
      } catch {
        key = undefined;
      }
      if (key && !canName(key)) key = undefined;
    }
  }
  return key !== undefined && fields.some((field) => field.value === key) ? key : undefined;
}

/** A literal node's value, including negative numbers. */
function literalValue(node: jsep.Expression): { value: unknown } | undefined {
  if (node.type === 'Literal') return { value: (node as jsep.Literal).value };
  const unary = node as jsep.UnaryExpression;
  if (
    unary.type === 'UnaryExpression' &&
    unary.operator === '-' &&
    unary.argument.type === 'Literal'
  ) {
    const value = (unary.argument as jsep.Literal).value;
    return typeof value === 'number' ? { value: -value } : undefined;
  }
  return undefined;
}

const OPERATOR_FOR: Record<string, string> = {
  '===': 'equals',
  '==': 'equals',
  '!==': 'notEquals',
  '!=': 'notEquals',
  '>': 'greaterThan',
  '<': 'lessThan',
};

function isNullLiteral(node: jsep.Expression) {
  return node.type === 'Literal' && (node as jsep.Literal).value === null;
}
function isEmptyStringLiteral(node: jsep.Expression) {
  return node.type === 'Literal' && (node as jsep.Literal).value === '';
}

/** `f == null || f === ""` or its negation, on one field. */
function emptiness(node: jsep.BinaryExpression, fields: readonly ConditionField[]) {
  const left = node.left as jsep.BinaryExpression;
  const right = node.right as jsep.BinaryExpression;
  if (left.type !== 'BinaryExpression' || right.type !== 'BinaryExpression') return undefined;
  const field = fieldRef(left.left, fields);
  if (!field || fieldRef(right.left, fields) !== field) return undefined;
  if (!isNullLiteral(left.right) || !isEmptyStringLiteral(right.right)) return undefined;
  if (node.operator === '||' && ['==', '==='].includes(left.operator) && right.operator === '===') {
    return { field, operator: 'isEmpty' };
  }
  if (node.operator === '&&' && ['!=', '!=='].includes(left.operator) && right.operator === '!==') {
    return { field, operator: 'isNotEmpty' };
  }
  return undefined;
}

/** Whether the vocabulary offers this operator and mode for the field. */
export function offered(c: Condition, vocabulary: ConditionVocabulary) {
  const field = vocabulary.fields.find((option) => option.value === c.field);
  const op = operatorsFor(field, vocabulary.operators).find(
    (option) => option.value === c.operator
  );
  if (!op) return false;
  const mode = c.valueMode ?? 'literal';
  if (!vocabulary.valueModes.includes(mode)) return false;
  return !op.valueModes || op.valueModes.includes(mode);
}

/** One comparison as a condition row, or `undefined` when it is not one the editor can show. */
export function parseCondition(
  node: jsep.Expression,
  vocabulary: ConditionVocabulary,
  id?: string
): Condition | undefined {
  if (node.type !== 'BinaryExpression') return undefined;
  const binary = node as jsep.BinaryExpression;
  let row: Omit<Condition, 'kind' | 'id'> | undefined;
  if (binary.operator === '||' || binary.operator === '&&') {
    row = emptiness(binary, vocabulary.fields);
  } else {
    const field = fieldRef(binary.left, vocabulary.fields);
    const op = OPERATOR_FOR[binary.operator];
    if (!field || !op) return undefined;
    const literal = literalValue(binary.right);
    if (literal && literal.value !== null && typeof literal.value !== 'object') {
      row = { field, operator: op, value: valueText(literal.value) };
    } else if (!literal) {
      let text: string;
      try {
        text = printNode(binary.right);
      } catch {
        return undefined;
      }
      row = { field, operator: op, valueMode: 'expression', value: text };
    }
  }
  if (!row) return undefined;
  const condition = createCondition({ ...row, ...(id ? { id } : {}) });
  return offered(condition, vocabulary) ? condition : undefined;
}

function parseGroup(
  node: jsep.Expression,
  vocabulary: ConditionVocabulary
): ConditionGroup | undefined {
  if (node.type === 'Literal' && (node as jsep.Literal).value === true)
    return createConditionGroup();
  const single = parseCondition(node, vocabulary);
  if (single) return createConditionGroup('all', [single]);
  const binary = node as jsep.BinaryExpression;
  if (
    binary.type !== 'BinaryExpression' ||
    (binary.operator !== '&&' && binary.operator !== '||')
  ) {
    return undefined;
  }
  // Flattens a chain of one operator; a part with the other operator becomes a nested group.
  const parts: jsep.Expression[] = [];
  const collect = (part: jsep.Expression) => {
    const inner = part as jsep.BinaryExpression;
    if (
      inner.type === 'BinaryExpression' &&
      inner.operator === binary.operator &&
      !emptiness(inner, vocabulary.fields)
    ) {
      collect(inner.left);
      collect(inner.right);
    } else parts.push(part);
  };
  collect(binary);
  const children = [];
  for (const part of parts) {
    const condition = parseCondition(part, vocabulary);
    if (condition) {
      children.push(condition);
      continue;
    }
    const nested = parseGroup(part, vocabulary);
    if (!nested || nested.children.length === 0) return undefined;
    children.push(nested.children.length === 1 ? nested.children[0] : nested);
  }
  return createConditionGroup(binary.operator === '&&' ? 'all' : 'any', children);
}

/**
 * Converts between a rule's conditions and RulesEngine's expression language: comparisons joined
 * by `&&` and `||`, with nested groups in parentheses. Text matching cannot be written as an
 * expression, so switching such a rule asks first.
 */
export const rulesEngineDialect: RulesDialect = {
  toExpression: (conditions, vocabulary) => groupExpression(conditions, vocabulary, false),
  fromExpression: (expression, vocabulary) => {
    const node = parseExpression(expression);
    return node ? parseGroup(node, vocabulary) : undefined;
  },
};
