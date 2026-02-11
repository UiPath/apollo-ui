import * as React from 'react';
import { Canvas } from '@/components/custom/canvas';
import { PropertiesBar } from '@/components/custom/flow-properties-bar';
import { PropertiesExpanded } from '@/components/custom/flow-properties-expanded';
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
import { FlowCanvasToolbar } from '@/components/custom/toolbar-canvas';
import { FlowViewToolbar } from '@/components/custom/toolbar-view';
import { useViewportAtOrAbove, ViewportGuard } from '@/components/ui/viewport-guard';
import type { FutureTheme } from '@/foundation/Future/types';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

/** Viewport width (px) at or above which the left panel auto-expands. */
const PANEL_EXPAND_BREAKPOINT = 1280;

/**
 * Minimum viewport width (px) needed to keep the left panel expanded when a
 * right-side properties panel is open.
 *
 * Calculation: left expanded (480) + right panel width + min usable canvas (400).
 *   - Properties Expanded: 480 + 946 + 400 = 1826
 *   - Properties Simple:   480 + 376 + 400 = 1256
 */
const MIN_VP_WITH_PROPS_EXPANDED = 1826;
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
  theme?: FutureTheme;
  /** Navigation items for the icon rail */
  navItems?: FlowPanelNavItem[];
  /** Whether the expanded panel starts open */
  defaultPanelOpen?: boolean;
  /** Chat messages for the expanded panel */
  chatMessages?: FlowPanelChatMessage[];
  /** Custom content for the expanded panel (overrides default chat) */
  expandedContent?: React.ReactNode;
  /** Flow name displayed in the properties bar */
  flowName?: string;
  /** Flow type label (e.g. "Workflow") */
  flowType?: string;
  /** Whether the properties panel starts expanded */
  defaultPropertiesExpanded?: boolean;
  /** Node name for the expanded properties panel */
  propertiesNodeName?: string;
  /** Node type for the expanded properties panel */
  propertiesNodeType?: string;
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
}

// ============================================================================
// FlowTemplate
// ============================================================================

/**
 * Full-page Flow template.
 *
 * Composed of:
 * - **FlowPanel** — 60px icon rail + optional 420px expanded chat panel
 * - **Canvas** — main content area (reuses Delegate Canvas)
 * - **PropertiesBar** — collapsed bar top-right of canvas (default)
 * - **PropertiesExpanded** — full properties panel on the right (when expanded)
 * - **FlowCanvasToolbar** — bottom-center of canvas
 * - **FlowViewToolbar** — bottom-right of canvas
 */
export function FlowTemplate({
  className,
  theme = 'dark',
  navItems = defaultFlowNavItems,
  defaultPanelOpen = false,
  chatMessages = [],
  expandedContent,
  flowName = 'Invoice processing',
  flowType = 'Workflow',
  defaultPropertiesExpanded = false,
  propertiesNodeName = 'Validate invoice',
  propertiesNodeType = 'AI Agent',
  defaultPropertiesSimple = false,
  propertiesSimpleTitle,
  propertiesSimpleIcon,
  propertiesSimpleFields,
  propertiesSimpleSections,
  children,
}: FlowTemplateProps) {
  const isLargeViewport = useViewportAtOrAbove(PANEL_EXPAND_BREAKPOINT);
  const [panelOpen, setPanelOpen] = React.useState(defaultPanelOpen);
  const [propsExpanded, setPropsExpanded] = React.useState(defaultPropertiesExpanded);
  const [propsSimpleOpen, setPropsSimpleOpen] = React.useState(defaultPropertiesSimple);

  // Sync the active theme class on document.body so Radix portals
  // (Select, Dialog, Sheet, etc.) inherit the correct CSS custom properties.
  const themeClass =
    theme === 'legacy-dark'
      ? 'legacy-dark'
      : theme === 'legacy-light'
        ? 'legacy-light'
        : theme === 'light'
          ? 'future-light'
          : 'future-dark';
  React.useEffect(() => {
    document.body.classList.add(themeClass);
    return () => {
      document.body.classList.remove(themeClass);
    };
  }, [themeClass]);

  // Auto-expand / collapse left panel when viewport crosses the breakpoint,
  // but only when no right-side panel is open (avoid fighting user intent).
  React.useEffect(() => {
    if (!propsExpanded && !propsSimpleOpen) {
      setPanelOpen(isLargeViewport);
    }
  }, [isLargeViewport, propsExpanded, propsSimpleOpen]);

  // When a right-side panel is open, collapse the left panel if viewport is too narrow
  React.useEffect(() => {
    if (propsExpanded && panelOpen && window.innerWidth < MIN_VP_WITH_PROPS_EXPANDED) {
      setPanelOpen(false);
    }
    if (propsSimpleOpen && panelOpen && window.innerWidth < MIN_VP_WITH_PROPS_SIMPLE) {
      setPanelOpen(false);
    }
  }, [propsExpanded, propsSimpleOpen, panelOpen]);

  // Open the expanded properties panel, auto-collapsing the left panel if needed
  const openPropsExpanded = React.useCallback(() => {
    if (panelOpen && window.innerWidth < MIN_VP_WITH_PROPS_EXPANDED) {
      setPanelOpen(false);
    }
    setPropsExpanded(true);
  }, [panelOpen]);

  // Open the simple properties panel, auto-collapsing the left panel if needed
  const openPropsSimple = React.useCallback(() => {
    if (panelOpen && window.innerWidth < MIN_VP_WITH_PROPS_SIMPLE) {
      setPanelOpen(false);
    }
    setPropsSimpleOpen(true);
  }, [panelOpen]);

  return (
    <ViewportGuard
      minWidth={769}
      message="This view is not available at this screen size. Please use a larger viewport."
    >
      <div
        className={cn(
          theme === 'legacy-dark'
            ? 'legacy-dark'
            : theme === 'legacy-light'
              ? 'legacy-light'
              : theme === 'light'
                ? 'future-light'
                : 'future-dark',
          'flex h-screen bg-future-surface',
          className
        )}
        style={{ fontFamily: fontFamily.base }}
      >
        {/* Left panel: icon rail + optional expanded panel */}
        <FlowPanel
          navItems={navItems}
          open={panelOpen}
          onOpenChange={setPanelOpen}
          chatMessages={chatMessages}
          expandedContent={expandedContent}
        />

        {/* Canvas area — relative for toolbar positioning */}
        <Canvas className="relative">
          {/* Properties: collapsed bar (default) — hidden when expanded or simple panel is shown */}
          {!propsExpanded && !propsSimpleOpen && (
            <div className="absolute right-4 top-4 z-10 w-[680px] max-w-[calc(100%-32px)]">
              <PropertiesBar flowName={flowName} flowType={flowType} onExpand={openPropsExpanded} />
            </div>
          )}

          {/* Canvas content */}
          {children}

          {/* Canvas toolbar — bottom center */}
          <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
            <FlowCanvasToolbar
              activeMode={propsSimpleOpen ? 'evaluate' : 'build'}
              onModeChange={(mode) => {
                if (mode === 'evaluate') {
                  openPropsSimple();
                } else {
                  setPropsSimpleOpen(false);
                }
              }}
            />
          </div>

          {/* View toolbar — bottom right */}
          <div className="absolute bottom-5 right-4 z-10">
            <FlowViewToolbar />
          </div>
        </Canvas>

        {/* Properties expanded panel — right side */}
        {propsExpanded && (
          <div className="shrink-0 p-4 pl-0">
            <PropertiesExpanded
              className="h-full"
              nodeName={propertiesNodeName}
              nodeType={propertiesNodeType}
              onClose={() => setPropsExpanded(false)}
            />
          </div>
        )}

        {/* Properties simple panel — right side */}
        {propsSimpleOpen && !propsExpanded && (
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
      </div>
    </ViewportGuard>
  );
}
