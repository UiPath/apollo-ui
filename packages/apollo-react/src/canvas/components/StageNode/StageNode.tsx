import { memo, useMemo, useState, useCallback } from "react";
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
} from "./StageNode.styles";
import { StageHandle } from "./StageHandle";
import { NodeContextMenu } from "../NodeContextMenu";
import type { StageNodeProps, StageTaskExecution } from "./StageNode.types";
import { ApBadge, ApIcon, ApLink, ApTooltip, ApTypography } from "@uipath/portal-shell-react";
import { Column, FontVariantToken, Row } from "@uipath/uix/core";
import { ExecutionStatusIcon } from "../ExecutionStatusIcon";
import { Spacing } from "@uipath/apollo-core";

const ProcessNodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

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
    onTaskRemove,
  } = props;

  const label = stageDetails?.label;
  const isException = stageDetails?.isException;
  const icon = stageDetails?.icon;
  const tasks = stageDetails?.tasks;
  const sla = stageDetails?.sla;
  const escalation = stageDetails?.escalation;

  const status = execution?.stageStatus?.status;
  const statusLabel = execution?.stageStatus?.label;
  const stageDuration = execution?.stageStatus?.duration;

  const [isHovered, setIsHovered] = useState(false);
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

  const handleTaskRemove = useCallback(
    (event: React.MouseEvent, groupIndex: number, taskIndex: number) => {
      event.stopPropagation();
      onTaskRemove?.(groupIndex, taskIndex);
    },
    [onTaskRemove]
  );

  return (
    <div style={{ position: "relative" }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <StageContainer selected={selected} status={status} isException={isException}>
        <StageHeader isException={isException}>
          <Row gap={Spacing.SpacingMicro} align="center">
            {icon}
            <Column>
              <ApTypography variant={FontVariantToken.fontSizeMBold} color="var(--color-foreground)">
                {label}
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
                          {onTaskRemove && (
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
