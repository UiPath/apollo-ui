import * as React from 'react';
import { cn } from '@/lib';

// ============================================================================
// Hook: useViewportBelow
// ============================================================================

function useViewportBelow(minWidthPx: number): boolean {
  const [isBelow, setIsBelow] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${minWidthPx - 1}px)`);
    const handler = () => setIsBelow(mql.matches);
    handler(); // initial
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [minWidthPx]);

  return isBelow;
}

/**
 * Returns true when viewport width is >= minWidthPx (e.g. for "expanded above 1024").
 */
export function useViewportAtOrAbove(minWidthPx: number): boolean {
  const [isAtOrAbove, setIsAtOrAbove] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${minWidthPx}px)`);
    const handler = () => setIsAtOrAbove(mql.matches);
    handler(); // initial
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [minWidthPx]);

  return isAtOrAbove;
}

// ============================================================================
// Types
// ============================================================================

export interface ViewportGuardProps {
  /** Minimum viewport width (px) at which content is shown. Below this, the overlay is shown. Default 769 (so 768px and below get the overlay). */
  minWidth?: number;
  /** Overlay message. Default explains the view is not available at this screen size. */
  message?: string;
  /** Optional class for the overlay container. */
  className?: string;
  /** Content to guard; hidden behind the overlay when viewport is too narrow. */
  children?: React.ReactNode;
}

const DEFAULT_MESSAGE =
  'This view is not available at this screen size. Please use a larger viewport.';

// ============================================================================
// ViewportGuard
// ============================================================================

/**
 * Renders children when viewport is at or above `minWidth`, and a full-screen
 * blurred overlay with a message when viewport is below that width.
 *
 * Use for templates or layouts that are not designed for small screens
 * (e.g. Delegate templates at 540px / 768px).
 */
export function ViewportGuard({
  minWidth = 769,
  message = DEFAULT_MESSAGE,
  className,
  children,
}: ViewportGuardProps) {
  const isBelow = useViewportBelow(minWidth);

  if (!isBelow) {
    return <>{children}</>;
  }

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}>
      <div className="absolute inset-0 bg-surface backdrop-blur-xl" aria-hidden="true" />
      <div
        className="relative mx-4 max-w-sm rounded-2xl border border-border bg-surface-raised px-6 py-5 text-center shadow-xl"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium leading-5 text-foreground">{message}</p>
      </div>
    </div>
  );
}
