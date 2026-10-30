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

/**
 * A field the rules can compare. Its `value` is the key the form's values use, and should be an
 * identifier path such as `amount` or `user.role`: a row only an expression can say, such as
 * Greater than, cannot name any other key, so it is left out when stored.
 */
export interface FieldRuleField extends ConditionField {
  /** Defaults to `number` for number fields and `string` for the rest. */
  valueType?: FieldValueType;
}

// ── Vocabulary ─────────────────────────────────────────────────────────────

// RulesEngine expressions have no function calls, so text and option matching only take a fixed
// value: there is no way to write "contains" against an expression.
const FIXED_ONLY: readonly ConditionValueMode[] = ['literal'];
const FIXED_ONLY_OPERATORS = new Set([
  'contains',
  'startsWith',
  'matches',
  'isOneOf',
  'isNotOneOf',
]);

const fixedOnly = (operators: readonly ConditionOperator[]) =>
  operators.map((option) =>
    FIXED_ONLY_OPERATORS.has(option.value) ? { ...option, valueModes: FIXED_ONLY } : option
  );

/**
 * The operators RulesEngine can run, per field type: the default ones, with text matching and
 * option lists taking a fixed value only. Labels are English: map them to translate.
 */
export const RULES_ENGINE_OPERATORS: ConditionOperators = {
  string: fixedOnly(DEFAULT_CONDITION_OPERATORS.string),
  number: fixedOnly(DEFAULT_CONDITION_OPERATORS.number),
  date: fixedOnly(DEFAULT_CONDITION_OPERATORS.date),
  enum: fixedOnly(DEFAULT_CONDITION_OPERATORS.enum),
};

/**
 * What a ConditionsEditor or RulesEditor offers for rules RulesEngine runs. There is no Variable
 * mode: RulesEngine only sees the form's values.
 */
export const rulesEngineVocabulary: Pick<ConditionVocabulary, 'operators' | 'valueModes'> = {
  operators: RULES_ENGINE_OPERATORS,
  valueModes: ['literal', 'expression'],
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
// Names jsep reads as literals rather than as a field.
const LITERAL_NAMES = new Set(['true', 'false', 'null', 'this', 'undefined']);

export function canName(key: string) {
  return IDENTIFIER_PATH.test(key) && !LITERAL_NAMES.has(key.split('.')[0]);
}

// ── Printing ───────────────────────────────────────────────────────────────

/** Expression text for a node, parenthesising every compound operand so precedence never shifts. */
export function printNode(node: jsep.Expression): string {
  const operand = (child: jsep.Expression) =>
    child.type === 'BinaryExpression' || child.type === 'ConditionalExpression'
      ? `(${printNode(child)})`
      : printNode(child);
  // What a member or call applies to, so `(-a).b` keeps its parentheses.
  const target = (child: jsep.Expression) =>
    ['Identifier', 'MemberExpression', 'CallExpression', 'ArrayExpression'].includes(child.type)
      ? printNode(child)
      : `(${printNode(child)})`;
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
        ? `${target(member.object)}[${printNode(member.property)}]`
        : `${target(member.object)}.${printNode(member.property)}`;
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
      return `${target(call.callee)}(${call.arguments.map(printNode).join(', ')})`;
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

/** An expression value as RulesEngine reads it, or `undefined` when it does not parse. */
function valueExpression(text: string) {
  const node = parseExpression(text);
  if (!node) return undefined;
  try {
    return printNode(node);
  } catch {
    return undefined;
  }
}

/**
 * A complete condition as an expression, or `undefined` when RulesEngine cannot say it: text
 * matching, an expression value that does not parse, or a field key that is not a path of
 * identifiers.
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
    // Printed from its parse, so its text cannot reach past its own parentheses.
    const value = valueExpression(c.value ?? '');
    return symbol && value !== undefined ? `${name} ${symbol} (${value})` : undefined;
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

/** A rule's conditions as one expression, or `undefined` when any of them cannot be one. */
function conditionsExpression(
  group: ConditionGroup,
  vocabulary: ConditionVocabulary
): string | undefined {
  // No conditions always applies; blank rows say nothing yet.
  if (group.children.length === 0) return 'true';
  const parts: string[] = [];
  for (const child of group.children) {
    if (child.kind === 'condition' && isBlankCondition(child)) continue;
    // A rule's conditions are flat, so a group is not one it can write.
    const text =
      child.kind === 'condition' && isComplete(child, vocabulary)
        ? conditionExpression(child, vocabulary)
        : undefined;
    if (text === undefined) return undefined;
    parts.push(text);
  }
  // Joining wraps any part that has an operator of its own, so precedence never shifts.
  const wrap = (part: string) => (parts.length > 1 && /&&|\|\|/.test(part) ? `(${part})` : part);
  return parts.map(wrap).join(group.mode === 'all' ? ' && ' : ' || ');
}

// ── Text matching, which only reads as calls ───────────────────────────────

/** A field key as an expression names it: itself, or hitl's older `values["key"]`. */
export const fieldName = (key: string) => (canName(key) ? key : `values[${JSON.stringify(key)}]`);
export const containsCall = (name: string, text: string) =>
  `String(${name}).includes(${JSON.stringify(text)})`;
export const startsWithCall = (name: string, text: string) =>
  `String(${name}).startsWith(${JSON.stringify(text)})`;
export const patternCall = (name: string, pattern: string) =>
  `RegExp(${JSON.stringify(pattern)}).test(String(${name}))`;

const stringLiteral = (node: jsep.Expression | undefined) =>
  node?.type === 'Literal' && typeof (node as jsep.Literal).value === 'string'
    ? ((node as jsep.Literal).value as string)
    : undefined;

/** `String(f)` on a field, as text matching wraps it. */
function stringOf(node: jsep.Expression | undefined, fields: readonly ConditionField[]) {
  const call = node as jsep.CallExpression | undefined;
  if (call?.type !== 'CallExpression' || call.arguments.length !== 1) return undefined;
  const callee = call.callee as jsep.Identifier;
  return callee.type === 'Identifier' && callee.name === 'String'
    ? fieldRef(call.arguments[0], fields)
    : undefined;
}

/**
 * The calls text matching reads as, back as a row: `String(f).includes("x")`,
 * `String(f).startsWith("x")`, and `RegExp("p").test(String(f))`. RulesEngine cannot run them, but
 * a row stores them as it can.
 */
function textMatch(node: jsep.Expression, fields: readonly ConditionField[]) {
  const call = node as jsep.CallExpression;
  const callee = call.callee as jsep.MemberExpression;
  if (call.arguments.length !== 1 || callee.type !== 'MemberExpression' || callee.computed) {
    return undefined;
  }
  const method = (callee.property as jsep.Identifier).name;
  if (method === 'includes' || method === 'startsWith') {
    const field = stringOf(callee.object, fields);
    const value = stringLiteral(call.arguments[0]);
    if (!field || value === undefined) return undefined;
    return { field, operator: method === 'includes' ? 'contains' : 'startsWith', value };
  }
  const pattern = callee.object as jsep.CallExpression;
  if (method !== 'test' || pattern.type !== 'CallExpression' || pattern.arguments.length !== 1) {
    return undefined;
  }
  const regExp = pattern.callee as jsep.Identifier;
  const value = stringLiteral(pattern.arguments[0]);
  const field = stringOf(call.arguments[0], fields);
  if (regExp.type !== 'Identifier' || regExp.name !== 'RegExp' || !field || value === undefined) {
    return undefined;
  }
  return { field, operator: 'matches', value };
}

// ── Checking what RulesEngine can run ──────────────────────────────────────

const BINARY_OPERATORS = new Set([
  '==',
  '===',
  '!=',
  '!==',
  '<',
  '>',
  '<=',
  '>=',
  '&&',
  '||',
  '+',
  '-',
  '*',
  '/',
  '%',
]);
const UNARY_OPERATORS = new Set(['!', '-', '+']);

/** Whether RulesEngine evaluates the node, rather than throwing on it or misreading it. */
function runs(node: jsep.Expression, fields: readonly ConditionField[]): boolean {
  switch (node.type) {
    case 'Literal':
      return true;
    case 'Identifier': {
      const { name } = node as jsep.Identifier;
      // hitl's older `values[...]` reads a field RulesEngine looks up by its own key. RulesEngine
      // has no globals either: `NaN` and `Infinity` read as fields, which hold no such value.
      return name === 'values' || name === 'NaN' || name === 'Infinity'
        ? fields.some((field) => field.value === name || field.value.startsWith(`${name}.`))
        : true;
    }
    case 'MemberExpression': {
      const member = node as jsep.MemberExpression;
      return runs(member.object, fields) && (!member.computed || runs(member.property, fields));
    }
    case 'BinaryExpression': {
      const binary = node as jsep.BinaryExpression;
      return (
        BINARY_OPERATORS.has(binary.operator) &&
        runs(binary.left, fields) &&
        runs(binary.right, fields)
      );
    }
    case 'UnaryExpression': {
      const unary = node as jsep.UnaryExpression;
      return UNARY_OPERATORS.has(unary.operator) && runs(unary.argument, fields);
    }
    case 'ConditionalExpression': {
      const conditional = node as jsep.ConditionalExpression;
      return [conditional.test, conditional.consequent, conditional.alternate].every((part) =>
        runs(part, fields)
      );
    }
    default:
      return false;
  }
}

/** Whether RulesEngine can run the expression: it parses, and uses only what RulesEngine reads. */
export function canRun(expression: string, fields: readonly ConditionField[]) {
  const node = parseExpression(expression);
  return node !== undefined && runs(node, fields);
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

// Strict only: a row compares strictly, and `name == 1` matches "01" where `name === "1"` does not.
const OPERATOR_FOR: Record<string, string> = {
  '===': 'equals',
  '!==': 'notEquals',
  '>': 'greaterThan',
  '<': 'lessThan',
};

/** Whether a fixed value is of the type the field holds, as a row writes it back typed. */
function isFieldTyped(value: unknown, key: string, fields: readonly ConditionField[]) {
  const field = fields.find((option) => option.value === key);
  return typeof value === valueTypeOf(field);
}

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
  // Loose `== null` only: an unset field is `undefined`, which `=== null` misses.
  if (node.operator === '||' && left.operator === '==' && right.operator === '===') {
    return { field, operator: 'isEmpty' };
  }
  if (node.operator === '&&' && left.operator === '!=' && right.operator === '!==') {
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

/**
 * One comparison as a condition row, or `undefined` when it is not one the editor can show: one it
 * does not offer, or would flag, such as `name === ""`.
 */
export function parseCondition(
  node: jsep.Expression,
  vocabulary: ConditionVocabulary,
  id?: string
): Condition | undefined {
  let row: Omit<Condition, 'kind' | 'id'> | undefined;
  const binary = node as jsep.BinaryExpression;
  if (node.type === 'CallExpression') {
    row = textMatch(node, vocabulary.fields);
  } else if (node.type !== 'BinaryExpression') {
    return undefined;
  } else if (binary.operator === '||' || binary.operator === '&&') {
    row = emptiness(binary, vocabulary.fields);
  } else {
    const field = fieldRef(binary.left, vocabulary.fields);
    const op = OPERATOR_FOR[binary.operator];
    if (!field || !op) return undefined;
    const literal = literalValue(binary.right);
    if (literal && isFieldTyped(literal.value, field, vocabulary.fields)) {
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
  return offered(condition, vocabulary) && isComplete(condition, vocabulary)
    ? condition
    : undefined;
}

/** Every part of a chain of one operator, such as `a && b && c`. */
function chainParts(node: jsep.BinaryExpression, fields: readonly ConditionField[]) {
  const parts: jsep.Expression[] = [];
  const collect = (part: jsep.Expression) => {
    const inner = part as jsep.BinaryExpression;
    // An empty check is one row, though it is written with `||` or `&&`.
    if (
      inner.type === 'BinaryExpression' &&
      inner.operator === node.operator &&
      !emptiness(inner, fields)
    ) {
      collect(inner.left);
      collect(inner.right);
    } else parts.push(part);
  };
  collect(node);
  return parts;
}

/**
 * `f === a || f === b` as Is one of, and `f !== a && f !== b` as Is not one of: how option lists
 * are written, so they read back as one row inside a chain of the other operator.
 */
function parseList(node: jsep.Expression, vocabulary: ConditionVocabulary) {
  const binary = node as jsep.BinaryExpression;
  if (binary.type !== 'BinaryExpression') return undefined;
  const list =
    binary.operator === '||'
      ? { operator: 'isOneOf', compare: '===' }
      : binary.operator === '&&'
        ? { operator: 'isNotOneOf', compare: '!==' }
        : undefined;
  if (!list) return undefined;
  let field: string | undefined;
  const values: string[] = [];
  for (const part of chainParts(binary, vocabulary.fields)) {
    const comparison = part as jsep.BinaryExpression;
    if (comparison.type !== 'BinaryExpression' || comparison.operator !== list.compare) {
      return undefined;
    }
    const name = fieldRef(comparison.left, vocabulary.fields);
    const literal = literalValue(comparison.right);
    if (!name || (field && name !== field) || !literal) return undefined;
    if (!isFieldTyped(literal.value, name, vocabulary.fields)) return undefined;
    field = name;
    values.push(valueText(literal.value));
  }
  const condition = createCondition({ field, operator: list.operator, values });
  return offered(condition, vocabulary) && isComplete(condition, vocabulary)
    ? condition
    : undefined;
}

function parseGroup(
  node: jsep.Expression,
  vocabulary: ConditionVocabulary
): ConditionGroup | undefined {
  if (node.type === 'Literal' && (node as jsep.Literal).value === true)
    return createConditionGroup();
  const single = parseCondition(node, vocabulary) ?? parseList(node, vocabulary);
  if (single) return createConditionGroup('all', [single]);
  const binary = node as jsep.BinaryExpression;
  if (
    binary.type !== 'BinaryExpression' ||
    (binary.operator !== '&&' && binary.operator !== '||')
  ) {
    return undefined;
  }
  // A rule's conditions are flat: one chain of one operator, each part a row.
  const children: Condition[] = [];
  for (const part of chainParts(binary, vocabulary.fields)) {
    const condition = parseCondition(part, vocabulary) ?? parseList(part, vocabulary);
    if (!condition) return undefined;
    children.push(condition);
  }
  return createConditionGroup(binary.operator === '&&' ? 'all' : 'any', children);
}

/**
 * Converts between a rule's conditions and RulesEngine's expression language: strict comparisons
 * joined by `&&` or `||`. Text matching, or an expression that mixes `&&` and `||` outside an
 * option list, cannot cross over, so switching such a rule asks first. An expression RulesEngine
 * cannot run is flagged on its rule.
 */
export const rulesEngineDialect: RulesDialect = {
  toExpression: (conditions, vocabulary) => conditionsExpression(conditions, vocabulary),
  fromExpression: (expression, vocabulary) => {
    const node = parseExpression(expression);
    return node ? parseGroup(node, vocabulary) : undefined;
  },
  checkExpression: (rule, vocabulary) =>
    canRun(rule.expression, vocabulary.fields) ? undefined : 'invalid',
};
