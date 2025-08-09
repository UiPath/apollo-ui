import { memo, useMemo, useState, useCallback } from "react";
import { NodeProps, useStore } from "@xyflow/react";
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
import { ButtonHandles } from "../ButtonHandle/ButtonHandle";
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
  const { title, processes = [], onAddProcess, addProcessLabel = "Add process", handleConfigurations, menuItems } = data;

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

  const connectedHandleIds = useMemo(() => {
    const ids = new Set<string>();
    if (!edges) return ids;
    for (const edge of edges) {
      if (edge.source === id && edge.sourceHandle) ids.add(edge.sourceHandle);
      if (edge.target === id && edge.targetHandle) ids.add(edge.targetHandle);
    }
    return ids;
  }, [edges, id]);

  const handleElements = useMemo(() => {
    if (!handleConfigurations) return null;

    return handleConfigurations.map((config) => {
      const hasConnectedHandle = config.handles.some((h) => connectedHandleIds.has(h.id));
      const isVisible = shouldShowHandles || hasConnectedHandle;
      const finalVisible = isVisible && (config.visible ?? true);

      return (
        <ButtonHandles
          key={`${config.position}:${config.handles.map((h) => h.id).join(",")}`}
          handles={config.handles}
          position={config.position}
          selected={selected}
          visible={finalVisible}
        />
      );
    });
  }, [handleConfigurations, selected, shouldShowHandles, connectedHandleIds]);

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
          {onAddProcess && <ApLink onClick={onAddProcess}>{addProcessLabel}</ApLink>}

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
                      <StageProcessItem key={process.id} status={process.status}>
                        <StageProcessIcon>{process.icon || <ProcessNodeIcon />}</StageProcessIcon>
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
      {handleElements}
    </div>
  );
};

export const StageNode = memo(StageNodeComponent);
