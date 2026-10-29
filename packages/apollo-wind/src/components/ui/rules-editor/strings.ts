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
  addRule: string;
  /** Says what happens with no rules, e.g. "No rules. The field always shows." */
  empty: string;
  /** A rule's conditions when it has none. `conditionsStrings.empty` overrides it. */
  emptyConditions: string;
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
  addRule: 'Add rule',
  empty: 'No rules.',
  emptyConditions: 'No conditions. This rule always applies.',
  switchToExpressionTitle: 'Switch to an expression?',
  switchToExpressionDescription:
    'These conditions cannot be written as an expression, so they will be removed.',
  switchToConditionsTitle: 'Switch to conditions?',
  switchToConditionsDescription:
    'This expression cannot be shown as conditions, so it will be removed.',
  switchConfirm: 'Switch',
  cancel: 'Cancel',
};
