import { memo, type RefObject, useMemo } from 'react';
import { INDENTATION_WIDTH, STAGE_CONTENT_INSET, StageContainer } from './StageNode.styles';
import type {
  StageNodeDetailsProps,
  StageNodeExecutionProps,
  StageNodeProps,
  StageTaskItem,
  TaskStateReference,
} from './StageNode.types';
import { StageNodeContent } from './stage-content/StageNodeContent';
import { StageNodeHeader } from './stage-header/StageNodeHeader';

interface StageNodeContentContainerInnerProps {
  id: string;
  width?: number;
  allTasks: StageTaskItem[][];
  stageDetails: StageNodeDetailsProps;
  selectedTaskId?: string;
  execution?: StageNodeExecutionProps;
  hideParallelOptions?: boolean;
  loadingTaskIds?: ReadonlySet<string>;
  isSelected: boolean;
  isReadOnly: boolean;
  taskStateReference: RefObject<TaskStateReference>;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  onTaskAdd: StageNodeProps['onTaskAdd'];
  onAddTaskFromToolbox: StageNodeProps['onAddTaskFromToolbox'];
  onTaskClick: StageNodeProps['onTaskClick'];
  onTaskGroupModification: StageNodeProps['onTaskGroupModification'];
  onTaskReorder: StageNodeProps['onTaskReorder'];
  onReplaceTaskFromToolbox: StageNodeProps['onReplaceTaskFromToolbox'];
  onTaskPlay: StageNodeProps['onTaskPlay'];
  onStatusClick: StageNodeProps['onStatusClick'];
  onStageTitleChange: StageNodeProps['onStageTitleChange'];
  setSelectedNodeId: (nodeId: string) => void;
  handleTaskAddClick: (event: React.MouseEvent) => void;
  setIsReplacingTask: (isReplacingTask: boolean) => void;
}

const StageNodeContentContainerInner = ({
  id,
  width,
  allTasks,
  stageDetails,
  selectedTaskId,
  execution,
  hideParallelOptions,
  loadingTaskIds,
  isSelected,
  isReadOnly,
  taskStateReference,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  onTaskAdd,
  onAddTaskFromToolbox,
  onTaskClick,
  onTaskGroupModification,
  onTaskReorder,
  onReplaceTaskFromToolbox,
  onTaskPlay,
  onStatusClick,
  onStageTitleChange,
  setSelectedNodeId,
  handleTaskAddClick,
  setIsReplacingTask,
}: StageNodeContentContainerInnerProps) => {
  const taskWidth = width ? width - STAGE_CONTENT_INSET : undefined;

  const isException = stageDetails?.isException;
  const status = execution?.stageStatus?.status;

  const taskWidthStyle = useMemo(
    () =>
      taskWidth
        ? ({
            '--stage-task-width': `${taskWidth}px`,
            '--stage-task-width-parallel': `${taskWidth - INDENTATION_WIDTH}px`,
          } as React.CSSProperties)
        : undefined,
    [taskWidth]
  );

  return (
    <StageContainer selected={isSelected} status={status} width={width} style={taskWidthStyle}>
      <StageNodeHeader
        id={id}
        stageLabel={stageDetails.label}
        stageIcon={stageDetails.icon}
        headerChips={stageDetails.headerChips}
        stageStatus={execution?.stageStatus}
        loadingTaskIds={loadingTaskIds}
        isReadOnly={isReadOnly}
        isException={isException}
        status={status}
        onStatusClick={onStatusClick}
        onTaskAdd={onTaskAdd}
        onAddTaskFromToolbox={onAddTaskFromToolbox}
        onStageTitleChange={onStageTitleChange}
        handleTaskAddClick={handleTaskAddClick}
      />
      <StageNodeContent
        id={id}
        stageDetails={stageDetails}
        tasks={allTasks}
        execution={execution}
        onTaskAdd={onTaskAdd}
        onAddTaskFromToolbox={onAddTaskFromToolbox}
        onTaskClick={onTaskClick}
        onTaskGroupModification={onTaskGroupModification}
        onTaskReorder={onTaskReorder}
        onReplaceTaskFromToolbox={onReplaceTaskFromToolbox}
        isReadOnly={isReadOnly}
        taskWidthStyle={taskWidthStyle}
        taskStateReference={taskStateReference}
        hideParallelOptions={hideParallelOptions}
        selectedTaskId={selectedTaskId}
        loadingTaskIds={loadingTaskIds}
        setSelectedNodeId={setSelectedNodeId}
        handleTaskAddClick={handleTaskAddClick}
        setIsReplacingTask={setIsReplacingTask}
        onTaskBreakpointToggle={onTaskBreakpointToggle}
        getTaskContextMenuItems={getTaskContextMenuItems}
        onTaskPlay={onTaskPlay}
      />
    </StageContainer>
  );
};

export const StageNodeContentContainer = memo(StageNodeContentContainerInner);
