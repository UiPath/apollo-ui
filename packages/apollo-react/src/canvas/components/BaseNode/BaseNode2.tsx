import { memo, useMemo, useState, useCallback, useRef } from "react";
import { Node, NodeProps, Position, useConnection, useStore } from "@xyflow/react";
import { NodeStatusContext, useExecutionStatus } from "./ExecutionStatusContext";
import { ButtonHandles } from "../ButtonHandle";
import { NodeContextMenu } from "../NodeContextMenu";
import { BaseContainer, BaseIconWrapper, BaseBadgeSlot, BaseTextContainer, BaseHeader, BaseSubHeader } from "./BaseNode.styles";
import { BaseNodeData } from "./types";
import { useNodeTypeRegistry } from "./NodeRegistryProvider";
import { cx } from "@uipath/uix-core";
import { ApIcon } from "@uipath/portal-shell-react";

const BaseNodeComponent = (props: NodeProps<Node<BaseNodeData>>) => {
  const { type, data, selected, id, dragging } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Get execution status from external source
  const executionStatus = useExecutionStatus(id);
  const nodeTypeRegistry = useNodeTypeRegistry();

  const nodeDefinition = useMemo(() => nodeTypeRegistry.get(type), [type]);

  const statusContext: NodeStatusContext = useMemo(
    () => ({
      nodeId: id,
      executionStatus,
      isHovered,
      isSelected: selected,
      isDragging: dragging,
    }),
    [id, executionStatus, isHovered, selected, dragging]
  );

  const { inProgress } = useConnection();

  const icon = nodeDefinition?.getIcon?.(data, statusContext) ?? <></>;
  const adornments = useMemo(() => nodeDefinition?.getAdornments?.(data, statusContext) ?? {}, [nodeDefinition, data, statusContext]);
  const handleConfigurations = useMemo(
    () => nodeDefinition?.getHandleConfigurations?.(data, statusContext) ?? [],
    [nodeDefinition, data, statusContext]
  );
  const menuItems = useMemo(() => nodeDefinition?.getMenuItems?.(data, statusContext) ?? [], [nodeDefinition, data, statusContext]);

  const displayLabel = data.display?.label;
  const displaySubLabel = data.display?.subLabel;
  const displayShape = data.display?.shape ?? "square";

  const { edges, isConnecting } = useStore(
    (state) => ({ edges: state.edges, isConnecting: !!state.connectionClickStartHandle }),
    (a, b) => a.edges === b.edges && a.isConnecting === b.isConnecting
  );

  const interactionState = useMemo(() => {
    if (dragging) return "drag";
    if (selected) return "selected";
    if (isFocused) return "focus";
    if (isHovered) return "hover";
    return "default";
  }, [dragging, selected, isFocused, isHovered]);

  const shouldShowHandles = useMemo(
    () => inProgress || selected || isHovered || isConnecting,
    [inProgress || isConnecting, selected, isHovered]
  );

  const hasVisibleBottomHandlesWithLabels = useMemo(() => {
    if (!handleConfigurations || !shouldShowHandles) {
      return false;
    }
    return handleConfigurations
      .filter((config) => config.position === Position.Bottom)
      .some((config) => config.handles.some((handle) => !!handle.label));
  }, [handleConfigurations, shouldShowHandles]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

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
    if (!handleConfigurations) return <></>;

    const elements = handleConfigurations.map((config) => {
      const hasConnectedHandle = config.handles.some((h) => connectedHandleIds.has(h.id));
      const finalVisible = hasConnectedHandle || (shouldShowHandles && (config.visible ?? true));

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

  // TODO: refactor to standalone component
  if (!nodeDefinition) {
    return (
      <div
        ref={containerRef}
        style={{ position: "relative" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <BaseContainer selected={selected} shape="square" className={interactionState} interactionState={interactionState}>
          <BaseIconWrapper backgroundColor="var(--color-error-background)" shape="square">
            <ApIcon color="var(--color-error-icon)" name="error" size="32px" />
          </BaseIconWrapper>

          {/* TODO: localize */}
          <BaseTextContainer shape="square">
            <BaseHeader shape="square">Configuration issue</BaseHeader>
            <BaseSubHeader>Select the node to correct or remove it</BaseSubHeader>
          </BaseTextContainer>
        </BaseContainer>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ position: "relative" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <BaseContainer
        selected={selected}
        shape={displayShape}
        className={cx(executionStatus, interactionState)}
        interactionState={interactionState}
        executionState={executionStatus as any} // TODO: fix
      >
        {icon && <BaseIconWrapper shape={displayShape}>{icon}</BaseIconWrapper>}

        {adornments.topLeft && (
          <BaseBadgeSlot position="top-left" shape={displayShape}>
            {adornments.topLeft}
          </BaseBadgeSlot>
        )}
        {adornments.topRight && (
          <BaseBadgeSlot position="top-right" shape={displayShape}>
            {adornments.topRight}
          </BaseBadgeSlot>
        )}
        {adornments.bottomRight && (
          <BaseBadgeSlot position="bottom-right" shape={displayShape}>
            {adornments.bottomRight}
          </BaseBadgeSlot>
        )}
        {adornments.bottomLeft && (
          <BaseBadgeSlot position="bottom-left" shape={displayShape}>
            {adornments.bottomLeft}
          </BaseBadgeSlot>
        )}

        {displayLabel && (
          <BaseTextContainer hasBottomHandles={hasVisibleBottomHandlesWithLabels} shape={displayShape}>
            <BaseHeader shape={displayShape}>{displayLabel}</BaseHeader>
            {displaySubLabel && <BaseSubHeader>{displaySubLabel}</BaseSubHeader>}
          </BaseTextContainer>
        )}

        <NodeContextMenu menuItems={menuItems} isVisible={selected && !dragging} />
      </BaseContainer>
      {handleElements}
    </div>
  );
};

export const BaseNode2 = memo(BaseNodeComponent);
