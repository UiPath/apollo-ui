import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import { useIsNodeReadOnly } from '../BaseCanvas/ReadOnlyNodesContext';
import { useSetNodeSelection } from '../NodePropertiesPanel/hooks';
import { StageNodeAddTaskToolbox } from './menus/StageNodeAddTaskToolbox';
import { StageNodeContextMenu } from './menus/StageNodeContextMenu';
import { StageNodeReplaceTaskToolbox } from './menus/StageNodeReplaceTaskToolbox';
import type { StageNodeProps, TaskStateReference } from './StageNode.types';
import { StageNodeContentContainer } from './StageNodeContentContainer';
import { StageNodeHandles } from './StageNodeHandles';

const StageNodeInner = (props: StageNodeProps) => {
  const {
    dragging,
    selected,
    id,
    width,
    execution,
    stageDetails,
    taskOptions = [],
    replaceTaskToolboxTitle,
    menuItems,
    pendingReplaceTask,
    hideParallelOptions,
    loadingTaskIds,
    onStageClick,
    onTaskAdd,
    onAddTaskFromToolbox,
    onTaskToolboxSearch,
    onReplaceTaskFromToolbox,
    onTaskBreakpointToggle,
    getTaskContextMenuItems,
    onTaskPlay,
    onStatusClick,
    onStageTitleChange,
    onTaskClick,
    onTaskGroupModification,
    onTaskReorder,
  } = props;

  const allTasks = useMemo(() => stageDetails?.tasks || [], [stageDetails?.tasks]);

  const isException = stageDetails?.isException;
  // A per-node lock outranks the stage's own data flag.
  const isReadOnly = useIsNodeReadOnly(id) || !!stageDetails?.isReadOnly;
  const selectedTaskId = stageDetails?.selectedTaskId;

  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const taskStateReference = useRef<TaskStateReference>({
    isParallel: false,
    groupIndex: -1,
    taskIndex: -1,
  });

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isReplacingTask, setIsReplacingTask] = useState(false);

  useEffect(() => {
    if (pendingReplaceTask && !isReadOnly) {
      const match = allTasks
        .flatMap((group, gi) => group.map((task, ti) => ({ task, groupIndex: gi, taskIndex: ti })))
        .find(({ task }) => task.id === selectedTaskId);

      if (match) {
        taskStateReference.current = {
          isParallel: (allTasks[match.groupIndex]?.length ?? 0) > 1,
          groupIndex: match.groupIndex,
          taskIndex: match.taskIndex,
        };
        setIsReplacingTask(true);
      }
    }
  }, [pendingReplaceTask, selectedTaskId, allTasks, isReadOnly]);

  useEffect(() => {
    if (selected === false || isReadOnly) {
      setIsAddingTask(false);
      setIsReplacingTask(false);
    }
  }, [selected, isReadOnly]);

  const { setSelectedNodeId } = useSetNodeSelection();
  const handleStageClick = useCallback(() => {
    onStageClick?.();
  }, [onStageClick]);

  const handleTaskAddClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (isReadOnly) return;
      if (onTaskAdd) {
        onTaskAdd();
      } else if (onAddTaskFromToolbox) {
        setIsAddingTask(true);
      }
      setSelectedNodeId(id);
    },
    [onTaskAdd, onAddTaskFromToolbox, setSelectedNodeId, id, isReadOnly]
  );

  return (
    <div
      data-testid={`stage-${id}`}
      className="relative"
      onClick={handleStageClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <StageNodeContentContainer
        id={id}
        width={width}
        allTasks={allTasks}
        stageDetails={stageDetails}
        selectedTaskId={selectedTaskId}
        execution={execution}
        hideParallelOptions={hideParallelOptions}
        loadingTaskIds={loadingTaskIds}
        isSelected={selected}
        isReadOnly={isReadOnly}
        taskStateReference={taskStateReference}
        onStatusClick={onStatusClick}
        onStageTitleChange={onStageTitleChange}
        setSelectedNodeId={setSelectedNodeId}
        handleTaskAddClick={handleTaskAddClick}
        setIsReplacingTask={setIsReplacingTask}
        onTaskBreakpointToggle={onTaskBreakpointToggle}
        getTaskContextMenuItems={getTaskContextMenuItems}
        onTaskAdd={onTaskAdd}
        onAddTaskFromToolbox={onAddTaskFromToolbox}
        onTaskClick={onTaskClick}
        onTaskGroupModification={onTaskGroupModification}
        onTaskReorder={onTaskReorder}
        onReplaceTaskFromToolbox={onReplaceTaskFromToolbox}
        onTaskPlay={onTaskPlay}
      />
      <StageNodeAddTaskToolbox
        id={id}
        taskOptions={taskOptions}
        isReadOnly={isReadOnly}
        onAddTaskFromToolbox={onAddTaskFromToolbox}
        onTaskToolboxSearch={onTaskToolboxSearch}
        isAddingTask={isAddingTask}
        setIsAddingTask={setIsAddingTask}
      />
      <StageNodeReplaceTaskToolbox
        id={id}
        taskOptions={taskOptions}
        replaceTaskToolboxTitle={replaceTaskToolboxTitle}
        isReadOnly={isReadOnly}
        taskStateReference={taskStateReference}
        onTaskToolboxSearch={onTaskToolboxSearch}
        onReplaceTaskFromToolbox={onReplaceTaskFromToolbox}
        isReplacingTask={isReplacingTask}
        setIsReplacingTask={setIsReplacingTask}
      />
      <StageNodeContextMenu
        dragging={dragging}
        selected={selected}
        menuItems={menuItems}
        isHovered={isHovered}
      />
      <StageNodeHandles
        id={id}
        isReadOnly={isReadOnly}
        selected={selected}
        isHovered={isHovered}
        isException={isException}
      />
    </div>
  );
};

export const StageNode = memo(
  StageNodeInner,
  (prevProps: StageNodeProps, nextProps: StageNodeProps) => {
    return areNodePropsEqualIgnoringPosition(prevProps, nextProps);
  }
);
