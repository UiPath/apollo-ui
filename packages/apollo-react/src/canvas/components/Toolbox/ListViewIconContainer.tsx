import { memo, type ReactNode, useMemo } from 'react';

interface ListViewIconContainerProps {
  /**
   * Tile background resolved from the item's `color` / `colorDark`. Left
   * transparent when absent, so plain rows read as icon + text without a tile.
   */
  background?: string;
  /** Overrides the inherited icon color (from `ListItem.contentColor`). */
  color?: string;
  children?: ReactNode;
}

/**
 * The 24px leading tile of a {@link ListView} row. Sits below the row's inset
 * focus outline so the outline stays unbroken across the icon.
 */
export const ListViewIconContainer = memo(function ListViewIconContainer({
  background,
  color,
  children,
}: ListViewIconContainerProps) {
  // Undefined rather than {} when there's nothing dynamic, so React skips the
  // style attribute entirely.
  const style = useMemo(
    () => (background || color ? { background, color } : undefined),
    [background, color]
  );

  return (
    <div
      className="flex size-6 shrink-0 items-center justify-center rounded-md text-(--canvas-foreground-emp) opacity-90 [z-index:-1] future:rounded-lg"
      style={style}
      data-testid="list-item-icon"
    >
      {children}
    </div>
  );
});
