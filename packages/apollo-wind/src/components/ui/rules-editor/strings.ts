export interface RulesEditorStrings {
  outcomeLabel: string;
  outcomePlaceholder: string;
  /** Shown when a rule's outcome is not one the editor offers. */
  errorOutcome: string;
  /**
   * After the outcome select: "Show when". The select comes first, so a language that puts the
   * conjunction first cannot reorder the two.
   */
  when: string;
  /** After the outcome select of a rule with no conditions, which always applies: "Show always". */
  always: string;
  /** The rule half of every control's name, e.g. "Rule 2" + "Outcome". */
  ruleName: (position: number) => string;
  removeRule: (position: number) => string;
  /** Names a rule's conditions group, e.g. "Rule 2 conditions". */
  ruleConditions: (rule: string) => string;
  /** The rule mode menu's options. */
  modeConditions: string;
  modeConditionsDescription: string;
  modeExpression: string;
  modeExpressionDescription: string;
  /** Names the mode menu by the current mode, e.g. "Rule 2 mode: Conditions". */
  ruleMode: (rule: string, mode: string) => string;
  /** The expression editor's label. */
  expressionLabel: string;
  /** An example of a valid expression. Empty shows none. */
  expressionPlaceholder: string;
  errorExpression: string;
  /** For an expression the dialect cannot run. */
  errorExpressionInvalid: string;
  /** For an expression naming fields the form does not contain, by the keys it names. */
  errorExpressionUnknownFields: (fields: string[]) => string;
  /** Names a preserved rule's mode and its read-only source. */
  modePreserved: string;
  /** Under a preserved rule's source: it cannot be edited here, and still runs. */
  preservedNote: string;
  /** Asks before a preserved rule's source is replaced by another mode. */
  switchFromPreservedDescription: string;
  /** At the bottom of a rule the dialect cannot evaluate as it shows, with the dialect's reason. */
  ruleNeedsRepair: (reason: string) => string;
  /** After that message: rewrites the rule so it is evaluated as it shows. */
  repairAction: string;
  addRule: string;
  /** Says what happens with no rules, e.g. "No rules. The field always shows." Empty shows none. */
  empty: string;
  /** Asked when a rule's conditions cannot be written as an expression. */
  switchToExpressionTitle: string;
  switchToExpressionDescription: string;
  /** Asked when a rule's expression cannot be shown as conditions. */
  switchToConditionsTitle: string;
  switchToConditionsDescription: string;
  switchConfirm: string;
  cancel: string;
}

export const DEFAULT_RULES_EDITOR_STRINGS: RulesEditorStrings = {
  outcomeLabel: 'Outcome',
  outcomePlaceholder: 'Select an outcome',
  errorOutcome: 'Select an outcome.',
  when: 'when',
  always: 'always',
  ruleName: (position) => `Rule ${position}`,
  removeRule: (position) => `Remove rule ${position}`,
  ruleConditions: (rule) => `${rule} conditions`,
  modeConditions: 'Conditions',
  modeExpression: 'Expression',
  modeConditionsDescription: 'Pick fields, operators, and values.',
  modeExpressionDescription: 'Write one expression.',
  ruleMode: (rule, mode) => `${rule} mode: ${mode}`,
  expressionLabel: 'Expression',
  expressionPlaceholder: '',
  errorExpression: 'Enter an expression.',
  errorExpressionInvalid: "This expression can't run. Check its syntax and what it uses.",
  errorExpressionUnknownFields: (fields) =>
    `Uses ${fields.join(', ')}, which the form does not contain.`,
  modePreserved: 'Stored conditions',
  preservedNote:
    'These conditions are not supported in the current editor but will continue to execute.',
  switchFromPreservedDescription:
    'These stored conditions cannot be edited here, so they will be removed.',
  ruleNeedsRepair: (reason) => `This rule cannot be evaluated: ${reason}.`,
  repairAction: 'Repair rule',
  addRule: 'Add rule',
  empty: 'No rules.',
  switchToExpressionTitle: 'Switch to an expression?',
  switchToExpressionDescription:
    'These conditions cannot be written as an expression, so they will be removed.',
  switchToConditionsTitle: 'Switch to conditions?',
  switchToConditionsDescription:
    'This expression cannot be shown as conditions, so it will be removed.',
  switchConfirm: 'Switch',
  cancel: 'Cancel',
};
