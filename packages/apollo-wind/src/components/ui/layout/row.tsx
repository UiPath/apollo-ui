import * as React from "react";
import { cn } from "@/lib";
import type { LayoutProps } from "./types";
import { buildLayoutClasses } from "./utils";

export interface RowProps extends LayoutProps {
  /**
   * Content of the row
   */
  children?: React.ReactNode;
}

/**
 * Row component - A flex container with horizontal direction by default
 *
 * @example
 * ```tsx
 * <Row gap={4} align="center" justify="between">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Row>
 * ```
 */
const Row = React.forwardRef<HTMLDivElement, RowProps>(
  (
    {
      children,
      className,
      direction = "row",
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

Row.displayName = "Row";

export { Row };
