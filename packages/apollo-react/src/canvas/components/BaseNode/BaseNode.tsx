import { memo, useMemo, useState, useCallback } from "react";
import { NodeProps, Position, useStore } from "@xyflow/react";
import { Container, IconWrapper, TextContainer, Header, SubHeader, BadgeSlot } from "./BaseNode.styles";
import { ButtonHandles } from "../ButtonHandle/ButtonHandle";
import type { BaseNodeData } from "./BaseNode.types";

const BaseNodeComponent = (props: NodeProps) => {
  const { data, selected, id } = props;
  const nodeData = data as BaseNodeData;
  const { icon, label, subLabel, topLeftAdornment, topRightAdornment, bottomRightAdornment, bottomLeftAdornment, handleConfigurations } =
    nodeData;

  const [isHovered, setIsHovered] = useState(false);
  const [isNearby, setIsNearby] = useState(false);

  // Get edges from store
  const edges = useStore((state) => state.edges);

  // Check if we're actually dragging a connection
  // connectionClickStartHandle exists when user is dragging from a handle
  const connectionClickStartHandle = useStore((state) => state.connectionClickStartHandle);
  const isConnecting = !!connectionClickStartHandle;

  // Check if node has any connections
  const hasConnections = useMemo(() => {
    if (!edges || edges.length === 0) return false;
    return edges.some((edge) => edge.source === id || edge.target === id);
  }, [edges, id]);

  // Determine if handles should be visible
  const shouldShowHandles = useMemo(() => {
    // Show when selected, hovered, or cursor is nearby
    if (selected || isHovered || isNearby) return true;
    // Show during connection attempt
    if (isConnecting) return true;
    // Always show if there are connections
    if (hasConnections) return true;
    return false;
  }, [hasConnections, isConnecting, selected, isHovered, isNearby]);

  // Check if there are handles with labels on bottom position that would be visible
  const hasVisibleBottomHandlesWithLabels = useMemo(() => {
    if (!handleConfigurations || !shouldShowHandles) return false;
    return handleConfigurations.some((config) => config.position === Position.Bottom && config.handles.some((handle) => !!handle.label));
  }, [handleConfigurations, shouldShowHandles]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const handleElements = useMemo(() => {
    if (!handleConfigurations) return null;

    const elements = handleConfigurations.map((config, index) => {
      // Determine visibility for this handle group
      const hasConnectedHandle = config.handles.some((h) =>
        edges.some((edge) => (edge.sourceHandle === h.id && edge.source === id) || (edge.targetHandle === h.id && edge.target === id))
      );

      const isVisible = shouldShowHandles || hasConnectedHandle;
      const finalVisible = isVisible && (config.visible ?? true);

      return (
        <ButtonHandles
          key={`${config.position}-${index}`}
          handles={config.handles}
          position={config.position}
          selected={selected}
          visible={finalVisible}
        />
      );
    });

    return elements;
  }, [handleConfigurations, selected, shouldShowHandles, edges, id]);

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
