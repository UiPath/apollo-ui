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
  return <div className="h-8 w-px bg-surface-overlay" />;
}

// ============================================================================
// Internal: icon button
// ============================================================================

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="group flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground"
      onClick={onClick}
      aria-label={label}
    >
      <Icon className="h-5 w-5 group-hover:h-6 group-hover:w-6" />
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
        'flex h-[60px] items-center gap-2 rounded-[24px] border border-surface-overlay bg-surface-raised px-2.5',
        className
      )}
    >
      {/* Build / Evaluate toggle */}
      <div className="flex h-10 items-center gap-1 rounded-xl border border-surface-overlay p-1">
        {/* Build */}
        <button
          type="button"
          className={cn(
            'flex h-8 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium leading-5',
            activeMode === 'build'
              ? 'border border-surface-hover bg-foreground-inverse text-foreground shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)] hover:border-transparent hover:bg-surface-hover hover:shadow-none'
              : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
          )}
          onClick={() => onModeChange?.('build')}
        >
          <Workflow
            className={cn(
              'h-5 w-5',
              activeMode === 'build' ? 'text-foreground-accent' : ''
            )}
          />
          <span>Build</span>
        </button>
        {/* Evaluate */}
        <button
          type="button"
          className={cn(
            'flex h-8 items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium leading-5',
            activeMode === 'evaluate'
              ? 'border border-surface-hover bg-foreground-inverse text-foreground shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)] hover:border-transparent hover:bg-surface-hover hover:shadow-none'
              : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
          )}
          onClick={() => onModeChange?.('evaluate')}
        >
          <ListChecks
            className={cn(
              'h-5 w-5',
              activeMode === 'evaluate' ? 'text-foreground-accent' : ''
            )}
          />
          <span>Evaluate</span>
        </button>
      </div>

      <ToolbarSeparator />

      <ToolbarButton icon={Undo2} label="Undo" />
      <ToolbarButton icon={Redo2} label="Redo" />

      <ToolbarSeparator />

      <ToolbarButton icon={Play} label="Run" />

      <ToolbarSeparator />

      <ToolbarButton icon={Plus} label="Add node" />
      <ToolbarButton icon={StickyNote} label="Add note" />
    </div>
  );
}
