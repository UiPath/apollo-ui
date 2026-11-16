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
import { type CSSProperties, memo, useMemo } from 'react';
import type { NodeMenuItem } from '../../../NodeContextMenu';
import { useStageTaskDragHandler } from '../../hooks/useStageTaskDragHandler';
import { StageItemsSection } from '../../StageNode.styles';
import type {
  StageNodeProps,
  StageNodeTaskExecutionsProps,
  StageTaskItem,
} from '../../StageNode.types';
import { StageItemsHeaderTitle } from '../../shared/StageItemsHeaderTitle';
import { useStageNodeLabels } from '../../useStageNodeLabels';
import { StageTaskDragOverlay } from '../shared/StageTaskDragOverlay';
import { SequentialTasksGroupLists } from './SequentialTasksGroupLists';

interface StageNodeSequentialTaskGroupsInnerProps {
  id: string;
  taskExecutions?: StageNodeTaskExecutionsProps;
  hideParallelOptions?: boolean;
  loadingTaskIds?: ReadonlySet<string>;
  sequentialTaskGroups: StageTaskItem[][];
  allTasks: StageTaskItem[][];
  isReadOnly: boolean;
  selectedTaskId?: string;
  taskWidthStyle?: CSSProperties;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  onTaskGroupModification: StageNodeProps['onTaskGroupModification'];
  onTaskReorder: StageNodeProps['onTaskReorder'];
  onReplaceTaskFromToolbox: StageNodeProps['onReplaceTaskFromToolbox'];
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  handleReorderSequentialTasks: (newTasks: StageTaskItem[][]) => void;
  generateReplaceTaskMenuItemForTask: (
    taskId: string,
    isParallel: boolean
  ) => NodeMenuItem | undefined;
}

export const StageNodeSequentialTaskGroupsInner = ({
  id,
  taskExecutions,
  hideParallelOptions,
  loadingTaskIds,
  sequentialTaskGroups,
  allTasks,
  isReadOnly,
  selectedTaskId,
  taskWidthStyle,
  onTaskGroupModification,
  onReplaceTaskFromToolbox,
  onTaskReorder,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  handleTaskClick,
  handleReorderSequentialTasks,
  generateReplaceTaskMenuItemForTask,
}: StageNodeSequentialTaskGroupsInnerProps) => {
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

  const taskList = (
    <SequentialTasksGroupLists
      id={id}
      sequentialTaskGroups={sequentialTaskGroups}
      allTasks={allTasks}
      taskExecutions={taskExecutions}
      loadingTaskIds={loadingTaskIds}
      hideParallelOptions={hideParallelOptions}
      onTaskBreakpointToggle={onTaskBreakpointToggle}
      getTaskContextMenuItems={getTaskContextMenuItems}
      onTaskGroupModification={onTaskGroupModification}
      onTaskReorder={onTaskReorder}
      isReadOnly={isReadOnly}
      hasBuiltInTaskActions={hasBuiltInTaskActions}
      isDragDisabled={isDragDisabled}
      selectedTaskId={selectedTaskId}
      handleTaskClick={handleTaskClick}
      handleReorderSequentialTasks={handleReorderSequentialTasks}
      generateReplaceTaskMenuItemForTask={generateReplaceTaskMenuItemForTask}
    />
  );

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

export const StageNodeSequentialTaskGroups = memo(StageNodeSequentialTaskGroupsInner);
