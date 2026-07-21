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
 * Minimum distance from the container top for handles on the side walls, so a
 * dragged handle never collides with the header area.
 */
export const HANDLE_DRAG_TOP_MARGIN_PX = 112;

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
 * Projects a pointer position (in node-local px) onto the nearest allowed wall,
 * snapped to the drag grid and clamped away from the corners (and away from the
 * header on the side walls). Returns null when the node is too small to offer a
 * valid slot on any allowed wall.
 */
export function resolveHandleWallDrag(options: {
  localX: number;
  localY: number;
  nodeWidth: number;
  nodeHeight: number;
  allowedWalls: ReadonlyArray<HandleWallOffset['position']>;
}): HandleWallOffset | null {
  const { localX, localY, nodeWidth, nodeHeight, allowedWalls } = options;
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

  const startMargin = isSideWall ? HANDLE_DRAG_TOP_MARGIN_PX : HANDLE_DRAG_CORNER_MARGIN_PX;
  // Grid-aligned clamp bounds so snapping never lands inside a corner margin.
  const lo = Math.ceil(startMargin / HANDLE_DRAG_GRID_PX) * HANDLE_DRAG_GRID_PX;
  const hi =
    Math.floor((wallLength - HANDLE_DRAG_CORNER_MARGIN_PX) / HANDLE_DRAG_GRID_PX) *
    HANDLE_DRAG_GRID_PX;
  if (hi < lo) return null;

  const snapped = Math.round(raw / HANDLE_DRAG_GRID_PX) * HANDLE_DRAG_GRID_PX;
  return { position: wall, offset: Math.min(hi, Math.max(lo, snapped)) };
}
