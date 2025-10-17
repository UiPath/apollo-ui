import type { NodeProps } from "@uipath/uix/xyflow/react";
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
  dragging: boolean;
  selected: boolean;
  id: string;
  stageDetails: {
    label: string;
    icon?: React.ReactElement;
    sla?: string;
    slaReached?: boolean;
    escalation?: string;
    escalationReached?: boolean;
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
    taskStatus: Record<string, StageTaskExecution>;
  };
  menuItems?: NodeMenuItem[];
  onTaskAdd?: () => void;
  onTaskClick?: (taskElementId: string) => void;
  onTaskGroupModification?: (groupModificationType: GroupModificationType, groupIndex: number, taskIndex: number) => void;
  onStageTitleChange?: (newTitle: string) => void;
}

export interface StageTaskExecution {
  status?: StageTaskStatus;
  message?: string;
  label?: string;
  duration?: string;
  retryDuration?: string;
  badge?: string;
  badgeStatus?: "warning" | "info" | "error";
  retryCount?: number;
}

export enum GroupModificationType {
  TASK_GROUP_UP = "task_group_up",
  TASK_GROUP_DOWN = "task_group_down",
  UNGROUP_ALL_TASKS = "ungroup_all_tasks",
  SPLIT_GROUP = "split_group",
  MERGE_GROUP_UP = "merge_group_up",
  MERGE_GROUP_DOWN = "merge_group_down",
  REMOVE_TASK = "remove_task",
  REMOVE_GROUP = "remove_group",
}
