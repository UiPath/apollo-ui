import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { NodeProps, Position, useStore } from "@xyflow/react";
import { BaseContainer, BaseIconWrapper, BaseTextContainer, BaseHeader, BaseSubHeader, BaseBadgeSlot } from "./BaseNode.styles";
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

  // Determine if handles should be visible
  const shouldShowHandles = useMemo(() => {
    return selected || isHovered || isConnecting;
  }, [isConnecting, selected, isHovered]);

  // Check if there are handles with labels on bottom position that would be visible
  const hasVisibleBottomHandlesWithLabels = useMemo(() => {
    if (!handleConfigurations || !shouldShowHandles) {
      return false;
    }
    return handleConfigurations.some((config) => {
      const normalizedConfig = normalizeHandleConfig(config);
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
      const normalizedConfig = normalizeHandleConfig(config);
      const hasConnectedHandle = normalizedConfig.handles.some((h) => connectedHandleIds.has(h.id));
      const finalVisible = hasConnectedHandle || (shouldShowHandles && (normalizedConfig.visible ?? true));

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
      <BaseContainer selected={selected} shape={shape}>
        {icon && <BaseIconWrapper shape={shape}>{icon}</BaseIconWrapper>}

        {topLeftAdornment && (
          <BaseBadgeSlot position="top-left" shape={shape}>
            {topLeftAdornment}
          </BaseBadgeSlot>
        )}
        {topRightAdornment && (
          <BaseBadgeSlot position="top-right" shape={shape}>
            {topRightAdornment}
          </BaseBadgeSlot>
        )}
        {bottomRightAdornment && (
          <BaseBadgeSlot position="bottom-right" shape={shape}>
            {bottomRightAdornment}
          </BaseBadgeSlot>
        )}
        {bottomLeftAdornment && (
          <BaseBadgeSlot position="bottom-left" shape={shape}>
            {bottomLeftAdornment}
          </BaseBadgeSlot>
        )}

        {label && (
          <BaseTextContainer hasBottomHandles={hasVisibleBottomHandlesWithLabels} shape={shape}>
            <BaseHeader shape={shape}>{label}</BaseHeader>
            {subLabel && <BaseSubHeader>{subLabel}</BaseSubHeader>}
          </BaseTextContainer>
        )}

        <NodeContextMenu menuItems={menuItems} isVisible={selected} />
      </BaseContainer>
      {handleElements}
    </div>
  );
};

export const BaseNode = memo(BaseNodeComponent);
