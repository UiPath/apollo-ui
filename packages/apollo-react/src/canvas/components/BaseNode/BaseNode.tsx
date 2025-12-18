import { memo, useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { Node, NodeProps } from "@uipath/uix/xyflow/react";
import { Position, useConnection, useStore, useUpdateNodeInternals } from "@uipath/uix/xyflow/react";
import type { NodeStatusContext } from "./ExecutionStatusContext";
import { useExecutionState } from "./ExecutionStatusContext";
import { NodeToolbar } from "../NodeToolbar";
import { BaseContainer, BaseIconWrapper, BaseBadgeSlot, BaseTextContainer, BaseHeader, BaseSubHeader } from "./BaseNode.styles";
import type { BaseNodeData } from "./BaseNode.types";
import { useNodeTypeRegistry } from "./useNodeTypeRegistry";
import { cx } from "@uipath/uix/core";
import { ApIcon, ApTooltip } from "@uipath/portal-shell-react";
import { useBaseCanvasMode } from "../BaseCanvas/BaseCanvasModeProvider";
import { SmartHandleProvider, SmartHandle } from "../ButtonHandle/SmartHandle";
import { useButtonHandles } from "../ButtonHandle/useButtonHandles";

const BaseNodeComponent = (props: NodeProps<Node<BaseNodeData>>) => {
  const { type, data, selected, id, dragging, width, height } = props;

  const updateNodeInternals = useUpdateNodeInternals();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Get execution status from external source
  const executionState = useExecutionState(id);
  const nodeTypeRegistry = useNodeTypeRegistry();
  const { mode } = useBaseCanvasMode();

  const nodeDefinition = useMemo(() => nodeTypeRegistry.get(type), [type, nodeTypeRegistry]);

  const { inProgress } = useConnection();

  const statusContext: NodeStatusContext = useMemo(
    () => ({
      nodeId: id,
      executionState,
      isConnecting: inProgress,
      isSelected: selected,
      isDragging: dragging,
      mode,
    }),
    [id, executionState, inProgress, selected, dragging, mode]
  );

  const executionStatus = typeof executionState === "string" ? executionState : executionState?.status;

  const icon = useMemo(() => nodeDefinition?.getIcon?.(data, statusContext) ?? <></>, [nodeDefinition, data, statusContext]);
  const display = useMemo(() => nodeDefinition?.getDisplay?.(data, statusContext) ?? {}, [nodeDefinition, data, statusContext]);
  const adornments = useMemo(() => nodeDefinition?.getAdornments?.(data, statusContext) ?? {}, [nodeDefinition, data, statusContext]);
  const handleConfigurations = useMemo(
    () => nodeDefinition?.getHandleConfigurations?.(data, statusContext) ?? [],
    [nodeDefinition, data, statusContext]
  );
  const toolbarConfig = useMemo(() => nodeDefinition?.getToolbar?.(data, statusContext), [nodeDefinition, data, statusContext]);

  // Force React Flow to recalculate handle positions when dimensions change
  useEffect(() => {
    if (width && height && handleConfigurations.length > 0) {
      updateNodeInternals(id);
    }
  }, [id, width, height, handleConfigurations, updateNodeInternals]);

  const displayLabel = display.label;
  const displaySubLabel = display.subLabel;
  const displayLabelTooltip = display.labelTooltip;
  const displayLabelBackgroundColor = display.labelBackgroundColor;
  const displayShape = display.shape ?? "square";
  const displayBackground = display.background;
  const displayColor = display.color;
  const displayIconBackground = executionStatus === "Failed" ? "var(--uix-canvas-background)" : display.iconBackground;
  const displayCenterAdornment = display.centerAdornmentComponent;

  const { edges, isConnecting, selectedNodesCount } = useStore(
    (state) => ({
      edges: state.edges,
      isConnecting: !!state.connectionClickStartHandle,
      selectedNodesCount: state.nodes.filter((n) => n.selected).length,
    }),
    (a, b) => a.edges === b.edges && a.isConnecting === b.isConnecting && a.selectedNodesCount === b.selectedNodesCount
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
    [inProgress, isConnecting, selected, isHovered]
  );

  const hasVisibleBottomHandles = useMemo(() => {
    if (!handleConfigurations || !Array.isArray(handleConfigurations) || !selected || displayShape === "circle") {
      return false;
    }
    return handleConfigurations.some(
      (config) =>
        config.position === Position.Bottom &&
        config.handles.length > 0 &&
        config.visible !== false &&
        (config.handles.some((h) => h.type === "source") || config.handles.some((h) => h.showButton))
    );
  }, [handleConfigurations, selected, displayShape]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  // Calculate if notches should be shown (when node is hovered or selected)
  const showNotches = inProgress || isHovered || selected;

  // Handle action callback that uses node type's default handler
  const handleAction = useCallback(
    (event: {
      handleId: string;
      nodeId: string;
      handleType: "artifact" | "input" | "output";
      position: Position;
      originalEvent: React.MouseEvent;
    }) => {
      // Reset hover state when handle is clicked
      setIsHovered(false);
      setIsFocused(false);

      // First, check if the node type has a default handler
      if (nodeDefinition?.onHandleAction) {
        nodeDefinition.onHandleAction(event);
      }

      // Then, check if there's an instance-specific handler in the handle configuration
      const handleConfig = handleConfigurations?.flatMap((config) => config.handles)?.find((h) => h.id === event.handleId);

      if (handleConfig?.onAction) {
        handleConfig.onAction(event);
      }
    },
    [nodeDefinition, handleConfigurations]
  );

  // Check if smart handles are enabled via node data
  const useSmartHandles = data?.useSmartHandles ?? false;

  // Generate ButtonHandle elements (default behavior)
  const buttonHandleElements = useButtonHandles({
    handleConfigurations,
    shouldShowHandles,
    handleAction,
    edges,
    nodeId: id,
    selected: selected ?? false,
    showAddButton: mode === "design",
    showNotches,
    nodeWidth: width,
    nodeHeight: height,
  });

  // Generate SmartHandle elements from handle configurations (opt-in)
  // IMPORTANT: Always render all handles so they register with SmartHandleProvider for consistent positioning.
  // Use the `visible` prop to hide visual elements instead of conditionally rendering.
  const smartHandleElements = useMemo(() => {
    if (!useSmartHandles) return null;
    if (!handleConfigurations || !Array.isArray(handleConfigurations)) return null;

    let handleIndex = 0;
    const handles = handleConfigurations.flatMap((config) =>
      config.handles.map((handle) => {
        const defaultPosition = config.position;
        const configVisible = config.visible ?? true;
        const currentIndex = handleIndex++;

        // Determine handle type for SmartHandle
        const handleVisualType = handle.handleType ?? (handle.type === "source" ? "output" : "input");

        // Check if this handle has a connection
        const hasConnection = edges.some(
          (edge) => (edge.source === id && edge.sourceHandle === handle.id) || (edge.target === id && edge.targetHandle === handle.id)
        );

        // Determine if the handle visuals should be visible
        // Always render the handle for registration, but control visibility of visual elements
        const isVisible = hasConnection || (shouldShowHandles && configVisible);

        // Determine if add button should be shown
        const shouldShowButton = mode === "design" && selected && handle.showButton;

        return (
          <SmartHandle
            key={`${handle.id}-${handle.type}`}
            type={handle.type}
            id={handle.id}
            defaultPosition={defaultPosition}
            handleType={handleVisualType}
            nodeWidth={width}
            nodeHeight={height}
            label={handle.label}
            labelIcon={handle.labelIcon}
            labelBackgroundColor={handle.labelBackgroundColor}
            showButton={shouldShowButton}
            selected={selected}
            color={handle.color}
            showNotches={showNotches}
            onAction={handleAction}
            visible={isVisible}
            configOrder={currentIndex}
          />
        );
      })
    );

    return handles.length > 0 ? handles : null;
  }, [useSmartHandles, handleConfigurations, edges, id, shouldShowHandles, width, height, mode, selected, showNotches, handleAction]);

  // Use SmartHandle elements if enabled, otherwise use ButtonHandle elements
  const handleElements = useSmartHandles ? smartHandleElements : buttonHandleElements;

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
          <BaseIconWrapper backgroundColor="var(--uix-canvas-error-background)" shape="square" nodeHeight={height}>
            <ApIcon color="var(--uix-canvas-error-icon)" name="error" size="32px" />
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

  const nodeContent = (
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
        executionStatus={executionStatus}
        width={width}
        height={height}
        backgroundColor={displayBackground}
      >
        {icon && (
          <BaseIconWrapper shape={displayShape} color={displayColor} backgroundColor={displayIconBackground} nodeHeight={height}>
            {icon}
          </BaseIconWrapper>
        )}

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
          <BaseTextContainer hasBottomHandles={hasVisibleBottomHandles} shape={displayShape}>
            <ApTooltip delay placement="top" content={displayLabelTooltip} smartTooltip>
              <BaseHeader shape={displayShape} backgroundColor={displayLabelBackgroundColor}>
                {displayLabel}
              </BaseHeader>
              {displaySubLabel && <BaseSubHeader>{displaySubLabel}</BaseSubHeader>}
            </ApTooltip>
            {displayCenterAdornment}
          </BaseTextContainer>
        )}
      </BaseContainer>
      {handleElements}
      {toolbarConfig && <NodeToolbar nodeId={id} config={toolbarConfig} expanded={selected} hidden={dragging || selectedNodesCount > 1} />}
    </div>
  );

  // Wrap with SmartHandleProvider only when smart handles are enabled
  if (useSmartHandles) {
    return (
      <SmartHandleProvider nodeWidth={width} nodeHeight={height}>
        {nodeContent}
      </SmartHandleProvider>
    );
  }

  return nodeContent;
};

export const BaseNode = memo(BaseNodeComponent);
