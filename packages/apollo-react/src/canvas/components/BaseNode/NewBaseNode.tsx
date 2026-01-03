import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Position,
  useUpdateNodeInternals,
  useStore,
} from '@uipath/apollo-react/canvas/xyflow/react';
import {
  BaseContainer,
  BaseIconWrapper,
  BaseBadgeSlot,
  BaseTextContainer,
  BaseHeader,
  BaseSubHeader,
} from './BaseNode.styles';
import type { NewBaseNodeData, NewBaseNodeDisplayProps, NodeAdornments } from './NewBaseNode.types';
import { cx } from '@uipath/apollo-react/canvas/utils';
import { FontVariantToken } from '@uipath/apollo-core';
import { ApIcon, ApTooltip, ApTypography } from '@uipath/apollo-react/material/components';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';
import { NodeToolbar } from '../NodeToolbar';

// Internal component that expects display props as direct props
const NewBaseNodeComponent = (
  props: Omit<NodeProps<Node<NewBaseNodeData>>, 'data'> &
    NewBaseNodeDisplayProps & { data?: NewBaseNodeData }
) => {
  const {
    id,
    selected = false,
    dragging,
    width,
    height,
    executionStatus,
    suggestionType,
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

  const updateNodeInternals = useUpdateNodeInternals();

  // Force React Flow to recalculate handle positions when dimensions change
  // Use refs to track previous dimensions and avoid unnecessary calls
  const prevDimensionsRef = useRef<{ width?: number; height?: number }>({});

  useEffect(() => {
    if (width && height && handleConfigurations.length > 0) {
      const prevWidth = prevDimensionsRef.current.width;
      const prevHeight = prevDimensionsRef.current.height;

      // Only update if dimensions actually changed (not on initial mount)
      if (
        prevWidth !== undefined &&
        prevHeight !== undefined &&
        (prevWidth !== width || prevHeight !== height)
      ) {
        // Use requestAnimationFrame to batch DOM reads and avoid forced reflow
        requestAnimationFrame(() => {
          updateNodeInternals(id);
        });
      }

      prevDimensionsRef.current = { width, height };
    }
  }, [id, width, height, handleConfigurations, updateNodeInternals]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Use display config from data
  const finalDisplay = display ?? {};

  const displayLabel = finalDisplay.label;
  const displaySubLabel = finalDisplay.subLabel;
  const displayLabelTooltip = finalDisplay.labelTooltip;
  const displayLabelBackgroundColor = finalDisplay.labelBackgroundColor;
  const displayShape = finalDisplay.shape ?? 'square';
  const displayBackground = finalDisplay.background;
  const displayIconBackground =
    suggestionType || executionStatus === 'Failed'
      ? 'var(--uix-canvas-background)'
      : finalDisplay.iconBackground;
  const displayCenterAdornment = finalDisplay.centerAdornmentComponent;

  const isConnecting = useStore((state) => !!state.connectionClickStartHandle);

  const interactionState = useMemo(() => {
    if (disabled) return 'disabled';
    if (dragging) return 'drag';
    if (selected) return 'selected';
    if (isFocused) return 'focus';
    if (isHovered) return 'hover';
    return 'default';
  }, [disabled, dragging, selected, isFocused, isHovered]);

  const shouldShowHandles = useMemo(
    () => (showHandles !== undefined ? showHandles : isConnecting || selected || isHovered),
    [showHandles, isConnecting, selected, isHovered]
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

  // Handle action callback
  const handleAction = useCallback(
    (event: any) => {
      // First, check if there's a global handler passed as prop
      if (onHandleAction) {
        onHandleAction(event);
      }

      // Then, check if there's an instance-specific handler in the handle configuration
      if (handleConfigurations && Array.isArray(handleConfigurations)) {
        const handleConfig = handleConfigurations
          .flatMap((config) => config.handles)
          ?.find((h) => h.id === event.handleId);
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
    nodeId: id,
    selected,
    showAddButton,
    shouldShowAddButtonFn,
    nodeWidth: width,
    nodeHeight: height,
  });

  // Fallback for missing configuration - show error state
  if (!icon && !displayLabel) {
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
            nodeHeight={height}
          >
            <ApIcon color="var(--uix-canvas-error-icon)" name="error" size="32px" />
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
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <BaseContainer
        selected={selected}
        shape={displayShape}
        className={cx(executionStatus ?? '', interactionState, 'Failed')}
        interactionState={interactionState}
        executionStatus={executionStatus}
        suggestionType={suggestionType}
        width={width}
        height={height}
        backgroundColor={displayBackground}
      >
        {icon && (
          <BaseIconWrapper
            shape={displayShape as 'square' | 'circle' | 'rectangle'}
            backgroundColor={displayIconBackground}
            nodeHeight={height}
          >
            {icon}
          </BaseIconWrapper>
        )}

        {Object.keys(adornments).map((key) => {
          const position = key as keyof NodeAdornments;
          const map = {
            topLeft: 'top-left',
            topRight: 'top-right',
            bottomLeft: 'bottom-left',
            bottomRight: 'bottom-right',
          } as const;
          const adornment = adornments[position];
          if (!adornment?.icon) return undefined;
          return (
            <BaseBadgeSlot position={map[position]} shape={displayShape} key={map[position]}>
              <ApTooltip
                delay
                placement="top"
                content={typeof adornment.tooltip === 'string' ? adornment.tooltip : ''}
                {...(adornment.tooltip &&
                  typeof adornment.tooltip !== 'string' && {
                    formattedContent: (
                      <ApTypography
                        variant={FontVariantToken.fontSizeSBold}
                        style={{ fontSize: '13px', minWidth: '130px' }}
                      >
                        {adornment.tooltip}
                      </ApTypography>
                    ),
                  })}
              >
                <span>{adornment.icon}</span>
              </ApTooltip>
            </BaseBadgeSlot>
          );
        })}

        {displayLabel && (
          <BaseTextContainer hasBottomHandles={hasVisibleBottomHandles} shape={displayShape}>
            <ApTooltip delay placement="top" content={displayLabelTooltip}>
              <>
                <BaseHeader shape={displayShape} backgroundColor={displayLabelBackgroundColor}>
                  {displayLabel}
                </BaseHeader>
                {displaySubLabel && <BaseSubHeader>{displaySubLabel}</BaseSubHeader>}
              </>
            </ApTooltip>
            {displayCenterAdornment}
          </BaseTextContainer>
        )}
      </BaseContainer>
      {toolbarConfig && (
        <NodeToolbar nodeId={id} config={toolbarConfig} expanded={selected && !dragging} />
      )}
      {handleElements}
    </div>
  );
};

// Wrapper component that extracts display props from data for React Flow compatibility
// Also supports direct props for standalone usage (non-React Flow components)
const NewBaseNodeWrapper = (
  props: Omit<NodeProps<Node<NewBaseNodeData>>, 'data'> &
    NewBaseNodeDisplayProps & { data?: NewBaseNodeData }
) => {
  const {
    data,
    disabled = false,
    adornments,
    toolbarConfig,
    executionStatus,
    suggestionType,
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
      suggestionType={suggestionType}
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
