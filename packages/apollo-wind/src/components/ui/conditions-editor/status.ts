import { format, isValid } from 'date-fns';
import type { Condition, ConditionGroup, ConditionValueMode } from './model';
import type { ConditionsEditorStrings } from './strings';
import {
  type ConditionField,
  type ConditionOperator,
  type ConditionOperators,
  DEFAULT_CONDITION_OPERATORS,
} from './vocabulary';

/** What the editor offers, which every row reads to resolve its parts. */
export interface ConditionVocabulary {
  fields: readonly ConditionField[];
  operators: ConditionOperators;
  valueModes: readonly ConditionValueMode[];
}

const MODES_WITH_VARIABLES: readonly ConditionValueMode[] = ['literal', 'expression', 'variable'];
const MODES: readonly ConditionValueMode[] = ['literal', 'expression'];

/** The editor's modes when none are given: Variable only when there is something to pick. */
export function defaultValueModes(variables: unknown) {
  return variables ? MODES_WITH_VARIABLES : MODES;
}

export interface ResolvedCondition {
  field?: ConditionField;
  operators: readonly ConditionOperator[];
  /**
   * The row's operator. A row without one means its field type's first; an id the type does not
   * offer resolves to none, so it is flagged rather than shown as another operator.
   */
  operator?: ConditionOperator;
  /** The row's mode, or the first one allowed when the editor does not offer it. */
  mode: ConditionValueMode;
  /** The editor's modes the operator can compare against, in the editor's order. */
  allowedModes: readonly ConditionValueMode[];
  hasValue: boolean;
}

export function allowedModes(
  operator: ConditionOperator | undefined,
  valueModes: readonly ConditionValueMode[]
) {
  const only = operator?.valueModes;
  return only ? valueModes.filter((mode) => only.includes(mode)) : valueModes;
}

export function operatorsFor(
  field: ConditionField | undefined,
  operators: ConditionOperators
): readonly ConditionOperator[] {
  return operators[field?.type ?? 'string'] ?? [];
}

export function resolveCondition(c: Condition, vocabulary: ConditionVocabulary): ResolvedCondition {
  const field = vocabulary.fields.find((option) => option.value === c.field);
  const operators = operatorsFor(field, vocabulary.operators);
  const operator =
    c.operator === undefined
      ? operators[0]
      : operators.find((option) => option.value === c.operator);
  const allowed = allowedModes(operator, vocabulary.valueModes);
  const mode =
    c.valueMode && vocabulary.valueModes.includes(c.valueMode)
      ? c.valueMode
      : (allowed[0] ?? vocabulary.valueModes[0] ?? 'literal');
  return {
    field,
    operators,
    operator,
    mode,
    allowedModes: allowed,
    hasValue: operator?.hasValue !== false,
  };
}

/** A date value as stored: `yyyy-MM-dd`, read as a local date so no time zone shifts the day. */
export function parseDateValue(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return isValid(date) ? date : undefined;
}

export function formatDateValue(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function takesOptions(resolved: ResolvedCondition) {
  return resolved.mode === 'literal' && resolved.operator?.multiple === true;
}

type ValueProblem = 'missing' | 'number' | 'date' | 'option' | 'options' | undefined;

/** What is wrong with a value the row needs, following the control the row shows. */
function valueProblem(c: Condition, resolved: ResolvedCondition): ValueProblem {
  const { field, mode } = resolved;
  if (takesOptions(resolved)) {
    const values = c.values ?? [];
    if (values.length === 0) return 'options';
    const known = field?.options;
    return known && values.some((value) => !known.some((option) => option.value === value))
      ? 'options'
      : undefined;
  }
  const value = c.value?.trim();
  if (!value) return 'missing';
  if (mode !== 'literal') return undefined;
  if (field?.type === 'number' && !Number.isFinite(Number(value))) return 'number';
  if (field?.type === 'date' && !parseDateValue(value)) return 'date';
  if (field?.type === 'enum' && !field.options?.some((option) => option.value === c.value)) {
    return 'option';
  }
  return undefined;
}

export function isValueInvalid(c: Condition, resolved: ResolvedCondition) {
  return valueProblem(c, resolved) !== undefined;
}

export function isComplete(c: Condition, vocabulary: ConditionVocabulary) {
  const resolved = resolveCondition(c, vocabulary);
  if (!resolved.field || !resolved.operator) return false;
  return !resolved.hasValue || valueProblem(c, resolved) === undefined;
}

/**
 * Whether a condition is complete: it has a known field and operator, and a value the operator
 * can use. The editor flags every other row, and a host should ignore them when it runs the rules.
 */
export function isConditionComplete(
  condition: Condition,
  vocabulary: Pick<ConditionVocabulary, 'fields'> & Partial<ConditionVocabulary>
) {
  return isComplete(condition, {
    operators: DEFAULT_CONDITION_OPERATORS,
    valueModes: ['literal', 'expression', 'variable'],
    ...vocabulary,
  });
}

/** The row's message, naming only what is still missing. */
export function conditionError(
  c: Condition,
  vocabulary: ConditionVocabulary,
  strings: ConditionsEditorStrings
) {
  if (isComplete(c, vocabulary)) return undefined;
  const resolved = resolveCondition(c, vocabulary);
  const problem = resolved.hasValue ? valueProblem(c, resolved) : undefined;
  if (!resolved.field) {
    return problem === 'missing' || problem === 'options'
      ? strings.errorFieldAndValue
      : strings.errorField;
  }
  if (!resolved.operator) return strings.errorOperator;
  if (problem === 'number') return strings.errorNumber;
  if (problem === 'date') return strings.errorDate;
  return problem === 'options' ? strings.errorOptions : strings.errorValue;
}

function describeValue(
  c: Condition,
  resolved: ResolvedCondition,
  strings: ConditionsEditorStrings
) {
  const { field, mode } = resolved;
  const optionLabel = (value: string) =>
    field?.options?.find((option) => option.value === value)?.label ?? value;
  if (takesOptions(resolved)) return strings.summaryList((c.values ?? []).map(optionLabel));
  if (mode === 'literal' && field?.type === 'date') {
    const date = parseDateValue(c.value);
    return date ? strings.formatDate(date) : (c.value ?? '');
  }
  if (mode === 'literal' && field?.type === 'enum') return optionLabel(c.value ?? '');
  return c.value ?? '';
}

/** Plain-language reading of a group. Incomplete conditions are left out, as they are ignored. */
export function describeGroup(
  node: ConditionGroup,
  vocabulary: ConditionVocabulary,
  strings: ConditionsEditorStrings,
  nested = false
): string {
  const parts = node.children
    .map((child) => {
      if (child.kind === 'group') return describeGroup(child, vocabulary, strings, true);
      if (!isComplete(child, vocabulary)) return '';
      const resolved = resolveCondition(child, vocabulary);
      return strings.summaryCondition(
        resolved.field?.label ?? '',
        resolved.operator?.label ?? '',
        resolved.hasValue ? describeValue(child, resolved, strings) : undefined
      );
    })
    .filter(Boolean);
  if (parts.length === 0) return '';
  const joined = parts.join(` ${node.mode === 'all' ? strings.summaryAnd : strings.summaryOr} `);
  return nested && parts.length > 1 ? `(${joined})` : joined;
}

/** Whether the group, or any group inside it, shows a problem: an incomplete row or an empty group. */
export function hasShownProblems(
  node: ConditionGroup,
  vocabulary: ConditionVocabulary,
  shown: (id: string) => boolean,
  nested = false
): boolean {
  if (nested && node.children.length === 0) return true;
  return node.children.some((child) =>
    child.kind === 'condition'
      ? shown(child.id) && !isComplete(child, vocabulary)
      : hasShownProblems(child, vocabulary, shown, true)
  );
}
