import * as React from "react";
import { cn } from "@/lib";
import type { LayoutProps } from "./types";
import { buildLayoutClasses, spacingToRem } from "./utils";

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
      style,
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

    // Use inline styles for gap as fallback for values not in Tailwind
    const inlineStyles: React.CSSProperties = {
      ...style,
      ...(gap !== undefined && { gap: spacingToRem(gap) }),
    };

    return (
      <div
        ref={ref}
        className={cn(...layoutClasses, className)}
        style={inlineStyles}
        {...htmlProps}
      >
        {children}
      </div>
    );
  },
);

Row.displayName = "Row";

export { Row };
