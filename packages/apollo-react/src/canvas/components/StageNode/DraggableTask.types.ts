import type { NodeMenuItem } from '../NodeContextMenu';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';

export interface DraggableTaskProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isSelected: boolean;
  isParallel: boolean;
  /** Receives the task so parents can pass one stable function to every item
   * instead of a per-task closure (which would defeat the memo). */
  getContextMenuItems?: (task: StageTaskItem) => NodeMenuItem[];
  onTaskClick: (e: React.MouseEvent, taskId: string) => void;
  onTaskPlay?: (taskId: string) => Promise<void>;
  isDragDisabled?: boolean;
  projectedDepth?: number;
  isTaskLoading?: boolean;
}
