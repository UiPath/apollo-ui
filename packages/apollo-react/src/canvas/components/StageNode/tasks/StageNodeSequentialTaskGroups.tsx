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
import { Spacing } from '@uipath/apollo-core';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { type CSSProperties, useCallback, useMemo } from 'react';
import {
  GroupModificationType,
  moveGroupDown,
  moveGroupUp,
} from '../../../utils/GroupModificationUtils';
import type { NodeMenuItem } from '../../NodeContextMenu';
import { useStageTaskDragHandler } from '../hooks/useStageTaskDragHandler';
import {
  StageItemsList,
  StageItemsSection,
  StageParallelBracket,
  StageParallelLabel,
  StageTaskGroupContainer,
} from '../StageNode.styles';
import type { StageNodeProps, StageTaskItem } from '../StageNode.types';
import { StageItemsHeaderTitle } from '../shared/StageItemsHeaderTitle';
import { useStageNodeLabels } from '../useStageNodeLabels';
import { DraggableTask } from './DraggableTask';
import { getContextMenuItems, getDivider } from './StageNodeTaskUtilities';
import { StageTaskDragOverlay } from './StageTaskDragOverlay';

export const StageNodeSequentialTaskGroups = ({
  props,
  sequentialTaskGroups,
  allTasks,
  isReadOnly,
  selectedTaskId,
  taskWidthStyle,
  handleTaskClick,
  handleReorderSequentialTasks,
  generateReplaceTaskMenuItemForTask,
}: {
  props: StageNodeProps;
  sequentialTaskGroups: StageTaskItem[][];
  allTasks: StageTaskItem[][];
  isReadOnly: boolean;
  selectedTaskId?: string;
  taskWidthStyle?: CSSProperties;
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  handleReorderSequentialTasks: (newTasks: StageTaskItem[][]) => void;
  generateReplaceTaskMenuItemForTask: (
    taskId: string,
    isParallel: boolean
  ) => NodeMenuItem | undefined;
}) => {
  const {
    id,
    execution,
    onTaskGroupModification,
    onReplaceTaskFromToolbox,
    onTaskReorder,
    hideParallelOptions,
    loadingTaskIds,
    onTaskBreakpointToggle,
    getTaskContextMenuItems,
  } = props;
  const hasBuiltInTaskActions = !!(onReplaceTaskFromToolbox || onTaskGroupModification);
  const isDragDisabled = !onTaskReorder || isReadOnly;
  const labels = useStageNodeLabels();

  const sequentialTaskIds = useMemo(
    () => sequentialTaskGroups.flat().map((task) => task.id),
    [sequentialTaskGroups]
  );

  const {
    activeTask,
    isActiveTaskParallel,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  } = useStageTaskDragHandler({
    taskGroups: sequentialTaskGroups,
    onTaskReorder: handleReorderSequentialTasks,
  });

  const handleTaskRegroup = useCallback(
    (groupModificationType: GroupModificationType, groupIndex: number, taskIndex: number) => {
      if (
        onTaskReorder &&
        (groupModificationType === GroupModificationType.TASK_GROUP_UP ||
          groupModificationType === GroupModificationType.TASK_GROUP_DOWN)
      ) {
        const mover =
          groupModificationType === GroupModificationType.TASK_GROUP_UP
            ? moveGroupUp
            : moveGroupDown;
        const reordered = mover(sequentialTaskGroups, groupIndex, taskIndex);
        handleReorderSequentialTasks(reordered);
        return;
      }

      onTaskGroupModification?.(groupModificationType, groupIndex, taskIndex);
    },
    [onTaskReorder, handleReorderSequentialTasks, onTaskGroupModification, sequentialTaskGroups]
  );

  /** Lazily builds context menu items for a task. Called only when the menu opens,
   * avoiding object allocation on every render for every task, and shared as a single
   * stable reference across all tasks (per-task closures would defeat DraggableTask's memo). */
  const buildContextMenuItems = useCallback(
    (task: StageTaskItem) => {
      const groupIndex = sequentialTaskGroups.findIndex((group) =>
        group.some((t) => t.id === task.id)
      );
      const taskGroup = sequentialTaskGroups[groupIndex];
      if (!taskGroup) {
        return [];
      }
      const isParallel = taskGroup.length > 1;
      const items: NodeMenuItem[] = [];

      const replaceTaskMenuItem = generateReplaceTaskMenuItemForTask(task.id, isParallel);
      if (replaceTaskMenuItem) {
        items.push(replaceTaskMenuItem);
      }

      const additionalMenuItems =
        getTaskContextMenuItems?.({ task, taskGroupType: 'sequential', isParallel }) ?? [];
      items.push(...additionalMenuItems);

      let groupIndexInAllTasks: number | undefined;
      let taskIndexInAllTasks: number | undefined;
      for (const [allTasksGroupIndex, group] of allTasks.entries()) {
        for (const [allTasksTaskIndex, t] of group.entries()) {
          if (t.id === task.id) {
            groupIndexInAllTasks = allTasksGroupIndex;
            taskIndexInAllTasks = allTasksTaskIndex;
            break;
          }
        }
      }

      if (
        onTaskGroupModification &&
        groupIndexInAllTasks !== undefined &&
        taskIndexInAllTasks !== undefined
      ) {
        const reGroupOptions = getContextMenuItems({
          isParallelGroup: isParallel,
          groupIndex,
          tasksLength: sequentialTaskGroups.length,
          groupIndexInAllTasks,
          taskIndexInAllTasks,
          isAboveParallel: (sequentialTaskGroups[groupIndex - 1]?.length ?? 0) > 1,
          isBelowParallel: (sequentialTaskGroups[groupIndex + 1]?.length ?? 0) > 1,
          reGroupTaskFunction: handleTaskRegroup,
          hideParallelOptions,
          labels: labels.contextMenu,
        });
        return items.length > 0 ? [...items, getDivider(), ...reGroupOptions] : reGroupOptions;
      }

      return items;
    },
    [
      onTaskGroupModification,
      sequentialTaskGroups,
      hideParallelOptions,
      handleTaskRegroup,
      generateReplaceTaskMenuItemForTask,
      getTaskContextMenuItems,
      allTasks,
      labels.contextMenu,
    ]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Only reorderable rows swallow the canvas drag/pan; with reordering off the list is
  // ordinary card surface the node can be dragged by.
  const taskList = (
    <StageItemsList data-testid={`sequential-tasks-list-${id}`} className="nodrag nopan">
      {sequentialTaskGroups.map((taskGroup, groupIndex) => {
        const isParallel = taskGroup.length > 1;
        return (
          <Row key={`group-${groupIndex}`} gap={Spacing.SpacingS}>
            {isParallel && <StageParallelBracket />}
            <StageTaskGroupContainer isParallel={isParallel}>
              {isParallel && (
                <StageParallelLabel>
                  <span className="text-xs">{labels.parallel}</span>
                </StageParallelLabel>
              )}
              {taskGroup.map((task) => {
                const taskExecution = execution?.taskStatus?.[task.id];
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
                    isTaskLoading={loadingTaskIds?.has(task.id)}
                    isReadOnly={isReadOnly}
                    onToggleBreakpoint={isReadOnly ? onTaskBreakpointToggle : undefined}
                    getContextMenuItems={hasMenu ? buildContextMenuItems : undefined}
                  />
                );
              })}
            </StageTaskGroupContainer>
          </Row>
        );
      })}
    </StageItemsList>
  );

  if (sequentialTaskGroups.length === 0) {
    return null;
  }
  return (
    <StageItemsSection>
      <StageItemsHeaderTitle
        title={labels.sequentialTasks}
        testId={`sequential-tasks-header-${id}`}
      />
      {isDragDisabled ? (
        taskList
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={sequentialTaskIds} strategy={verticalListSortingStrategy}>
            {taskList}
          </SortableContext>
          <StageTaskDragOverlay
            activeTask={activeTask}
            isActiveTaskParallel={isActiveTaskParallel}
            taskWidthStyle={taskWidthStyle}
          />
        </DndContext>
      )}
    </StageItemsSection>
  );
};
