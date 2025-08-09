export const alignMap = {
  start: "flex-start",
  end: "flex-end",
  "flex-start": "flex-start",
  "flex-end": "flex-end",
  center: "center",
  stretch: "stretch",
  baseline: "baseline",
};

export const justifyMap = {
  start: "flex-start",
  end: "flex-end",
  "flex-start": "flex-start",
  "flex-end": "flex-end",
  center: "center",
  between: "space-between",
  around: "space-around",
  evenly: "space-evenly",
  "space-between": "space-between",
  "space-around": "space-around",
  "space-evenly": "space-evenly",
};

export function calcSpacingPx(value?: number | string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    return `${value}px`;
  }

  if (typeof value === "string") {
    return value;
  }

  return undefined;
}

export interface SpacingProps {
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

export interface FlexProps {
  /** Flex direction */
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
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

export interface GridProps {
  /** Grid template columns */
  templateColumns?: string;
  /** Grid template rows */
  templateRows?: string;
  /** Grid template areas */
  templateAreas?: string;
  /** Grid auto flow */
  autoFlow?: "row" | "column" | "dense" | "row dense" | "column dense";
  /** Grid auto columns */
  autoColumns?: string;
  /** Grid auto rows */
  autoRows?: string;
  /** Gap between grid items */
  gap?: number | string;
  /** Row gap between grid items */
  rowGap?: number | string;
  /** Column gap between grid items */
  columnGap?: number | string;
  /** Alignment of items within their grid areas */
  alignItems?: keyof typeof alignMap;
  /** Justification of items within their grid areas */
  justifyItems?: keyof typeof alignMap;
  /** Alignment of the grid within its container */
  alignContent?: keyof typeof alignMap;
  /** Justification of the grid within its container */
  justifyContent?: keyof typeof justifyMap;
  /** Shorthand for align-items and justify-items */
  placeItems?: string;
  /** Shorthand for align-content and justify-content */
  placeContent?: string;
}

export interface SizeProps {
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

export interface OverflowProps {
  /** Overflow behavior */
  overflow?: "auto" | "clip" | "hidden" | "scroll" | "visible";
  /** Horizontal overflow behavior */
  overflowX?: "auto" | "clip" | "hidden" | "scroll" | "visible";
  /** Vertical overflow behavior */
  overflowY?: "auto" | "clip" | "hidden" | "scroll" | "visible";
}

export interface PositionProps {
  /** Position type */
  position?: "absolute" | "fixed" | "relative" | "sticky";
}
