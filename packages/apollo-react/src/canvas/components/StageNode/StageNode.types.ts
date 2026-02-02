import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
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

/**
 * Props for StageNode when using React Flow TaskNodes as children.
 * Tasks are rendered as separate React Flow nodes with parentId pointing to the stage.
 * Positions are calculated based on order, not user drag position.
 */
export interface StageNodeProps extends NodeProps {
  dragging: boolean;
  selected: boolean;
  id: string;
  pendingReplaceTask?: {
    groupIndex: number;
    taskIndex: number;
  };
  /** The node type for this stage (e.g., "case-management:Stage") */
  nodeType?: string;
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
    /**
     * 2D array of task IDs (instead of task objects).
     * Inner arrays with length > 1 are parallel groups.
     * Tasks are rendered as separate React Flow nodes.
     */
    taskIds: string[][];
    selectedTasks?: string[];
  };
  execution?: {
    stageStatus: {
      status?: StageStatus;
      label?: string;
      duration?: string;
    };
    taskStatus: Record<string, StageTaskExecution>;
  };
  addTaskLabel?: string;
  addTaskLoading?: boolean;
  taskOptions?: ListItem[];
  menuItems?: NodeMenuItem[];
  onStageClick?: () => void;
  onTaskAdd?: () => void;
  onAddTaskFromToolbox?: (taskItem: ListItem) => void;
  onTaskToolboxSearch?: ToolboxSearchHandler;
  replaceTaskLabel?: string;
  onReplaceTaskFromToolbox?: (newTask: ListItem, groupIndex: number, taskIndex: number) => void;
  /**
   * External trigger to open the replace task toolbox.
   * Set by the consumer when a TaskNode requests replacement.
   */
  replaceTaskTarget?: { groupIndex: number; taskIndex: number } | null;
  /**
   * Called when the replace toolbox closes so the consumer can clear replaceTaskTarget.
   */
  onReplaceTaskTargetChange?: (target: { groupIndex: number; taskIndex: number } | null) => void;
  onTaskClick?: (taskId: string) => void;
  onTaskSelect?: (taskId: string) => void;
  onStageTitleChange?: (newTitle: string) => void;
  /**
   * Called when task order changes (reorder, cross-stage move, etc.)
   * @param newTaskIds - The new 2D array of task IDs
   */
  onTaskIdsChange?: (newTaskIds: string[][]) => void;
  /**
   * Called when a task is moved from another stage to this stage
   * @param taskId - The ID of the task being moved
   * @param sourceStageId - The ID of the source stage
   * @param position - The target position in the task array
   */
  onTaskMoveIn?: (
    taskId: string,
    sourceStageId: string,
    position: { groupIndex: number; taskIndex: number }
  ) => void;
  /**
   * Called when a task is copied from another stage to this stage
   * @param taskId - The ID of the original task
   * @param newTaskId - The ID for the copied task
   * @param sourceStageId - The ID of the source stage
   * @param position - The target position in the task array
   */
  onTaskCopyIn?: (
    taskId: string,
    newTaskId: string,
    sourceStageId: string,
    position: { groupIndex: number; taskIndex: number }
  ) => void;
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
