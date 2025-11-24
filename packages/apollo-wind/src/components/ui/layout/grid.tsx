import * as React from "react";
import { cn } from "@/lib";
import type { GridLayoutProps } from "./types";
import { buildGridLayoutClasses, spacingToRem } from "./utils";

export interface GridProps extends GridLayoutProps {
  /**
   * Content of the grid
   */
  children?: React.ReactNode;
}

/**
 * Grid component - A CSS Grid container
 *
 * @example
 * ```tsx
 * <Grid cols={3} gap={4}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </Grid>
 * ```
 */
const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      children,
      className,
      style,
      cols,
      rows,
      gap,
      gapX,
      gapY,
      autoFlow,
      autoCols,
      autoRows,
      w,
      h,
      maxW,
      minW,
      maxH,
      minH,
      overflow,
      overflowX,
      overflowY,
      position,
      p,
      pt,
      pb,
      pl,
      pr,
      px,
      py,
      m,
      mt,
      mb,
      ml,
      mr,
      mx,
      my,
      ...htmlProps
    },
    ref,
  ) => {
    const gridClasses = buildGridLayoutClasses({
      cols,
      rows,
      gap,
      gapX,
      gapY,
      autoFlow,
      autoCols,
      autoRows,
      w,
      h,
      maxW,
      minW,
      maxH,
      minH,
      overflow,
      overflowX,
      overflowY,
      position,
      p,
      pt,
      pb,
      pl,
      pr,
      px,
      py,
      m,
      mt,
      mb,
      ml,
      mr,
      mx,
      my,
    });

    // Use inline styles for gapX, gapY, and gap as fallback for values not in Tailwind
    const inlineStyles: React.CSSProperties = {
      ...style,
      ...(gap !== undefined && { gap: spacingToRem(gap) }),
      ...(gapX !== undefined && { columnGap: spacingToRem(gapX) }),
      ...(gapY !== undefined && { rowGap: spacingToRem(gapY) }),
    };

    return (
      <div ref={ref} className={cn(...gridClasses, className)} style={inlineStyles} {...htmlProps}>
        {children}
      </div>
    );
  },
);

Grid.displayName = "Grid";

export { Grid };
