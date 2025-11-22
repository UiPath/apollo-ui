import type React from "react";

/**
 * Spacing values that can be used for gap, padding, and margin
 * Supports Tailwind spacing scale (0-96) or auto/full
 */
export type SpacingValue =
  | 0
  | 0.5
  | 1
  | 1.5
  | 2
  | 2.5
  | 3
  | 3.5
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 14
  | 16
  | 20
  | 24
  | 28
  | 32
  | 36
  | 40
  | 44
  | 48
  | 52
  | 56
  | 60
  | 64
  | 72
  | 80
  | 96
  | "auto"
  | "full";

/**
 * Size values for width and height
 * Supports Tailwind sizing scale, percentages, and special values
 */
export type SizeValue =
  | SpacingValue
  | "screen"
  | "min"
  | "max"
  | "fit"
  | `${number}%`
  | `${number}/${number}`; // fractions like 1/2, 1/3, etc.

/**
 * Flex alignment values
 */
export type AlignValue = "start" | "center" | "end" | "baseline" | "stretch";

/**
 * Flex justification values
 */
export type JustifyValue = "start" | "center" | "end" | "between" | "around" | "evenly";

/**
 * Flex wrap values
 */
export type WrapValue = "nowrap" | "wrap" | "wrap-reverse";

/**
 * Overflow values
 */
export type OverflowValue = "auto" | "hidden" | "clip" | "visible" | "scroll";

/**
 * Position values
 */
export type PositionValue = "static" | "relative" | "absolute" | "fixed" | "sticky";

/**
 * Flex direction values
 */
export type DirectionValue = "row" | "row-reverse" | "column" | "column-reverse";

/**
 * Spacing props for padding and margin
 */
export interface SpacingProps {
  /** Padding on all sides */
  p?: SpacingValue;
  /** Padding top */
  pt?: SpacingValue;
  /** Padding bottom */
  pb?: SpacingValue;
  /** Padding left */
  pl?: SpacingValue;
  /** Padding right */
  pr?: SpacingValue;
  /** Padding horizontal (left and right) */
  px?: SpacingValue;
  /** Padding vertical (top and bottom) */
  py?: SpacingValue;

  /** Margin on all sides */
  m?: SpacingValue;
  /** Margin top */
  mt?: SpacingValue;
  /** Margin bottom */
  mb?: SpacingValue;
  /** Margin left */
  ml?: SpacingValue;
  /** Margin right */
  mr?: SpacingValue;
  /** Margin horizontal (left and right) */
  mx?: SpacingValue;
  /** Margin vertical (top and bottom) */
  my?: SpacingValue;
}

/**
 * Size props for width and height
 */
export interface SizeProps {
  /** Width */
  w?: SizeValue;
  /** Height */
  h?: SizeValue;
  /** Max width */
  maxW?: SizeValue;
  /** Min width */
  minW?: SizeValue;
  /** Max height */
  maxH?: SizeValue;
  /** Min height */
  minH?: SizeValue;
}

/**
 * Flex layout props
 */
export interface FlexProps {
  /** Flex direction */
  direction?: DirectionValue;
  /** Align items */
  align?: AlignValue;
  /** Justify content */
  justify?: JustifyValue;
  /** Flex wrap */
  wrap?: WrapValue;
  /** Gap between items */
  gap?: SpacingValue;
  /** Flex property (grow/shrink/basis) */
  flex?: string | number;
}

/**
 * Overflow props
 */
export interface OverflowProps {
  /** Overflow behavior */
  overflow?: OverflowValue;
  /** Overflow X behavior */
  overflowX?: OverflowValue;
  /** Overflow Y behavior */
  overflowY?: OverflowValue;
}

/**
 * Position props
 */
export interface PositionProps {
  /** Position type */
  position?: PositionValue;
}

/**
 * Grid layout props
 */
export interface GridProps {
  /** Number of columns or template */
  cols?: number | string;
  /** Number of rows or template */
  rows?: number | string;
  /** Gap between items */
  gap?: SpacingValue;
  /** Gap between columns */
  gapX?: SpacingValue;
  /** Gap between rows */
  gapY?: SpacingValue;
  /** Auto flow direction */
  autoFlow?: "row" | "column" | "dense" | "row-dense" | "column-dense";
  /** Auto columns sizing */
  autoCols?: "auto" | "min" | "max" | "fr";
  /** Auto rows sizing */
  autoRows?: "auto" | "min" | "max" | "fr";
}

/**
 * Combined layout props for flex-based components (Row, Column)
 */
export type LayoutProps = FlexProps &
  OverflowProps &
  PositionProps &
  SizeProps &
  SpacingProps &
  React.HTMLAttributes<HTMLDivElement>;

/**
 * Combined layout props for grid-based components
 */
export type GridLayoutProps = GridProps &
  OverflowProps &
  PositionProps &
  SizeProps &
  SpacingProps &
  React.HTMLAttributes<HTMLDivElement>;
