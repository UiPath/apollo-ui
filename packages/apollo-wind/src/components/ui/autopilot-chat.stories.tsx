import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ArrowUp,
  AtSign,
  Bot,
  FileText,
  History,
  type LucideIcon,
  Maximize2,
  MessageCircleDashed,
  MessageSquarePlus,
  Minimize2,
  Paperclip,
  Play,
  Settings,
  SquarePen,
  X,
} from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';
import {
  Attachment,
  AttachmentContent,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from './attachment';
import { Avatar, AvatarFallback } from './avatar';
import { Badge } from './badge';
import { Bubble, BubbleContent } from './bubble';
import { Button } from './button';
import { Card, CardFooter, CardHeader, CardTitle } from './card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { EmptyState } from './empty-state';
import { InputGroup, InputGroupAddon, InputGroupButton } from './input-group';
import { Marker, MarkerContent } from './marker';
import { Message, MessageAvatar, MessageContent, MessageHeader } from './message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from './message-scroller';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

const meta = {
  title: 'Patterns/Autopilot Chat',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Chat panel pattern for Autopilot, assembled from the ported shadcn chat primitives (MessageScroller, Message, Bubble, Attachment, Marker) plus Card, EmptyState, InputGroup, and DropdownMenu for the surrounding panel chrome. The transcript is scripted for the demo: press Send to reveal the next turn.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface ScriptedTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  attachment?: { name: string };
}

const SCRIPT: ScriptedTurn[] = [
  {
    id: 'msg-1',
    role: 'user',
    text: "Here's the invoice batch for this week. Can you check which ones are ready for approval?",
    attachment: { name: 'invoices-week-27.pdf' },
  },
  {
    id: 'msg-2',
    role: 'assistant',
    text: 'I found 3 invoices in that batch. Want me to summarize them?',
  },
  { id: 'msg-3', role: 'user', text: 'Yes, go ahead.' },
  {
    id: 'msg-4',
    role: 'assistant',
    text: 'Invoice #4021 ($1,240) and #4022 ($860) are within policy and ready to approve. Invoice #4023 ($5,600) exceeds the auto-approval threshold and needs manual review.',
  },
  { id: 'msg-5', role: 'user', text: 'Approve the first two, and flag #4023 for me.' },
  {
    id: 'msg-6',
    role: 'assistant',
    text: 'Done. #4021 and #4022 are approved, and #4023 is flagged for your review in the queue.',
  },
];

const REPLY_DELAY_MS = 900;

const AGENT_MODES: { label: string; icon: LucideIcon }[] = [
  { label: 'Agent', icon: Bot },
  { label: 'Plan', icon: SquarePen },
  { label: 'Attended', icon: Play },
];

interface AutopilotChatPanelProps {
  className?: string;
  /** Mirrors the legacy ApChat's mode-dependent header: the expand/collapse
   * action hides in Embedded mode and flips icon/label in Fullscreen. */
  variant?: 'standard' | 'embedded' | 'fullscreen';
}

function AutopilotChatPanel({ className, variant = 'standard' }: AutopilotChatPanelProps) {
  const [revealedCount, setRevealedCount] = React.useState(0);
  const [isBusy, setIsBusy] = React.useState(false);
  const [agentMode, setAgentMode] = React.useState(AGENT_MODES[0].label);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const turns = SCRIPT.slice(0, revealedCount);
  const nextTurn = SCRIPT[revealedCount];
  const canSend = nextTurn?.role === 'user' && !isBusy;

  const handleSend = () => {
    if (!canSend) return;
    setRevealedCount((count) => count + 1);
    const reply = SCRIPT[revealedCount + 1];
    if (reply?.role === 'assistant') {
      setIsBusy(true);
      timeoutRef.current = setTimeout(() => {
        setRevealedCount((count) => count + 1);
        setIsBusy(false);
      }, REPLY_DELAY_MS);
    }
  };

  const handleReset = () => {
    clearTimeout(timeoutRef.current);
    setRevealedCount(0);
    setIsBusy(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Card
        className={cn('flex h-[560px] w-full max-w-sm flex-col gap-0 overflow-hidden', className)}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 border-b border-border-de-emp p-4">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-base">Autopilot</CardTitle>
            <Badge variant="info" className="px-1.5 py-0 text-[10px] leading-4">
              Preview
            </Badge>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  icon
                  size="3xs"
                  aria-label="New chat"
                  onClick={handleReset}
                  disabled={isBusy}
                >
                  <MessageSquarePlus />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New chat</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" icon size="3xs" aria-label="Settings">
                  <Settings />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" icon size="3xs" aria-label="History">
                  <History />
                </Button>
              </TooltipTrigger>
              <TooltipContent>History</TooltipContent>
            </Tooltip>
            {variant !== 'embedded' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    icon
                    size="3xs"
                    aria-label={variant === 'fullscreen' ? 'Collapse' : 'Expand'}
                  >
                    {variant === 'fullscreen' ? <Minimize2 /> : <Maximize2 />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{variant === 'fullscreen' ? 'Collapse' : 'Expand'}</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" icon size="3xs" aria-label="Close">
                  <X />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-hidden">
          {turns.length === 0 ? (
            <EmptyState
              className="h-full"
              icon={<MessageCircleDashed className="size-8 text-foreground-subtle" />}
              title="Morning!"
              description="What are we working on today? Press send to start a new conversation."
            />
          ) : (
            <MessageScrollerProvider autoScroll defaultScrollPosition="end">
              <MessageScroller className="h-full">
                <MessageScrollerViewport className="scroll-fade-y">
                  <MessageScrollerContent aria-busy={isBusy} className="p-4">
                    <Marker variant="separator">
                      <MarkerContent>Today</MarkerContent>
                    </Marker>
                    {turns.map((turn) => (
                      <MessageScrollerItem
                        key={turn.id}
                        messageId={turn.id}
                        scrollAnchor={turn.role === 'user'}
                      >
                        <Message align={turn.role === 'user' ? 'end' : 'start'}>
                          {turn.role === 'assistant' && (
                            <MessageAvatar>
                              <Avatar>
                                <AvatarFallback>AI</AvatarFallback>
                              </Avatar>
                            </MessageAvatar>
                          )}
                          <MessageContent>
                            {turn.role === 'assistant' && <MessageHeader>Autopilot</MessageHeader>}
                            <Bubble
                              align={turn.role === 'user' ? 'end' : 'start'}
                              variant={turn.role === 'user' ? 'default' : 'muted'}
                            >
                              <BubbleContent>{turn.text}</BubbleContent>
                            </Bubble>
                            {turn.attachment && (
                              <AttachmentGroup>
                                <Attachment size="sm">
                                  <AttachmentMedia>
                                    <FileText />
                                  </AttachmentMedia>
                                  <AttachmentContent>
                                    <AttachmentTitle>{turn.attachment.name}</AttachmentTitle>
                                  </AttachmentContent>
                                </Attachment>
                              </AttachmentGroup>
                            )}
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                    ))}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            </MessageScrollerProvider>
          )}
        </div>

        <CardFooter className="flex-col gap-2 p-4 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="w-full"
          >
            <InputGroup>
              <div className="h-14 w-full px-3 py-2.5">
                <span
                  className="line-clamp-2 text-sm opacity-60 data-[status=ready]:opacity-100"
                  data-status={canSend ? 'ready' : 'busy'}
                >
                  {nextTurn?.role === 'user' ? (
                    nextTurn.text
                  ) : (
                    <span className="text-muted-foreground">
                      {isBusy
                        ? 'Autopilot is replying…'
                        : 'No messages queued. Reset the conversation.'}
                    </span>
                  )}
                </span>
              </div>
              <InputGroupAddon align="block-end" className="pt-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InputGroupButton aria-label="Attach file" icon size="3xs">
                      <Paperclip />
                    </InputGroupButton>
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InputGroupButton aria-label="Add resource reference" icon size="3xs">
                      <AtSign />
                    </InputGroupButton>
                  </TooltipTrigger>
                  <TooltipContent>Add resource</TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <InputGroupButton aria-label="Agent mode" size="3xs">
                      {(() => {
                        const ActiveIcon =
                          AGENT_MODES.find((m) => m.label === agentMode)?.icon ?? Bot;
                        return <ActiveIcon />;
                      })()}
                      {agentMode}
                    </InputGroupButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" className="w-36">
                    {AGENT_MODES.map((mode) => (
                      <DropdownMenuItem key={mode.label} onClick={() => setAgentMode(mode.label)}>
                        <mode.icon
                          className={mode.label === agentMode ? 'text-brand' : undefined}
                        />
                        <span className={mode.label === agentMode ? 'text-brand' : undefined}>
                          {mode.label}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <InputGroupButton
                  type="submit"
                  variant="default"
                  icon
                  size="3xs"
                  disabled={!canSend}
                  className="ml-auto"
                >
                  <ArrowUp />
                  <span className="sr-only">Send</span>
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}

/**
 * Mirrors the legacy `ApChat` Embedded mode: the panel is portaled into a
 * consumer-owned container docked to a corner of the host page. In the
 * legacy Storybook harness that container is `fixed`, offset 24px from the
 * bottom-right, sized 400x600, with an elevated shadow and rounded corners,
 * all host-page choices, not something the panel itself controls.
 */
export const Embedded: Story = {
  name: 'Layout Embedded',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="relative h-screen w-full overflow-hidden bg-muted/30">
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Host application
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <AutopilotChatPanel variant="embedded" className="shadow-xl" />
      </div>
    </div>
  ),
};

/**
 * Mirrors the legacy `ApChat` FullScreen mode: no fixed positioning, the
 * panel just expands to fill the page. Same internal UI as `Layout Embedded`,
 * only the outer Card's size/chrome changes.
 */
export const Fullscreen: Story = {
  name: 'Layout Fullscreen',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="h-screen w-full">
      <AutopilotChatPanel
        variant="fullscreen"
        className="h-full max-w-none rounded-none border-0 shadow-none"
      />
    </div>
  ),
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border-subtle pt-4 first:border-t-0 first:pt-0">
      <span className="text-[11px] font-medium uppercase tracking-wide text-foreground-subtle">
        {label}
      </span>
      {children}
    </div>
  );
}

function ComponentsGallery() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Section label="Message + Bubble">
        <div className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-card p-4">
          <Message align="start">
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <MessageHeader>Autopilot</MessageHeader>
              <Bubble align="start" variant="muted">
                <BubbleContent>I found 3 invoices that need approval.</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
          <Message align="end">
            <MessageContent>
              <Bubble align="end" variant="default">
                <BubbleContent>Go ahead and summarize them.</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </div>
      </Section>

      <Section label="Attachment">
        <div className="rounded-xl border border-border-subtle bg-card p-4">
          <AttachmentGroup>
            <Attachment size="sm">
              <AttachmentMedia>
                <FileText />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>invoices-week-27.pdf</AttachmentTitle>
              </AttachmentContent>
            </Attachment>
          </AttachmentGroup>
        </div>
      </Section>

      <Section label="Marker">
        <div className="rounded-xl border border-border-subtle bg-card p-4">
          <Marker variant="separator">
            <MarkerContent>Today</MarkerContent>
          </Marker>
        </div>
      </Section>

      <Section label="MessageScroller">
        <MessageScrollerProvider autoScroll defaultScrollPosition="end">
          <MessageScroller className="h-40 rounded-xl border border-border-subtle bg-card">
            <MessageScrollerViewport className="scroll-fade-y">
              <MessageScrollerContent className="p-3">
                <MessageScrollerItem messageId="gallery-1">
                  <Message align="start">
                    <MessageContent>
                      <Bubble align="start" variant="muted">
                        <BubbleContent>Scrollable, auto-follows new content.</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
                <MessageScrollerItem messageId="gallery-2" scrollAnchor>
                  <Message align="end">
                    <MessageContent>
                      <Bubble align="end" variant="default">
                        <BubbleContent>Scroll up to see the button appear.</BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </Section>
    </div>
  );
}

export const Components: Story = {
  name: 'Components',
  parameters: {
    docs: {
      description: {
        story:
          'The individual primitives the Panel story is built from, shown in isolation. Message/Bubble render conversation turns; Attachment renders file cards; Marker renders separators/labels; MessageScroller provides the auto-following, anchor-aware scroll container.',
      },
    },
  },
  render: () => <ComponentsGallery />,
};
