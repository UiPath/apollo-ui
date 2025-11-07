import { memo, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useStore, Position } from "@uipath/uix/xyflow/react";
import {
  StageContainer,
  StageHeader,
  StageContent,
  StageTaskList,
  StageTaskGroup,
  StageTask,
  StageTaskIcon,
  StageParallelLabel,
  StageParallelBracket,
  StageTaskRetryDuration,
  StageTaskRemoveButton,
  StageTitleContainer,
  StageTitleInput,
} from "./StageNode.styles";
import { NodeContextMenu } from "../NodeContextMenu";
import { GroupModificationType, type StageNodeProps, type StageTaskExecution } from "./StageNode.types";
import { ApBadge, ApIcon, ApLink, ApTooltip, ApTypography } from "@uipath/portal-shell-react";
import { Column, FontVariantToken, Row } from "@uipath/uix/core";
import { ExecutionStatusIcon } from "../ExecutionStatusIcon";
import { Spacing } from "@uipath/apollo-core";
import { TaskContextMenu } from "./TaskContextMenu";
import { getContextMenuItems } from "./StageNodeTaskUtilities";
import { useButtonHandles } from "../ButtonHandle/useButtonHandles";
import type { HandleConfiguration } from "../BaseNode/BaseNode.types";
import { useNodeSelection } from "../NodePropertiesPanel/hooks";
import { FloatingCanvasPanel } from "../FloatingCanvasPanel";
import { type ListItem, Toolbox } from "../Toolbox";

const ProcessNodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

interface TaskStateReference {
  anchor: React.RefObject<HTMLDivElement>;
  isParallel: boolean;
  groupIndex: number;
  taskIndex: number;
}

const StageNodeComponent = (props: StageNodeProps) => {
  const {
    dragging,
    selected,
    id,
    execution,
    stageDetails,
    addTaskLabel = "Add task",
    taskOptions = [],
    menuItems,
    onStageClick,
    onTaskAdd,
    onAddTaskFromToolbox,
    onTaskToolboxSearch,
    onTaskClick,
    onTaskGroupModification,
    onStageTitleChange,
  } = props;

  const tasks = stageDetails?.tasks || [];
  const isException = stageDetails?.isException;
  const icon = stageDetails?.icon;
  const sla = stageDetails?.sla;
  const slaBreached = stageDetails?.slaBreached;
  const escalation = stageDetails?.escalation;
  const escalationsTriggered = stageDetails?.escalationsTriggered;
  const selectedTasks = stageDetails?.selectedTasks;

  const status = execution?.stageStatus?.status;
  const statusLabel = execution?.stageStatus?.label;
  const stageDuration = execution?.stageStatus?.duration;
  const reGroupTaskFunction = useMemo(() => onTaskGroupModification || (() => {}), [onTaskGroupModification]);

  const isStageTitleEditable = !!onStageTitleChange;

  const [isHovered, setIsHovered] = useState(false);
  const [label, setLabel] = useState(props.stageDetails.label);

  useEffect(() => {
    setLabel(props.stageDetails.label);
  }, [props.stageDetails.label]);

  const [isStageTitleEditing, setIsStageTitleEditing] = useState(false);
  const stageTitleRef = useRef<HTMLInputElement>(null);
  const [taskStateReference, setTaskStateReference] = useState<TaskStateReference>({
    anchor: useRef<HTMLDivElement>(null),
    isParallel: false,
    groupIndex: -1,
    taskIndex: -1,
  });
  const [isTaskContextMenuVisible, setIsTaskContextMenuVisible] = useState<boolean>(false);
  const { edges, isConnecting } = useStore(
    (state) => ({ edges: state.edges, isConnecting: !!state.connectionClickStartHandle }),
    (a, b) => a.edges === b.edges && a.isConnecting === b.isConnecting
  );

  const [isAddingTask, setIsAddingTask] = useState(false);
  useEffect(() => {
    if (selected === false) setIsAddingTask(false);
  }, [selected]);

  const hasConnections = useMemo(() => edges?.some((edge) => edge.source === id || edge.target === id) ?? false, [edges, id]);

  const shouldShowHandles = useMemo(() => {
    return selected || isHovered || isConnecting || hasConnections;
  }, [hasConnections, isConnecting, selected, isHovered]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const shouldShowMenu = useMemo(() => {
    return menuItems && menuItems.length > 0 && (selected || isHovered);
  }, [menuItems, selected, isHovered]);

  const generateBadgeText = useCallback((taskExecution: StageTaskExecution) => {
    if (!taskExecution.badge) {
      return undefined;
    }
    if (taskExecution.retryCount && taskExecution.retryCount > 1) {
      return `${taskExecution.badge} x${taskExecution.retryCount}`;
    }
    return taskExecution.badge;
  }, []);

  const handleStageTitleChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    setIsStageTitleEditing(true);
    setLabel((e.target as HTMLInputElement).value);
  }, []);

  const handleStageTitleClickToSave = useCallback(
    (e: React.FocusEvent | MouseEvent) => {
      if (isStageTitleEditing && !stageTitleRef.current?.contains(e.target as Node)) {
        setIsStageTitleEditing(false);
        if (onStageTitleChange) {
          if (label.trim() === "") setLabel("Untitled Stage");
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
        if (label.trim() === "") setLabel("Untitled Stage");
        onStageTitleChange(label);
      }
    }
  }, [isStageTitleEditing, onStageTitleChange, label]);

  const handleStageTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        setIsStageTitleEditing(false);
        if (onStageTitleChange) {
          onStageTitleChange(label);
        }
      }
    },
    [onStageTitleChange, label]
  );

  const handleTaskContextMenuOpen = useCallback(
    (isParallel: boolean, groupIndex: number, taskIndex: number, e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsTaskContextMenuVisible(true);
      setTaskStateReference({ anchor: { current: e.currentTarget }, isParallel, groupIndex, taskIndex });
    },
    [setIsTaskContextMenuVisible, setTaskStateReference]
  );

  const handleTaskContextMenuClose = useCallback(() => {
    setIsTaskContextMenuVisible(false);
  }, [setIsTaskContextMenuVisible]);

  useEffect(() => {
    if (isTaskContextMenuVisible) {
      document.addEventListener("click", handleTaskContextMenuClose);
      document.addEventListener("keydown", handleTaskContextMenuClose);
    }
    if (isStageTitleEditing) {
      document.addEventListener("click", handleStageTitleClickToSave);
    }
    return () => {
      document.removeEventListener("click", handleStageTitleClickToSave);
      document.removeEventListener("click", handleTaskContextMenuClose);
      document.removeEventListener("keydown", handleTaskContextMenuClose);
    };
  }, [handleTaskContextMenuClose, isTaskContextMenuVisible, handleStageTitleClickToSave, isStageTitleEditing]);

  const contextMenuItems = useCallback(
    (tasksLength: number, taskGroupLength: number, isAboveParallel: boolean, isBelowParallel: boolean) =>
      getContextMenuItems(
        taskStateReference.isParallel,
        taskStateReference.groupIndex,
        tasksLength,
        taskStateReference.taskIndex,
        taskGroupLength,
        isAboveParallel,
        isBelowParallel,
        reGroupTaskFunction
      ),
    [taskStateReference.isParallel, taskStateReference.groupIndex, taskStateReference.taskIndex, reGroupTaskFunction]
  );

  const handleTaskRemove = useCallback(
    (event: React.MouseEvent, groupIndex: number, taskIndex: number) => {
      event.stopPropagation();
      reGroupTaskFunction(GroupModificationType.REMOVE_TASK, groupIndex, taskIndex);
    },
    [reGroupTaskFunction]
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

  const handleTaskToolboxItemSelected = useCallback(
    (item: ListItem) => {
      onAddTaskFromToolbox?.(item);
      setIsAddingTask(false);
      setSelectedNodeId(id);
    },
    [onAddTaskFromToolbox, setSelectedNodeId, id]
  );

  const handleConfigurations: HandleConfiguration[] = isException
    ? []
    : [
        {
          position: Position.Left,
          handles: [
            {
              id: `${id}____target____left`,
              type: "target",
              handleType: "input",
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
              type: "source",
              handleType: "output",
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
              type: "target",
              handleType: "input",
            },
          ],
          visible: selected || isHovered || isConnecting,
        },
        {
          position: Position.Bottom,
          handles: [
            {
              id: `${id}____source____bottom`,
              type: "source",
              handleType: "output",
            },
          ],
          visible: selected || isHovered || isConnecting,
        },
      ];
  const handleElements = useButtonHandles({ handleConfigurations, shouldShowHandles, edges, nodeId: id, selected });

  return (
    <div
      data-testid={`stage-${id}`}
      style={{ position: "relative" }}
      onClick={handleStageClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <StageContainer selected={selected} status={status} isException={isException}>
        <StageHeader isException={isException}>
          <Row gap={Spacing.SpacingMicro} align="center">
            {icon}
            <Column>
              <ApTypography
                variant={isStageTitleEditing ? FontVariantToken.fontSizeM : FontVariantToken.fontSizeMBold}
                color="var(--color-foreground)"
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
                <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
                  {stageDuration}
                </ApTypography>
              )}
            </Column>
          </Row>
          <Row gap={Spacing.SpacingXs} align="center">
            {status && (
              <Row gap={statusLabel ? Spacing.SpacingMicro : undefined} align="center">
                <ExecutionStatusIcon status={status} />
                <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
                  {statusLabel}
                </ApTypography>
              </Row>
            )}
            {sla && (
              <ApTooltip content={sla} placement="top">
                <ApIcon
                  variant="outlined"
                  name="timer"
                  color={slaBreached ? "var(--color-error-icon)" : "var(--color-foreground-de-emp)"}
                />
              </ApTooltip>
            )}
            {escalation && (
              <ApTooltip content={escalation} placement="top">
                <ApIcon
                  variant="outlined"
                  name="notifications"
                  color={escalationsTriggered ? "var(--color-success-icon)" : "var(--color-foreground-de-emp)"}
                />
              </ApTooltip>
            )}
          </Row>
        </StageHeader>

        <StageContent>
          {(onTaskAdd || onAddTaskFromToolbox) && (
            <Row pl={"2px"}>
              <ApLink onClick={handleTaskAddClick}>{addTaskLabel}</ApLink>
            </Row>
          )}

          {tasks && tasks.length > 0 && (
            <StageTaskList>
              {tasks.map((taskGroup, groupIndex) => {
                const isParallel = taskGroup.length > 1;
                return (
                  <StageTaskGroup key={`group-${groupIndex}`} isParallel={isParallel}>
                    {isParallel && (
                      <>
                        <StageParallelLabel>Parallel</StageParallelLabel>
                        <StageParallelBracket />
                      </>
                    )}
                    {taskGroup.map((task, taskIndex) => {
                      const taskExecution = execution?.taskStatus?.[task.id];
                      return (
                        <StageTask
                          key={task.id}
                          data-testid={`task-${task.id}`}
                          selected={!!selectedTasks?.includes(task.id)}
                          status={taskExecution?.status}
                          onClick={(e) => handleTaskClick(e, task.id)}
                          {...(onTaskGroupModification && {
                            onContextMenu: (e) => handleTaskContextMenuOpen(isParallel, groupIndex, taskIndex, e),
                          })}
                        >
                          <StageTaskIcon>{task.icon ?? <ProcessNodeIcon />}</StageTaskIcon>
                          <Column flex={1} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <Row align="center" justify="space-between">
                              <ApTooltip content={task.label} placement="top" delay>
                                <ApTypography
                                  variant={FontVariantToken.fontSizeM}
                                  color="var(--color-foreground)"
                                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                >
                                  {task.label}
                                </ApTypography>
                              </ApTooltip>
                              {taskExecution?.status &&
                                (taskExecution.message ? (
                                  <ApTooltip content={taskExecution.message} placement="top">
                                    <ExecutionStatusIcon status={taskExecution.status} />
                                  </ApTooltip>
                                ) : (
                                  <ExecutionStatusIcon status={taskExecution.status} />
                                ))}
                            </Row>
                            <Row align="center" justify="space-between">
                              <Row gap={"2px"}>
                                {taskExecution?.duration && (
                                  <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
                                    {taskExecution.duration}
                                  </ApTypography>
                                )}
                                {taskExecution?.retryDuration && (
                                  <StageTaskRetryDuration status={taskExecution.badgeStatus ?? "warning"}>
                                    <ApTypography variant={FontVariantToken.fontSizeS} color="inherit">
                                      {`(+${taskExecution.retryDuration})`}
                                    </ApTypography>
                                  </StageTaskRetryDuration>
                                )}
                              </Row>
                              {taskExecution?.badge && (
                                <ApBadge
                                  size="small"
                                  status={taskExecution.badgeStatus ?? "warning"}
                                  label={generateBadgeText(taskExecution)}
                                />
                              )}
                            </Row>
                          </Column>
                          <TaskContextMenu
                            isVisible={
                              isTaskContextMenuVisible &&
                              taskStateReference.groupIndex === groupIndex &&
                              taskStateReference.taskIndex === taskIndex
                            }
                            menuItems={contextMenuItems(
                              tasks.length,
                              taskGroup.length,
                              (tasks[groupIndex - 1]?.length ?? 0) > 1,
                              (tasks[groupIndex + 1]?.length ?? 0) > 1
                            )}
                            refTask={taskStateReference.anchor}
                          />
                          {onTaskGroupModification && (
                            <StageTaskRemoveButton
                              className="task-remove-button"
                              data-testid={`task-remove-${task.id}`}
                              onClick={(event) => handleTaskRemove(event, groupIndex, taskIndex)}
                            >
                              <ApIcon name="close" size="16px" />
                            </StageTaskRemoveButton>
                          )}
                        </StageTask>
                      );
                    })}
                  </StageTaskGroup>
                );
              })}
            </StageTaskList>
          )}
        </StageContent>
      </StageContainer>

      {onAddTaskFromToolbox && (
        <FloatingCanvasPanel open={isAddingTask} nodeId={id} offset={10}>
          <Toolbox
            title={addTaskLabel}
            initialItems={taskOptions}
            onClose={() => setIsAddingTask(false)}
            onItemSelect={handleTaskToolboxItemSelected}
            onSearch={onTaskToolboxSearch}
          />
        </FloatingCanvasPanel>
      )}

      {menuItems && !dragging && <NodeContextMenu menuItems={menuItems} isVisible={shouldShowMenu} />}

      {handleElements}
    </div>
  );
};

export const StageNode = memo(StageNodeComponent);
