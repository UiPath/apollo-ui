import type { NodeProps } from "@xyflow/react";
import type { NodeMenuItem } from "../NodeContextMenu";

export type ProcessIconType = "process" | "verification" | "check" | "document" | "custom";

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
}

export interface StageNodeData extends Record<string, unknown> {
  label: string;
  tasks: StageTaskItem[][];
}

export interface StageNodeProps extends NodeProps {
  data: StageNodeData;
  addProcessLabel?: string;
  execution?: {
    stageStatus: StageStatus;
    stageStatusLabel?: string;
    taskStatus: Record<string, { status: StageTaskStatus; label: string; duration?: string; badge?: string }>;
  };
  menuItems?: NodeMenuItem[];
  onAddProcess?: () => void;
}
