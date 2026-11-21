import { type EdgeProps, type EdgeTypes, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useBaseCanvasMode } from '../BaseCanvas';
import { EMPTY_WAYPOINTS } from '../Edges/shared/constants';
import { isSegmentInteractable, isSegmentPerpendicular } from '../Edges/shared/geometry';
import { useEdgeGeometry, useNodeDragRebalance, useWaypointEditor } from '../Edges/shared/hooks';
import {
  EdgeArrow,
  EdgeLabel,
  EdgePath,
  SegmentDragHandle,
  WaypointHandle,
} from '../Edges/shared/primitives';
import { resolveEdgeColor } from '../Edges/shared/resolveEdgeColor';
import type { Point, Waypoint } from '../Edges/shared/types';
import { generateWaypointId } from '../Edges/shared/waypoints';
import { EdgeToolbar } from '../Toolbar/EdgeToolbar';
import type {
  EdgeToolbarConfig,
  EdgeToolbarPositionData,
} from '../Toolbar/EdgeToolbar/EdgeToolbar.types';
import { type BpmnEdge as BpmnEdgeModel, useBpmnSpikeActions } from './bpmnSpike.model';

type EdgeKind = 'sequence' | 'message' | 'association' | 'data';

const HOLLOW_FILL = 'var(--canvas-background, var(--color-background))';
const DOTTED = '2,5';

const DIRECTION: Record<Position, Point> = {
  [Position.Right]: { x: 1, y: 0 },
  [Position.Left]: { x: -1, y: 0 },
  [Position.Top]: { x: 0, y: -1 },
  [Position.Bottom]: { x: 0, y: 1 },
};

// Toolbar centre, measured from the path or, when there is a label, from the label's centre.
const TOOLBAR_OFFSET = 24;
const TOOLBAR_OFFSET_OVER_LABEL = 28;

/**
 * Fixed toolbar spot at the label point, in place of apollo's pointer-following one: above a
 * label or a horizontal run, beside a vertical run.
 */
function toolbarPositionAt(
  anchor: Point,
  pathPoints: Point[],
  hasLabel: boolean
): EdgeToolbarPositionData {
  if (hasLabel) {
    return {
      pathPosition: anchor,
      offsetPosition: { x: anchor.x, y: anchor.y - TOOLBAR_OFFSET_OVER_LABEL },
    };
  }
  let nearest = Number.POSITIVE_INFINITY;
  let vertical = false;
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const a = pathPoints[i]!;
    const b = pathPoints[i + 1]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const detour =
      Math.hypot(anchor.x - a.x, anchor.y - a.y) + Math.hypot(b.x - anchor.x, b.y - anchor.y);
    if (detour - length < nearest) {
      nearest = detour - length;
      vertical = Math.abs(b.y - a.y) > Math.abs(b.x - a.x);
    }
  }
  return {
    pathPosition: anchor,
    offsetPosition: vertical
      ? { x: anchor.x + TOOLBAR_OFFSET, y: anchor.y }
      : { x: anchor.x, y: anchor.y - TOOLBAR_OFFSET },
  };
}

const samePoints = (a: Point[], b: Point[]) =>
  a.length === b.length && a.every((point, i) => point.x === b[i]!.x && point.y === b[i]!.y);

/**
 * BPMN stores the whole polyline (source anchor, bends, target anchor) with no ids; apollo's
 * editor wants only the bends, each with a stable id. This is the render-time adapter: ids are
 * kept while the stored positions still match what the editor last wrote.
 */
function useBendWaypoints(stored: Point[] | undefined) {
  const cache = useRef<Waypoint[]>(EMPTY_WAYPOINTS);
  const bends = useMemo(() => {
    const next = stored && stored.length > 2 ? stored.slice(1, -1) : [];
    if (!samePoints(cache.current, next)) {
      cache.current = next.length
        ? next.map((point) => ({ ...point, id: generateWaypointId() }))
        : EMPTY_WAYPOINTS;
    }
    return cache.current;
  }, [stored]);
  return { bends, cache };
}

/** Start-of-flow markers BPMN needs and `EdgeArrow` has no variant for. */
function SourceMarker({
  kind,
  origin,
  side,
  color,
}: {
  kind: 'default' | 'conditional' | 'message';
  origin: Point;
  side: Position;
  color: string;
}) {
  const d = DIRECTION[side];
  const n = { x: -d.y, y: d.x };
  const at = (along: number, across: number) =>
    `${origin.x + d.x * along + n.x * across},${origin.y + d.y * along + n.y * across}`;
  const stroke = { stroke: color, strokeWidth: 1.5, pointerEvents: 'none' as const };

  if (kind === 'default') {
    return <polyline points={`${at(7, 5)} ${at(12, -5)}`} fill="none" {...stroke} />;
  }
  if (kind === 'conditional') {
    return (
      <polygon
        points={`${at(0, 0)} ${at(7, 4)} ${at(14, 0)} ${at(7, -4)}`}
        fill={HOLLOW_FILL}
        {...stroke}
      />
    );
  }
  return (
    <circle cx={origin.x + d.x * 5} cy={origin.y + d.y * 5} r={4} fill={HOLLOW_FILL} {...stroke} />
  );
}

/** Message flow and data association end in an open arrow. */
function OpenArrow({
  tip,
  angle,
  color,
  closed,
}: {
  tip: Point;
  angle: number;
  color: string;
  closed: boolean;
}) {
  const wing = (sign: number) =>
    `${tip.x - 10 * Math.cos(angle + sign * 0.45)},${tip.y - 10 * Math.sin(angle + sign * 0.45)}`;
  const points = `${wing(-1)} ${tip.x},${tip.y} ${wing(1)}`;
  const style = { stroke: color, strokeWidth: 1.5, pointerEvents: 'none' as const };
  return closed ? (
    <polygon points={points} fill={HOLLOW_FILL} {...style} />
  ) : (
    <polyline points={points} fill="none" {...style} />
  );
}

function BpmnEdgeBase({
  kind,
  id,
  selected,
  source,
  target,
  sourceX,
  sourceY,
  sourcePosition = Position.Right,
  targetX,
  targetY,
  targetPosition = Position.Left,
  sourceHandleId,
  targetHandleId,
  data,
}: EdgeProps<BpmnEdgeModel> & { kind: EdgeKind }) {
  const canEdit = useBaseCanvasMode().mode === 'design';
  const actions = useBpmnSpikeActions();
  const [isHovered, setIsHovered] = useState(false);
  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);
  const pathRef = useRef<SVGPathElement | null>(null);

  const orthogonal = kind === 'sequence' || kind === 'message';
  // As in BPMN today: the path is only adjustable once the edge is selected.
  const editingEnabled = orthogonal && canEdit && !!selected;
  const { bends, cache } = useBendWaypoints(data?.waypoints);

  // Controlled: every edit goes to the host's model, never to the xyflow store.
  const { setWaypoints } = actions;
  const onWaypointsChange = useCallback(
    (next: Waypoint[]) => {
      cache.current = next;
      setWaypoints(id, [
        { x: sourceX, y: sourceY },
        ...next.map(({ x, y }) => ({ x, y })),
        { x: targetX, y: targetY },
      ]);
    },
    [cache, id, setWaypoints, sourceX, sourceY, targetX, targetY]
  );

  const waypoints = useNodeDragRebalance({
    edgeId: id,
    source,
    target,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    waypoints: bends,
    enabled: editingEnabled,
    onChange: onWaypointsChange,
  });

  const filledArrow = kind === 'sequence';
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
    autoRouted: waypoints.length === 0,
    enableSegments: editingEnabled,
    hideArrowHead: !filledArrow,
    enableLineJumps: orthogonal,
  });

  const editor = useWaypointEditor({
    edgeId: id,
    waypoints,
    pathPoints: geometry.pathPoints,
    enabled: editingEnabled,
    onChange: onWaypointsChange,
    buildPath: geometry.buildPath,
  });

  const color = resolveEdgeColor({
    selected,
    isHovered,
    isInvalid: false,
    isDiffAdded: false,
    isDiffRemoved: false,
    suggestionType: data?.modification,
    previewEdge: false,
    statusColor: undefined,
  });

  const toolbarEnabled = canEdit && (isHovered || !!selected) && !editor.isDragging;
  const toolbarConfig = useMemo<EdgeToolbarConfig>(
    () => ({
      actions: [
        ...(kind === 'sequence'
          ? [
              {
                id: 'add-element',
                icon: 'plus',
                label: 'Add element',
                onAction: actions.insertOnEdge,
              },
            ]
          : []),
        { id: 'delete', icon: 'trash-2', label: 'Delete', onAction: actions.deleteEdge },
      ],
    }),
    [actions.deleteEdge, actions.insertOnEdge, kind]
  );

  const origin = useMemo(() => ({ x: sourceX, y: sourceY }), [sourceX, sourceY]);
  const tip = useMemo(() => ({ x: targetX, y: targetY }), [targetX, targetY]);
  const straight = `M${sourceX},${sourceY} L${targetX},${targetY}`;
  const straightAngle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const labelPoint = useMemo(
    () =>
      orthogonal ? geometry.labelPoint : { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 },
    [orthogonal, geometry.labelPoint, sourceX, sourceY, targetX, targetY]
  );
  const toolbarPosition = useMemo(
    () =>
      toolbarPositionAt(
        labelPoint,
        orthogonal ? geometry.pathPoints : [origin, tip],
        !!data?.label
      ),
    [labelPoint, orthogonal, geometry.pathPoints, origin, tip, data?.label]
  );
  const sourceMarker =
    kind === 'message'
      ? 'message'
      : kind === 'sequence' && data?.defaultFlow
        ? 'default'
        : kind === 'sequence' && data?.conditionExpression
          ? 'conditional'
          : null;

  return (
    <>
      <g
        data-edge-hovered={isHovered || undefined}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <EdgePath
          id={id}
          d={orthogonal ? geometry.edgePath : straight}
          color={color}
          selected={selected}
          strokeStyle={kind === 'message' ? 'dashed' : 'solid'}
          dasharray={orthogonal ? undefined : DOTTED}
          isReadOnly={!canEdit}
          pathRef={pathRef}
        />

        {editingEnabled &&
          geometry.segments.map((segment, index) =>
            isSegmentInteractable(segment) && isSegmentPerpendicular(segment) ? (
              <SegmentDragHandle
                key={segment.id}
                segment={segment}
                segmentIndex={index}
                handlers={editor.segmentHandlers}
              />
            ) : null
          )}
        {editingEnabled &&
          waypoints.map((waypoint, index) => (
            <WaypointHandle
              key={waypoint.id}
              waypoint={waypoint}
              index={index}
              forceVisible
              handlers={editor.waypointHandlers}
            />
          ))}

        {filledArrow && (
          <EdgeArrow
            target={tip}
            angle={geometry.arrow.angle}
            offset={geometry.arrow.offset}
            color={color}
          />
        )}
        {kind === 'message' && (
          <OpenArrow tip={tip} angle={geometry.arrow.angle} color={color} closed />
        )}
        {kind === 'data' && (
          <OpenArrow tip={tip} angle={straightAngle} color={color} closed={false} />
        )}
        {sourceMarker && (
          <SourceMarker kind={sourceMarker} origin={origin} side={sourcePosition} color={color} />
        )}

        {data?.label && (
          <EdgeLabel
            x={labelPoint.x}
            y={labelPoint.y}
            text={data.label}
            borderColor={color}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        )}
      </g>

      {toolbarEnabled && (
        <EdgeToolbar
          edgeId={id}
          visible
          positioning={toolbarPosition}
          config={toolbarConfig}
          layout="along-path"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      )}
    </>
  );
}

const forKind = (kind: EdgeKind) =>
  memo(function BpmnEdge(props: EdgeProps<BpmnEdgeModel>) {
    return <BpmnEdgeBase {...props} kind={kind} />;
  });

/** Keyed by BPMN `$type`, as PO.Frontend's `BPMN_ALL_EDGE_TYPES` is. */
export const bpmnEdgeTypes: EdgeTypes = {
  'bpmn:SequenceFlow': forKind('sequence'),
  'bpmn:MessageFlow': forKind('message'),
  'bpmn:Association': forKind('association'),
  'bpmn:DataInputAssociation': forKind('data'),
  'bpmn:DataOutputAssociation': forKind('data'),
};
