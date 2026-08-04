import { Position, useStoreApi } from '@uipath/apollo-react/canvas/xyflow/react';
import { type MouseEvent, memo, useCallback, useRef, useState } from 'react';
import { isPreviewEdge } from '../../utils/createPreviewNode';
import { useBaseCanvasMode } from '../BaseCanvas/BaseCanvasModeProvider';
import { EdgeToolbar, useEdgeToolbarState } from '../Toolbar';
import { areEdgePropsEqual } from './shared/areEdgePropsEqual';
import { EMPTY_WAYPOINTS } from './shared/constants';
import { isSegmentInteractable, isSegmentPerpendicular } from './shared/geometry';
import {
  useEdgeGeometry,
  useExecutionEdge,
  useNodeDragRebalance,
  useWaypointEditor,
} from './shared/hooks';
import {
  EdgeArrow,
  EdgeLabel,
  EdgePath,
  SegmentDragHandle,
  WaypointHandle,
} from './shared/primitives';
import { resolveEdgeColor } from './shared/resolveEdgeColor';
import type { CanvasEdgeProps } from './shared/types';

/**
 * Single edge component for Apollo Canvas. Behaviors are toggled via flags
 * on `data`:
 *
 * - `routing: 'waypoint' | 'handle'` (default `'waypoint'`)
 * - `enableEditing`   — drag/insert/remove waypoints (waypoint routing only)
 * - `enableExecution` — subscribe to execution + validation status
 * - `enableToolbar`   — render add-node toolbar
 * - `enableLineJumps` — arc over crossing edges (waypoint routing only)
 */
export const CanvasEdge = memo(function CanvasEdge({
  id,
  selected,
  animated,
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
  style,
  data,
}: CanvasEdgeProps) {
  const isReadOnly = useBaseCanvasMode().mode === 'readonly';
  const [isHovered, setIsHovered] = useState(false);
  const onMouseEnter = useCallback(() => setIsHovered(true), []);
  const onMouseLeave = useCallback(() => setIsHovered(false), []);
  const pathRef = useRef<SVGPathElement | null>(null);
  const store = useStoreApi();

  const onLabelClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      const {
        addSelectedEdges,
        edgeLookup,
        elementsSelectable,
        multiSelectionActive,
        unselectNodesAndEdges,
      } = store.getState();
      const edge = edgeLookup.get(id);

      if (!edge || !(edge.selectable ?? elementsSelectable)) return;

      store.setState({ nodesSelectionActive: false });
      if (edge.selected && multiSelectionActive) {
        unselectNodesAndEdges({ nodes: [], edges: [edge] });
      } else {
        addSelectedEdges([id]);
      }
    },
    [id, store]
  );

  const routing = data?.routing ?? 'waypoint';
  const storedWaypoints = data?.waypoints ?? EMPTY_WAYPOINTS;
  const strokeStyle = data?.strokeStyle ?? 'solid';
  const hideArrowHead = !!data?.hideArrowHead;
  const label = data?.label;

  const editingEnabled = !!data?.enableEditing && routing === 'waypoint' && !isReadOnly;

  // While a connected node is dragged, the waypoints follow it (and persist on
  // release); otherwise these are the stored waypoints unchanged.
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
    waypoints: storedWaypoints,
    enabled: editingEnabled,
    onChange: data?.onWaypointsChange,
  });

  const routedWaypoints = data?.routedWaypoints ?? EMPTY_WAYPOINTS;
  const effectiveWaypoints = waypoints.length > 0 ? waypoints : routedWaypoints;
  const executionEnabled = !!data?.enableExecution;
  const toolbarEnabled = !!data?.enableToolbar && !isReadOnly;

  const previewEdge = isPreviewEdge({ id, source, target });

  const geometry = useEdgeGeometry({
    routing,
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
    waypoints: effectiveWaypoints,
    // Face-clearance applies to router waypoints only; manual ones render as-is.
    autoRouted: waypoints.length === 0,
    enableSegments: editingEnabled,
    hideArrowHead,
    enableLineJumps: !!data?.enableLineJumps,
  });

  const editor = useWaypointEditor({
    edgeId: id,
    waypoints,
    pathPoints: geometry.pathPoints,
    enabled: editingEnabled,
    onChange: data?.onWaypointsChange,
  });

  const execution = useExecutionEdge({
    edgeId: id,
    target,
    edgePath: geometry.edgePath,
    enabled: executionEnabled,
  });

  const isDiffRemoved = data?.isDiffRemoved ?? false;

  const color = resolveEdgeColor({
    selected,
    isHovered,
    isInvalid: data?.isInvalid ?? false,
    isDiffAdded: data?.isDiffAdded ?? false,
    isDiffRemoved,
    previewEdge,
    statusColor: execution.statusColor,
  });

  const toolbar = useEdgeToolbarState({
    edgeId: id,
    pathElementRef: pathRef,
    isHovered: toolbarEnabled && isHovered,
    source,
    target,
    sourceHandleId,
    targetHandleId,
    sourcePosition,
    targetPosition,
  });

  const showEditingChrome = editingEnabled && (isHovered || selected || editor.isDragging);
  const opacity = (style?.opacity as number | undefined) ?? 1;

  return (
    <>
      <g
        data-edge-hovered={isHovered || undefined}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseMove={toolbarEnabled ? toolbar.handleMouseMoveOnPath : undefined}
      >
        <EdgePath
          id={id}
          d={geometry.edgePath}
          color={color}
          selected={selected}
          animated={animated}
          strokeStyle={previewEdge || isDiffRemoved ? 'dashed' : strokeStyle}
          isReadOnly={isReadOnly}
          style={style}
          opacity={opacity}
          pathRef={pathRef}
        />

        {showEditingChrome &&
          geometry.segments.map((segment, index) => {
            if (!isSegmentInteractable(segment) || !isSegmentPerpendicular(segment)) return null;
            return (
              <SegmentDragHandle
                key={segment.id}
                segment={segment}
                segmentIndex={index}
                handlers={editor.segmentHandlers}
              />
            );
          })}

        {editingEnabled &&
          waypoints.map((waypoint, index) => (
            <WaypointHandle
              key={waypoint.id}
              waypoint={waypoint}
              index={index}
              forceVisible={showEditingChrome}
              handlers={editor.waypointHandlers}
            />
          ))}

        {!hideArrowHead && (
          <EdgeArrow
            target={{ x: targetX, y: targetY }}
            angle={geometry.arrow.angle}
            offset={geometry.arrow.offset}
            color={color}
            opacity={opacity}
          />
        )}

        {execution.animation}

        {typeof label === 'string' && label.length > 0 && (
          <EdgeLabel
            x={geometry.labelPoint.x}
            y={geometry.labelPoint.y}
            text={label}
            borderColor={color}
            onClick={isReadOnly ? undefined : onLabelClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          />
        )}
      </g>

      {toolbarEnabled && toolbar.showToolbar && toolbar.toolbarPositioning && (
        <EdgeToolbar
          edgeId={id}
          visible={toolbar.showToolbar}
          positioning={toolbar.toolbarPositioning}
          config={toolbar.config}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />
      )}
    </>
  );
}, areEdgePropsEqual);
