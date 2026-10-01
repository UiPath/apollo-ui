/**
 * How PageHeader lays out its parts, which decides where the collapsible
 * actions' space comes from.
 *
 * - "flex": below the grid breakpoint. The nav and actions share a
 *   wrapping row, and the nav keeps navMinWidth.
 * - "grid": nav and actions in a 1fr / auto grid. The actions column is
 *   sized to its content, so measuring it only reports the space the
 *   already-collapsed actions take, and they never expand again. Measure
 *   from the header instead, less the nav's minimum and the column gap.
 * - "grid-with-content": nav, content, and actions in a 3fr / 6fr / 3fr
 *   grid. The actions column is a fixed share, so its own width is the
 *   space.
 */
export type PageHeaderLayout = "flex" | "grid" | "grid-with-content";

export interface CollapsibleActionsSpaceInput {
  layout: PageHeaderLayout;
  /** The header's clientWidth, padding included. */
  headerWidth: number;
  /** The header's horizontal padding, both sides. */
  headerPadding: number;
  /** The width the nav keeps before actions fold. */
  navMinWidth: number;
  /** Width taken by the other children of PageHeaderActions, with gaps. */
  fixedWidth: number;
  /** The actions container's clientWidth. */
  actionsWidth: number;
  /** The header's gap between columns. */
  gap: number;
}

/** The width the collapsible actions can fill before any fold into the menu. */
export function collapsibleActionsSpace({
  layout,
  headerWidth,
  headerPadding,
  navMinWidth,
  fixedWidth,
  actionsWidth,
  gap,
}: CollapsibleActionsSpaceInput): number {
  if (layout === "grid-with-content") return actionsWidth - fixedWidth;
  const columnGap = layout === "grid" ? gap : 0;
  return headerWidth - headerPadding - navMinWidth - columnGap - fixedWidth;
}
