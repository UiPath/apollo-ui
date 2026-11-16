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
import { AdhocTasksList } from './AdhocTasksList';

interface StageNodeAdhocTaskGroupsInnerProps {
  id: string;
  taskExecutions?: StageNodeTaskExecutionsProps;
  loadingTaskIds?: ReadonlySet<string>;
  adhocTaskGroups: StageTaskItem[][];
  isReadOnly: boolean;
  selectedTaskId?: string;
  taskWidthStyle?: CSSProperties;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  onTaskGroupModification: StageNodeProps['onTaskGroupModification'];
  onTaskReorder: StageNodeProps['onTaskReorder'];
  onReplaceTaskFromToolbox: StageNodeProps['onReplaceTaskFromToolbox'];
  onTaskPlay: StageNodeProps['onTaskPlay'];
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  handleReorderAdhocTasks: (newTasks: StageTaskItem[][]) => void;
  generateReplaceTaskMenuItemForTask: (
    taskId: string,
    isParallel: boolean
  ) => NodeMenuItem | undefined;
  generateDeleteTaskMenuItemForTask: (taskId: string) => NodeMenuItem | undefined;
}

const StageNodeAdhocTaskGroupsInner = ({
  id,
  taskExecutions,
  loadingTaskIds,
  adhocTaskGroups,
  isReadOnly,
  selectedTaskId,
  taskWidthStyle,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  onTaskGroupModification,
  onTaskReorder,
  onReplaceTaskFromToolbox,
  onTaskPlay,
  handleTaskClick,
  handleReorderAdhocTasks,
  generateReplaceTaskMenuItemForTask,
  generateDeleteTaskMenuItemForTask,
}: StageNodeAdhocTaskGroupsInnerProps) => {
  const hasBuiltInTaskActions = !!(onReplaceTaskFromToolbox || onTaskGroupModification);
  const labels = useStageNodeLabels();
  const isDragDisabled = !onTaskReorder || isReadOnly;
  const rows = useMemo(() => adhocTaskGroups.flat(), [adhocTaskGroups]);

  const rowIds = useMemo(() => rows.map((task) => task.id), [rows]);

  const { activeTask, handleDragStart, handleDragEnd, handleDragCancel } = useStageTaskDragHandler({
    taskGroups: adhocTaskGroups,
    onTaskReorder: handleReorderAdhocTasks,
    // These rows never nest, so sideways travel must not create a parallel group.
    allowRegrouping: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (rows.length === 0) {
    return null;
  }

  const taskList = (
    <AdhocTasksList
      id={id}
      tasks={rows}
      taskExecutions={taskExecutions}
      loadingTaskIds={loadingTaskIds}
      isReadOnly={isReadOnly}
      selectedTaskId={selectedTaskId}
      hasBuiltInTaskActions={hasBuiltInTaskActions}
      isDragDisabled={isDragDisabled}
      onTaskBreakpointToggle={onTaskBreakpointToggle}
      getTaskContextMenuItems={getTaskContextMenuItems}
      onTaskPlay={onTaskPlay}
      handleTaskClick={handleTaskClick}
      generateReplaceTaskMenuItemForTask={generateReplaceTaskMenuItemForTask}
      generateDeleteTaskMenuItemForTask={generateDeleteTaskMenuItemForTask}
    />
  );

  return (
    <StageItemsSection>
      <StageItemsHeaderTitle title={labels.adhocTasks} testId={`adhoc-tasks-header-${id}`} />
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

export const StageNodeAdhocTaskGroups = memo(StageNodeAdhocTaskGroupsInner);
