export type ValidationError = {
  code: string;
  message: string;
  description: string;
  severity: ValidationErrorSeverity;
  elementId?: string;
  sourceId?: string;
  targetId?: string;
  diagramId?: string;
  additionalErrorInfo?: Record<string, string>;
};

export enum ValidationErrorSeverity {
  INFO = 'INFO',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface ValidationState {
  validationStatus: ValidationErrorSeverity | undefined;
  validationError: ValidationError | undefined;
}
