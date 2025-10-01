import { memo, useMemo, useState, useCallback, useRef } from "react";
import type { Node, NodeProps } from "@uipath/uix/xyflow/react";
import { Position, useConnection, useStore } from "@uipath/uix/xyflow/react";
import { ButtonHandles } from "../ButtonHandle";
import { BaseContainer, BaseIconWrapper, BaseBadgeSlot, BaseTextContainer, BaseHeader, BaseSubHeader } from "./BaseNode.styles";
import type { NewBaseNodeData, NewBaseNodeDisplayProps } from "./NewBaseNode.types";
import { cx } from "@uipath/uix/core";
import { ApIcon } from "@uipath/portal-shell-react";
import { NodeToolbar } from "../NodeToolbar";

// Internal component that expects display props as direct props
const NewBaseNodeComponent = (
  props: Omit<NodeProps<Node<NewBaseNodeData>>, "data"> & NewBaseNodeDisplayProps & { data?: NewBaseNodeData }
) => {
  const {
    id,
    selected = false,
    dragging,
    width,
    height,
    executionStatus,
    disabled = false,
    icon,
    display,
    adornments = {},
    handleConfigurations = [],
    toolbarConfig,
    onHandleAction,
    showAddButton = false,
    shouldShowAddButtonFn = ({ showAddButton, selected }) => showAddButton && selected,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { inProgress } = useConnection();

  // Use display config from data
  const finalDisplay = display ?? {};

  const displayLabel = finalDisplay.label;
  const displaySubLabel = finalDisplay.subLabel;
  const displayLabelBackgroundColor = finalDisplay.labelBackgroundColor;
  const displayShape = finalDisplay.shape ?? "square";
  const displayBackground = finalDisplay.background;
  const displayIconBackground = executionStatus === "Failed" ? "var(--color-background)" : finalDisplay.iconBackground;

  const { edges, isConnecting } = useStore(
    (state) => ({ edges: state.edges, isConnecting: !!state.connectionClickStartHandle }),
    (a, b) => a.edges === b.edges && a.isConnecting === b.isConnecting
  );

  const interactionState = useMemo(() => {
    if (disabled) return "disabled";
    if (dragging) return "drag";
    if (selected) return "selected";
    if (isFocused) return "focus";
    if (isHovered) return "hover";
    return "default";
  }, [disabled, dragging, selected, isFocused, isHovered]);

  const shouldShowHandles = useMemo(
    () => inProgress || selected || isHovered || isConnecting,
    [inProgress, selected, isHovered, isConnecting]
  );

  const hasVisibleBottomHandlesWithLabels = useMemo(() => {
    if (!handleConfigurations || !Array.isArray(handleConfigurations) || !shouldShowHandles) {
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

  // Handle action callback
  const handleAction = useCallback(
    (event: any) => {
      // First, check if there's a global handler passed as prop
      if (onHandleAction) {
        onHandleAction(event);
      }

      // Then, check if there's an instance-specific handler in the handle configuration
      if (handleConfigurations && Array.isArray(handleConfigurations)) {
        const handleConfig = handleConfigurations.flatMap((config) => config.handles)?.find((h) => h.id === event.handleId);
        if (handleConfig?.onAction) {
          handleConfig.onAction(event);
        }
      }
    },
    [onHandleAction, handleConfigurations]
  );

  const connectedHandleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const edge of edges) {
      if (edge.source === id && edge.sourceHandle) ids.add(edge.sourceHandle);
      if (edge.target === id && edge.targetHandle) ids.add(edge.targetHandle);
    }
    return ids;
  }, [edges, id]);

  const handleElements = useMemo(() => {
    const elements = handleConfigurations.map((config, i) => {
      const hasConnectedHandle = config.handles.some((h) => connectedHandleIds.has(h.id));
      const finalVisible = hasConnectedHandle || (config.visible ?? true);

      // Enhance handles with the unified action handler
      const enhancedHandles = config.handles.map((handle) => ({
        ...handle,
        onAction: handle.onAction || handleAction,
      }));

      return (
        <ButtonHandles
          key={`${i}:${config.handles.map((h) => h.id).join(",")}`}
          nodeId={id}
          handles={enhancedHandles}
          position={config.position}
          selected={selected}
          visible={finalVisible}
          showAddButton={showAddButton}
          shouldShowAddButtonFn={shouldShowAddButtonFn}
        />
      );
    });

    return <>{elements}</>;
  }, [handleConfigurations, selected, connectedHandleIds, handleAction, id, showAddButton, shouldShowAddButtonFn]);

  // Fallback for missing configuration - show error state
  if (!icon && !displayLabel) {
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
          <BaseIconWrapper backgroundColor="var(--color-error-background)" shape="square" nodeHeight={height}>
            <ApIcon color="var(--color-error-icon)" name="error" size="32px" />
          </BaseIconWrapper>

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
        className={cx(executionStatus ?? "", interactionState)}
        interactionState={interactionState}
        executionStatus={executionStatus}
        width={width}
        height={height}
        backgroundColor={displayBackground}
      >
        {icon && (
          <BaseIconWrapper
            shape={displayShape as "square" | "circle" | "rectangle"}
            backgroundColor={displayIconBackground}
            nodeHeight={height}
          >
            {icon}
          </BaseIconWrapper>
        )}

        {adornments?.topLeft && (
          <BaseBadgeSlot position="top-left" shape={displayShape}>
            {adornments.topLeft}
          </BaseBadgeSlot>
        )}
        {adornments?.topRight && (
          <BaseBadgeSlot position="top-right" shape={displayShape}>
            {adornments.topRight}
          </BaseBadgeSlot>
        )}
        {adornments?.bottomRight && (
          <BaseBadgeSlot position="bottom-right" shape={displayShape}>
            {adornments.bottomRight}
          </BaseBadgeSlot>
        )}
        {adornments?.bottomLeft && (
          <BaseBadgeSlot position="bottom-left" shape={displayShape}>
            {adornments.bottomLeft}
          </BaseBadgeSlot>
        )}

        {displayLabel && (
          <BaseTextContainer hasBottomHandles={hasVisibleBottomHandlesWithLabels} shape={displayShape}>
            <BaseHeader shape={displayShape} backgroundColor={displayLabelBackgroundColor}>
              {displayLabel}
            </BaseHeader>
            {displaySubLabel && <BaseSubHeader>{displaySubLabel}</BaseSubHeader>}
          </BaseTextContainer>
        )}
      </BaseContainer>
      {toolbarConfig && <NodeToolbar nodeId={id} config={toolbarConfig} visible={selected && !dragging} />}
      {handleElements}
    </div>
  );
};

// Wrapper component that extracts display props from data for React Flow compatibility
// Also supports direct props for standalone usage (non-React Flow components)
const NewBaseNodeWrapper = (
  props: Omit<NodeProps<Node<NewBaseNodeData>>, "data"> & NewBaseNodeDisplayProps & { data?: NewBaseNodeData }
) => {
  const {
    data,
    disabled = false,
    adornments,
    toolbarConfig,
    executionStatus,
    icon,
    display,
    handleConfigurations,
    onHandleAction,
    showAddButton = false,
    ...nodeProps
  } = props;

  return (
    <NewBaseNodeComponent
      data={data}
      {...nodeProps}
      disabled={disabled}
      executionStatus={executionStatus}
      icon={icon}
      display={display}
      adornments={adornments}
      handleConfigurations={handleConfigurations}
      toolbarConfig={toolbarConfig}
      onHandleAction={onHandleAction}
      showAddButton={showAddButton}
    />
  );
};

export const NewBaseNode = memo(NewBaseNodeWrapper);
