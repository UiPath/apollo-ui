import { Position, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useState } from 'react';
import { SEQ_BAR_HEIGHT, SEQ_EDGE_CORNER_RADIUS } from '../../../constants';
import { useBaseCanvasMode } from '../../BaseCanvas/BaseCanvasModeProvider';
import { areEdgePropsEqual } from '../../Edges/shared/areEdgePropsEqual';
import { EMPTY_WAYPOINTS } from '../../Edges/shared/constants';
import { useEdgeGeometry, useExecutionEdge } from '../../Edges/shared/hooks';
import { EdgeArrow, EdgeLabel, EdgePath } from '../../Edges/shared/primitives';
import { resolveEdgeColor } from '../../Edges/shared/resolveEdgeColor';
import type { SequentialConnectorEdgeProps } from './SequentialConnectorEdge.types';
import { resolveConnectorStrokeStyle } from './sequentialConnectorStyle';

/** Vertical offset between a non-branch connector's label pill and its centered ⊕. */
const INSERT_BUTTON_LABEL_OFFSET_PX = 26;

/** 1px bite into the target bar's top edge; a deeper tuck is clipped behind the opaque bar. */
const ARROW_TIP_AT_BAR_EDGE = { x: 0, y: 1 } as const;
/** Same bite into the left face for branch-entry arrows. */
const ARROW_TIP_AT_BAR_LEFT_EDGE = { x: 1, y: 0 } as const;

interface TargetGeometry {
  topY: number | undefined;
  leftX: number | undefined;
  height: number | undefined;
}

export function getLeftEntryArrowTargetY(
  targetTopY: number | undefined,
  targetY: number,
  targetHeight: number | undefined
): number {
  return (targetTopY ?? targetY) + (targetHeight ?? SEQ_BAR_HEIGHT) / 2;
}

/**
 * Sequential-view connector edge: stroke style by kind and verbatim `data.waypoints`.
 * The ⊕ and branch header for every connector render from the canvas-level
 * SequentialInsertLayer, not from the edge. `data` is compared by reference, so the
 * assembly must keep it stable.
 */
export const SequentialConnectorEdge = memo(function SequentialConnectorEdge({
  id,
  selected,
  source,
  target,
  sourceX,
  sourceY,
  sourcePosition = Position.Bottom,
  targetX,
  targetY,
  targetPosition = Position.Top,
  sourceHandleId,
  targetHandleId,
  style,
  data,
}: SequentialConnectorEdgeProps) {
  const isDesignMode = useBaseCanvasMode().mode === 'design';

  // Anchor the arrowhead to the bar's absolute position: the handle-derived
  // `targetX/Y` sit slightly off the painted edge. One subscription for the three
  // fields, so a viewport frame re-runs one selector per edge, not three.
  const targetGeometry = useStore(
    (s): TargetGeometry => {
      const targetNode = s.nodeLookup.get(target);
      return {
        topY: targetNode?.internals.positionAbsolute.y,
        leftX: targetNode?.internals.positionAbsolute.x,
        // Declared height first: the measured value can trail a slider update by one render.
        height: targetNode?.height ?? targetNode?.measured?.height,
      };
    },
    (a, b) => a.topY === b.topY && a.leftX === b.leftX && a.height === b.height
  );
  const { topY: targetTopY, leftX: targetLeftX, height: targetHeight } = targetGeometry ?? {};
  const isLeftEntry = targetPosition === Position.Left;

  const [isHovered, setIsHovered] = useState(false);
  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);

  const kind = data?.kind ?? 'step';
  const label = data?.label;
  const slot = data?.slot;
  const hideArrowHead = !!data?.hideArrowHead;
  const isPreview = !!data?.preview;
  const waypoints = data?.waypoints ?? EMPTY_WAYPOINTS;

  const geometry = useEdgeGeometry({
    routing: 'waypoint',
    edgeId: id,
    sourceNodeId: source,
    targetNodeId: target,
    sourceHandleId,
    targetHandleId,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    waypoints,
    enableSegments: false,
    hideArrowHead,
    // createRoundedPath clamps this to half the shorter adjacent segment.
    borderRadius: SEQ_EDGE_CORNER_RADIUS,
    // `enableLineJumps` stays off: crossings here are structural rails, and hops would read as noise.
  });

  const execution = useExecutionEdge({
    edgeId: id,
    target,
    edgePath: geometry.edgePath,
    enabled: !!data?.enableExecution,
  });

  const color = resolveEdgeColor({
    selected,
    isHovered,
    previewEdge: isPreview,
    statusColor: execution.statusColor,
  });

  const strokeStyle = isPreview ? 'dashed' : resolveConnectorStrokeStyle(kind);
  // The layer renders a ⊕ on this connector; lift the pill so the two do not overlap.
  const showInsert = isDesignMode && !!slot;
  const hasLabel = typeof label === 'string' && label.length > 0;

  const labelPoint = showInsert
    ? { x: geometry.labelPoint.x, y: geometry.labelPoint.y - INSERT_BUTTON_LABEL_OFFSET_PX }
    : geometry.labelPoint;
  const resolvedTargetHeight = typeof targetHeight === 'number' ? targetHeight : SEQ_BAR_HEIGHT;
  const resolvedTargetTopY =
    typeof targetTopY === 'number'
      ? targetTopY
      : isLeftEntry
        ? targetY - resolvedTargetHeight / 2
        : targetY;
  const resolvedTargetLeftX = typeof targetLeftX === 'number' ? targetLeftX : targetX;

  const arrowTarget = useMemo(
    () =>
      isLeftEntry
        ? {
            x: resolvedTargetLeftX,
            y: getLeftEntryArrowTargetY(resolvedTargetTopY, targetY, resolvedTargetHeight),
          }
        : { x: targetX, y: resolvedTargetTopY },
    [isLeftEntry, resolvedTargetLeftX, resolvedTargetTopY, resolvedTargetHeight, targetX, targetY]
  );

  const opacity = (style?.opacity as number | undefined) ?? 1;

  return (
    <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <EdgePath
        id={id}
        d={geometry.edgePath}
        color={color}
        selected={selected}
        strokeStyle={strokeStyle}
        style={style}
        opacity={opacity}
      />

      {!hideArrowHead && (
        <EdgeArrow
          target={arrowTarget}
          angle={geometry.arrow.angle}
          offset={isLeftEntry ? ARROW_TIP_AT_BAR_LEFT_EDGE : ARROW_TIP_AT_BAR_EDGE}
          color={color}
          opacity={opacity}
        />
      )}

      {execution.animation}

      {hasLabel && kind !== 'branch-entry' && (
        <EdgeLabel x={labelPoint.x} y={labelPoint.y} text={label as string} borderColor={color} />
      )}
    </g>
  );
}, areEdgePropsEqual);
