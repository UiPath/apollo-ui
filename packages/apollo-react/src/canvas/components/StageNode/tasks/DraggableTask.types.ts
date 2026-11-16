import type { NodeMenuItem } from '../../NodeContextMenu';
import type {
  StageTaskActivationEvent,
  StageTaskExecution,
  StageTaskItem,
} from '../StageNode.types';

export interface DraggableTaskProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isSelected: boolean;
  isParallel: boolean;
  /** Receives the task so parents can pass one stable function to every item
   * instead of a per-task closure (which would defeat the memo). */
  getContextMenuItems?: (task: StageTaskItem) => NodeMenuItem[];
  onTaskClick: (e: StageTaskActivationEvent, taskId: string) => void;
  onTaskPlay?: (taskId: string) => Promise<void>;
  isDragDisabled?: boolean;
  /** The label is the keyboard control that opens the task. Set when no sortable row wraps the
   * card and the host handles task clicks. */
  isLabelOpenable?: boolean;
  isTaskLoading?: boolean;
  /** Read-only (Debug) view: the task's "⋮" button is dropped, right-click still opens the menu. */
  isReadOnly?: boolean;
  /** Makes the breakpoint gutter interactive. Passed only in the Debug view. */
  onToggleBreakpoint?: (taskId: string) => void;
}
