import { memo } from 'react';
import type { NodeMenuItem } from '../../../NodeContextMenu';
import type { StageNodeProps, StageTaskExecution, StageTaskItem } from '../../StageNode.types';
import { SortableTaskRow } from '../shared/SortableTaskRow';
import { AdhocTaskContent } from './AdhocTaskContent';

interface AdhocTaskRowInnerProps {
  task: StageTaskItem;
  taskExecution?: StageTaskExecution;
  isTaskLoading?: boolean;
  isReadOnly: boolean;
  selectedTaskId?: string;
  hasBuiltInTaskActions: boolean;
  isDragDisabled: boolean;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  onTaskPlay: StageNodeProps['onTaskPlay'];
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  getAdhocContextMenuItems: (task: StageTaskItem) => NodeMenuItem[];
}

const AdhocTaskRowInner = ({
  task,
  taskExecution,
  isTaskLoading,
  isReadOnly,
  selectedTaskId,
  hasBuiltInTaskActions,
  isDragDisabled,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  onTaskPlay,
  handleTaskClick,
  getAdhocContextMenuItems,
}: AdhocTaskRowInnerProps) => {
  // Consumer items (e.g. breakpoints) are allowed even in read-only/Debug view;
  // only the built-in edit actions are gated on !isReadOnly. When built-in actions
  // already guarantee a menu we skip the eager consumer call; otherwise we ask the
  // consumer whether it contributes any items.
  const hasMenu =
    (!isReadOnly && hasBuiltInTaskActions) ||
    (getTaskContextMenuItems?.({ task, taskGroupType: 'adhoc', isParallel: false })?.length ?? 0) >
      0;
  const row = (
    <AdhocTaskContent
      key={task.id}
      task={task}
      taskExecution={taskExecution}
      isSelected={selectedTaskId === task.id}
      onTaskClick={handleTaskClick}
      onTaskPlay={onTaskPlay}
      isTaskLoading={isTaskLoading}
      isReadOnly={isReadOnly}
      onToggleBreakpoint={isReadOnly ? onTaskBreakpointToggle : undefined}
      getContextMenuItems={hasMenu ? getAdhocContextMenuItems : undefined}
    />
  );

  // Sortable only where the section mounts a DndContext.
  return isDragDisabled ? (
    row
  ) : (
    <SortableTaskRow key={task.id} taskId={task.id}>
      {row}
    </SortableTaskRow>
  );
};

export const AdhocTaskRow = memo(AdhocTaskRowInner);
