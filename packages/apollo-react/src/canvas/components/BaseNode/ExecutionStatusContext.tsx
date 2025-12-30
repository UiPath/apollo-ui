import React from 'react';
import { useContext, useEffect, useState } from 'react';

export type NodeExecutionStatus = string;

export type NodeExecutionStatusWithCount = { status: NodeExecutionStatus; count: number };

export type NodeExecutionState = NodeExecutionStatusWithCount | NodeExecutionStatus;

export interface NodeStatusContext {
  nodeId: string;
  executionState?: NodeExecutionState;
  isHovered?: boolean;
  isConnecting?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
}

export interface ExecutionStateContextValue {
  getExecutionState: (nodeId: string) => NodeExecutionState | undefined;
}

export const ExecutionStatusContext = React.createContext<ExecutionStateContextValue>({
  getExecutionState: () => undefined,
});

export const useExecutionState = (nodeId: string): NodeExecutionState | undefined => {
  const context = useContext(ExecutionStatusContext);
  const [state, setState] = useState<NodeExecutionState | undefined>();

  useEffect(() => {
    setState(context.getExecutionState(nodeId));
  }, [nodeId, context]);

  return state;
};
