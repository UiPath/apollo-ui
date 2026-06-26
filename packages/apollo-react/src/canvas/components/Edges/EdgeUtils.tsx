import { type ElementStatus, ElementStatusValues } from '../../types/execution';
import type { ValidationErrorSeverity } from '../../types/validation';

export const edgeTargetStatusToEdgeColor: {
  [key in ElementStatus | ValidationErrorSeverity]: string;
} = {
  ActionNeeded: 'var(--canvas-warning-icon)',
  Cancelled: 'var(--canvas-error-icon)',
  Completed: 'var(--canvas-success-icon)',
  CRITICAL: 'var(--canvas-error-icon)',
  ERROR: 'var(--canvas-error-icon)',
  Failed: 'var(--canvas-error-icon)',
  INFO: 'var(--canvas-info-icon)',
  InProgress: 'var(--canvas-info-icon)',
  NotExecuted: 'var(--canvas-border)',
  Paused: 'var(--canvas-warning-icon)',
  Terminated: 'var(--canvas-error-icon)',
  Warning: 'var(--canvas-warning-icon)',
  UserCancelled: 'var(--canvas-info-icon)',
  WARNING: 'var(--canvas-warning-icon)',
  None: 'var(--canvas-border)',
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
