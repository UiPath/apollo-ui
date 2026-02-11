import { CornerDownLeft, House, MessageCircle, PanelRightOpen, Plus, Workflow } from 'lucide-react';
import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface FlowPanelNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface FlowPanelChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface FlowPanelProps {
  className?: string;
  /** Whether the expanded panel is open */
  open?: boolean;
  /** Callback to toggle expanded panel */
  onOpenChange?: (open: boolean) => void;
  /** Navigation items shown as icon buttons */
  navItems?: FlowPanelNavItem[];
  /** Currently active nav item ID */
  activeNavId?: string;
  /** Callback when a nav item is clicked */
  onNavChange?: (navId: string) => void;
  /** Chat messages to display in the expanded panel */
  chatMessages?: FlowPanelChatMessage[];
  /** Content to render inside the expanded panel (overrides default chat UI) */
  expandedContent?: React.ReactNode;
}

// ============================================================================
// Internal: UiPath logo
// ============================================================================

function UiPathLogo() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-future-accent shadow-sm">
      <span className="text-xs font-bold text-future-foreground-on-accent select-none">Ui</span>
    </div>
  );
}

// ============================================================================
// Internal: Icon rail (always 60px)
// ============================================================================

function IconRail({
  navItems,
  activeId,
  onNavClick,
  hasShadow,
}: {
  navItems: FlowPanelNavItem[];
  activeId: string;
  onNavClick: (id: string) => void;
  hasShadow?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex w-[60px] shrink-0 flex-col justify-between bg-future-surface-overlay',
        hasShadow && 'shadow-[0px_4px_16px_0px_rgba(0,0,0,0.25)]'
      )}
    >
      {/* Top: logo + nav */}
      <div className="flex flex-col">
        <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center">
          <UiPathLogo />
        </div>
        <nav className="flex flex-col items-center pt-[18px]">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    'flex h-12 w-full items-center justify-center text-future-foreground-muted transition-colors hover:text-future-foreground',
                    activeId === item.id && 'text-future-accent-foreground'
                  )}
                  onClick={() => onNavClick(item.id)}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      activeId === item.id && 'bg-future-surface-hover'
                    )}
                  >
                    {item.icon}
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </div>

      {/* Footer: avatar */}
      <div className="flex h-[60px] shrink-0 items-center justify-center">
        <Avatar className="h-8 w-8 bg-future-surface-raised">
          <AvatarFallback className="bg-future-surface-raised text-xs text-future-foreground-muted">
            U
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

// ============================================================================
// Internal: Default chat content for expanded panel
// ============================================================================

function DefaultChatContent({ chatMessages }: { chatMessages: FlowPanelChatMessage[] }) {
  return (
    <div className="flex flex-1 flex-col justify-end gap-7 overflow-y-auto">
      {chatMessages.map((msg) =>
        msg.role === 'user' ? (
          <div key={msg.id} className="flex flex-col items-end pr-6">
            <div className="max-w-[360px] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[4px] bg-future-surface-raised px-6 py-4">
              <p className="text-base leading-6 tracking-[-0.4px] text-future-foreground">
                {msg.content}
              </p>
            </div>
          </div>
        ) : (
          <div key={msg.id} className="flex items-center gap-2">
            <p className="text-base font-medium leading-5 text-future-foreground-muted">
              {msg.content}
            </p>
          </div>
        )
      )}
    </div>
  );
}

// ============================================================================
// Internal: Chat input
// ============================================================================

function ChatInput() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-12 items-center rounded-2xl border border-future-border bg-future-surface-raised px-4">
        <input
          type="text"
          placeholder="Ask me to help build your Flow"
          className="flex-1 bg-transparent text-sm text-future-foreground placeholder:text-future-foreground-subtle outline-none"
          readOnly
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-future-foreground-muted hover:text-future-foreground"
            aria-label="Add attachment"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-future-foreground-muted hover:text-future-foreground"
            aria-label="Add workflow"
          >
            <Workflow className="h-5 w-5" />
          </button>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-future-accent text-future-foreground-on-accent"
          aria-label="Submit message"
        >
          <CornerDownLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Internal: Expanded panel
// ============================================================================

function ExpandedPanel({
  chatMessages,
  expandedContent,
  onClose,
}: {
  chatMessages: FlowPanelChatMessage[];
  expandedContent?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col justify-between overflow-hidden bg-future-surface-overlay px-4 pb-4 pt-3">
      {/* Header: Flow / Autopilot tabs + close */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-base tracking-[-0.6px] leading-9">
          <span className="font-bold text-future-foreground">Flow</span>
          <span className="font-medium text-future-foreground-subtle">Autopilot</span>
        </div>
        <button
          className="text-future-foreground-muted transition-colors hover:text-future-foreground"
          onClick={onClose}
          aria-label="Close panel"
        >
          <PanelRightOpen className="h-5 w-5" />
        </button>
      </div>

      {/* Chat content */}
      {expandedContent ?? <DefaultChatContent chatMessages={chatMessages} />}

      {/* Chat input */}
      <ChatInput />
    </div>
  );
}

// ============================================================================
// FlowPanel
// ============================================================================

/**
 * Flow template left panel with collapsed icon rail and optional expanded
 * chat panel.
 *
 * - **Collapsed**: 60px icon rail with logo, nav icons, and avatar
 * - **Expanded**: Icon rail + 420px chat panel with Flow/Autopilot tabs,
 *   chat messages, and input field
 */
export function FlowPanel({
  className,
  open = false,
  onOpenChange,
  navItems = [],
  activeNavId,
  onNavChange,
  chatMessages = [],
  expandedContent,
}: FlowPanelProps) {
  const [internalActiveId, setInternalActiveId] = React.useState(navItems[0]?.id ?? '');
  const activeId = activeNavId ?? internalActiveId;

  const handleNavClick = (id: string) => {
    setInternalActiveId(id);
    onNavChange?.(id);
    // Clicking a nav item opens the expanded panel
    onOpenChange?.(true);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('flex h-full', className)}>
        <IconRail
          navItems={navItems}
          activeId={activeId}
          onNavClick={handleNavClick}
          hasShadow={open}
        />
        {open && (
          <ExpandedPanel
            chatMessages={chatMessages}
            expandedContent={expandedContent}
            onClose={() => onOpenChange?.(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

// Default nav items matching Figma (Chat, Home, Flows)
export const defaultFlowNavItems: FlowPanelNavItem[] = [
  { id: 'chat', label: 'Chat', icon: <MessageCircle className="h-5 w-5" /> },
  { id: 'home', label: 'Home', icon: <House className="h-5 w-5" /> },
  { id: 'flows', label: 'Flows', icon: <Workflow className="h-5 w-5" /> },
];
