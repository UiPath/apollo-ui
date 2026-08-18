import { closestCenter, DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { memo, useCallback, useMemo } from 'react';
import type { NodeMenuItem } from '../../NodeContextMenu';
import { useStageFlatSectionReorder } from '../hooks/useStageFlatSectionReorder';
import { StageItemsList, StageItemsSection } from '../StageNode.styles';
import type { StageNodeProps, StageTaskItem } from '../StageNode.types';
import { StageItemsHeaderTitle } from '../shared/StageItemsHeaderTitle';
import { useStageNodeLabels } from '../useStageNodeLabels';
import { EventDrivenTaskItem } from './EventDrivenTask';
import { SortableTaskRow } from './SortableTaskRow';
import { getDivider } from './StageNodeTaskUtilities';

const StageNodeEventDrivenTaskGroupsInner = ({
  props,
  eventDrivenTaskGroups,
  isReadOnly,
  selectedTaskId,
  handleTaskClick,
  handleReorderEventDrivenTasks,
  generateReplaceTaskMenuItemForTask,
  generateDeleteTaskMenuItemForTask,
}: {
  props: StageNodeProps;
  eventDrivenTaskGroups: StageTaskItem[][];
  isReadOnly: boolean;
  selectedTaskId?: string;
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  handleReorderEventDrivenTasks: (newTasks: StageTaskItem[][]) => void;
  generateReplaceTaskMenuItemForTask: (
    taskId: string,
    isParallel: boolean
  ) => NodeMenuItem | undefined;
  generateDeleteTaskMenuItemForTask: (taskId: string) => NodeMenuItem | undefined;
}) => {
  const {
    id,
    execution,
    onTaskGroupModification,
    onReplaceTaskFromToolbox,
    onTaskReorder,
    loadingTaskIds,
    onTaskBreakpointToggle,
    getTaskContextMenuItems,
  } = props;
  // Reordering counts as a built-in action: the move items are the keyboard/menu route to it, so
  // a consumer that supplies only `onTaskReorder` must still get a menu to reach them.
  const hasBuiltInTaskActions = !!(
    onReplaceTaskFromToolbox ||
    onTaskGroupModification ||
    onTaskReorder
  );
  const labels = useStageNodeLabels();
  const isDragDisabled = !onTaskReorder || isReadOnly;
  // The section draws one row per task; grouping only matters to the reorder maths.
  const rows = useMemo(() => eventDrivenTaskGroups.flat(), [eventDrivenTaskGroups]);

  const { taskIds, sensors, handleDragEnd, getMoveMenuItems } = useStageFlatSectionReorder({
    taskGroups: eventDrivenTaskGroups,
    isDragDisabled,
    onReorder: handleReorderEventDrivenTasks,
  });

  /** Lazily builds context menu items for a task. Called only when the menu opens,
   * avoiding object allocation on every render for every task. */
  const getEventDrivenContextMenuItems = useCallback(
    (task: StageTaskItem): NodeMenuItem[] => {
      const items: NodeMenuItem[] = [];

      const replaceTaskMenuItem = generateReplaceTaskMenuItemForTask(task.id, false);
      if (replaceTaskMenuItem) {
        items.push(replaceTaskMenuItem);
      }

      const additionalMenuItems =
        getTaskContextMenuItems?.({ task, taskGroupType: 'event-driven', isParallel: false }) ?? [];
      items.push(...additionalMenuItems);

      const moveMenuItems = getMoveMenuItems(task);
      if (moveMenuItems.length) {
        if (items.length) {
          items.push(getDivider());
        }
        items.push(...moveMenuItems);
      }

      const deleteTaskMenuItem = generateDeleteTaskMenuItemForTask(task.id);
      if (deleteTaskMenuItem) {
        if (items.length) {
          items.push(getDivider());
        }
        items.push(deleteTaskMenuItem);
      }

      return items;
    },
    [
      generateReplaceTaskMenuItemForTask,
      getTaskContextMenuItems,
      generateDeleteTaskMenuItemForTask,
      getMoveMenuItems,
    ]
  );

  // Only reorderable rows swallow the canvas drag/pan; with reordering off the list is
  // ordinary card surface the node can be dragged by, exactly as before.
  const taskList = (
    <StageItemsList
      data-testid={`event-driven-tasks-list-${id}`}
      className={isDragDisabled ? undefined : 'nodrag nopan'}
    >
      {rows.map((task) => {
        const taskExecution = execution?.taskStatus?.[task.id];
        // Consumer items (e.g. breakpoints) are allowed even in read-only/Debug view;
        // only the built-in edit actions are gated on !isReadOnly. When built-in actions
        // already guarantee a menu we skip the eager consumer call; otherwise we ask the
        // consumer whether it contributes any items.
        const hasMenu =
          (!isReadOnly && hasBuiltInTaskActions) ||
          (getTaskContextMenuItems?.({
            task,
            taskGroupType: 'event-driven',
            isParallel: false,
          })?.length ?? 0) > 0;
        const row = (
          <EventDrivenTaskItem
            key={task.id}
            task={task}
            taskExecution={taskExecution}
            isSelected={selectedTaskId === task.id}
            onTaskClick={handleTaskClick}
            isTaskLoading={loadingTaskIds?.has(task.id)}
            isReadOnly={isReadOnly}
            onToggleBreakpoint={isReadOnly ? onTaskBreakpointToggle : undefined}
            getContextMenuItems={hasMenu ? getEventDrivenContextMenuItems : undefined}
          />
        );

        // Sortable only where the section mounts a DndContext — a read-only section
        // renders the row bare so useSortable never runs outside its provider.
        return isDragDisabled ? (
          row
        ) : (
          <SortableTaskRow key={task.id} taskId={task.id}>
            {row}
          </SortableTaskRow>
        );
      })}
    </StageItemsList>
  );

  if (rows.length === 0) {
    return null;
  }
  return (
    <StageItemsSection>
      <StageItemsHeaderTitle
        title={labels.eventDrivenTasks}
        testId={`event-driven-tasks-header-${id}`}
      />
      {isDragDisabled ? (
        taskList
      ) : (
        <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {taskList}
          </SortableContext>
        </DndContext>
      )}
    </StageItemsSection>
  );
};

export const StageNodeEventDrivenTaskGroups = memo(StageNodeEventDrivenTaskGroupsInner);
