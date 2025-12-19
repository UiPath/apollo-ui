import * as React from "react";
import { cn } from "@/lib";
import type { LayoutProps } from "./types";
import { buildLayoutStyles } from "./utils";

export interface ColumnProps extends LayoutProps {
  /**
   * Content of the column
   */
  children?: React.ReactNode;
}

/**
 * Column component - A flex container with vertical direction by default
 *
 * @example
 * ```tsx
 * <Column gap={4} align="center">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Column>
 * ```
 */
const Column = React.forwardRef<HTMLDivElement, ColumnProps>(
  (
    {
      children,
      className,
      style,
      direction = "column",
      align,
      justify,
      wrap,
      gap,
      flex,
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
    const layoutStyles = buildLayoutStyles({
      direction,
      align,
      justify,
      wrap,
      gap,
      flex,
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

    return (
      <div ref={ref} className={cn(className)} style={{ ...layoutStyles, ...style }} {...htmlProps}>
        {children}
      </div>
    );
  },
);

Column.displayName = "Column";

export { Column };
