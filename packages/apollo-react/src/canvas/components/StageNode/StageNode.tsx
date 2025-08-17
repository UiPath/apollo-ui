import { memo, useMemo, useState, useCallback } from "react";
import { NodeProps, useStore, Position } from "@xyflow/react";
import {
  StageContainer,
  StageHeader,
  StageTitle,
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
import type { StageNodeData } from "./StageNode.types";
import { ApLink } from "@uipath/portal-shell-react";

const ProcessNodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const StageNodeComponent = (props: NodeProps & { data: StageNodeData }) => {
  const { data, selected, id } = props;
  const { title, processes = [], addProcessLabel = "Add process" } = data;

  // TODO: get execution status / state from store
  // const executionStatus = useExecutionStatus();
  const status = undefined;

  // TODO: get the menuItems for the stage
  const menuItems: any[] = [];

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

  // Handle add process click
  const handleAddProcess = useCallback(() => {
    // TODO: invoke action to add process to stage
  }, [id]);

  const shouldShowMenu = useMemo(() => {
    return menuItems && menuItems.length > 0 && (selected || isHovered);
  }, [menuItems, selected, isHovered]);

  return (
    <div style={{ position: "relative" }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <StageContainer selected={selected}>
        <StageHeader>
          <StageTitle>{title}</StageTitle>
        </StageHeader>

        <StageContent>
          <ApLink onClick={handleAddProcess}>{addProcessLabel}</ApLink>

          {processes.length > 0 && (
            <StageProcessList>
              {processes.map((processGroup, groupIndex) => {
                const isParallel = processGroup.length > 1;
                return (
                  <StageProcessGroup key={`group-${groupIndex}`} isParallel={isParallel}>
                    {isParallel && (
                      <>
                        <StageParallelLabel>Parallel</StageParallelLabel>
                        <StageParallelBracket />
                      </>
                    )}
                    {processGroup.map((process) => (
                      <StageProcessItem key={process.id} status={status}>
                        <StageProcessIcon>
                          <ProcessNodeIcon />
                        </StageProcessIcon>
                        <StageProcessLabel>{process.label}</StageProcessLabel>
                      </StageProcessItem>
                    ))}
                  </StageProcessGroup>
                );
              })}
            </StageProcessList>
          )}
        </StageContent>

        {menuItems && <NodeContextMenu menuItems={menuItems} isVisible={shouldShowMenu} />}
      </StageContainer>
      <StageHandle id="input" type="target" position={Position.Left} isVisible={shouldShowHandles} />
      <StageHandle id="output" type="source" position={Position.Right} isVisible={shouldShowHandles} />
    </div>
  );
};

export const StageNode = memo(StageNodeComponent);
