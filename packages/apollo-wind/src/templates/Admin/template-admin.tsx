import * as React from 'react';
import { MaestroHeader } from '@/components/custom/global-header';
import { ViewportGuard } from '@/components/custom/viewport-guard';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FutureTheme } from '@/foundation/Future/types';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

// Re-export types for consumer convenience
export type { FutureTheme };

// ============================================================================
// Helpers
// ============================================================================

function resolveThemeClass(theme: FutureTheme) {
  if (theme === 'legacy-dark') return 'legacy-dark';
  if (theme === 'legacy-light') return 'legacy-light';
  if (theme === 'wireframe') return 'future-wireframe';
  if (theme === 'vertex') return 'future-vertex';
  if (theme === 'canvas') return 'future-canvas';
  if (theme === 'light') return 'future-light';
  return 'future-dark';
}

// ============================================================================
// AdminSidebar
// ============================================================================

export interface AdminSidebarProps {
  className?: string;
  /** Width in pixels (default 260) */
  width?: number;
  children?: React.ReactNode;
}

/**
 * Fixed-width sidebar container with right border.
 * Renders children in a vertical flex column — callers handle their own
 * headers, nav lists, and scroll areas as needed.
 */
export function AdminSidebar({ className, width = 260, children }: AdminSidebarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col border-r border-future-border-subtle bg-future-surface',
        className
      )}
      style={{ width }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// AdminSidebarHeader
// ============================================================================

export interface AdminSidebarHeaderProps {
  className?: string;
  /** Title text */
  title: string;
  /** Optional icon rendered before the title */
  icon?: React.ReactNode;
  /** Action buttons rendered on the right */
  actions?: React.ReactNode;
}

/**
 * Header row for AdminSidebar — title, optional icon, and action buttons.
 */
export function AdminSidebarHeader({
  className,
  title,
  icon,
  actions,
}: AdminSidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between border-b border-future-border-subtle px-4 py-3',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-future-foreground">
        {icon}
        <span>{title}</span>
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );
}

// ============================================================================
// AdminSidebarNav
// ============================================================================

export interface AdminNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

export interface AdminSidebarNavProps {
  className?: string;
  items: AdminNavItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

/**
 * Scrollable nav list for AdminSidebar. Each item has an optional icon and badge.
 */
export function AdminSidebarNav({
  className,
  items,
  selectedId,
  onSelect,
}: AdminSidebarNavProps) {
  return (
    <ScrollArea className={cn('flex-1', className)}>
      <nav className="flex flex-col gap-0.5 p-2">
        {items.map((item) => (
          <button
            key={item.id}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              selectedId === item.id
                ? 'bg-future-accent-subtle text-future-foreground-accent'
                : 'text-future-foreground-muted hover:bg-future-surface-hover hover:text-future-foreground'
            )}
            onClick={() => onSelect?.(item.id)}
          >
            {item.icon}
            <span className="flex-1 truncate text-left">{item.label}</span>
            {item.badge}
          </button>
        ))}
      </nav>
    </ScrollArea>
  );
}

// ============================================================================
// AdminPageHeader
// ============================================================================

export interface AdminPageHeaderProps {
  className?: string;
  /** Page title */
  title: string;
  /** Breadcrumb segments (plain strings — last one is highlighted) */
  breadcrumb?: string[];
  /** Action buttons rendered on the right */
  actions?: React.ReactNode;
  /** Tab definitions */
  tabs?: { value: string; label: string }[];
  /** Currently active tab value */
  activeTab?: string;
  /** Callback when a tab is selected */
  onTabChange?: (value: string) => void;
}

/**
 * Page header with optional breadcrumb trail, action buttons, and tab bar.
 */
export function AdminPageHeader({
  className,
  title,
  breadcrumb,
  actions,
  tabs,
  activeTab,
  onTabChange,
}: AdminPageHeaderProps) {
  return (
    <div className={cn('border-b border-future-border-subtle px-6 py-4', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mb-2 flex items-center gap-1.5 text-sm text-future-foreground-muted">
          {breadcrumb.map((item, i) => (
            <React.Fragment key={item}>
              {i > 0 && <span className="text-future-foreground-subtle">/</span>}
              {i === breadcrumb.length - 1 ? (
                <span className="text-future-foreground">{item}</span>
              ) : (
                <span>{item}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-future-foreground">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {tabs && (
        <div className="mt-4 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={cn(
                'px-4 pb-2 pt-1 text-sm font-medium transition-colors',
                activeTab === tab.value
                  ? 'border-b-2 border-future-accent text-future-foreground'
                  : 'text-future-foreground-muted hover:text-future-foreground'
              )}
              onClick={() => onTabChange?.(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AdminToolbar
// ============================================================================

export interface AdminToolbarProps {
  className?: string;
  /** Filter or search controls (left side) */
  children?: React.ReactNode;
  /** Action buttons (right side) */
  actions?: React.ReactNode;
}

/**
 * Horizontal toolbar row — filters on the left, actions on the right.
 */
export function AdminToolbar({ className, children, actions }: AdminToolbarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-future-border-subtle px-6 py-3',
        className
      )}
    >
      <div className="flex items-center gap-3">{children}</div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  );
}

// ============================================================================
// AdminTemplate
// ============================================================================

export interface AdminTemplateProps {
  className?: string;
  /** Color theme (default "dark") */
  theme?: FutureTheme;
  /** Header title (default "Administration") */
  title?: string;
  /** Content for the global header's slide-out menu drawer */
  menuContent?: React.ReactNode;
  /**
   * Sidebar element — typically an `<AdminSidebar>` with `AdminSidebarHeader`
   * and `AdminSidebarNav` inside. Omit for a full-width layout (no sidebar).
   */
  sidebar?: React.ReactNode;
  /** Main content area — compose with `AdminPageHeader`, `AdminToolbar`, etc. */
  children?: React.ReactNode;
}

/**
 * Full-page Admin template.
 *
 * Composed of:
 * - **MaestroHeader** — global header with logo and slide-out menu
 * - **sidebar** (optional) — fixed-width left sidebar (pass an `AdminSidebar`)
 * - **main area** — flex-1 column for page content
 *
 * Pass `AdminPageHeader`, `AdminToolbar`, and your own content as children
 * to build the main area. See the Admin stories for full examples.
 */
export function AdminTemplate({
  className,
  theme = 'dark',
  title = 'Administration',
  menuContent,
  sidebar,
  children,
}: AdminTemplateProps) {
  return (
    <ViewportGuard
      minWidth={769}
      message="This view is not available at this screen size. Please use a larger viewport."
    >
      <div
        className={cn(
          resolveThemeClass(theme),
          'flex h-screen w-full flex-col overflow-hidden bg-future-surface text-foreground',
          className
        )}
        style={{ fontFamily: fontFamily.base }}
      >
        <MaestroHeader title={title} theme={theme} menuContent={menuContent} />

        <div className="flex flex-1 overflow-hidden">
          {sidebar}
          <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
        </div>
      </div>
    </ViewportGuard>
  );
}
