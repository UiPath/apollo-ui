import { memo } from 'react';
import type { NodeMenuItem } from '../../../NodeContextMenu';
import type { StageNodeProps, StageTaskExecution, StageTaskItem } from '../../StageNode.types';
import { DraggableTask } from '../shared/DraggableTask';

interface SequentialTaskRowInnerProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isTaskLoading?: boolean;
  isParallel: boolean;
  isReadOnly: boolean;
  selectedTaskId?: string;
  hasBuiltInTaskActions: boolean;
  isDragDisabled: boolean;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  getSequentialContextMenuItems: (task: StageTaskItem) => NodeMenuItem[];
}

export const SequentialTaskRowInner = ({
  task,
  taskExecution,
  isTaskLoading,
  isParallel,
  isReadOnly,
  selectedTaskId,
  hasBuiltInTaskActions,
  isDragDisabled,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  handleTaskClick,
  getSequentialContextMenuItems,
}: SequentialTaskRowInnerProps) => {
  // Consumer items (e.g. breakpoints) are allowed even in read-only/Debug
  // view; only the built-in edit actions are gated on !isReadOnly. When
  // built-in actions already guarantee a menu we skip the eager consumer
  // call; otherwise we ask the consumer whether it contributes any items.
  const hasMenu =
    (!isReadOnly && hasBuiltInTaskActions) ||
    (getTaskContextMenuItems?.({
      task,
      taskGroupType: 'sequential',
      isParallel,
    })?.length ?? 0) > 0;
  return (
    <DraggableTask
      key={task.id}
      task={task}
      taskExecution={taskExecution}
      isSelected={selectedTaskId === task.id}
      isParallel={isParallel}
      onTaskClick={handleTaskClick}
      isDragDisabled={isDragDisabled}
      isTaskLoading={isTaskLoading}
      isReadOnly={isReadOnly}
      onToggleBreakpoint={isReadOnly ? onTaskBreakpointToggle : undefined}
      getContextMenuItems={hasMenu ? getSequentialContextMenuItems : undefined}
    />
  );
};

export const SequentialTaskRow = memo(SequentialTaskRowInner);
