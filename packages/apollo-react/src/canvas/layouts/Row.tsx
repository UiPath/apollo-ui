import React, { useMemo } from "react";
import { alignMap, calcSpacingPx, justifyMap } from "./core";

interface SpacingProps {
  /** Padding (all sides) */
  p?: number | string;
  /** Padding top */
  pt?: number | string;
  /** Padding bottom */
  pb?: number | string;
  /** Padding left */
  pl?: number | string;
  /** Padding right */
  pr?: number | string;
  /** Padding horizontal (left & right) */
  px?: number | string;
  /** Padding vertical (top & bottom) */
  py?: number | string;
  /** Margin (all sides) */
  m?: number | string;
  /** Margin top */
  mt?: number | string;
  /** Margin bottom */
  mb?: number | string;
  /** Margin left */
  ml?: number | string;
  /** Margin right */
  mr?: number | string;
  /** Margin horizontal (left & right) */
  mx?: number | string;
  /** Margin vertical (top & bottom) */
  my?: number | string;
}

interface FlexProps {
  /** Alignment of items along cross axis */
  align?: keyof typeof alignMap;
  /** Justification of items along main axis */
  justify?: keyof typeof justifyMap;
  /** Flex wrap behavior */
  wrap?: "nowrap" | "wrap-reverse" | "wrap";
  /** Gap between items */
  gap?: number | string;
  /** Flex grow/shrink/basis */
  flex?: number | string;
}

interface SizeProps {
  /** Width */
  w?: number | string;
  /** Height */
  h?: number | string;
  /** Maximum width */
  maxW?: number | string;
  /** Minimum width */
  minW?: number | string;
  /** Maximum height */
  maxH?: number | string;
  /** Minimum height */
  minH?: number | string;
}

interface OverflowProps {
  /** Overflow behavior */
  overflow?: "auto" | "clip" | "hidden" | "scroll" | "visible";
  /** Horizontal overflow behavior */
  overflowX?: "auto" | "clip" | "hidden" | "scroll" | "visible";
  /** Vertical overflow behavior */
  overflowY?: "auto" | "clip" | "hidden" | "scroll" | "visible";
}

interface PositionProps {
  /** Position type */
  position?: "absolute" | "fixed" | "relative" | "sticky";
}

type Props = FlexProps & OverflowProps & PositionProps & React.HTMLAttributes<HTMLDivElement> & SizeProps & SpacingProps;

/**
 * Flexible row layout component with comprehensive flexbox API
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Row gap={16} align="center">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Row>
 *
 * // With presets
 * <Row center gap={8}>
 *   <Button>Cancel</Button>
 *   <Button>Save</Button>
 * </Row>
 *
 * // With spacing
 * <Row p={16} m={8} spaceBetween>
 *   <h2>Title</h2>
 *   <Button>Action</Button>
 * </Row>
 * ```
 */
export const Row: React.FC<Props> = ({
  children,
  className,
  style,
  // Extract all our custom props
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
  // Rest of HTML props
  ...htmlProps
}) => {
  // Keep useMemo for style calculations - this is still valuable
  const dynamicStyle: React.CSSProperties = useMemo(() => {
    return {
      display: "flex",
      flexDirection: "row",

      // Flex properties
      ...(wrap && { flexWrap: wrap }),
      ...(flex !== undefined && { flex }),
      ...(gap !== undefined && { gap: calcSpacingPx(gap) }),
      ...(justify && { justifyContent: justifyMap[justify] }),
      ...(align && { alignItems: alignMap[align] }),

      // Size properties
      ...(w !== undefined && { width: calcSpacingPx(w) }),
      ...(h !== undefined && { height: calcSpacingPx(h) }),
      ...(maxW !== undefined && { maxWidth: calcSpacingPx(maxW) }),
      ...(minW !== undefined && { minWidth: calcSpacingPx(minW) }),
      ...(maxH !== undefined && { maxHeight: calcSpacingPx(maxH) }),
      ...(minH !== undefined && { minHeight: calcSpacingPx(minH) }),

      // Overflow properties
      ...(overflow && { overflow }),
      ...(overflowX && { overflowX }),
      ...(overflowY && { overflowY }),

      // Position
      ...(position && { position }),

      // Padding
      ...(p !== undefined && { padding: calcSpacingPx(p) }),
      ...(pt !== undefined && { paddingTop: calcSpacingPx(pt) }),
      ...(pb !== undefined && { paddingBottom: calcSpacingPx(pb) }),
      ...(pl !== undefined && { paddingLeft: calcSpacingPx(pl) }),
      ...(pr !== undefined && { paddingRight: calcSpacingPx(pr) }),
      ...(px !== undefined && !pl && { paddingLeft: calcSpacingPx(px) }),
      ...(px !== undefined && !pr && { paddingRight: calcSpacingPx(px) }),
      ...(py !== undefined && !pt && { paddingTop: calcSpacingPx(py) }),
      ...(py !== undefined && !pb && { paddingBottom: calcSpacingPx(py) }),

      // Margin
      ...(m !== undefined && { margin: calcSpacingPx(m) }),
      ...(mt !== undefined && { marginTop: calcSpacingPx(mt) }),
      ...(mb !== undefined && { marginBottom: calcSpacingPx(mb) }),
      ...(ml !== undefined && { marginLeft: calcSpacingPx(ml) }),
      ...(mr !== undefined && { marginRight: calcSpacingPx(mr) }),
      ...(mx !== undefined && !ml && { marginLeft: calcSpacingPx(mx) }),
      ...(mx !== undefined && !mr && { marginRight: calcSpacingPx(mx) }),
      ...(my !== undefined && !mt && { marginTop: calcSpacingPx(my) }),
      ...(my !== undefined && !mb && { marginBottom: calcSpacingPx(my) }),

      // User style overrides
      ...style,
    };
  }, [
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
    style,
  ]);

  return (
    <div className={className} style={dynamicStyle} {...htmlProps}>
      {children}
    </div>
  );
};
