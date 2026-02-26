import * as React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface ViewToolbarProps {
  className?: string;
  /** Active node size: 's' | 'm' | 'l' */
  activeNodeSize?: 's' | 'm' | 'l';
  /** Callback for zoom/view actions */
  onAction?: (action: string) => void;
}

// ============================================================================
// Internal: icon button
// ============================================================================

function ViewButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:text-foreground',
        isActive && 'rounded-2xl border border-border bg-surface text-foreground'
      )}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

// ============================================================================
// Node size labels
// ============================================================================

function NodeSizeIcon({ size, isActive }: { size: 's' | 'm' | 'l'; isActive?: boolean }) {
  const label = { s: 'S', m: 'M', l: 'L' }[size];
  return (
    <button
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-2xl text-xs font-bold text-foreground-muted transition-colors hover:text-foreground',
        isActive && 'border border-border bg-surface text-foreground'
      )}
      aria-label={`Node size ${label}`}
    >
      {label}
    </button>
  );
}

// ============================================================================
// ViewToolbar
// ============================================================================

/**
 * Bottom-right view controls for the Flow canvas.
 *
 * Contains zoom in/out, fit-to-screen, grid toggle, and node size selector.
 * Anchored to bottom-right via absolute positioning in the parent layout.
 */
export function FlowViewToolbar({
  className,
  activeNodeSize = 's',
  onAction,
}: ViewToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Zoom + view controls */}
      <div className="flex w-10 flex-col items-center gap-1 rounded-xl bg-surface-raised p-1">
        <ViewButton
          icon={<ZoomIn className="h-5 w-5" />}
          label="Zoom in"
          onClick={() => onAction?.('zoom-in')}
        />
        <ViewButton
          icon={<ZoomOut className="h-5 w-5" />}
          label="Zoom out"
          onClick={() => onAction?.('zoom-out')}
        />
        <div className="h-px w-6 bg-border-subtle" />
        <ViewButton
          icon={<Maximize2 className="h-5 w-5" />}
          label="Fit to screen"
          onClick={() => onAction?.('fit')}
        />
        <ViewButton
          icon={<LayoutGrid className="h-5 w-5" />}
          label="Toggle grid"
          onClick={() => onAction?.('grid')}
        />
      </div>

      {/* Node size selector */}
      <div className="flex w-10 flex-col items-center gap-2 rounded-[20px] border border-border-deep bg-surface-raised p-1">
        <NodeSizeIcon size="s" isActive={activeNodeSize === 's'} />
        <NodeSizeIcon size="m" isActive={activeNodeSize === 'm'} />
        <NodeSizeIcon size="l" isActive={activeNodeSize === 'l'} />
      </div>
    </div>
  );
}
