import {
  type EdgeProps,
  type EdgeTypes,
  Position,
  type ReactFlowState,
  useStore,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useBaseCanvasModeOr } from '../BaseCanvas';
import { EDGE_CONSTANTS, EMPTY_WAYPOINTS } from '../Edges/shared/constants';
import {
  buildPathVertices,
  getPathArcMidpoint,
  isSegmentInteractable,
  isSegmentPerpendicular,
} from '../Edges/shared/geometry';
import { useEdgeGeometry, useNodeDragRebalance, useWaypointEditor } from '../Edges/shared/hooks';
import { EdgePath, SegmentDragHandle, WaypointHandle } from '../Edges/shared/primitives';
import { resolveEdgeColor } from '../Edges/shared/resolveEdgeColor';
import type { Point, Waypoint } from '../Edges/shared/types';
import { generateWaypointId } from '../Edges/shared/waypoints';
import { EdgeToolbar } from '../Toolbar/EdgeToolbar';
import type {
  EdgeToolbarConfig,
  EdgeToolbarPositionData,
} from '../Toolbar/EdgeToolbar/EdgeToolbar.types';
import { BpmnEdgeLabel } from './BpmnEdgeLabel';
import {
  type BpmnEdge as BpmnEdgeModel,
  useBpmnActions,
  useBpmnOverlay,
  useBpmnStrings,
} from './bpmn.model';

type EdgeKind = 'sequence' | 'message' | 'association' | 'data';

const HOLLOW_FILL = 'var(--canvas-background, var(--color-background))';
const DOTTED = '2,5';
// BPMN flows carry as much meaning as the shapes, so they read stronger than Flow's edges:
// the resting colour matches the element borders.
const REST_COLOR = 'var(--foreground-muted)';
const STROKE = { strokeWidth: 2 };
// Important, since the path and its handles set their own pointer events inline.
const DIMMED = 'opacity-30 transition-opacity duration-100 [&_*]:pointer-events-none!';
const SELECTED_STROKE = { strokeWidth: 4 };
// The arrowhead BPMN draws today: 8px long and 12px wide, its corners rounded by a 2px stroke.
const ARROW_LENGTH = 8;
const ARROW_HALF_WIDTH = 6;
const ARROW_STROKE = {
  strokeWidth: 2,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
  pointerEvents: 'none' as const,
};
const RECONNECT_HANDLE_RADIUS = 5;

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

// Within half a pixel, so a dock rebuilt from its anchor and offset still counts as unmoved.
const near = (point: Point, x: number, y: number) =>
  Math.abs(point.x - x) < 0.5 && Math.abs(point.y - y) < 0.5;

/** Whether the node, or any node it sits in, is being dragged. */
function isMoving(state: ReactFlowState, nodeId: string) {
  for (let node = state.nodeLookup.get(nodeId); node; ) {
    if (node.dragging) return true;
    node = node.parentId ? state.nodeLookup.get(node.parentId) : undefined;
  }
  return false;
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

/** Start-of-flow markers: default slash, conditional diamond, message circle. */
function SourceMarker({
  kind,
  origin,
  direction,
  color,
}: {
  kind: 'default' | 'conditional' | 'message';
  origin: Point;
  /** Unit vector along the flow's first segment. */
  direction: Point;
  color: string;
}) {
  const d = direction;
  const n = { x: -d.y, y: d.x };
  const at = (along: number, across: number) =>
    `${origin.x + d.x * along + n.x * across},${origin.y + d.y * along + n.y * across}`;
  const stroke = { stroke: color, strokeWidth: 2, pointerEvents: 'none' as const };

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

/**
 * `filled` ends a sequence flow, `hollow` a message flow, `open` an association or a data
 * association. The tip vertex is the end of the path, so the rounded corner reaches 1px past it.
 */
function Arrowhead({
  variant,
  tip,
  angle,
  color,
}: {
  variant: 'filled' | 'hollow' | 'open';
  tip: Point;
  /** Direction the flow arrives in, in radians. */
  angle: number;
  color: string;
}) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const wing = (side: number) =>
    `${tip.x - ARROW_LENGTH * cos - side * ARROW_HALF_WIDTH * sin},${
      tip.y - ARROW_LENGTH * sin + side * ARROW_HALF_WIDTH * cos
    }`;
  if (variant === 'open') {
    return (
      <polyline
        data-bpmn-open-arrow
        points={`${wing(-1)} ${tip.x},${tip.y} ${wing(1)}`}
        fill="none"
        stroke={color}
        {...ARROW_STROKE}
      />
    );
  }
  return (
    <path
      data-bpmn-arrow={variant}
      d={`M${wing(-1)} L${tip.x},${tip.y} L${wing(1)} Z`}
      fill={variant === 'filled' ? color : HOLLOW_FILL}
      stroke={color}
      {...ARROW_STROKE}
    />
  );
}

/** The stored point with the handle anchor's offset to it, so a dock follows its node. */
type Dock = { stored: Point[]; source: Point; target: Point };

function BpmnEdgeBase({
  kind,
  id,
  selected,
  source,
  target,
  sourceX: sourceAnchorX,
  sourceY: sourceAnchorY,
  sourcePosition = Position.Right,
  targetX: targetAnchorX,
  targetY: targetAnchorY,
  targetPosition = Position.Left,
  sourceHandleId,
  targetHandleId,
  data,
}: EdgeProps<BpmnEdgeModel> & { kind: EdgeKind }) {
  const canEdit = useBaseCanvasModeOr('design') === 'design';
  const actions = useBpmnActions();
  const strings = useBpmnStrings();
  const overlay = useBpmnOverlay();
  const [isHovered, setIsHovered] = useState(false);
  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);
  const pathRef = useRef<SVGPathElement | null>(null);

  const orthogonal = kind === 'sequence' || kind === 'message';
  // As in BPMN today: the path is only adjustable once the edge is selected.
  const editingEnabled = orthogonal && canEdit && !!selected;
  const stored = data?.waypoints && data.waypoints.length >= 2 ? data.waypoints : null;
  const { bends, cache } = useBendWaypoints(data?.waypoints);

  // xyflow only marks the node under the pointer, so a node moved with its parent (a pool, a
  // boundary event's activity) counts as moving through its ancestors.
  const endMoving = useStore(
    (state: ReactFlowState) => isMoving(state, source) || isMoving(state, target)
  );
  // The ends themselves, which is when the rebalancer moves a selected flow's bends.
  const endsDragging = useStore(
    (state: ReactFlowState) =>
      !!(state.nodeLookup.get(source)?.dragging || state.nodeLookup.get(target)?.dragging)
  );

  // A stored dock need not be the handle's anchor (the centre of a side). Its offset from the
  // anchor is taken when the stored route changes and then kept, so the dock is exactly as
  // stored at rest and moves with its node until the host stores the next route.
  const dock = useRef<Dock | null>(null);
  if (!stored) {
    dock.current = null;
  } else if (!dock.current || !samePoints(dock.current.stored, stored)) {
    const first = stored[0]!;
    const last = stored[stored.length - 1]!;
    dock.current = {
      stored,
      source: { x: first.x - sourceAnchorX, y: first.y - sourceAnchorY },
      target: { x: last.x - targetAnchorX, y: last.y - targetAnchorY },
    };
  }
  const startX = sourceAnchorX + (dock.current?.source.x ?? 0);
  const startY = sourceAnchorY + (dock.current?.source.y ?? 0);
  const endX = targetAnchorX + (dock.current?.target.x ?? 0);
  const endY = targetAnchorY + (dock.current?.target.y ?? 0);
  const drifted =
    !!stored && !(near(stored[0]!, startX, startY) && near(stored[stored.length - 1]!, endX, endY));
  // Both docks moved by the same amount, as when their pool is dragged: the whole route moves
  // with them. Left to the rebalancer while it is moving a selected flow's bends itself.
  const shiftX = stored ? startX - stored[0]!.x : 0;
  const shiftY = stored ? startY - stored[0]!.y : 0;
  const groupMove =
    drifted &&
    !(editingEnabled && endsDragging) &&
    near(stored![stored!.length - 1]!, endX - shiftX, endY - shiftY);
  const followed = useMemo(
    () =>
      groupMove
        ? bends.map((bend) => ({ ...bend, x: bend.x + shiftX, y: bend.y + shiftY }))
        : bends,
    [groupMove, bends, shiftX, shiftY]
  );

  // apollo's edge geometry pulls each end in by the arrow offset, as for handles that sit
  // outside the node. BPMN docks are on the border, so push them out by as much.
  const sourceX = startX + DIRECTION[sourcePosition].x * EDGE_CONSTANTS.ARROW_OFFSET;
  const sourceY = startY + DIRECTION[sourcePosition].y * EDGE_CONSTANTS.ARROW_OFFSET;
  const targetX = endX + DIRECTION[targetPosition].x * EDGE_CONSTANTS.ARROW_OFFSET;
  const targetY = endY + DIRECTION[targetPosition].y * EDGE_CONSTANTS.ARROW_OFFSET;

  // Controlled: every edit goes to the host's model, never to the xyflow store. What is written
  // is the route as apollo draws it for `next`, corners included, so drawing the stored polyline
  // as is gives the same line back.
  const { setWaypoints } = actions;
  const onWaypointsChange = useCallback(
    (next: Waypoint[]) => {
      const vertices = buildPathVertices(
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        next
      );
      const previous = cache.current;
      cache.current = vertices.slice(1, -1).map((vertex) => {
        const kept =
          (vertex.waypointIndex >= 0 ? next[vertex.waypointIndex] : undefined) ??
          previous.find((waypoint) => waypoint.x === vertex.x && waypoint.y === vertex.y);
        return kept ?? { id: generateWaypointId(), x: vertex.x, y: vertex.y };
      });
      setWaypoints(
        id,
        vertices.map(({ x, y }) => ({ x, y }))
      );
    },
    [cache, id, setWaypoints, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition]
  );

  // Whether the rebalancer stored the route at the end of this drag, so the fallback below does
  // not write the pre-drag bends over it.
  const rebalanceSaved = useRef(false);
  const onRebalance = useCallback(
    (next: Waypoint[]) => {
      rebalanceSaved.current = true;
      onWaypointsChange(next);
    },
    [onWaypointsChange]
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
    waypoints: followed,
    enabled: editingEnabled,
    onChange: onRebalance,
  });

  // Once a dock has moved off the stored route (a drag, a parent's drag, a keyboard nudge), the
  // stored bends no longer meet it, so the route is derived and stored again when the move
  // settles. The rebalancer stores it itself for a selected flow whose bends follow the node.
  // Runs after the rebalancer's layout effect, since that hook is called first.
  const savedDocks = useRef<string | null>(null);
  useLayoutEffect(() => {
    const docks = `${startX},${startY},${endX},${endY}`;
    if (rebalanceSaved.current) {
      rebalanceSaved.current = false;
      savedDocks.current = docks;
      return;
    }
    if (!drifted || endMoving || !stored || !canEdit) return;
    // Once per position, in case the host has yet to apply it.
    if (savedDocks.current === docks) return;
    savedDocks.current = docks;
    // A straight kind keeps its bends as they are; routing them would make it orthogonal.
    if (!orthogonal) {
      setWaypoints(id, [
        { x: startX, y: startY },
        ...waypoints.map(({ x, y }) => ({ x, y })),
        { x: endX, y: endY },
      ]);
      return;
    }
    onWaypointsChange(waypoints);
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
    // While an end node is dragged the stored bends no longer line up with the docks, so the
    // route is derived until the drag ends and the result is stored.
    verbatimWaypoints: !!stored && !drifted,
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
    // The lowest-priority slot above the default, so hover, selection and diff colours still win.
    statusColor: REST_COLOR,
  });

  const dimmed = data?.dimmed === true;
  const toolbarEnabled = canEdit && (isHovered || !!selected) && !editor.isDragging && !dimmed;
  const { insertOnEdge, deleteEdge, startReconnect } = actions;
  const toolbarConfig = useMemo<EdgeToolbarConfig>(
    () => ({
      actions: [
        ...(kind === 'sequence' && insertOnEdge
          ? [{ id: 'add-element', icon: 'plus', label: strings.addElement, onAction: insertOnEdge }]
          : []),
        { id: 'delete', icon: 'trash-2', label: strings.delete, onAction: deleteEdge },
      ],
    }),
    [deleteEdge, insertOnEdge, kind, strings.addElement, strings.delete]
  );

  // Straight kinds run between the handle anchors; the others between the ends of the drawn path.
  const pathPoints = geometry.pathPoints;
  const pathStart = orthogonal ? pathPoints[0] : undefined;
  const pathEnd = orthogonal ? pathPoints[pathPoints.length - 1] : undefined;
  // Without a stored route these are the anchors; with one, its docks.
  const originX = pathStart?.x ?? startX;
  const originY = pathStart?.y ?? startY;
  const tipX = pathEnd?.x ?? endX;
  const tipY = pathEnd?.y ?? endY;
  const origin = useMemo(() => ({ x: originX, y: originY }), [originX, originY]);
  const tip = useMemo(() => ({ x: tipX, y: tipY }), [tipX, tipY]);
  // A straight kind is drawn through its stored bends as given.
  const line = useMemo(() => [origin, ...bends, tip], [origin, bends, tip]);
  const straight = `M${line.map((point) => `${point.x},${point.y}`).join(' L')}`;

  // Markers follow the first and last segments, which a stored route may run at any angle.
  const afterStart = (orthogonal ? pathPoints[1] : line[1]) || tip;
  const beforeEnd =
    (orthogonal ? pathPoints[pathPoints.length - 2] : line[line.length - 2]) || origin;
  const startLength = Math.hypot(afterStart.x - origin.x, afterStart.y - origin.y);
  const startDirection = useMemo(
    () =>
      startLength > 0
        ? { x: (afterStart.x - origin.x) / startLength, y: (afterStart.y - origin.y) / startLength }
        : DIRECTION[sourcePosition],
    [afterStart.x, afterStart.y, origin, startLength, sourcePosition]
  );
  const endAngle =
    beforeEnd.x === tip.x && beforeEnd.y === tip.y
      ? geometry.arrow.angle
      : Math.atan2(tip.y - beforeEnd.y, tip.x - beforeEnd.x);

  const midPoint = useMemo(
    () => (orthogonal ? geometry.labelPoint : getPathArcMidpoint(line)),
    [orthogonal, geometry.labelPoint, line]
  );
  const labelPoint = data?.labelPosition ?? midPoint;
  // The toolbar stays on the path; it only clears the label when the label sits there too.
  const { renameEdge, moveEdgeLabel } = actions;
  const labelPlaceholder = canEdit && !!renameEdge && !!selected && !data?.label;
  const hasLabel = !!data?.label || labelPlaceholder;
  const labelOnPath = hasLabel && !data?.labelPosition;
  const toolbarPosition = useMemo(
    () => toolbarPositionAt(midPoint, orthogonal ? pathPoints : line, labelOnPath),
    [midPoint, orthogonal, pathPoints, line, labelOnPath]
  );
  const associationDirection = data?.associationDirection ?? 'none';
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
        data-dimmed={dimmed || undefined}
        className={dimmed ? DIMMED : undefined}
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
          style={selected ? SELECTED_STROKE : STROKE}
          enforceStrokeWidth
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

        {filledArrow && <Arrowhead variant="filled" tip={tip} angle={endAngle} color={color} />}
        {kind === 'message' && (
          <Arrowhead variant="hollow" tip={tip} angle={endAngle} color={color} />
        )}
        {(kind === 'data' || (kind === 'association' && associationDirection !== 'none')) && (
          <Arrowhead variant="open" tip={tip} angle={endAngle} color={color} />
        )}
        {kind === 'association' && associationDirection === 'both' && (
          <Arrowhead
            variant="open"
            tip={origin}
            // Against the first segment, which a bent association need not run parallel to the last.
            angle={Math.atan2(-startDirection.y, -startDirection.x)}
            color={color}
          />
        )}
        {sourceMarker && (
          <SourceMarker
            kind={sourceMarker}
            origin={origin}
            direction={startDirection}
            color={color}
          />
        )}

        {startReconnect &&
          canEdit &&
          selected &&
          (['source', 'target'] as const).map((end) => {
            const at = end === 'source' ? origin : tip;
            return (
              <circle
                key={end}
                data-bpmn-reconnect={end}
                className="nodrag nopan"
                cx={at.x}
                cy={at.y}
                r={RECONNECT_HANDLE_RADIUS}
                fill={HOLLOW_FILL}
                stroke={color}
                strokeWidth={2}
                style={{ cursor: 'move', pointerEvents: 'all' }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  startReconnect(id, end, event);
                }}
              />
            );
          })}

        {hasLabel && (
          <BpmnEdgeLabel
            edgeId={id}
            x={labelPoint.x}
            y={labelPoint.y}
            text={data?.label}
            // The pill keeps its own muted and selected borders unless a suggestion colours it.
            borderColor={data?.modification ? color : undefined}
            selected={selected}
            zIndex={overlay?.zIndex}
            dimmed={dimmed}
            onRename={canEdit ? renameEdge : undefined}
            onMove={canEdit ? moveEdgeLabel : undefined}
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

/** Each kind on its own, for a host that registers edge kinds one at a time. */
export const BpmnSequenceFlowEdge = forKind('sequence');
export const BpmnMessageFlowEdge = forKind('message');
export const BpmnAssociationEdge = forKind('association');
export const BpmnDataAssociationEdge = forKind('data');

/** Keyed by BPMN `$type`, as a host registers its edge types. */
export const bpmnEdgeTypes: EdgeTypes = {
  'bpmn:SequenceFlow': BpmnSequenceFlowEdge,
  'bpmn:MessageFlow': BpmnMessageFlowEdge,
  'bpmn:Association': BpmnAssociationEdge,
  'bpmn:DataInputAssociation': BpmnDataAssociationEdge,
  'bpmn:DataOutputAssociation': BpmnDataAssociationEdge,
};
