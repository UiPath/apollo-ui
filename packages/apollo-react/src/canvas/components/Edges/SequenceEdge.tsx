import { type EdgeProps, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useMemo, useRef, useState } from 'react';

import { EDGE_BORDER_RADIUS, HANDLE_OFFSETS, PREVIEW_EDGE_ID } from '../../constants';
import { useEdgeExecutionState, useEdgePath, useElementValidationStatus } from '../../hooks';
import type { NodeExecutionStateWithDebug } from '../../types/execution';
import { useBaseCanvasMode } from '../BaseCanvas/BaseCanvasModeProvider';
import { EdgeToolbar, useEdgeToolbarState } from '../Toolbar';
import {
  arrowFromLastSegment,
  buildOrthogonalPath,
  calculatePathMidpoint,
  type RoutingPoint,
} from './EdgeRoutingUtils';
import { edgeTargetStatusToEdgeColor, getStatusAnimation } from './EdgeUtils';

/** Typed edge data for SequenceEdge. */
export interface SequenceEdgeData {
  label?: string;
  isDiffAdded?: boolean;
  isDiffRemoved?: boolean;
  elkRouting?: RoutingPoint[];
}

const ARROW_SIZE = 10;

// Arrow angle based on which side of the TARGET node the edge connects to
// The arrow should point INTO the target node
// Angle 0 = pointing right, PI/2 = pointing down, PI = pointing left, -PI/2 = pointing up
const ANGLE_MAP: Record<Position, number> = {
  [Position.Left]: 0, // Edge enters left side, arrow points right
  [Position.Right]: Math.PI, // Edge enters right side, arrow points left
  [Position.Top]: Math.PI / 2, // Edge enters top, arrow points down
  [Position.Bottom]: -Math.PI / 2, // Edge enters bottom, arrow points up
};

// Custom comparison to prevent re-renders during pan/zoom
// Coordinates can have tiny floating point differences that don't affect visual output
function areEdgePropsEqual(prevProps: EdgeProps, nextProps: EdgeProps): boolean {
  // Always re-render if these change
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  if (prevProps.source !== nextProps.source) return false;
  if (prevProps.target !== nextProps.target) return false;
  if (prevProps.sourcePosition !== nextProps.sourcePosition) return false;
  if (prevProps.targetPosition !== nextProps.targetPosition) return false;
  if (prevProps.data !== nextProps.data) return false;
  if (prevProps.style !== nextProps.style) return false;

  // For coordinates, only re-render if change is > 0.5px (avoids floating point noise)
  const threshold = 0.5;
  if (Math.abs(prevProps.sourceX - nextProps.sourceX) > threshold) return false;
  if (Math.abs(prevProps.sourceY - nextProps.sourceY) > threshold) return false;
  if (Math.abs(prevProps.targetX - nextProps.targetX) > threshold) return false;
  if (Math.abs(prevProps.targetY - nextProps.targetY) > threshold) return false;

  return true;
}

export const SequenceEdge = memo(function SequenceEdge({
  id,
  selected,
  source,
  sourceX,
  sourceY,
  sourcePosition,
  sourceHandleId,
  target,
  targetX,
  targetY,
  targetPosition,
  targetHandleId,
  style,
  data,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pathElementRef = useRef<SVGPathElement | null>(null);

  const { mode } = useBaseCanvasMode();
  const isReadOnly = mode === 'readonly';
  const isPreviewEdge = id === PREVIEW_EDGE_ID;

  const executionStatus = useEdgeExecutionState(id, target);
  const { validationStatus } = useElementValidationStatus(id) ?? { validationStatus: undefined };

  // Use provided status or fall back to hook values
  const status = executionStatus
    ? ((executionStatus as NodeExecutionStateWithDebug)?.status ?? executionStatus)
    : validationStatus;

  const edgeData = data as SequenceEdgeData | undefined;

  // Check if this edge has diff styling applied
  const isDiffAdded = edgeData?.isDiffAdded === true;
  const isDiffRemoved = edgeData?.isDiffRemoved === true;

  // Standard path from useEdgePath (always computed — hooks cannot be called
  // conditionally, and we need isLoopEdge to decide the ELK branch)
  const standardPath = useEdgePath({
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
  });

  // Use ELK-computed routing when available (avoids nodes after auto-layout).
  // ELK routing is intentionally ignored for loop edges because SequenceEdge
  // has purpose-built loop paths that handle self-loops and loopBack edges.
  const elkRouting = edgeData?.elkRouting;
  const useElk = !!elkRouting && elkRouting.length >= 2 && !standardPath.isLoopEdge;

  const elkPath = useMemo(() => {
    if (!useElk || !elkRouting) return null;

    const { x: sourceOffsetX, y: sourceOffsetY } = HANDLE_OFFSETS[sourcePosition];
    const rawPoints: RoutingPoint[] = [
      { x: sourceX + sourceOffsetX, y: sourceY + sourceOffsetY },
      // Keep only intermediate bend points; first/last are replaced by handle coords
      ...elkRouting.slice(1, -1),
      { x: targetX, y: targetY },
    ];

    // buildOrthogonalPath orthogonalizes internally and returns the
    // axis-aligned points so arrow/label use the same geometry as the path.
    const { path: edgePath, orthoPoints } = buildOrthogonalPath(rawPoints, EDGE_BORDER_RADIUS);
    const mid = calculatePathMidpoint(orthoPoints);
    const arrow = arrowFromLastSegment(orthoPoints);

    return {
      edgePath,
      labelX: mid.x,
      labelY: mid.y,
      arrowAngle: arrow.angle,
      arrowOffsetX: arrow.offsetX,
      arrowOffsetY: arrow.offsetY,
    };
  }, [useElk, elkRouting, sourceX, sourceY, sourcePosition, targetX, targetY]);

  const edgePath = elkPath?.edgePath ?? standardPath.edgePath;
  const labelX = elkPath?.labelX ?? standardPath.labelX;
  const labelY = elkPath?.labelY ?? standardPath.labelY;
  const arrowAngle = elkPath?.arrowAngle ?? ANGLE_MAP[targetPosition];
  const arrowOffsetX = elkPath?.arrowOffsetX ?? HANDLE_OFFSETS[targetPosition].x;
  const arrowOffsetY = elkPath?.arrowOffsetY ?? HANDLE_OFFSETS[targetPosition].y;

  // Edge toolbar state
  const {
    showToolbar,
    toolbarPositioning,
    config: toolbarConfig,
    handleMouseMoveOnPath,
  } = useEdgeToolbarState({
    edgeId: id,
    pathElementRef,
    isHovered,
    sourceHandleId,
    targetHandleId,
    sourcePosition,
    targetPosition,
    source,
    target,
  });

  const getEdgeColor = () => {
    // Diff styling takes priority
    if (isDiffAdded) return 'var(--uix-canvas-success-icon)';
    if (isDiffRemoved) return 'var(--uix-canvas-error-icon)';

    if (isPreviewEdge) return 'var(--uix-canvas-primary)';
    if (selected) return 'var(--uix-canvas-primary)';
    if (isHovered) return 'var(--uix-canvas-primary-hover)';
    if (status) return edgeTargetStatusToEdgeColor[status] ?? 'var(--color-border)';
    return 'var(--uix-canvas-border)';
  };

  const edgeColor = getEdgeColor();

  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMoveOnPath}
      >
        {/* Invisible interaction layer for easier selection */}
        <path
          className="react-flow__edge-interaction"
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          style={{ pointerEvents: 'stroke', cursor: isReadOnly ? 'default' : 'pointer' }}
        />

        {/* Outline for selected state */}
        {selected && (
          <path
            className="react-flow__edge-outline"
            d={edgePath}
            fill="none"
            stroke="var(--uix-canvas-primary)"
            strokeWidth={10}
            opacity={0.3}
            style={{
              pointerEvents: 'none',
              transition: 'opacity 0.2s ease',
            }}
          />
        )}

        {/* Visual edge path */}
        <path
          id={id}
          className="react-flow__edge-path"
          d={edgePath}
          strokeWidth={style?.strokeWidth || 2}
          style={{
            stroke: edgeColor,
            strokeDasharray: isDiffRemoved
              ? style?.strokeDasharray || '5,5'
              : isPreviewEdge
                ? '5,5'
                : '0',
            opacity: style?.opacity !== undefined ? style.opacity : 1,
            transition: 'stroke 0.2s ease, opacity 0.2s ease',
          }}
          ref={pathElementRef}
        />

        {/* Arrow head - filled triangle */}
        <polygon
          points={`
            ${targetX},${targetY}
            ${targetX - ARROW_SIZE * Math.cos(arrowAngle - Math.PI / 6)},${targetY - ARROW_SIZE * Math.sin(arrowAngle - Math.PI / 6)}
            ${targetX - ARROW_SIZE * Math.cos(arrowAngle + Math.PI / 6)},${targetY - ARROW_SIZE * Math.sin(arrowAngle + Math.PI / 6)}
          `}
          fill={edgeColor}
          style={{
            pointerEvents: 'none',
            opacity: style?.opacity !== undefined ? style.opacity : 1,
            transition: 'fill 0.2s ease, opacity 0.2s ease',
            transform: `translate(${arrowOffsetX}px, ${arrowOffsetY}px)`,
          }}
        />

        {getStatusAnimation(status, edgePath)}

        {/* Edge label from data */}
        {typeof edgeData?.label === 'string' && edgeData.label.length > 0 && (
          <foreignObject
            x={labelX}
            y={labelY}
            width={1}
            height={1}
            overflow="visible"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="react-flow__edge-label nodrag nopan"
              style={{
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                color: 'var(--uix-canvas-foreground)',
                background: 'var(--uix-canvas-background)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 500,
                border: `1px solid ${selected ? 'var(--uix-canvas-primary)' : 'var(--uix-canvas-border)'}`,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}
            >
              {edgeData.label}
            </div>
          </foreignObject>
        )}
      </g>

      {/* Edge toolbar for adding nodes */}
      {showToolbar && toolbarPositioning && (
        <EdgeToolbar
          edgeId={id}
          visible={showToolbar}
          positioning={toolbarPositioning}
          config={toolbarConfig}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      )}
    </>
  );
}, areEdgePropsEqual);
