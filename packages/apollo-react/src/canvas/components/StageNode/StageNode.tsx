/**
 * StageNode - Stage node that uses React Flow TaskNodes as children
 *
 * This component works with the TaskNode component where tasks
 * are rendered as separate React Flow nodes with parentId pointing to the stage.
 * Task positions are calculated based on order, not user drag position.
 *
 * Key features:
 * - Uses taskIds: string[][] to reference tasks
 * - Does not render tasks directly - they're separate React Flow nodes
 * - Provides TaskNodeProvider context for child TaskNodes
 * - Renders parallel brackets/labels based on taskIds grouping
 */

import { FontVariantToken, Padding, Spacing } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { Position, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  ApCircularProgress,
  ApIcon,
  ApIconButton,
  ApLink,
  ApTooltip,
  ApTypography,
} from '@uipath/apollo-react/material';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCrossStageDragState } from '../../hooks/CrossStageDragContext';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import { FloatingCanvasPanel } from '../FloatingCanvasPanel';
import { NodeContextMenu } from '../NodeContextMenu';
import { useNodeSelection } from '../NodePropertiesPanel/hooks';
import { TaskNodeProvider } from '../TaskNode/TaskNodeContext';
import {
  calculateStageContentHeight,
  DEFAULT_TASK_POSITION_CONFIG,
} from '../TaskNode/useTaskPositions';
import { type ListItem, Toolbox } from '../Toolbox';
import {
  INDENTATION_WIDTH,
  STAGE_CONTENT_INSET,
  StageContainer,
  StageContent,
  StageHeader,
  StageParallelBracket,
  StageParallelLabel,
  StageTaskList,
  StageTitleContainer,
  StageTitleInput,
} from './StageNode.styles';
import type { StageNodeProps } from './StageNode.types';

/**
 * Calculate extra height needed for a task based on its execution content
 */
function calculateExecutionExtraHeight(execution?: Record<string, unknown>): number {
  if (!execution) return 0;
  if (execution.duration || execution.retryDuration || execution.badge) {
    if (execution.retryDuration || execution.badge) {
      return 26; // Taller for retry/badge content (62px total)
    } else {
      return 18; // Normal for just duration (54px total)
    }
  }
  return 2; // Minimal for status icon only (38px total)
}

/**
 * Calculate the Y position for the first task in a parallel group
 * (The bracket starts at the first task, not the label)
 */
function calculateParallelGroupY(
  groupIndex: number,
  taskIds: string[][],
  hasStageExecution: boolean,
  taskExecutionData: Record<string, { execution?: Record<string, unknown> }>,
  config = DEFAULT_TASK_POSITION_CONFIG
): number {
  // Add extra header height if stage has execution with duration
  const headerHeight = hasStageExecution
    ? config.headerHeight + config.headerExecutionDescriptionHeight
    : config.headerHeight;

  let y = headerHeight + config.contentPaddingTop;

  for (let i = 0; i < groupIndex; i++) {
    const group = taskIds[i];
    if (!group) continue;

    // Calculate height for each task in the group based on execution data
    for (let j = 0; j < group.length; j++) {
      const taskId = group[j];
      const execution = taskId ? taskExecutionData[taskId]?.execution : undefined;
      const taskHeight = config.taskHeight + calculateExecutionExtraHeight(execution);
      y += taskHeight;
      if (j < group.length - 1) {
        y += config.taskGap;
      }
    }
    y += config.taskGap;
  }

  return y;
}

/**
 * Calculate the height of a parallel group bracket based on task execution data
 */
function calculateParallelGroupHeight(
  group: string[],
  taskExecutionData: Record<string, { execution?: Record<string, unknown> }>,
  config = DEFAULT_TASK_POSITION_CONFIG
): number {
  let height = 0;
  for (let i = 0; i < group.length; i++) {
    const taskId = group[i];
    const execution = taskId ? taskExecutionData[taskId]?.execution : undefined;
    const taskHeight = config.taskHeight + calculateExecutionExtraHeight(execution);
    height += taskHeight;
    if (i < group.length - 1) {
      height += config.taskGap;
    }
  }
  return height;
}

const StageNodeComponent = (props: StageNodeProps) => {
  const {
    dragging,
    selected,
    id,
    nodeType = 'stage',
    width,
    execution,
    stageDetails,
    addTaskLabel = 'Add task',
    addTaskLoading = false,
    replaceTaskLabel = 'Replace task',
    taskOptions = [],
    menuItems,
    pendingReplaceTask,
    onStageClick,
    onTaskAdd,
    onAddTaskFromToolbox,
    onTaskToolboxSearch,
    onReplaceTaskFromToolbox,
    replaceTaskTarget,
    onReplaceTaskTargetChange,
    onTaskClick,
    onTaskSelect,
    onStageTitleChange,
    // onTaskIdsChange - will be used in Phase 3 for cross-stage drag
  } = props;

  const taskIds = useMemo(() => stageDetails?.taskIds || [], [stageDetails?.taskIds]);
  const isException = stageDetails?.isException;
  const isReadOnly = !!stageDetails?.isReadOnly;
  const icon = stageDetails?.icon;
  const defaultContent = stageDetails?.defaultContent || 'Add first task';

  const status = execution?.stageStatus?.status;
  const statusLabel = execution?.stageStatus?.label;
  const stageDuration = execution?.stageStatus?.duration;

  const isStageTitleEditable = !!onStageTitleChange && !isReadOnly;

  const [isHovered, setIsHovered] = useState(false);
  const [label, setLabel] = useState(props.stageDetails.label);
  const [toolboxMode, setToolboxMode] = useState<'add' | 'replace' | null>(null);
  const replaceTaskRef = useRef<{ groupIndex: number; taskIndex: number } | null>(null);
  const [isStageTitleEditing, setIsStageTitleEditing] = useState(false);
  const stageTitleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabel(props.stageDetails.label);
  }, [props.stageDetails.label]);

  const isConnecting = useStore((state) => !!state.connectionClickStartHandle);
  const connectedHandleIds = useConnectedHandles(id);

  useEffect(() => {
    if (selected === false) {
      setToolboxMode(null);
      replaceTaskRef.current = null;
    }
  }, [selected]);

  const hasConnections = connectedHandleIds.size > 0;

  const shouldShowHandles = useMemo(() => {
    return !isReadOnly && (selected || isHovered || isConnecting || hasConnections);
  }, [hasConnections, isConnecting, selected, isHovered, isReadOnly]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const shouldShowMenu = useMemo(() => {
    return menuItems && menuItems.length > 0 && (selected || isHovered) && !isReadOnly;
  }, [menuItems, selected, isHovered, isReadOnly]);

  const handleStageTitleChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    setIsStageTitleEditing(true);
    setLabel((e.target as HTMLInputElement).value);
  }, []);

  const handleStageTitleBlurToSave = useCallback(() => {
    if (isStageTitleEditing) {
      setIsStageTitleEditing(false);
      if (onStageTitleChange) {
        if (label.trim() === '') setLabel('Untitled Stage');
        onStageTitleChange(label);
      }
    }
  }, [isStageTitleEditing, onStageTitleChange, label]);

  const handleStageTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        setIsStageTitleEditing(false);
        if (onStageTitleChange) {
          onStageTitleChange(label);
        }
      }
    },
    [onStageTitleChange, label]
  );

  const { setSelectedNodeId } = useNodeSelection();
  const handleStageClick = useCallback(() => {
    onStageClick?.();
  }, [onStageClick]);

  const handleTaskAddClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      replaceTaskRef.current = null;
      if (onTaskAdd) {
        onTaskAdd();
      } else if (onAddTaskFromToolbox) {
        setToolboxMode('add');
      }
      setSelectedNodeId(id);
    },
    [onTaskAdd, onAddTaskFromToolbox, setSelectedNodeId, id]
  );

  // Watch for external replace task trigger
  useEffect(() => {
    if (replaceTaskTarget) {
      replaceTaskRef.current = replaceTaskTarget;
      setToolboxMode('replace');
    }
  }, [replaceTaskTarget]);

  // Watch for pending replace task from properties panel
  useEffect(() => {
    if (pendingReplaceTask?.groupIndex != null && pendingReplaceTask?.taskIndex != null) {
      replaceTaskRef.current = {
        groupIndex: pendingReplaceTask.groupIndex,
        taskIndex: pendingReplaceTask.taskIndex,
      };
      setToolboxMode('replace');
    }
  }, [pendingReplaceTask]);

  const handleToolboxItemSelected = useCallback(
    (item: ListItem) => {
      if (toolboxMode === 'replace' && replaceTaskRef.current && onReplaceTaskFromToolbox) {
        onReplaceTaskFromToolbox(item, replaceTaskRef.current.groupIndex, replaceTaskRef.current.taskIndex);
      } else if (toolboxMode === 'add') {
        onAddTaskFromToolbox?.(item);
      }
      setToolboxMode(null);
      replaceTaskRef.current = null;
      onReplaceTaskTargetChange?.(null);
      setSelectedNodeId(id);
    },
    [toolboxMode, onReplaceTaskFromToolbox, onAddTaskFromToolbox, onReplaceTaskTargetChange, setSelectedNodeId, id]
  );

  const handleToolboxClose = useCallback(() => {
    setToolboxMode(null);
    replaceTaskRef.current = null;
    onReplaceTaskTargetChange?.(null);
  }, [onReplaceTaskTargetChange]);

  // Calculate task width and create CSS variables for child TaskNodes
  const taskWidth = width ? width - STAGE_CONTENT_INSET : undefined;
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

  // Handle configuration for connection handles
  const handleConfigurations: HandleGroupManifest[] = useMemo(
    () =>
      isException
        ? []
        : [
            {
              position: Position.Left,
              handles: [
                {
                  id: `${id}____target____left`,
                  type: 'target',
                  handleType: 'input',
                },
              ],
              visible: selected || isHovered || isConnecting,
              customPositionAndOffsets: {
                top: 0,
                height: 64,
              },
            },
            {
              position: Position.Right,
              handles: [
                {
                  id: `${id}____source____right`,
                  type: 'source',
                  handleType: 'output',
                },
              ],
              visible: selected || isHovered || isConnecting,
              customPositionAndOffsets: {
                top: 0,
                height: 64,
              },
            },
            {
              position: Position.Bottom,
              handles: [
                {
                  id: `${id}____target____bottom`,
                  type: 'target',
                  handleType: 'input',
                },
              ],
              visible: selected || isHovered || isConnecting,
            },
            {
              position: Position.Bottom,
              handles: [
                {
                  id: `${id}____source____bottom`,
                  type: 'source',
                  handleType: 'output',
                },
              ],
              visible: selected || isHovered || isConnecting,
            },
          ],
    [isException, id, selected, isHovered, isConnecting]
  );

  const handleElements = useButtonHandles({
    handleConfigurations,
    shouldShowHandles,
    nodeId: id,
    selected,
  });

  // TaskNodeProvider value
  const taskNodeContextValue = useMemo(
    () => ({
      stageId: id,
      stageNodeType: nodeType,
      taskIds,
      isReadOnly,
      onTaskClick,
      onTaskSelect,
    }),
    [id, nodeType, taskIds, isReadOnly, onTaskClick, onTaskSelect]
  );

  // Get cross-stage drag state for bracket expansion calculation
  const dragState = useCrossStageDragState();

  // Calculate display taskIds with placeholder for bracket height calculation
  const displayTaskIds = useMemo(() => {
    if (dragState?.isDragging && dragState.taskId) {
      // Case 1: This stage is the TARGET stage - add placeholder and remove dragged task
      if (dragState.targetStageId === id && dragState.dropPosition) {
        const { groupIndex, taskIndex, isParallel } = dragState.dropPosition;
        const tempTaskIds = taskIds.map((g) => [...g]);

        // Remove dragged task if in this stage
        for (let gi = 0; gi < tempTaskIds.length; gi++) {
          const group = tempTaskIds[gi];
          if (!group) continue;
          const idx = group.indexOf(dragState.taskId);
          if (idx !== -1) {
            group.splice(idx, 1);
          }
        }

        const filtered = tempTaskIds.filter((g) => g && g.length > 0);

        // Insert placeholder
        if (groupIndex >= filtered.length) {
          filtered.push(['__placeholder__']);
        } else if (isParallel && filtered[groupIndex]) {
          filtered[groupIndex]!.splice(taskIndex, 0, '__placeholder__');
        } else {
          filtered.splice(groupIndex, 0, ['__placeholder__']);
        }

        return filtered;
      }

      // Case 2: This stage is the SOURCE stage and target is a different stage
      // Remove the dragged task so the stage height shrinks
      if (
        dragState.sourceStageId === id &&
        dragState.targetStageId !== id
      ) {
        const tempTaskIds = taskIds.map((g) => [...g]);

        // Remove dragged task from this stage
        for (let gi = 0; gi < tempTaskIds.length; gi++) {
          const group = tempTaskIds[gi];
          if (!group) continue;
          const idx = group.indexOf(dragState.taskId);
          if (idx !== -1) {
            group.splice(idx, 1);
          }
        }

        return tempTaskIds.filter((g) => g && g.length > 0);
      }
    }
    return taskIds;
  }, [taskIds, dragState, id]);

  // Get task nodes to build execution data for height calculation
  const taskNodes = useStore((state) =>
    state.nodes.filter((n) => n.type === 'task' && n.parentId === id)
  );

  // Build task execution data record from task nodes
  const taskExecutionData = useMemo(() => {
    const data: Record<string, { execution?: Record<string, unknown> }> = {};
    for (const node of taskNodes) {
      data[node.id] = { execution: node.data?.execution as Record<string, unknown> | undefined };
    }
    return data;
  }, [taskNodes]);

  // Parallel groups for brackets - recalculates with placeholder included
  const parallelGroups = useMemo(() => {
    const hasStageExecution = !!stageDuration;

    return displayTaskIds
      .map((group, index) => {
        const isParallel = group.length > 1;
        if (!isParallel) return null;

        const y = calculateParallelGroupY(
          index,
          displayTaskIds,
          hasStageExecution,
          taskExecutionData
        );
        const height = calculateParallelGroupHeight(group, taskExecutionData);

        return {
          index,
          y,
          height,
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);
  }, [displayTaskIds, stageDuration, taskExecutionData]);

  // Calculate content height based on displayTaskIds (includes placeholder during drag, updates when tasks added)
  const contentHeight = useMemo(() => {
    if (displayTaskIds.length === 0) return 60; // Minimum height for empty state

    // Pass taskNodes and stage execution - calculateStageContentHeight will extract execution data
    return calculateStageContentHeight(displayTaskIds, taskNodes);
  }, [displayTaskIds, taskNodes, execution]);

  return (
    <TaskNodeProvider value={taskNodeContextValue}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Stage node click handling */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Stage node interactions */}
      <div
        data-testid={`stage-${id}`}
        style={{ position: 'relative', ...taskWidthStyle }}
        onClick={handleStageClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Render parallel brackets outside StageContainer to align with React Flow TaskNodes */}
        {parallelGroups.map(({ index, y, height }) => {
          // y is absolute from stage top, no need to subtract anything
          // Bracket and tasks are both positioned relative to this outer div
          const absoluteY = y;
          const absoluteX =
            DEFAULT_TASK_POSITION_CONFIG.contentPaddingX +
            DEFAULT_TASK_POSITION_CONFIG.parallelIndent;

          // Bracket Row positioning:
          // Tasks at x=40, Row gap=12px, bracket width=4px, bracket margin-left=12px
          // So Row left = 40 - 12 - 4 - 12 = 12px
          const bracketX = absoluteX - 12 - 4 - 12;

          return (
            <Row
              key={`parallel-${index}`}
              gap={Spacing.SpacingS}
              style={{
                position: 'absolute',
                top: absoluteY,
                left: bracketX,
                height: height,
                pointerEvents: 'none',
                zIndex: 1, // Above StageContainer but below TaskNodes
              }}
            >
              <StageParallelBracket />
              {/* Create a positioned container for the label to attach to */}
              <div style={{ position: 'relative', width: 0, height: '100%' }}>
                <StageParallelLabel>
                  <ApTypography variant={FontVariantToken.fontSizeS}>Parallel</ApTypography>
                </StageParallelLabel>
              </div>
            </Row>
          );
        })}

        {/* Drop placeholder now rendered as React Flow node in the hook */}

        <StageContainer
          selected={selected}
          status={status}
          width={width}
          style={{
            minHeight:
              contentHeight +
              (execution?.stageStatus?.duration
                ? DEFAULT_TASK_POSITION_CONFIG.headerHeight +
                  DEFAULT_TASK_POSITION_CONFIG.headerExecutionDescriptionHeight
                : DEFAULT_TASK_POSITION_CONFIG.headerHeight) +
              DEFAULT_TASK_POSITION_CONFIG.stageBorderThickness * 2, // header (dynamic) + content + borders
          }}
        >
          <StageHeader isException={isException}>
            <Row gap={Spacing.SpacingMicro} align="center">
              {icon}
              <Column py={2}>
                <ApTypography
                  variant={
                    isStageTitleEditing
                      ? FontVariantToken.fontSizeM
                      : FontVariantToken.fontSizeMBold
                  }
                  color="var(--uix-canvas-foreground)"
                >
                  <ApTooltip content={label} placement="top" delay>
                    <StageTitleContainer isEditing={isStageTitleEditing}>
                      <StageTitleInput
                        name="Stage Title"
                        isStageTitleEditable={isStageTitleEditable}
                        value={label}
                        ref={stageTitleRef}
                        isEditing={isStageTitleEditing}
                        {...(onStageTitleChange && {
                          onFocus: () => setIsStageTitleEditing(true),
                          onInput: handleStageTitleChange,
                          onKeyDown: handleStageTitleKeyDown,
                          onBlur: handleStageTitleBlurToSave,
                        })}
                        readOnly={!isStageTitleEditable}
                      />
                    </StageTitleContainer>
                  </ApTooltip>
                </ApTypography>
                {stageDuration && (
                  <ApTypography
                    variant={FontVariantToken.fontSizeS}
                    color="var(--uix-canvas-foreground-de-emp)"
                  >
                    {stageDuration}
                  </ApTypography>
                )}
              </Column>
            </Row>
            <Row
              gap={Spacing.SpacingMicro}
              align={isReadOnly ? 'start' : 'center'}
              py={Padding.PadS}
            >
              {status && (
                <ApTooltip content={statusLabel} placement="top">
                  <ApIconButton size="small">
                    <ExecutionStatusIcon status={status} size={20} />
                  </ApIconButton>
                </ApTooltip>
              )}
              {(onTaskAdd || onAddTaskFromToolbox) && !isReadOnly && (
                <ApTooltip content={addTaskLoading ? 'Loading...' : addTaskLabel} placement="top">
                  <span>
                    <ApIconButton
                      onClick={handleTaskAddClick}
                      size="small"
                      disabled={addTaskLoading}
                      label={addTaskLabel}
                    >
                      {addTaskLoading ? (
                        <ApCircularProgress size={20} />
                      ) : (
                        <ApIcon name="add" size="20px" />
                      )}
                    </ApIconButton>
                  </span>
                </ApTooltip>
              )}
            </Row>
          </StageHeader>

          <StageContent>
            {!displayTaskIds || displayTaskIds.length === 0 ? (
              <Column py={2}>
                {(onTaskAdd || onAddTaskFromToolbox) && !isReadOnly ? (
                  <ApLink
                    onClick={addTaskLoading ? undefined : handleTaskAddClick}
                    variant={FontVariantToken.fontSizeS}
                    style={{
                      maxWidth: 'fit-content',
                      pointerEvents: addTaskLoading ? 'none' : undefined,
                    }}
                  >
                    {defaultContent}
                  </ApLink>
                ) : (
                  <ApTypography
                    variant={FontVariantToken.fontSizeS}
                    color="var(--uix-canvas-foreground-de-emp)"
                  >
                    {defaultContent}
                  </ApTypography>
                )}
              </Column>
            ) : (
              <StageTaskList className="nodrag nopan">
                {/* Task nodes render themselves via React Flow parentId relationship */}
                {/* Brackets are rendered outside StageContainer to align with TaskNodes */}
              </StageTaskList>
            )}
          </StageContent>
        </StageContainer>

        <FloatingCanvasPanel open={toolboxMode !== null} nodeId={id} offset={15}>
          <Toolbox
            title={toolboxMode === 'replace' ? replaceTaskLabel : addTaskLabel}
            initialItems={taskOptions}
            onClose={handleToolboxClose}
            onItemSelect={handleToolboxItemSelected}
            onSearch={onTaskToolboxSearch}
          />
        </FloatingCanvasPanel>

        {menuItems && !dragging && (
          <NodeContextMenu menuItems={menuItems} isVisible={shouldShowMenu} />
        )}

        {handleElements}
      </div>
    </TaskNodeProvider>
  );
};

export const StageNode = memo(StageNodeComponent);
