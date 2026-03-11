import * as React from 'react';
import { Bot } from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface FlowNodeProps {
  className?: string;
  /** Node title */
  title?: string;
  /** Node subtitle */
  subtitle?: string;
  /** Icon rendered inside the inner shape */
  icon?: React.ReactNode;
  /** Whether the node is in selected state */
  selected?: boolean;
  /**
   * Force a specific visual state — used for Storybook stories and snapshots.
   * In normal use, hover is driven by CSS group-hover.
   */
  forceState?: 'default' | 'hover' | 'selected' | 'selected-hover';
  onClick?: () => void;
}

// ============================================================================
// FlowNode
// ============================================================================

/**
 * Icon-centric canvas node for the Flow template.
 *
 * 96×96 outer ring → 80×80 inner rounded shape → 40×40 icon.
 * Title + subtitle centered below.
 */
export function FlowNode({
  className,
  title = 'Node title',
  subtitle = 'Secondary title',
  icon,
  selected = false,
  forceState,
  onClick,
}: FlowNodeProps) {
  const isSelected = selected || forceState === 'selected' || forceState === 'selected-hover';
  const isHover = forceState === 'hover';
  const isSelectedHover = forceState === 'selected-hover';

  return (
    <button
      type="button"
      className={cn('group flex w-[107px] flex-col items-center gap-2.5', className)}
      onClick={onClick}
    >
      {/* ── Outer ring ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-[32px] size-24 bg-surface-overlay',
          // Default
          !isSelected && !isHover && 'border-[1.6px] border-border',
          // CSS hover (no forceState)
          !isSelected && !forceState && 'group-hover:border-2 group-hover:border-border-hover',
          // Forced hover
          isHover && 'border-2 border-border-hover',
          // Selected
          isSelected && !isSelectedHover && 'border-2 border-brand',
          // Selected hover
          isSelectedHover && 'border-2 border-foreground-accent-muted',
          // CSS selected hover (no forceState)
          !forceState && isSelected && 'group-hover:border-foreground-accent-muted',
        )}
      >
        {/* Inner shape */}
        <div className="flex items-center justify-center overflow-hidden rounded-[24px] bg-surface size-20">
          {icon ?? <Bot className="h-10 w-10 text-foreground-muted" strokeWidth={1.4} />}
        </div>
      </div>

      {/* ── Labels ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center">
        <span className="text-center text-[14px] font-semibold leading-[18px] text-foreground">
          {title}
        </span>
        <span className="text-center text-[12px] leading-[18px] text-foreground-muted">
          {subtitle}
        </span>
      </div>
    </button>
  );
}
