import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { GRID_SPACING } from '../../../constants';
import type { Point, Waypoint } from './types';

/** Stable empty array for `?? EMPTY_WAYPOINTS` fallbacks — an inline `[]`
 * would change identity every render and defeat geometry memoization. */
export const EMPTY_WAYPOINTS: Waypoint[] = [];

export const EDGE_CONSTANTS = {
  /** Border radius for smooth corners on rounded paths */
  BORDER_RADIUS: GRID_SPACING,
  /** Arrow head size for directional edges */
  ARROW_SIZE: 10,
  /** Half-angle (radians) of each arrow head wing relative to the tangent. */
  ARROW_HALF_ANGLE: Math.PI / 6,
  /** Default stroke width */
  STROKE_WIDTH: 2,
  /** Stroke width when selected */
  SELECTED_STROKE_WIDTH: 3,
  /** Width of the invisible interaction layer used for hit testing */
  INTERACTION_STROKE_WIDTH: 20,
  /** Stroke width of the soft outline drawn behind the visible path when selected. */
  SELECTED_OUTLINE_STROKE_WIDTH: 10,
  /** Opacity of the soft outline drawn behind the visible path when selected. */
  SELECTED_OUTLINE_OPACITY: 0.3,
  /** Minimum segment length required to allow segment drag */
  MIN_SEGMENT_LENGTH: 32,
  /**
   * Tolerance (px) under which coordinates are treated as equal by the
   * dedupe/collinearity checks in geometry.ts. Load-bearing for the
   * consolidation fixed-point loop.
   */
  COLLINEAR_TOLERANCE: 1,
  /** Distance the arrow sits inset from the target node edge */
  ARROW_OFFSET: 8,
  /**
   * Minimum distance the path travels perpendicular to a node face before it
   * is allowed to turn. Keeps the connector from folding back across the node
   * when the adjacent waypoint sits behind the exit direction.
   */
  STUB_OFFSET: GRID_SPACING * 2,
} as const;

/** CSS transition shared by the visible edge path and the arrow head. */
export const EDGE_PATH_TRANSITION = 'stroke 0.2s ease, opacity 0.2s ease';

/** SVG `stroke-dasharray` values used by the visible path layer. */
export const EDGE_DASHARRAY = {
  solid: '0',
  dashed: '5,5',
} as const;

/**
 * Color tokens used by canvas edges. Values reference CSS variables defined
 * in canvas/styles/variables.css.
 */
export const EDGE_COLORS = {
  default: 'var(--canvas-border)',
  hover: 'var(--canvas-primary-hover)',
  selected: 'var(--canvas-primary)',
  invalid: 'var(--canvas-error-icon)',
  diffAdded: 'var(--canvas-success-icon)',
  diffRemoved: 'var(--canvas-error-icon)',
} as const;

/**
 * Arrow angle based on which side of the TARGET node the edge connects to.
 * The arrow points INTO the target node.
 * Angle 0 = right, PI/2 = down, PI = left, -PI/2 = up.
 */
export const ARROW_ANGLE_MAP: Record<Position, number> = {
  [Position.Left]: 0,
  [Position.Right]: Math.PI,
  [Position.Top]: Math.PI / 2,
  [Position.Bottom]: -Math.PI / 2,
};

/**
 * Inset offset applied to either endpoint of the path. Used for the source
 * (path origin) and the target (arrow tip) so both ends sit inside the node
 * fill — the visible line then meets the node edge cleanly with no gap.
 * Also consumed by `useEdgePath`, so waypoint- and handle-routed edges share
 * one inset definition.
 */
export const ARROW_OFFSETS: Record<Position, Point> = {
  [Position.Left]: { x: EDGE_CONSTANTS.ARROW_OFFSET, y: 0 },
  [Position.Right]: { x: -EDGE_CONSTANTS.ARROW_OFFSET, y: 0 },
  [Position.Top]: { x: 0, y: EDGE_CONSTANTS.ARROW_OFFSET },
  [Position.Bottom]: { x: 0, y: -EDGE_CONSTANTS.ARROW_OFFSET },
};
