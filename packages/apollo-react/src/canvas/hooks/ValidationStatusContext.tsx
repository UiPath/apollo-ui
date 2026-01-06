import React, { useContext, useEffect, useState } from 'react';
import type { ValidationState } from '../types/validation';

export interface ValidationStateContextValue {
  getElementValidationState: (elementId: string) => ValidationState | undefined;
}

export const ValidationStatusContext = React.createContext<ValidationStateContextValue>({
  getElementValidationState: () => undefined,
});

export const useElementValidationStatus = (elementId: string): ValidationState | undefined => {
  const context = useContext(ValidationStatusContext);
  const [validationState, setValidationState] = useState<ValidationState | undefined>();

  useEffect(() => {
    const state = context.getElementValidationState(elementId);
    setValidationState(state);
  }, [elementId, context]);

  return validationState;
};
