import * as React from 'react';
import {
  Menu,
  Search,
  Sparkles,
  Bell,
  CircleHelp,
  ChevronDown,
  User,
  Settings,
  LogOut,
  BookOpen,
  MessageCircleQuestion,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
} from '@/components/ui/sheet';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

import type { FutureTheme } from '@/foundation/Future/types';

export interface MaestroHeaderProps {
  className?: string;
  /** Color theme — needed so portal-rendered dropdowns inherit the correct CSS variables */
  theme?: FutureTheme;
  /** Application title shown next to the logo */
  title?: string;
  /** Current tenant name */
  tenantName?: string;
  /**
   * Content for the app-launcher slide-out menu.
   * When provided, the Menu icon toggles a left-side drawer that renders
   * this content below the header. When omitted, no drawer is rendered.
   */
  menuContent?: React.ReactNode;
  /** Callback when search is clicked */
  onSearchClick?: () => void;
}

// ============================================================================
// Internal: Icon button (plain, no dropdown)
// ============================================================================

function HeaderIconButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors',
        disabled ? 'cursor-default opacity-50' : 'hover:text-foreground'
      )}
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
    >
      {icon}
    </button>
  );
}

// ============================================================================
// Internal: Notifications dropdown
// ============================================================================

function NotificationsDropdown({ themeClass }: { themeClass: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(themeClass, 'w-72 border-border bg-surface-overlay')}
      >
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
        </div>
        <DropdownMenuSeparator className="bg-border-subtle" />
        <DropdownMenuItem className="flex items-start gap-3 px-3 py-2.5 text-foreground-muted focus:bg-surface-hover focus:text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-foreground" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">System update available</span>
            <span className="text-xs text-foreground-muted">A new version is ready to install</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-start gap-3 px-3 py-2.5 text-foreground-muted focus:bg-surface-hover focus:text-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">Flow completed</span>
            <span className="text-xs text-foreground-muted">Invoice processing finished successfully</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-start gap-3 px-3 py-2.5 text-foreground-muted focus:bg-surface-hover focus:text-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">Action required</span>
            <span className="text-xs text-foreground-muted">Review pending approval requests</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Internal: Help dropdown
// ============================================================================

function HelpDropdown({ themeClass }: { themeClass: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:text-foreground"
          aria-label="Help"
        >
          <CircleHelp className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(themeClass, 'w-56 border-border bg-surface-overlay')}
      >
        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-foreground-muted focus:bg-surface-hover focus:text-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm">Documentation</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-foreground-muted focus:bg-surface-hover focus:text-foreground">
          <MessageCircleQuestion className="h-4 w-4" />
          <span className="text-sm">Support</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-foreground-muted focus:bg-surface-hover focus:text-foreground">
          <ExternalLink className="h-4 w-4" />
          <span className="text-sm">Community forum</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Internal: Tenant selector popover
// ============================================================================

function TenantSelector({ tenantName, themeClass }: { tenantName: string; themeClass: string }) {
  const [selected, setSelected] = React.useState(tenantName);

  const tenants = [
    { id: 'default', label: 'Default Tenant' },
    { id: 'production', label: 'Production' },
    { id: 'staging', label: 'Staging' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-foreground-muted transition-colors hover:text-foreground">
          <span>
            Tenant: <span className="font-medium">{selected}</span>
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(themeClass, 'w-56 border-border bg-surface-overlay p-1')}
      >
        {tenants.map((tenant) => (
          <button
            key={tenant.id}
            className={cn(
              'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-surface-hover',
              selected === tenant.label
                ? 'font-medium text-foreground'
                : 'text-foreground-muted'
            )}
            onClick={() => setSelected(tenant.label)}
          >
            {tenant.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Internal: Avatar dropdown
// ============================================================================

function AvatarDropdown({ themeClass }: { themeClass: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none" aria-label="User menu">
          <Avatar className="h-6 w-6 bg-brand">
            <AvatarFallback className="bg-brand text-[10px] font-bold text-foreground-on-accent">
              UI
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(themeClass, 'w-48 border-border bg-surface-overlay')}
      >
        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-foreground-muted focus:bg-surface-hover focus:text-foreground">
          <User className="h-4 w-4" />
          <span className="text-sm">Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-foreground-muted focus:bg-surface-hover focus:text-foreground">
          <Settings className="h-4 w-4" />
          <span className="text-sm">Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border-subtle" />
        <DropdownMenuItem className="flex items-center gap-2 px-3 py-2 text-foreground-muted focus:bg-surface-hover focus:text-foreground">
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// MaestroHeader
// ============================================================================

/**
 * Global header bar for the Maestro template.
 *
 * Contains the UiPath waffle icon, application title, action icons
 * (search, settings, notifications, help), a tenant selector, and
 * user avatar. Fixed height of 48px.
 *
 * When `menuContent` is provided, clicking the Menu icon opens a
 * slide-out drawer from the left (below the header) containing that
 * content. The drawer state is managed internally.
 *
 * Interactive elements:
 * - **Menu icon**: Toggles the app-launcher drawer (when `menuContent` is set)
 * - **Notifications**: DropdownMenu with example notification items
 * - **Help**: DropdownMenu with Documentation, Support, Community forum
 * - **Tenant selector**: Popover with example tenant list
 * - **Avatar**: DropdownMenu with Profile, Settings, Log out
 */
export function MaestroHeader({
  className,
  theme = 'dark',
  title = 'Maestro',
  tenantName = 'Select',
  menuContent,
  onSearchClick,
}: MaestroHeaderProps) {
  // Theme class applied to portal-rendered content (dropdowns/popovers)
  // so CSS variables resolve correctly outside the template's DOM tree
  const themeClass =
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
                : 'future-dark';

  // Internal drawer state — only relevant when menuContent is provided
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <>
      <header
        className={cn(
          'flex h-12 shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-4',
          className
        )}
      >
        {/* Left: waffle + title */}
        <div className="flex items-center gap-3">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:text-foreground"
            onClick={() => menuContent && setMenuOpen((prev) => !prev)}
            aria-label="App launcher"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm font-semibold text-foreground">
            {title}
          </span>
        </div>

        {/* Right: actions + tenant + avatar */}
        <div className="flex items-center gap-4">
        <HeaderIconButton
          icon={<Search className="h-5 w-5" />}
          label="Search"
          onClick={onSearchClick}
          disabled
        />
        <HeaderIconButton
          icon={<Sparkles className="h-5 w-5" />}
          label="AI"
          disabled
        />
          <NotificationsDropdown themeClass={themeClass} />
          <HelpDropdown themeClass={themeClass} />
          <TenantSelector tenantName={tenantName} themeClass={themeClass} />
          <AvatarDropdown themeClass={themeClass} />
        </div>
      </header>

      {/* App-launcher menu — slides in from left, below the header */}
      {menuContent && (
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetPortal>
            {/* Overlay starts below the 48px header */}
            <SheetOverlay className="top-12" />
            <SheetPrimitive.Content
              className={cn(
                themeClass,
                'fixed left-0 top-12 bottom-0 z-50 w-[300px] border-r border-border-subtle bg-surface p-0 shadow-lg',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
                'data-[state=closed]:duration-300 data-[state=open]:duration-300'
              )}
            >
              {/* Accessible title (visually hidden) */}
              <SheetTitle className="sr-only">App launcher</SheetTitle>

              {/* Menu content */}
              <div className="flex h-full flex-col overflow-y-auto">
                {menuContent}
              </div>
            </SheetPrimitive.Content>
          </SheetPortal>
        </Sheet>
      )}
    </>
  );
}
