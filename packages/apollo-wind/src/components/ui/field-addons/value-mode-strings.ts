/**
 * The built-in value modes: a value typed as-is, an expression evaluated at run time, a bound
 * variable, or a prompt the agent fills in. A consumer offers only the ones it lists.
 */
export type ValueMode = 'literal' | 'expression' | 'variable' | 'prompt';

/** Every string the value-mode primitives render. apollo-wind has no i18n runtime, so a localized
 *  host passes its own translations through each primitive's `strings` prop. */
export interface ValueModeStrings {
  /** The literal mode's name, the same for every value type. */
  literalTitle: string;
  /** The literal mode's description when the value type is not number or boolean. */
  literalDescription: string;
  literalNumberDescription: string;
  literalBooleanDescription: string;
  expressionTitle: string;
  expressionDescription: string;
  variableTitle: string;
  variableDescription: string;
  promptTitle: string;
  promptDescription: string;
  /** Shown in the variable control while no variable is bound. */
  variablePlaceholder: string;
  /** Shown in the prompt control while the prompt is empty. */
  promptPlaceholder: string;
  /** Names the menu trigger when it offers only actions and no modes. */
  fieldActions: string;
  /** Hover text on the `=` indicator. */
  expressionIndicator: string;
  /** Title of the dialog confirming a switch that loses the current value. */
  lossyTitle: string;
  lossyDescription: string;
  /** The dialog's confirm and cancel buttons. */
  confirm: string;
  cancel: string;
}

export const DEFAULT_VALUE_MODE_STRINGS: ValueModeStrings = {
  literalTitle: 'Fixed value',
  literalDescription: 'Enter a value directly',
  literalNumberDescription: 'Enter a numeric value',
  literalBooleanDescription: 'Select true or false',
  expressionTitle: 'Expression',
  expressionDescription: 'JavaScript expression',
  variableTitle: 'Variable',
  variableDescription: 'Bind to a variable',
  promptTitle: 'Prompt',
  promptDescription: 'Describe the value for the agent to fill in',
  variablePlaceholder: 'Select a variable',
  promptPlaceholder: 'Describe the value',
  fieldActions: 'Field actions',
  expressionIndicator: 'JavaScript expression',
  lossyTitle: 'Switch value mode?',
  lossyDescription: 'The current value will be cleared. This cannot be undone.',
  confirm: 'Switch',
  cancel: 'Cancel',
};
