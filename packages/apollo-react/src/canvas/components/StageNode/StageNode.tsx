import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FloatingCanvasPanel } from '../FloatingCanvasPanel';
import { NodeContextMenu } from '../NodeContextMenu';
import { useSetNodeSelection } from '../NodePropertiesPanel/hooks';
import { type ListItem, Toolbox } from '../Toolbox';
import { INDENTATION_WIDTH, STAGE_CONTENT_INSET, StageContainer } from './StageNode.styles';
import type { StageNodeProps, TaskStateReference } from './StageNode.types';
import { StageNodeAllTaskGroups } from './StageNodeAllTaskGroups';
import { StageNodeHandles } from './StageNodeHandles';
import { StageNodeHeader } from './StageNodeHeader';

const StageNodeInner = (props: StageNodeProps) => {
  const {
    dragging,
    selected,
    id,
    width,
    execution,
    stageDetails,
    addTaskLabel = 'Add task',
    replaceTaskLabel = 'Replace task',
    taskOptions = [],
    menuItems,
    pendingReplaceTask,
    onStageClick,
    onTaskAdd,
    onAddTaskFromToolbox,
    onTaskToolboxSearch,
    onReplaceTaskFromToolbox,
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
      style={{ position: 'relative' }}
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

      {onAddTaskFromToolbox && (
        <FloatingCanvasPanel open={isAddingTask} nodeId={id} offset={15}>
          <Toolbox
            title={addTaskLabel}
            initialItems={taskOptions}
            onClose={() => setIsAddingTask(false)}
            onItemSelect={handleAddTaskToolboxItemSelected}
            onSearch={onTaskToolboxSearch}
          />
        </FloatingCanvasPanel>
      )}

      {onReplaceTaskFromToolbox && (
        <FloatingCanvasPanel open={isReplacingTask} nodeId={id} offset={15}>
          <Toolbox
            title={replaceTaskLabel}
            initialItems={taskOptions}
            onClose={() => setIsReplacingTask(false)}
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
      />
    </div>
  );
};

export const StageNode = memo(StageNodeInner);
