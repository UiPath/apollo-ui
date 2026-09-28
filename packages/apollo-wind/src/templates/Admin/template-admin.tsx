import * as React from 'react';
import { MaestroHeader } from '@/components/custom/global-header';
import { PageHeader, type PageHeaderProps } from '@/components/custom/page-header';
import { ViewportGuard } from '@/components/custom/viewport-guard';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Theme } from '@/foundation/Future/types';
import { fontFamily } from '@/foundation/Future/typography';
import { cn } from '@/lib';

// Re-export types for consumer convenience
export type { Theme };

// ============================================================================
// Helpers
// ============================================================================

function resolveThemeClass(theme: Theme) {
  return theme ?? 'future-dark';
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
      className={cn('flex shrink-0 flex-col border-r border-border-subtle bg-surface', className)}
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
export function AdminSidebarHeader({ className, title, icon, actions }: AdminSidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between border-b border-border-subtle px-4 py-3',
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
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
export function AdminSidebarNav({ className, items, selectedId, onSelect }: AdminSidebarNavProps) {
  return (
    <ScrollArea className={cn('flex-1', className)}>
      <nav className="flex flex-col gap-0.5 p-2">
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              selectedId === item.id
                ? 'bg-brand-subtle text-foreground-accent'
                : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
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
// AdminPageHeader — re-exported from the shared PageHeader component
// ============================================================================

export type AdminPageHeaderProps = PageHeaderProps;
export { PageHeader as AdminPageHeader };

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
        'flex items-center justify-between border-b border-border-subtle px-6 py-3',
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
  theme?: Theme;
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
          'flex h-screen w-full flex-col overflow-hidden bg-surface text-foreground',
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
