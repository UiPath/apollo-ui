import * as React from 'react';
import { StudioCanvas, StudioGrid, StudioGridItem } from '@/components/custom/canvas-studio';
import { MaestroHeader } from '@/components/custom/global-header';
import { StudioPanel, StudioPanelSelection } from '@/components/custom/panel-studio';
import { ViewportGuard } from '@/components/custom/viewport-guard';
import type { FutureTheme } from '@/foundation/Future/types';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

export type { FutureTheme };
export { StudioCanvas, StudioGrid, StudioGridItem, StudioPanel, StudioPanelSelection };

// ============================================================================
// Helpers
// ============================================================================

function resolveThemeClass(theme: FutureTheme) {
  return theme;
}

// ============================================================================
// Constants
// ============================================================================

/** Container width below which the right panel auto-hides */
const RIGHT_PANEL_BREAKPOINT = 1440;

/** Container width below which both panels auto-hide */
const LEFT_PANEL_BREAKPOINT = 1024;

// ============================================================================
// Types
// ============================================================================

export interface StudioTemplateProps {
  className?: string;
  /** Color theme for the template */
  theme?: FutureTheme;
  /** Application title shown in the header */
  title?: string;
  /** Tenant name shown in the header */
  tenantName?: string;
  /** Content for the global header's slide-out menu */
  menuContent?: React.ReactNode;
  /**
   * Start with the left panel hidden.
   * Below 1024px the panel auto-hides regardless; the rail remains visible.
   */
  defaultLeftPanelCollapsed?: boolean;
  /**
   * Single-view content for the left panel.
   * Used when you don't need multiple views — any icon click toggles the panel.
   * Ignored if `leftPanelViews` is also provided.
   */
  leftPanelContent?: React.ReactNode;
  /**
   * Multi-view content for the left panel — up to 5 entries, one per rail icon.
   * Clicking icon N shows `leftPanelViews[N]`. Clicking the active icon again
   * hides the panel.
   * When provided, `leftPanelContent` is ignored.
   */
  leftPanelViews?: React.ReactNode[];
  /**
   * Start with the right panel hidden.
   * Below 1440px the panel auto-hides regardless; the rail remains visible.
   */
  defaultRightPanelCollapsed?: boolean;
  /**
   * Single-view content for the right panel.
   * Ignored if `rightPanelViews` is also provided.
   */
  rightPanelContent?: React.ReactNode;
  /**
   * Multi-view content for the right panel — up to 5 entries, one per rail icon.
   * Clicking icon N shows `rightPanelViews[N]`. Clicking the active icon again
   * hides the panel.
   * When provided, `rightPanelContent` is ignored.
   */
  rightPanelViews?: React.ReactNode[];
  /**
   * Optional header rendered above the scrollable canvas — full canvas width,
   * not inside the padded/centered column. Use `PageHeader` here.
   */
  pageHeader?: React.ReactNode;
  /**
   * Background of the center canvas area.
   * - `'raised'` — slightly elevated surface (default)
   * - `'surface'` — base surface, matches the page header background
   * - `'transparent'` — no background
   */
  canvasBackground?: 'raised' | 'surface' | 'transparent';
  /**
   * When true, canvas content fills the full available width instead of
   * being centered in a 760px column. Use for data-dense layouts like tables.
   */
  canvasFullWidth?: boolean;
  /**
   * When true, the left panel is never auto-collapsed by the responsive
   * breakpoint logic. The user can still close it manually via the rail.
   */
  pinLeftPanel?: boolean;
  /**
   * When true, the right panel is never auto-collapsed by the responsive
   * breakpoint logic. The user can still close it manually via the rail.
   */
  pinRightPanel?: boolean;
  /** Main content rendered in the center canvas area */
  children?: React.ReactNode;
}

// ============================================================================
// StudioTemplate
// ============================================================================

/**
 * Full-page Studio template.
 *
 * Composed of:
 * - **MaestroHeader** — global header with logo, actions, tenant selector, avatar
 * - **StudioPanelSelection** — 40px vertical icon rail (always visible when panel content is provided)
 * - **StudioPanel side="left"** — 300px left panel (shown/hidden via rail toggle)
 * - **main** — flex-1 scrollable center canvas
 * - **StudioPanel side="right"** — 300px right panel (shown/hidden via rail toggle)
 * - **StudioPanelSelection** — 40px vertical icon rail (always visible when panel content is provided)
 *
 * ### Responsive auto-hide
 *
 * A ResizeObserver watches the body container width and auto-collapses panels
 * when the container crosses a breakpoint going narrower. User clicks on the
 * rail always override the auto-hide — there is no permanent viewport-based block:
 * - Crossing below 1024px: both panels collapse
 * - Crossing below 1440px (from above): right panel collapses
 * - Widening back above a breakpoint does NOT auto-restore; user re-opens manually
 */
export function StudioTemplate({
  className,
  theme = 'dark',
  title = 'Studio',
  tenantName = 'Select',
  menuContent,
  defaultLeftPanelCollapsed = false,
  leftPanelContent,
  leftPanelViews,
  defaultRightPanelCollapsed = false,
  rightPanelContent,
  rightPanelViews,
  pageHeader,
  canvasBackground = 'raised',
  canvasFullWidth = false,
  pinLeftPanel = false,
  pinRightPanel = false,
  children,
}: StudioTemplateProps) {
  const bodyRef = React.useRef<HTMLDivElement>(null);

  // Which icon index is active on each side (undefined = panel hidden)
  const [leftIndex, setLeftIndex] = React.useState<number | undefined>(
    defaultLeftPanelCollapsed ? undefined : 0
  );
  const [rightIndex, setRightIndex] = React.useState<number | undefined>(
    defaultRightPanelCollapsed ? undefined : 0
  );

  // Auto-collapse when the container crosses a breakpoint going narrower.
  // Uses event-driven state updates so user clicks always override — there
  // is no permanent hard block based on current viewport width.
  React.useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    let prevW = 0;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
        if (w === 0) continue;

        if (prevW === 0) {
          // Initial measurement — collapse panels that are already narrow
          if (w < LEFT_PANEL_BREAKPOINT) {
            if (!pinLeftPanel) setLeftIndex(undefined);
            if (!pinRightPanel) setRightIndex(undefined);
          } else if (w < RIGHT_PANEL_BREAKPOINT && !pinRightPanel) {
            setRightIndex(undefined);
          }
        } else {
          // Crossing into narrower territory
          if (prevW >= LEFT_PANEL_BREAKPOINT && w < LEFT_PANEL_BREAKPOINT) {
            if (!pinLeftPanel) setLeftIndex(undefined);
            if (!pinRightPanel) setRightIndex(undefined);
          } else if (prevW >= RIGHT_PANEL_BREAKPOINT && w < RIGHT_PANEL_BREAKPOINT && !pinRightPanel) {
            setRightIndex(undefined);
          }
        }

        prevW = w;
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [pinLeftPanel, pinRightPanel]);

  // Smart toggle: clicking the active icon closes the panel; clicking a
  // different icon (or any icon when closed) opens/switches the view.
  function handleLeftIconClick(index: number) {
    setLeftIndex((prev) => (prev === index ? undefined : index));
  }

  function handleRightIconClick(index: number) {
    setRightIndex((prev) => (prev === index ? undefined : index));
  }

  // Resolve what to render in each panel
  const leftViews = leftPanelViews ?? (leftPanelContent != null ? [leftPanelContent] : []);
  const rightViews = rightPanelViews ?? (rightPanelContent != null ? [rightPanelContent] : []);

  const hasLeft = leftViews.length > 0;
  const hasRight = rightViews.length > 0;

  // Panels show/hide purely based on index state — user clicks always win
  const showLeftPanel = hasLeft && leftIndex !== undefined;
  const showRightPanel = hasRight && rightIndex !== undefined;

  const leftContent = leftIndex !== undefined ? (leftViews[leftIndex] ?? leftViews[0]) : null;
  const rightContent = rightIndex !== undefined ? (rightViews[rightIndex] ?? rightViews[0]) : null;

  return (
    <ViewportGuard
      minWidth={769}
      message="This view is not available at this screen size. Please use a larger viewport."
    >
      <div
        className={cn(
          resolveThemeClass(theme),
          'flex h-screen flex-col bg-surface text-foreground',
          className
        )}
        style={{ fontFamily: fontFamily.base }}
      >
        <MaestroHeader
          title={title}
          tenantName={tenantName}
          theme={theme}
          menuContent={menuContent}
        />

        <div ref={bodyRef} className="flex flex-1 overflow-hidden">
          {/* Left rail — always visible when left views are provided */}
          {hasLeft && (
            <StudioPanelSelection
              side="left"
              onIconClick={handleLeftIconClick}
              activeIndex={leftIndex}
              className="border-r border-border-subtle"
            />
          )}

          {/* Left panel — shown when an icon is active and not narrowed */}
          {showLeftPanel && (
            <StudioPanel side="left">{leftContent}</StudioPanel>
          )}

          {/* Center canvas — vertical flex so pageHeader sits above the scroll area */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {pageHeader}
            <StudioCanvas background={canvasBackground} fullWidth={canvasFullWidth}>{children}</StudioCanvas>
          </div>

          {/* Right panel — shown when an icon is active and not narrowed */}
          {showRightPanel && (
            <StudioPanel side="right">{rightContent}</StudioPanel>
          )}

          {/* Right rail — always visible when right views are provided */}
          {hasRight && (
            <StudioPanelSelection
              side="right"
              onIconClick={handleRightIconClick}
              activeIndex={rightIndex}
              className="border-l border-border-subtle"
            />
          )}
        </div>
      </div>
    </ViewportGuard>
  );
}
