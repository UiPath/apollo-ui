import {
  type Edge,
  type Node,
  Position,
  type ReactFlowInstance,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { HandleGroupManifest, NodeManifest } from '../../schema/node-definition';
import {
  CONTAINER_FRAME_INSET_PX,
  getContainerSafeArea,
  isContainerNodeManifest,
  resolveContainerPreview,
} from '../../utils/container';
import type { PreviewEndpoint, PreviewGraphOverrides } from '../../utils/createPreviewGraph';
import { getOppositePosition } from '../../utils/createPreviewNode';
import { calculateGridAlignedHandlePositions } from '../../utils/handle-positioning';
import type { ResolutionContext, ResolvedHandleGroup } from '../../utils/manifest-resolver';
import { resolveHandles } from '../../utils/manifest-resolver';
import { snapToGrid } from '../../utils/NodeUtils';

export type ContainerHandleBoundary = 'outer' | 'inner';
export type ContainerHandleGroup = ResolvedHandleGroup & {
  boundary: ContainerHandleBoundary;
  connectionPosition: Position;
};

/** A user-dragged handle position: which wall it sits on and how far along it (px). */
export interface HandleWallOffset {
  position: 'left' | 'right' | 'top' | 'bottom';
  offset: number;
}

/** Per-node dragged handle positions, keyed by handle id. Stored in `data.handleOffsets`. */
export type HandleOffsets = Record<string, HandleWallOffset>;

/** Grid step dragged handles snap to. */
export const HANDLE_DRAG_GRID_PX = 16;
/** Minimum distance a dragged handle keeps from any container corner. */
export const HANDLE_DRAG_CORNER_MARGIN_PX = 48;
/**
 * Fallback minimum distance from the container top for handles on the side
 * walls when the header cannot be measured. When the caller passes the
 * measured header bottom (`contentTopPx`), the top clamp is derived from it so
 * the pill keeps the same clearance from the dashed body frame's top edge as
 * the corner margin gives it from the frame's bottom edge.
 */
export const HANDLE_DRAG_TOP_MARGIN_PX = 112;
/** Minimum center-to-center distance between two handles on the same wall. */
export const HANDLE_DRAG_MIN_SPACING_PX = 32;

export interface ContainerPreviewConnectionHandles {
  sourceHandleId: string;
  sourceHandlePosition: Position;
  targetHandleId: string;
}

export type ContainerPreviewManifestResolver = (
  node: Node
) => Pick<NodeManifest, 'display' | 'handleConfiguration'> | undefined;

/**
 * Normalizes manifest handle groups for container rendering. Inner handles are
 * inset from the frame and expose their connection position on the opposite side
 * because edges visually connect from inside the container body.
 */
export function resolveContainerHandleGroups(
  groups: ResolvedHandleGroup[]
): ContainerHandleGroup[] {
  return groups.map((group) => {
    const boundary = group.boundary ?? 'outer';
    const position = group.position as Position;

    return {
      ...group,
      boundary,
      connectionPosition: boundary === 'inner' ? getOppositePosition(position) : position,
      customPositionAndOffsets:
        boundary === 'inner' ? insetInnerGroup(group) : group.customPositionAndOffsets,
    };
  });
}

/**
 * Returns the center of the container's child-safe body area in local
 * coordinates. Used to place empty-state affordances and first children.
 */
export function getContainerRelativeBodyCenter(
  containerNode: Pick<Node, 'width' | 'height' | 'measured' | 'style'>
) {
  const safeArea = getContainerSafeArea(containerNode);

  return {
    x: snapToGrid(safeArea.x + safeArea.width / 2),
    y: snapToGrid(safeArea.y + safeArea.height / 2),
  };
}

function insetInnerGroup(group: ResolvedHandleGroup) {
  const offsets = group.customPositionAndOffsets ?? {};

  switch (group.position) {
    case Position.Left:
      return { ...offsets, left: (offsets.left ?? 0) + CONTAINER_FRAME_INSET_PX };
    case Position.Right:
      return { ...offsets, right: (offsets.right ?? 0) + CONTAINER_FRAME_INSET_PX };
    case Position.Top:
      return { ...offsets, top: (offsets.top ?? 0) + CONTAINER_FRAME_INSET_PX };
    case Position.Bottom:
      return { ...offsets, bottom: (offsets.bottom ?? 0) + CONTAINER_FRAME_INSET_PX };
    default:
      return offsets;
  }
}

/**
 * Finds the visible inner source/target handle pair used by container preview
 * edges. Returns null when the manifest cannot support a child continuation
 * preview.
 */
export function resolveContainerPreviewConnectionHandles(
  manifest: Pick<NodeManifest, 'handleConfiguration'> | undefined,
  context: ResolutionContext
): ContainerPreviewConnectionHandles | null {
  if (!manifest) return null;

  const innerGroups = resolveHandles(manifest.handleConfiguration, context).filter(
    (group) => group.boundary === 'inner' && (group.visible ?? true)
  );
  const sourceHandle = pickPreferredInnerHandle(innerGroups, 'source');
  const targetHandle = pickPreferredInnerHandle(innerGroups, 'target');

  if (!sourceHandle || !targetHandle) return null;

  return {
    sourceHandleId: sourceHandle.handle.id,
    sourceHandlePosition: getOppositePosition(sourceHandle.group.position as Position),
    targetHandleId: targetHandle.handle.id,
  };
}

function pickPreferredInnerHandle(
  groups: ResolvedHandleGroup[],
  type: 'source' | 'target'
): { group: ResolvedHandleGroup; handle: ResolvedHandleGroup['handles'][number] } | null {
  for (const group of groups) {
    const handle = group.handles.find((candidate) => candidate.type === type && candidate.visible);
    if (handle) {
      return { group, handle };
    }
  }

  return null;
}

function resolveClickedHandle({
  source,
  reactFlowInstance,
  getManifestForNode,
}: {
  source: PreviewEndpoint;
  reactFlowInstance: ReactFlowInstance;
  getManifestForNode: ContainerPreviewManifestResolver;
}): { boundary: ContainerHandleBoundary; handleType?: string } | undefined {
  if (!source.handleId) return undefined;

  const sourceNode = reactFlowInstance.getNode(source.nodeId);
  if (!sourceNode) return undefined;

  const sourceManifest = getManifestForNode(sourceNode);
  const dataHandleConfiguration = (sourceNode.data as Record<string, unknown>)
    ?.handleConfigurations;
  const handleConfiguration = Array.isArray(dataHandleConfiguration)
    ? (dataHandleConfiguration as HandleGroupManifest[])
    : sourceManifest?.handleConfiguration;
  if (!handleConfiguration) return undefined;

  const sourceHandles = resolveHandles(handleConfiguration, {
    ...sourceNode.data,
    nodeId: sourceNode.id,
  });

  for (const group of sourceHandles) {
    const handle = group.handles.find((candidate) => candidate.id === source.handleId);
    if (handle) {
      return {
        boundary: (group.boundary ?? 'outer') as ContainerHandleBoundary,
        handleType: handle.handleType,
      };
    }
  }

  return undefined;
}

/**
 * Produces preview-graph overrides for Add Node operations that interact with a
 * loop/container node.
 */
export function resolveContainerAddNodePreview({
  source,
  sourceHandleType,
  reactFlowInstance,
  getManifestForNode,
  replacedEdge,
}: {
  source: PreviewEndpoint;
  sourceHandleType: 'source' | 'target';
  reactFlowInstance: ReactFlowInstance;
  getManifestForNode: ContainerPreviewManifestResolver;
  replacedEdge?: Edge;
}): PreviewGraphOverrides | null {
  const clickedHandle = resolveClickedHandle({
    source,
    reactFlowInstance,
    getManifestForNode,
  });

  // Container sequence insertion is reserved for workflow outputs. Resource
  // handles and unresolved runtime handles keep the generic attachment preview,
  // scoped by the source node's parent container when one exists.
  if (clickedHandle?.handleType !== 'output') {
    return null;
  }

  const sourceNode = reactFlowInstance.getNode(source.nodeId);
  const sourceIsContainer =
    sourceNode !== undefined && isContainerNodeManifest(getManifestForNode(sourceNode));
  const allowedContainerId =
    sourceIsContainer && clickedHandle.boundary !== 'inner' ? sourceNode?.parentId : undefined;

  if (sourceIsContainer && clickedHandle.boundary !== 'inner' && !allowedContainerId) {
    return null;
  }

  return resolveContainerPreview({
    source,
    sourceHandleType,
    reactFlowInstance,
    replacedEdge,
    allowedContainerId,
    isContainerNode: (node) => isContainerNodeManifest(getManifestForNode(node)),
    getContainerSafeArea,
    getContainerContinuationTarget: ({ containerNode }) => {
      // Appending from a child reconnects to the container's inner target handle
      // so the preview edge shows the continuation back into the container.
      const previewHandles = resolveContainerPreviewConnectionHandles(
        getManifestForNode(containerNode),
        {
          ...containerNode.data,
          nodeId: containerNode.id,
        }
      );

      return previewHandles
        ? {
            nodeId: containerNode.id,
            handleId: previewHandles.targetHandleId,
          }
        : null;
    },
  });
}

/**
 * Connect-end drags from a container's own inner handle should keep the
 * user's drop position and the preview should be parented.
 */
export function getInnerHandleContainerId({
  source,
  reactFlowInstance,
  getManifestForNode,
}: {
  source: PreviewEndpoint;
  reactFlowInstance: ReactFlowInstance;
  getManifestForNode: ContainerPreviewManifestResolver;
}): string | undefined {
  const sourceNode = reactFlowInstance.getNode(source.nodeId);
  if (!sourceNode || !isContainerNodeManifest(getManifestForNode(sourceNode))) {
    return undefined;
  }

  const clickedHandle = resolveClickedHandle({
    source,
    reactFlowInstance,
    getManifestForNode,
  });

  return clickedHandle?.boundary === 'inner' ? sourceNode.id : undefined;
}

/**
 * Re-buckets resolved handle groups according to user-dragged offsets: a handle
 * with an entry in `offsets` leaves its manifest group and renders in a
 * synthetic single-handle group on the dragged wall, carrying an explicit
 * `offsetPx` so it bypasses the slot distribution. Handles without offsets stay
 * in their manifest group and keep the default layout.
 */
export function applyHandleOffsets(
  groups: ResolvedHandleGroup[],
  offsets: HandleOffsets | undefined
): ResolvedHandleGroup[] {
  if (!offsets || Object.keys(offsets).length === 0) {
    return groups;
  }

  const result: ResolvedHandleGroup[] = [];

  for (const group of groups) {
    const staying = group.handles.filter((handle) => !offsets[handle.id]);
    const moved = group.handles.filter((handle) => offsets[handle.id]);

    if (staying.length > 0) {
      result.push(staying.length === group.handles.length ? group : { ...group, handles: staying });
    }

    for (const handle of moved) {
      const target = offsets[handle.id];
      if (!target) continue;
      result.push({
        ...group,
        position: target.position,
        slotCount: undefined,
        customPositionAndOffsets: undefined,
        handles: [{ ...handle, offsetPx: target.offset } as (typeof group.handles)[number]],
      });
    }
  }

  return result;
}

/**
 * Collects the wall offsets (px along each wall) currently occupied by the
 * inner handles of a container, so a drag can keep the moving pill clear of
 * its siblings. Handles the caller excludes (the dragged pill and its outer
 * mirror) are skipped. Handles carrying an explicit `offsetPx` (already
 * dragged) report it directly; the rest report the default slot position the
 * renderer would give them (same count-based distribution as ButtonHandles).
 */
export function collectOccupiedWallOffsets(
  groups: ReadonlyArray<ResolvedHandleGroup>,
  options: {
    nodeWidth: number;
    nodeHeight: number;
    excludeHandleIds: ReadonlyArray<string>;
  }
): Partial<Record<HandleWallOffset['position'], number[]>> {
  const { nodeWidth, nodeHeight, excludeHandleIds } = options;
  const excluded = new Set(excludeHandleIds);
  const occupied: Partial<Record<HandleWallOffset['position'], number[]>> = {};

  for (const group of groups) {
    if ((group.boundary ?? 'outer') !== 'inner') continue;
    const wall = group.position as HandleWallOffset['position'];
    const wallLength = wall === 'left' || wall === 'right' ? nodeHeight : nodeWidth;
    if (wallLength <= 0) continue;

    const visibleHandles = group.handles.filter((handle) => handle.visible ?? true);
    const layoutSlotCount =
      group.slotCount && group.slotCount >= visibleHandles.length
        ? group.slotCount
        : visibleHandles.length;
    const slotPositions = calculateGridAlignedHandlePositions(wallLength, layoutSlotCount);

    visibleHandles.forEach((handle, index) => {
      if (excluded.has(handle.id)) return;
      const explicitOffset = (handle as { offsetPx?: number }).offsetPx;
      const offset = explicitOffset ?? slotPositions[index] ?? wallLength / 2;
      (occupied[wall] ??= []).push(offset);
    });
  }

  return occupied;
}

/**
 * Projects a pointer position (in node-local px) onto the nearest allowed wall,
 * snapped to the drag grid and clamped away from the corners (and away from the
 * header on the side walls). When `occupiedOffsets` is provided, the result
 * also keeps HANDLE_DRAG_MIN_SPACING_PX from every other handle on the chosen
 * wall, settling on the nearest free grid slot. Returns null when no valid
 * slot exists (the caller keeps the previous position).
 */
export function resolveHandleWallDrag(options: {
  localX: number;
  localY: number;
  nodeWidth: number;
  nodeHeight: number;
  allowedWalls: ReadonlyArray<HandleWallOffset['position']>;
  /**
   * Node-local y of the dashed body frame's top edge (the measured header
   * bottom). When provided, the side-wall top clamp mirrors the bottom one:
   * the pill keeps the same clearance from the frame's top edge as
   * HANDLE_DRAG_CORNER_MARGIN_PX gives it from the frame's bottom edge.
   * Falls back to HANDLE_DRAG_TOP_MARGIN_PX when absent.
   */
  contentTopPx?: number;
  /** Offsets already taken by other handles, per wall (from collectOccupiedWallOffsets). */
  occupiedOffsets?: Partial<Record<HandleWallOffset['position'], ReadonlyArray<number>>>;
}): HandleWallOffset | null {
  const { localX, localY, nodeWidth, nodeHeight, allowedWalls, contentTopPx, occupiedOffsets } =
    options;
  if (allowedWalls.length === 0 || nodeWidth <= 0 || nodeHeight <= 0) return null;

  const distances: Record<HandleWallOffset['position'], number> = {
    left: localX,
    right: nodeWidth - localX,
    top: localY,
    bottom: nodeHeight - localY,
  };

  let wall: HandleWallOffset['position'] | null = null;
  for (const candidate of allowedWalls) {
    if (wall === null || distances[candidate] < distances[wall]) {
      wall = candidate;
    }
  }
  if (wall === null) return null;

  const isSideWall = wall === 'left' || wall === 'right';
  const wallLength = isSideWall ? nodeHeight : nodeWidth;
  const raw = isSideWall ? localY : localX;

  // Side walls start below the header. With a measured header bottom the top
  // clearance from the dashed frame (frame top = header bottom) equals the
  // bottom clearance (corner margin measured from the node edge, frame inset
  // CONTAINER_FRAME_INSET_PX above it), keeping both limits symmetric.
  const startMargin = isSideWall
    ? contentTopPx != null
      ? contentTopPx + HANDLE_DRAG_CORNER_MARGIN_PX - CONTAINER_FRAME_INSET_PX
      : HANDLE_DRAG_TOP_MARGIN_PX
    : HANDLE_DRAG_CORNER_MARGIN_PX;
  // Grid-aligned clamp bounds so snapping never lands inside a corner margin.
  const lo = Math.ceil(startMargin / HANDLE_DRAG_GRID_PX) * HANDLE_DRAG_GRID_PX;
  const hi =
    Math.floor((wallLength - HANDLE_DRAG_CORNER_MARGIN_PX) / HANDLE_DRAG_GRID_PX) *
    HANDLE_DRAG_GRID_PX;
  if (hi < lo) return null;

  const snapped = Math.round(raw / HANDLE_DRAG_GRID_PX) * HANDLE_DRAG_GRID_PX;
  const clamped = Math.min(hi, Math.max(lo, snapped));

  const occupied = occupiedOffsets?.[wall] ?? [];
  const isFree = (value: number) =>
    occupied.every((other) => Math.abs(value - other) >= HANDLE_DRAG_MIN_SPACING_PX);

  if (isFree(clamped)) {
    return { position: wall, offset: clamped };
  }

  // Occupied: walk outward in grid steps to the nearest free slot. On ties,
  // follow the side the pointer leans toward.
  for (let step = HANDLE_DRAG_GRID_PX; ; step += HANDLE_DRAG_GRID_PX) {
    const below = clamped - step;
    const above = clamped + step;
    const belowValid = below >= lo && isFree(below);
    const aboveValid = above <= hi && isFree(above);

    if (belowValid && aboveValid) {
      return { position: wall, offset: raw < clamped ? below : above };
    }
    if (belowValid) return { position: wall, offset: below };
    if (aboveValid) return { position: wall, offset: above };
    if (below < lo && above > hi) return null;
  }
}
