import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import type { GroupModificationType } from '../../utils/GroupModificationUtils';
import type { NodeMenuItem } from '../NodeContextMenu';
import type { ListItem, ToolboxSearchHandler } from '../Toolbox';

enum ElementStatusValues {
  Cancelled = 'Cancelled',
  Completed = 'Completed',
  UserCancelled = 'UserCancelled',
  Failed = 'Failed',
  InProgress = 'InProgress',
  NotExecuted = 'NotExecuted',
  Paused = 'Paused',
  Terminated = 'Terminated',
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
  pendingReplaceTask?: {
    groupIndex: number;
    taskIndex: number;
  };
  stageDetails: {
    label: string;
    defaultContent?: string;
    icon?: React.ReactElement;
    sla?: string;
    slaBreached?: boolean;
    escalation?: string;
    escalationsTriggered?: boolean;
    isException?: boolean;
    isReadOnly?: boolean;
    tasks: StageTaskItem[][];
    selectedTasks?: string[];
  };
  addTaskLabel?: string;
  addTaskLoading?: boolean;
  replaceTaskLabel?: string;
  taskOptions?: ListItem[];
  execution?: {
    stageStatus: {
      status?: StageStatus;
      label?: string;
      duration?: string;
    };
    taskStatus: Record<string, StageTaskExecution>;
  };
  menuItems?: NodeMenuItem[];
  onStageClick?: () => void;
  onTaskAdd?: () => void;
  onAddTaskFromToolbox?: (taskItem: ListItem) => void;
  onTaskToolboxSearch?: ToolboxSearchHandler;
  onTaskClick?: (taskElementId: string) => void;
  onTaskGroupModification?: (
    groupModificationType: GroupModificationType,
    groupIndex: number,
    taskIndex: number
  ) => void;
  onStageTitleChange?: (newTitle: string) => void;
  onTaskReorder?: (reorderedTasks: StageTaskItem[][]) => void;
  onReplaceTaskFromToolbox?: (newTask: ListItem, groupIndex: number, taskIndex: number) => void;
}

export interface StageTaskExecution {
  status?: StageTaskStatus;
  message?: string;
  label?: string;
  duration?: string;
  retryDuration?: string;
  badge?: string;
  badgeStatus?: 'warning' | 'info' | 'error';
  retryCount?: number;
}
