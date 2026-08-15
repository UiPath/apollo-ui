import React, { useContext, useMemo } from 'react';
import type { ValidationState } from '../types/validation';

export interface ValidationStateContextValue {
  getElementValidationState: (elementId: string) => ValidationState | undefined;
}

export const ValidationStatusContext = React.createContext<ValidationStateContextValue>({
  getElementValidationState: () => undefined,
});

// Read during render (memoized on context identity) rather than setState in an
// effect: value available on first render, one render per update instead of
// two. See ExecutionStatusContext for the full rationale.
export const useElementValidationStatus = (elementId: string): ValidationState | undefined => {
  const context = useContext(ValidationStatusContext);
  return useMemo(() => context.getElementValidationState(elementId), [elementId, context]);
};
