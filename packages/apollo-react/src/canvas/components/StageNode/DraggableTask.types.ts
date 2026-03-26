import type { NodeMenuItem } from '../NodeContextMenu';
import type { StageTaskExecution, StageTaskItem } from './StageNode.types';

export interface TaskContentProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isDragging?: boolean;
}

export interface DraggableTaskProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isSelected: boolean;
  isParallel: boolean;
  contextMenuItems: NodeMenuItem[];
  onTaskClick: (e: React.MouseEvent, taskId: string) => void;
  onMenuOpen?: () => void;
  onTaskPlay?: (taskId: string) => Promise<void>;
  isDragDisabled?: boolean;
  projectedDepth?: number;
  zoom?: number;
}
