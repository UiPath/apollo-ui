import { type LucideIcon, Sparkles, SquareFunction, Type, Variable } from 'lucide-react';
import {
  DEFAULT_VALUE_MODE_STRINGS,
  type ValueMode,
  type ValueModeStrings,
} from './value-mode-strings';

/** One selectable mode. `id` is the consumer's own vocabulary. */
export interface ValueModeOption<Id extends string = string> {
  id: Id;
  title: string;
  description?: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export interface BuiltInValueModesOptions {
  /** Picks the literal mode's description (`number`, `boolean`, anything else). */
  expectedType?: string;
  /** Overrides the literal mode's description. */
  literalDescription?: string;
}

function literalDescriptionFor(expectedType: string | undefined, strings: ValueModeStrings) {
  if (expectedType === 'number') return strings.literalNumberDescription;
  if (expectedType === 'boolean') return strings.literalBooleanDescription;
  return strings.literalDescription;
}

/** The four built-in modes, in `strings` (merged over the English defaults). */
export function builtInValueModes(
  strings?: Partial<ValueModeStrings>,
  { expectedType, literalDescription }: BuiltInValueModesOptions = {}
): Record<ValueMode, ValueModeOption<ValueMode>> {
  const text = { ...DEFAULT_VALUE_MODE_STRINGS, ...strings };
  return {
    literal: {
      id: 'literal',
      title: text.literalTitle,
      description: literalDescription ?? literalDescriptionFor(expectedType, text),
      icon: Type,
    },
    expression: {
      id: 'expression',
      title: text.expressionTitle,
      description: text.expressionDescription,
      icon: SquareFunction,
    },
    variable: {
      id: 'variable',
      title: text.variableTitle,
      description: text.variableDescription,
      icon: Variable,
    },
    prompt: {
      id: 'prompt',
      title: text.promptTitle,
      description: text.promptDescription,
      icon: Sparkles,
    },
  };
}

/** The four built-in modes in English. Call {@link builtInValueModes} for translated ones. */
export const BUILTIN_VALUE_MODES = builtInValueModes();

export function isBuiltInValueMode(id: string): id is ValueMode {
  return id in BUILTIN_VALUE_MODES;
}
