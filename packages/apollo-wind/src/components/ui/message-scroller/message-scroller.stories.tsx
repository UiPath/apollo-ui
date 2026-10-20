import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { Bubble, BubbleContent } from '../bubble';
import { Button } from '../button';
import { Marker, MarkerContent } from '../marker';
import { Message, MessageContent } from '../message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerVisibility,
} from './message-scroller';

const meta: Meta<typeof MessageScroller> = {
  title: 'Chat/Components/Message Scroller',
  component: MessageScroller,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The scroll container for a conversation, styled over the vendored shadcn MessageScroller primitive. It follows new content while the reader is at the end, keeps the position when older messages are prepended, anchors a new turn to the top of the viewport, and shows a jump button when the reader scrolls away. Wrap the tree in MessageScrollerProvider; the hooks work anywhere inside it. The frame needs a definite height from its consumer (h-*, h-full, or flex-1 inside a sized flex column); every example here uses h-80.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const LINES = [
  'Can you check which invoices are ready for approval?',
  'Three are within policy. One exceeds the threshold.',
  'Approve the ones within policy.',
  'Done. The remaining one is flagged for your review.',
  'What was the total of the approved ones?',
  'The two approved invoices total $2,100.',
];

function makeTurns(count: number, offset = 0): Turn[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + offset;
    return {
      id: `turn-${n}`,
      role: n % 2 === 0 ? 'user' : 'assistant',
      text: `${n + 1}. ${LINES[n % LINES.length]}`,
    };
  });
}

function TurnItem({ turn }: { turn: Turn }) {
  return (
    <MessageScrollerItem messageId={turn.id} scrollAnchor={turn.role === 'user'}>
      <Message align={turn.role === 'user' ? 'end' : 'start'}>
        <MessageContent>
          <Bubble
            align={turn.role === 'user' ? 'end' : 'start'}
            variant={turn.role === 'user' ? 'default' : 'muted'}
          >
            <BubbleContent>{turn.text}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

function Conversation({ turns, busy }: { turns: Turn[]; busy?: boolean }) {
  return (
    <MessageScroller className="h-80 w-[420px] rounded-xl border border-border-subtle bg-card">
      <MessageScrollerViewport className="scroll-fade-y" aria-label="Conversation">
        <MessageScrollerContent aria-busy={busy}>
          <Marker variant="separator">
            <MarkerContent>Today</MarkerContent>
          </Marker>
          {turns.map((turn) => (
            <TurnItem key={turn.id} turn={turn} />
          ))}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  );
}

export const Basic: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Starts at the end. Scroll up and the jump button appears; it fades out again at the bottom. The viewport has the scroll-fade-y utility so the edges soften while there is more to read.',
      },
    },
  },
  render: () => (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <Conversation turns={makeTurns(14)} />
    </MessageScrollerProvider>
  ),
};

const STREAMED_REPLIES = [
  'Three invoices are within policy and one exceeds the auto-approval threshold. Invoice 4021 for $1,240 and invoice 4022 for $860 both match a purchase order and sit below the $2,500 limit, so they can be approved as they are. Invoice 4023 for $5,600 has no matching purchase order and is above the limit, which means it needs a manual review by someone with approval rights for that cost centre before anything else happens.',
  'I have approved 4021 and 4022 and attached the approval note to each record. For 4023 I opened a review task, assigned it to the finance queue, and added the missing purchase order as the blocking reason so the reviewer sees it first. You will get a notification when the task is picked up, and I will summarise the outcome here once it closes.',
  "The two approved invoices total $2,100. Together with last week they bring the month to $18,430 against a budget of $24,000, so there is $5,570 left. If 4023 is approved after review the month closes at $24,030, which is $30 over, so you may want to hold one of next week's smaller invoices until the first of the month.",
];

const STREAM_INTERVAL_MS = 45;

interface StreamingTurn extends Turn {
  streaming?: boolean;
}

/**
 * Streams each reply in word by word so the viewport has to keep up with content that grows
 * below the fold. A short acknowledgement comes first, then the long answer, so follow also
 * crosses a message boundary.
 */
function StreamingDemo() {
  const [turns, setTurns] = React.useState<StreamingTurn[]>(() => makeTurns(4));
  const [busy, setBusy] = React.useState(false);
  const timers = React.useRef<number[]>([]);
  const replyIndex = React.useRef(0);

  React.useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const streamReply = (id: string, text: string, onDone: () => void) => {
    const words = text.split(' ');
    let count = 0;
    const tick = () => {
      count += 1;
      const partial = words.slice(0, count).join(' ');
      setTurns((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, text: partial, streaming: count < words.length } : t
        )
      );
      if (count < words.length) {
        timers.current.push(window.setTimeout(tick, STREAM_INTERVAL_MS));
      } else {
        onDone();
      }
    };
    timers.current.push(window.setTimeout(tick, STREAM_INTERVAL_MS));
  };

  const send = () => {
    const n = turns.length;
    const userTurn: StreamingTurn = {
      id: `turn-${n}`,
      role: 'user',
      text: `${n + 1}. ${LINES[(n * 2) % LINES.length]}`,
    };
    const ack: StreamingTurn = {
      id: `turn-${n + 1}`,
      role: 'assistant',
      text: '',
      streaming: true,
    };
    const answer: StreamingTurn = {
      id: `turn-${n + 2}`,
      role: 'assistant',
      text: '',
      streaming: true,
    };
    const reply = STREAMED_REPLIES[replyIndex.current % STREAMED_REPLIES.length];
    replyIndex.current += 1;

    setBusy(true);
    setTurns((prev) => [...prev, userTurn, ack]);
    timers.current.push(
      window.setTimeout(() => {
        streamReply(ack.id, 'Looking at the batch now.', () => {
          setTurns((prev) => [...prev, answer]);
          streamReply(answer.id, reply, () => setBusy(false));
        });
      }, 400)
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <MessageScrollerProvider autoScroll defaultScrollPosition="end">
        <MessageScroller className="h-80 w-[420px] rounded-xl border border-border-subtle bg-card">
          <MessageScrollerViewport className="scroll-fade-y" aria-label="Conversation">
            <MessageScrollerContent aria-busy={busy}>
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
                    <MessageContent>
                      <Bubble
                        align={turn.role === 'user' ? 'end' : 'start'}
                        variant={turn.role === 'user' ? 'default' : 'muted'}
                      >
                        <BubbleContent>
                          {turn.text || <span className="shimmer">Thinking</span>}
                          {turn.streaming && turn.text ? (
                            <span aria-hidden="true" className="ml-0.5 animate-pulse">
                              ▍
                            </span>
                          ) : null}
                        </BubbleContent>
                      </Bubble>
                    </MessageContent>
                  </Message>
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <Button size="sm" onClick={send} disabled={busy} className="self-start">
        {busy ? 'Streaming reply...' : 'Send next turn'}
      </Button>
    </div>
  );
}

export const FollowsNewTurns: Story = {
  name: 'Follows new turns',
  parameters: {
    docs: {
      description: {
        story:
          'Each send adds a user turn, which is a scroll anchor, so it pins to the top of the viewport. The reply then streams in word by word below it, first a short acknowledgement and then a long answer, and the viewport keeps the growing text in view. Scroll up while a reply is streaming to see follow release and the jump button appear; use it to catch up.',
      },
    },
  },
  render: () => <StreamingDemo />,
};

function PrependDemo() {
  const [turns, setTurns] = React.useState(() => makeTurns(8, 20));
  const loadOlder = () => {
    const first = Number(turns[0].id.replace('turn-', ''));
    setTurns((prev) => [...makeTurns(6, Math.max(0, first - 6)), ...prev]);
  };
  return (
    <div className="flex flex-col gap-3">
      <MessageScrollerProvider defaultScrollPosition="end">
        <MessageScroller className="h-80 w-[420px] rounded-xl border border-border-subtle bg-card">
          <MessageScrollerViewport className="scroll-fade-y" preserveScrollOnPrepend>
            <MessageScrollerContent>
              {turns.map((turn) => (
                <TurnItem key={turn.id} turn={turn} />
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>
      <Button size="sm" variant="outline" onClick={loadOlder} className="self-start">
        Load older messages
      </Button>
    </div>
  );
}

export const PrependHistory: Story = {
  name: 'Prepend history',
  parameters: {
    docs: {
      description: {
        story:
          'With preserveScrollOnPrepend on the viewport, loading older messages above keeps what the reader was looking at in place.',
      },
    },
  },
  render: () => <PrependDemo />,
};

function JumpControls({ turns }: { turns: Turn[] }) {
  const { scrollToMessage, scrollToStart, scrollToEnd } = useMessageScroller();
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility();
  return (
    <div className="flex w-[420px] flex-col gap-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => scrollToStart()}>
          Start
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            scrollToMessage(turns[Math.floor(turns.length / 2)].id, { align: 'start' })
          }
        >
          Middle
        </Button>
        <Button size="sm" variant="outline" onClick={() => scrollToEnd()}>
          End
        </Button>
      </div>
      <span>Current anchor: {currentAnchorId ?? 'none'}</span>
      <span>Visible: {visibleMessageIds.join(', ') || 'none'}</span>
    </div>
  );
}

export const JumpToMessage: Story = {
  name: 'Jump to message',
  parameters: {
    docs: {
      description: {
        story:
          'useMessageScroller exposes scrollToStart, scrollToEnd and scrollToMessage(id). useMessageScrollerVisibility reports the current anchor and the visible message ids, which a navigation rail or read receipts can use.',
      },
    },
  },
  render: () => {
    const turns = makeTurns(16);
    return (
      <MessageScrollerProvider defaultScrollPosition="end">
        <div className="flex flex-col gap-3">
          <Conversation turns={turns} />
          <JumpControls turns={turns} />
        </div>
      </MessageScrollerProvider>
    );
  },
};

export const CustomButtonStrings: Story = {
  name: 'Strings',
  parameters: {
    docs: {
      description: {
        story:
          'The viewport region name and the jump button label come from their strings props, so a host can localise them. An explicit aria-label on the viewport still wins over strings.label. Pass children to the button instead to replace its whole content.',
      },
    },
  },
  render: () => (
    <MessageScrollerProvider defaultScrollPosition="start">
      <MessageScroller className="h-80 w-[420px] rounded-xl border border-border-subtle bg-card">
        <MessageScrollerViewport className="scroll-fade-y" strings={{ label: 'Nachrichten' }}>
          <MessageScrollerContent>
            {makeTurns(14).map((turn) => (
              <TurnItem key={turn.id} turn={turn} />
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton strings={{ scrollToLatest: 'Neueste anzeigen' }} />
      </MessageScroller>
    </MessageScrollerProvider>
  ),
};
