import { type CSSProperties, memo, type RefObject, useMemo } from 'react';
import { useStageTasksByGroups } from '../hooks/useStageTasksByGroups';
import type {
  SectionState,
  StageNodeProps,
  StageNodeTaskExecutionsProps,
  StageTaskItem,
  TaskStateReference,
} from '../StageNode.types';
import { CollapsibleStageHeader } from '../shared/CollapsibleStageHeader';
import { StageNodeTaskGroupsList } from './StageNodeTaskGroupsList';
import { StageNodeTasksEmptyState } from './StageNodeTasksEmptyState';

interface StageNodeAllTaskGroupsInnerContentProps {
  id: string;
  tasks?: StageTaskItem[][];
  selectedTaskId?: string;
  taskExecutions?: StageNodeTaskExecutionsProps;
  defaultContentMessage?: string;
  hideParallelOptions?: boolean;
  loadingTaskIds?: ReadonlySet<string>;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  onTaskAdd: StageNodeProps['onTaskAdd'];
  onAddTaskFromToolbox: StageNodeProps['onAddTaskFromToolbox'];
  onTaskClick: StageNodeProps['onTaskClick'];
  onTaskGroupModification: StageNodeProps['onTaskGroupModification'];
  onTaskReorder: StageNodeProps['onTaskReorder'];
  onReplaceTaskFromToolbox: StageNodeProps['onReplaceTaskFromToolbox'];
  onTaskPlay: StageNodeProps['onTaskPlay'];
  isReadOnly: boolean;
  taskWidthStyle?: CSSProperties;
  taskStateReference: RefObject<TaskStateReference>;
  setSelectedNodeId: (nodeId: string) => void;
  handleTaskAddClick: (event: React.MouseEvent) => void;
  setIsReplacingTask: (isReplacingTask: boolean) => void;
}

const StageNodeAllTaskGroupsInnerContent = ({
  id,
  tasks,
  selectedTaskId,
  taskExecutions,
  defaultContentMessage,
  hideParallelOptions,
  loadingTaskIds,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  onTaskAdd,
  onAddTaskFromToolbox,
  onTaskClick,
  onTaskGroupModification,
  onTaskReorder,
  onReplaceTaskFromToolbox,
  onTaskPlay,
  isReadOnly,
  taskWidthStyle,
  taskStateReference,
  setSelectedNodeId,
  handleTaskAddClick,
  setIsReplacingTask,
}: StageNodeAllTaskGroupsInnerContentProps) => {
  const allTasks = useMemo(() => tasks || [], [tasks]);

  // Split tasks into separate sections
  const { sequentialTaskGroups, adhocTaskGroups, eventDrivenTaskGroups } =
    useStageTasksByGroups(allTasks);

  return (
    <>
      {sequentialTaskGroups.length === 0 &&
      adhocTaskGroups.length === 0 &&
      eventDrivenTaskGroups.length === 0 ? (
        <StageNodeTasksEmptyState
          id={id}
          defaultContentMessage={defaultContentMessage}
          onTaskAdd={onTaskAdd}
          onAddTaskFromToolbox={onAddTaskFromToolbox}
          isReadOnly={isReadOnly}
          handleTaskAddClick={handleTaskAddClick}
        />
      ) : (
        <StageNodeTaskGroupsList
          id={id}
          tasks={allTasks}
          selectedTaskId={selectedTaskId}
          taskExecutions={taskExecutions}
          hideParallelOptions={hideParallelOptions}
          loadingTaskIds={loadingTaskIds}
          onTaskBreakpointToggle={onTaskBreakpointToggle}
          getTaskContextMenuItems={getTaskContextMenuItems}
          onTaskClick={onTaskClick}
          onTaskGroupModification={onTaskGroupModification}
          onTaskReorder={onTaskReorder}
          onReplaceTaskFromToolbox={onReplaceTaskFromToolbox}
          onTaskPlay={onTaskPlay}
          isReadOnly={isReadOnly}
          taskWidthStyle={taskWidthStyle}
          taskStateReference={taskStateReference}
          setSelectedNodeId={setSelectedNodeId}
          setIsReplacingTask={setIsReplacingTask}
        />
      )}
    </>
  );
};

interface StageNodeAllTaskGroupsInnerProps {
  id: string;
  tasks?: StageTaskItem[][];
  selectedTaskId?: string;
  taskExecutions?: StageNodeTaskExecutionsProps;
  defaultContentMessage?: string;
  hideParallelOptions?: boolean;
  loadingTaskIds?: ReadonlySet<string>;
  tasksSectionState?: SectionState;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  onTaskAdd: StageNodeProps['onTaskAdd'];
  onAddTaskFromToolbox: StageNodeProps['onAddTaskFromToolbox'];
  onTaskClick: StageNodeProps['onTaskClick'];
  onTaskGroupModification: StageNodeProps['onTaskGroupModification'];
  onTaskReorder: StageNodeProps['onTaskReorder'];
  onReplaceTaskFromToolbox: StageNodeProps['onReplaceTaskFromToolbox'];
  onTaskPlay: StageNodeProps['onTaskPlay'];
  isReadOnly: boolean;
  taskWidthStyle?: CSSProperties;
  taskStateReference: RefObject<TaskStateReference>;
  setSelectedNodeId: (nodeId: string) => void;
  handleTaskAddClick: (event: React.MouseEvent) => void;
  setIsReplacingTask: (isReplacingTask: boolean) => void;
}

const StageNodeAllTaskGroupsInner = ({
  id,
  tasks,
  selectedTaskId,
  taskExecutions,
  defaultContentMessage,
  hideParallelOptions,
  loadingTaskIds,
  tasksSectionState,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  onTaskAdd,
  onAddTaskFromToolbox,
  onTaskClick,
  onTaskGroupModification,
  onTaskReorder,
  onReplaceTaskFromToolbox,
  onTaskPlay,
  isReadOnly,
  taskWidthStyle,
  taskStateReference,
  setSelectedNodeId,
  handleTaskAddClick,
  setIsReplacingTask,
}: StageNodeAllTaskGroupsInnerProps) => {
  const tasksContent = (
    <StageNodeAllTaskGroupsInnerContent
      id={id}
      tasks={tasks}
      selectedTaskId={selectedTaskId}
      taskExecutions={taskExecutions}
      defaultContentMessage={defaultContentMessage}
      hideParallelOptions={hideParallelOptions}
      loadingTaskIds={loadingTaskIds}
      onTaskBreakpointToggle={onTaskBreakpointToggle}
      getTaskContextMenuItems={getTaskContextMenuItems}
      onTaskAdd={onTaskAdd}
      onAddTaskFromToolbox={onAddTaskFromToolbox}
      onTaskClick={onTaskClick}
      onTaskGroupModification={onTaskGroupModification}
      onTaskReorder={onTaskReorder}
      onReplaceTaskFromToolbox={onReplaceTaskFromToolbox}
      onTaskPlay={onTaskPlay}
      isReadOnly={isReadOnly}
      taskWidthStyle={taskWidthStyle}
      taskStateReference={taskStateReference}
      setSelectedNodeId={setSelectedNodeId}
      handleTaskAddClick={handleTaskAddClick}
      setIsReplacingTask={setIsReplacingTask}
    />
  );

  if (!tasksSectionState) {
    // no need to include collapsible header
    return tasksContent;
  }

  return (
    <CollapsibleStageHeader
      isOpen={!tasksSectionState.isCollapsed}
      label="Tasks"
      testId={`tasks-header-${id}`}
      onToggle={tasksSectionState.onCollapsedToggle}
    >
      {tasksContent}
    </CollapsibleStageHeader>
  );
};

export const StageNodeAllTaskGroups = memo(StageNodeAllTaskGroupsInner);
