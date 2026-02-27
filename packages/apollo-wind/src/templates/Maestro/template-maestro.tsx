import * as React from 'react';
import type { MaestroHeaderProps } from '@/components/custom/global-header';
import { MaestroHeader } from '@/components/custom/global-header';
import { Canvas, Grid, GridItem } from '@/components/custom/grid-maestro';
import type { MaestroPanelProps } from '@/components/custom/panel-maestro';
import { MaestroPanel } from '@/components/custom/panel-maestro';
import { ViewportGuard } from '@/components/custom/viewport-guard';
import type { FutureTheme } from '@/foundation/Future/types';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

// Re-export types and components for convenience
export type { MaestroHeaderProps, MaestroPanelProps };
export { Canvas, Grid, GridItem };

// ============================================================================
// Constants
// ============================================================================

/** Container width at which panels auto-collapse (Tailwind `lg` equivalent) */
const AUTO_COLLAPSE_BREAKPOINT = 1024;

// ============================================================================
// Types
// ============================================================================

export interface MaestroTemplateProps {
  className?: string;
  /** Color theme for the template */
  theme?: FutureTheme;
  /** Application title shown in the header */
  title?: string;
  /** Tenant name shown in the header */
  tenantName?: string;
  /**
   * Force the left panel to start collapsed on desktop.
   * Below 1024px container width, panels auto-collapse regardless of this value.
   */
  defaultLeftPanelCollapsed?: boolean;
  /** Content for the left panel (e.g. navigation). The panel itself has no padding — children control their own. */
  leftPanelContent?: React.ReactNode;
  /** Content for the global header's slide-out menu. Falls back to leftPanelContent if not provided. */
  menuContent?: React.ReactNode;
  /**
   * Force the right panel to start collapsed on desktop.
   * Below 1024px container width, panels auto-collapse regardless of this value.
   */
  defaultRightPanelCollapsed?: boolean;
  /** Content for the right panel. The panel itself has no padding — children control their own (typically p-6). */
  rightPanelContent?: React.ReactNode;
  /** Main content to render in the center canvas area */
  children?: React.ReactNode;
}

// ============================================================================
// MaestroTemplate
// ============================================================================

/**
 * Full-page Maestro template.
 *
 * Composed of:
 * - **MaestroHeader** — global header with logo, actions, tenant selector, avatar
 * - **MaestroPanel side="left"** — collapsible left panel (300px expanded / 32px collapsed)
 * - **Canvas** — scrollable main area with ResizeObserver-based grid reflow
 * - **MaestroPanel side="right"** — collapsible right panel (300px expanded / 32px collapsed)
 *
 * ### Responsive auto-collapse
 *
 * A ResizeObserver watches the template body container. When the container
 * width drops below 1024px, both panels automatically collapse to 32px.
 * When it reaches 1024px+, they restore to their user-controlled state.
 * The panel never disappears entirely — it always shows at minimum its
 * 32px collapsed state with the toggle button visible.
 */
export function MaestroTemplate({
  className,
  theme = 'dark',
  title = 'Maestro',
  tenantName = 'Select',
  defaultLeftPanelCollapsed = false,
  leftPanelContent,
  menuContent,
  defaultRightPanelCollapsed = false,
  rightPanelContent,
  children,
}: MaestroTemplateProps) {
  const bodyRef = React.useRef<HTMLDivElement>(null);

  // User-controlled panel state (toggled via the chevron button)
  const [leftCollapsed, setLeftCollapsed] = React.useState(defaultLeftPanelCollapsed);
  const [rightCollapsed, setRightCollapsed] = React.useState(defaultRightPanelCollapsed);

  // Whether the container is below the auto-collapse breakpoint
  const [narrow, setNarrow] = React.useState(false);

  // Watch the body container width for responsive auto-collapse
  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        setNarrow(w > 0 && w < AUTO_COLLAPSE_BREAKPOINT);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // When narrow, force both panels collapsed. Otherwise use user state.
  const leftIsCollapsed = narrow || leftCollapsed;
  const rightIsCollapsed = narrow || rightCollapsed;

  return (
    <ViewportGuard
      minWidth={769}
      message="This view is not available at this screen size. Please use a larger viewport."
    >
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
          'flex h-screen flex-col bg-surface text-foreground',
          className
        )}
        style={{ fontFamily: fontFamily.base }}
      >
        {/* Global header — menuContent enables the slide-out app-launcher menu */}
        <MaestroHeader
          title={title}
          tenantName={tenantName}
          theme={theme}
          menuContent={menuContent ?? leftPanelContent}
        />

        {/* Body: left panel + canvas + right panel */}
        <div ref={bodyRef} className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <MaestroPanel
            side="left"
            isCollapsed={leftIsCollapsed}
            onToggle={() => setLeftCollapsed((prev) => !prev)}
          >
            {leftPanelContent}
          </MaestroPanel>

          {/* Canvas (main content) */}
          <Canvas>{children}</Canvas>

          {/* Right panel */}
          <MaestroPanel
            side="right"
            isCollapsed={rightIsCollapsed}
            onToggle={() => setRightCollapsed((prev) => !prev)}
          >
            {rightPanelContent}
          </MaestroPanel>
        </div>
      </div>
    </ViewportGuard>
  );
}
