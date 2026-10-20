import React from 'react';

import {
  AutopilotChatEvent,
  AutopilotChatInterceptableEvent,
  AutopilotChatInternalEvent,
} from '../../service';
import { useChatService } from '../providers/chat-service.provider';
import { useLoading } from '../providers/loading-provider';
import { useStreaming } from '../providers/streaming-provider';
import { publishChatEvent } from '../utils/publish-chat-event';

export type ChatScrollBehavior = 'instant' | 'smooth';

/** The commands of the renderer's scroll engine the adapter drives. */
export interface ChatScrollCommands {
  scrollToEnd: (options?: { behavior?: ScrollBehavior }) => unknown;
}

export interface ChatScrollAdapterOptions {
  commands: ChatScrollCommands;
  /** Whether the viewport can still scroll toward the start, i.e. is not at the top. */
  canScrollToStart: boolean;
  /**
   * Whether the viewport has its real size. Until then edge changes are layout settling, not the
   * reader arriving at the top, and do not ask for older messages.
   */
  layoutSettled: boolean;
}

/**
 * Maps chat service events onto a renderer's scroll engine, knowing nothing about how it scrolls:
 * a new turn, a new chat or an opened conversation return to the latest message (instantly while
 * streaming); a replaced conversation or a mode change jumps there instantly once rendered, but
 * prepended older messages do not; and reaching the top asks the host for older messages, once per
 * arrival, when the conversation is paginated, nothing is loading and the host has more.
 */
export function useChatScrollAdapter({
  commands,
  canScrollToStart,
  layoutSettled,
}: ChatScrollAdapterOptions) {
  const chatService = useChatService();
  const { streaming } = useStreaming();
  const { isLoadingMoreMessages, hasMoreMessages } = useLoading();
  const commandsRef = React.useRef(commands);
  commandsRef.current = commands;
  const streamingRef = React.useRef(streaming);
  streamingRef.current = streaming;

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    let frame = 0;
    // `prependOlderMessages` announces itself, then replaces the conversation; that replacement
    // keeps the reader's position instead of jumping to the end.
    let prepending = false;
    const toLatest = () =>
      commandsRef.current.scrollToEnd({ behavior: streamingRef.current ? 'instant' : 'smooth' });
    // After the new transcript has rendered, so the end is the new end.
    const toLatestInstantlyAfterRender = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => commandsRef.current.scrollToEnd({ behavior: 'instant' }));
    };
    const internal = chatService.__internalService__;

    const unsubscribes = [
      chatService.intercept(AutopilotChatInterceptableEvent.Request, () => {
        toLatest();
      }),
      chatService.on(AutopilotChatEvent.NewChat, toLatest),
      chatService.on(AutopilotChatEvent.OpenConversation, toLatest),
      internal.on(AutopilotChatInternalEvent.PrependOlderMessages, () => {
        prepending = true;
      }),
      chatService.on(AutopilotChatEvent.SetConversation, () => {
        if (prepending) {
          prepending = false;
          return;
        }
        toLatestInstantlyAfterRender();
      }),
      chatService.on(AutopilotChatEvent.ModeChange, toLatestInstantlyAfterRender),
    ];

    return () => {
      cancelAnimationFrame(frame);
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [chatService]);

  // Fires on arriving at the top, not while staying there, so each visit asks once. Starts from
  // wherever the settled layout is.
  const wasAwayFromTop = React.useRef<boolean | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only edge changes ask; loading and has-more state just gate them
  React.useEffect(() => {
    if (!layoutSettled) {
      return;
    }

    const arrivedAtTop = wasAwayFromTop.current === true && !canScrollToStart;
    wasAwayFromTop.current = canScrollToStart;

    if (
      !arrivedAtTop ||
      !chatService?.getConfig()?.paginatedMessages ||
      isLoadingMoreMessages ||
      !hasMoreMessages
    ) {
      return;
    }

    publishChatEvent(chatService, AutopilotChatEvent.ConversationLoadMore);
    chatService.__internalService__.publish(
      AutopilotChatInternalEvent.SetIsLoadingMoreMessages,
      true
    );
  }, [canScrollToStart, layoutSettled, chatService]);
}
