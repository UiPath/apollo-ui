import { memo, useState } from 'react';
import { EDGE_COLORS } from '../constants';
import type { WaypointHandlers } from '../hooks/useWaypointEditor';
import type { Waypoint } from '../types';

export type WaypointHandleProps = {
  waypoint: Waypoint;
  /** Index of the waypoint in the stored list, passed back to `handlers`. */
  index: number;
  /** Force the visible dot regardless of hover (edge hovered/selected/dragging). */
  forceVisible: boolean;
  handlers: WaypointHandlers;
};

export const WaypointHandle = memo(function WaypointHandle({
  waypoint,
  index,
  forceVisible,
  handlers,
}: WaypointHandleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const visible = forceVisible || isHovered;

  return (
    // `nopan` opts out of React Flow's d3-zoom gestures (notably double-click
    // zoom) at the filter level — a React-level stopPropagation fires too late
    // because d3 listens below React's delegation root.
    <g
      className="nopan"
      transform={`translate(${waypoint.x}, ${waypoint.y})`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(e) => handlers.onMouseDown(index, e)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handlers.onDoubleClick(index);
      }}
      style={{ cursor: 'move' }}
    >
      <circle r={16} fill="transparent" style={{ pointerEvents: 'all' }} />
      {visible && (
        <circle
          r={6}
          fill={EDGE_COLORS.selected}
          stroke="white"
          strokeWidth={2}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  );
});
