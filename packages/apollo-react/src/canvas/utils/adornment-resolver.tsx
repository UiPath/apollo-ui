import { CanvasIcon, ExecutionStatusIcon } from '@uipath/apollo-react/canvas';
import { memo } from 'react';
import type { NodeAdornments, NodeStatusContext } from '../components';
import { CanvasTooltip } from '../components/CanvasTooltip';
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

function SquareDashedIndicator() {
  return (
    <CanvasTooltip content="Node output is mocked" placement="bottom">
      <span style={{ display: 'inline-flex' }}>
        <CanvasIcon icon="square-dashed" size={16} color="var(--color-foreground-emp)" />
      </span>
    </CanvasTooltip>
  );
}

export const ExecutionStatusIndicator = memo(ExecutionStatusIndicatorInternal);

export function ValidationErrorIndicator({ message }: { message?: string }) {
  return (
    <CanvasTooltip content={message || 'Validation error'} placement="bottom">
      <span style={{ display: 'inline-flex' }}>
        <CanvasIcon icon="circle-alert" size={16} color="var(--canvas-error-icon)" />
      </span>
    </CanvasTooltip>
  );
}

export function ValidationWarningIndicator({ message }: { message?: string }) {
  return (
    <CanvasTooltip content={message || 'Validation warning'} placement="bottom">
      <span style={{ display: 'inline-flex' }}>
        <CanvasIcon icon="triangle-alert" size={16} color="var(--canvas-warning-icon)" />
      </span>
    </CanvasTooltip>
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

  const hasValidationWarning =
    context.validationState?.validationStatus === ValidationErrorSeverity.WARNING;

  const getTopRight = () => {
    // An active execution status (anything other than 'None') takes priority
    if (status && status !== 'None')
      return <ExecutionStatusIndicator status={status} count={count} />;
    if (hasValidationError)
      return (
        <ValidationErrorIndicator message={context.validationState?.validationError?.message} />
      );
    if (hasValidationWarning)
      return (
        <ValidationWarningIndicator message={context.validationState?.validationError?.message} />
      );
    return undefined;
  };

  return {
    topLeft: hasBreakpoint ? <BreakpointIndicator /> : undefined,
    topRight: getTopRight(),
    bottomLeft: isExecutionStartPoint ? <ExecutionStartPointIndicator /> : undefined,
    bottomRight: isOutputPinned ? <SquareDashedIndicator /> : undefined,
  };
};

export function resolveAdornments(context: NodeStatusContext) {
  // TODO: for now, always return default adornments
  return getDefaultAdornments(context);
}
