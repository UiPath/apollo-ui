import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Position,
  useReactFlow,
  useStore,
  useUpdateNodeInternals,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_NODE_SIZE,
  DEFAULT_RECTANGLE_NODE_WIDTH,
  GRID_SPACING,
  NODE_BADGE_INSET_CIRCLE,
  NODE_BADGE_INSET_SQUARE,
  NODE_BADGE_SIZE,
  NODE_BORDER_SIZE,
  NODE_CONTAINER_RADIUS_RATIO,
  NODE_HEIGHT_DEFAULT,
  NODE_HEIGHT_FOOTER_BUTTON,
  NODE_HEIGHT_FOOTER_DOUBLE,
  NODE_HEIGHT_FOOTER_SINGLE,
  NODE_INNER_ICON_RATIO,
  NODE_INNER_RADIUS_RATIO,
  NODE_INNER_SHAPE_RATIO,
} from '../../constants';
import { useNodeTypeRegistry } from '../../core';
import { useElementValidationStatus, useNodeExecutionState } from '../../hooks';
import type { NodeShape } from '../../schema';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { resolveAdornments } from '../../utils/adornment-resolver';
import { CanvasIcon, getIcon } from '../../utils/icon-registry';
import { resolveDisplay, resolveHandles } from '../../utils/manifest-resolver';
import { selectIsConnecting } from '../../utils/NodeUtils';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import { resolveToolbar } from '../../utils/toolbar-resolver';
import { useBaseCanvasMode } from '../BaseCanvas/BaseCanvasModeProvider';
import { useCanvasTheme } from '../BaseCanvas/CanvasThemeContext';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useSelectionState } from '../BaseCanvas/SelectionStateContext';
import type { HandleActionEvent } from '../ButtonHandle/ButtonHandle';
import { SmartHandle, SmartHandleProvider } from '../ButtonHandle/SmartHandle';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';
import { InitialsBadge } from '../shared/InitialsBadge';
import { NodeToolbar } from '../Toolbar';
import type {
  BaseNodeData,
  FooterVariant,
  NodeAdornments,
  NodeStatusContext,
} from './BaseNode.types';
import { BaseBadgeSlot } from './BaseNodeBadgeSlot';
import { useBaseNodeOverrideConfig } from './BaseNodeConfigContext';
import { BaseContainer } from './BaseNodeContainer';
import { BaseInnerShape } from './BaseNodeInnerShape';
import { MissingManifestNode } from './BaseNodeMissingManifest';
import { NodeLabel } from './NodeLabel';

const getContainerWidth = (shape: NodeShape | undefined, width: number | undefined) => {
  const defaultWidth = shape === 'rectangle' ? DEFAULT_RECTANGLE_NODE_WIDTH : DEFAULT_NODE_SIZE;
  if (width && width !== DEFAULT_NODE_SIZE && width !== DEFAULT_RECTANGLE_NODE_WIDTH) {
    return width;
  }
  return defaultWidth;
};

// Intrinsic height: the fixed footer height when a footer is present, else the default.
const getIntrinsicHeight = (
  hasFooter: boolean,
  footerVariant: FooterVariant | undefined
): number => {
  if (hasFooter) {
    switch (footerVariant) {
      case 'button':
        return NODE_HEIGHT_FOOTER_BUTTON;
      case 'single':
        return NODE_HEIGHT_FOOTER_SINGLE;
      case 'double':
        return NODE_HEIGHT_FOOTER_DOUBLE;
    }
  }
  return NODE_HEIGHT_DEFAULT;
};

const BaseNodeComponent = (props: NodeProps<Node<BaseNodeData>>) => {
  const { type, data, selected, id, dragging, width, height, parentId } = props;

  // Read runtime configuration from context (provided by parent node components)
  const {
    onHandleAction: onHandleActionProp,
    onHandleMouseEnter: onHandleMouseEnterProp,
    onHandleMouseLeave: onHandleMouseLeaveProp,
    onActionNeeded,
    shouldShowAddButtonFn: shouldShowAddButtonFnProp,
    shouldShowButtonHandleNotchesFn: shouldShowButtonHandleNotchesFnProp,
    toolbarConfig: toolbarConfigProp,
    handleConfigurations: handleConfigurationsProp,
    adornments: adornmentsProp,
    suggestionType,
    disabled,
    executionStatusOverride,
    labelTooltip,
    labelBackgroundColor,
    footerVariant,
    footerComponent,
    subLabelComponent,
    iconComponent,
  } = useBaseNodeOverrideConfig();

  const updateNodeInternals = useUpdateNodeInternals();
  const { updateNodeData, updateNode, getNode } = useReactFlow();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Height is driven by computedHeight (below), a pure function of handle count/footer.
  // It never reads the measured height, so writing it back can't loop.

  // Get execution status from external source
  const executionState = useNodeExecutionState(id);
  const validationState = useElementValidationStatus(id);
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
      executionState: executionStatusOverride ?? executionState,
      validationState,
      isConnecting,
      isSelected: selected,
      isDragging: dragging,
      mode,
    }),
    [
      id,
      executionStatusOverride,
      executionState,
      validationState,
      isConnecting,
      selected,
      dragging,
      mode,
    ]
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
    () => resolveDisplay(manifest?.display, { ...data, nodeId: id }),
    [manifest, data, id]
  );

  // Drillable (manifest) or collapsed (instance data) nodes render a decorative
  // stacked layer to signal they stand in for more than themselves.
  const isStacked = Boolean(manifest?.drillable || data?.isCollapsed);

  // Icon resolution: component prop > icon string > initials badge fallback.
  const Icon = useMemo(() => {
    if (iconComponent !== undefined) {
      return iconComponent;
    }
    if (display.icon) {
      const IconComponent = getIcon(display.icon);
      return IconComponent ? <IconComponent /> : null;
    }
    return <InitialsBadge name={display.label} size="var(--icon-size)" />;
  }, [iconComponent, display.icon, display.label]);

  // Resolve handles: context override > data override > manifest default
  const handleConfigurations = useMemo((): HandleGroupManifest[] => {
    // Priority 1: Context override (runtime configuration from parent wrapper components)
    if (handleConfigurationsProp && Array.isArray(handleConfigurationsProp)) {
      return handleConfigurationsProp;
    }

    // Priority 2: Per-instance override via node data
    const dataHandleConfigs = (data as Record<string, unknown>)?.handleConfigurations as
      | HandleGroupManifest[]
      | undefined;
    if (dataHandleConfigs && Array.isArray(dataHandleConfigs)) {
      return dataHandleConfigs;
    }

    // Priority 3: Manifest default
    if (!manifest) return [];
    // Pass nodeId and collapsed for collapse state lookup
    const resolved = resolveHandles(manifest.handleConfiguration, { ...data, nodeId: id });

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
        labelVisibility: h.labelVisibility,
        constraints: h.constraints,
      })),
      visible: group.visible,
    }));
  }, [handleConfigurationsProp, manifest, data, id]);

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

  // Computed node height: max of the handle-count floor and the intrinsic default/footer
  // height. Pure (never reads the measured `height`); written to node.height below as
  // the authoritative size, so node content is expected to fit within it.
  const computedHeight = useMemo(() => {
    const leftHandles = handleConfigurations
      .filter((config) => config.position === Position.Left && config.visible !== false)
      .reduce(
        (count, config) => count + config.handles.filter((h) => h.visible !== false).length,
        0
      );

    const rightHandles = handleConfigurations
      .filter((config) => config.position === Position.Right && config.visible !== false)
      .reduce(
        (count, config) => count + config.handles.filter((h) => h.visible !== false).length,
        0
      );

    const leftRightHandles = Math.max(leftHandles, rightHandles);

    // Each handle gets a 2-grid-space lane (32px), plus 2-grid-space padding at top + bottom of node.
    const handleFloor = (leftRightHandles * 2 + 2) * GRID_SPACING;

    return Math.max(getIntrinsicHeight(!!footerComponent, footerVariant), handleFloor);
  }, [handleConfigurations, footerComponent, footerVariant]);

  // Write computedHeight to node.height and recalculate handle positions. Compare
  // against node.height (not the measured `height` prop) so a lagging measurement
  // can't retrigger the write.
  // biome-ignore lint/correctness/useExhaustiveDependencies: handleConfigurations triggers handle recalculation.
  useEffect(() => {
    if (getNode(id)?.height !== computedHeight) {
      updateNode(id, { height: computedHeight });
    }
    updateNodeInternals(id);
  }, [handleConfigurations, computedHeight, id, getNode, updateNode, updateNodeInternals]);

  const displayLabel = display.label;
  const displayShape = display.shape ?? 'square';
  const displayBackground = display.background;
  const displayColor = display.color;
  const displayShadow = display.shadow ?? true;
  const displayIconBackground = isDarkMode
    ? (display.iconBackgroundDark ?? display.iconBackground)
    : display.iconBackground;

  // Display customization from props (not data)
  const displayLabelTooltip = labelTooltip;
  const displayLabelBackgroundColor = labelBackgroundColor;

  // SubLabel: Component prop takes precedence, then plain string from display.
  const displaySubLabel = useMemo(() => {
    if (subLabelComponent !== undefined) {
      return subLabelComponent;
    }
    return display.subLabel;
  }, [subLabelComponent, display.subLabel]);

  // Footer: Component prop (no other sources)
  const displayFooter = footerComponent;

  // ---------------------------------------------------------------------------
  // Geometry: CSS custom properties for the entire node tree.
  // Setting them once on the outermost wrapper means every child component
  // (BaseContainer, BaseInnerShape, BaseBadgeSlot) uses *static* Tailwind
  // classes that never change between renders — React skips DOM updates when
  // the className string is === equal, which is the critical perf win over
  // having per-component inline style objects.
  // ---------------------------------------------------------------------------
  const hasFooter = !!displayFooter;
  const containerWidth = getContainerWidth(displayShape, width);
  const containerHeight = computedHeight;

  const nodeVars = useMemo((): React.CSSProperties => {
    const numH = containerHeight;

    const getRadius = (basis: number, ratio: number) => {
      return displayShape === 'circle'
        ? '50%'
        : hasFooter
          ? `${GRID_SPACING}px`
          : `${basis * ratio}px`;
    };

    // Container border-radius
    const radiusBasis = Math.min(containerWidth, numH);
    const nodeRadius = getRadius(radiusBasis, NODE_CONTAINER_RADIUS_RATIO);

    // Inner-shape sizing (icon wrapper)
    const effectiveH = hasFooter ? DEFAULT_NODE_SIZE : numH;
    const effectiveW = hasFooter ? DEFAULT_NODE_SIZE : containerWidth;

    const innerBasis = Math.min(effectiveH, effectiveW);
    const innerRadius = getRadius(innerBasis, NODE_INNER_RADIUS_RATIO);

    // Uniform gap: derive a fixed gap from the reference (smallest) dimension
    // so spacing is consistent on all sides regardless of aspect ratio.
    // Circles and rectangles keep the inner shape square (based on innerBasis).
    // Square nodes let the inner shape grow with the container.
    const gap = innerBasis * (1 - NODE_INNER_SHAPE_RATIO);
    const keepSquare = displayShape === 'circle' || displayShape === 'rectangle';
    const innerW = keepSquare ? innerBasis - gap : effectiveW - gap;
    const innerH = keepSquare ? innerBasis - gap : effectiveH - gap;

    return {
      '--node-w': `${containerWidth}px`,
      '--node-h': `${containerHeight}px`,
      '--node-radius': nodeRadius,
      '--node-gap': `${(gap - NODE_BORDER_SIZE * 2) / 2}px`,
      '--inner-w': `${innerW}px`,
      '--inner-h': `${innerH}px`,
      '--inner-radius': innerRadius,
      '--icon-size': `${innerBasis * NODE_INNER_ICON_RATIO}px`,
    } as React.CSSProperties;
  }, [containerWidth, containerHeight, displayShape, hasFooter]);

  const interactionState = useMemo(() => {
    if (disabled) return 'disabled';
    if (dragging) return 'drag';
    if (selected) return 'selected';
    if (isFocused) return 'focus';
    if (isHovered) return 'hover';
    return 'default';
  }, [disabled, dragging, selected, isHovered, isFocused]);

  const shouldShowHandles = useMemo(
    () => (isConnecting || selected || isHovered) && !dragging,
    [isConnecting, selected, isHovered, dragging]
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
  const toolbarPosition = toolbarConfig?.position ?? (toolbarConfig ? Position.Top : undefined);

  // Handle affordances *configured* at the toolbar's side that it would overlap.
  // `button` = a source add button; `label` = a handle label (any handle type).
  // Whether each is actually rendered is gated by `offsetToolbar` below, since
  // buttons and labels appear under different conditions.
  const toolbarSideHandleAffordances = useMemo(() => {
    let hasButton = false;
    let hasLabel = false;
    if (!toolbarPosition || !handleConfigurations?.length) {
      return { hasButton, hasLabel };
    }
    for (const config of handleConfigurations) {
      if (config.position !== toolbarPosition || config.visible === false) continue;
      for (const handle of config.handles) {
        if (handle.visible === false) continue;
        const showButton = useSmartHandles ? handle.showButton : handle.showButton !== false;
        if (handle.type === 'source' && showButton) hasButton = true;
        if (handle.label) hasLabel = true;
      }
    }
    return { hasButton, hasLabel };
  }, [toolbarPosition, handleConfigurations]);

  // Offset the toolbar to clear whichever handle affordance is actually rendered
  // at its side — not merely configured. A shown add button stacks button + label
  // and needs the larger offset; a label alone needs only a small one.
  const offsetToolbar = useMemo<'button' | 'label' | false>(() => {
    if (multipleNodesSelected) return false;
    const { hasButton, hasLabel } = toolbarSideHandleAffordances;

    // Mirror the gating that actually renders an add button (see `useButtonHandles`
    // / `smartHandleElements`), so the larger 'button' offset only applies when one
    // is really on screen — not while connecting/dragging or under a custom predicate.
    const isAddButtonShown = () => {
      // SmartHandle add buttons require selection (and ignore connect/drag state).
      if (useSmartHandles) {
        return mode === 'design' && !!selected;
      }
      const showAddButton = mode === 'design' && !isConnecting && !dragging;
      if (shouldShowAddButtonFn) {
        return shouldShowAddButtonFn({ showAddButton, selected: !!selected });
      }
      return showAddButton && (!!selected || isHovered);
    };

    if (hasButton && isAddButtonShown()) return 'button';
    // Labels render whenever their handle is visible — on hover or selection, in
    // any mode (including readonly) — which is exactly when the toolbar is shown,
    // so a configured label always coincides with it.
    if (hasLabel) return 'label';
    return false;
  }, [
    toolbarSideHandleAffordances,
    mode,
    multipleNodesSelected,
    useSmartHandles,
    selected,
    isHovered,
    isConnecting,
    dragging,
    shouldShowAddButtonFn,
  ]);

  // Generate ButtonHandle elements (default behavior)
  // Hide add buttons when multiple nodes are selected to avoid visual clutter
  const buttonHandleElements = useButtonHandles({
    handleConfigurations,
    shouldShowHandles,
    handleAction,
    handleMouseEnter: onHandleMouseEnterProp,
    handleMouseLeave: onHandleMouseLeaveProp,
    nodeId: id,
    selected: selected ?? false,
    hovered: isHovered,
    showAddButton: mode === 'design' && !multipleNodesSelected && !isConnecting && !dragging,
    showNotches,
    nodeWidth: width,
    nodeHeight: height,
    shouldShowAddButtonFn,
    portalActions: !!parentId,
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
    connectedHandleIds,
  ]);

  // Use SmartHandle elements if enabled, otherwise use ButtonHandle elements
  const handleElements = useSmartHandles ? smartHandleElements : buttonHandleElements;

  if (!manifest) {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: canvas node interaction
      <div
        ref={containerRef}
        className="relative"
        style={nodeVars}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <MissingManifestNode
          type={data.nodeType as string}
          isSelected={selected}
          isHovered={isHovered}
          interactionState={interactionState}
        />
      </div>
    );
  }

  const nodeContent = (
    // biome-ignore lint/a11y/noStaticElementInteractions: canvas node interaction
    <div
      ref={containerRef}
      className="relative"
      style={nodeVars}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <BaseContainer
        shape={displayShape}
        isSelected={selected}
        isHovered={isHovered}
        isStacked={isStacked}
        interactionState={interactionState}
        executionStatus={executionStatus}
        validationStatus={validationState?.validationStatus}
        suggestionType={suggestionType}
        hasFooter={hasFooter}
        background={displayBackground}
        loading={data.loading}
        shadow={displayShadow}
      >
        {(Icon || data.loading) && (
          <BaseInnerShape
            color={displayColor}
            background={displayIconBackground}
            loading={data.loading}
          >
            {data.loading ? null : Icon}
          </BaseInnerShape>
        )}

        {adornments?.topLeft && (
          <BaseBadgeSlot position="top-left" shape={displayShape}>
            {adornments.topLeft}
          </BaseBadgeSlot>
        )}
        {adornments?.topRight && executionStatus !== 'ActionNeeded' && (
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
          <div className="basis-full pt-0.5 min-w-0 overflow-hidden">{displayFooter}</div>
        )}
      </BaseContainer>
      {toolbarConfig && (
        <NodeToolbar
          nodeId={id}
          config={toolbarConfig}
          expanded={selected || isHovered}
          hidden={dragging || multipleNodesSelected}
          offsetToolbar={offsetToolbar}
        />
      )}
      {handleElements}
      {executionStatus === 'ActionNeeded' &&
        (() => {
          const badgeInset =
            displayShape === 'circle' ? NODE_BADGE_INSET_CIRCLE : NODE_BADGE_INSET_SQUARE;
          return (
            <button
              type="button"
              className="nodrag absolute z-10 flex cursor-pointer items-center gap-1 rounded-full bg-amber-400 text-[11px] font-semibold text-stone-900 shadow-sm transition-colors hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
              style={{
                top: badgeInset,
                left: `calc(var(--node-w) - ${badgeInset + NODE_BADGE_SIZE}px)`,
                height: NODE_BADGE_SIZE,
                minWidth: NODE_BADGE_SIZE,
                paddingInline: '4px 10px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onActionNeeded?.(id);
              }}
            >
              <CanvasIcon icon="flag" size={12} />
              <span className="whitespace-nowrap">Action needed</span>
            </button>
          );
        })()}
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

export const BaseNode = memo(BaseNodeComponent, areNodePropsEqualIgnoringPosition);
