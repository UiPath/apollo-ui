import {
  Bot,
  Brain,
  ChevronUp,
  Copy,
  House,
  MessageCircle,
  PanelRightOpen,
  RefreshCcw,
  Search,
  ThumbsDown,
  ThumbsUp,
  Workflow,
} from 'lucide-react';
import * as React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import { ChatComposer } from '@/components/custom/chat-composer';

// ============================================================================
// Types
// ============================================================================

export interface FlowPanelNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface FlowPanelToolItem {
  icon: 'search' | 'bot';
  title: string;
  description: string;
}

export interface FlowPanelToolCard {
  title: string;
  items: FlowPanelToolItem[];
}

export interface FlowPanelChatMessage {
  id: string;
  role: 'user' | 'assistant';
  /** Text content — user bubble or simple assistant text */
  content?: string;
  /** Collapsible reasoning trace label shown above tool card */
  traceLabel?: string;
  /** Expandable tool/agent card */
  toolCard?: FlowPanelToolCard;
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
    <div className="flex h-9 w-9 items-center justify-center overflow-clip rounded-lg bg-[#0092b8] shadow-sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-[22px] w-[22px]"
        aria-hidden="true"
      >
        {/* i — vertical bar */}
        <path
          d="M18.57 11.4014H18.273C17.3139 11.4014 16.7183 12.002 16.7183 12.9686V22.4331C16.7183 23.3997 17.3139 24.0003 18.273 24.0003H18.57C19.5289 24.0003 20.1246 23.3997 20.1246 22.4331V12.9686C20.1246 12.002 19.5289 11.4014 18.57 11.4014Z"
          fill="white"
        />
        {/* ✦ sparkle — large */}
        <path
          d="M22.689 5.54073C20.5215 5.19295 18.8111 3.48437 18.463 1.31918C18.4564 1.27831 18.4034 1.27831 18.3968 1.31918C18.0487 3.48437 16.3383 5.19295 14.1708 5.54073C14.1299 5.54728 14.1299 5.60028 14.1708 5.60683C16.3383 5.95453 18.0487 7.66319 18.3968 9.82838C18.4034 9.86925 18.4564 9.86925 18.463 9.82838C18.8111 7.66319 20.5215 5.95453 22.689 5.60683C22.73 5.60028 22.73 5.54728 22.689 5.54073ZM20.5595 5.59031C19.4757 5.76416 18.6205 6.61848 18.4465 7.70108C18.4432 7.72151 18.4167 7.72151 18.4134 7.70108C18.2393 6.61848 17.3841 5.76416 16.3003 5.59031C16.2799 5.58703 16.2799 5.56053 16.3003 5.55725C17.3841 5.38337 18.2393 4.52907 18.4134 3.44648C18.4167 3.42604 18.4432 3.42604 18.4465 3.44648C18.6205 4.52907 19.4757 5.38337 20.5595 5.55725C20.5799 5.56053 20.5799 5.58703 20.5595 5.59031Z"
          fill="white"
        />
        {/* ✦ sparkle — small */}
        <path
          d="M23.9846 2.15915C22.9008 2.33301 22.0456 3.18733 21.8716 4.26993C21.8683 4.29036 21.8418 4.29036 21.8385 4.26993C21.6645 3.18733 20.8092 2.33301 19.7255 2.15915C19.705 2.15588 19.705 2.12938 19.7255 2.1261C20.8092 1.95221 21.6645 1.09792 21.8385 0.0153254C21.8418 -0.00510845 21.8683 -0.00510845 21.8716 0.0153254C22.0456 1.09792 22.9008 1.95221 23.9846 2.1261C24.0051 2.12938 24.0051 2.15588 23.9846 2.15915Z"
          fill="white"
        />
        {/* U */}
        <path
          d="M12.7647 6.85913H12.4063C11.4704 6.85913 10.889 7.4373 10.889 8.36778V15.8529C10.889 19.4018 9.80316 20.8493 7.14102 20.8493C4.47888 20.8493 3.393 19.3952 3.393 15.8306V8.36778C3.393 7.4373 2.8116 6.85913 1.87582 6.85913H1.51723C0.581398 6.85913 0 7.4373 0 8.36778V15.8529C0 21.259 2.40265 24.0001 7.14102 24.0001C11.8794 24.0001 14.2819 21.259 14.2819 15.8529V8.36778C14.2819 7.4373 13.7005 6.85913 12.7647 6.85913Z"
          fill="white"
        />
      </svg>
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
  onLogoClick,
  hasShadow,
}: {
  navItems: FlowPanelNavItem[];
  activeId: string;
  onNavClick: (id: string) => void;
  onLogoClick: () => void;
  hasShadow?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex w-[60px] shrink-0 flex-col justify-between bg-surface-overlay',
        hasShadow && 'shadow-[0px_4px_16px_0px_rgba(0,0,0,0.25)]'
      )}
    >
      {/* Top: logo + nav */}
      <div className="flex flex-col">
        <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onLogoClick}
                aria-label="UiPath"
                className="rounded-lg transition-opacity hover:opacity-80"
              >
                <UiPathLogo />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">UiPath</TooltipContent>
          </Tooltip>
        </div>
        <nav className="flex flex-col items-center gap-1 pt-[18px]">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="group flex h-12 w-full items-center justify-center"
                  onClick={() => onNavClick(item.id)}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted group-hover:bg-surface-hover group-hover:text-foreground-hover',
                      activeId === item.id && 'bg-surface-hover text-foreground-hover'
                    )}
                  >
                    <div className="h-5 w-5 group-hover:scale-[1.2]">{item.icon}</div>
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
        <Avatar className="h-8 w-8 bg-surface-raised">
          <AvatarFallback className="bg-surface-raised text-xs text-foreground-muted">
            U
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

// ============================================================================
// Internal: Chat message components
// ============================================================================

const toolIconMap = { search: Search, bot: Bot } as const;

function ToolCard({ card }: { card: FlowPanelToolCard }) {
  const [open, setOpen] = React.useState(true);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="overflow-hidden rounded-2xl border border-surface-hover">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-surface-hover p-4"
          >
            <span className="whitespace-nowrap text-sm font-normal leading-5 text-foreground">
              {card.title}
            </span>
            <ChevronUp
              className={cn(
                'h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-200',
                !open && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>
        {/* Body */}
        <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <div className="flex flex-col gap-2 pb-4 pt-1">
            <p className="px-4 py-[5px] text-xs text-foreground-muted">Agents and tools used</p>
            <div className="flex flex-col gap-3">
              {card.items.map((item, i) => {
                const Icon = toolIconMap[item.icon];
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static display list
                  <div key={i} className="flex items-start gap-2.5 pl-4 pr-9">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <Icon className="h-4 w-4 text-foreground-secondary" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-normal leading-4 text-foreground">{item.title}</p>
                      <p className="text-sm font-normal leading-5 text-foreground-muted">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function MessageActions() {
  return (
    <div className="flex items-center gap-2">
      {(
        [
          { icon: RefreshCcw, label: 'Refresh' },
          { icon: ThumbsUp, label: 'Thumbs up' },
          { icon: ThumbsDown, label: 'Thumbs down' },
          { icon: Copy, label: 'Copy' },
        ] as const
      ).map(({ icon: Icon, label }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          className="flex h-6 w-6 items-center justify-center overflow-hidden rounded text-foreground-muted hover:text-foreground"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function DefaultChatContent({ chatMessages }: { chatMessages: FlowPanelChatMessage[] }) {
  const [openTraces, setOpenTraces] = React.useState<Record<string, boolean>>({});

  const isTraceOpen = (id: string) => openTraces[id] ?? true;

  const toggleTrace = (id: string) => {
    setOpenTraces((prev) => ({ ...prev, [id]: !isTraceOpen(id) }));
  };

  return (
    <div className="flex flex-1 flex-col justify-end gap-7 overflow-y-auto py-2">
      {chatMessages.map((msg) => {
        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="flex flex-col items-end pl-4 w-full">
              <div className="max-w-[360px] rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[4px] bg-surface-raised pl-6 pr-9 py-4">
                <p className="text-sm font-normal leading-6 text-foreground-secondary">
                  {msg.content}
                </p>
              </div>
            </div>
          );
        }

        const traceOpen = isTraceOpen(msg.id);

        return (
          <div key={msg.id} className="flex flex-col gap-4">
            {msg.traceLabel && (
              <Collapsible open={traceOpen} onOpenChange={() => toggleTrace(msg.id)}>
                <CollapsibleTrigger asChild>
                  <button type="button" className="flex items-center gap-2 text-left">
                    <Brain className="h-4 w-4 shrink-0 text-foreground-muted" />
                    <span className="text-sm font-medium leading-5 text-foreground-muted">
                      {msg.traceLabel}
                    </span>
                    <ChevronUp
                      className={cn(
                        'h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-200',
                        !traceOpen && 'rotate-180'
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                {msg.toolCard && (
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
                    <div className="flex flex-col gap-2 pt-4">
                      <ToolCard card={msg.toolCard} />
                      <MessageActions />
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            )}
            {msg.content && (
              <p className="text-sm font-normal leading-5 text-foreground-muted">{msg.content}</p>
            )}
          </div>
        );
      })}
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
    <div className="flex h-full w-[420px] shrink-0 flex-col justify-between overflow-hidden bg-surface-overlay px-4 pb-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-base font-bold leading-9 tracking-tight text-foreground">Flow</span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          onClick={onClose}
          aria-label="Close panel"
        >
          <PanelRightOpen className="h-5 w-5" />
        </button>
      </div>

      {/* Chat content */}
      {expandedContent ?? <DefaultChatContent chatMessages={chatMessages} />}

      {/* Composer */}
      <div className="pt-12">
        <ChatComposer placeholder="Ask me to help build your Flow" />
      </div>
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
 * - **Expanded**: Icon rail + 420px chat panel with Flow title,
 *   chat messages, and composer input
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
    onOpenChange?.(true);
  };

  const handleLogoClick = () => {
    onOpenChange?.(!open);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('flex h-full', className)}>
        <IconRail
          navItems={navItems}
          activeId={activeId}
          onNavClick={handleNavClick}
          onLogoClick={handleLogoClick}
          hasShadow={open}
        />
        <div
          className="overflow-hidden shrink-0"
          style={{
            width: open ? 420 : 0,
            transition: 'width 300ms ease-out',
          }}
        >
          <ExpandedPanel
            chatMessages={chatMessages}
            expandedContent={expandedContent}
            onClose={() => onOpenChange?.(false)}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

// Default nav items matching Figma (Chat, Home, Flows)
export const defaultFlowNavItems: FlowPanelNavItem[] = [
  { id: 'chat', label: 'Chat', icon: <MessageCircle className="h-full w-full" /> },
  { id: 'home', label: 'Home', icon: <House className="h-full w-full" /> },
  { id: 'flows', label: 'Flows', icon: <Workflow className="h-full w-full" /> },
];
