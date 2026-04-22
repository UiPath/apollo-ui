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
import { CSSProperties, useCallback, useMemo } from 'react';
import {
  GroupModificationType,
  moveGroupDown,
  moveGroupUp,
} from '../../utils/GroupModificationUtils';
import type { NodeMenuItem } from '../NodeContextMenu';
import { DraggableTask } from './DraggableTask';
import { useStageTaskDragHandler } from './hooks/useStageTaskDragHandler';
import {
  StageParallelBracket,
  StageParallelLabel,
  StageTaskGroupContainer,
  StageTaskList,
} from './StageNode.styles';
import type { StageNodeProps, StageTaskGroup, StageTaskItem } from './StageNode.types';
import { getContextMenuItems, getDivider } from './StageNodeTaskUtilities';
import { StageTaskDragOverlay } from './StageTaskDragOverlay';

export const StageNodeSequentialTaskGroups = ({
  props,
  sequentialTaskGroups,
  sequentialTasks,
  allTasks,
  isReadOnly,
  selectedTaskId,
  taskWidthStyle,
  hasContextMenu,
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
  hasContextMenu: boolean;
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  handleReorderSequentialTasks: (newTasks: StageTaskItem[][]) => void;
  generateReplaceTaskMenuItemForTask: (
    taskId: string,
    isParallel: boolean
  ) => NodeMenuItem | undefined;
}) => {
  const { execution, onTaskGroupModification, onTaskReorder, hideParallelOptions, loadingTaskIds } =
    props;

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
   * avoiding object allocation on every render for every task. */
  const buildContextMenuItems = useCallback(
    (groupIndex: number, _: number, taskId: string) => {
      const taskGroup = sequentialTaskGroups[groupIndex] ?? [];
      const isParallel = taskGroup.length > 1;
      const items: NodeMenuItem[] = [];

      const replaceTaskMenuItem = generateReplaceTaskMenuItemForTask(taskId, isParallel);
      if (replaceTaskMenuItem) {
        items.push(replaceTaskMenuItem);
        items.push(getDivider());
      }
      let groupIndexInAllTasks: number | undefined;
      let taskIndexInAllTasks: number | undefined;
      for (const [allTasksGroupIndex, group] of allTasks.entries()) {
        for (const [allTasksTaskIndex, task] of group.entries()) {
          if (task.id === taskId) {
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
        });
        return [...items, ...reGroupOptions];
      }

      return items;
    },
    [
      onTaskGroupModification,
      sequentialTaskGroups,
      hideParallelOptions,
      handleTaskRegroup,
      generateReplaceTaskMenuItemForTask,
      allTasks,
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
                      <span className="text-xs">Parallel</span>
                    </StageParallelLabel>
                  )}
                  {taskGroup.map((task, taskIndex) => {
                    const taskExecution = execution?.taskStatus?.[task.id];
                    return (
                      <DraggableTask
                        key={task.id}
                        task={task}
                        taskExecution={taskExecution}
                        isSelected={selectedTaskId === task.id}
                        isParallel={isParallel}
                        groupIndex={groupIndex}
                        taskIndex={taskIndex}
                        onTaskClick={handleTaskClick}
                        projectedDepth={
                          task.id === activeDragId && projected ? projected.depth : undefined
                        }
                        isDragDisabled={!onTaskReorder || isReadOnly}
                        isTaskLoading={loadingTaskIds?.has(task.id)}
                        {...(hasContextMenu &&
                          !isReadOnly && {
                            getContextMenuItems: buildContextMenuItems,
                          })}
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
  );
};
