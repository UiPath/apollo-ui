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
} from '../../utils/GroupModificationUtils';
import type { NodeMenuItem } from '../NodeContextMenu';
import { DraggableTask } from './DraggableTask';
import { useStageTaskDragHandler } from './hooks/useStageTaskDragHandler';
import {
  StageAdditionalTasksHeaderSection,
  StageAdditionalTasksSection,
  StageParallelBracket,
  StageParallelLabel,
  StageTaskGroupContainer,
  StageTaskList,
} from './StageNode.styles';
import type { StageNodeProps, StageTaskGroup, StageTaskItem } from './StageNode.types';
import { getContextMenuItems, getDivider } from './StageNodeTaskUtilities';
import { StageTaskDragOverlay } from './StageTaskDragOverlay';
import { useStageNodeLabels } from './useStageNodeLabels';

export const StageNodeSequentialTaskGroups = ({
  props,
  sequentialTaskGroups,
  sequentialTasks,
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
  sequentialTasks: StageTaskGroup[];
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
    execution,
    onTaskGroupModification,
    onReplaceTaskFromToolbox,
    onTaskReorder,
    hideParallelOptions,
    loadingTaskIds,
    getTaskContextMenuItems,
  } = props;
  const hasBuiltInTaskActions = !!(onReplaceTaskFromToolbox || onTaskGroupModification);
  const labels = useStageNodeLabels();

  const sequentialTaskIds = useMemo(
    () => sequentialTasks.map(({ task }) => task.id),
    [sequentialTasks]
  );

  const {
    activeDragId,
    activeSequentialTask,
    isActiveTaskParallel,
    projected,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useStageTaskDragHandler({
    sequentialTaskGroups,
    sequentialTasks,
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

  if (sequentialTaskGroups.length === 0) {
    return null;
  }
  return (
    <StageAdditionalTasksSection>
      <StageAdditionalTasksHeaderSection>
        <span className="text-xs font-bold text-foreground-muted">{labels.sequentialTasks}</span>
      </StageAdditionalTasksHeaderSection>
      <DndContext
        collisionDetection={closestCenter}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={sequentialTaskIds} strategy={verticalListSortingStrategy}>
          {/* Disable dragging and panning the canvas when dragging a task */}
          <StageTaskList className="nodrag nopan">
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
                          projectedDepth={
                            task.id === activeDragId && projected ? projected.depth : undefined
                          }
                          isDragDisabled={!onTaskReorder || isReadOnly}
                          isTaskLoading={loadingTaskIds?.has(task.id)}
                          getContextMenuItems={hasMenu ? buildContextMenuItems : undefined}
                        />
                      );
                    })}
                  </StageTaskGroupContainer>
                </Row>
              );
            })}
          </StageTaskList>
        </SortableContext>
        <StageTaskDragOverlay
          activeTask={activeSequentialTask?.task}
          isActiveTaskParallel={isActiveTaskParallel}
          taskWidthStyle={taskWidthStyle}
        />
      </DndContext>
    </StageAdditionalTasksSection>
  );
};
