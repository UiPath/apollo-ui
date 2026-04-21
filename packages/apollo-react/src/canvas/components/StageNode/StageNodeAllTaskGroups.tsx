import { Spacing } from '@uipath/apollo-core';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import { Button } from '@uipath/apollo-wind';
import { CSSProperties, memo, RefObject, useCallback, useMemo } from 'react';
import { useStageTasksByGroups } from './hooks/useStageTasksByGroups';
import { StageContent } from './StageNode.styles';
import type { StageNodeProps, StageTaskItem, TaskStateReference } from './StageNode.types';
import { StageNodeAdhocTaskGroups } from './StageNodeAdhocTaskGroups';
import { StageNodeEventDrivenTaskGroups } from './StageNodeEventDrivenTaskGroups';
import { StageNodeSequentialTaskGroups } from './StageNodeSequentialTaskGroups';

const StageNodeAllTaskGroupsInner = ({
  props,
  isReadOnly,
  taskWidthStyle,
  taskStateReference,
  setSelectedNodeId,
  handleTaskAddClick,
  setIsReplacingTask,
}: {
  props: StageNodeProps;
  isReadOnly: boolean;
  taskWidthStyle?: CSSProperties;
  taskStateReference: RefObject<TaskStateReference>;
  setSelectedNodeId: (nodeId: string) => void;
  handleTaskAddClick: (event: React.MouseEvent) => void;
  setIsReplacingTask: (isReplacingTask: boolean) => void;
}) => {
  const {
    id,
    stageDetails,
    onTaskAdd,
    onAddTaskFromToolbox,
    onTaskClick,
    onTaskGroupModification,
    onTaskReorder,
    onReplaceTaskFromToolbox,
  } = props;

  const allTasks = useMemo(() => stageDetails?.tasks || [], [stageDetails?.tasks]);

  // Split tasks into separate sections
  const {
    sequentialTaskGroups,
    sequentialTasks,
    adhocTaskGroups,
    adhocTasks,
    eventDrivenTaskGroups,
    eventDrivenTasks,
  } = useStageTasksByGroups(allTasks);

  const selectedTaskId = stageDetails?.selectedTaskId;
  const defaultContent =
    stageDetails?.defaultContent || (isReadOnly ? 'No tasks' : 'Add first task');

  const handleReorderSequentialTasks = useCallback(
    (newTasks: StageTaskItem[][]) => {
      if (!onTaskReorder) {
        return;
      }
      onTaskReorder([...newTasks, ...eventDrivenTaskGroups, ...adhocTaskGroups]);
    },
    [onTaskReorder, eventDrivenTaskGroups, adhocTaskGroups]
  );

  const hasContextMenu = !!(onReplaceTaskFromToolbox || onTaskGroupModification);

  const handleTaskClick = useCallback(
    (e: React.MouseEvent, taskElementId: string) => {
      e.stopPropagation();
      onTaskClick?.(taskElementId);
      setSelectedNodeId(id);
    },
    [onTaskClick, setSelectedNodeId, id]
  );

  return (
    <StageContent>
      {sequentialTaskGroups.length === 0 &&
      adhocTaskGroups.length === 0 &&
      eventDrivenTaskGroups.length === 0 ? (
        <Column py={2}>
          {(onTaskAdd || onAddTaskFromToolbox) && !isReadOnly ? (
            <Button variant="link" onClick={handleTaskAddClick} style={{ maxWidth: 'fit-content' }}>
              {defaultContent}
            </Button>
          ) : (
            <span className="text-xs text-foreground-muted">{defaultContent}</span>
          )}
        </Column>
      ) : (
        <Column>
          <StageNodeSequentialTaskGroups
            props={props}
            sequentialTaskGroups={sequentialTaskGroups}
            sequentialTasks={sequentialTasks}
            isReadOnly={isReadOnly}
            selectedTaskId={selectedTaskId}
            taskWidthStyle={taskWidthStyle}
            taskStateReference={taskStateReference}
            hasContextMenu={hasContextMenu}
            handleTaskClick={handleTaskClick}
            setIsReplacingTask={setIsReplacingTask}
            handleReorderSequentialTasks={handleReorderSequentialTasks}
          />
          <StageNodeEventDrivenTaskGroups
            props={props}
            eventDrivenTasks={eventDrivenTasks}
            isReadOnly={isReadOnly}
            selectedTaskId={selectedTaskId}
            taskStateReference={taskStateReference}
            marginTop={sequentialTaskGroups.length > 0 ? Spacing.SpacingS : '0px'}
            handleTaskClick={handleTaskClick}
            setIsReplacingTask={setIsReplacingTask}
          />
          <StageNodeAdhocTaskGroups
            props={props}
            adhocTasks={adhocTasks}
            isReadOnly={isReadOnly}
            selectedTaskId={selectedTaskId}
            taskStateReference={taskStateReference}
            marginTop={
              sequentialTaskGroups.length > 0 || eventDrivenTaskGroups.length > 0
                ? Spacing.SpacingS
                : '0px'
            }
            handleTaskClick={handleTaskClick}
            setIsReplacingTask={setIsReplacingTask}
          />
        </Column>
      )}
    </StageContent>
  );
};

export const StageNodeAllTaskGroups = memo(StageNodeAllTaskGroupsInner);
