import { ApCircularProgress, ApIcon } from '@uipath/apollo-react/material/components';
import { useMemo } from 'react';

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
    switch (status) {
      case 'InProgress':
        return <ApCircularProgress size={size} style={{ backgroundColor: 'transparent' }} />;
      case 'Completed':
        return (
          <ApIcon color="var(--uix-canvas-success-icon)" name="check_circle" size={`${size}px`} />
        );
      case 'Paused':
        return <ApIcon color="var(--uix-canvas-warning-icon)" name="pause" size={`${size}px`} />;
      case 'Failed':
        return <ApIcon color="var(--uix-canvas-error-icon)" name="error" size={`${size}px`} />;
      case 'Terminated':
        return <ApIcon color="var(--uix-canvas-error-icon)" name="close" size={`${size}px`} />;
      case 'Cancelled':
        return <ApIcon color="var(--uix-canvas-error-icon)" name="block" size={`${size}px`} />;
      case 'NotExecuted':
        return (
          <ApIcon
            color="var(--uix-canvas-foreground-de-emp)"
            name="hourglass_empty"
            size={`${size}px`}
          />
        );
      default:
        return null;
    }
  }, [status, size]);
}
