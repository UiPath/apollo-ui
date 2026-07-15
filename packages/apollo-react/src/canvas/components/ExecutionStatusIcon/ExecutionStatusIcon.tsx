import { Spinner } from '@uipath/apollo-wind';
import { useMemo } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasIcon } from '../../utils/icon-registry';

export function getExecutionStatusColor(status: string | undefined): string {
  switch (status) {
    case 'NotExecuted':
      return 'var(--color-foreground-de-emp)';
    case 'InProgress':
      return 'var(--color-info-icon)';
    case 'Completed':
      return 'var(--color-success-icon)';
    case 'ActionNeeded':
    case 'Paused':
    case 'Warning':
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
    | 'ActionNeeded'
    | 'InProgress'
    | 'Cancelled'
    | 'UserCancelled'
    | 'Completed'
    | 'Paused'
    | 'Failed'
    | 'NotExecuted'
    | 'Terminated'
    | 'Warning'
    | string;
  size?: number;
}) {
  const { _ } = useSafeLingui();

  return useMemo(() => {
    const color = getExecutionStatusColor(status);

    switch (status) {
      case 'InProgress':
        return (
          <Spinner
            size="sm"
            label={_({ id: 'stage-node.status.in-progress', message: 'In progress' })}
            className="[&>svg]:text-[color:var(--color-info-icon)]"
            style={{ backgroundColor: 'transparent', width: size, height: size }}
          />
        );
      case 'Completed':
        return <CanvasIcon icon="circle-check" size={size} color={color} />;
      case 'ActionNeeded':
        return <CanvasIcon icon="hand" size={size} color={color} />;
      case 'Paused':
        return <CanvasIcon icon="circle-pause" size={size} color={color} />;
      case 'Warning':
        return <CanvasIcon icon="triangle-alert" size={size} color={color} />;
      case 'Failed':
        return <CanvasIcon icon="circle-alert" size={size} color={color} />;
      case 'Terminated':
        return <CanvasIcon icon="circle-x" size={size} color={color} />;
      case 'Cancelled':
      case 'UserCancelled':
        return <CanvasIcon icon="circle-stop" size={size} color={color} />;
      case 'NotExecuted':
        return <CanvasIcon icon="circle-dashed" size={size} color={color} />;
      default:
        return null;
    }
  }, [status, size, _]);
}
