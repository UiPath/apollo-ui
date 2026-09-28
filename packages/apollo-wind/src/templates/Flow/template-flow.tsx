import * as React from 'react';
import type {
  PropertiesSimpleField,
  PropertiesSimpleSection,
} from '@/components/custom/flow-properties-simple';
import { PropertiesSimple } from '@/components/custom/flow-properties-simple';
import {
  defaultFlowNavItems,
  FlowPanel,
  type FlowPanelChatMessage,
  type FlowPanelNavItem,
} from '@/components/custom/panel-flow';
import { useViewportAtOrAbove, ViewportGuard } from '@/components/custom/viewport-guard';
import type { Theme } from '@/foundation/Future/types';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

/** Viewport width (px) at or above which the left panel auto-expands. */
const PANEL_EXPAND_BREAKPOINT = 1280;

/**
 * Minimum viewport width (px) needed to keep the left panel expanded when a
 * right-side properties panel is open.
 *
 * Calculation: left expanded (480) + right panel width + min usable canvas (400).
 *   - Properties Simple:   480 + 376 + 400 = 1256
 */
const MIN_VP_WITH_PROPS_SIMPLE = 1256;

// Re-export types for convenience
export type {
  FlowPanelNavItem,
  FlowPanelChatMessage,
  PropertiesSimpleField,
  PropertiesSimpleSection,
};

// ============================================================================
// Types
// ============================================================================

export interface FlowTemplateProps {
  className?: string;
  /** Color theme for the template */
  theme?: Theme;
  /** Navigation items for the icon rail */
  navItems?: FlowPanelNavItem[];
  /** Whether the expanded panel starts open */
  defaultPanelOpen?: boolean;
  /** Chat messages for the expanded panel */
  chatMessages?: FlowPanelChatMessage[];
  /** Custom content for the expanded panel (overrides default chat) */
  expandedContent?: React.ReactNode;
  /** Whether to show the simple properties panel (right side) */
  defaultPropertiesSimple?: boolean;
  /** Title for the simple properties panel header */
  propertiesSimpleTitle?: string;
  /** Icon for the simple properties panel header */
  propertiesSimpleIcon?: React.ReactNode;
  /** Top-level fields for the simple properties panel */
  propertiesSimpleFields?: PropertiesSimpleField[];
  /** Accordion sections for the simple properties panel */
  propertiesSimpleSections?: PropertiesSimpleSection[];
  /** Canvas content */
  children?: React.ReactNode;
  /** Hide the left navigation rail and expanded assistant panel. */
  hideLeftPanel?: boolean;
  /** Control rendered at the top right of the canvas. */
  topRightControl?: React.ReactNode;
  /** Control rendered at the bottom center of the canvas. */
  bottomCenterControl?: React.ReactNode;
  /** Control rendered at the bottom right of the canvas. */
  bottomRightControl?: React.ReactNode;
  /** Custom docked panel rendered to the right of the canvas. */
  rightPanel?: React.ReactNode;
  /** Custom docked panel rendered across the bottom of the workspace. */
  bottomPanel?: React.ReactNode;
  /**
   * When true, renders only the left sidebar (icon rail) and the canvas —
   * no properties bar, no toolbars, no right-side panels.
   */
  blank?: boolean;
}

// ============================================================================
// FlowTemplate
// ============================================================================

/**
 * Full-page Flow template.
 *
 * Composed of:
 * - **FlowPanel** — 60px icon rail + optional 420px expanded chat panel
 * - Full-bleed canvas content area
 * - Consumer-supplied controls at top-right, bottom-center, and bottom-right
 * - Consumer-supplied docked panels at right or bottom
 */
export function FlowTemplate({
  className,
  theme = 'dark',
  navItems = defaultFlowNavItems,
  defaultPanelOpen = false,
  chatMessages = [],
  expandedContent,
  defaultPropertiesSimple = false,
  propertiesSimpleTitle,
  propertiesSimpleIcon,
  propertiesSimpleFields,
  propertiesSimpleSections,
  children,
  blank = false,
  hideLeftPanel = false,
  topRightControl,
  bottomCenterControl,
  bottomRightControl,
  rightPanel,
  bottomPanel,
}: FlowTemplateProps) {
  const isLargeViewport = useViewportAtOrAbove(PANEL_EXPAND_BREAKPOINT);
  const [panelOpen, setPanelOpen] = React.useState(defaultPanelOpen);
  const [propsSimpleOpen, setPropsSimpleOpen] = React.useState(defaultPropertiesSimple);

  // Sync the active theme class on document.body so Radix portals
  // (Select, Dialog, Sheet, etc.) inherit the correct CSS custom properties.
  const themeClass = theme;
  React.useEffect(() => {
    document.body.classList.add(themeClass);
    return () => {
      document.body.classList.remove(themeClass);
    };
  }, [themeClass]);

  // Auto-expand / collapse left panel when viewport crosses the breakpoint,
  // but only when no right-side panel is open (avoid fighting user intent).
  React.useEffect(() => {
    if (!propsSimpleOpen) {
      setPanelOpen(isLargeViewport);
    }
  }, [isLargeViewport, propsSimpleOpen]);

  // When a right-side panel is open, collapse the left panel if viewport is too narrow
  React.useEffect(() => {
    if (propsSimpleOpen && panelOpen && window.innerWidth < MIN_VP_WITH_PROPS_SIMPLE) {
      setPanelOpen(false);
    }
  }, [propsSimpleOpen, panelOpen]);

  return (
    <ViewportGuard
      minWidth={769}
      message="This view is not available at this screen size. Please use a larger viewport."
    >
      <div
        className={cn(theme, 'flex h-screen bg-surface', className)}
        style={{ fontFamily: fontFamily.base }}
      >
        {/* Left panel: icon rail + optional expanded panel */}
        {!hideLeftPanel && (
          <FlowPanel
            navItems={navItems}
            open={panelOpen}
            onOpenChange={setPanelOpen}
            chatMessages={chatMessages}
            expandedContent={expandedContent}
          />
        )}

        <div className="relative flex min-w-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1">
            {/* Canvas area — relative for toolbar positioning */}
            <div className="relative flex min-w-0 flex-1 flex-col overflow-auto bg-surface">
              {topRightControl && (
                <div className="absolute top-4 z-10" style={{ right: rightPanel ? 412 : 16 }}>
                  {topRightControl}
                </div>
              )}

              {/* Canvas content */}
              {children}

              {/* Canvas toolbar — bottom center */}
              {bottomCenterControl && (
                <div
                  className="absolute left-1/2 z-10 -translate-x-1/2"
                  style={{
                    bottom: bottomPanel ? 'calc(clamp(320px, 40vh, 720px) + 20px)' : 20,
                  }}
                >
                  {bottomCenterControl}
                </div>
              )}

              {/* View toolbar — bottom right */}
              {bottomRightControl && (
                <div
                  className="absolute z-10"
                  style={{
                    right: rightPanel ? 412 : 16,
                    bottom: bottomPanel ? 'calc(clamp(320px, 40vh, 720px) + 20px)' : 20,
                  }}
                >
                  {bottomRightControl}
                </div>
              )}
            </div>

            {rightPanel ? (
              <div className="absolute inset-y-0 right-0 z-20 p-4 pl-0">{rightPanel}</div>
            ) : (
              <>
                {/* Properties simple panel — right side */}
                {!blank && propsSimpleOpen && (
                  <div className="shrink-0 p-4 pl-0">
                    <PropertiesSimple
                      className="h-full"
                      title={propertiesSimpleTitle}
                      icon={propertiesSimpleIcon}
                      fields={propertiesSimpleFields}
                      sections={propertiesSimpleSections}
                      onClose={() => setPropsSimpleOpen(false)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          {bottomPanel && (
            <div className="absolute inset-x-0 bottom-0 z-20 h-[clamp(320px,40vh,720px)] p-4 pt-0">
              {bottomPanel}
            </div>
          )}
        </div>
      </div>
    </ViewportGuard>
  );
}
