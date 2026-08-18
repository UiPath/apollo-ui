import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { type CSSProperties, memo, useCallback, useMemo } from 'react';
import type { NodeMenuItem } from '../../NodeContextMenu';
import { useStageTaskDragHandler } from '../hooks/useStageTaskDragHandler';
import { StageItemsList, StageItemsSection } from '../StageNode.styles';
import type { StageNodeProps, StageTaskItem } from '../StageNode.types';
import { StageItemsHeaderTitle } from '../shared/StageItemsHeaderTitle';
import { useStageNodeLabels } from '../useStageNodeLabels';
import { EventDrivenTaskItem } from './EventDrivenTask';
import { SortableTaskRow } from './SortableTaskRow';
import { getDivider } from './StageNodeTaskUtilities';
import { StageTaskDragOverlay } from './StageTaskDragOverlay';

const StageNodeEventDrivenTaskGroupsInner = ({
  props,
  eventDrivenTaskGroups,
  isReadOnly,
  selectedTaskId,
  taskWidthStyle,
  handleTaskClick,
  handleReorderEventDrivenTasks,
  generateReplaceTaskMenuItemForTask,
  generateDeleteTaskMenuItemForTask,
}: {
  props: StageNodeProps;
  eventDrivenTaskGroups: StageTaskItem[][];
  isReadOnly: boolean;
  selectedTaskId?: string;
  taskWidthStyle?: CSSProperties;
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
  const hasBuiltInTaskActions = !!(onReplaceTaskFromToolbox || onTaskGroupModification);
  const labels = useStageNodeLabels();
  const isDragDisabled = !onTaskReorder || isReadOnly;
  const rows = useMemo(() => eventDrivenTaskGroups.flat(), [eventDrivenTaskGroups]);

  const rowIds = useMemo(() => rows.map((task) => task.id), [rows]);

  const { activeTask, handleDragStart, handleDragEnd, handleDragCancel } = useStageTaskDragHandler({
    taskGroups: eventDrivenTaskGroups,
    onTaskReorder: handleReorderEventDrivenTasks,
    // These rows never nest, so sideways travel must not create a parallel group.
    allowRegrouping: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

      const deleteTaskMenuItem = generateDeleteTaskMenuItemForTask(task.id);
      if (deleteTaskMenuItem) {
        if (items.length) {
          items.push(getDivider());
        }
        items.push(deleteTaskMenuItem);
      }

      return items;
    },
    [generateReplaceTaskMenuItemForTask, getTaskContextMenuItems, generateDeleteTaskMenuItemForTask]
  );

  // Swallow the canvas drag/pan only while these rows are drag handles.
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

        // Sortable only where the section mounts a DndContext.
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
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            {taskList}
          </SortableContext>
          {/* Neither flat section nests, so the dragged card never previews a parallel width. */}
          <StageTaskDragOverlay
            activeTask={activeTask}
            isActiveTaskParallel={false}
            taskWidthStyle={taskWidthStyle}
          />
        </DndContext>
      )}
    </StageItemsSection>
  );
};

export const StageNodeEventDrivenTaskGroups = memo(StageNodeEventDrivenTaskGroupsInner);
