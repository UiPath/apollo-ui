export const PREVIEW_NODE_ID = 'preview-node-id';
export const PREVIEW_EDGE_ID = 'preview-edge-id';
export const DEFAULT_NODE_SIZE = 96; // px

export const GRID_SPACING = 16;

/** Border radius for rounded corners on edge paths (both standard and ELK-routed). */
export const EDGE_BORDER_RADIUS = GRID_SPACING;

/**
 * Offset (in px) applied to source/arrow handles to keep them slightly
 * away from the node edge. Used by useEdgePath, SequenceEdge, and
 * EdgeRoutingUtils — kept here as the single source of truth.
 */
export const HANDLE_OFFSET = 8;

/**
 * Per-position offsets that pull the edge start/end point slightly away from
 * the node boundary. Used for both source handle offsets and arrow positioning.
 *
 * The sign convention is: the offset moves the point *inward* from the handle
 * centre (i.e., toward the interior of the gap between node edge and path start).
 */
export const HANDLE_OFFSETS: Record<'left' | 'right' | 'top' | 'bottom', { x: number; y: number }> =
  {
    left: { x: HANDLE_OFFSET, y: 0 },
    right: { x: -HANDLE_OFFSET, y: 0 },
    top: { x: 0, y: HANDLE_OFFSET },
    bottom: { x: 0, y: -HANDLE_OFFSET },
  };
