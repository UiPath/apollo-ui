import { type Node, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { NodeManifest } from '../../schema/node-definition';
import { getOppositePosition } from '../../utils/createPreviewGraph';
import {
  ResolutionContext,
  ResolvedHandleGroup,
  resolveHandles,
} from '../../utils/manifest-resolver';
import { snapToGrid } from '../../utils/NodeUtils';
import { DEFAULT_LOOP_HEADER_HEIGHT_PX, LOOP_FRAME_INSET_PX } from './LoopNode.constants';

export interface LoopPreviewConnectionHandles {
  sourceHandleId: string;
  sourceHandlePosition: Position;
  targetHandleId: string;
}

export function partitionLoopHandleGroups(groups: ResolvedHandleGroup[]): {
  outer: ResolvedHandleGroup[];
  inner: ResolvedHandleGroup[];
} {
  return groups.reduce(
    (acc, group) => {
      if (group.boundary === 'inner') {
        acc.inner.push({
          ...group,
          customPositionAndOffsets: insetInnerGroup(group),
        });
        return acc;
      }

      acc.outer.push(group);
      return acc;
    },
    { outer: [] as ResolvedHandleGroup[], inner: [] as ResolvedHandleGroup[] }
  );
}

export function getLoopBodyCenter({
  width,
  height,
  headerHeight,
}: {
  width: number;
  height: number;
  headerHeight: number;
}) {
  const clampedHeaderHeight = Math.min(Math.max(headerHeight, 0), height);
  const clampToBounds = (value: number, max: number) => Math.min(Math.max(value, 0), max);

  return {
    x: clampToBounds(snapToGrid(width / 2), width),
    y: clampToBounds(snapToGrid(clampedHeaderHeight + (height - clampedHeaderHeight) / 2), height),
  };
}

export function getLoopRelativeBodyCenter(
  loopNode: Pick<Node, 'width' | 'height' | 'measured' | 'style'>
) {
  const width = readNumericDimension(
    loopNode.width,
    loopNode.measured?.width,
    loopNode.style?.width
  );
  const height = readNumericDimension(
    loopNode.height,
    loopNode.measured?.height,
    loopNode.style?.height
  );

  return getLoopBodyCenter({
    width: width ?? 0,
    height: height ?? 0,
    headerHeight: DEFAULT_LOOP_HEADER_HEIGHT_PX,
  });
}

function insetInnerGroup(group: ResolvedHandleGroup) {
  const offsets = group.customPositionAndOffsets ?? {};

  switch (group.position) {
    case 'left':
      return { ...offsets, left: (offsets.left ?? 0) + LOOP_FRAME_INSET_PX };
    case 'right':
      return { ...offsets, right: (offsets.right ?? 0) + LOOP_FRAME_INSET_PX };
    case 'top':
      return { ...offsets, top: (offsets.top ?? 0) + LOOP_FRAME_INSET_PX };
    case 'bottom':
      return { ...offsets, bottom: (offsets.bottom ?? 0) + LOOP_FRAME_INSET_PX };
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

export function resolveLoopPreviewConnectionHandles(
  manifest: Pick<NodeManifest, 'handleConfiguration'> | undefined,
  context: ResolutionContext
): LoopPreviewConnectionHandles | null {
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
  const candidates = groups.flatMap((group) =>
    group.handles
      .filter((handle) => handle.type === type && handle.visible)
      .map((handle) => ({ group, handle }))
  );

  if (candidates.length === 0) return null;

  return candidates.find((candidate) => candidate.handle.isDefaultForType) ?? candidates[0]!;
}
