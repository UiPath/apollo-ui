import { cn } from '@uipath/apollo-wind';
import type { ReactNode } from 'react';
import { CanvasTooltip } from '../CanvasTooltip';

export interface PanelTitleBarProps {
  /** Small icon rendered before the title (sized by the caller, ~13px works well). */
  icon?: ReactNode;
  /** Display title. */
  title: string;
  /** Technical identifier (e.g. a node id), rendered in monospace next to the title. */
  badge?: string;
  /** Right-aligned slot (e.g. a `NodeOutputModeSelect`). */
  trailing?: ReactNode;
  className?: string;
}

/** Compact one-line panel title row: icon, title, monospace badge, and a trailing slot. */
export function PanelTitleBar({ icon, title, badge, trailing, className }: PanelTitleBarProps) {
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <div className="flex min-w-16 flex-1 items-center gap-2">
        {icon && <span className="shrink-0 text-foreground-subtle [&>svg]:size-3.25">{icon}</span>}
        <CanvasTooltip smartTooltip delay content={title}>
          <span className="min-w-2 truncate text-xs font-medium text-foreground">{title}</span>
        </CanvasTooltip>
        {badge && (
          <CanvasTooltip smartTooltip delay content={badge}>
            <span className="min-w-2 shrink-8 truncate font-mono text-[10px] text-foreground-muted">
              {badge}
            </span>
          </CanvasTooltip>
        )}
      </div>
      {trailing && <div className="flex min-w-12 items-center justify-end">{trailing}</div>}
    </div>
  );
}
