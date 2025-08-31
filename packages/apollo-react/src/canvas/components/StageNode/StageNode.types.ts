import type { NodeProps } from "@xyflow/react";
import type { NodeMenuItem } from "../NodeContextMenu";

enum ElementStatusValues {
  Cancelled = "Cancelled",
  Completed = "Completed",
  Failed = "Failed",
  InProgress = "InProgress",
  NotExecuted = "NotExecuted",
  Paused = "Paused",
  Terminated = "Terminated",
}

export type StageStatus = `${ElementStatusValues}`;
export type StageTaskStatus = `${ElementStatusValues}`;

export interface StageTaskItem {
  id: string;
  label: string;
  icon?: React.ReactElement;
}

export interface StageNodeProps extends NodeProps {
  stageDetails: {
    label: string;
    icon?: React.ReactElement;
    sla?: string;
    escalation?: string;
    isException?: boolean;
    tasks: StageTaskItem[][];
  };
  addTaskLabel?: string;
  execution?: {
    stageStatus: {
      status?: StageStatus;
      label?: string;
      duration?: string;
    };
    taskStatus: Record<string, { status?: StageTaskStatus; label?: string; duration?: string; badge?: string; retryCount?: number }>;
  };
  menuItems?: NodeMenuItem[];
  onAddTask?: () => void;
}
