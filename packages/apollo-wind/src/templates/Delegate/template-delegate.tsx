import * as React from 'react';
import { Canvas } from '@/components/custom/canvas';
import type { DelegatePanelProps, NavChildItem, NavItem } from '@/components/custom/panel-delegate';
import { DelegatePanel } from '@/components/custom/panel-delegate';
import { useViewportAtOrAbove, ViewportGuard } from '@/components/custom/viewport-guard';
import type { FutureTheme } from '@/foundation/Future/types';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

/** Viewport width (px) at or above which the left panel is expanded. Below this, panel is collapsed. */
const PANEL_EXPAND_BREAKPOINT = 1025;

// Re-export shared types so consumers can import from a single module
export type { NavItem, NavChildItem, DelegatePanelProps };

// ============================================================================
// Types
// ============================================================================

export interface DelegateTemplateProps {
  className?: string;
  /** Color theme for the template */
  theme?: FutureTheme;
  /** Whether the left panel starts expanded */
  defaultPanelOpen?: boolean;
  /** Navigation items in the left panel */
  navItems?: NavItem[];
  /** ID of the currently selected nav child */
  selectedChildId?: string;
  /** Callback when a nav child is selected */
  onChildSelect?: (childId: string) => void;
  /** Main content to render in the Canvas */
  children?: React.ReactNode;
}

// ============================================================================
// DelegateTemplate
// ============================================================================

/**
 * Full-page Delegate template composed of a DelegatePanel and Canvas.
 *
 * This is a convenience wrapper — for more control you can use
 * `DelegatePanel` and `Canvas` directly.
 */
export function DelegateTemplate({
  className,
  theme = 'dark',
  defaultPanelOpen = true,
  navItems = [],
  selectedChildId,
  onChildSelect,
  children,
}: DelegateTemplateProps) {
  const isLargeViewport = useViewportAtOrAbove(PANEL_EXPAND_BREAKPOINT);
  const [panelOpen, setPanelOpen] = React.useState(defaultPanelOpen);

  // Sync panel state when viewport crosses the breakpoint
  React.useEffect(() => {
    setPanelOpen(isLargeViewport);
  }, [isLargeViewport]);

  const layout = (
    <div
      className={cn(
        theme === 'core-dark'
          ? 'core-dark'
          : theme === 'core-light'
            ? 'core-light'
            : theme === 'wireframe'
              ? 'wireframe'
              : theme === 'vertex'
                ? 'vertex'
                : theme === 'canvas'
                  ? 'canvas'
                  : theme === 'light'
                    ? 'future-light'
                    : 'future-dark',
        'flex h-screen bg-surface',
        className
      )}
      style={{ fontFamily: fontFamily.base }}
    >
      <DelegatePanel
        open={panelOpen}
        onOpenChange={setPanelOpen}
        navItems={navItems}
        selectedChildId={selectedChildId}
        onChildSelect={onChildSelect}
      />
      <Canvas>{children}</Canvas>
    </div>
  );

  return (
    <ViewportGuard
      minWidth={769}
      message="This view is not available at this screen size. Please use a larger viewport."
    >
      {layout}
    </ViewportGuard>
  );
}
