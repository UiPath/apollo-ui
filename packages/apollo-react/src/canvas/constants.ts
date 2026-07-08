export const PREVIEW_NODE_ID = 'preview-node-id';
export const PREVIEW_EDGE_ID = 'preview-edge-id';
export const DEFAULT_SOURCE_HANDLE_ID = 'output';
export const DEFAULT_NODE_SIZE = 96; // px

export const GRID_SPACING = 16;

/** Canvas viewport width below which compact layout is used. */
export const CANVAS_COMPACT_BREAKPOINT = 600;

/** Fixed width of the Toolbox container (in px) when it isn't in `fullWidth` mode. */
export const TOOLBOX_WIDTH = 320;
/**
 * Fixed height of the Toolbox container (in px) when it isn't in `fullHeight`
 * mode. Sized so the standard add-node root menu (9 rows + 2 group dividers
 * at the current row metrics) cuts the 10th row roughly in half at the bottom
 * edge, hinting that the list scrolls.
 */
export const TOOLBOX_HEIGHT = 410;
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

/** Default width for rectangle-shaped nodes (px). */
export const DEFAULT_RECTANGLE_NODE_WIDTH = 288;

/** Node height variants (grid-aligned). */
export const NODE_HEIGHT_DEFAULT = GRID_SPACING * 6; // 96px
export const NODE_HEIGHT_FOOTER_BUTTON = GRID_SPACING * 9; // 144px
export const NODE_HEIGHT_FOOTER_SINGLE = GRID_SPACING * 10; // 160px
export const NODE_HEIGHT_FOOTER_DOUBLE = GRID_SPACING * 11; // 176px

/**
 * Inner-shape geometry, expressed as ratios of the outer container.
 * Reference: FlowNode 96×96 design — container radius 32px, inner shape 80px,
 * icon 40px, inner radius 24px.
 */
export const NODE_CONTAINER_RADIUS_RATIO = 32 / DEFAULT_NODE_SIZE;
export const NODE_INNER_SHAPE_RATIO = 80 / DEFAULT_NODE_SIZE;
export const NODE_INNER_ICON_RATIO = 40 / DEFAULT_NODE_SIZE;
export const NODE_INNER_RADIUS_RATIO = 24 / DEFAULT_NODE_SIZE;
export const NODE_BORDER_SIZE = 1; // px

/** Icon size used in the "manifest not found" error fallback (px). */
export const NODE_ERROR_ICON_SIZE = 40;

/** Bottom offset (px) for the node text label, with/without bottom handles. */
export const NODE_TEXT_BOTTOM_OFFSET = -8;
export const NODE_TEXT_BOTTOM_OFFSET_WITH_HANDLES = -40;

/** Badge slot dimensions and inset (px). */
export const NODE_BADGE_SIZE = 20;
export const NODE_BADGE_INSET_SQUARE = 6;
export const NODE_BADGE_INSET_CIRCLE = 12;
