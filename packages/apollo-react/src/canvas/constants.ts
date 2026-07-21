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

/**
 * Sequential Canvas View geometry (px). Bars are not draggable in v1, so
 * grid-snap alignment of the height is a non-issue -- `SEQ_BAR_HEIGHT` was
 * tightened off the 16px grid per visual-polish feedback; every other
 * value here still sits on the 16px grid so bars never kink against snapped
 * edges.
 */
/** Bar width. 900 is off the 16px grid, so 896 (56 * 16) is used instead. */
export const SEQ_BAR_WIDTH = 896;
/** Bar height. Tightened from the original 72 (4.5 * 16) to a more compact row per visual-polish feedback. */
export const SEQ_BAR_HEIGHT = 56;
/**
 * Vertical gap between bar rows (4 * 16). Widened from the original 48
 * (3 * 16) per visual-polish feedback, leaving room for branch section
 * headers and connector insert affordances between adjacent bars.
 */
export const SEQ_ROW_GAP = 64;
/** Horizontal offset per indent depth level: `x = depth * SEQ_INDENT_PX` (4 * 16). */
export const SEQ_INDENT_PX = 64;
/**
 * Corner radius (px) for sequential connector elbows, giving the branch and
 * merge-back connectors a pronounced smooth-step curve rather than the subtler
 * default edge radius. `createRoundedPath` clamps this to half the shorter
 * adjacent segment, so tight jogs round gracefully.
 */
export const SEQ_EDGE_CORNER_RADIUS = 24;
/**
 * Fixed horizontal offset (px) of a bar's invisible top/bottom connector
 * handles from the bar's OWN left edge, rather than its horizontal center
 * (per visual-polish feedback: connectors must drop from the bottom-left
 * region, matching the n8n/Zapier-style wireframe). Because child bars are
 * already indented `depth * SEQ_INDENT_PX`, anchoring every bar's handles at
 * the SAME offset from its own left edge automatically produces depth-aligned
 * vertical spines with no per-depth math needed at the edge/connector layer.
 * Kept comfortably below `SEQ_INDENT_PX` (64) so adjacent depths' spines never
 * overlap or cross.
 */
export const SEQ_HANDLE_LEFT_OFFSET = 28;

/**
 * Synthetic node `type` keys for the Sequential Canvas view. Real step clones
 * KEEP their manifest type (they resolve the real BaseNode via the sequential
 * nodeTypes map); only the injected start bar and terminal placeholder use these
 * synthetic types. Defined here as the single source of truth shared by the node
 * components (nodes/index.ts) and the insert pipeline (edges/sequentialInsert.ts)
 * so the two never drift.
 */
export const SEQ_START_NODE_TYPE = 'sequential-start';
export const SEQ_PLACEHOLDER_NODE_TYPE = 'sequential-placeholder';

/**
 * Default product node `type` treated as the sequence start/trigger when the
 * host doesn't supply its own `isStartNode` predicate. Shared by
 * `projectSequence`'s default and `SequentialCanvas`'s registry-aware predicate
 * so the two can't drift.
 */
export const DEFAULT_TRIGGER_NODE_TYPE = 'uipath.first-run';
