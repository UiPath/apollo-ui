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
    <div className={cn('flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-[#0092b8] shadow-sm', className)}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px]" aria-hidden="true">
        <path d="M18.57 11.4014H18.273C17.3139 11.4014 16.7183 12.002 16.7183 12.9686V22.4331C16.7183 23.3997 17.3139 24.0003 18.273 24.0003H18.57C19.5289 24.0003 20.1246 23.3997 20.1246 22.4331V12.9686C20.1246 12.002 19.5289 11.4014 18.57 11.4014Z" fill="white" />
        <path d="M22.689 5.54073C20.5215 5.19295 18.8111 3.48437 18.463 1.31918C18.4564 1.27831 18.4034 1.27831 18.3968 1.31918C18.0487 3.48437 16.3383 5.19295 14.1708 5.54073C14.1299 5.54728 14.1299 5.60028 14.1708 5.60683C16.3383 5.95453 18.0487 7.66319 18.3968 9.82838C18.4034 9.86925 18.4564 9.86925 18.463 9.82838C18.8111 7.66319 20.5215 5.95453 22.689 5.60683C22.73 5.60028 22.73 5.54728 22.689 5.54073ZM20.5595 5.59031C19.4757 5.76416 18.6205 6.61848 18.4465 7.70108C18.4432 7.72151 18.4167 7.72151 18.4134 7.70108C18.2393 6.61848 17.3841 5.76416 16.3003 5.59031C16.2799 5.58703 16.2799 5.56053 16.3003 5.55725C17.3841 5.38337 18.2393 4.52907 18.4134 3.44648C18.4167 3.42604 18.4432 3.42604 18.4465 3.44648C18.6205 4.52907 19.4757 5.38337 20.5595 5.55725C20.5799 5.56053 20.5799 5.58703 20.5595 5.59031Z" fill="white" />
        <path d="M23.9846 2.15915C22.9008 2.33301 22.0456 3.18733 21.8716 4.26993C21.8683 4.29036 21.8418 4.29036 21.8385 4.26993C21.6645 3.18733 20.8092 2.33301 19.7255 2.15915C19.705 2.15588 19.705 2.12938 19.7255 2.1261C20.8092 1.95221 21.6645 1.09792 21.8385 0.0153254C21.8418 -0.00510845 21.8683 -0.00510845 21.8716 0.0153254C22.0456 1.09792 22.9008 1.95221 23.9846 2.1261C24.0051 2.12938 24.0051 2.15588 23.9846 2.15915Z" fill="white" />
        <path d="M12.7647 6.85913H12.4063C11.4704 6.85913 10.889 7.4373 10.889 8.36778V15.8529C10.889 19.4018 9.80316 20.8493 7.14102 20.8493C4.47888 20.8493 3.393 19.3952 3.393 15.8306V8.36778C3.393 7.4373 2.8116 6.85913 1.87582 6.85913H1.51723C0.581398 6.85913 0 7.4373 0 8.36778V15.8529C0 21.259 2.40265 24.0001 7.14102 24.0001C11.8794 24.0001 14.2819 21.259 14.2819 15.8529V8.36778C14.2819 7.4373 13.7005 6.85913 12.7647 6.85913Z" fill="white" />
      </svg>
    </div>
  );
}

/** A single top-level nav item in expanded mode */
function ExpandedNavItem({
  item,
  isOpen,
  isActive,
  onToggle,
  selectedChildId,
  onChildSelect,
}: {
  item: NavItem;
  isOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
  selectedChildId?: string;
  onChildSelect?: (childId: string) => void;
}) {
  const isExpandable = Array.isArray(item.children);

  if (!isExpandable) {
    return (
      <button
        type="button"
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-2xl px-1 text-foreground-hover transition-colors hover:bg-surface-hover hover:text-foreground',
          isActive && 'bg-surface-hover text-foreground'
        )}
        onClick={onToggle}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          {item.icon}
        </div>
        <span className="text-sm font-medium">{item.label}</span>
      </button>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={() => onToggle()}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-2xl px-1 text-foreground-hover transition-colors hover:bg-surface-hover hover:text-foreground',
            isActive && 'bg-surface-hover text-foreground'
          )}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
              {item.icon}
            </div>
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <ChevronDown
              className={cn('h-5 w-5 transition-transform duration-200', isOpen && 'rotate-180')}
            />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-1 pt-1">
          {item.children?.map((child) => (
            <button
              type="button"
              key={child.id}
              className={cn(
                'flex h-10 items-center rounded-2xl pl-12 pr-3 text-sm font-normal text-foreground-hover transition-colors hover:bg-surface-hover hover:text-foreground',
                selectedChildId === child.id && 'bg-surface-hover text-foreground'
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
        <button
          type="button"
          className="group flex h-12 w-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-lg"
          onClick={onClick}
          aria-label={item.label}
          aria-pressed={isActive}
        >
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted group-hover:bg-surface-hover group-hover:text-foreground-hover',
              isActive && 'bg-surface-hover text-foreground-hover'
            )}
          >
            <div className="h-5 w-5 group-hover:scale-[1.2]">
              {item.icon}
            </div>
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
          'flex h-full flex-col justify-between bg-surface-overlay transition-[width] duration-300 ease-in-out',
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    aria-label="New conversation"
                  >
                    <MessageCirclePlus className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                    aria-label="Picture in picture"
                  >
                    <PictureInPicture2 className="h-5 w-5" />
                  </button>
                </div>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
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
                    isActive={activeNavId === item.id && !item.children?.some((c) => c.id === selectedChildId)}
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
              /* Collapsed navigation — click any item to expand */
              <nav className="flex flex-col items-center gap-1 pt-[18px]">
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
