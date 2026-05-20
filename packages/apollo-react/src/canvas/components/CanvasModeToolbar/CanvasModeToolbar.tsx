import { memo } from 'react';
import type { ReactNode } from 'react';
import { Row, cn } from '@uipath/apollo-wind';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CANVAS_MODE_TOOLBAR_HEIGHT = 48;

export const TOOLBAR_ICON_BUTTON_CLASS =
  'text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-5 [&_svg]:transition-all hover:[&_svg]:size-6 disabled:hover:[&_svg]:size-5';

// ---------------------------------------------------------------------------
// CountBadge
// ---------------------------------------------------------------------------

export const CountBadge = memo(function CountBadge({
  count,
  variant = 'default',
}: {
  count: number;
  variant?: 'default' | 'destructive';
}) {
  if (count <= 0) return null;
  return (
    <span
      className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 text-[10px] font-medium rounded-full flex items-center justify-center ${
        variant === 'destructive'
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {count}
    </span>
  );
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CanvasModeToolbarProps {
  children?: ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CanvasModeToolbar = memo(function CanvasModeToolbar({
  children,
  className,
}: CanvasModeToolbarProps) {
  return (
    <Row
      data-testid="canvas-toolbar"
      className={cn(
        'gap-2 items-center rounded-2xl border border-border-subtle bg-surface-raised text-foreground px-2.5 backdrop-blur-sm shadow-lg',
        className
      )}
      style={{ height: CANVAS_MODE_TOOLBAR_HEIGHT }}
    >
      {children}
    </Row>
  );
});
