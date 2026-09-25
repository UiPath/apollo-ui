import { createContext, createElement, type ReactNode, useContext, useMemo } from 'react';

/** The built-in value modes: a value typed as-is, or an expression evaluated at run time. */
export type ValueMode = 'literal' | 'expression';

/** Every string the value-mode primitives render. apollo-wind has no i18n runtime, so a localized
 *  host passes its own translations through {@link ValueModeStringsProvider}. */
export interface ValueModeStrings {
  /** The literal mode's name, the same for every value type. */
  literalTitle: string;
  /** The literal mode's description when the value type is not number or boolean. */
  literalDescription: string;
  literalNumberDescription: string;
  literalBooleanDescription: string;
  expressionTitle: string;
  expressionDescription: string;
  /** Names the menu trigger when it offers only actions and no modes. */
  fieldActions: string;
  /** Hover text on the `=` indicator. */
  expressionIndicator: string;
}

export const DEFAULT_VALUE_MODE_STRINGS: ValueModeStrings = {
  literalTitle: 'Fixed value',
  literalDescription: 'Enter a value directly',
  literalNumberDescription: 'Enter a numeric value',
  literalBooleanDescription: 'Select true or false',
  expressionTitle: 'Expression',
  expressionDescription: 'JavaScript expression with IntelliSense',
  fieldActions: 'Field actions',
  expressionIndicator: 'JavaScript expression',
};

const ValueModeStringsContext = createContext<ValueModeStrings>(DEFAULT_VALUE_MODE_STRINGS);

export interface ValueModeStringsProviderProps {
  /**
   * Overrides for any subset of the English defaults. Keep the object stable, such as a module
   * constant or a memoized value: a new object each render re-renders every value-mode primitive.
   */
  strings: Partial<ValueModeStrings>;
  children?: ReactNode;
}

/** Supplies translated strings to every value-mode primitive below it. */
export function ValueModeStringsProvider({ strings, children }: ValueModeStringsProviderProps) {
  const parent = useContext(ValueModeStringsContext);
  const value = useMemo(() => ({ ...parent, ...strings }), [parent, strings]);
  return createElement(ValueModeStringsContext.Provider, { value }, children);
}

/** The strings in effect: the nearest provider's, merged over the English defaults. */
export function useValueModeStrings(): ValueModeStrings {
  return useContext(ValueModeStringsContext);
}
