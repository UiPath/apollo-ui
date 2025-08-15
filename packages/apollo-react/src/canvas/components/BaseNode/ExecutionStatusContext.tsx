import React from "react";
import { useContext, useEffect, useState } from "react";

export type NodeExecutionStatus = string;

export interface NodeStatusContext {
  nodeId: string;
  executionStatus?: NodeExecutionStatus;
  isHovered?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
}

export interface ExecutionStatusContextValue {
  getExecutionStatus: (nodeId: string) => NodeExecutionStatus | undefined;
}

export const ExecutionStatusContext = React.createContext<ExecutionStatusContextValue>({
  getExecutionStatus: () => undefined,
});

export const useExecutionStatus = (nodeId: string): NodeExecutionStatus | undefined => {
  const context = useContext(ExecutionStatusContext);
  const [status, setStatus] = useState<NodeExecutionStatus | undefined>();

  useEffect(() => {
    // Get initial status
    const initialStatus = context.getExecutionStatus(nodeId);
    setStatus(initialStatus);

    // You might want to set up polling or websocket subscription here
    const interval = setInterval(() => {
      const currentStatus = context.getExecutionStatus(nodeId);
      setStatus(currentStatus);
    }, 1000); // Poll every second

    return () => clearInterval(interval);
  }, [nodeId, context]);

  return status;
};
