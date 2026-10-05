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
import {
  InputGroup,
  InputGroupBody,
  InputGroupButton,
  InputGroupRow,
  InputGroupTextarea,
} from './input-group';
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
  title: 'Chat/Patterns',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Chat panel pattern for Autopilot, assembled from the chat primitives (MessageScroller, Message, Bubble, Attachment, Marker) plus Card, EmptyState, InputGroup and DropdownMenu for the panel chrome. The transcript is scripted for the demo: press Send to reveal the next turn. The service-driven version of this panel is being built as @uipath/apollo-react/chat on top of these primitives.',
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
  /**
   * Mirrors ApChat's mode-dependent header: the expand and collapse action hides in Embedded mode
   * and flips its icon and label in Fullscreen.
   */
  variant?: 'standard' | 'embedded' | 'fullscreen';
}

function AutopilotChatPanel({ className, variant = 'standard' }: AutopilotChatPanelProps) {
  const [revealedCount, setRevealedCount] = React.useState(0);
  const [isBusy, setIsBusy] = React.useState(false);
  const [agentMode, setAgentMode] = React.useState(AGENT_MODES[0].label);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const turns = SCRIPT.slice(0, revealedCount);
  const nextTurn = SCRIPT[revealedCount];
  const canSend = nextTurn?.role === 'user' && !isBusy;
  const ActiveModeIcon = AGENT_MODES.find((m) => m.label === agentMode)?.icon ?? Bot;

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

  const composerValue =
    nextTurn?.role === 'user'
      ? nextTurn.text
      : isBusy
        ? 'Autopilot is replying...'
        : 'No messages queued. Start a new chat to replay the conversation.';

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
                <MessageScrollerViewport className="scroll-fade-y" aria-label="Conversation">
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
            {/* A block layout stacks the textarea row above a toolbar body. */}
            <InputGroup layout="block">
              <InputGroupRow className="py-2">
                <InputGroupTextarea
                  aria-label="Message"
                  readOnly
                  minRows={1}
                  maxRows={4}
                  value={composerValue}
                  className={cn(!canSend && 'text-muted-foreground')}
                />
              </InputGroupRow>
              <InputGroupBody className="flex items-center gap-1 px-2 py-1.5">
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
                      <ActiveModeIcon />
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
              </InputGroupBody>
            </InputGroup>
          </form>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}

/**
 * Mirrors ApChat's Embedded mode: the panel is portaled into a consumer-owned container docked
 * to a corner of the host page. In the legacy Storybook harness that container is fixed, offset
 * 24px from the bottom-right, sized 400x600, with an elevated shadow and rounded corners. All of
 * that is the host page's choice, not the panel's.
 */
export const Embedded: Story = {
  name: 'Embedded',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="relative h-screen w-full overflow-hidden bg-muted/30">
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Host application
      </div>
      <div className="fixed right-6 bottom-6 z-50">
        <AutopilotChatPanel variant="embedded" className="shadow-xl" />
      </div>
    </div>
  ),
};

/**
 * Mirrors ApChat's FullScreen mode: no fixed positioning, the panel expands to fill the page.
 * Same internal UI as Embedded, only the outer Card's size and chrome change.
 */
export const Fullscreen: Story = {
  name: 'Fullscreen',
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
