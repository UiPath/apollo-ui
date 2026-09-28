import React, { useContext, useEffect, useState } from 'react';
import type { ExecutionState } from '../types/execution';

export interface ExecutionStateContextValue {
  getNodeExecutionState: (nodeId: string) => ExecutionState | undefined;
  getEdgeExecutionState: (edgeId: string, targetNodeId: string) => ExecutionState | undefined;
}

export const ExecutionStatusContext = React.createContext<ExecutionStateContextValue>({
  getNodeExecutionState: () => undefined,
  getEdgeExecutionState: () => undefined,
});

export const useNodeExecutionState = (nodeId: string): ExecutionState | undefined => {
  const context = useContext(ExecutionStatusContext);
  const [state, setState] = useState<ExecutionState | undefined>();

  useEffect(() => {
    setState(context.getNodeExecutionState(nodeId));
  }, [nodeId, context]);

  return state;
};

export const useEdgeExecutionState = (
  edgeId: string,
  targetNodeId: string
): ExecutionState | undefined => {
  const context = useContext(ExecutionStatusContext);
  const [state, setState] = useState<ExecutionState | undefined>();

  useEffect(() => {
    const executionState = context.getEdgeExecutionState(edgeId, targetNodeId);
    setState(executionState);
  }, [edgeId, targetNodeId, context]);

  return state;
};
