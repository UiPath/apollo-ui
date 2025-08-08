import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { NodeProps, Position, useStore } from "@xyflow/react";
import { Container, IconWrapper, TextContainer, Header, SubHeader, BadgeSlot } from "./BaseNode.styles";
import { ButtonHandles } from "../ButtonHandle/ButtonHandle";
import { NodeContextMenu } from "../NodeContextMenu";
import type { BaseNodeData, SingleHandleConfiguration, HandleConfiguration } from "./BaseNode.types";

// Helper function to normalize handle configurations
const normalizeHandleConfig = (config: HandleConfiguration | SingleHandleConfiguration): HandleConfiguration => {
  if ("handle" in config) {
    // Single handle configuration - wrap in array
    return {
      position: config.position,
      handles: [config.handle],
      visible: config.visible,
    };
  }
  return config;
};

const BaseNodeComponent = (props: NodeProps & { data: BaseNodeData }) => {
  const { data, selected, id } = props;
  const {
    icon,
    label,
    subLabel,
    topLeftAdornment,
    topRightAdornment,
    bottomRightAdornment,
    bottomLeftAdornment,
    handleConfigurations,
    shape = "square",
    menuItems,
  } = data;

  const [isHovered, setIsHovered] = useState(false);
  const { edges, isConnecting } = useStore(
    (state) => ({ edges: state.edges, isConnecting: !!state.connectionClickStartHandle }),
    (a, b) => a.edges === b.edges && a.isConnecting === b.isConnecting
  );

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
    return handleConfigurations.some((config) => {
      const normalizedConfig = normalizeHandleConfig(config as any);
      return normalizedConfig.position === Position.Bottom && normalizedConfig.handles.some((handle) => !!handle.label);
    });
  }, [handleConfigurations, shouldShowHandles]);

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

    const elements = handleConfigurations.map((config) => {
      const normalizedConfig = normalizeHandleConfig(config as any);
      const hasConnectedHandle = normalizedConfig.handles.some((h) => connectedHandleIds.has(h.id));
      const isVisible = shouldShowHandles || hasConnectedHandle;
      const finalVisible = isVisible && (normalizedConfig.visible ?? true);

      return (
        <ButtonHandles
          key={`${normalizedConfig.position}:${normalizedConfig.handles.map((h) => h.id).join(",")}`}
          handles={normalizedConfig.handles}
          position={normalizedConfig.position}
          selected={selected}
          visible={finalVisible}
        />
      );
    });

    return elements;
  }, [handleConfigurations, selected, shouldShowHandles, connectedHandleIds]);

  return (
    <div style={{ position: "relative" }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <Container selected={selected} shape={shape}>
        {icon && <IconWrapper shape={shape}>{icon}</IconWrapper>}

        {topLeftAdornment && (
          <BadgeSlot position="top-left" shape={shape}>
            {topLeftAdornment}
          </BadgeSlot>
        )}
        {topRightAdornment && (
          <BadgeSlot position="top-right" shape={shape}>
            {topRightAdornment}
          </BadgeSlot>
        )}
        {bottomRightAdornment && (
          <BadgeSlot position="bottom-right" shape={shape}>
            {bottomRightAdornment}
          </BadgeSlot>
        )}
        {bottomLeftAdornment && (
          <BadgeSlot position="bottom-left" shape={shape}>
            {bottomLeftAdornment}
          </BadgeSlot>
        )}

        {label && (
          <TextContainer hasBottomHandles={hasVisibleBottomHandlesWithLabels}>
            <Header>{label}</Header>
            {subLabel && <SubHeader>{subLabel}</SubHeader>}
          </TextContainer>
        )}

        <NodeContextMenu menuItems={menuItems} isVisible={selected} />
      </Container>
      {handleElements}
    </div>
  );
};

export const BaseNode = memo(BaseNodeComponent);
