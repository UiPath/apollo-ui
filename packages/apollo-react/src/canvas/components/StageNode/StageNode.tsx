import { Spacing } from '@uipath/apollo-core';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import { useIsNodeReadOnly } from '../BaseCanvas/ReadOnlyNodesContext';
import { FloatingCanvasPanel } from '../FloatingCanvasPanel';
import { NodeContextMenu } from '../NodeContextMenu';
import { useSetNodeSelection } from '../NodePropertiesPanel/hooks';
import { type ListItem, Toolbox } from '../Toolbox';
import { CompletionRulesContainer } from './rules/CompletionRulesContainer';
import { EntryRulesContainer } from './rules/EntryRulesContainer';
import { ExitRulesContainer } from './rules/ExitRulesContainer';
import {
  INDENTATION_WIDTH,
  STAGE_CONTENT_INSET,
  StageContainer,
  StageContent,
} from './StageNode.styles';
import type { StageNodeProps, TaskStateReference } from './StageNode.types';
import { StageNodeHandles } from './StageNodeHandles';
import { StageNodeHeader } from './StageNodeHeader';
import { StageNodeAllTaskGroups } from './tasks/StageNodeAllTaskGroups';
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
    replaceTaskToolboxTitle,
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
  // A per-node lock outranks the stage's own data flag.
  const isReadOnly = useIsNodeReadOnly(id) || !!stageDetails?.isReadOnly;
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

  // Not gated on `isReadOnly`: these items are host-controlled, so inspection
  // and debug actions stay reachable on a locked stage. The stage's own
  // mutation affordances are gated individually below.
  const shouldShowMenu = useMemo(() => {
    return menuItems && menuItems.length > 0 && (selected || isHovered);
  }, [menuItems, selected, isHovered]);

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
        <StageContent>
          <Column py={2} gap={Spacing.SpacingS}>
            <EntryRulesContainer props={props} isReadOnly={isReadOnly} />
            <StageNodeAllTaskGroups
              props={props}
              isReadOnly={isReadOnly}
              taskWidthStyle={taskWidthStyle}
              taskStateReference={taskStateReference}
              setSelectedNodeId={setSelectedNodeId}
              handleTaskAddClick={handleTaskAddClick}
              setIsReplacingTask={setIsReplacingTask}
            />
            <CompletionRulesContainer props={props} isReadOnly={isReadOnly} />
            <ExitRulesContainer props={props} isReadOnly={isReadOnly} />
          </Column>
        </StageContent>
      </StageContainer>

      {/* Panels are mounted only while open: FloatingCanvasPanel subscribes to the
          node's internals (useInternalNode), so a permanently mounted panel re-renders
          on every drag/measure frame of the stage even though it renders nothing. */}
      {onAddTaskFromToolbox && isAddingTask && !isReadOnly && (
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

      {onReplaceTaskFromToolbox && isReplacingTask && !isReadOnly && (
        <FloatingCanvasPanel nodeId={id} offset={15}>
          <Toolbox
            title={replaceTaskToolboxTitle || labels.replaceTask}
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
      />
    </div>
  );
};

export const StageNode = memo(StageNodeInner, areNodePropsEqualIgnoringPosition);
