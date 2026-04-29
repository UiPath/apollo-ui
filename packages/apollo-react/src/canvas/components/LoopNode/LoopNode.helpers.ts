import { type Node, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { DEFAULT_CONTAINER_HEIGHT, DEFAULT_CONTAINER_WIDTH } from '../../constants';
import type { NodeManifest } from '../../schema/node-definition';
import { getOppositePosition } from '../../utils/createPreviewNode';
import type { ResolutionContext, ResolvedHandleGroup } from '../../utils/manifest-resolver';
import { resolveHandles } from '../../utils/manifest-resolver';
import { snapToGrid } from '../../utils/NodeUtils';
import { CONTAINER_FRAME_INSET_PX, DEFAULT_CONTAINER_HEADER_HEIGHT_PX } from './LoopNode.constants';

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function isContainerNodeManifest(
  manifest: Pick<NodeManifest, 'display'> | undefined
): boolean {
  return manifest?.display.shape === 'container';
}

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

export function getContainerBodyCenter({
  width,
  height,
  headerHeight,
}: {
  width: number;
  height: number;
  headerHeight: number;
}) {
  const clampedHeaderHeight = clamp(headerHeight, 0, height);

  return {
    x: clamp(snapToGrid(width / 2), 0, width),
    y: clamp(snapToGrid(clampedHeaderHeight + (height - clampedHeaderHeight) / 2), 0, height),
  };
}

export function getContainerRelativeBodyCenter(
  containerNode: Pick<Node, 'width' | 'height' | 'measured' | 'style'>
) {
  const width = readNumericDimension(
    containerNode.width,
    containerNode.measured?.width,
    containerNode.style?.width
  );
  const height = readNumericDimension(
    containerNode.height,
    containerNode.measured?.height,
    containerNode.style?.height
  );

  return getContainerBodyCenter({
    width: width ?? DEFAULT_CONTAINER_WIDTH,
    height: height ?? DEFAULT_CONTAINER_HEIGHT,
    headerHeight: DEFAULT_CONTAINER_HEADER_HEIGHT_PX,
  });
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

function readNumericDimension(...values: Array<number | string | undefined>): number | undefined {
  for (const value of values) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsedValue = Number.parseFloat(value);
      if (Number.isFinite(parsedValue)) return parsedValue;
    }
  }

  return undefined;
}

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
