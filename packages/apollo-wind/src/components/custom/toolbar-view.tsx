import * as React from 'react';
import { ZoomIn, ZoomOut, Maximize2, LayoutGrid, GitCommitHorizontal } from 'lucide-react';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface ViewToolbarProps {
  className?: string;
  /** Active node size: 's' | 'm' | 'l' */
  activeNodeSize?: 's' | 'm' | 'l';
  /** Callback when node size changes */
  onNodeSizeChange?: (size: 's' | 'm' | 'l') => void;
  /** Callback for zoom/view actions */
  onAction?: (action: string) => void;
}

// ============================================================================
// Internal: icon button
// ============================================================================

function ViewButton({
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
      <div className="h-5 w-5 transition-transform group-hover:scale-[1.2]">
        <Icon className="h-full w-full" />
      </div>
    </button>
  );
}

// ============================================================================
// Node size icons (SVG)
// ============================================================================

function NodeSIcon() {
  return <GitCommitHorizontal className="h-5 w-5" />;
}

function NodeMIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      {/* Medium card: plain rounded rectangle */}
      <rect x="3" y="5" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function NodeLIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      {/* Large card: rounded rectangle with header divider */}
      <rect x="3" y="4" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 8.5h14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

const nodeSizeIcons = { s: NodeSIcon, m: NodeMIcon, l: NodeLIcon } as const;
const nodeSizeLabels = { s: 'Small nodes', m: 'Medium nodes', l: 'Large nodes' } as const;

// ============================================================================
// Node size button
// ============================================================================

function NodeSizeButton({
  size,
  isActive,
  onClick,
}: {
  size: 's' | 'm' | 'l';
  isActive?: boolean;
  onClick?: () => void;
}) {
  const Icon = nodeSizeIcons[size];
  return (
    <button
      type="button"
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-2xl',
        isActive
          ? 'border border-surface-hover bg-surface text-foreground-accent shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)] hover:border-transparent hover:bg-surface-hover hover:text-foreground hover:shadow-none'
          : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
      )}
      onClick={onClick}
      aria-label={nodeSizeLabels[size]}
    >
      <Icon />
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
  onNodeSizeChange,
  onAction,
}: ViewToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Zoom + view controls */}
      <div className="flex w-10 flex-col items-center gap-1 rounded-xl border border-border-subtle bg-surface-raised p-1">
        <ViewButton icon={ZoomIn} label="Zoom in" onClick={() => onAction?.('zoom-in')} />
        <ViewButton icon={ZoomOut} label="Zoom out" onClick={() => onAction?.('zoom-out')} />
        <div className="h-px w-6 bg-surface-overlay" />
        <ViewButton icon={Maximize2} label="Fit to screen" onClick={() => onAction?.('fit')} />
        <ViewButton icon={LayoutGrid} label="Toggle grid" onClick={() => onAction?.('grid')} />
      </div>

      {/* Node size selector */}
      <div className="flex w-10 flex-col items-center gap-2 rounded-[20px] border border-border-subtle bg-surface-raised p-1">
        <NodeSizeButton
          size="s"
          isActive={activeNodeSize === 's'}
          onClick={() => onNodeSizeChange?.('s')}
        />
        <NodeSizeButton
          size="m"
          isActive={activeNodeSize === 'm'}
          onClick={() => onNodeSizeChange?.('m')}
        />
        <NodeSizeButton
          size="l"
          isActive={activeNodeSize === 'l'}
          onClick={() => onNodeSizeChange?.('l')}
        />
      </div>
    </div>
  );
}
