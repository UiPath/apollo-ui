import { memo, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useStore, Position } from "@uipath/uix/xyflow/react";
import {
  StageContainer,
  StageHeader,
  StageContent,
  StageTaskList,
  StageTaskGroup,
  StageTaskItem,
  StageTaskIcon,
  StageParallelLabel,
  StageParallelBracket,
  StageTaskRetryDuration,
  StageTaskRemoveButton,
  StageTitleContainer,
  StageTitleInput,
} from "./StageNode.styles";
import { StageHandle } from "./StageHandle";
import { NodeContextMenu } from "../NodeContextMenu";
import { GroupModificationType, type StageNodeProps, type StageTaskExecution } from "./StageNode.types";
import { ApBadge, ApIcon, ApLink, ApTooltip, ApTypography } from "@uipath/portal-shell-react";
import { Column, FontVariantToken, Row } from "@uipath/uix/core";
import { ExecutionStatusIcon } from "../ExecutionStatusIcon";
import { Spacing } from "@uipath/apollo-core";
import { TaskContextMenu } from "./TaskContextMenu";
import { getContextMenuItems } from "./StageNodeTaskUtilities";

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
    menuItems,
    onTaskAdd,
    onTaskClick,
    onTaskGroupModification,
    onStageTitleChange,
  } = props;

  const label = props.stageDetails.label;
  const tasks = stageDetails?.tasks || [];
  const isException = stageDetails?.isException;
  const icon = stageDetails?.icon;
  const sla = stageDetails?.sla;
  const escalation = stageDetails?.escalation;

  const status = execution?.stageStatus?.status;
  const statusLabel = execution?.stageStatus?.label;
  const stageDuration = execution?.stageStatus?.duration;
  const reGroupTaskFunction = useMemo(() => onTaskGroupModification || (() => {}), [onTaskGroupModification]);

  const [isHovered, setIsHovered] = useState(false);
  const [localLabel, setLocalLabel] = useState(label);
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

  const handleStageTitleChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (onStageTitleChange) {
        setIsStageTitleEditing(true);
        setLocalLabel((e.target as HTMLInputElement).value);
      }
    },
    [onStageTitleChange]
  );

  const handleStageTitleClickToSave = useCallback(
    (e: React.FocusEvent | MouseEvent) => {
      if (isStageTitleEditing && !stageTitleRef.current?.contains(e.target as Node)) {
        setIsStageTitleEditing(false);
        if (onStageTitleChange && localLabel !== label) {
          if (localLabel.trim() === "") setLocalLabel("Untilted Stage");
          onStageTitleChange(localLabel);
        }
      }
    },
    [isStageTitleEditing, onStageTitleChange, localLabel, label]
  );

  const handleStageTitleBlurToSave = useCallback(() => {
    if (isStageTitleEditing) {
      setIsStageTitleEditing(false);
      if (onStageTitleChange && localLabel !== label) {
        if (localLabel.trim() === "") setLocalLabel("Untilted Stage");
        onStageTitleChange(localLabel);
      }
    }
  }, [isStageTitleEditing, onStageTitleChange, localLabel, label]);

  const handleStageTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        setIsStageTitleEditing(false);
        if (onStageTitleChange && localLabel !== label) {
          onStageTitleChange(localLabel);
        }
      }
    },
    [onStageTitleChange, localLabel, label]
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

  const contextMenuItems = useMemo(
    () =>
      getContextMenuItems(taskStateReference.isParallel, taskStateReference.groupIndex, taskStateReference.taskIndex, reGroupTaskFunction),
    [taskStateReference.isParallel, taskStateReference.groupIndex, taskStateReference.taskIndex, reGroupTaskFunction]
  );

  const handleTaskRemove = useCallback(
    (event: React.MouseEvent, groupIndex: number, taskIndex: number) => {
      event.stopPropagation();
      reGroupTaskFunction(GroupModificationType.REMOVE_TASK, groupIndex, taskIndex);
    },
    [reGroupTaskFunction]
  );

  return (
    <div data-testid={`stage-${id}`} style={{ position: "relative" }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <StageContainer selected={selected} status={status} isException={isException}>
        <StageHeader isException={isException}>
          <Row gap={Spacing.SpacingMicro} align="center">
            {icon}
            <Column>
              <ApTypography
                variant={isStageTitleEditing ? FontVariantToken.fontSizeM : FontVariantToken.fontSizeMBold}
                color="var(--color-foreground)"
              >
                <ApTooltip content={label} placement="top">
                  <StageTitleContainer isEditing={isStageTitleEditing}>
                    <StageTitleInput
                      name="Stage Title"
                      value={localLabel}
                      ref={stageTitleRef}
                      isEditing={isStageTitleEditing}
                      onFocus={() => setIsStageTitleEditing(true)}
                      onInput={handleStageTitleChange}
                      onKeyDown={handleStageTitleKeyDown}
                      onBlur={handleStageTitleBlurToSave}
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
          <Row gap={Spacing.SpacingMicro} align="center">
            {status && (
              <Row gap={Spacing.SpacingMicro} align="center">
                <ExecutionStatusIcon status={status} />
                <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
                  {statusLabel}
                </ApTypography>
              </Row>
            )}
            {sla && (
              <ApTooltip content={sla} placement="top">
                <ApIcon variant="outlined" name="timer" color="var(--color-foreground-de-emp)" />
              </ApTooltip>
            )}
            {escalation && (
              <ApTooltip content={escalation} placement="top">
                <ApIcon variant="outlined" name="notifications" color="var(--color-foreground-de-emp)" />
              </ApTooltip>
            )}
          </Row>
        </StageHeader>

        <StageContent>
          {onTaskAdd && <ApLink onClick={onTaskAdd}>{addTaskLabel}</ApLink>}

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
                        <StageTaskItem
                          key={task.id}
                          status={taskExecution?.status}
                          onClick={onTaskClick ? () => onTaskClick(task.id) : undefined}
                          onContextMenu={(e) => handleTaskContextMenuOpen(isParallel, groupIndex, taskIndex, e)}
                        >
                          <StageTaskIcon>{task.icon ?? <ProcessNodeIcon />}</StageTaskIcon>
                          <Column flex={1} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <Row align="center" justify="space-between">
                              <ApTooltip content={task.label} placement="top">
                                <ApTypography
                                  variant={FontVariantToken.fontSizeM}
                                  color="var(--color-foreground)"
                                  style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                >
                                  {task.label}
                                </ApTypography>
                              </ApTooltip>
                              {taskExecution?.status && <ExecutionStatusIcon status={taskExecution.status} />}
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
                                    <ApTypography variant={FontVariantToken.fontSizeS}>{`(+${taskExecution.retryDuration})`}</ApTypography>
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
                            menuItems={contextMenuItems}
                            refTask={taskStateReference.anchor}
                          />
                          {onTaskGroupModification && (
                            <StageTaskRemoveButton
                              className="task-remove-button"
                              onClick={(event) => handleTaskRemove(event, groupIndex, taskIndex)}
                            >
                              <ApIcon name="close" size="16px" />
                            </StageTaskRemoveButton>
                          )}
                        </StageTaskItem>
                      );
                    })}
                  </StageTaskGroup>
                );
              })}
            </StageTaskList>
          )}
        </StageContent>
      </StageContainer>

      {menuItems && !dragging && <NodeContextMenu menuItems={menuItems} isVisible={shouldShowMenu} />}

      {!isException && (
        <>
          <StageHandle id={id} type="target" position={Position.Left} isVisible={shouldShowHandles} />
          <StageHandle id={id} type="source" position={Position.Right} isVisible={shouldShowHandles} />
          <StageHandle id={id} type="target" position={Position.Bottom} isVisible={shouldShowHandles} />
          <StageHandle id={id} type="source" position={Position.Bottom} isVisible={shouldShowHandles} />
        </>
      )}
    </div>
  );
};

export const StageNode = memo(StageNodeComponent);
