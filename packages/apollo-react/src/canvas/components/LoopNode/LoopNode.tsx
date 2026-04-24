import type { ResolvedHandleGroup } from '@uipath/apollo-react/canvas';
import {
  NodeResizeControl,
  Position,
  type ReactFlowState,
  useStore,
  useUpdateNodeInternals,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOptionalNodeTypeRegistry } from '../../core';
import { useElementValidationStatus, useNodeExecutionState } from '../../hooks';
import type { HandleBoundary } from '../../schema/node-definition';
import type { SuggestionType } from '../../types';
import { resolveAdornments } from '../../utils/adornment-resolver';
import { getOppositePosition } from '../../utils/createPreviewGraph';
import { CanvasIcon } from '../../utils/icon-registry';
import { resolveDisplay, resolveHandles } from '../../utils/manifest-resolver';
import { resolveToolbar } from '../../utils/toolbar-resolver';
import { useBaseCanvasMode } from '../BaseCanvas/BaseCanvasModeProvider';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useSelectionState } from '../BaseCanvas/SelectionStateContext';
import { selectIsConnecting } from '../BaseNode/BaseNode';
import type { NodeAdornments, NodeStatusContext } from '../BaseNode/BaseNode.types';
import { BaseBadgeSlot } from '../BaseNode/BaseNodeBadgeSlot';
import { getStatusBorder } from '../BaseNode/BaseNodeContainer';
import { MissingManifestNode } from '../BaseNode/BaseNodeMissingManifest';
import type { HandleActionEvent } from '../ButtonHandle';
import { ButtonHandles } from '../ButtonHandle';
import { NodeToolbar } from '../Toolbar';
import {
  DEFAULT_LOOP_FRAME_BACKGROUND,
  DEFAULT_LOOP_FRAME_BORDER,
  DEFAULT_LOOP_ICON,
  DEFAULT_LOOP_MIN_HEIGHT,
  DEFAULT_LOOP_MIN_WIDTH,
  DEFAULT_LOOP_NODE_TYPE,
  DEFAULT_LOOP_SHELL_BACKGROUND,
  DEFAULT_LOOP_TITLE,
  LOOP_FRAME_INSET_PX,
  LOOP_SHELL_RADIUS_PX,
} from './LoopNode.constants';
import { partitionLoopHandleGroups } from './LoopNode.helpers';
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

function LoopNodeComponent(props: LoopNodeProps) {
  const {
    id,
    type = DEFAULT_LOOP_NODE_TYPE,
    data,
    selected = false,
    dragging = false,
    width = 0,
    height = 0,
    onAddFirstChild,
    onResize: onResizeCallback,
  } = props;
  const updateNodeInternals = useUpdateNodeInternals();
  const nodeTypeRegistry = useOptionalNodeTypeRegistry();
  const headerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const resolvedData = data ?? EMPTY_DATA;
  const nodeVersion = typeof resolvedData.version === 'string' ? resolvedData.version : undefined;
  const suggestionType = (resolvedData as { suggestionType?: SuggestionType }).suggestionType;
  const manifest = useMemo(
    () => nodeTypeRegistry?.getManifest(type, nodeVersion),
    [nodeTypeRegistry, type, nodeVersion]
  );
  const { mode } = useBaseCanvasMode();
  const connectedHandleIds = useConnectedHandles(id);
  const { multipleNodesSelected } = useSelectionState();
  const isConnecting = useStore(selectIsConnecting);
  const needsChildCheck = mode === 'design' && !!onAddFirstChild;
  const hasChildNodes = useStore(
    useCallback(
      (state: ReactFlowState) =>
        !needsChildCheck || state.nodes.some((node) => node.parentId === id),
      [id, needsChildCheck]
    )
  );

  const executionState = useNodeExecutionState(id);
  const validationState = useElementValidationStatus(id);

  const statusContext: NodeStatusContext = useMemo(
    () => ({
      nodeId: id,
      executionState,
      validationState,
      isConnecting,
      isSelected: selected,
      isDragging: dragging,
      mode,
    }),
    [dragging, executionState, id, isConnecting, mode, selected, validationState]
  );

  const executionStatus =
    typeof executionState === 'string' ? executionState : executionState?.status;

  const display = useMemo(
    () => resolveDisplay(manifest?.display, { ...resolvedData, nodeId: id }),
    [manifest?.display, id, resolvedData]
  );

  const displayTitle = display.label ?? DEFAULT_LOOP_TITLE;
  const minWidth = DEFAULT_LOOP_MIN_WIDTH;
  const minHeight = DEFAULT_LOOP_MIN_HEIGHT;

  const headerIcon = useMemo(
    () => <CanvasIcon icon={display.icon ?? DEFAULT_LOOP_ICON} size={16} />,
    [display.icon]
  );

  const toolbarConfig = useMemo(
    () => (manifest ? resolveToolbar(manifest, statusContext, data) : undefined),
    [data, manifest, statusContext]
  );

  const adornments: NodeAdornments = useMemo(
    () => resolveAdornments(statusContext),
    [statusContext]
  );

  const resolvedHandleGroups = useMemo(
    () => (manifest ? resolveHandles(manifest.handleConfiguration, resolvedData) : []),
    [manifest, resolvedData]
  );
  const { outer: outerHandleGroups, inner: innerHandleGroups } = useMemo(
    () => partitionLoopHandleGroups(resolvedHandleGroups),
    [resolvedHandleGroups]
  );
  const handleGroupVariants = [
    ['outer', outerHandleGroups],
    ['inner', innerHandleGroups],
  ] as const;

  // biome-ignore lint/correctness/useExhaustiveDependencies: width/height and resolved handle groups are intentional rerun triggers for React Flow internals recalculation
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      updateNodeInternals(id);
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [id, innerHandleGroups, outerHandleGroups, updateNodeInternals, width, height]);

  const handleResize = useCallback(
    (_event: unknown, params: { width: number; height: number }) => {
      onResizeCallback?.({ width: params.width, height: params.height });
    },
    [onResizeCallback]
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

  const showHandleAddButtons =
    mode === 'design' && !multipleNodesSelected && !isConnecting && !dragging;
  const showResizeControls = selected && !dragging && mode === 'design';
  const showEmptyStateButton = mode === 'design' && !hasChildNodes && !!onAddFirstChild;

  const interactionState = resolveInteractionState(dragging, selected, isHovered);

  if (!manifest) {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: canvas node interaction
      <div
        className="relative"
        style={{ width, height, minWidth, minHeight }}
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
    // biome-ignore lint/a11y/noStaticElementInteractions: canvas node interaction
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
        width,
        height,
        minWidth,
        minHeight,
        borderRadius: LOOP_SHELL_RADIUS_PX,
        background: display.background ?? DEFAULT_LOOP_SHELL_BACKGROUND,
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
      <ResizeCornerIndicators selected={showResizeControls} />
      {showResizeControls
        ? RESIZE_CONTROLS.map(({ position, cursor }) => (
            <NodeResizeControl
              key={position}
              style={RESIZE_CONTROL_STYLE}
              position={position}
              minWidth={minWidth}
              minHeight={minHeight}
              onResize={handleResize}
            >
              <div
                className="absolute bottom-0 right-0 h-5 w-5 pointer-events-auto"
                style={{ cursor }}
              />
            </NodeResizeControl>
          ))
        : null}
      <Header
        headerRef={headerRef}
        title={displayTitle}
        icon={headerIcon}
        loading={!!resolvedData.loading}
      />
      <BodyFrame
        isEmpty={showEmptyStateButton}
        isLoading={!!resolvedData.loading}
        onAddFirstChild={handleEmptyClick}
      />
      {toolbarConfig && (
        <NodeToolbar
          nodeId={id}
          config={toolbarConfig}
          expanded={selected || isHovered}
          hidden={dragging || multipleNodesSelected}
        />
      )}
      {handleGroupVariants.map(([variant, groups]) => (
        <HandleGroups
          key={variant}
          nodeId={id}
          groups={groups}
          variant={variant}
          selected={selected}
          hovered={isHovered}
          shouldShowHandles={shouldShowHandles}
          showAddButton={showHandleAddButtons}
          showNotches={shouldShowHandles}
          nodeWidth={width}
          nodeHeight={height}
          connectedHandleIds={connectedHandleIds}
          onOuterHandleAction={handleOuterHandleAction}
        />
      ))}
    </div>
  );
}

export const LoopNode = memo(LoopNodeComponent);

function Header({
  headerRef,
  title,
  icon,
  loading,
}: {
  headerRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  icon?: React.ReactNode;
  loading: boolean;
}) {
  const titleContent = loading ? (
    <div className="h-5 w-28 animate-pulse rounded bg-(--canvas-background-overlay)" />
  ) : (
    <span className="truncate text-[14px] font-semibold tracking-[-0.15px]">{title}</span>
  );

  let iconContent: React.ReactNode = null;
  if (loading) {
    iconContent = (
      <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-(--canvas-background-overlay)" />
    );
  } else if (icon) {
    iconContent = (
      <span className="shrink-0 text-foreground" aria-hidden>
        {icon}
      </span>
    );
  }

  return (
    <div
      ref={headerRef}
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
        margin: LOOP_FRAME_INSET_PX,
        background: DEFAULT_LOOP_FRAME_BACKGROUND,
        borderColor: DEFAULT_LOOP_FRAME_BORDER,
      }}
    >
      {isLoading ? (
        <div className="m-6 h-14 w-full animate-pulse rounded-[18px] bg-(--canvas-background-overlay)" />
      ) : null}
      {isEmpty ? <EmptyState onAddFirstChild={onAddFirstChild} /> : null}
    </div>
  );
}

function ResizeCornerIndicators({ selected }: { selected: boolean }) {
  return (
    <>
      {RESIZE_CONTROLS.map(({ position, indicatorClassName }) => (
        <div
          key={position}
          aria-hidden
          className={cn(
            'pointer-events-none absolute h-1.5 w-1.5 rounded-[1px] border border-brand bg-background transition-opacity',
            indicatorClassName,
            selected ? 'opacity-100' : 'opacity-0'
          )}
        />
      ))}
    </>
  );
}

function HandleGroups({
  nodeId,
  variant,
  groups,
  selected,
  hovered,
  shouldShowHandles,
  showAddButton,
  showNotches,
  nodeWidth,
  nodeHeight,
  connectedHandleIds,
  onOuterHandleAction,
}: {
  nodeId: string;
  variant: HandleBoundary;
  groups: ResolvedHandleGroup[];
  selected: boolean;
  hovered: boolean;
  shouldShowHandles: boolean;
  showAddButton: boolean;
  showNotches: boolean;
  nodeWidth: number;
  nodeHeight: number;
  connectedHandleIds: ReadonlySet<string>;
  onOuterHandleAction: (event: HandleActionEvent) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <>
      {groups.map((group, groupIndex) => (
        <HandleGroup
          key={`${variant}:${group.position}:${groupIndex}`}
          nodeId={nodeId}
          variant={variant}
          group={group}
          selected={selected}
          hovered={hovered}
          shouldShowHandles={shouldShowHandles}
          showAddButton={showAddButton}
          showNotches={showNotches}
          nodeWidth={nodeWidth}
          nodeHeight={nodeHeight}
          connectedHandleIds={connectedHandleIds}
          onOuterHandleAction={onOuterHandleAction}
        />
      ))}
    </>
  );
}

function HandleGroup({
  nodeId,
  variant,
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
}: {
  nodeId: string;
  variant: HandleBoundary;
  group: ResolvedHandleGroup;
  selected: boolean;
  hovered: boolean;
  shouldShowHandles: boolean;
  showAddButton: boolean;
  showNotches: boolean;
  nodeWidth: number;
  nodeHeight: number;
  connectedHandleIds: ReadonlySet<string>;
  onOuterHandleAction: (event: HandleActionEvent) => void;
}) {
  const groupVisible = shouldShowHandles && (group.visible ?? true);
  const enhancedHandles = useMemo(
    () =>
      group.handles.map((handle) => ({
        ...handle,
        showHandle: connectedHandleIds.has(handle.id) || groupVisible,
        showButton: variant === 'inner' && handle.type === 'source' ? false : handle.showButton,
        onAction:
          handle.onAction ??
          (variant !== 'inner' && handle.type === 'source' && handle.showButton
            ? onOuterHandleAction
            : undefined),
      })),
    [group.handles, connectedHandleIds, groupVisible, onOuterHandleAction, variant]
  );

  return (
    <ButtonHandles
      nodeId={nodeId}
      handles={enhancedHandles}
      position={group.position as Position}
      connectionPosition={
        variant === 'inner'
          ? getOppositePosition(group.position as Position)
          : (group.position as Position)
      }
      selected={selected}
      hovered={hovered}
      showAddButton={showAddButton}
      showNotches={showNotches}
      customPositionAndOffsets={group.customPositionAndOffsets}
      nodeWidth={nodeWidth}
      nodeHeight={nodeHeight}
    />
  );
}
