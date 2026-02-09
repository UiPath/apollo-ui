import { type ElementStatus, ElementStatusValues } from '../../types/execution';
import type { ValidationErrorSeverity } from '../../types/validation';

export const edgeTargetStatusToEdgeColor: {
  [key in ElementStatus | ValidationErrorSeverity]: string;
} = {
  Cancelled: 'var(--color-error-icon)',
  Completed: 'var(--color-success-icon)',
  CRITICAL: 'var(--color-error-icon)',
  ERROR: 'var(--color-error-icon)',
  Failed: 'var(--color-error-icon)',
  INFO: 'var(--color-info-icon)',
  InProgress: 'var(--color-info-icon)',
  NotExecuted: 'var(--color-canvas-element-border-color-default)',
  Paused: 'var(--color-warning-icon)',
  Terminated: 'var(--color-error-icon)',
  UserCancelled: 'var(--color-info-icon)',
  WARNING: 'var(--color-warning-icon)',
  None: 'var(--color-canvas-element-border-color-default)',
};

export const getStatusAnimation = (
  status: ElementStatus | ValidationErrorSeverity | undefined,
  edgePath: string
) => {
  const shouldAnimate = status === ElementStatusValues.InProgress;
  if (!shouldAnimate) {
    return null;
  }

  return (
    <circle r="4" fill={edgeTargetStatusToEdgeColor[status]}>
      <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
    </circle>
  );
};
