import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import { FloatingCanvasPanel } from '../FloatingCanvasPanel';
import { NodeContextMenu } from '../NodeContextMenu';
import { useSetNodeSelection } from '../NodePropertiesPanel/hooks';
import { type ListItem, Toolbox } from '../Toolbox';
import { INDENTATION_WIDTH, STAGE_CONTENT_INSET, StageContainer } from './StageNode.styles';
import type { StageNodeProps, TaskStateReference } from './StageNode.types';
import { StageNodeAllTaskGroups } from './StageNodeAllTaskGroups';
import { StageNodeHandles } from './StageNodeHandles';
import { StageNodeHeader } from './StageNodeHeader';
import { useStageNodeLabels } from './useStageNodeLabels';

const StageNodeInner = (props: StageNodeProps) => {
  const labels = useStageNodeLabels();
  const {
    dragging,
    selected,
    id,
    width,
    execution,
    stageDetails,
    taskOptions = [],
    menuItems,
    pendingReplaceTask,
    onStageClick,
    onTaskAdd,
    onAddTaskFromToolbox,
    onTaskToolboxSearch,
    onReplaceTaskFromToolbox,
    onHandleAction,
    onHandleMouseEnter,
    onHandleMouseLeave,
  } = props;

  const taskWidth = width ? width - STAGE_CONTENT_INSET : undefined;

  const allTasks = useMemo(() => stageDetails?.tasks || [], [stageDetails?.tasks]);

  const isException = stageDetails?.isException;
  const isReadOnly = !!stageDetails?.isReadOnly;
  const selectedTaskId = stageDetails?.selectedTaskId;
  const status = execution?.stageStatus?.status;

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
    if (pendingReplaceTask) {
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
  }, [pendingReplaceTask, selectedTaskId, allTasks]);

  useEffect(() => {
    if (selected === false) {
      setIsAddingTask(false);
      setIsReplacingTask(false);
    }
  }, [selected]);

  const shouldShowMenu = useMemo(() => {
    return menuItems && menuItems.length > 0 && (selected || isHovered) && !isReadOnly;
  }, [menuItems, selected, isHovered, isReadOnly]);

  const { setSelectedNodeId } = useSetNodeSelection();
  const handleStageClick = useCallback(() => {
    onStageClick?.();
  }, [onStageClick]);

  const handleTaskAddClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (onTaskAdd) {
        onTaskAdd();
      } else if (onAddTaskFromToolbox) {
        setIsAddingTask(true);
      }
      setSelectedNodeId(id);
    },
    [onTaskAdd, onAddTaskFromToolbox, setSelectedNodeId, id]
  );

  const handleAddTaskToolboxItemSelected = useCallback(
    (item: ListItem) => {
      onAddTaskFromToolbox?.(item);
      setIsAddingTask(false);
      setSelectedNodeId(id);
    },
    [onAddTaskFromToolbox, setSelectedNodeId, id]
  );

  const handleAddTaskToolboxClose = useCallback(() => setIsAddingTask(false), []);
  const handleReplaceTaskToolboxClose = useCallback(() => setIsReplacingTask(false), []);

  const handleReplaceTaskToolboxItemSelected = useCallback(
    (item: ListItem) => {
      onReplaceTaskFromToolbox?.(
        item,
        taskStateReference.current.groupIndex,
        taskStateReference.current.taskIndex
      );
      setIsReplacingTask(false);
    },
    [onReplaceTaskFromToolbox]
  );

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
    <div
      data-testid={`stage-${id}`}
      className="relative"
      onClick={handleStageClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <StageContainer selected={selected} status={status} width={width} style={taskWidthStyle}>
        <StageNodeHeader
          props={props}
          isReadOnly={isReadOnly}
          isException={isException}
          status={status}
          handleTaskAddClick={handleTaskAddClick}
        />

        <StageNodeAllTaskGroups
          props={props}
          isReadOnly={isReadOnly}
          taskWidthStyle={taskWidthStyle}
          taskStateReference={taskStateReference}
          setSelectedNodeId={setSelectedNodeId}
          handleTaskAddClick={handleTaskAddClick}
          setIsReplacingTask={setIsReplacingTask}
        />
      </StageContainer>

      {/* Panels are mounted only while open: FloatingCanvasPanel subscribes to the
          node's internals (useInternalNode), so a permanently mounted panel re-renders
          on every drag/measure frame of the stage even though it renders nothing. */}
      {onAddTaskFromToolbox && isAddingTask && (
        <FloatingCanvasPanel nodeId={id} offset={15}>
          <Toolbox
            title={labels.addTask}
            initialItems={taskOptions}
            onClose={handleAddTaskToolboxClose}
            onItemSelect={handleAddTaskToolboxItemSelected}
            onSearch={onTaskToolboxSearch}
          />
        </FloatingCanvasPanel>
      )}

      {onReplaceTaskFromToolbox && isReplacingTask && (
        <FloatingCanvasPanel nodeId={id} offset={15}>
          <Toolbox
            title={labels.replaceTask}
            initialItems={taskOptions}
            onClose={handleReplaceTaskToolboxClose}
            onItemSelect={handleReplaceTaskToolboxItemSelected}
            onSearch={onTaskToolboxSearch}
          />
        </FloatingCanvasPanel>
      )}

      {menuItems && !dragging && (
        <NodeContextMenu menuItems={menuItems} isVisible={shouldShowMenu} />
      )}

      <StageNodeHandles
        id={id}
        isReadOnly={isReadOnly}
        selected={selected}
        isHovered={isHovered}
        isException={isException}
        onHandleAction={onHandleAction}
        onHandleMouseEnter={onHandleMouseEnter}
        onHandleMouseLeave={onHandleMouseLeave}
      />
    </div>
  );
};

export const StageNode = memo(StageNodeInner, areNodePropsEqualIgnoringPosition);
