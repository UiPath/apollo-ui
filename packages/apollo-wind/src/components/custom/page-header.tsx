import * as React from 'react';
import { cn } from '@/lib';

// ============================================================================
// PageHeader
// ============================================================================

export interface PageHeaderProps {
  className?: string;
  /** Page title */
  title: string;
  /** Optional subtitle rendered below the title */
  description?: string;
  /** Breadcrumb segments — last segment is rendered in the foreground color */
  breadcrumb?: string[];
  /** Action buttons rendered on the right of the title row */
  actions?: React.ReactNode;
  /** Tab definitions */
  tabs?: { value: string; label: string }[];
  /** Currently active tab value */
  activeTab?: string;
  /** Called when a tab is clicked */
  onTabChange?: (value: string) => void;
}

/**
 * Reusable page header with optional breadcrumb trail, action buttons, and
 * an underline tab bar.
 *
 * Used by the Admin, Studio, and other templates. Compose with a template's
 * main content area; the component handles its own bottom border.
 *
 * ```tsx
 * <PageHeader
 *   title="Manage access"
 *   breadcrumb={['POPoC', 'DefaultTenant', 'Manage access']}
 *   actions={<Button>Assign role</Button>}
 *   tabs={[
 *     { value: 'assignments', label: 'Role assignments' },
 *     { value: 'roles', label: 'Roles' },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 * ```
 */
export function PageHeader({
  className,
  title,
  description,
  breadcrumb,
  actions,
  tabs,
  activeTab,
  onTabChange,
}: PageHeaderProps) {
  return (
    <div className={cn('border-b border-border-subtle px-6 py-4', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="mb-2 flex items-center gap-1.5 text-sm text-foreground-muted">
          {breadcrumb.map((item, i) => (
            <React.Fragment key={item}>
              {i > 0 && <span className="text-foreground-subtle">/</span>}
              {i === breadcrumb.length - 1 ? (
                <span className="text-foreground">{item}</span>
              ) : (
                <span>{item}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="mt-0.5 text-sm text-foreground-muted">{description}</p>
          )}
        </div>
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
                  ? 'border-b-2 border-brand text-foreground'
                  : 'text-foreground-muted hover:text-foreground'
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
