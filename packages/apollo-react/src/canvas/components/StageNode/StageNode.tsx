import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FontVariantToken, Padding, Spacing } from '@uipath/apollo-core';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { Position, useStore, useViewport } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  ApCircularProgress,
  ApIcon,
  ApIconButton,
  ApLink,
  ApTooltip,
  ApTypography,
} from '@uipath/apollo-react/material';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';
import { ExecutionStatusIcon } from '../ExecutionStatusIcon';
import { FloatingCanvasPanel } from '../FloatingCanvasPanel';
import { NodeContextMenu, type NodeMenuItem } from '../NodeContextMenu';
import { useNodeSelection } from '../NodePropertiesPanel/hooks';
import { type ListItem, Toolbox } from '../Toolbox';
import { DraggableTask, TaskContent } from './DraggableTask';
import {
  INDENTATION_WIDTH,
  STAGE_CONTENT_INSET,
  StageContainer,
  StageContent,
  StageHeader,
  StageParallelBracket,
  StageParallelLabel,
  StageTask,
  StageTaskGroup,
  StageTaskList,
  StageTitleContainer,
  StageTitleInput,
} from './StageNode.styles';
import type { StageNodeProps } from './StageNode.types';
import { flattenTasks, getProjection, reorderTasks } from './StageNode.utils';
import { getContextMenuItems, getMenuItem } from './StageNodeTaskUtilities';

interface TaskStateReference {
  isParallel: boolean;
  groupIndex: number;
  taskIndex: number;
}

const StageNodeComponent = (props: StageNodeProps) => {
  const {
    dragging,
    selected,
    id,
    width,
    execution,
    stageDetails,
    addTaskLabel = 'Add task',
    addTaskLoading = false,
    replaceTaskLabel = 'Replace task',
    taskOptions = [],
    menuItems,
    onStageClick,
    onTaskAdd,
    onAddTaskFromToolbox,
    onTaskToolboxSearch,
    onTaskClick,
    onTaskGroupModification,
    onStageTitleChange,
    onTaskReorder,
    onTaskReplace,
  } = props;

  const taskWidth = width ? width - STAGE_CONTENT_INSET : undefined;

  const tasks = useMemo(() => stageDetails?.tasks || [], [stageDetails?.tasks]);
  const flatTasks = useMemo(() => tasks.flat(), [tasks]);
  const taskIds = useMemo(() => flatTasks.map((task) => task.id), [flatTasks]);

  const isException = stageDetails?.isException;
  const isReadOnly = !!stageDetails?.isReadOnly;
  const icon = stageDetails?.icon;
  const selectedTasks = stageDetails?.selectedTasks;
  const defaultContent = stageDetails?.defaultContent || 'Add first task';

  const status = execution?.stageStatus?.status;
  const statusLabel = execution?.stageStatus?.label;
  const stageDuration = execution?.stageStatus?.duration;
  const reGroupTaskFunction = useMemo(
    () => onTaskGroupModification || (() => {}),
    [onTaskGroupModification]
  );

  const isStageTitleEditable = !!onStageTitleChange && !isReadOnly;

  const [isHovered, setIsHovered] = useState(false);
  const [label, setLabel] = useState(props.stageDetails.label);

  useEffect(() => {
    setLabel(props.stageDetails.label);
  }, [props.stageDetails.label]);

  const [isStageTitleEditing, setIsStageTitleEditing] = useState(false);
  const stageTitleRef = useRef<HTMLInputElement>(null);
  const taskStateReference = useRef<TaskStateReference>({
    isParallel: false,
    groupIndex: -1,
    taskIndex: -1,
  });
  const isConnecting = useStore((state) => !!state.connectionClickStartHandle);
  const connectedHandleIds = useConnectedHandles(id);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isReplacingTask, setIsReplacingTask] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [offsetLeft, setOffsetLeft] = useState(0);
  const [overId, setOverId] = useState<string | null>(null);
  const activeTask = useMemo(
    () => flatTasks.find((t) => t.id === activeDragId),
    [flatTasks, activeDragId]
  );
  const isActiveTaskParallel = useMemo(() => {
    if (!activeDragId) {
      return false;
    }
    const group = tasks.find((g) => g.some((t) => t.id === activeDragId));
    return group ? group.length > 1 : false;
  }, [tasks, activeDragId]);

  const { zoom } = useViewport();

  const projected = useMemo(() => {
    if (!activeDragId || !overId) return null;
    return getProjection(tasks, activeDragId, overId, offsetLeft);
  }, [tasks, activeDragId, overId, offsetLeft]);

  useEffect(() => {
    if (selected === false) {
      setIsAddingTask(false);
      setIsReplacingTask(false);
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

  const handleStageTitleClickToSave = useCallback(
    (e: React.FocusEvent | MouseEvent) => {
      if (isStageTitleEditing && !stageTitleRef.current?.contains(e.target as Node)) {
        setIsStageTitleEditing(false);
        if (onStageTitleChange) {
          if (label.trim() === '') setLabel('Untitled Stage');
          onStageTitleChange(label);
        }
      }
    },
    [isStageTitleEditing, onStageTitleChange, label]
  );

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

  useEffect(() => {
    if (isStageTitleEditing) {
      document.addEventListener('click', handleStageTitleClickToSave);
    }
    return () => {
      document.removeEventListener('click', handleStageTitleClickToSave);
    };
  }, [handleStageTitleClickToSave, isStageTitleEditing]);

  const contextMenuItems = useCallback(
    (
      isParallel: boolean,
      groupIndex: number,
      taskIndex: number,
      tasksLength: number,
      taskGroupLength: number,
      isAboveParallel: boolean,
      isBelowParallel: boolean
    ) => {
      const items: NodeMenuItem[] = [];

      if (onTaskReplace) {
        items.push(getMenuItem('replace-task', 'Replace Task', () => setIsReplacingTask(true)));
      }

      if (onTaskGroupModification) {
        const reGroupOptions = getContextMenuItems(
          isParallel,
          groupIndex,
          tasksLength,
          taskIndex,
          taskGroupLength,
          isAboveParallel,
          isBelowParallel,
          reGroupTaskFunction
        );
        return [...items, ...reGroupOptions];
      }

      return items;
    },
    [onTaskReplace, onTaskGroupModification, reGroupTaskFunction]
  );

  const { setSelectedNodeId } = useNodeSelection();
  const handleStageClick = useCallback(() => {
    onStageClick?.();
  }, [onStageClick]);

  const handleTaskClick = useCallback(
    (e: React.MouseEvent, taskElementId: string) => {
      e.stopPropagation();
      onTaskClick?.(taskElementId);
      setSelectedNodeId(id);
    },
    [onTaskClick, setSelectedNodeId, id]
  );

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
      onTaskReplace?.(
        item,
        taskStateReference.current.groupIndex,
        taskStateReference.current.taskIndex
      );
      setIsReplacingTask(false);
      setSelectedNodeId(id);
    },
    [onTaskReplace, setSelectedNodeId, id]
  );

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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const resetState = useCallback(() => {
    setActiveDragId(null);
    setOffsetLeft(0);
    setOverId(null);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      setOffsetLeft(event.delta.x / zoom);
    },
    [zoom]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverId((event.over?.id as string) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const currentOffsetLeft = offsetLeft;
      resetState();

      if (!over || !onTaskReorder) {
        return;
      }

      const projection = getProjection(
        tasks,
        active.id as string,
        over.id as string,
        currentOffsetLeft
      );
      if (!projection) {
        return;
      }

      // For in-place movement, skip if depth hasn't changed
      if (active.id === over.id) {
        const flattened = flattenTasks(tasks);
        const activeTask = flattened.find((t) => t.id === active.id);
        if (activeTask && activeTask.depth === projection.depth) {
          return;
        }
      }

      const newTasks = reorderTasks(
        tasks,
        active.id as string,
        over.id as string,
        projection.depth
      );
      onTaskReorder(newTasks);
    },
    [tasks, onTaskReorder, offsetLeft, resetState]
  );

  const handleDragCancel = useCallback(() => {
    resetState();
  }, [resetState]);

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

  const dragOverlayStyle = useMemo<React.CSSProperties>(
    () => ({
      transform: `scale(${zoom})`,
      transformOrigin: 'top left',
    }),
    [zoom]
  );

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: moved over
    // biome-ignore lint/a11y/noStaticElementInteractions: moved over
    <div
      data-testid={`stage-${id}`}
      style={{ position: 'relative' }}
      onClick={handleStageClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <StageContainer selected={selected} status={status} width={width} style={taskWidthStyle}>
        <StageHeader isException={isException}>
          <Row gap={Spacing.SpacingMicro} align="center">
            {icon}
            <Column py={2}>
              <ApTypography
                variant={
                  isStageTitleEditing ? FontVariantToken.fontSizeM : FontVariantToken.fontSizeMBold
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
          <Row gap={Spacing.SpacingMicro} align={isReadOnly ? 'start' : 'center'} py={Padding.PadS}>
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
          {!tasks || tasks.length === 0 ? (
            <Column py={2}>
              {(onTaskAdd || onAddTaskFromToolbox) && !isReadOnly ? (
                <ApLink
                  onClick={addTaskLoading ? undefined : handleTaskAddClick}
                  variant={FontVariantToken.fontSizeS}
                  style={{ maxWidth: 'fit-content', pointerEvents: addTaskLoading ? 'none' : undefined }}
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
            <DndContext
              collisionDetection={closestCenter}
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                {/* Disable dragging and panning the canvas when dragging a task */}
                <StageTaskList className="nodrag nopan">
                  {tasks.map((taskGroup, groupIndex) => {
                    const isParallel = taskGroup.length > 1;
                    return (
                      <Row key={`group-${groupIndex}`} gap={Spacing.SpacingS}>
                        {isParallel && <StageParallelBracket />}
                        <StageTaskGroup isParallel={isParallel}>
                          {isParallel && (
                            <StageParallelLabel>
                              <ApTypography variant={FontVariantToken.fontSizeS}>
                                Parallel
                              </ApTypography>
                            </StageParallelLabel>
                          )}
                          {taskGroup.map((task, taskIndex) => {
                            const taskExecution = execution?.taskStatus?.[task.id];
                            return (
                              <DraggableTask
                                key={task.id}
                                task={task}
                                taskExecution={taskExecution}
                                isSelected={!!selectedTasks?.includes(task.id)}
                                isParallel={isParallel}
                                contextMenuItems={contextMenuItems(
                                  isParallel,
                                  groupIndex,
                                  taskIndex,
                                  tasks.length,
                                  taskGroup.length,
                                  (tasks[groupIndex - 1]?.length ?? 0) > 1,
                                  (tasks[groupIndex + 1]?.length ?? 0) > 1
                                )}
                                onTaskClick={handleTaskClick}
                                projectedDepth={
                                  task.id === activeDragId && projected
                                    ? projected.depth
                                    : undefined
                                }
                                isDragDisabled={!onTaskReorder}
                                zoom={zoom}
                                {...((onTaskGroupModification || onTaskReplace) && {
                                  onMenuOpen: () => {
                                    taskStateReference.current = {
                                      isParallel,
                                      groupIndex,
                                      taskIndex,
                                    };
                                  },
                                })}
                              />
                            );
                          })}
                        </StageTaskGroup>
                      </Row>
                    );
                  })}
                </StageTaskList>
              </SortableContext>
              {createPortal(
                <DragOverlay>
                  {activeTask ? (
                    <div style={dragOverlayStyle}>
                      <StageTask
                        selected
                        isParallel={isActiveTaskParallel}
                        style={{ cursor: 'grabbing', ...taskWidthStyle }}
                      >
                        <TaskContent task={activeTask} isDragging />
                      </StageTask>
                    </div>
                  ) : null}
                </DragOverlay>,
                document.body
              )}
            </DndContext>
          )}
        </StageContent>
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

      {onTaskReplace && (
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

      {handleElements}
    </div>
  );
};

export const StageNode = memo(StageNodeComponent);
