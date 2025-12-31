import {
  type EdgeProps,
  getSmoothStepPath,
  Position,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useState } from 'react';

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

// Offset to position start/arrow slightly away from the node edge
const ARROW_OFFSETS: Record<Position, { x: number; y: number }> = {
  [Position.Left]: { x: 8, y: 0 },
  [Position.Right]: { x: -8, y: 0 },
  [Position.Top]: { x: 0, y: 8 },
  [Position.Bottom]: { x: 0, y: -8 },
};

const SOURCE_OFFSETS: Record<Position, { x: number; y: number }> = {
  [Position.Left]: { x: 8, y: 0 },
  [Position.Right]: { x: -8, y: 0 },
  [Position.Top]: { x: 0, y: 8 },
  [Position.Bottom]: { x: 0, y: -8 },
};

// Custom comparison to prevent re-renders during pan/zoom
// Coordinates can have tiny floating point differences that don't affect visual output
function areEdgePropsEqual(prevProps: EdgeProps, nextProps: EdgeProps): boolean {
  // Always re-render if these change
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;
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
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  style,
  data,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);

  // TODO: Replace with actual read-only state from the canvas
  const isReadOnly = false;
  const isPreviewEdge = id === 'preview-edge-id';

  // Check if this edge has diff styling applied
  const isDiffAdded = data?.isDiffAdded === true;
  const isDiffRemoved = data?.isDiffRemoved === true;

  const angle = ANGLE_MAP[targetPosition];
  const { x: offsetX, y: offsetY } = ARROW_OFFSETS[targetPosition];
  const { x: sourceOffsetX, y: sourceOffsetY } = SOURCE_OFFSETS[sourcePosition];

  const [edgePath] = getSmoothStepPath({
    sourceX: sourceX + sourceOffsetX,
    sourceY: sourceY + sourceOffsetY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const getEdgeColor = () => {
    // Diff styling takes priority
    if (isDiffAdded) return 'var(--uix-canvas-success-icon)';
    if (isDiffRemoved) return 'var(--uix-canvas-error-icon)';

    if (isPreviewEdge) return 'var(--uix-canvas-primary)';
    if (selected) return 'var(--uix-canvas-primary)';
    if (isHovered) return 'var(--uix-canvas-primary-hover)';
    return 'var(--uix-canvas-border)';
  };

  const edgeColor = getEdgeColor();

  return (
    <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
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
      />

      {/* Arrow head - filled triangle */}
      <polygon
        points={`
            ${targetX},${targetY}
            ${targetX - ARROW_SIZE * Math.cos(angle - Math.PI / 6)},${targetY - ARROW_SIZE * Math.sin(angle - Math.PI / 6)}
            ${targetX - ARROW_SIZE * Math.cos(angle + Math.PI / 6)},${targetY - ARROW_SIZE * Math.sin(angle + Math.PI / 6)}
          `}
        fill={edgeColor}
        style={{
          pointerEvents: 'none',
          opacity: style?.opacity !== undefined ? style.opacity : 1,
          transition: 'fill 0.2s ease, opacity 0.2s ease',
          transform: `translate(${offsetX}px, ${offsetY}px)`,
        }}
      />
    </g>
  );
}, areEdgePropsEqual);
