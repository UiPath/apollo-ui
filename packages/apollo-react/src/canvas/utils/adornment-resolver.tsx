import { ExecutionStatusIcon, NodeIcon } from '@uipath/apollo-react/canvas';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { ApTooltip } from '@uipath/apollo-react/material';
import { memo } from 'react';
import type { NodeAdornments, NodeStatusContext } from '../components';
import { getExecutionStatusColor } from '../components/ExecutionStatusIcon/ExecutionStatusIcon';
import { ValidationErrorSeverity } from '../types/validation';

interface BreakpointIndicatorProps {
  isActive?: boolean;
}

export function BreakpointIndicator({ isActive = true }: BreakpointIndicatorProps) {
  if (!isActive) {
    return null;
  }

  return (
    <div
      className="w-4 h-4 rounded-full bg-red-500 border border-red-600 shadow-sm"
      title="Breakpoint"
    />
  );
}

interface ExecutionStartPointIndicatorProps {
  isActive?: boolean;
}

export function ExecutionStartPointIndicator({
  isActive = true,
}: ExecutionStartPointIndicatorProps) {
  if (!isActive) {
    return null;
  }

  return (
    <div
      className="w-4 h-4 rounded-full bg-blue-500 border border-blue-600 shadow-sm"
      title="Execution Start Point"
    />
  );
}

function ExecutionStatusIndicatorInternal({ status, count }: { status?: string; count?: number }) {
  const isExecutedMultipleTimes = count !== undefined && count > 1;
  const color = getExecutionStatusColor(status);

  return (
    <>
      {isExecutedMultipleTimes && (
        <span className="text-sm pr-[2px]" style={{ color }}>
          {count}
        </span>
      )}
      <ExecutionStatusIcon status={status} />
    </>
  );
}

function PinnedOutputIndicator() {
  return (
    <ApTooltip content="Node output is mocked" placement="bottom">
      <span style={{ display: 'inline-flex' }}>
        <NodeIcon icon="pinned-output" size={16} color="var(--color-foreground-emp)" />
      </span>
    </ApTooltip>
  );
}

export const ExecutionStatusIndicator = memo(ExecutionStatusIndicatorInternal);

export function ValidationErrorIndicator({ message }: { message?: string }) {
  return (
    <ApTooltip content={message || 'Validation error'} placement="bottom">
      <span style={{ display: 'inline-flex' }}>
        <ApIcon name="error" size="16px" color="var(--uix-canvas-error-icon)" />
      </span>
    </ApTooltip>
  );
}

const getDefaultAdornments = (context: NodeStatusContext): NodeAdornments => {
  const executionState = context.executionState;

  const status = typeof executionState === 'object' ? executionState?.status : executionState;
  const count = typeof executionState === 'object' ? executionState.count : undefined;
  const hasBreakpoint = typeof executionState === 'object' && executionState?.debug;
  const isExecutionStartPoint =
    typeof executionState === 'object' && executionState?.isExecutionStartPoint;
  const isOutputPinned = typeof executionState === 'object' && executionState?.isOutputPinned;

  const hasValidationError =
    context.validationState?.validationStatus === ValidationErrorSeverity.ERROR ||
    context.validationState?.validationStatus === ValidationErrorSeverity.CRITICAL;

  return {
    topLeft: hasBreakpoint ? <BreakpointIndicator /> : undefined,
    topRight: !status && hasValidationError
      ? <ValidationErrorIndicator message={context.validationState?.validationError?.message} />
      : <ExecutionStatusIndicator status={status} count={count} />,
    bottomLeft: isExecutionStartPoint ? <ExecutionStartPointIndicator /> : undefined,
    bottomRight: isOutputPinned ? <PinnedOutputIndicator /> : undefined,
  };
};

export function resolveAdornments(context: NodeStatusContext) {
  // TODO: for now, always return default adornments
  return getDefaultAdornments(context);
}
