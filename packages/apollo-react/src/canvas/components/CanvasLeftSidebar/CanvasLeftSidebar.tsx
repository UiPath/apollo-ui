import { cn } from '@uipath/apollo-wind';
import {
  Files,
  History,
  MessageCircle,
  Network,
  Newspaper,
  PanelLeftClose,
  User,
  Variable,
} from 'lucide-react';
import { memo, type ReactNode } from 'react';
import { ToolbarButton } from '../ToolbarButton';

export const CANVAS_LEFT_SIDEBAR_RAIL_WIDTH = 60;
export const CANVAS_LEFT_SIDEBAR_WIDTH = 288;
export const CANVAS_LEFT_SIDEBAR_COLLAPSED_WIDTH = CANVAS_LEFT_SIDEBAR_RAIL_WIDTH;

export type CanvasLeftSidebarItemId = string;

export interface CanvasLeftSidebarItem {
  id: CanvasLeftSidebarItemId;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}

export interface CanvasLeftSidebarProps {
  /** Text displayed in the expanded sidebar header. */
  title: ReactNode;
  /** Reusable sidebar content. Hidden while the sidebar is collapsed. */
  children?: ReactNode;
  /** Whether the content panel next to the navigation rail is visible. */
  isExpanded: boolean;
  /** Called when the content panel is expanded or collapsed. */
  onExpandedChange: (isExpanded: boolean) => void;
  /** Currently selected rail item. */
  activeItemId?: CanvasLeftSidebarItemId;
  /** Called when a rail item is selected. */
  onItemSelect?: (itemId: CanvasLeftSidebarItemId) => void;
  /** Called when the UiPath logo is selected. */
  onLogoClick?: () => void;
  /** Custom logo artwork. Defaults to the UiPath mark. */
  logo?: ReactNode;
  /** Primary actions rendered below the logo. Defaults to the Flow navigation actions. */
  primaryItems?: readonly CanvasLeftSidebarItem[];
  /** Utility actions pinned to the bottom. Defaults to What's new and Account. */
  bottomItems?: readonly CanvasLeftSidebarItem[];
  /** Additional controls rendered before the collapse button in the panel header. */
  headerActions?: ReactNode;
  /** Docked sidebars are square; floating sidebars use rounded, elevated chrome. */
  variant?: 'default' | 'floating';
  className?: string;
}

export const CANVAS_LEFT_SIDEBAR_DEFAULT_PRIMARY_ITEMS: readonly CanvasLeftSidebarItem[] = [
  { id: 'coding-agent', label: 'Coding agent', icon: <MessageCircle strokeWidth={1.75} /> },
  { id: 'files', label: 'Files', icon: <Files strokeWidth={1.75} /> },
  { id: 'variables', label: 'Variables', icon: <Variable strokeWidth={1.75} /> },
  { id: 'connections', label: 'Connections', icon: <Network strokeWidth={1.75} /> },
  { id: 'run-history', label: 'Run history', icon: <History strokeWidth={1.75} /> },
];

export const CANVAS_LEFT_SIDEBAR_DEFAULT_BOTTOM_ITEMS: readonly CanvasLeftSidebarItem[] = [
  { id: 'whats-new', label: "What's new", icon: <Newspaper strokeWidth={1.75} /> },
  { id: 'account', label: 'Account', icon: <User strokeWidth={1.75} /> },
];

function UiPathLogo() {
  return (
    <svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill="#0092B8" />
      <g transform="translate(6 6)" fill="#FAFAFA">
        <path d="M18.57 11.4h-.297c-.959 0-1.555.601-1.555 1.568v9.465c0 .967.596 1.567 1.555 1.567h.297c.959 0 1.555-.6 1.555-1.567v-9.465c0-.967-.596-1.568-1.555-1.568Z" />
        <path d="M22.689 5.541c-2.168-.348-3.878-2.057-4.226-4.222-.007-.041-.06-.041-.066 0-.348 2.165-2.059 3.874-4.226 4.222-.041.006-.041.059 0 .066 2.167.348 3.878 2.056 4.226 4.221.006.041.059.041.066 0 .348-2.165 2.058-3.873 4.226-4.221.041-.007.041-.06 0-.066Z" />
        <path d="M23.985 2.159C22.9 2.333 22.046 3.187 21.872 4.27c-.004.02-.03.02-.034 0-.174-1.083-1.029-1.937-2.112-2.111-.021-.003-.021-.03 0-.033 1.083-.174 1.938-1.028 2.112-2.111.003-.02.03-.02.034 0 .174 1.083 1.029 1.937 2.113 2.111.02.003.02.03 0 .033Z" />
        <path d="M12.765 6.859h-.359c-.936 0-1.517.578-1.517 1.509v7.485c0 3.549-1.086 4.996-3.748 4.996s-3.748-1.454-3.748-5.018V8.368c0-.931-.581-1.509-1.517-1.509h-.359C.581 6.859 0 7.437 0 8.368v7.485C0 21.259 2.403 24 7.141 24s7.141-2.741 7.141-8.147V8.368c0-.931-.581-1.509-1.517-1.509Z" />
      </g>
    </svg>
  );
}

function RailButton({
  item,
  activeItemId,
  onSelect,
}: {
  item: CanvasLeftSidebarItem;
  activeItemId?: CanvasLeftSidebarItemId;
  onSelect: (id: CanvasLeftSidebarItemId) => void;
}) {
  const isActive = activeItemId === item.id;
  return (
    <ToolbarButton
      label={item.label}
      tooltipSide="right"
      onClick={() => onSelect(item.id)}
      disabled={item.disabled}
      ariaPressed={isActive}
      className={cn(
        'size-9 rounded-lg text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground [&_svg]:size-5',
        isActive && 'bg-surface-overlay text-foreground'
      )}
    >
      {item.icon}
    </ToolbarButton>
  );
}

export const CanvasLeftSidebar = memo(function CanvasLeftSidebar({
  title,
  children,
  isExpanded,
  onExpandedChange,
  activeItemId,
  onItemSelect,
  onLogoClick,
  logo,
  primaryItems = CANVAS_LEFT_SIDEBAR_DEFAULT_PRIMARY_ITEMS,
  bottomItems = CANVAS_LEFT_SIDEBAR_DEFAULT_BOTTOM_ITEMS,
  headerActions,
  variant = 'default',
  className,
}: CanvasLeftSidebarProps) {
  const selectItem = (itemId: CanvasLeftSidebarItemId) => {
    onItemSelect?.(itemId);
    onExpandedChange(activeItemId === itemId ? !isExpanded : true);
  };

  return (
    <aside
      data-testid="canvas-left-sidebar"
      data-expanded={isExpanded}
      className={cn(
        'flex h-full shrink-0 overflow-hidden border border-border-subtle bg-surface-raised text-foreground transition-[width] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
        variant === 'floating' && 'rounded-2xl shadow-lg',
        className
      )}
      style={{
        width: isExpanded
          ? CANVAS_LEFT_SIDEBAR_RAIL_WIDTH + CANVAS_LEFT_SIDEBAR_WIDTH
          : CANVAS_LEFT_SIDEBAR_COLLAPSED_WIDTH,
      }}
    >
      <nav
        aria-label="Canvas navigation"
        className="flex h-full shrink-0 select-none flex-col items-center border-r border-border-subtle py-3"
        style={{ width: CANVAS_LEFT_SIDEBAR_RAIL_WIDTH }}
      >
        {onLogoClick ? (
          <ToolbarButton
            label="Home"
            tooltipSide="right"
            onClick={onLogoClick}
            className="mb-2 size-9 shrink-0 overflow-hidden rounded-lg p-0 transition-transform hover:opacity-90 active:scale-95 [&_svg]:!size-9"
          >
            {logo ?? <UiPathLogo />}
          </ToolbarButton>
        ) : (
          <div className="mb-2 size-9 shrink-0 overflow-hidden rounded-lg [&_svg]:!size-9">
            {logo ?? <UiPathLogo />}
          </div>
        )}

        <div className="flex flex-1 flex-col items-center gap-1 pt-2">
          {primaryItems.map((item) => (
            <RailButton
              key={item.id}
              item={item}
              activeItemId={activeItemId}
              onSelect={selectItem}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 pt-2">
          {bottomItems.map((item) => (
            <RailButton
              key={item.id}
              item={item}
              activeItemId={activeItemId}
              onSelect={selectItem}
            />
          ))}
        </div>
      </nav>

      <div
        aria-hidden={!isExpanded}
        inert={!isExpanded}
        className={cn(
          'flex h-full shrink-0 flex-col transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
          isExpanded ? 'translate-x-0 opacity-100' : 'invisible -translate-x-1 opacity-0'
        )}
        style={{ width: CANVAS_LEFT_SIDEBAR_WIDTH }}
      >
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 px-4">
          <h2 className="min-w-0 truncate text-sm font-semibold tracking-[-0.35px]">{title}</h2>
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
            <ToolbarButton
              label="Collapse sidebar"
              tooltipSide="right"
              onClick={() => onExpandedChange(false)}
              className="shrink-0 text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-4"
            >
              <PanelLeftClose />
            </ToolbarButton>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto border-t border-border-subtle p-3">
          {children}
        </div>
      </div>
    </aside>
  );
});
