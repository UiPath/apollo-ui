export type AlignmentGuideOrientation = 'vertical' | 'horizontal';

/** Whether a guide matched on a node edge (left/right/top/bottom) or its center. */
export type AlignmentGuideKind = 'edge' | 'center';

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
  /** 'center' only when every node behind this line matched via its center; 'edge' otherwise. */
  kind: AlignmentGuideKind;
  /** IDs of the other (non-dragged) nodes this line is aligned with. */
  matchedNodeIds: string[];
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
