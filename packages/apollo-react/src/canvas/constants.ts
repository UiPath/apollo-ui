export const PREVIEW_NODE_ID = 'preview-node-id';
export const PREVIEW_EDGE_ID = 'preview-edge-id';
export const DEFAULT_SOURCE_HANDLE_ID = 'output';
export const DEFAULT_TARGET_HANDLE_ID = 'input';
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
export const TOOLBOX_PADDING_X = 12;
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
 * Reference: BaseNode 96×96 design — container radius 32px, inner shape 80px,
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

/**
 * Sequential canvas geometry (px). All values except the bar height sit on the 16px
 * grid so bars never kink against snapped edges; bars are not draggable, so the height
 * need not.
 */
export const SEQ_BAR_WIDTH = 896;
export const SEQ_BAR_HEIGHT = 56;
/** Leaves room for branch headers and insert affordances between adjacent bars. */
export const SEQ_ROW_GAP = 64;
/** `x = depth * SEQ_INDENT_PX`. */
export const SEQ_INDENT_PX = 64;
/** Connector elbow radius; `createRoundedPath` clamps it to half the shorter segment. */
export const SEQ_EDGE_CORNER_RADIUS = 24;
/**
 * Offset of a bar's connector handles from its own left edge. Anchoring every bar at
 * the same offset yields depth-aligned spines for free. Must stay below SEQ_INDENT_PX
 * so adjacent depths' spines never cross.
 */
export const SEQ_HANDLE_LEFT_OFFSET = 28;

/** Synthetic node types for the injected start bar and terminal placeholder; real steps keep their manifest type. */
export const SEQ_START_NODE_TYPE = 'sequential-start';
export const SEQ_PLACEHOLDER_NODE_TYPE = 'sequential-placeholder';

/** Default start/trigger node type when the host supplies no `isStartNode`. */
export const DEFAULT_TRIGGER_NODE_TYPE = 'uipath.first-run';
