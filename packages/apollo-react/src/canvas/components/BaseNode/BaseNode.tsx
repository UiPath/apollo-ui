import { cx } from '@uipath/apollo-react/canvas/utils';
import type { ReactFlowState } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Position,
  useReactFlow,
  useStore,
  useUpdateNodeInternals,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_NODE_SIZE } from '../../constants';
import { useNodeTypeRegistry } from '../../core';
import { useNodeExecutionState } from '../../hooks';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { resolveAdornments } from '../../utils/adornment-resolver';
import { getIcon } from '../../utils/icon-registry';
import { resolveDisplay, resolveHandles } from '../../utils/manifest-resolver';
import { resolveToolbar } from '../../utils/toolbar-resolver';
import { useBaseCanvasMode } from '../BaseCanvas/BaseCanvasModeProvider';
import { useCanvasTheme } from '../BaseCanvas/CanvasThemeContext';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useSelectionState } from '../BaseCanvas/SelectionStateContext';
import type { HandleActionEvent } from '../ButtonHandle/ButtonHandle';
import { SmartHandle, SmartHandleProvider } from '../ButtonHandle/SmartHandle';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';
import { NodeToolbar } from '../Toolbar';
import {
  BaseBadgeSlot,
  BaseContainer,
  BaseHeader,
  BaseIconWrapper,
  BaseSubHeader,
  BaseTextContainer,
} from './BaseNode.styles';
import type {
  BaseNodeComponentProps,
  FooterVariant,
  NodeAdornments,
  NodeStatusContext,
} from './BaseNode.types';
import { NodeLabel } from './NodeLabel';

const selectIsConnecting = (state: ReactFlowState) => !!state.connectionClickStartHandle;

const BaseNodeComponent = (props: BaseNodeComponentProps) => {
  const {
    type,
    data,
    selected,
    id,
    dragging,
    width,
    height,
    // Runtime callback props
    onHandleAction: onHandleActionProp,
    shouldShowAddButtonFn: shouldShowAddButtonFnProp,
    shouldShowButtonHandleNotchesFn: shouldShowButtonHandleNotchesFnProp,
    toolbarConfig: toolbarConfigProp,
    // UI configuration props
    handleConfigurations: handleConfigurationsProp,
    adornments: adornmentsProp,
    // Visual state props
    suggestionType,
    disabled,
    executionStatusOverride,
    // Display customization props
    labelTooltip,
    labelBackgroundColor,
    footerVariant,
    footerComponent,
    subLabelComponent,
    iconComponent,
  } = props;

  const updateNodeInternals = useUpdateNodeInternals();
  const { updateNodeData, updateNode } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const originalHeightRef = useRef<number | undefined>(undefined);

  // Get execution status from external source
  const executionState = useNodeExecutionState(id);
  const nodeTypeRegistry = useNodeTypeRegistry();
  const { mode } = useBaseCanvasMode();

  // Use context for connected handles - O(1) lookup instead of O(edges) per node
  const connectedHandleIds = useConnectedHandles(id);

  const isConnecting = useStore(selectIsConnecting);
  const { multipleNodesSelected } = useSelectionState();

  const { isDarkMode } = useCanvasTheme();

  // Get manifest and resolve with instance data
  const manifest = useMemo(() => nodeTypeRegistry.getManifest(type), [type, nodeTypeRegistry]);

  const statusContext: NodeStatusContext = useMemo(
    () => ({
      nodeId: id,
      executionState,
      isConnecting,
      isSelected: selected,
      isDragging: dragging,
      mode,
    }),
    [id, executionState, isConnecting, selected, dragging, mode]
  );

  // Callbacks: Use props only (no longer in data)
  const onHandleActionCallback = onHandleActionProp;
  const shouldShowAddButtonFn = shouldShowAddButtonFnProp;
  const shouldShowButtonHandleNotchesFn = shouldShowButtonHandleNotchesFnProp;

  // Use executionStatusOverride if provided, otherwise use hook value
  const executionStatus =
    executionStatusOverride ??
    (typeof executionState === 'string' ? executionState : executionState?.status);

  const display = useMemo(
    () => resolveDisplay(manifest?.display, data.display),
    [manifest, data.display]
  );

  // Icon resolution: component prop takes precedence, then icon string from display
  const Icon = useMemo(() => {
    // Priority 1: Component prop (e.g., dynamic tool icon)
    if (iconComponent !== undefined) {
      return iconComponent;
    }

    // Priority 2: Icon string (registry lookup)
    const IconComponent = getIcon(display.icon);
    return IconComponent ? <IconComponent /> : null;
  }, [iconComponent, display.icon]);

  // Resolve handles from props or manifest
  // Prop handleConfigurations take precedence over manifest
  const handleConfigurations = useMemo((): HandleGroupManifest[] => {
    // Priority 1: Prop override (runtime configuration)
    if (handleConfigurationsProp && Array.isArray(handleConfigurationsProp)) {
      return handleConfigurationsProp;
    }

    // Priority 2: Manifest default
    if (!manifest) return [];
    const resolved = resolveHandles(manifest.handleConfiguration, data);

    // Convert resolved handles to HandleGroupManifest format for ButtonHandle
    return resolved.map((group) => ({
      position: group.position,
      handles: group.handles.map((h) => ({
        id: h.id,
        type: h.type,
        handleType: h.handleType,
        label: h.label,
        visible: h.visible,
        showButton: h.showButton,
        constraints: h.constraints,
      })),
      visible: group.visible,
    }));
  }, [handleConfigurationsProp, manifest, data]);

  // Toolbar config resolution with priority: props > manifest
  const toolbarConfig = useMemo(() => {
    // Priority 1: Prop override (runtime callbacks)
    // - undefined: use manifest default
    // - null: explicitly no toolbar
    // - object: use provided config
    if (toolbarConfigProp !== undefined) {
      return toolbarConfigProp === null ? undefined : toolbarConfigProp;
    }

    // Priority 2: Manifest default
    return manifest ? resolveToolbar(manifest, statusContext) : undefined;
  }, [toolbarConfigProp, manifest, statusContext]);

  // Adornments resolution: use default resolver, then override with props if provided
  const adornments: NodeAdornments = useMemo(() => {
    const adornmentsFromProps = adornmentsProp ?? {};
    const adornmentsFromResolver = resolveAdornments(statusContext);

    return {
      ...adornmentsFromResolver,
      ...adornmentsFromProps,
    };
  }, [adornmentsProp, statusContext]);

  // Compute height based on handleConfigurations
  const computedHeight = useMemo(() => {
    const handleSpacing = 32;

    const leftHandles = handleConfigurations
      .filter((config) => config.position === Position.Left && config.visible !== false)
      .reduce((count, config) => count + config.handles.length, 0);

    const rightHandles = handleConfigurations
      .filter((config) => config.position === Position.Right && config.visible !== false)
      .reduce((count, config) => count + config.handles.length, 0);

    const leftRightHandles = Math.max(leftHandles, rightHandles);

    return Math.max(
      originalHeightRef.current ?? DEFAULT_NODE_SIZE,
      leftRightHandles * handleSpacing
    );
  }, [handleConfigurations]);

  // Sync computed height to node when it changes
  useEffect(() => {
    // Initialising originalHeightRef only when React Flow has finished measuring it and updated the height prop
    if (!originalHeightRef.current && height) {
      originalHeightRef.current = height;
      return;
    }

    if (computedHeight !== undefined && computedHeight !== height) {
      const frameId = requestAnimationFrame(() => {
        updateNode(id, { height: computedHeight });
        updateNodeInternals(id);
      });

      return () => {
        cancelAnimationFrame(frameId);
      };
    }

    return undefined;
  }, [computedHeight, height, id, updateNode, updateNodeInternals]);

  const displayLabel = display.label;
  const displayShape = display.shape ?? 'square';
  const displayBackground = display.background;
  const displayColor = display.color;
  const displayIconBackground = isDarkMode
    ? (display.iconBackgroundDark ?? display.iconBackground)
    : display.iconBackground;

  // Display customization from props (not data)
  const displayLabelTooltip = labelTooltip;
  const displayLabelBackgroundColor = labelBackgroundColor;
  const displayFooterVariant = footerVariant;

  // SubLabel: Component prop takes precedence, then plain string from display
  const displaySubLabel = useMemo(() => {
    // 1. Component prop (e.g., composite with health score badge)
    if (subLabelComponent !== undefined) {
      return subLabelComponent;
    }
    // 2. Plain string from display.subLabel
    return display.subLabel;
  }, [subLabelComponent, display.subLabel]);

  // Footer: Component prop (no other sources)
  const displayFooter = footerComponent;

  const interactionState = useMemo(() => {
    if (disabled) return 'disabled';
    if (dragging) return 'drag';
    if (selected) return 'selected';
    if (isFocused) return 'focus';
    if (isHovered) return 'hover';
    return 'default';
  }, [disabled, dragging, selected, isHovered, isFocused]);

  const shouldShowHandles = useMemo(
    () => isConnecting || selected || isHovered,
    [isConnecting, selected, isHovered]
  );

  const hasVisibleBottomHandles = useMemo(() => {
    if (
      !handleConfigurations ||
      !Array.isArray(handleConfigurations) ||
      !selected ||
      displayShape === 'circle'
    ) {
      return false;
    }
    return handleConfigurations.some(
      (config) =>
        config.position === Position.Bottom &&
        config.handles.length > 0 &&
        config.visible !== false &&
        (config.handles.some((h) => h.type === 'source') ||
          config.handles.some((h) => h.showButton))
    );
  }, [handleConfigurations, selected, displayShape]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  const handleLabelChange = useCallback(
    (values: { label: string; subLabel: string }) => {
      const newDisplay = { ...data.display };
      // Ensure all label fields are updated or removed appropriately.
      for (const labelKey of Object.keys(values) as (keyof typeof values)[]) {
        if (values[labelKey]) {
          newDisplay[labelKey] = values[labelKey];
        } else {
          delete newDisplay[labelKey];
        }
      }
      updateNodeData(id, {
        display: newDisplay,
      });
    },
    [id, data.display, updateNodeData]
  );

  // Calculate if notches should be shown (when node is hovered or selected)
  // Use custom function if provided, otherwise use default logic
  const showNotches = shouldShowButtonHandleNotchesFn
    ? shouldShowButtonHandleNotchesFn({ isConnecting, isSelected: selected, isHovered })
    : isConnecting || isHovered || selected;

  // Handle action callback
  const handleAction = useCallback(
    (event: HandleActionEvent) => {
      // Reset hover state when handle is clicked
      setIsHovered(false);
      setIsFocused(false);

      // Call user-provided callback if present
      if (onHandleActionCallback) {
        onHandleActionCallback(event);
      }
    },
    [onHandleActionCallback]
  );

  // Check if smart handles are enabled via node data
  const useSmartHandles = data?.useSmartHandles ?? false;

  // Generate ButtonHandle elements (default behavior)
  // Hide add buttons when multiple nodes are selected to avoid visual clutter
  const buttonHandleElements = useButtonHandles({
    handleConfigurations,
    shouldShowHandles,
    handleAction,
    nodeId: id,
    selected: selected ?? false,
    showAddButton: mode === 'design' && !multipleNodesSelected,
    showNotches,
    nodeWidth: width,
    nodeHeight: height,
    shouldShowAddButtonFn,
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
        const handleVisualType =
          handle.handleType ?? (handle.type === 'source' ? 'output' : 'input');

        // Check if this handle has a connection - O(1) lookup from context
        const hasConnection = connectedHandleIds.has(handle.id);

        // Determine if the handle visuals should be visible
        // Always render the handle for registration, but control visibility of visual elements
        const isVisible = hasConnection || (shouldShowHandles && configVisible);

        // Determine if add button should be shown (hide when multiple nodes selected)
        const shouldShowButton =
          mode === 'design' && selected && handle.showButton && !multipleNodesSelected;

        return (
          <SmartHandle
            key={`${handle.id}-${handle.type}`}
            type={handle.type}
            id={handle.id}
            defaultPosition={defaultPosition as Position}
            handleType={handleVisualType}
            nodeWidth={width}
            nodeHeight={height}
            label={handle.label}
            showButton={shouldShowButton}
            selected={selected}
            showNotches={showNotches}
            onAction={handleAction}
            visible={isVisible}
            configOrder={currentIndex}
          />
        );
      })
    );

    return handles.length > 0 ? handles : null;
  }, [
    useSmartHandles,
    handleConfigurations,
    shouldShowHandles,
    width,
    height,
    mode,
    selected,
    showNotches,
    handleAction,
    multipleNodesSelected,
    connectedHandleIds.has,
  ]);

  // Use SmartHandle elements if enabled, otherwise use ButtonHandle elements
  const handleElements = useSmartHandles ? smartHandleElements : buttonHandleElements;

  // TODO: refactor to standalone component
  if (!manifest) {
    return (
      <div
        ref={containerRef}
        style={{ position: 'relative' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <BaseContainer
          selected={selected}
          shape="square"
          className={interactionState}
          interactionState={interactionState}
        >
          <BaseIconWrapper
            backgroundColor="var(--uix-canvas-error-background)"
            shape="square"
            height={height}
            width={width ?? height}
          >
            <ApIcon color="var(--uix-canvas-error-icon)" name="error" size="32px" />
          </BaseIconWrapper>

          {/* TODO: localize */}
          <BaseTextContainer shape="square">
            <BaseHeader shape="square">Manifest not found</BaseHeader>
            <BaseSubHeader>Node type "{type}" is not registered</BaseSubHeader>
          </BaseTextContainer>
        </BaseContainer>
      </div>
    );
  }

  const nodeContent = (
    <div
      ref={containerRef}
      style={{ position: 'relative' }}
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
        suggestionType={suggestionType}
        width={width}
        height={height}
        backgroundColor={displayBackground}
        hasFooter={!!displayFooter}
        footerVariant={displayFooterVariant as FooterVariant}
      >
        {Icon && (
          <BaseIconWrapper
            shape={displayShape}
            color={displayColor}
            backgroundColor={displayIconBackground}
            height={displayFooter ? undefined : height}
            width={displayFooter ? undefined : (width ?? height)}
          >
            {Icon}
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
        <NodeLabel
          label={displayLabel}
          subLabel={displaySubLabel}
          labelTooltip={displayLabelTooltip}
          labelBackgroundColor={displayLabelBackgroundColor}
          shape={displayShape}
          hasBottomHandles={hasVisibleBottomHandles}
          selected={selected}
          dragging={dragging}
          readonly={mode !== 'design'}
          onChange={handleLabelChange}
        />
        {displayFooter && (
          <div style={{ flexBasis: '100%', paddingTop: '2px', minWidth: 0, overflow: 'hidden' }}>
            {displayFooter}
          </div>
        )}
      </BaseContainer>
      {handleElements}
      {toolbarConfig && (
        <NodeToolbar
          nodeId={id}
          config={toolbarConfig}
          expanded={selected}
          hidden={dragging || multipleNodesSelected}
        />
      )}
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
