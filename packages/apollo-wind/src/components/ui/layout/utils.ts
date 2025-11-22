import type {
  AlignValue,
  DirectionValue,
  GridLayoutProps,
  JustifyValue,
  LayoutProps,
  OverflowValue,
  PositionValue,
  SizeValue,
  SpacingValue,
  WrapValue,
} from "./types";

/**
 * Convert spacing value to Tailwind class suffix
 */
export function getSpacingClass(value: SpacingValue): string {
  if (value === "auto") return "auto";
  if (value === "full") return "full";
  // Handle decimal values like 0.5, 1.5, etc.
  return value.toString().replace(".", "_");
}

/**
 * Convert spacing value to CSS rem value
 */
export function spacingToRem(value: SpacingValue): string {
  if (value === "auto") return "auto";
  if (value === "full") return "100%";
  // Tailwind's spacing scale: 1 unit = 0.25rem (4px)
  return `${value * 0.25}rem`;
}

/**
 * Convert size value to Tailwind class suffix
 */
export function getSizeClass(value: SizeValue): string {
  if (typeof value === "string") {
    if (
      value === "auto" ||
      value === "full" ||
      value === "screen" ||
      value === "min" ||
      value === "max" ||
      value === "fit"
    ) {
      return value;
    }
    // Handle percentages like "50%"
    if (value.includes("%")) {
      return `[${value}]`; // Use arbitrary value
    }
    // Handle fractions like "1/2"
    if (value.includes("/")) {
      return value.replace("/", "\\/");
    }
  }
  return getSpacingClass(value as SpacingValue);
}

/**
 * Map alignment values to Tailwind classes
 */
export const alignMap: Record<AlignValue, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
};

/**
 * Map justify values to Tailwind classes
 */
export const justifyMap: Record<JustifyValue, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

/**
 * Map wrap values to Tailwind classes
 */
export const wrapMap: Record<WrapValue, string> = {
  nowrap: "flex-nowrap",
  wrap: "flex-wrap",
  "wrap-reverse": "flex-wrap-reverse",
};

/**
 * Map direction values to Tailwind classes
 */
export const directionMap: Record<DirectionValue, string> = {
  row: "flex-row",
  "row-reverse": "flex-row-reverse",
  column: "flex-col",
  "column-reverse": "flex-col-reverse",
};

/**
 * Map overflow values to Tailwind classes
 */
export const overflowMap: Record<OverflowValue, string> = {
  auto: "auto",
  hidden: "hidden",
  clip: "clip",
  visible: "visible",
  scroll: "scroll",
};

/**
 * Map position values to Tailwind classes
 */
export const positionMap: Record<PositionValue, string> = {
  static: "static",
  relative: "relative",
  absolute: "absolute",
  fixed: "fixed",
  sticky: "sticky",
};

/**
 * Map spacing value to complete Tailwind class name
 */
function mapSpacingClass(prefix(apollo-wind): string, value: SpacingValue): string {
  const suffix = getSpacingClass(value);
  return `${prefix}-${suffix}` as const;
}

/**
 * Build Tailwind classes for spacing props
 */
export function getSpacingClasses(props: Partial<LayoutProps>): string[] {
  const classes: string[] = [];

  // Padding
  if (props.p !== undefined) classes.push(mapSpacingClass("p", props.p));
  if (props.pt !== undefined) classes.push(mapSpacingClass("pt", props.pt));
  if (props.pb !== undefined) classes.push(mapSpacingClass("pb", props.pb));
  if (props.pl !== undefined) classes.push(mapSpacingClass("pl", props.pl));
  if (props.pr !== undefined) classes.push(mapSpacingClass("pr", props.pr));
  if (props.px !== undefined && props.pl === undefined && props.pr === undefined) {
    classes.push(mapSpacingClass("px", props.px));
  }
  if (props.py !== undefined && props.pt === undefined && props.pb === undefined) {
    classes.push(mapSpacingClass("py", props.py));
  }

  // Margin
  if (props.m !== undefined) classes.push(mapSpacingClass("m", props.m));
  if (props.mt !== undefined) classes.push(mapSpacingClass("mt", props.mt));
  if (props.mb !== undefined) classes.push(mapSpacingClass("mb", props.mb));
  if (props.ml !== undefined) classes.push(mapSpacingClass("ml", props.ml));
  if (props.mr !== undefined) classes.push(mapSpacingClass("mr", props.mr));
  if (props.mx !== undefined && props.ml === undefined && props.mr === undefined) {
    classes.push(mapSpacingClass("mx", props.mx));
  }
  if (props.my !== undefined && props.mt === undefined && props.mb === undefined) {
    classes.push(mapSpacingClass("my", props.my));
  }

  return classes;
}

/**
 * Build Tailwind classes for size props
 */
export function getSizeClasses(props: Partial<LayoutProps>): string[] {
  const classes: string[] = [];

  if (props.w !== undefined) classes.push(`w-${getSizeClass(props.w)}`);
  if (props.h !== undefined) classes.push(`h-${getSizeClass(props.h)}`);
  if (props.maxW !== undefined) classes.push(`max-w-${getSizeClass(props.maxW)}`);
  if (props.minW !== undefined) classes.push(`min-w-${getSizeClass(props.minW)}`);
  if (props.maxH !== undefined) classes.push(`max-h-${getSizeClass(props.maxH)}`);
  if (props.minH !== undefined) classes.push(`min-h-${getSizeClass(props.minH)}`);

  return classes;
}

/**
 * Build Tailwind classes for flex props
 */
export function getFlexClasses(props: Partial<LayoutProps>): string[] {
  const classes: string[] = ["flex"];

  if (props.direction !== undefined) {
    classes.push(directionMap[props.direction]);
  }
  if (props.align !== undefined) {
    classes.push(alignMap[props.align]);
  }
  if (props.justify !== undefined) {
    classes.push(justifyMap[props.justify]);
  }
  if (props.wrap !== undefined) {
    classes.push(wrapMap[props.wrap]);
  }
  if (props.gap !== undefined) {
    classes.push(`gap-${getSpacingClass(props.gap)}`);
  }
  if (props.flex !== undefined) {
    if (typeof props.flex === "number") {
      // Use standard Tailwind flex utilities for common values
      classes.push(`flex-${props.flex}`);
    } else {
      // For string values like "auto", "initial", "none", use them directly
      // For custom values, use arbitrary value syntax
      if (props.flex === "auto" || props.flex === "initial" || props.flex === "none") {
        classes.push(`flex-${props.flex}`);
      } else {
        classes.push(`flex-[${props.flex}]`);
      }
    }
  }

  return classes;
}

/**
 * Build Tailwind classes for overflow props
 */
export function getOverflowClasses(props: Partial<LayoutProps>): string[] {
  const classes: string[] = [];

  if (props.overflow !== undefined) {
    classes.push(`overflow-${overflowMap[props.overflow]}`);
  }
  if (props.overflowX !== undefined) {
    classes.push(`overflow-x-${overflowMap[props.overflowX]}`);
  }
  if (props.overflowY !== undefined) {
    classes.push(`overflow-y-${overflowMap[props.overflowY]}`);
  }

  return classes;
}

/**
 * Build Tailwind classes for position props
 */
export function getPositionClasses(props: Partial<LayoutProps>): string[] {
  const classes: string[] = [];

  if (props.position !== undefined) {
    classes.push(positionMap[props.position]);
  }

  return classes;
}

/**
 * Build Tailwind classes for grid props
 */
export function getGridClasses(props: Partial<GridLayoutProps>): string[] {
  const classes: string[] = ["grid"];

  if (props.cols !== undefined) {
    if (typeof props.cols === "number") {
      classes.push(`grid-cols-${props.cols}`);
    } else {
      classes.push(`grid-cols-[${props.cols}]`);
    }
  }

  if (props.rows !== undefined) {
    if (typeof props.rows === "number") {
      classes.push(`grid-rows-${props.rows}`);
    } else {
      classes.push(`grid-rows-[${props.rows}]`);
    }
  }

  if (props.gap !== undefined) {
    classes.push(`gap-${getSpacingClass(props.gap)}`);
  }
  // gapX and gapY are handled via inline styles in the component

  if (props.autoFlow !== undefined) {
    classes.push(`grid-flow-${props.autoFlow}`);
  }

  if (props.autoCols !== undefined) {
    classes.push(`auto-cols-${props.autoCols}`);
  }

  if (props.autoRows !== undefined) {
    classes.push(`auto-rows-${props.autoRows}`);
  }

  return classes;
}

/**
 * Combine all layout classes for flex-based components
 */
export function buildLayoutClasses(props: Partial<LayoutProps>): string[] {
  return [
    ...getFlexClasses(props),
    ...getSpacingClasses(props),
    ...getSizeClasses(props),
    ...getOverflowClasses(props),
    ...getPositionClasses(props),
  ];
}

/**
 * Combine all layout classes for grid-based components
 */
export function buildGridLayoutClasses(props: Partial<GridLayoutProps>): string[] {
  return [
    ...getGridClasses(props),
    ...getSpacingClasses(props),
    ...getSizeClasses(props),
    ...getOverflowClasses(props),
    ...getPositionClasses(props),
  ];
}
