import React, { useContext, useMemo } from 'react';
import type { ExecutionState } from '../types/execution';

export interface ExecutionStateContextValue {
  getNodeExecutionState: (nodeId: string) => ExecutionState | undefined;
  getEdgeExecutionState: (edgeId: string, targetNodeId: string) => ExecutionState | undefined;
}

export const ExecutionStatusContext = React.createContext<ExecutionStateContextValue>({
  getNodeExecutionState: () => undefined,
  getEdgeExecutionState: () => undefined,
});

// These hooks read the getter during render (memoized on context identity)
// instead of the previous setState-in-effect pattern. Same update semantics —
// providers publish changes by swapping the context value — but the state is
// available on the FIRST render and each update costs one render per node
// instead of two (context render + setState re-render). At 500 nodes that
// halves the render work per execution tick.

export const useNodeExecutionState = (nodeId: string): ExecutionState | undefined => {
  const context = useContext(ExecutionStatusContext);
  return useMemo(() => context.getNodeExecutionState(nodeId), [nodeId, context]);
};

export const useEdgeExecutionState = (
  edgeId: string,
  targetNodeId: string
): ExecutionState | undefined => {
  const context = useContext(ExecutionStatusContext);
  return useMemo(
    () => context.getEdgeExecutionState(edgeId, targetNodeId),
    [edgeId, targetNodeId, context]
  );
};
