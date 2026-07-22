export type AlignmentGuideOrientation = 'vertical' | 'horizontal';

/**
 * A single alignment guide line, in flow (not screen) coordinates.
 * `position` is the constant axis (x for vertical, y for horizontal);
 * `start`/`end` are the span along the other axis.
 */
export interface AlignmentGuideLine {
  id: string;
  orientation: AlignmentGuideOrientation;
  position: number;
  start: number;
  end: number;
}

export interface NodeBounds {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx: number;
  cy: number;
}
