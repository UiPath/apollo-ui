import { Spacing } from '@uipath/apollo-core';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import { memo, type RefObject } from 'react';
import { CompletionRulesContainer } from '../rules/CompletionRulesContainer';
import { EntryRulesContainer } from '../rules/EntryRulesContainer';
import { ExitRulesContainer } from '../rules/ExitRulesContainer';
import { StageContent } from '../StageNode.styles';
import type {
  StageNodeDetailsProps,
  StageNodeExecutionProps,
  StageNodeProps,
  StageTaskItem,
  TaskStateReference,
} from '../StageNode.types';
import { StageNodeAllTaskGroups } from '../tasks/StageNodeAllTaskGroups';

interface StageNodeContentInnerProps {
  id: string;
  stageDetails: StageNodeDetailsProps;
  tasks: StageTaskItem[][];
  selectedTaskId?: string;
  execution?: StageNodeExecutionProps;
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
  taskWidthStyle?: React.CSSProperties;
  taskStateReference: RefObject<TaskStateReference>;
  setSelectedNodeId: (nodeId: string) => void;
  handleTaskAddClick: (event: React.MouseEvent) => void;
  setIsReplacingTask: (isReplacingTask: boolean) => void;
}

const StageNodeContentInner = ({
  id,
  stageDetails,
  tasks,
  selectedTaskId,
  execution,
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
}: StageNodeContentInnerProps) => {
  return (
    <StageContent>
      <Column py={2} gap={Spacing.SpacingS}>
        <EntryRulesContainer
          id={id}
          entryRules={stageDetails.entryRules}
          sectionState={stageDetails.sectionStates?.entryRules}
          isReadOnly={isReadOnly}
        />
        <StageNodeAllTaskGroups
          id={id}
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          taskExecutions={execution?.taskStatus}
          defaultContentMessage={stageDetails.defaultContent}
          hideParallelOptions={hideParallelOptions}
          loadingTaskIds={loadingTaskIds}
          tasksSectionState={stageDetails.sectionStates?.tasks}
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
        <CompletionRulesContainer
          id={id}
          completionRules={stageDetails.completionRules}
          sectionState={stageDetails.sectionStates?.completionRules}
          isReadOnly={isReadOnly}
        />
        <ExitRulesContainer
          id={id}
          exitRules={stageDetails.exitRules}
          sectionState={stageDetails.sectionStates?.exitRules}
          isReadOnly={isReadOnly}
        />
      </Column>
    </StageContent>
  );
};

export const StageNodeContent = memo(StageNodeContentInner);
