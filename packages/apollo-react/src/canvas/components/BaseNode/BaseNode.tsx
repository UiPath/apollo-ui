import { memo, useMemo, useState, useCallback } from "react";
import { NodeProps, Position, useStore } from "@xyflow/react";
import { Container, IconWrapper, TextContainer, Header, SubHeader, BadgeSlot } from "./BaseNode.styles";
import { ButtonHandles } from "../ButtonHandle/ButtonHandle";
import type { BaseNodeData } from "./BaseNode.types";

const BaseNodeComponent = (props: NodeProps & { data: BaseNodeData }) => {
  const { data, selected, id } = props;
  const { icon, label, subLabel, topLeftAdornment, topRightAdornment, bottomRightAdornment, bottomLeftAdornment, handleConfigurations } =
    data;

  const [isHovered, setIsHovered] = useState(false);
  const { edges, isConnecting } = useStore(
    (state) => ({ edges: state.edges, isConnecting: !!state.connectionClickStartHandle }),
    (a, b) => a.edges === b.edges && a.isConnecting === b.isConnecting
  );

  // Check if node has any connections
  const hasConnections = useMemo(() => edges?.some((edge) => edge.source === id || edge.target === id) ?? false, [edges, id]);

  // Determine if handles should be visible
  const shouldShowHandles = useMemo(() => {
    return selected || isHovered || isConnecting || hasConnections;
  }, [hasConnections, isConnecting, selected, isHovered]);

  // Check if there are handles with labels on bottom position that would be visible
  const hasVisibleBottomHandlesWithLabels = useMemo(() => {
    if (!handleConfigurations || !shouldShowHandles) {
      return false;
    }
    return handleConfigurations.some((config) => config.position === Position.Bottom && config.handles.some((handle) => !!handle.label));
  }, [handleConfigurations, shouldShowHandles]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Precompute connected handle ids for this node for O(1) lookup
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

    const elements = handleConfigurations.map((config) => {
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

    return elements;
  }, [handleConfigurations, selected, shouldShowHandles, connectedHandleIds]);

  return (
    <div style={{ position: "relative" }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Container selected={selected}>
        {icon && <IconWrapper>{icon}</IconWrapper>}

        {topLeftAdornment && <BadgeSlot position="top-left">{topLeftAdornment}</BadgeSlot>}
        {topRightAdornment && <BadgeSlot position="top-right">{topRightAdornment}</BadgeSlot>}
        {bottomRightAdornment && <BadgeSlot position="bottom-right">{bottomRightAdornment}</BadgeSlot>}
        {bottomLeftAdornment && <BadgeSlot position="bottom-left">{bottomLeftAdornment}</BadgeSlot>}

        {label && (
          <TextContainer hasBottomHandles={hasVisibleBottomHandlesWithLabels}>
            <Header>{label}</Header>
            {subLabel && <SubHeader>{subLabel}</SubHeader>}
          </TextContainer>
        )}
      </Container>
      {handleElements}
    </div>
  );
};

export const BaseNode = memo(BaseNodeComponent);
