import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import {
  cn,
  LiveRegion,
  type LiveRegionHandle,
  LoadingDots,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Skeleton,
  useMessageScroller,
  useMessageScrollerScrollable,
} from '@uipath/apollo-wind';
import React from 'react';
import { useChatMessages } from '../../headless/hooks/use-chat-messages';
import { useChatScrollAdapter } from '../../headless/hooks/use-chat-scroll-adapter';
import { useMessageInset } from '../../headless/hooks/use-message-inset';
import { useSettledReplies } from '../../headless/hooks/use-settled-replies';
import { useConversationSuggestions } from '../../headless/hooks/use-suggestions';
import { getMessageCopyText } from '../../headless/messages/message-groups';
import { useChatScroll } from '../../headless/providers/chat-scroll-provider';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { useLoading } from '../../headless/providers/loading-provider';
import { AutopilotChatMode, AutopilotChatRole, CHAT_MESSAGE_MAX_PADDING } from '../../service';
import { SuggestionList } from '../first-run/suggestion-list';
import { ChatMessage } from './chat-message';
import { ThinkingRow } from './thinking-row';

function InitialLoading() {
  return (
    <div
      data-slot="wind-chat-messages-skeleton"
      className="flex flex-col gap-3 p-4"
      aria-hidden="true"
    >
      <Skeleton className="ml-auto h-9 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

/**
 * Wires the service's scroll events to the scroller. A leaf, so the scroller's edge state
 * re-renders only this and not the transcript.
 */
function ScrollAdapter({ viewport }: { viewport: React.RefObject<HTMLDivElement | null> }) {
  const commands = useMessageScroller();
  const scrollable = useMessageScrollerScrollable();
  const layoutSettled = useLayoutSettled(viewport);
  useChatScrollAdapter({ commands, canScrollToStart: scrollable.start, layoutSettled });
  return null;
}

/**
 * True once the viewport has its real height and two frames have passed, so the scroller has
 * applied its opening position. Before that, edge changes are the layout settling.
 */
function useLayoutSettled(viewport: React.RefObject<HTMLDivElement | null>) {
  const [settled, setSettled] = React.useState(false);

  React.useEffect(() => {
    const element = viewport.current;
    if (settled || !element) {
      return;
    }

    let frame = 0;
    const settleAfterFrames = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => setSettled(true));
      });
    };
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            if (element.clientHeight > 0) settleAfterFrames();
          });
    observer?.observe(element);
    if (element.clientHeight > 0) settleAfterFrames();

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [settled, viewport]);

  return settled;
}

function Transcript({
  contentClassName,
  transcript,
}: {
  contentClassName?: string;
  transcript: ReturnType<typeof useChatMessages>;
}) {
  const { _ } = useLingui();
  const { groups, messages } = transcript;
  // The group holding the last assistant message keeps its actions visible. From what is
  // rendered, so feedback re-sending an older reply cannot move it.
  const latestReplyIndex = React.useMemo(() => {
    for (let index = groups.length - 1; index >= 0; index--) {
      if (groups[index]?.some(({ role }) => role === AutopilotChatRole.Assistant)) return index;
    }
    return -1;
  }, [groups]);

  const { showLoading, isLoadingMoreMessages } = useLoading();
  const { spacing, chatMode } = useChatState();
  const conversationSuggestions = useConversationSuggestions(messages);
  const storedInset = useMessageInset();
  // Wind's FullScreen does not publish ChatResize, so it takes the maximum directly.
  const userMessageInset =
    chatMode === AutopilotChatMode.FullScreen ? CHAT_MESSAGE_MAX_PADDING : storedInset;
  const viewportRef = React.useRef<HTMLDivElement>(null);

  const announcer = React.useRef<LiveRegionHandle>(null);
  const announcement = _(
    msg({ id: 'autopilot-chat.message.response-received', message: `New response` })
  );
  useSettledReplies(() => announcer.current?.announce(announcement));

  return (
    <>
      <ScrollAdapter viewport={viewportRef} />
      <MessageScrollerViewport
        ref={viewportRef}
        // Nothing scrolls sideways: also stops the trackpad's horizontal rubber band. Important, as
        // another sheet's `overscroll-contain` shorthand (hosts load several Tailwind builds) would
        // otherwise reset the x axis.
        className="overflow-x-hidden overscroll-x-none!"
        strings={{
          label: _(msg({ id: 'autopilot-chat.message.list-label', message: `Conversation` })),
        }}
      >
        <MessageScrollerContent
          // A log by role; announcements come from the live region, once per settled reply,
          // rather than for every streamed chunk.
          role="log"
          aria-live="off"
          // Material's spacing: the config's message spacing between groups, its group gap within.
          className={cn('gap-[var(--chat-message-spacing)] px-6 pt-3 pb-4', contentClassName)}
          style={
            {
              '--chat-message-spacing': `${spacing.messageSpacing}px`,
              '--chat-message-group-gap': `${spacing.messageGroupGap}px`,
              '--chat-user-message-inset': `${userMessageInset}px`,
            } as React.CSSProperties
          }
        >
          {groups.map((group, index) => {
            const isLatestReply = index === latestReplyIndex;
            const first = group[0];
            if (!first) {
              return null;
            }
            const actionsDisabled = group.length === 1 && !!first.disableActions;
            const isLastGroup = index === groups.length - 1;

            return (
              <MessageScrollerItem
                key={first.id}
                messageId={first.id}
                scrollAnchor={first.role === AutopilotChatRole.User}
                data-slot="wind-chat-message-group"
                // Hovering anywhere in the group reveals its actions. The bottom margins are
                // Material's, and hold the action bar under a group's last message, so showing it
                // on hover moves nothing.
                className={cn(
                  'group/message flex flex-col',
                  actionsDisabled
                    ? isLastGroup
                      ? 'mb-[14px]'
                      : 'mb-[-16px]'
                    : first.role === AutopilotChatRole.Assistant
                      ? 'mb-[30px]'
                      : // At least the bar's 28px plus 4px before the next group, for compact spacing.
                        'mb-[max(14px,calc(32px-var(--chat-message-spacing)))]'
                )}
              >
                {group.map((message, messageIndex) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLastInGroup={messageIndex === group.length - 1}
                    actionsDisabled={actionsDisabled}
                    isLatestReply={isLatestReply}
                    copyText={
                      messageIndex === group.length - 1 ? getMessageCopyText(group, message) : ''
                    }
                  />
                ))}
                {showLoading && isLastGroup && (
                  // Where Material puts it: one message spacing below the group's margin.
                  <div className="mt-[calc(14px+var(--chat-message-spacing))]">
                    <ThinkingRow />
                  </div>
                )}
                {isLastGroup && conversationSuggestions.attached && (
                  // Inside the last group rather than a row of its own (see the overlays below),
                  // below the action bar's 28px and one message spacing.
                  <SuggestionList
                    suggestions={conversationSuggestions.suggestions}
                    sendOnClick={conversationSuggestions.sendOnClick}
                    showLabel
                    animated
                    className="mt-[calc(28px+var(--chat-message-spacing))]"
                  />
                )}
              </MessageScrollerItem>
            );
          })}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      {/* Overlays rather than rows: the scroller tells new turns from replaced rows by counting
          its rows, so rows that come and go (a loading row, an empty state) would make it scroll
          to an earlier turn. */}
      {isLoadingMoreMessages && (
        <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center text-muted-foreground">
          <LoadingDots
            size="sm"
            strings={{
              label: _(
                msg({
                  id: 'autopilot-chat.message.loading-older',
                  message: `Loading older messages`,
                })
              ),
            }}
          />
        </div>
      )}
      {showLoading && groups.length === 0 && (
        <div className="absolute inset-x-4 top-4">
          <ThinkingRow />
        </div>
      )}
      <MessageScrollerButton
        strings={{
          scrollToLatest: _(
            msg({ id: 'autopilot-chat.message.scroll-to-bottom', message: `Scroll to bottom` })
          ),
        }}
      />
      <LiveRegion ref={announcer} />
    </>
  );
}

/**
 * The conversation: one scroller item per message group, following new content while the reader
 * is at the end and asking for older messages at the top when the conversation is paginated.
 */
export function MessageList({
  className,
  contentClassName,
}: {
  className?: string;
  /** Classes for the column inside the scroll area, e.g. a centered max width. */
  contentClassName?: string;
}) {
  // Held by the chat root, as for Material, so it survives a layout change remounting the list.
  const { autoScroll } = useChatScroll();
  const { skeletonLoader } = useLoading();
  // Here rather than in the transcript so it keeps listening while the skeleton shows.
  const transcript = useChatMessages();

  return (
    <div
      data-slot="wind-chat-messages"
      className={cn('relative flex min-h-0 flex-1 flex-col', className)}
    >
      {skeletonLoader ? (
        <InitialLoading />
      ) : (
        <MessageScrollerProvider autoScroll={autoScroll} defaultScrollPosition="end">
          <MessageScroller className="flex-1">
            <Transcript contentClassName={contentClassName} transcript={transcript} />
          </MessageScroller>
        </MessageScrollerProvider>
      )}
    </div>
  );
}
