import * as React from "react";
import { cn } from "@/lib";
import type { LayoutProps } from "./types";
import { buildLayoutClasses, spacingToRem } from "./utils";

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

Column.displayName = "Column";

export { Column };
