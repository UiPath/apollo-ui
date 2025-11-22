import * as React from "react";
import { cn } from "@/lib";
import type { LayoutProps } from "./types";
import { buildLayoutClasses } from "./utils";

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
    const layoutClasses = buildLayoutClasses({
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
      <div ref={ref} className={cn(...layoutClasses, className)} {...htmlProps}>
        {children}
      </div>
    );
  },
);

Column.displayName = "Column";

export { Column };
