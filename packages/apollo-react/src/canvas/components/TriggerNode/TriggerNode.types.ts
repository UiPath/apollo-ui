import type { NodeProps } from "@uipath/uix-xyflow/react";

enum ElementStatusValues {
  Cancelled = "Cancelled",
  Completed = "Completed",
  Failed = "Failed",
  InProgress = "InProgress",
  NotExecuted = "NotExecuted",
  Paused = "Paused",
  Terminated = "Terminated",
}

export type TriggerStatus = `${ElementStatusValues}`;

export interface TriggerNodeProps extends NodeProps {
  details: {
    tooltip?: string;
    icon?: React.ReactElement;
    status?: TriggerStatus;
  };
}
