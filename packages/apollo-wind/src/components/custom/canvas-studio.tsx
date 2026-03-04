import * as React from 'react';
import { cn } from '@/lib';

// ============================================================================
// Shared lookup tables
// ============================================================================

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

type PaddingSize = keyof typeof paddingClasses;

// ============================================================================
// StudioCanvas
// ============================================================================

export interface StudioCanvasProps {
  children?: React.ReactNode;
  className?: string;
  /**
   * Outer padding applied to the scrollable area.
   * @default 'md' (1.5rem / 24px)
   */
  padding?: PaddingSize;
  /**
   * Background of the canvas workspace.
   * - `'raised'` — slightly elevated surface (default, differentiates from panels)
   * - `'surface'` — base surface color
   * - `'transparent'` — no background
   */
  background?: 'raised' | 'surface' | 'transparent';
  /**
   * When true, content fills the full canvas width instead of being
   * centered in a 760px column. Use for data-dense layouts like tables.
   */
  fullWidth?: boolean;
}

const canvasBackgroundClasses = {
  raised: 'bg-surface-raised',
  surface: 'bg-surface',
  transparent: 'bg-transparent',
} as const;

/**
 * Center canvas for the Studio template.
 *
 * - Fills remaining horizontal space between panels (`flex-1 relative`)
 * - Scrolls independently via `absolute inset-0 overflow-y-auto`
 * - Centers content in a `w-[760px] max-w-full` column
 * - `data-canvas` attribute allows `StudioGridItem` canvasResponsive tracking
 *
 * Usage:
 * ```tsx
 * <StudioCanvas>
 *   <StudioGrid>
 *     <StudioGridItem>...</StudioGridItem>
 *   </StudioGrid>
 * </StudioCanvas>
 * ```
 */
export function StudioCanvas({
  children,
  className,
  padding = 'md',
  background = 'raised',
  fullWidth = false,
}: StudioCanvasProps) {
  return (
    <div
      className={cn('relative flex-1', canvasBackgroundClasses[background], className)}
      data-canvas
    >
      <div className={cn('absolute inset-0 overflow-y-auto', paddingClasses[padding])}>
        {fullWidth ? (
          children
        ) : (
          <div className="flex justify-center">
            <div className="w-[760px] max-w-full">{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// StudioGrid
// ============================================================================

export interface StudioGridProps {
  children: React.ReactNode;
  /** Number of columns in the grid. Default 12. */
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  /** Gap between grid cells. Default 'md'. */
  gap?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const gridColsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
} as const;

const gridGapClasses = {
  none: '',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
} as const;

/**
 * Grid wrapper for use inside `StudioCanvas`.
 *
 * Defaults to a 12-column grid with md gap. Pair with `StudioGridItem`.
 */
export function StudioGrid({ children, cols = 12, gap = 'md', className }: StudioGridProps) {
  return (
    <div className={cn('grid', gridColsClasses[cols], gridGapClasses[gap], className)}>
      {children}
    </div>
  );
}

// ============================================================================
// StudioGridItem
// ============================================================================

export interface StudioGridItemProps {
  children: React.ReactNode;
  /**
   * Column span within the parent `StudioGrid`.
   * Ignored if `className` already contains a `col-span-*` class,
   * or if `canvasResponsive` is true (canvas width drives the span).
   * @default 12
   */
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  className?: string;
  /**
   * Background of the grid item card.
   * - `'surface'` — base surface color (default, card-like)
   * - `'raised'` — elevated surface
   * - `'transparent'` — no background
   */
  background?: 'surface' | 'raised' | 'transparent';
  /** Padding inside the card. Default 'md'. */
  padding?: PaddingSize;
  /** Render a border and rounded corners around the card. Default true. */
  border?: boolean;
  /**
   * When true, the item measures the nearest `[data-canvas]` ancestor width
   * and overrides `cols` with a responsive span:
   * - < 768px  → col-span-12 (full width)
   * - < 1024px → col-span-6  (half width)
   * - ≥ 1024px → col-span-3  (quarter width)
   */
  canvasResponsive?: boolean;
}

const itemColSpanClasses = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  6: 'col-span-6',
  12: 'col-span-12',
} as const;

const itemBackgroundClasses = {
  surface: 'bg-surface',
  raised: 'bg-surface-raised',
  transparent: 'bg-transparent',
} as const;

/**
 * Grid cell for use inside `StudioGrid`.
 *
 * Renders a card-like container with configurable background, padding, and border.
 * Set `canvasResponsive` to automatically resize based on the canvas width.
 */
export function StudioGridItem({
  children,
  cols = 12,
  className,
  background = 'surface',
  padding = 'md',
  border = true,
  canvasResponsive = false,
}: StudioGridItemProps) {
  const [canvasWidth, setCanvasWidth] = React.useState(0);
  const itemRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!canvasResponsive) return;

    const update = () => {
      const canvas = itemRef.current?.closest('[data-canvas]') as HTMLElement | null;
      if (canvas) setCanvasWidth(canvas.offsetWidth);
    };

    update();
    window.addEventListener('resize', update);

    const ro = new ResizeObserver(update);
    const canvas = itemRef.current?.closest('[data-canvas]') as HTMLElement | null;
    if (canvas) ro.observe(canvas);

    return () => {
      window.removeEventListener('resize', update);
      ro.disconnect();
    };
  }, [canvasResponsive]);

  const responsiveColClass = canvasResponsive
    ? canvasWidth < 768
      ? 'col-span-12'
      : canvasWidth < 1024
        ? 'col-span-6'
        : 'col-span-3'
    : itemColSpanClasses[cols];

  const hasExplicitColSpan = className?.includes('col-span-');

  return (
    <div
      ref={itemRef}
      className={cn(
        !hasExplicitColSpan && responsiveColClass,
        itemBackgroundClasses[background],
        paddingClasses[padding],
        border && 'rounded-lg border border-border-subtle',
        className
      )}
    >
      {children}
    </div>
  );
}
