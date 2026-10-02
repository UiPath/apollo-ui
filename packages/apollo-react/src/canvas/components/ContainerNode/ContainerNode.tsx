import { useReactFlow, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo, useCallback, useMemo, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { useOptionalNodeTypeRegistry } from '../../core';
import { useElementValidationStatus, useNodeExecutionState } from '../../hooks';
import type { SuggestionType } from '../../types';
import { resolveAdornments } from '../../utils/adornment-resolver';
import {
  DEFAULT_CONTAINER_HEIGHT,
  DEFAULT_CONTAINER_MIN_HEIGHT,
  DEFAULT_CONTAINER_MIN_WIDTH,
  DEFAULT_CONTAINER_WIDTH,
} from '../../utils/container';
import { resolveDisplay, resolveHandles } from '../../utils/manifest-resolver';
import { selectIsConnecting, snapToGrid } from '../../utils/NodeUtils';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import { resolveToolbar } from '../../utils/toolbar-resolver';
import { useBaseCanvasMode } from '../BaseCanvas/BaseCanvasModeProvider';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useIsNodeReadOnly } from '../BaseCanvas/ReadOnlyNodesContext';
import { useSelectionState } from '../BaseCanvas/SelectionStateContext';
import type { NodeAdornments, NodeStatusContext } from '../BaseNode/BaseNode.types';
import { BaseBadgeSlot } from '../BaseNode/BaseNodeBadgeSlot';
import { getStatusBorder } from '../BaseNode/BaseNodeContainer';
import { MissingManifestNode } from '../BaseNode/BaseNodeMissingManifest';
import type { InlineLabelValues } from '../BaseNode/useInlineLabelEditing';
import type { HandleActionEvent } from '../ButtonHandle';
import { NodeToolbar } from '../Toolbar';
import { lockToolbarConfig } from '../Toolbar/NodeToolbar/NodeToolbar.utils';
import { resolveContainerNodeConfig } from './ContainerNode.config';
import {
  ACCENT_BORDER_CLASSES,
  ACCENT_ICON_CLASSES,
  ADORNMENT_SLOT_POSITIONS,
  ADORNMENT_SLOT_SHAPES,
  DEFAULT_CONTAINER_ICON,
  EMPTY_DATA,
  LOOP_KIND,
  RADIUS_CLASSES,
} from './ContainerNode.constants';
import { resolveContainerHandleGroups } from './ContainerNode.helpers';
import {
  resolveContainerHandleConfigurations,
  resolveInteractionState,
  useContainerNodeInternalsRefresh,
  useContainerResizeMinimums,
  useHasChildNodes,
} from './ContainerNode.hooks';
import type { ContainerNodeProps } from './ContainerNode.types';
import { Header, type HeaderLabelEditingStrings } from './ContainerNodeHeader';
import {
  BodyFrame,
  EmptyState,
  EmptyStateRender,
  HandleGroups,
  ResizeControls,
  ResizeCornerIndicators,
} from './ContainerNodeParts';

function ContainerNodeComponent(props: ContainerNodeProps) {
  const {
    id,
    type,
    data,
    selected = false,
    dragging = false,
    width = 0,
    height = 0,
    onAddFirstChild,
    onResize,
    onResizeStart,
    onResizeEnd,
    toolbarConfig: toolbarConfigProp,
    adornments: adornmentsProp,
    executionStatusOverride,
    suggestionType: suggestionTypeProp,
    renderHeader,
    renderEmptyState,
    className,
    defaults,
  } = props;
  const { updateNodeData } = useReactFlow();
  const nodeTypeRegistry = useOptionalNodeTypeRegistry();
  const { _ } = useSafeLingui();
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const resolvedData = data ?? EMPTY_DATA;
  const isLoading = !!resolvedData.loading;
  const suggestionType =
    suggestionTypeProp ?? (resolvedData as { suggestionType?: SuggestionType }).suggestionType;
  const manifest = useMemo(() => nodeTypeRegistry?.getManifest(type), [nodeTypeRegistry, type]);
  const { mode } = useBaseCanvasMode();
  const isDesignMode = mode === 'design';
  const isNodeReadOnly = useIsNodeReadOnly(id);
  const canEditNode = isDesignMode && !isNodeReadOnly;
  const connectedHandleIds = useConnectedHandles(id);
  const { multipleNodesSelected } = useSelectionState();
  const isConnecting = useStore(selectIsConnecting);
  const hasEmptyState = !!onAddFirstChild || !!renderEmptyState;
  const hasChildNodes = useHasChildNodes(id, isDesignMode && hasEmptyState);

  const executionState = useNodeExecutionState(id);
  const validationState = useElementValidationStatus(id);

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
      dragging,
      executionStatusOverride,
      executionState,
      id,
      isConnecting,
      mode,
      selected,
      validationState,
    ]
  );

  const executionStatus =
    executionStatusOverride ??
    (typeof executionState === 'string' ? executionState : executionState?.status);

  const display = useMemo(
    () => resolveDisplay(manifest?.display, { ...resolvedData, nodeId: id }),
    [manifest?.display, id, resolvedData]
  );

  const instanceDisplay = (resolvedData as { display?: { subLabel?: unknown } }).display;
  const instanceSubLabel =
    typeof instanceDisplay?.subLabel === 'string' ? instanceDisplay.subLabel : undefined;
  const config = resolveContainerNodeConfig(props, manifest?.display?.container, instanceSubLabel);
  const isLoop = config.kind === LOOP_KIND;
  const displayTitle =
    display.label ?? defaults?.title ?? _({ id: 'container-node.title', message: 'Container' });
  // `resolveDisplay` returns '' for a missing icon, so fall back on falsy, not nullish.
  const displayIcon = display.icon || defaults?.icon || DEFAULT_CONTAINER_ICON;
  const emptyStateLabel =
    config.emptyStateLabel ??
    _({ id: 'container-node.add-node', message: 'Add node to container' });
  const labelEditing = useMemo<HeaderLabelEditingStrings>(
    () => ({
      titlePlaceholder: _({ id: 'container-node.edit.title-placeholder', message: 'Name' }),
      subtitlePlaceholder: _({
        id: 'container-node.edit.subtitle-placeholder',
        message: 'Description',
      }),
      titleAriaLabel: _({ id: 'container-node.edit.title', message: 'Edit container name' }),
      subtitleAriaLabel: _({
        id: 'container-node.edit.subtitle',
        message: 'Edit container description',
      }),
    }),
    [_]
  );
  const handleLabelChange = useCallback(
    (values: Partial<InlineLabelValues>) => {
      // Same write path as BaseNode: empty values are removed so the manifest
      // label (or subtitle) shows again.
      const nextDisplay: Record<string, unknown> = { ...(resolvedData.display ?? {}) };
      for (const key of Object.keys(values) as (keyof InlineLabelValues)[]) {
        if (values[key]) {
          nextDisplay[key] = values[key];
        } else {
          delete nextDisplay[key];
        }
      }
      updateNodeData(id, { display: nextDisplay });
    },
    [id, resolvedData.display, updateNodeData]
  );
  const radiusClasses = RADIUS_CLASSES[config.radius];
  const hasAccent = config.accent !== 'default';
  const isDropTarget = resolvedData.isDropTarget === true;
  const containerWidth = width || DEFAULT_CONTAINER_WIDTH;
  const containerHeight = height || DEFAULT_CONTAINER_HEIGHT;
  const resizeControlsMounted = isDesignMode && !dragging;
  const resizeControlsVisible = resizeControlsMounted && (selected || isResizing);
  const resizeMinimumsEnabled = resizeControlsMounted && (selected || isHovered || isResizing);
  const resizeMinimums = useContainerResizeMinimums(
    id,
    containerWidth,
    containerHeight,
    resizeMinimumsEnabled
  );
  const nodeSizeStyle = {
    width: containerWidth,
    height: containerHeight,
    minWidth: DEFAULT_CONTAINER_MIN_WIDTH,
    minHeight: DEFAULT_CONTAINER_MIN_HEIGHT,
  };

  const toolbarConfig = useMemo(() => {
    if (toolbarConfigProp !== undefined) {
      return toolbarConfigProp === null ? undefined : toolbarConfigProp;
    }

    return manifest ? resolveToolbar(manifest, statusContext, data) : undefined;
  }, [data, manifest, statusContext, toolbarConfigProp]);

  // Matches BaseNode: a locked container keeps its toolbar with every action
  // disabled rather than hiding it. See `lockToolbarConfig` for why.
  const effectiveToolbarConfig = useMemo(
    () => (toolbarConfig && isNodeReadOnly ? lockToolbarConfig(toolbarConfig) : toolbarConfig),
    [toolbarConfig, isNodeReadOnly]
  );

  const adornments: NodeAdornments = useMemo(
    () => ({
      ...resolveAdornments(statusContext, { hideExecutionStatusAdornment: true }),
      ...(adornmentsProp ?? {}),
    }),
    [adornmentsProp, statusContext]
  );
  const hasTopLeftAdornment = !!adornments.topLeft;
  const hasTopRightAdornment = !!adornments.topRight;

  const resolvedHandleGroups = useMemo(() => {
    const handleConfigurations = resolveContainerHandleConfigurations(
      manifest?.handleConfiguration,
      resolvedData
    );
    return resolveHandles(handleConfigurations, { ...resolvedData, nodeId: id });
  }, [manifest?.handleConfiguration, id, resolvedData]);
  const containerHandleGroups = useMemo(
    () => resolveContainerHandleGroups(resolvedHandleGroups),
    [resolvedHandleGroups]
  );

  useContainerNodeInternalsRefresh(id, containerHandleGroups, containerWidth, containerHeight);

  const handleResize = useCallback(
    (_event: unknown, params: { width: number; height: number }) => {
      onResize?.({
        width: snapToGrid(params.width),
        height: snapToGrid(params.height),
      });
    },
    [onResize]
  );
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    onResizeStart?.();
  }, [onResizeStart]);
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    if (onResizeEnd) {
      queueMicrotask(onResizeEnd);
    }
  }, [onResizeEnd]);

  const handleEmptyClick = useCallback(() => {
    onAddFirstChild?.();
  }, [onAddFirstChild]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleHandleAction = useCallback((_event: HandleActionEvent) => {
    setIsHovered(false);
  }, []);

  const shouldShowHandles = (isConnecting || selected || isHovered) && !dragging;

  // Resize stays enabled when locked: size, like position, is layout rather
  // than content. Only the structural controls are gated.
  const showHandleAddButtons = canEditNode && !multipleNodesSelected && !isConnecting && !dragging;
  const showEmptyState = canEditNode && !hasChildNodes && hasEmptyState;

  const interactionState = resolveInteractionState(dragging, selected, isHovered);
  const activeStatus = suggestionType ?? validationState?.validationStatus ?? executionStatus;
  const statusBorder = getStatusBorder(activeStatus);
  const hasStatusBorder = statusBorder.length > 0;

  if (!manifest) {
    return (
      <div
        className="relative"
        style={nodeSizeStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <MissingManifestNode
          type={type}
          isSelected={selected}
          isHovered={isHovered}
          interactionState={interactionState}
        />
      </div>
    );
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: a canvas node is not a form group; <fieldset> would add form semantics and default styles
    <div
      role="group"
      aria-label={displayTitle}
      data-container
      data-container-kind={config.kind}
      data-loop-container={isLoop ? '' : undefined}
      data-selected={selected ? 'true' : 'false'}
      data-execution-status={executionStatus}
      data-interaction-state={interactionState}
      data-suggestion-type={suggestionType}
      data-validation-status={validationState?.validationStatus}
      aria-busy={resolvedData.loading || undefined}
      className={cn(
        'group/loop-shell relative box-border flex h-full w-full flex-col overflow-visible border bg-transparent',
        radiusClasses.root,
        'transition-[border-color,box-shadow,opacity] shadow-(--canvas-node-shadow-rest)',
        config.borderStyle === 'dashed' && 'border-dashed',
        ACCENT_BORDER_CLASSES[config.accent],
        statusBorder,
        isHovered && 'shadow-(--canvas-node-shadow-hover)',
        isHovered && !hasStatusBorder && !hasAccent && 'border-border-hover',
        selected && 'outline-2 outline-foreground-accent-muted',
        isDropTarget && 'bg-surface-hover outline-2 outline-brand',
        interactionState === 'drag' && 'cursor-grabbing shadow-(--canvas-node-shadow-lifted)',
        className
      )}
      style={{
        ...nodeSizeStyle,
        ...(display.background ? { background: display.background } : {}),
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Clip the surface-overlay matte to the card's inner edge so it never overshoots or
          falls short at the corners. The clip radius is the container radius minus the 1px border. */}
      <div
        className={cn('absolute inset-0 isolate flex flex-col overflow-hidden', radiusClasses.clip)}
      >
        <Header
          testId={isLoop ? 'loop-node-header' : 'container-node-header'}
          title={displayTitle}
          icon={displayIcon}
          iconClassName={ACCENT_ICON_CLASSES[config.accent]}
          subtitle={config.subtitle}
          badges={config.headerBadges}
          end={config.headerEnd}
          renderHeader={renderHeader}
          loading={isLoading}
          editable={config.labelEditable && canEditNode && !isLoading}
          subtitleEditable={props.subtitle === undefined}
          editSubLabel={typeof config.subtitle === 'string' ? config.subtitle : ''}
          editingStrings={labelEditing}
          selected={selected}
          dragging={dragging}
          discardDraftOnReadonly={isNodeReadOnly}
          onLabelChange={handleLabelChange}
          radiusClassName={radiusClasses.header}
          hasTopLeftAdornment={hasTopLeftAdornment}
          hasTopRightAdornment={hasTopRightAdornment}
        />
        <BodyFrame
          testId={isLoop ? 'loop-body-frame' : 'container-body-frame'}
          frame={config.bodyFrame}
          radiusClassName={radiusClasses.body}
          isEmpty={showEmptyState}
          isLoading={isLoading}
        />
      </div>
      {ADORNMENT_SLOT_POSITIONS.map((slot) =>
        adornments?.[slot] ? (
          <BaseBadgeSlot key={slot} position={ADORNMENT_SLOT_SHAPES[slot]} shape="rectangle">
            {adornments[slot]}
          </BaseBadgeSlot>
        ) : null
      )}
      <ResizeCornerIndicators
        testIdPrefix={isLoop ? 'loop' : 'container'}
        visible={resizeControlsVisible}
      />
      {resizeControlsMounted ? (
        <ResizeControls
          minimums={resizeMinimums}
          onResize={handleResize}
          onResizeStart={handleResizeStart}
          onResizeEnd={handleResizeEnd}
        />
      ) : null}
      {showEmptyState ? (
        <div
          className={cn(
            'pointer-events-none absolute left-1/2 top-1/2',
            '-translate-x-1/2 -translate-y-1/2'
          )}
        >
          {renderEmptyState ? (
            <div className="pointer-events-auto">
              <EmptyStateRender
                render={renderEmptyState}
                onAddFirstChild={onAddFirstChild ? handleEmptyClick : undefined}
                isLoading={isLoading}
              />
            </div>
          ) : (
            <EmptyState label={emptyStateLabel} onAddFirstChild={handleEmptyClick} />
          )}
        </div>
      ) : null}
      {effectiveToolbarConfig && (
        <NodeToolbar
          nodeId={id}
          config={effectiveToolbarConfig}
          expanded={selected || isHovered}
          hidden={dragging || multipleNodesSelected}
          portalToNodeOverlay
        />
      )}
      <HandleGroups
        nodeId={id}
        groups={containerHandleGroups}
        selected={selected}
        hovered={isHovered}
        shouldShowHandles={shouldShowHandles}
        showAddButton={showHandleAddButtons}
        isLocked={!canEditNode}
        showNotches={shouldShowHandles}
        nodeWidth={containerWidth}
        nodeHeight={containerHeight}
        connectedHandleIds={connectedHandleIds}
        onHandleAction={handleHandleAction}
      />
    </div>
  );
}

/**
 * A node whose children sit inside it. Header, badges, body frame, empty state
 * and outer frame can each be customized through props or `display.container`
 * in the manifest. `LoopNode` is a preset of this component.
 */
export const ContainerNode = memo(ContainerNodeComponent, areNodePropsEqualIgnoringPosition);
