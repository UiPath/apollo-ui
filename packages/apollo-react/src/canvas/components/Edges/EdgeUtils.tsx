import { type ElementStatus, ElementStatusValues } from '../../types/execution';
import type { ValidationErrorSeverity } from '../../types/validation';

export const edgeTargetStatusToEdgeColor: {
  [key in ElementStatus | ValidationErrorSeverity]: string;
} = {
  Cancelled: 'var(--uix-canvas-error-icon)',
  Completed: 'var(--uix-canvas-success-icon)',
  CRITICAL: 'var(--uix-canvas-error-icon)',
  ERROR: 'var(--uix-canvas-error-icon)',
  Failed: 'var(--uix-canvas-error-icon)',
  INFO: 'var(--uix-canvas-info-icon)',
  InProgress: 'var(--uix-canvas-info-icon)',
  NotExecuted: 'var(--uix-canvas-border)',
  Paused: 'var(--uix-canvas-warning-icon)',
  Terminated: 'var(--uix-canvas-error-icon)',
  Warning: 'var(--uix-canvas-warning-icon)',
  UserCancelled: 'var(--uix-canvas-info-icon)',
  WARNING: 'var(--uix-canvas-warning-icon)',
  None: 'var(--uix-canvas-border)',
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
