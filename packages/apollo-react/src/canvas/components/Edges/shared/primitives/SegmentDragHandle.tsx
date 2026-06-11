import { memo, useState } from 'react';
import { EDGE_COLORS, EDGE_CONSTANTS } from '../constants';
import { getSegmentMidpoint } from '../geometry';
import type { SegmentHandlers } from '../hooks/useWaypointEditor';
import type { Segment, SegmentOrientation } from '../types';

const { INTERACTION_STROKE_WIDTH } = EDGE_CONSTANTS;

const SEGMENT_CURSOR: Record<SegmentOrientation, string> = {
  horizontal: 'ns-resize',
  vertical: 'ew-resize',
};

const HANDLE_RECT: Record<
  SegmentOrientation,
  { x: number; y: number; width: number; height: number }
> = {
  horizontal: { x: -12, y: -5, width: 24, height: 10 },
  vertical: { x: -5, y: -12, width: 10, height: 24 },
};

export type SegmentDragHandleProps = {
  segment: Segment;
  /** Index of the segment in the extracted list, passed back to `handlers`. */
  segmentIndex: number;
  handlers: SegmentHandlers;
};

export const SegmentDragHandle = memo(function SegmentDragHandle({
  segment,
  segmentIndex,
  handlers,
}: SegmentDragHandleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const midpoint = getSegmentMidpoint(segment);
  const cursor = SEGMENT_CURSOR[segment.orientation];
  const rect = HANDLE_RECT[segment.orientation];

  return (
    <>
      {/* `nopan` opts out of React Flow's d3-zoom gestures (notably double-
          click zoom) at the filter level — a React-level stopPropagation fires
          too late because d3 listens below React's delegation root. */}
      <line
        className="nopan"
        x1={segment.start.x}
        y1={segment.start.y}
        x2={segment.end.x}
        y2={segment.end.y}
        stroke="transparent"
        strokeWidth={INTERACTION_STROKE_WIDTH}
        style={{ cursor, pointerEvents: 'stroke' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={(e) => handlers.onMouseDown(segment, e)}
        onDoubleClick={(e) => handlers.onDoubleClick(segmentIndex, e)}
      />
      {isHovered && (
        <>
          <line
            x1={segment.start.x}
            y1={segment.start.y}
            x2={segment.end.x}
            y2={segment.end.y}
            stroke={EDGE_COLORS.selected}
            strokeWidth={4}
            opacity={0.4}
            style={{ pointerEvents: 'none' }}
          />
          <g
            transform={`translate(${midpoint.x}, ${midpoint.y})`}
            style={{ pointerEvents: 'none' }}
          >
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx={5}
              fill={EDGE_COLORS.selected}
              stroke="white"
              strokeWidth={2}
            />
          </g>
        </>
      )}
    </>
  );
});
