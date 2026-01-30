import { NodeAdornments, NodeStatusContext } from '../components';

/**
 * Extended execution state that includes debug info (breakpoints)
 */
interface NodeExecutionStateWithDebug {
  status?: string;
  count: number;
  debug: boolean;
  isExecutionStartPoint?: boolean;
}

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

export function ExecutionStartPointIndicator({ isActive = true }: ExecutionStartPointIndicatorProps) {
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

import { ExecutionStatusIcon } from '@uipath/apollo-react/canvas';
import { memo } from 'react';
import { getExecutionStatusColor } from '../components/ExecutionStatusIcon/ExecutionStatusIcon';

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

export const ExecutionStatusIndicator = memo(ExecutionStatusIndicatorInternal);

const getDefaultAdornments = (context: NodeStatusContext): NodeAdornments => {
  const executionState = context.executionState as NodeExecutionStateWithDebug | string | undefined;

  const status = typeof executionState === 'object' ? executionState?.status : executionState;
  const count = typeof executionState === 'object' ? executionState.count : undefined;
  const hasBreakpoint = typeof executionState === 'object' && executionState?.debug;
  const isExecutionStartPoint = typeof executionState === 'object' && executionState?.isExecutionStartPoint;

  return {
    topLeft: hasBreakpoint ? <BreakpointIndicator /> : undefined,
    topRight: <ExecutionStatusIndicator status={status} count={count} />,
    bottomLeft: isExecutionStartPoint ? <ExecutionStartPointIndicator /> : undefined,
  };
};

export function resolveAdornments(context: NodeStatusContext) {
  // TODO: for now, always return default adornments
  return getDefaultAdornments(context);
}
