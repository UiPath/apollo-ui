import { memo, useMemo, useState, useCallback, useRef } from "react";
import type { Node, NodeProps } from "@uipath/uix/xyflow/react";
import { Position, useConnection, useStore } from "@uipath/uix/xyflow/react";
import { BaseContainer, BaseIconWrapper, BaseBadgeSlot, BaseTextContainer, BaseHeader, BaseSubHeader } from "./BaseNode.styles";
import type { NewBaseNodeData, NewBaseNodeDisplayProps, NodeAdornments } from "./NewBaseNode.types";
import { cx, FontVariantToken } from "@uipath/uix/core";
import { ApIcon, ApTooltip, ApTypography } from "@uipath/portal-shell-react";
import { useButtonHandles } from "../ButtonHandle/useButtonHandles";
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
    showHandles,
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
  const displayLabelTooltip = finalDisplay.labelTooltip;
  const displayLabelBackgroundColor = finalDisplay.labelBackgroundColor;
  const displayShape = finalDisplay.shape ?? "square";
  const displayBackground = finalDisplay.background;
  const displayIconBackground = executionStatus === "Failed" ? "var(--color-background)" : finalDisplay.iconBackground;
  const displayCenterAdornment = finalDisplay.centerAdornmentComponent;

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
    () => (showHandles !== undefined ? showHandles : inProgress || selected || isHovered || isConnecting),
    [showHandles, inProgress, selected, isHovered, isConnecting]
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

  const handleElements = useButtonHandles({
    handleConfigurations,
    shouldShowHandles,
    handleAction,
    edges,
    nodeId: id,
    selected,
    showAddButton,
    shouldShowAddButtonFn,
  });

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

        {Object.keys(adornments).map((key) => {
          const position = key as keyof NodeAdornments;
          const map = {
            topLeft: "top-left",
            topRight: "top-right",
            bottomLeft: "bottom-left",
            bottomRight: "bottom-right",
          } as const;
          const adornment = adornments[position];
          if (!adornment?.icon) return undefined;
          return (
            <BaseBadgeSlot position={map[position]} shape={displayShape} key={map[position]}>
              <ApTooltip
                placement="top"
                {...(adornment.tooltip && typeof adornment.tooltip === "string" && { content: adornment.tooltip })}
                {...(adornment.tooltip &&
                  typeof adornment.tooltip !== "string" && {
                    formattedContent: (
                      <ApTypography variant={FontVariantToken.fontSizeSBold} style={{ fontSize: "13px", minWidth: "130px" }}>
                        {adornment.tooltip}
                      </ApTypography>
                    ),
                  })}
              >
                {adornment.icon}
              </ApTooltip>
            </BaseBadgeSlot>
          );
        })}

        {displayLabel && (
          <BaseTextContainer hasBottomHandles={hasVisibleBottomHandlesWithLabels} shape={displayShape}>
            <ApTooltip placement="top" content={displayLabelTooltip}>
              <BaseHeader shape={displayShape} backgroundColor={displayLabelBackgroundColor}>
                {displayLabel}
              </BaseHeader>
              {displaySubLabel && <BaseSubHeader>{displaySubLabel}</BaseSubHeader>}
            </ApTooltip>
            {displayCenterAdornment}
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
