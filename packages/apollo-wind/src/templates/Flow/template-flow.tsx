import * as React from 'react';
import { cn } from '@/lib';
import { fontFamily } from '@/foundation/Future/typography';
import { ViewportGuard } from '@/components/ui/viewport-guard';
import { Canvas } from '@/components/custom/canvas';
import {
  FlowPanel,
  defaultFlowNavItems,
  type FlowPanelNavItem,
  type FlowPanelChatMessage,
} from '@/components/custom/panel-flow';
import { PropertiesBar } from '@/components/custom/flow-properties-bar';
import { PropertiesExpanded } from '@/components/custom/flow-properties-expanded';
import { PropertiesSimple } from '@/components/custom/flow-properties-simple';
import type { PropertiesSimpleField, PropertiesSimpleSection } from '@/components/custom/flow-properties-simple';
import { FlowCanvasToolbar } from '@/components/custom/toolbar-canvas';
import { FlowViewToolbar } from '@/components/custom/toolbar-view';

// Re-export types for convenience
export type { FlowPanelNavItem, FlowPanelChatMessage, PropertiesSimpleField, PropertiesSimpleSection };

// ============================================================================
// Types
// ============================================================================

export interface FlowTemplateProps {
  className?: string;
  /** Color theme for the template */
  theme?: 'dark' | 'light';
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
  const [panelOpen, setPanelOpen] = React.useState(defaultPanelOpen);
  const [propsExpanded, setPropsExpanded] = React.useState(defaultPropertiesExpanded);
  const [propsSimpleOpen, setPropsSimpleOpen] = React.useState(defaultPropertiesSimple);

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
              <PropertiesBar
                flowName={flowName}
                flowType={flowType}
                onExpand={() => setPropsExpanded(true)}
              />
            </div>
          )}

          {/* Canvas content */}
          {children}

          {/* Canvas toolbar — bottom center */}
          <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
            <FlowCanvasToolbar activeMode={propsSimpleOpen ? 'evaluate' : 'build'} />
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
