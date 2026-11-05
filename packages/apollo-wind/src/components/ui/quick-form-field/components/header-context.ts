import { createContext, useContext, useLayoutEffect } from 'react';
import type { QuickFieldType, QuickFormFieldOption, QuickFormFieldStrings } from '../types';
import type { VariablePickerSource } from '../utils';

/** What an action in a QuickFormField's `headerActions` sees of its field. */
export interface QuickFormFieldHeaderState {
  fieldType: QuickFieldType;
  /** Whether the value is an expression, so an action can say what it produces. */
  isExpression: boolean;
  /** The field's `disabled`, which its header actions honor too. */
  disabled: boolean;
  /** The field's `compact`: icon-only actions, whatever the width, unless an action says otherwise. */
  compact: boolean;
}

/** The built-in actions a composed one replaces. */
export type HeaderActionKind = 'type' | 'ai' | 'insert';

export interface HeaderContextValue extends QuickFormFieldHeaderState {
  strings: QuickFormFieldStrings;
  variables: VariablePickerSource;
  /** Undefined while the value is a variable binding: its picker is the value control. */
  insertVariable?: (variable: QuickFormFieldOption) => void;
  /** False while the value is read-only. */
  canInsert: boolean;
  /** Hides the built-in action of a kind while a composed one is mounted. Returns the release. */
  claim: (kind: HeaderActionKind) => () => void;
}

export const HeaderContext = createContext<HeaderContextValue | null>(null);

export function useHeaderContext(): HeaderContextValue | null {
  return useContext(HeaderContext);
}

/**
 * The enclosing QuickFormField, as an action in its `headerActions` sees it, so a custom action can
 * match the built-in ones. Null outside a field.
 */
export function useQuickFormFieldHeader(): QuickFormFieldHeaderState | null {
  return useContext(HeaderContext);
}

/** Replaces the built-in action of `kind` while mounted, so passing both never shows two. */
export function useClaimHeaderAction(header: HeaderContextValue | null, kind: HeaderActionKind) {
  const claim = header?.claim;
  // Before paint, so the built-in never flashes beside its replacement.
  useLayoutEffect(() => claim?.(kind), [claim, kind]);
}
