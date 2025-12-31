import type React from 'react';
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
} from './types';

/**
 * Convert spacing value to Tailwind class suffix
 */
export function getSpacingClass(value: SpacingValue): string {
  if (value === 'auto') return 'auto';
  if (value === 'full') return 'full';
  // Handle decimal values like 0.5, 1.5, etc.
  return value.toString().replace('.', '_');
}

/**
 * Convert spacing value to CSS rem value
 */
export function spacingToRem(value: SpacingValue): string {
  if (value === 'auto') return 'auto';
  if (value === 'full') return '100%';
  // Tailwind's spacing scale: 1 unit = 0.25rem (4px)
  return `${value * 0.25}rem`;
}

/**
 * Convert size value to Tailwind class suffix
 */
export function getSizeClass(value: SizeValue): string {
  if (typeof value === 'string') {
    if (
      value === 'auto' ||
      value === 'full' ||
      value === 'screen' ||
      value === 'min' ||
      value === 'max' ||
      value === 'fit'
    ) {
      return value;
    }
    // Handle percentages like "50%"
    if (value.includes('%')) {
      return `[${value}]`; // Use arbitrary value
    }
    // Handle fractions like "1/2"
    if (value.includes('/')) {
      return value.replace('/', '\\/');
    }
  }
  return getSpacingClass(value as SpacingValue);
}

/**
 * Map alignment values to Tailwind classes
 */
export const alignMap: Record<AlignValue, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

/**
 * Map justify values to Tailwind classes
 */
export const justifyMap: Record<JustifyValue, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

/**
 * Map wrap values to Tailwind classes
 */
export const wrapMap: Record<WrapValue, string> = {
  nowrap: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
};

/**
 * Map direction values to Tailwind classes
 */
export const directionMap: Record<DirectionValue, string> = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  column: 'flex-col',
  'column-reverse': 'flex-col-reverse',
};

/**
 * Map overflow values to Tailwind classes
 */
export const overflowMap: Record<OverflowValue, string> = {
  auto: 'auto',
  hidden: 'hidden',
  clip: 'clip',
  visible: 'visible',
  scroll: 'scroll',
};

/**
 * Map position values to Tailwind classes
 */
export const positionMap: Record<PositionValue, string> = {
  static: 'static',
  relative: 'relative',
  absolute: 'absolute',
  fixed: 'fixed',
  sticky: 'sticky',
};

/**
 * Map spacing value to complete Tailwind class name
 */
function mapSpacingClass(prefix: string, value: SpacingValue): string {
  const suffix = getSpacingClass(value);
  return `${prefix}-${suffix}` as const;
}

/**
 * Build Tailwind classes for spacing props
 */
export function getSpacingClasses(props: Partial<LayoutProps>): string[] {
  const classes: string[] = [];

  // Padding
  if (props.p !== undefined) classes.push(mapSpacingClass('p', props.p));
  if (props.pt !== undefined) classes.push(mapSpacingClass('pt', props.pt));
  if (props.pb !== undefined) classes.push(mapSpacingClass('pb', props.pb));
  if (props.pl !== undefined) classes.push(mapSpacingClass('pl', props.pl));
  if (props.pr !== undefined) classes.push(mapSpacingClass('pr', props.pr));
  if (props.px !== undefined && props.pl === undefined && props.pr === undefined) {
    classes.push(mapSpacingClass('px', props.px));
  }
  if (props.py !== undefined && props.pt === undefined && props.pb === undefined) {
    classes.push(mapSpacingClass('py', props.py));
  }

  // Margin
  if (props.m !== undefined) classes.push(mapSpacingClass('m', props.m));
  if (props.mt !== undefined) classes.push(mapSpacingClass('mt', props.mt));
  if (props.mb !== undefined) classes.push(mapSpacingClass('mb', props.mb));
  if (props.ml !== undefined) classes.push(mapSpacingClass('ml', props.ml));
  if (props.mr !== undefined) classes.push(mapSpacingClass('mr', props.mr));
  if (props.mx !== undefined && props.ml === undefined && props.mr === undefined) {
    classes.push(mapSpacingClass('mx', props.mx));
  }
  if (props.my !== undefined && props.mt === undefined && props.mb === undefined) {
    classes.push(mapSpacingClass('my', props.my));
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
  const classes: string[] = ['flex'];

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
    if (typeof props.flex === 'number') {
      // Use standard Tailwind flex utilities for common values
      classes.push(`flex-${props.flex}`);
    } else {
      // For string values like "auto", "initial", "none", use them directly
      // For custom values, use arbitrary value syntax
      if (props.flex === 'auto' || props.flex === 'initial' || props.flex === 'none') {
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
  const classes: string[] = ['grid'];

  if (props.cols !== undefined) {
    if (typeof props.cols === 'number') {
      classes.push(`grid-cols-${props.cols}`);
    } else {
      classes.push(`grid-cols-[${props.cols}]`);
    }
  }

  if (props.rows !== undefined) {
    if (typeof props.rows === 'number') {
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
 * Map align values to CSS alignItems values
 */
const alignToCSS: Record<AlignValue, React.CSSProperties['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  baseline: 'baseline',
  stretch: 'stretch',
};

/**
 * Map justify values to CSS justifyContent values
 */
const justifyToCSS: Record<JustifyValue, React.CSSProperties['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

/**
 * Map wrap values to CSS flexWrap values
 */
const wrapToCSS: Record<WrapValue, React.CSSProperties['flexWrap']> = {
  nowrap: 'nowrap',
  wrap: 'wrap',
  'wrap-reverse': 'wrap-reverse',
};

/**
 * Map direction values to CSS flexDirection values
 */
const directionToCSS: Record<DirectionValue, React.CSSProperties['flexDirection']> = {
  row: 'row',
  'row-reverse': 'row-reverse',
  column: 'column',
  'column-reverse': 'column-reverse',
};

/**
 * Convert a size value to a CSS value
 */
function sizeToCSS(value: SizeValue): string {
  if (value === 'auto') return 'auto';
  if (value === 'full') return '100%';
  if (value === 'screen') return '100vw';
  if (value === 'min') return 'min-content';
  if (value === 'max') return 'max-content';
  if (value === 'fit') return 'fit-content';
  if (typeof value === 'string') {
    // Handle percentages like "50%"
    if (value.includes('%')) return value;
    // Handle fractions like "1/2"
    if (value.includes('/')) {
      const [num, denom] = value.split('/').map(Number);
      return `${(num / denom) * 100}%`;
    }
  }
  // Numeric spacing value: 1 unit = 0.25rem
  return `${(value as number) * 0.25}rem`;
}

/**
 * Build inline styles for flex-based layout components (Row, Column)
 * This approach avoids Tailwind class generation issues with decimal values
 * and provides a more predictable styling experience.
 */
export function buildLayoutStyles(props: Partial<LayoutProps>): React.CSSProperties {
  const styles: React.CSSProperties = {
    display: 'flex',
  };

  // Flex properties
  if (props.direction !== undefined) {
    styles.flexDirection = directionToCSS[props.direction];
  }
  if (props.align !== undefined) {
    styles.alignItems = alignToCSS[props.align];
  }
  if (props.justify !== undefined) {
    styles.justifyContent = justifyToCSS[props.justify];
  }
  if (props.wrap !== undefined) {
    styles.flexWrap = wrapToCSS[props.wrap];
  }
  if (props.gap !== undefined) {
    styles.gap = spacingToRem(props.gap);
  }
  if (props.flex !== undefined) {
    styles.flex = props.flex;
  }

  // Size properties
  if (props.w !== undefined) {
    styles.width = sizeToCSS(props.w);
  }
  if (props.h !== undefined) {
    styles.height = sizeToCSS(props.h);
  }
  if (props.maxW !== undefined) {
    styles.maxWidth = sizeToCSS(props.maxW);
  }
  if (props.minW !== undefined) {
    styles.minWidth = sizeToCSS(props.minW);
  }
  if (props.maxH !== undefined) {
    styles.maxHeight = sizeToCSS(props.maxH);
  }
  if (props.minH !== undefined) {
    styles.minHeight = sizeToCSS(props.minH);
  }

  // Overflow properties
  if (props.overflow !== undefined) {
    styles.overflow = props.overflow;
  }
  if (props.overflowX !== undefined) {
    styles.overflowX = props.overflowX;
  }
  if (props.overflowY !== undefined) {
    styles.overflowY = props.overflowY;
  }

  // Position
  if (props.position !== undefined) {
    styles.position = props.position;
  }

  // Padding
  if (props.p !== undefined) {
    styles.padding = spacingToRem(props.p);
  }
  if (props.pt !== undefined) {
    styles.paddingTop = spacingToRem(props.pt);
  }
  if (props.pb !== undefined) {
    styles.paddingBottom = spacingToRem(props.pb);
  }
  if (props.pl !== undefined) {
    styles.paddingLeft = spacingToRem(props.pl);
  }
  if (props.pr !== undefined) {
    styles.paddingRight = spacingToRem(props.pr);
  }
  if (props.px !== undefined) {
    if (props.pl === undefined) styles.paddingLeft = spacingToRem(props.px);
    if (props.pr === undefined) styles.paddingRight = spacingToRem(props.px);
  }
  if (props.py !== undefined) {
    if (props.pt === undefined) styles.paddingTop = spacingToRem(props.py);
    if (props.pb === undefined) styles.paddingBottom = spacingToRem(props.py);
  }

  // Margin
  if (props.m !== undefined) {
    styles.margin = spacingToRem(props.m);
  }
  if (props.mt !== undefined) {
    styles.marginTop = spacingToRem(props.mt);
  }
  if (props.mb !== undefined) {
    styles.marginBottom = spacingToRem(props.mb);
  }
  if (props.ml !== undefined) {
    styles.marginLeft = spacingToRem(props.ml);
  }
  if (props.mr !== undefined) {
    styles.marginRight = spacingToRem(props.mr);
  }
  if (props.mx !== undefined) {
    if (props.ml === undefined) styles.marginLeft = spacingToRem(props.mx);
    if (props.mr === undefined) styles.marginRight = spacingToRem(props.mx);
  }
  if (props.my !== undefined) {
    if (props.mt === undefined) styles.marginTop = spacingToRem(props.my);
    if (props.mb === undefined) styles.marginBottom = spacingToRem(props.my);
  }

  return styles;
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
