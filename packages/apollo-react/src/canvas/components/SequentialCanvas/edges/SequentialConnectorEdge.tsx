import { Position, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useState } from 'react';
import { useSafeLingui } from '../../../../i18n';
import { SEQ_BAR_HEIGHT, SEQ_EDGE_CORNER_RADIUS } from '../../../constants';
import { useBaseCanvasMode } from '../../BaseCanvas/BaseCanvasModeProvider';
import { areEdgePropsEqual } from '../../Edges/shared/areEdgePropsEqual';
import { EMPTY_WAYPOINTS } from '../../Edges/shared/constants';
import { useEdgeGeometry, useExecutionEdge } from '../../Edges/shared/hooks';
import { EdgeArrow, EdgeLabel, EdgePath } from '../../Edges/shared/primitives';
import { resolveEdgeColor } from '../../Edges/shared/resolveEdgeColor';
import { SequentialBranchHeader } from './SequentialBranchHeader';
import type { SequentialConnectorEdgeProps } from './SequentialConnectorEdge.types';
import { SequentialInsertButton } from './SequentialInsertButton';
import { resolveConnectorStrokeStyle } from './sequentialConnectorStyle';
import { useSequentialInsert } from './useSequentialInsert';

/**
 * Vertical offset (flow px) between a NON-branch connector's label pill and its
 * centered ⊕ (the ⊕ owns the connector's true midpoint; the label is nudged up).
 * Branch-entry connectors instead split the two onto separate segments of their
 * elbow (label on the vertical spine, ⊕ on the horizontal jog) so they never
 * crowd - see the branch placement below.
 */
const INSERT_BUTTON_LABEL_OFFSET_PX = 26;

/**
 * Sequential arrowhead placement. Flow-view edges translate the arrow
 * ARROW_OFFSET px INTO the target node so the node paints over the tuck;
 * sequential bars are opaque and connectors render behind them, so a big tuck is
 * clipped. The tip is anchored to the target bar's real top edge (read from the
 * store, see `targetTopY`); this 1px nudge lets it bite just into the bar so it
 * reads as connected rather than leaving a hairline gap, with the body in the
 * clear row gap above it so it stays fully visible without elevating the edge.
 */
/**
 * Vertical offset (flow px) that anchors a merge-back connector's insert plus
 * to an endpoint instead of the line midpoint. A merge-back's midpoint drifts
 * onto whichever row sits alongside it (e.g. a collapsed child), colliding with
 * that row's own add points; anchoring near an endpoint reads as "add right
 * here" and never lands on an unrelated row.
 */
const MERGE_BACK_INSERT_OFFSET_PX = 20;

const ARROW_TIP_AT_BAR_EDGE = { x: 0, y: 1 } as const;
/** Same 1px bite, but into the LEFT face for branch-entry (mid-left) arrows. */
const ARROW_TIP_AT_BAR_LEFT_EDGE = { x: 1, y: 0 } as const;

export function getLeftEntryArrowTargetY(
  targetTopY: number | undefined,
  targetY: number,
  targetHeight: number | undefined
): number {
  return (targetTopY ?? targetY) + (targetHeight ?? SEQ_BAR_HEIGHT) / 2;
}

/**
 * Sequential-view connector edge. Composes the shared edge primitives
 * (EdgePath / EdgeArrow / EdgeLabel) and renders behavior from `data`:
 *
 * - stroke style by kind (ordinary structural flow solid; irregular `goto`
 *   references and transient previews dashed) via {@link resolveConnectorStrokeStyle};
 * - an edge-styled label above the first row of each labeled branch;
 * - `data.waypoints` rendered verbatim (elbows supplied by layoutSequence; no
 *   router, no waypoint editing);
 * - a statically centered ⊕ insert affordance, revealed on hover/focus and
 *   available only in design mode when `data.slot` is present.
 *
 * See ./SequentialConnectorEdge.types.ts for the field-by-field `data` contract
 * the assembly builds. `data` is compared by reference (areEdgePropsEqual), so the assembly must
 * keep it reference-stable across data-only changes (D12).
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
  const { _ } = useSafeLingui();
  const isDesignMode = useBaseCanvasMode().mode === 'design';
  const { startInsert } = useSequentialInsert();

  // Real top-left corner of the target bar. The handle-derived `targetX/Y` sit
  // slightly off the bar's painted edge, so anchoring the arrowhead to the
  // node's absolute position lands the tip exactly on the bar — its top edge for
  // a normal (Top) entry, its left edge at mid-height for a branch (Left) entry.
  const targetTopY = useStore((s) => s.nodeLookup.get(target)?.internals.positionAbsolute.y);
  const targetLeftX = useStore((s) => s.nodeLookup.get(target)?.internals.positionAbsolute.x);
  const targetHeight = useStore((s) => {
    const targetNode = s.nodeLookup.get(target);
    // Sequential rows publish their layout-owned height immediately. Prefer it
    // over the measured value, which can trail a slider update by one render.
    return targetNode?.height ?? targetNode?.measured?.height;
  });
  // Branch-entry connectors carry a Left target handle, so React Flow reports
  // Position.Left here — the arrow then points right into the bar's mid-left.
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

  // Waypoint routing is used for every kind: elbowed connectors carry explicit
  // waypoints, and straight step connectors get a clean orthogonal path between
  // the two anchors from an empty waypoint list.
  const geometry = useEdgeGeometry({
    routing: 'waypoint',
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
    // Pronounced smooth-step corners for the sequential view: the elbowed
    // branch/merge-back connectors read as soft rounded steps rather than the
    // subtler default. createRoundedPath clamps this to half the shorter
    // adjacent segment, so tight jogs degrade gracefully.
    borderRadius: SEQ_EDGE_CORNER_RADIUS,
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

  // Merge-backs are ordinary structural flow regardless of whether they are a
  // straight container continuation or an elbowed branch rejoin. Only
  // irregular goto references and transient previews use a dashed stroke.
  const strokeStyle = isPreview ? 'dashed' : resolveConnectorStrokeStyle(kind);
  const showInsert = isDesignMode && !!slot;
  const hasLabel = typeof label === 'string' && label.length > 0;

  // Branch-entry connectors elbow: a vertical spine drop from the owner then a
  // horizontal jog into the target (waypoints [spineBottom, jogEnd] from
  // layoutSequence). The ⊕ stays on that horizontal jog. Its label is rendered
  // separately above the target row, so labels no longer
  // compete with connector geometry or one another.
  const wp0 = waypoints[0];
  const wp1 = waypoints[1];
  const isBranchElbow = kind === 'branch-entry' && wp0 !== undefined && wp1 !== undefined;
  // Merge-back placement: a straight merge-back (a container's continuation,
  // no waypoints) anchors just ABOVE its target, so "add after the container"
  // sits after the whole body rather than in the middle of it. An elbowed
  // merge-back (a branch lane rejoining the flow) anchors just BELOW its source,
  // so "add at the end of this branch" sits under the branch's last step.
  const insertPoint = isBranchElbow
    ? { x: (wp0.x + wp1.x) / 2, y: wp0.y }
    : kind === 'merge-back'
      ? waypoints.length === 0
        ? { x: targetX, y: targetY - MERGE_BACK_INSERT_OFFSET_PX }
        : { x: sourceX, y: sourceY + MERGE_BACK_INSERT_OFFSET_PX }
      : geometry.labelPoint;
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

  const onInsert = useCallback(() => {
    if (!slot) return;
    startInsert({
      slot,
      source,
      sourceHandleId,
      target,
      targetHandleId,
      sourcePosition,
      position: { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 },
      // This edge's OWN rendered id — the store in sequential view holds
      // derived connector edges, never canonical ids, so the split connector
      // must be found (and stashed for cancel-restore) by this id, not
      // slot.graphEdgeId.
      connectorEdgeId: id,
    });
  }, [
    slot,
    source,
    sourceHandleId,
    target,
    targetHandleId,
    sourcePosition,
    sourceX,
    sourceY,
    targetX,
    targetY,
    startInsert,
    id,
  ]);

  const opacity = (style?.opacity as number | undefined) ?? 1;

  return (
    <>
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
            target={
              isLeftEntry
                ? {
                    x: resolvedTargetLeftX,
                    y: getLeftEntryArrowTargetY(resolvedTargetTopY, targetY, resolvedTargetHeight),
                  }
                : { x: targetX, y: resolvedTargetTopY }
            }
            angle={geometry.arrow.angle}
            offset={isLeftEntry ? ARROW_TIP_AT_BAR_LEFT_EDGE : ARROW_TIP_AT_BAR_EDGE}
            color={color}
            opacity={opacity}
          />
        )}

        {execution.animation}

        {hasLabel && kind !== 'branch-entry' && (
          <EdgeLabel x={labelPoint.x} y={labelPoint.y} text={label as string} selected={selected} />
        )}
      </g>

      {hasLabel && kind === 'branch-entry' && (
        <SequentialBranchHeader
          x={resolvedTargetLeftX}
          targetTopY={resolvedTargetTopY}
          label={label as string}
          selected={selected}
        />
      )}

      {showInsert && (
        <SequentialInsertButton
          point={insertPoint}
          label={_({ id: 'sequential-canvas.insert-step', message: 'Insert step' })}
          onInsert={onInsert}
        />
      )}
    </>
  );
}, areEdgePropsEqual);
