import {
  NodeResizeControl,
  type Position,
  type ReactFlowState,
  useStore,
  useUpdateNodeInternals,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_CONTAINER_HEIGHT, DEFAULT_CONTAINER_WIDTH } from '../../constants';
import { useOptionalNodeTypeRegistry } from '../../core';
import { useElementValidationStatus, useNodeExecutionState } from '../../hooks';
import type { SuggestionType } from '../../types';
import { resolveAdornments } from '../../utils/adornment-resolver';
import { CanvasIcon } from '../../utils/icon-registry';
import { resolveDisplay, resolveHandles } from '../../utils/manifest-resolver';
import { selectIsConnecting, snapToGrid } from '../../utils/NodeUtils';
import { resolveToolbar } from '../../utils/toolbar-resolver';
import { useBaseCanvasMode } from '../BaseCanvas/BaseCanvasModeProvider';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useSelectionState } from '../BaseCanvas/SelectionStateContext';
import type { NodeAdornments, NodeStatusContext } from '../BaseNode/BaseNode.types';
import { BaseBadgeSlot } from '../BaseNode/BaseNodeBadgeSlot';
import { getStatusBorder } from '../BaseNode/BaseNodeContainer';
import { MissingManifestNode } from '../BaseNode/BaseNodeMissingManifest';
import type { HandleActionEvent } from '../ButtonHandle';
import { ButtonHandles } from '../ButtonHandle';
import { NodeToolbar } from '../Toolbar';
import {
  CONTAINER_FRAME_INSET_PX,
  CONTAINER_SHELL_RADIUS_PX,
  DEFAULT_CONTAINER_FRAME_BACKGROUND,
  DEFAULT_CONTAINER_FRAME_BORDER,
  DEFAULT_CONTAINER_MIN_HEIGHT,
  DEFAULT_CONTAINER_MIN_WIDTH,
  DEFAULT_CONTAINER_SHELL_BACKGROUND,
  DEFAULT_LOOP_ICON,
  DEFAULT_LOOP_TITLE,
} from './LoopNode.constants';
import { type ContainerHandleGroup, resolveContainerHandleGroups } from './LoopNode.helpers';
import type { LoopNodeProps } from './LoopNode.types';

const EMPTY_DATA: Record<string, unknown> = {};

const RESIZE_CONTROLS = [
  { position: 'top-left', cursor: 'nwse-resize', indicatorClassName: 'top-[-5px] left-[-5px]' },
  { position: 'top-right', cursor: 'nesw-resize', indicatorClassName: 'top-[-5px] right-[-5px]' },
  {
    position: 'bottom-left',
    cursor: 'nesw-resize',
    indicatorClassName: 'bottom-[-5px] left-[-5px]',
  },
  {
    position: 'bottom-right',
    cursor: 'nwse-resize',
    indicatorClassName: 'bottom-[-5px] right-[-5px]',
  },
] as const;
const RESIZE_CONTROL_STYLE = { background: 'transparent', border: 'none', zIndex: 100 } as const;

const ADORNMENT_SLOT_POSITIONS = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const;
const ADORNMENT_SLOT_SHAPES: Record<
  (typeof ADORNMENT_SLOT_POSITIONS)[number],
  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
> = {
  topLeft: 'top-left',
  topRight: 'top-right',
  bottomLeft: 'bottom-left',
  bottomRight: 'bottom-right',
};

function resolveInteractionState(
  dragging: boolean,
  selected: boolean,
  isHovered: boolean
): 'drag' | 'selected' | 'hover' | 'default' {
  if (dragging) return 'drag';
  if (selected) return 'selected';
  if (isHovered) return 'hover';
  return 'default';
}

function useHasChildNodes(id: string, enabled: boolean): boolean {
  return useStore(
    useCallback(
      (state: ReactFlowState) => !enabled || state.nodes.some((node) => node.parentId === id),
      [id, enabled]
    )
  );
}

function useContainerNodeInternalsRefresh(
  id: string,
  handleGroups: ContainerHandleGroup[],
  width: number,
  height: number
) {
  const updateNodeInternals = useUpdateNodeInternals();

  // biome-ignore lint/correctness/useExhaustiveDependencies: dimensions and resolved handle groups are intentional rerun triggers for React Flow internals recalculation
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      updateNodeInternals(id);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [id, handleGroups, updateNodeInternals, width, height]);
}

function LoopNodeComponent(props: LoopNodeProps) {
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
    toolbarConfig: toolbarConfigProp,
    adornments: adornmentsProp,
    executionStatusOverride,
    suggestionType: suggestionTypeProp,
  } = props;
  const nodeTypeRegistry = useOptionalNodeTypeRegistry();
  const [isHovered, setIsHovered] = useState(false);

  const resolvedData = data ?? EMPTY_DATA;
  const isLoading = !!resolvedData.loading;
  const suggestionType =
    suggestionTypeProp ?? (resolvedData as { suggestionType?: SuggestionType }).suggestionType;
  const manifest = useMemo(() => nodeTypeRegistry?.getManifest(type), [nodeTypeRegistry, type]);
  const { mode } = useBaseCanvasMode();
  const isDesignMode = mode === 'design';
  const connectedHandleIds = useConnectedHandles(id);
  const { multipleNodesSelected } = useSelectionState();
  const isConnecting = useStore(selectIsConnecting);
  const hasChildNodes = useHasChildNodes(id, isDesignMode && !!onAddFirstChild);

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

  const displayTitle = display.label ?? DEFAULT_LOOP_TITLE;
  const displayIcon = display.icon ?? DEFAULT_LOOP_ICON;
  const containerWidth = width || DEFAULT_CONTAINER_WIDTH;
  const containerHeight = height || DEFAULT_CONTAINER_HEIGHT;
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

  const adornments: NodeAdornments = useMemo(
    () => ({
      ...resolveAdornments(statusContext),
      ...(adornmentsProp ?? {}),
    }),
    [adornmentsProp, statusContext]
  );

  const resolvedHandleGroups = useMemo(
    () => (manifest ? resolveHandles(manifest.handleConfiguration, resolvedData) : []),
    [manifest, resolvedData]
  );
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

  const handleEmptyClick = useCallback(() => {
    onAddFirstChild?.();
  }, [onAddFirstChild]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleOuterHandleAction = useCallback((_event: HandleActionEvent) => {
    setIsHovered(false);
  }, []);

  const shouldShowHandles = (isConnecting || selected || isHovered) && !dragging;

  const showHandleAddButtons = isDesignMode && !multipleNodesSelected && !isConnecting && !dragging;
  const showResizeControls = selected && !dragging && isDesignMode;
  const showEmptyStateButton = isDesignMode && !hasChildNodes && !!onAddFirstChild;

  const interactionState = resolveInteractionState(dragging, selected, isHovered);

  if (!manifest) {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: canvas node hover state is mouse-driven
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
    // biome-ignore lint/a11y/noStaticElementInteractions: canvas node hover state is mouse-driven
    <div
      data-loop-container
      data-selected={selected ? 'true' : 'false'}
      data-execution-status={executionStatus}
      data-interaction-state={interactionState}
      data-suggestion-type={suggestionType}
      data-validation-status={validationState?.validationStatus}
      aria-busy={resolvedData.loading || undefined}
      className={cn(
        'group/loop-shell relative flex h-full w-full flex-col overflow-visible border bg-surface-overlay',
        'transition-[border-color,box-shadow,opacity] shadow-(--canvas-node-shadow-rest)',
        'border-border-subtle',
        getStatusBorder(suggestionType ?? validationState?.validationStatus ?? executionStatus),
        isHovered && 'shadow-(--canvas-node-shadow-hover) border-border-hover',
        selected && 'outline outline-foreground-accent-muted',
        interactionState === 'drag' && 'cursor-grabbing shadow-(--canvas-node-shadow-lifted)'
      )}
      style={{
        ...nodeSizeStyle,
        borderRadius: CONTAINER_SHELL_RADIUS_PX,
        background: display.background ?? DEFAULT_CONTAINER_SHELL_BACKGROUND,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {ADORNMENT_SLOT_POSITIONS.map((slot) =>
        adornments?.[slot] ? (
          <BaseBadgeSlot key={slot} position={ADORNMENT_SLOT_SHAPES[slot]} shape="rectangle">
            {adornments[slot]}
          </BaseBadgeSlot>
        ) : null
      )}
      <ResizeCornerIndicators visible={showResizeControls} />
      {showResizeControls ? <ResizeControls onResize={handleResize} /> : null}
      <Header title={displayTitle} icon={displayIcon} loading={isLoading} />
      <BodyFrame
        isEmpty={showEmptyStateButton}
        isLoading={isLoading}
        onAddFirstChild={handleEmptyClick}
      />
      {toolbarConfig && (
        <NodeToolbar
          nodeId={id}
          config={toolbarConfig}
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
        showNotches={shouldShowHandles}
        nodeWidth={containerWidth}
        nodeHeight={containerHeight}
        connectedHandleIds={connectedHandleIds}
        onOuterHandleAction={handleOuterHandleAction}
      />
    </div>
  );
}

export const LoopNode = memo(LoopNodeComponent);

function Header({ title, icon, loading }: { title: string; icon?: string; loading: boolean }) {
  const titleContent = loading ? (
    <div className="h-5 w-28 animate-pulse rounded bg-(--canvas-background-overlay)" />
  ) : (
    <span className="truncate text-[14px] font-semibold tracking-normal">{title}</span>
  );

  const iconContent = loading ? (
    <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-(--canvas-background-overlay)" />
  ) : icon ? (
    <span className="shrink-0 text-foreground" aria-hidden>
      <CanvasIcon icon={icon} size={16} />
    </span>
  ) : null;

  return (
    <div
      className="flex shrink-0 items-center justify-between gap-2.5 pl-4.5 pr-5 pt-3.5 text-foreground cursor-grab active:cursor-grabbing"
      data-testid="loop-node-header"
    >
      <div className="flex min-w-0 items-center gap-2">
        {iconContent}
        {titleContent}
      </div>
    </div>
  );
}

function EmptyState({ onAddFirstChild }: { onAddFirstChild: () => void }) {
  return (
    <button
      type="button"
      onClick={onAddFirstChild}
      aria-label="Add node to loop"
      className={cn(
        'nodrag nopan',
        'pointer-events-auto flex h-8 w-8 items-center justify-center rounded-xl',
        'border border-border bg-surface-overlay text-foreground',
        'shadow-(--canvas-node-shadow-lifted)',
        'transition-colors',
        'hover:bg-surface-hover hover:border-brand'
      )}
    >
      <CanvasIcon icon="plus" size={14} />
    </button>
  );
}

function BodyFrame({
  isEmpty,
  isLoading,
  onAddFirstChild,
}: {
  isEmpty?: boolean;
  isLoading?: boolean;
  onAddFirstChild: () => void;
}) {
  return (
    <div
      data-testid="loop-body-frame"
      data-empty={isEmpty ? 'true' : 'false'}
      className={cn(
        'relative flex flex-1 rounded-[26px] border border-dashed',
        'pointer-events-none',
        isEmpty && 'items-center justify-center'
      )}
      style={{
        margin: CONTAINER_FRAME_INSET_PX,
        background: DEFAULT_CONTAINER_FRAME_BACKGROUND,
        borderColor: DEFAULT_CONTAINER_FRAME_BORDER,
      }}
    >
      {isLoading ? (
        <div className="m-6 h-14 w-full animate-pulse rounded-[18px] bg-(--canvas-background-overlay)" />
      ) : null}
      {isEmpty ? <EmptyState onAddFirstChild={onAddFirstChild} /> : null}
    </div>
  );
}

function ResizeControls({
  onResize,
}: {
  onResize: (_event: unknown, params: { width: number; height: number }) => void;
}) {
  return (
    <>
      {RESIZE_CONTROLS.map(({ position, cursor }) => (
        <NodeResizeControl
          key={position}
          style={RESIZE_CONTROL_STYLE}
          position={position}
          minWidth={DEFAULT_CONTAINER_MIN_WIDTH}
          minHeight={DEFAULT_CONTAINER_MIN_HEIGHT}
          onResize={onResize}
        >
          <div
            className="absolute bottom-0 right-0 h-5 w-5 pointer-events-auto"
            style={{ cursor }}
          />
        </NodeResizeControl>
      ))}
    </>
  );
}

function ResizeCornerIndicators({ visible }: { visible: boolean }) {
  return (
    <>
      {RESIZE_CONTROLS.map(({ position, indicatorClassName }) => (
        <div
          key={position}
          aria-hidden
          className={cn(
            'pointer-events-none absolute h-1.5 w-1.5 rounded-[1px] border border-brand bg-background transition-opacity',
            indicatorClassName,
            visible ? 'opacity-100' : 'opacity-0'
          )}
        />
      ))}
    </>
  );
}

type SharedHandleGroupProps = {
  nodeId: string;
  selected: boolean;
  hovered: boolean;
  shouldShowHandles: boolean;
  showAddButton: boolean;
  showNotches: boolean;
  nodeWidth: number;
  nodeHeight: number;
  connectedHandleIds: ReadonlySet<string>;
  onOuterHandleAction: (event: HandleActionEvent) => void;
};

type HandleGroupsProps = SharedHandleGroupProps & {
  groups: ContainerHandleGroup[];
};

function HandleGroups({ groups, ...handleGroupProps }: HandleGroupsProps) {
  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group, groupIndex) => (
        <HandleGroup
          key={`${group.boundary}:${group.position}:${groupIndex}`}
          {...handleGroupProps}
          group={group}
        />
      ))}
    </>
  );
}

type HandleGroupProps = SharedHandleGroupProps & {
  group: ContainerHandleGroup;
};

function HandleGroup({
  nodeId,
  group,
  selected,
  hovered,
  shouldShowHandles,
  showAddButton,
  showNotches,
  nodeWidth,
  nodeHeight,
  connectedHandleIds,
  onOuterHandleAction,
}: HandleGroupProps) {
  const groupVisible = shouldShowHandles && (group.visible ?? true);
  const position = group.position as Position;
  const enhancedHandles = useMemo(
    () =>
      group.handles.map((handle) => {
        const isInnerSourceHandle = group.boundary === 'inner' && handle.type === 'source';
        const shouldResetHoverOnAction =
          group.boundary === 'outer' && handle.type === 'source' && handle.showButton;

        return {
          ...handle,
          showHandle: connectedHandleIds.has(handle.id) || groupVisible,
          showButton: isInnerSourceHandle ? false : handle.showButton,
          onAction: handle.onAction ?? (shouldResetHoverOnAction ? onOuterHandleAction : undefined),
        };
      }),
    [group.boundary, group.handles, connectedHandleIds, groupVisible, onOuterHandleAction]
  );

  return (
    <ButtonHandles
      nodeId={nodeId}
      handles={enhancedHandles}
      position={position}
      connectionPosition={group.connectionPosition}
      selected={selected}
      hovered={hovered}
      showAddButton={showAddButton}
      showNotches={showNotches}
      customPositionAndOffsets={group.customPositionAndOffsets}
      nodeWidth={nodeWidth}
      nodeHeight={nodeHeight}
      portalActions={group.boundary === 'outer'}
    />
  );
}
