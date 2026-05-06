import { Spacing } from '@uipath/apollo-core';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import { Button } from '@uipath/apollo-wind';
import { CSSProperties, memo, RefObject, useCallback, useMemo } from 'react';
import { GroupModificationType } from '../../utils';
import { useStageTasksByGroups } from './hooks/useStageTasksByGroups';
import { StageContent } from './StageNode.styles';
import type { StageNodeProps, StageTaskItem, TaskStateReference } from './StageNode.types';
import { StageNodeAdhocTaskGroups } from './StageNodeAdhocTaskGroups';
import { StageNodeEventDrivenTaskGroups } from './StageNodeEventDrivenTaskGroups';
import { StageNodeSequentialTaskGroups } from './StageNodeSequentialTaskGroups';
import { getMenuItem } from './StageNodeTaskUtilities';

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

  const generateReplaceTaskMenuItemForTask = useCallback(
    (taskId: string, isParallel: boolean) => {
      if (!onReplaceTaskFromToolbox) {
        return undefined;
      }

      let groupIndex: number | undefined;
      let taskIndex: number | undefined;
      for (const [allTasksGroupIndex, group] of allTasks.entries()) {
        for (const [allTasksTaskIndex, task] of group.entries()) {
          if (task.id === taskId) {
            groupIndex = allTasksGroupIndex;
            taskIndex = allTasksTaskIndex;
            break;
          }
        }
      }
      if (groupIndex === undefined || taskIndex === undefined) {
        return undefined;
      }

      return getMenuItem('replace-task', 'Replace task', () => {
        taskStateReference.current = {
          isParallel,
          groupIndex,
          taskIndex,
        };
        onTaskClick?.(taskId);
        setIsReplacingTask(true);
      });
    },
    [onReplaceTaskFromToolbox, allTasks, onTaskClick, setIsReplacingTask, taskStateReference]
  );

  const generateDeleteTaskMenuItemForTask = useCallback(
    (taskId: string) => {
      if (!onTaskGroupModification) {
        return undefined;
      }

      let groupIndex: number | undefined;
      let taskIndex: number | undefined;
      for (const [allTasksGroupIndex, group] of allTasks.entries()) {
        for (const [allTasksTaskIndex, task] of group.entries()) {
          if (task.id === taskId) {
            groupIndex = allTasksGroupIndex;
            taskIndex = allTasksTaskIndex;
            break;
          }
        }
      }
      if (groupIndex === undefined || taskIndex === undefined) {
        return undefined;
      }

      return getMenuItem('remove-task', 'Delete task', () =>
        onTaskGroupModification(GroupModificationType.REMOVE_TASK, groupIndex, taskIndex)
      );
    },
    [allTasks, onTaskGroupModification]
  );

  return (
    <StageContent>
      {sequentialTaskGroups.length === 0 &&
      adhocTaskGroups.length === 0 &&
      eventDrivenTaskGroups.length === 0 ? (
        <Column py={2}>
          {(onTaskAdd || onAddTaskFromToolbox) && !isReadOnly ? (
            <Button
              variant="link"
              size="sm"
              onClick={handleTaskAddClick}
              style={{ maxWidth: 'fit-content', padding: 0 }}
            >
              {defaultContent}
            </Button>
          ) : (
            <span className="text-xs text-foreground-muted h-9">{defaultContent}</span>
          )}
        </Column>
      ) : (
        <Column py={2}>
          <StageNodeSequentialTaskGroups
            props={props}
            sequentialTaskGroups={sequentialTaskGroups}
            sequentialTasks={sequentialTasks}
            isReadOnly={isReadOnly}
            selectedTaskId={selectedTaskId}
            taskWidthStyle={taskWidthStyle}
            hasContextMenu={hasContextMenu}
            handleTaskClick={handleTaskClick}
            handleReorderSequentialTasks={handleReorderSequentialTasks}
            allTasks={allTasks}
            generateReplaceTaskMenuItemForTask={generateReplaceTaskMenuItemForTask}
          />
          <StageNodeEventDrivenTaskGroups
            props={props}
            eventDrivenTasks={eventDrivenTasks}
            isReadOnly={isReadOnly}
            selectedTaskId={selectedTaskId}
            marginTop={sequentialTaskGroups.length > 0 ? Spacing.SpacingS : '0px'}
            handleTaskClick={handleTaskClick}
            generateReplaceTaskMenuItemForTask={generateReplaceTaskMenuItemForTask}
            generateDeleteTaskMenuItemForTask={generateDeleteTaskMenuItemForTask}
          />
          <StageNodeAdhocTaskGroups
            props={props}
            adhocTasks={adhocTasks}
            isReadOnly={isReadOnly}
            selectedTaskId={selectedTaskId}
            marginTop={
              sequentialTaskGroups.length > 0 || eventDrivenTaskGroups.length > 0
                ? Spacing.SpacingS
                : '0px'
            }
            handleTaskClick={handleTaskClick}
            generateReplaceTaskMenuItemForTask={generateReplaceTaskMenuItemForTask}
            generateDeleteTaskMenuItemForTask={generateDeleteTaskMenuItemForTask}
          />
        </Column>
      )}
    </StageContent>
  );
};

export const StageNodeAllTaskGroups = memo(StageNodeAllTaskGroupsInner);
