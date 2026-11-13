import { type CSSProperties, memo, type RefObject, useCallback, useMemo } from 'react';
import { GroupModificationType } from '../../../utils';
import { useStageTasksByGroups } from '../hooks/useStageTasksByGroups';
import type {
  StageNodeProps,
  StageNodeTaskExecutionsProps,
  StageTaskItem,
  TaskStateReference,
} from '../StageNode.types';
import { useStageNodeLabels } from '../useStageNodeLabels';
import { StageNodeAdhocTaskGroups } from './adhoc/StageNodeAdhocTaskGroups';
import { StageNodeEventDrivenTaskGroups } from './event-driven/StageNodeEventDrivenTaskGroups';
import { StageNodeSequentialTaskGroups } from './sequential/StageNodeSequentialTaskGroups';
import { getMenuItem } from './shared/StageNodeTaskUtilities';

interface StageNodeTaskGroupsListInnerProps {
  id: string;
  tasks: StageTaskItem[][];
  selectedTaskId?: string;
  taskExecutions?: StageNodeTaskExecutionsProps;
  hideParallelOptions?: boolean;
  loadingTaskIds?: ReadonlySet<string>;
  onTaskBreakpointToggle: StageNodeProps['onTaskBreakpointToggle'];
  getTaskContextMenuItems: StageNodeProps['getTaskContextMenuItems'];
  onTaskClick: StageNodeProps['onTaskClick'];
  onTaskGroupModification: StageNodeProps['onTaskGroupModification'];
  onTaskReorder: StageNodeProps['onTaskReorder'];
  onReplaceTaskFromToolbox: StageNodeProps['onReplaceTaskFromToolbox'];
  onTaskPlay: StageNodeProps['onTaskPlay'];
  isReadOnly: boolean;
  taskWidthStyle?: CSSProperties;
  taskStateReference: RefObject<TaskStateReference>;
  setSelectedNodeId: (nodeId: string) => void;
  setIsReplacingTask: (isReplacingTask: boolean) => void;
}

const StageNodeTaskGroupsListInner = ({
  id,
  tasks,
  selectedTaskId,
  taskExecutions,
  hideParallelOptions,
  loadingTaskIds,
  onTaskBreakpointToggle,
  getTaskContextMenuItems,
  onTaskClick,
  onTaskGroupModification,
  onTaskReorder,
  onReplaceTaskFromToolbox,
  onTaskPlay,
  isReadOnly,
  taskWidthStyle,
  taskStateReference,
  setSelectedNodeId,
  setIsReplacingTask,
}: StageNodeTaskGroupsListInnerProps) => {
  const labels = useStageNodeLabels();
  const allTasks = useMemo(() => tasks || [], [tasks]);

  // Split tasks into separate sections
  const { sequentialTaskGroups, adhocTaskGroups, eventDrivenTaskGroups } =
    useStageTasksByGroups(allTasks);

  const handleReorderSequentialTasks = useCallback(
    (newTasks: StageTaskItem[][]) => {
      if (!onTaskReorder) {
        return;
      }
      onTaskReorder([...newTasks, ...eventDrivenTaskGroups, ...adhocTaskGroups]);
    },
    [onTaskReorder, eventDrivenTaskGroups, adhocTaskGroups]
  );

  // Visual order only; passing the other sections through keeps tasks in their section.
  const handleReorderEventDrivenTasks = useCallback(
    (newTasks: StageTaskItem[][]) => {
      onTaskReorder?.([...sequentialTaskGroups, ...newTasks, ...adhocTaskGroups]);
    },
    [onTaskReorder, sequentialTaskGroups, adhocTaskGroups]
  );

  const handleReorderAdhocTasks = useCallback(
    (newTasks: StageTaskItem[][]) => {
      onTaskReorder?.([...sequentialTaskGroups, ...eventDrivenTaskGroups, ...newTasks]);
    },
    [onTaskReorder, sequentialTaskGroups, eventDrivenTaskGroups]
  );

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

      return getMenuItem('replace-task', labels.replaceTask, () => {
        taskStateReference.current = {
          isParallel,
          groupIndex,
          taskIndex,
        };
        onTaskClick?.(taskId);
        setIsReplacingTask(true);
      });
    },
    [
      onReplaceTaskFromToolbox,
      allTasks,
      onTaskClick,
      setIsReplacingTask,
      taskStateReference,
      labels.replaceTask,
    ]
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

      return getMenuItem('remove-task', labels.deleteTask, () =>
        onTaskGroupModification(GroupModificationType.REMOVE_TASK, groupIndex, taskIndex)
      );
    },
    [allTasks, onTaskGroupModification, labels.deleteTask]
  );

  return (
    <>
      <StageNodeSequentialTaskGroups
        id={id}
        taskExecutions={taskExecutions}
        hideParallelOptions={hideParallelOptions}
        loadingTaskIds={loadingTaskIds}
        onTaskBreakpointToggle={onTaskBreakpointToggle}
        getTaskContextMenuItems={getTaskContextMenuItems}
        onTaskGroupModification={onTaskGroupModification}
        onTaskReorder={onTaskReorder}
        onReplaceTaskFromToolbox={onReplaceTaskFromToolbox}
        sequentialTaskGroups={sequentialTaskGroups}
        isReadOnly={isReadOnly}
        selectedTaskId={selectedTaskId}
        taskWidthStyle={taskWidthStyle}
        handleTaskClick={handleTaskClick}
        handleReorderSequentialTasks={handleReorderSequentialTasks}
        allTasks={allTasks}
        generateReplaceTaskMenuItemForTask={generateReplaceTaskMenuItemForTask}
      />
      <StageNodeEventDrivenTaskGroups
        id={id}
        taskExecutions={taskExecutions}
        loadingTaskIds={loadingTaskIds}
        onTaskBreakpointToggle={onTaskBreakpointToggle}
        getTaskContextMenuItems={getTaskContextMenuItems}
        onTaskGroupModification={onTaskGroupModification}
        onTaskReorder={onTaskReorder}
        onReplaceTaskFromToolbox={onReplaceTaskFromToolbox}
        eventDrivenTaskGroups={eventDrivenTaskGroups}
        isReadOnly={isReadOnly}
        selectedTaskId={selectedTaskId}
        taskWidthStyle={taskWidthStyle}
        handleTaskClick={handleTaskClick}
        handleReorderEventDrivenTasks={handleReorderEventDrivenTasks}
        generateReplaceTaskMenuItemForTask={generateReplaceTaskMenuItemForTask}
        generateDeleteTaskMenuItemForTask={generateDeleteTaskMenuItemForTask}
      />
      <StageNodeAdhocTaskGroups
        id={id}
        taskExecutions={taskExecutions}
        loadingTaskIds={loadingTaskIds}
        onTaskBreakpointToggle={onTaskBreakpointToggle}
        getTaskContextMenuItems={getTaskContextMenuItems}
        onTaskGroupModification={onTaskGroupModification}
        onTaskReorder={onTaskReorder}
        onReplaceTaskFromToolbox={onReplaceTaskFromToolbox}
        onTaskPlay={onTaskPlay}
        adhocTaskGroups={adhocTaskGroups}
        isReadOnly={isReadOnly}
        selectedTaskId={selectedTaskId}
        taskWidthStyle={taskWidthStyle}
        handleTaskClick={handleTaskClick}
        handleReorderAdhocTasks={handleReorderAdhocTasks}
        generateReplaceTaskMenuItemForTask={generateReplaceTaskMenuItemForTask}
        generateDeleteTaskMenuItemForTask={generateDeleteTaskMenuItemForTask}
      />
    </>
  );
};

export const StageNodeTaskGroupsList = memo(StageNodeTaskGroupsListInner);
