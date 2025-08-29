import { memo, useMemo, useState, useCallback } from "react";
import { useStore, Position } from "@xyflow/react";
import {
  StageContainer,
  StageHeader,
  StageHeaderContent,
  StageContent,
  StageProcessList,
  StageProcessGroup,
  StageProcessItem,
  StageProcessIcon,
  StageProcessLabel,
  StageParallelLabel,
  StageParallelBracket,
} from "./StageNode.styles";
import { StageHandle } from "./StageHandle";
import { NodeContextMenu } from "../NodeContextMenu";
import type { StageNodeProps } from "./StageNode.types";
import { ApBadge, ApLink, ApTypography } from "@uipath/portal-shell-react";
import { Column, FontVariantToken, Row, Spacing } from "@uipath/uix-core";
import { ExecutionStatusIcon } from "../ExecutionStatusIcon";

const ProcessNodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const StageNodeComponent = (props: StageNodeProps) => {
  const { data, dragging, selected, id, execution, addProcessLabel = "+ Add task", menuItems, onAddProcess } = props;
  const { label, tasks = [] } = data;

  const status = execution?.stageStatus;
  const statusLabel = execution?.stageStatusLabel;

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
  const handleAddProcess = useCallback(() => onAddProcess?.(), [onAddProcess]);

  const shouldShowMenu = useMemo(() => {
    return menuItems && menuItems.length > 0 && (selected || isHovered);
  }, [menuItems, selected, isHovered]);

  return (
    <div style={{ position: "relative" }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <StageContainer selected={selected} status={status}>
        <StageHeader>
          <StageHeaderContent>
            <ApTypography variant={FontVariantToken.fontSizeMBold}>{label}</ApTypography>
          </StageHeaderContent>
          {status && (
            <Row gap={Spacing.SpacingMicro} align="center">
              <ExecutionStatusIcon status={status} />
              <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
                {statusLabel}
              </ApTypography>
            </Row>
          )}
        </StageHeader>

        <StageContent>
          {!status && <ApLink onClick={handleAddProcess}>{addProcessLabel}</ApLink>}

          {tasks && tasks.length > 0 && (
            <StageProcessList>
              {tasks.map((taskGroup, groupIndex) => {
                const isParallel = taskGroup.length > 1;
                return (
                  <StageProcessGroup key={`group-${groupIndex}`} isParallel={isParallel}>
                    {isParallel && (
                      <>
                        <StageParallelLabel>Parallel</StageParallelLabel>
                        <StageParallelBracket />
                      </>
                    )}
                    {taskGroup.map((task) => {
                      const taskExecution = execution?.taskStatus?.[task.id];
                      return (
                        <StageProcessItem key={task.id} status={taskExecution?.status}>
                          <StageProcessIcon>
                            <ProcessNodeIcon />
                          </StageProcessIcon>
                          <Column flex={1} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <StageProcessLabel>{task.label}</StageProcessLabel>
                            <Row gap={Spacing.SpacingMicro}>
                              {taskExecution?.duration && (
                                <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
                                  {taskExecution.duration}
                                </ApTypography>
                              )}
                              {taskExecution?.badge && <ApBadge size="small" status="warning" label={taskExecution.badge} />}
                            </Row>
                          </Column>
                          {taskExecution?.status && <ExecutionStatusIcon status={taskExecution.status} />}
                        </StageProcessItem>
                      );
                    })}
                  </StageProcessGroup>
                );
              })}
            </StageProcessList>
          )}
        </StageContent>

        {menuItems && !dragging && <NodeContextMenu menuItems={menuItems} isVisible={shouldShowMenu} />}
      </StageContainer>
      <StageHandle id="input" type="target" position={Position.Left} isVisible={shouldShowHandles} />
      <StageHandle id="output" type="source" position={Position.Right} isVisible={shouldShowHandles} />
    </div>
  );
};

export const StageNode = memo(StageNodeComponent);
