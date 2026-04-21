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
  Warning = 'Warning',
}

export type StageStatus = `${ElementStatusValues}`;
export type StageTaskStatus = `${ElementStatusValues}`;

export interface StageTaskItem {
  id: string;
  label: string;
  icon?: React.ReactElement;
  isAdhoc?: boolean;
  taskGroupType?: 'sequential' | 'event-driven' | 'adhoc';
  hasEntryCondition?: boolean;
}

export enum StageHeaderChipType {
  Entry = 'entry',
  Exit = 'exit',
  ReturnToOrigin = 'returnToOrigin',
  CaseExit = 'caseExit',
  CaseCompletion = 'caseCompletion',
}

export interface StageHeaderChip {
  type: StageHeaderChipType;
  count?: number;
  tooltip?: React.ReactNode;
  onClick?: () => void;
}

export interface StageNodeBaseProps {
  pendingReplaceTask?: boolean;
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
    selectedTaskId?: string;
    headerChips?: StageHeaderChip[];
  };
  addTaskLabel?: string;
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
  onTaskPlay?: (taskId: string) => Promise<void>;
  hideParallelOptions?: boolean;
  loadingTaskIds?: ReadonlySet<string>;
}

export interface StageNodeCanvasProps extends NodeProps, StageNodeBaseProps {}
export type StageNodeProps = StageNodeBaseProps &
  Pick<NodeProps, 'id' | 'selected' | 'dragging' | 'width'>;

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

export interface StageTaskDragOverlayProps {
  activeTask: StageTaskItem | undefined;
  isActiveTaskParallel: boolean;
  taskWidthStyle: React.CSSProperties | undefined;
}

export interface TaskStateReference {
  isParallel: boolean;
  groupIndex: number;
  taskIndex: number;
}

export interface StageTaskGroup {
  task: StageTaskItem;
  groupIndex: number;
  taskIndex: number;
}
