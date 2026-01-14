import { ApCircularProgress, ApIcon } from '@uipath/apollo-react/material/components';
import { useMemo } from 'react';

export function getExecutionStatusColor(status: string | undefined): string {
  switch (status) {
    case 'NotExecuted':
      return 'var(--color-foreground-de-emp)';
    case 'InProgress':
      return 'var(--color-info-icon)';
    case 'Completed':
      return 'var(--color-success-icon)';
    case 'Paused':
      return 'var(--color-warning-icon)';
    case 'Cancelled':
      return 'var(--color-error-icon)';
    case 'UserCancelled':
      return 'var(--color-info-icon)';
    case 'Failed':
      return 'var(--color-error-icon)';
    case 'Terminated':
      return 'var(--color-error-icon)';
    case 'Canceling':
      return 'var(--color-error-icon)';
    case 'Faulted':
      return 'var(--color-error-icon)';
    case 'Pausing':
      return 'var(--color-warning-icon)';
    case 'Pending':
      return 'var(--color-warning-icon)';
    case 'Resuming':
      return 'var(--color-info-icon)';
    case 'Retrying':
      return 'var(--color-info-icon)';
    case 'Running':
      return 'var(--color-info-icon)';
    case 'Upgrading':
      return 'var(--color-info-icon)';
    default:
      return '';
  }
}

export function ExecutionStatusIcon({
  status,
  size = 16,
}: {
  status?:
    | 'InProgress'
    | 'Cancelled'
    | 'Completed'
    | 'Paused'
    | 'Failed'
    | 'NotExecuted'
    | 'Terminated'
    | string;
  size?: number;
}) {
  return useMemo(() => {
    const color = getExecutionStatusColor(status);

    switch (status) {
      case 'InProgress':
        return <ApCircularProgress size={size} style={{ backgroundColor: 'transparent' }} />;
      case 'Completed':
        return <ApIcon color={color} name="check_circle" size={`${size}px`} />;
      case 'Paused':
        return <ApIcon color={color} name="pause" size={`${size}px`} />;
      case 'Failed':
        return <ApIcon color={color} name="error" size={`${size}px`} />;
      case 'Terminated':
        return <ApIcon color={color} name="close" size={`${size}px`} />;
      case 'Cancelled':
        return <ApIcon color={color} name="block" size={`${size}px`} />;
      case 'NotExecuted':
        return <ApIcon color={color} name="hourglass_empty" size={`${size}px`} />;
      default:
        return null;
    }
  }, [status, size]);
}
