// Layout, sizing and timing constants for the grid.

/** What an empty value cell shows; consumers reuse it for a never-run result. */
export const EMPTY_VALUE_DASH = '—';
/** Fixed gutter: the row-number (`#`) column. Never flexes, never resizes. */
export const ROW_NUMBER_WIDTH = 48;
/** No column can be dragged narrower than this; there is no maximum. */
export const MIN_COLUMN_WIDTH = 80;
/**
 * Default body row height: a cell surface plus its 1px bottom border. Fixed, not measured — spacer
 * sizes, window ranges, drag boundaries and keyboard scroll targets are all derived from it.
 */
export const BODY_ROW_HEIGHT_PX = 40;
/** The inert band drawn between two column groups */
export const GROUP_SEPARATOR_WIDTH_PX = 30;
/** Assumed column width for window fill estimates before real offsets resolve. */
export const COLUMN_ESTIMATE_PX = 220;
/** Per arrow-key press when a column-resize handle is focused. */
export const COLUMN_RESIZE_KEYBOARD_STEP = 16;
export const DEFAULT_ROW_OVERSCAN = 30;
export const DEFAULT_COLUMN_OVERSCAN = 8;
/** Assumed viewport size before the scroll container has been measured. */
export const FALLBACK_ROW_VIEWPORT_PX = 800;
export const FALLBACK_COLUMN_VIEWPORT_PX = 1600;
/** Distance from a viewport edge inside which a drag starts autoscrolling. */
export const AUTOSCROLL_EDGE_PX = 32;
/** Scroll advance per autoscroll frame. */
export const AUTOSCROLL_STEP_PX = 14;
