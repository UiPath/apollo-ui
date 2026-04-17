export const PREVIEW_NODE_ID = 'preview-node-id';
export const PREVIEW_EDGE_ID = 'preview-edge-id';
export const DEFAULT_NODE_SIZE = 96; // px

export const GRID_SPACING = 16;

/** Canvas viewport width below which compact layout is used. */
export const CANVAS_COMPACT_BREAKPOINT = 600;

/** Fixed width of the Toolbox container (in px) when it isn't in `fullWidth` mode. */
export const TOOLBOX_WIDTH = 320;
/** Fixed height of the Toolbox container (in px) when it isn't in `fullHeight` mode. */
export const TOOLBOX_HEIGHT = 440;
/** Horizontal padding inside the Toolbox (in px; `px` prop on its outer `Column`). */
export const TOOLBOX_PADDING_X = 20;
/** Vertical padding inside the Toolbox (in px; `py` prop on its outer `Column`). */
export const TOOLBOX_PADDING_Y = 12;
/** Row gap between Toolbox sections (in px; `gap` prop on its outer `Column`). */
export const TOOLBOX_GAP = 12;

/**
 * Default distance (in px) between a `FloatingCanvasPanel` and its anchor.
 * Used as the `offset` prop at every canvas call site (add-node preview,
 * node inspector, toolbar stories, etc.). The value is placement-agnostic:
 * for `right-start` it's the horizontal gap, for `top` it's the vertical
 * gap, and so on — the floating-ui `offset` middleware interprets it
 * relative to the active placement.
 */
export const FLOATING_CANVAS_PANEL_OFFSET = 10;
