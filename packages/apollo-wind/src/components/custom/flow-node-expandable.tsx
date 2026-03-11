import * as React from 'react';
import { Workflow, ChevronDown } from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface FlowNodeExpandableProps {
  className?: string;
  /** Node title */
  title?: string;
  /** Icon rendered in the node header */
  icon?: React.ReactNode;
  /** Whether the node is expanded */
  expanded?: boolean;
  /** Whether the node is selected */
  selected?: boolean;
  /**
   * Force a specific visual state — used for Storybook stories and snapshots.
   * In normal use, hover is driven by CSS group-hover.
   */
  forceState?: 'default' | 'hover' | 'selected' | 'selected-hover';
  /** Callback when expand/collapse chevron is toggled */
  onToggle?: () => void;
}

// ============================================================================
// FlowNodeExpandable
// ============================================================================

/**
 * Expandable card-style canvas node for the Flow template.
 *
 * Collapsed: 360px wide, header only.
 * Expanded: 360×360px, header + content area.
 * Shares the same 4-state border pattern as FlowNode.
 */
export function FlowNodeExpandable({
  className,
  title = 'Node title',
  icon,
  expanded = false,
  selected = false,
  forceState,
  onToggle,
}: FlowNodeExpandableProps) {
  const isSelected = selected || forceState === 'selected' || forceState === 'selected-hover';
  const isHover = forceState === 'hover';
  const isSelectedHover = forceState === 'selected-hover';

  return (
    <div
      className={cn(
        'group w-[360px] rounded-2xl bg-surface-overlay',
        expanded ? 'flex flex-col size-[360px] px-4 pt-2.5 pb-4 gap-[15px]' : 'p-3',
        // Default
        !isSelected && !isHover && 'border-[1.6px] border-border',
        // CSS hover
        !isSelected && !forceState && 'group-hover:border-2 group-hover:border-border-hover',
        // Forced hover
        isHover && 'border-2 border-border-hover',
        // Selected
        isSelected && !isSelectedHover && 'border-2 border-brand',
        // Selected hover
        isSelectedHover && 'border-2 border-foreground-accent-muted',
        // CSS selected hover
        !forceState && isSelected && 'hover:border-foreground-accent-muted',
        className,
      )}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <div className="flex items-center justify-center rounded-xl bg-surface size-8 shrink-0">
            {icon ?? <Workflow className="h-5 w-5 text-foreground-muted" />}
          </div>
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {title}
          </span>
        </div>
        <button
          type="button"
          className="flex items-center justify-center text-foreground-muted hover:text-foreground"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse node' : 'Expand node'}
        >
          <ChevronDown className={cn('h-4 w-4', expanded && 'rotate-180')} />
        </button>
      </div>

      {/* ── Content area (expanded only) ─────────────────────────────── */}
      {expanded && (
        <div className="flex-1 min-h-0 rounded-lg bg-surface" />
      )}
    </div>
  );
}
