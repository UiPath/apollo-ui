import React, { useMemo } from 'react';
import type { FlexProps, OverflowProps, PositionProps, SizeProps, SpacingProps } from './core';
import { alignMap, calcSpacingPx, justifyMap } from './core';

type StackProps = FlexProps &
  OverflowProps &
  PositionProps &
  React.HTMLAttributes<HTMLDivElement> &
  SizeProps &
  SpacingProps;

const Stack: React.FC<StackProps> = ({
  children,
  className,
  style,
  // Extract all our custom props
  direction = 'row',
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
      display: 'flex',
      flexDirection: direction,

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
    style,
  ]);

  return (
    <div className={className} style={dynamicStyle} {...htmlProps}>
      {children}
    </div>
  );
};

const Row: React.FC<StackProps> = (props) => {
  return <Stack direction="row" {...props} />;
};

const Column: React.FC<StackProps> = (props) => {
  return <Stack direction="column" {...props} />;
};

export { Row, Column };
