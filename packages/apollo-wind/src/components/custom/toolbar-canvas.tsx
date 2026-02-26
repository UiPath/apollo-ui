import * as React from 'react';
import {
  Workflow,
  ListChecks,
  Undo2,
  Redo2,
  Play,
  Plus,
  StickyNote,
} from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface CanvasToolbarProps {
  className?: string;
  /** Active mode: 'build' | 'evaluate' */
  activeMode?: 'build' | 'evaluate';
  /** Callback when mode changes */
  onModeChange?: (mode: 'build' | 'evaluate') => void;
}

// ============================================================================
// Internal: separator
// ============================================================================

function ToolbarSeparator() {
  return <div className="h-8 w-px bg-border-subtle" />;
}

// ============================================================================
// Internal: icon button
// ============================================================================

function ToolbarButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:text-foreground"
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

// ============================================================================
// CanvasToolbar
// ============================================================================

/**
 * Bottom-center toolbar for the Flow canvas.
 *
 * Contains a Build/Evaluate toggle, undo/redo, play, add, and sticky note
 * buttons. Anchored to bottom-center via absolute positioning in the
 * parent layout.
 */
export function FlowCanvasToolbar({
  className,
  activeMode = 'build',
  onModeChange,
}: CanvasToolbarProps) {
  return (
    <div
      className={cn(
        'flex h-[60px] items-center gap-2 rounded-3xl border border-border bg-surface-raised px-2.5',
        className
      )}
    >
      {/* Build / Evaluate toggle */}
      <div className="flex h-10 items-center rounded-xl border border-border-deep bg-surface-overlay p-1">
        {/* Build */}
        <button
          className={cn(
            'flex h-8 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium leading-5 transition-colors',
            activeMode === 'build'
              ? 'border border-border bg-surface text-foreground'
              : 'text-foreground-subtle hover:text-foreground-hover'
          )}
          onClick={() => onModeChange?.('build')}
        >
          <Workflow className="h-5 w-5" />
          <span>Build</span>
        </button>
        {/* Evaluate */}
        <button
          className={cn(
            'flex h-8 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium leading-5 transition-colors',
            activeMode === 'evaluate'
              ? 'border border-border bg-surface text-foreground'
              : 'text-foreground-subtle hover:text-foreground-hover'
          )}
          onClick={() => onModeChange?.('evaluate')}
        >
          <ListChecks className="h-5 w-5" />
          <span>Evaluate</span>
        </button>
      </div>

      <ToolbarSeparator />

      <ToolbarButton icon={<Undo2 className="h-5 w-5" />} label="Undo" />
      <ToolbarButton icon={<Redo2 className="h-5 w-5" />} label="Redo" />

      <ToolbarSeparator />

      <ToolbarButton icon={<Play className="h-5 w-5" />} label="Run" />

      <ToolbarSeparator />

      <ToolbarButton icon={<Plus className="h-5 w-5" />} label="Add node" />
      <ToolbarButton icon={<StickyNote className="h-5 w-5" />} label="Add note" />
    </div>
  );
}
