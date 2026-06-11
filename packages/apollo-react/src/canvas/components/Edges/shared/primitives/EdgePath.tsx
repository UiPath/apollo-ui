import type { CSSProperties } from 'react';
import { EDGE_COLORS, EDGE_CONSTANTS, EDGE_DASHARRAY, EDGE_PATH_TRANSITION } from '../constants';
import type { EdgeStrokeStyle } from '../types';

const {
  INTERACTION_STROKE_WIDTH,
  STROKE_WIDTH,
  SELECTED_STROKE_WIDTH,
  SELECTED_OUTLINE_STROKE_WIDTH,
  SELECTED_OUTLINE_OPACITY,
} = EDGE_CONSTANTS;

export type EdgePathProps = {
  /** SVG path `d` attribute. */
  d: string;
  /** Resolved stroke color (CSS var or color string). */
  color: string;
  selected?: boolean;
  /**
   * React Flow's `animated` edge flag. When true, no `strokeDasharray` is set
   * so React Flow's animated-edge CSS (dashdraw on `.react-flow__edge-path`)
   * takes effect instead of being overridden.
   */
  animated?: boolean;
  strokeStyle?: EdgeStrokeStyle;
  isReadOnly?: boolean;
  /** Optional ref for the visible path element. */
  pathRef?: React.Ref<SVGPathElement>;
  /** Edge id (becomes the visible path element id, useful for animateMotion). */
  id?: string;
  style?: CSSProperties;
  /** Resolved opacity for the visible path. */
  opacity?: number;
};

/**
 * Three-layer SVG path stack used by every canvas edge:
 *   1. Invisible thick stroke for hit testing
 *   2. Wide soft outline when selected
 *   3. The visible path itself
 */
export function EdgePath(props: EdgePathProps) {
  const {
    d,
    color,
    selected,
    animated,
    strokeStyle,
    isReadOnly,
    pathRef,
    id,
    style,
    opacity = 1,
  } = props;

  const dasharray = animated
    ? undefined
    : strokeStyle === 'dashed'
      ? EDGE_DASHARRAY.dashed
      : EDGE_DASHARRAY.solid;
  const strokeWidth =
    (style?.strokeWidth as number | undefined) ?? (selected ? SELECTED_STROKE_WIDTH : STROKE_WIDTH);

  return (
    <>
      <path
        className="react-flow__edge-interaction"
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={INTERACTION_STROKE_WIDTH}
        style={{ pointerEvents: 'stroke', cursor: isReadOnly ? 'default' : 'pointer' }}
      />
      {selected && (
        <path
          className="react-flow__edge-outline"
          d={d}
          fill="none"
          stroke={EDGE_COLORS.selected}
          strokeWidth={SELECTED_OUTLINE_STROKE_WIDTH}
          opacity={SELECTED_OUTLINE_OPACITY}
          style={{ pointerEvents: 'none', transition: 'opacity 0.2s ease' }}
        />
      )}
      <path
        id={id}
        ref={pathRef}
        className="react-flow__edge-path"
        d={d}
        fill="none"
        strokeWidth={strokeWidth}
        style={{
          stroke: color,
          strokeDasharray: dasharray,
          opacity,
          transition: EDGE_PATH_TRANSITION,
        }}
      />
    </>
  );
}
