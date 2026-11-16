import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Spacing } from '@uipath/apollo-core';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { type CSSProperties, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import {
  GroupModificationType,
  moveGroupDown,
  moveGroupUp,
} from '../../../utils/GroupModificationUtils';
import type { NodeMenuItem } from '../../NodeContextMenu';
import { useStageTaskDragAccessibility } from '../hooks/useStageTaskDragAccessibility';
import { useStageTaskDragHandler } from '../hooks/useStageTaskDragHandler';
import { useStageTaskSensors } from '../hooks/useStageTaskSensors';
import {
  StageItemsList,
  StageItemsSection,
  StageParallelBracket,
  StageParallelLabel,
  StageTaskGroupContainer,
} from '../StageNode.styles';
import type { StageNodeProps, StageTaskActivationEvent, StageTaskItem } from '../StageNode.types';
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
  handleTaskClick: (e: StageTaskActivationEvent, taskElementId: string) => void;
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
    onTaskClick,
    hideParallelOptions,
    loadingTaskIds,
    onTaskBreakpointToggle,
    getTaskContextMenuItems,
  } = props;
  const hasBuiltInTaskActions = !!(onReplaceTaskFromToolbox || onTaskGroupModification);
  const isDragDisabled = !onTaskReorder || isReadOnly;
  const isLabelOpenable = isDragDisabled && !!onTaskClick;
  const labels = useStageNodeLabels();

  const sequentialTaskIds = useMemo(
    () => sequentialTaskGroups.flat().map((task) => task.id),
    [sequentialTaskGroups]
  );

  const listRef = useRef<HTMLDivElement>(null);
  const focusedDragIdRef = useRef<string | undefined>(undefined);
  const taskToRefocusRef = useRef<string | undefined>(undefined);

  const commitDropReorder = useCallback(
    (newTasks: StageTaskItem[][]) => {
      taskToRefocusRef.current = focusedDragIdRef.current;
      handleReorderSequentialTasks(newTasks);
    },
    [handleReorderSequentialTasks]
  );

  const {
    activeTask,
    isActiveTaskParallel,
    handleDragStart,
    handleDragMove,
    handleDragEnd: handleTaskDragEnd,
    handleDragCancel,
  } = useStageTaskDragHandler({
    taskGroups: sequentialTaskGroups,
    onTaskReorder: commitDropReorder,
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const taskId = String(event.active.id);
      const hasFocus =
        document.activeElement instanceof HTMLElement &&
        document.activeElement.dataset.taskRowId === taskId;
      focusedDragIdRef.current = hasFocus ? taskId : undefined;
      handleTaskDragEnd(event);
    },
    [handleTaskDragEnd]
  );

  // A reorder can move the task's row under another parent, which remounts it and drops its focus.
  // biome-ignore lint/correctness/useExhaustiveDependencies: must run on each committed reorder
  useLayoutEffect(() => {
    const taskId = taskToRefocusRef.current;
    if (!taskId) {
      return;
    }
    taskToRefocusRef.current = undefined;
    if (document.activeElement !== document.body) {
      return;
    }
    const rows = listRef.current?.querySelectorAll<HTMLElement>('[data-task-row-id]') ?? [];
    Array.from(rows)
      .find((row) => row.dataset.taskRowId === taskId)
      ?.focus();
  }, [sequentialTaskGroups]);

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

  const sensors = useStageTaskSensors();
  const dragAccessibility = useStageTaskDragAccessibility();

  // Swallow the canvas drag/pan, and XYFlow's node keys (select, move, delete), so neither a
  // pointer nor a key on a task acts on the stage.
  const taskList = (
    <StageItemsList
      ref={listRef}
      data-testid={`sequential-tasks-list-${id}`}
      className="nodrag nopan nokey"
    >
      {sequentialTaskGroups.map((taskGroup, groupIndex) => {
        const isParallel = taskGroup.length > 1;
        // Keyed by its first task, not its position, so a reorder moves a moved task's row instead
        // of remounting it, which would drop the keyboard focus the task holds.
        return (
          <Row key={taskGroup[0]?.id ?? `group-${groupIndex}`} gap={Spacing.SpacingS}>
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
                    isLabelOpenable={isLabelOpenable}
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
          accessibility={dragAccessibility}
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
