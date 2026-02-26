import { Workflow, TableProperties, Variable } from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface PropertiesBarProps {
  className?: string;
  /** Flow name shown in the bar */
  flowName?: string;
  /** Flow type label (e.g. "Workflow") */
  flowType?: string;
  /** Active tab: 'properties' | 'variables' */
  activeTab?: 'properties' | 'variables';
  /** Callback when tab changes */
  onTabChange?: (tab: 'properties' | 'variables') => void;
  /** Callback when the properties tab is clicked to expand the panel */
  onExpand?: () => void;
}

// ============================================================================
// PropertiesBar (collapsed state)
// ============================================================================

/**
 * Collapsed properties bar for the Flow template.
 *
 * Anchored to the top-right of the canvas. Shows flow name/type on the left
 * and Properties/Variables tab buttons on the right. A future update will
 * introduce the expanded state.
 */
export function PropertiesBar({
  className,
  flowName = 'Invoice processing',
  flowType = 'Workflow',
  activeTab = 'properties',
  onTabChange,
  onExpand,
}: PropertiesBarProps) {
  return (
    <div
      className={cn(
        'flex h-16 items-center justify-between rounded-2xl bg-surface-raised px-4',
        className
      )}
    >
      {/* Left: flow icon + name */}
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-subtle">
          <Workflow className="h-6 w-6 text-brand-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold leading-5 tracking-[-0.4px] text-foreground">
            {flowName}
          </span>
          <span className="text-sm font-normal leading-5 tracking-[-0.35px] text-foreground-subtle">
            {flowType}
          </span>
        </div>
      </div>

      {/* Right: Properties / Variables tabs */}
      <div className="flex h-10 items-center rounded-xl bg-surface-overlay border border-border-deep p-1">
        <button
          className={cn(
            'flex h-8 items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium leading-5 text-foreground-subtle transition-colors hover:text-foreground-hover',
            activeTab === 'properties' && 'text-foreground-subtle'
          )}
          onClick={() => {
            onTabChange?.('properties');
            onExpand?.();
          }}
        >
          <TableProperties className="h-5 w-5" />
          <span>Properties</span>
        </button>
        <button
          className={cn(
            'flex h-7 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium leading-5 text-foreground-subtle transition-colors',
            activeTab === 'variables' && 'text-foreground-subtle'
          )}
          onClick={() => onTabChange?.('variables')}
        >
          <Variable className="h-5 w-5" />
          <span>Variables</span>
        </button>
      </div>
    </div>
  );
}
