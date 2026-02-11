import * as React from 'react';
import { Bot, ChevronDown } from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface FlowNodeProps {
  className?: string;
  /** Node title */
  title?: string;
  /** Icon to display in the node header */
  icon?: React.ReactNode;
  /** Node content (rendered below the header) */
  children?: React.ReactNode;
  /** Whether the node is selected */
  selected?: boolean;
}

// ============================================================================
// FlowNode
// ============================================================================

/**
 * A canvas node card for the Flow template.
 *
 * Displays a dark card with a header (icon + title + chevron) and a
 * content area. Default size is 360×360px but can be overridden via
 * className.
 */
export function FlowNode({
  className,
  title = 'Node title',
  icon,
  children,
  selected = false,
}: FlowNodeProps) {
  return (
    <div
      className={cn(
        'flex h-[360px] w-[360px] flex-col overflow-hidden rounded-2xl bg-future-surface-overlay px-4 pb-4 pt-2.5',
        selected && 'ring-1 ring-future-ring',
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-[15px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-future-surface">
              {icon ?? <Bot className="h-5 w-5 text-future-foreground-muted" />}
            </div>
            <span className="text-sm font-medium text-future-foreground">{title}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-future-foreground-muted" />
        </div>

        {/* Content area */}
        <div className="flex-1 rounded-lg bg-future-surface-raised">
          {children}
        </div>
      </div>
    </div>
  );
}
