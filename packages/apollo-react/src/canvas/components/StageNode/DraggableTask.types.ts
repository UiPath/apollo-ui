import type { NodeMenuItem } from '../NodeContextMenu';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';

export interface DraggableTaskProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isSelected: boolean;
  isParallel: boolean;
  groupIndex: number;
  taskIndex: number;
  getContextMenuItems?: (groupIndex: number, taskIndex: number) => NodeMenuItem[];
  onTaskClick: (e: React.MouseEvent, taskId: string) => void;
  onTaskPlay?: (taskId: string) => Promise<void>;
  isDragDisabled?: boolean;
  projectedDepth?: number;
}
