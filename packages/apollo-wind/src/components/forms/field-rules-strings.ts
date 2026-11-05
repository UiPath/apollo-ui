/**
 * Copy the RulesEngine adapter writes: why a row cannot be stored, and why a stored rule needs
 * repair. Pass a partial set as `strings` to `createRulesEngineVocabulary` and in
 * `FieldRulesOptions` to translate it.
 */
export interface FieldRulesStrings {
  /** On a comparison only an expression can store, on a field key no expression can name. */
  errorUnnamedField: string;
  /**
   * Repair reasons follow RulesEditor's "This rule cannot be evaluated: ". This one is for a fixed
   * value stored as text on a field that holds a number or a yes/no.
   */
  repairComparedWithText: (field: string, value: string, expected: 'number' | 'boolean') => string;
  /** A placeholder row, shown as `false`, in a rule that needs every condition. */
  repairEmptyCondition: string;
}

export const DEFAULT_FIELD_RULES_STRINGS: FieldRulesStrings = {
  errorUnnamedField: "Expressions can't name this field, so this comparison can't run.",
  repairComparedWithText: (field, value, expected) =>
    `${field} is compared with the text "${value}", not ${expected === 'boolean' ? 'yes or no' : 'a number'}`,
  repairEmptyCondition: 'an empty condition, shown as false, keeps it from ever applying',
};
