import { type ReactNode, useMemo } from 'react';
import { useEdgeExecutionState, useElementValidationStatus } from '../../../../hooks';
import {
  type ElementStatus,
  ElementStatusValues,
  type NodeExecutionStateWithDebug,
} from '../../../../types/execution';
import type { ValidationErrorSeverity } from '../../../../types/validation';
import { edgeTargetStatusToEdgeColor, getStatusAnimation } from '../../EdgeUtils';

export type UseExecutionEdgeArgs = {
  edgeId: string;
  target: string;
  /** SVG path along which the in-progress dot animates. */
  edgePath: string;
  /** When false the underlying hooks still subscribe (rules of hooks) but their output is ignored. */
  enabled: boolean;
};

export type ExecutionEdge = {
  statusColor: string | undefined;
  animation: ReactNode;
};

function resolveStatus(
  executionState: ReturnType<typeof useEdgeExecutionState>,
  validation: ReturnType<typeof useElementValidationStatus>
): ElementStatus | ValidationErrorSeverity | undefined {
  if (executionState) {
    return ((executionState as NodeExecutionStateWithDebug)?.status ?? executionState) as
      | ElementStatus
      | ValidationErrorSeverity
      | undefined;
  }
  return validation?.validationStatus;
}

export function useExecutionEdge(args: UseExecutionEdgeArgs): ExecutionEdge {
  const { edgeId, target, edgePath, enabled } = args;

  const executionState = useEdgeExecutionState(edgeId, target);
  const validation = useElementValidationStatus(edgeId);

  const status = enabled ? resolveStatus(executionState, validation) : undefined;
  const statusColor = status ? edgeTargetStatusToEdgeColor[status] : undefined;
  // Non-animating edges should not recompute animation output on geometry-only updates.
  const animationPath = status === ElementStatusValues.InProgress ? edgePath : undefined;
  const animation = useMemo(() => {
    if (animationPath == null) {
      return null;
    }

    return getStatusAnimation(status, animationPath);
  }, [status, animationPath]);

  return { statusColor, animation };
}
