import { ChevronDown, MessageCirclePlus, PanelRightOpen, PictureInPicture2 } from 'lucide-react';
import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: NavChildItem[];
  /** Whether the collapsible section starts expanded. Defaults to true. */
  defaultOpen?: boolean;
}

export interface NavChildItem {
  id: string;
  label: string;
}

export interface DelegatePanelProps {
  className?: string;
  /** Whether the panel starts expanded */
  defaultOpen?: boolean;
  /** Controlled open state (overrides internal state when provided) */
  open?: boolean;
  /** Callback when the panel open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Navigation items */
  navItems?: NavItem[];
  /** ID of the currently active top-level nav */
  activeNavId?: string;
  /** Callback when a top-level nav is activated */
  onNavChange?: (navId: string) => void;
  /** ID of the currently selected nav child */
  selectedChildId?: string;
  /** Callback when a nav child is selected */
  onChildSelect?: (childId: string) => void;
}

// ============================================================================
// Internal sub-components
// ============================================================================

/** UiPath logo mark */
function UiPathLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg bg-brand shadow-sm',
        className
      )}
    >
      <span className="text-xs font-bold text-foreground-on-accent select-none">Ui</span>
    </div>
  );
}

/** A single top-level nav item in expanded mode */
function ExpandedNavItem({
  item,
  isOpen,
  onToggle,
  selectedChildId,
  onChildSelect,
}: {
  item: NavItem;
  isOpen: boolean;
  onToggle: () => void;
  selectedChildId?: string;
  onChildSelect?: (childId: string) => void;
}) {
  const isExpandable = Array.isArray(item.children);

  if (!isExpandable) {
    return (
      <button type="button"
        className="flex h-10 w-full items-center gap-2 rounded-2xl px-1 text-foreground-muted transition-colors hover:bg-surface-hover"
        onClick={onToggle}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          {item.icon}
        </div>
        <span className="text-sm font-semibold">{item.label}</span>
      </button>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={() => onToggle()}>
      <CollapsibleTrigger asChild>
        <button type="button" className="flex h-10 w-full items-center justify-between rounded-2xl px-1 text-foreground-muted transition-colors hover:bg-surface-hover">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              {item.icon}
            </div>
            <span className="text-sm font-semibold">{item.label}</span>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <ChevronDown
              className={cn('h-5 w-5 transition-transform duration-200', isOpen && 'rotate-180')}
            />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col">
          {item.children?.map((child) => (
            <button type="button"
              key={child.id}
              className={cn(
                'flex h-10 items-center rounded-2xl pl-12 pr-3 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-hover',
                selectedChildId === child.id &&
                  'bg-surface-hover text-foreground-on-accent'
              )}
              onClick={() => onChildSelect?.(child.id)}
            >
              {child.label}
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** A single icon-only nav item in collapsed mode */
function CollapsedNavItem({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button"
          className={cn(
            'flex h-12 w-full items-center justify-center text-foreground-muted transition-colors hover:text-foreground',
            isActive && 'text-brand-foreground'
          )}
          onClick={onClick}
        >
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
              isActive && 'bg-brand-subtle'
            )}
          >
            {item.icon}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// DelegatePanel
// ============================================================================

/** Collapsible left-hand navigation panel for Delegate templates. */
export function DelegatePanel({
  className,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  navItems = [],
  activeNavId: controlledActiveNavId,
  onNavChange,
  selectedChildId,
  onChildSelect,
}: DelegatePanelProps) {
  // Panel open/close state — supports both controlled and uncontrolled usage
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const panelOpen = controlledOpen ?? internalOpen;
  const setPanelOpen = React.useCallback(
    (next: boolean) => {
      setInternalOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  // Active nav state — supports both controlled and uncontrolled usage
  const [internalActiveNavId, setInternalActiveNavId] = React.useState<string>(
    navItems[0]?.id ?? ''
  );
  const activeNavId = controlledActiveNavId ?? internalActiveNavId;
  const setActiveNavId = React.useCallback(
    (id: string) => {
      setInternalActiveNavId(id);
      onNavChange?.(id);
    },
    [onNavChange]
  );

  // Collapsible sections state
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children && item.children.length > 0) {
        initial[item.id] = item.defaultOpen ?? true;
      }
    });
    return initial;
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex flex-col justify-between bg-surface-overlay shadow-[0px_4px_24px_0px_rgba(0,0,0,0.25)] transition-[width] duration-300 ease-in-out',
          panelOpen ? 'w-80' : 'w-[60px]',
          className
        )}
      >
        {/* Top section */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <div
            className={cn(
              'flex shrink-0 items-center gap-2 pt-1',
              panelOpen ? 'pl-1 pr-4' : 'justify-center px-0 pt-3'
            )}
          >
            {/* Logo area */}
            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center">
              <UiPathLogo />
            </div>

            {/* Header actions (expanded only) */}
            {panelOpen && (
              <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-[18px]">
                  <button type="button"
                    type="button"
                    className="text-foreground-muted transition-colors hover:text-foreground"
                    aria-label="New conversation"
                  >
                    <MessageCirclePlus className="h-5 w-5" />
                  </button>
                  <button type="button"
                    type="button"
                    className="text-foreground-muted transition-colors hover:text-foreground"
                    aria-label="Picture in picture"
                  >
                    <PictureInPicture2 className="h-5 w-5" />
                  </button>
                </div>
                <button type="button"
                  type="button"
                  className="text-foreground-muted transition-colors hover:text-foreground"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Collapse panel"
                >
                  <PanelRightOpen className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1">
            {panelOpen ? (
              /* Expanded navigation */
              <nav className="flex flex-col gap-1 px-3 pt-[18px]">
                {navItems.map((item) => (
                  <ExpandedNavItem
                    key={item.id}
                    item={item}
                    isOpen={openSections[item.id] ?? false}
                    onToggle={() => {
                      if (item.children?.length) {
                        toggleSection(item.id);
                      }
                      setActiveNavId(item.id);
                    }}
                    selectedChildId={selectedChildId}
                    onChildSelect={onChildSelect}
                  />
                ))}
              </nav>
            ) : (
              /* Collapsed navigation */
              <nav className="flex flex-col items-center pt-[18px]">
                {/* Expand button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button"
                      className="flex h-12 w-full items-center justify-center text-foreground-muted transition-colors hover:text-foreground"
                      onClick={() => setPanelOpen(true)}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg">
                        <PanelRightOpen className="h-5 w-5 -scale-x-100" />
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Expand panel</TooltipContent>
                </Tooltip>

                {navItems.map((item) => (
                  <CollapsedNavItem
                    key={item.id}
                    item={item}
                    isActive={activeNavId === item.id}
                    onClick={() => {
                      setActiveNavId(item.id);
                      setPanelOpen(true);
                    }}
                  />
                ))}
              </nav>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex h-[60px] shrink-0 items-center justify-start px-3">
          <Avatar className="h-8 w-8 bg-surface-raised">
            <AvatarFallback className="bg-surface-raised text-xs text-foreground-muted">
              U
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </TooltipProvider>
  );
}
