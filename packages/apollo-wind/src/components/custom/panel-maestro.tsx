import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface PanelProps {
  /** Determines border side, arrow direction, and arrow position */
  side: 'left' | 'right';
  /** Panel content — only rendered when expanded */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Controlled collapsed state */
  isCollapsed?: boolean;
  /** Callback when the toggle button is clicked */
  onToggle?: () => void;
}

// ============================================================================
// Panel
// ============================================================================

/**
 * Collapsible panel for the Maestro template (controlled).
 *
 * Dimensions:
 * - **Expanded**: 300px wide
 * - **Collapsed**: 32px wide
 * - **Height**: fills parent (`h-full`)
 *
 * The expand/collapse toggle button is a 28×28px circle that straddles
 * the panel border — half inside the panel, half outside — positioned
 * 28px from the top.
 *
 * Content is only rendered when expanded. Transition is 300ms.
 *
 * State is managed by the parent — pass `isCollapsed` and `onToggle`.
 */
export function Panel({
  side,
  children,
  className,
  isCollapsed = false,
  onToggle,
}: PanelProps) {
  const isExpanded = !isCollapsed;
  const isLeft = side === 'left';

  return (
    <div
      className={cn(
        'relative flex h-full shrink-0 flex-col bg-future-surface transition-all duration-300',
        isLeft
          ? 'border-r border-future-border-subtle'
          : 'border-l border-future-border-subtle',
        isExpanded ? 'w-[300px]' : 'w-8',
        className
      )}
    >
      {/* Expand/collapse toggle button */}
      <button
        className="absolute z-10 flex h-7 w-7 items-center justify-center rounded-full border border-future-border bg-future-surface text-future-foreground-muted transition-colors hover:bg-future-surface-hover hover:text-future-foreground"
        style={{
          top: 28,
          ...(isLeft
            ? { right: 0, transform: 'translateX(50%)' }
            : { left: 0, transform: 'translateX(-50%)' }),
        }}
        onClick={onToggle}
        aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
      >
        {isLeft ? (
          isExpanded ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )
        ) : isExpanded ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Panel content — only rendered when expanded */}
      {isExpanded && children}
    </div>
  );
}
