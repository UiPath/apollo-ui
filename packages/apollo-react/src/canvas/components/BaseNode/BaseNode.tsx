import { memo, useMemo, useState, useCallback, useRef } from "react";
import type { Node, NodeProps } from "@uipath/uix/xyflow/react";
import { Position, useConnection, useStore } from "@uipath/uix/xyflow/react";
import type { NodeStatusContext } from "./ExecutionStatusContext";
import { useExecutionState } from "./ExecutionStatusContext";
import type { HandleActionEvent } from "../ButtonHandle";
import { ButtonHandles } from "../ButtonHandle";
import { NodeToolbar } from "../NodeToolbar";
import { BaseContainer, BaseIconWrapper, BaseBadgeSlot, BaseTextContainer, BaseHeader, BaseSubHeader } from "./BaseNode.styles";
import type { BaseNodeData } from "./BaseNode.types";
import { useNodeTypeRegistry } from "./useNodeTypeRegistry";
import { cx } from "@uipath/uix/core";
import { ApIcon } from "@uipath/portal-shell-react";

const BaseNodeComponent = (props: NodeProps<Node<BaseNodeData>>) => {
  const { type, data, selected, id, dragging, width, height } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Get execution status from external source
  const executionState = useExecutionState(id);
  const nodeTypeRegistry = useNodeTypeRegistry();

  const nodeDefinition = useMemo(() => nodeTypeRegistry.get(type), [type, nodeTypeRegistry]);

  const { inProgress } = useConnection();

  const statusContext: NodeStatusContext = useMemo(
    () => ({
      nodeId: id,
      executionState,
      isConnecting: inProgress,
      isSelected: selected,
      isDragging: dragging,
    }),
    [id, executionState, inProgress, selected, dragging]
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

  const displayLabel = display.label;
  const displaySubLabel = display.subLabel;
  const displayShape = display.shape ?? "square";
  const displayBackground = display.background;
  const displayIconBackground = executionStatus === "Failed" ? "var(--color-background)" : display.iconBackground;

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

  // Handle action callback that uses node type's default handler
  const handleAction = useCallback(
    (event: HandleActionEvent) => {
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

      // Enhance handles with the unified action handler
      const enhancedHandles = config.handles.map((handle) => ({
        ...handle,
        onAction: handle.onAction || handleAction,
      }));

      return (
        <ButtonHandles
          key={`${config.position}:${config.handles.map((h) => h.id).join(",")}`}
          nodeId={id}
          handles={enhancedHandles}
          position={config.position}
          selected={selected}
          visible={finalVisible}
        />
      );
    });

    return elements;
  }, [handleConfigurations, selected, shouldShowHandles, connectedHandleIds, handleAction, id]);

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
          <BaseIconWrapper backgroundColor="var(--color-error-background)" shape="square" nodeHeight={height}>
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
        executionStatus={executionStatus}
        width={width}
        height={height}
        backgroundColor={displayBackground}
      >
        {icon && (
          <BaseIconWrapper shape={displayShape} backgroundColor={displayIconBackground} nodeHeight={height}>
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
          <BaseTextContainer hasBottomHandles={hasVisibleBottomHandlesWithLabels} shape={displayShape}>
            <BaseHeader shape={displayShape}>{displayLabel}</BaseHeader>
            {displaySubLabel && <BaseSubHeader>{displaySubLabel}</BaseSubHeader>}
          </BaseTextContainer>
        )}
      </BaseContainer>
      {handleElements}
      {toolbarConfig && <NodeToolbar nodeId={id} config={toolbarConfig} visible={selected && !dragging && selectedNodesCount === 1} />}
    </div>
  );
};

export const BaseNode = memo(BaseNodeComponent);
