import React, { useMemo } from "react";
import type { GridProps as CoreGridProps, OverflowProps, PositionProps, SizeProps, SpacingProps } from "./core";
import { alignMap, calcSpacingPx, justifyMap } from "./core";

type GridProps = CoreGridProps & OverflowProps & PositionProps & React.HTMLAttributes<HTMLDivElement> & SizeProps & SpacingProps;

const Grid: React.FC<GridProps> = ({
  children,
  className,
  style,
  // Extract all our custom props
  templateColumns,
  templateRows,
  templateAreas,
  autoFlow,
  autoColumns,
  autoRows,
  gap,
  rowGap,
  columnGap,
  alignItems,
  justifyItems,
  alignContent,
  justifyContent,
  placeItems,
  placeContent,
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
      display: "grid",

      // Grid template properties
      ...(templateColumns && { gridTemplateColumns: templateColumns }),
      ...(templateRows && { gridTemplateRows: templateRows }),
      ...(templateAreas && { gridTemplateAreas: templateAreas }),

      // Grid auto properties
      ...(autoFlow && { gridAutoFlow: autoFlow }),
      ...(autoColumns && { gridAutoColumns: autoColumns }),
      ...(autoRows && { gridAutoRows: autoRows }),

      // Gap properties
      ...(gap !== undefined && { gap: calcSpacingPx(gap) }),
      ...(rowGap !== undefined && { rowGap: calcSpacingPx(rowGap) }),
      ...(columnGap !== undefined && { columnGap: calcSpacingPx(columnGap) }),

      // Alignment properties
      ...(alignItems && { alignItems: alignMap[alignItems] }),
      ...(justifyItems && { justifyItems: alignMap[justifyItems] }),
      ...(alignContent && { alignContent: alignMap[alignContent] }),
      ...(justifyContent && { justifyContent: justifyMap[justifyContent] }),
      ...(placeItems && { placeItems }),
      ...(placeContent && { placeContent }),

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
    templateColumns,
    templateRows,
    templateAreas,
    autoFlow,
    autoColumns,
    autoRows,
    gap,
    rowGap,
    columnGap,
    alignItems,
    justifyItems,
    alignContent,
    justifyContent,
    placeItems,
    placeContent,
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

/**
 * Simple grid component with equal columns
 */
const SimpleGrid: React.FC<GridProps & { columns?: number }> = ({ columns = 2, ...props }) => {
  return <Grid templateColumns={`repeat(${columns}, 1fr)`} {...props} />;
};

export { Grid, SimpleGrid };
