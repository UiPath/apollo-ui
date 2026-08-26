/**
 * Radix's ScrollArea wraps its children in an inline-styled
 * `min-width: 100%; display: table` div. Inside a table box a row's `w-full`
 * resolves against content width rather than the pane, so `truncate` never
 * engages: long labels push the row past the pane edge and get sliced by the
 * border instead of ellipsing. Forcing that wrapper back to `block` restores
 * the constraint. The `!` is required because Radix sets display inline.
 */
export const SCROLL_PANE = "[&_[data-slot=scroll-area-viewport]>div]:block!";
