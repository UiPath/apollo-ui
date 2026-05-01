import {
  type Node,
  Position,
  type ReactFlowInstance,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { NodeManifest } from '../../schema/node-definition';
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

function resolveClickedHandleType({
  source,
  reactFlowInstance,
  getManifestForNode,
}: {
  source: PreviewEndpoint;
  reactFlowInstance: ReactFlowInstance;
  getManifestForNode: ContainerPreviewManifestResolver;
}): string | undefined {
  if (!source.handleId) return undefined;

  const sourceNode = reactFlowInstance.getNode(source.nodeId);
  if (!sourceNode) return undefined;

  const sourceManifest = getManifestForNode(sourceNode);
  if (!sourceManifest) return undefined;

  const sourceHandles = resolveHandles(sourceManifest.handleConfiguration, {
    ...sourceNode.data,
    nodeId: sourceNode.id,
  });

  for (const group of sourceHandles) {
    const handle = group.handles.find((candidate) => candidate.id === source.handleId);
    if (handle) return handle.handleType;
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
}: {
  source: PreviewEndpoint;
  sourceHandleType: 'source' | 'target';
  reactFlowInstance: ReactFlowInstance;
  getManifestForNode: ContainerPreviewManifestResolver;
}): PreviewGraphOverrides | null {
  const clickedHandleType = resolveClickedHandleType({
    source,
    reactFlowInstance,
    getManifestForNode,
  });

  // Container sequence insertion is reserved for workflow outputs. Resource
  // handles (artifact/input semantics) keep the generic attachment preview,
  // scoped by the source node's parent container when one exists.
  if (clickedHandleType && clickedHandleType !== 'output') {
    return null;
  }

  return resolveContainerPreview({
    source,
    sourceHandleType,
    reactFlowInstance,
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
