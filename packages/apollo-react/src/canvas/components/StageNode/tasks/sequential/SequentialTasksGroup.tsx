import { Spacing } from '@uipath/apollo-core';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import { memo } from 'react';
import type { NodeMenuItem } from '../../../NodeContextMenu';
import {
  StageParallelBracket,
  StageParallelLabel,
  StageTaskGroupContainer,
} from '../../StageNode.styles';
import type {
  StageNodeProps,
  StageNodeTaskExecutionsProps,
  StageTaskItem,
} from '../../StageNode.types';
import { useStageNodeLabels } from '../../useStageNodeLabels';
import { SequentialTaskRow } from './SequentialTaskRow';

interface SequentialTasksGroupInnerProps {
  taskGroup: StageTaskItem[];
  groupIndex: number;
  taskExecutions?: StageNodeTaskExecutionsProps;
  loadingTaskIds?: ReadonlySet<string>;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  isReadOnly: boolean;
  hasBuiltInTaskActions: boolean;
  isDragDisabled: boolean;
  selectedTaskId?: string;
  handleTaskClick: (e: React.MouseEvent, taskElementId: string) => void;
  getSequentialContextMenuItems: (task: StageTaskItem) => NodeMenuItem[];
}

export const SequentialTasksGroupInner = ({
  taskGroup,
  groupIndex,
  taskExecutions,
  loadingTaskIds,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  isReadOnly,
  hasBuiltInTaskActions,
  isDragDisabled,
  selectedTaskId,
  handleTaskClick,
  getSequentialContextMenuItems,
}: SequentialTasksGroupInnerProps) => {
  const labels = useStageNodeLabels();
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
          const taskExecution = taskExecutions?.[task.id];
          return (
            <SequentialTaskRow
              key={task.id}
              task={task}
              taskExecution={taskExecution}
              isTaskLoading={loadingTaskIds?.has(task.id)}
              isParallel={isParallel}
              isReadOnly={isReadOnly}
              selectedTaskId={selectedTaskId}
              hasBuiltInTaskActions={hasBuiltInTaskActions}
              isDragDisabled={isDragDisabled}
              onTaskBreakpointToggle={onTaskBreakpointToggle}
              getTaskContextMenuItems={getTaskContextMenuItems}
              handleTaskClick={handleTaskClick}
              getSequentialContextMenuItems={getSequentialContextMenuItems}
            />
          );
        })}
      </StageTaskGroupContainer>
    </Row>
  );
};

export const SequentialTasksGroup = memo(SequentialTasksGroupInner);
