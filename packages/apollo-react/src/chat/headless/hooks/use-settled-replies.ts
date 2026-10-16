import React from 'react';

import { AutopilotChatEvent, type AutopilotChatMessage, AutopilotChatRole } from '../../service';
import { useChatService } from '../providers/chat-service.provider';

/**
 * Calls `onSettled` once for each assistant reply that finishes arriving during this session: on
 * a complete response, on the last chunk of a stream, or when a stream is stopped. Messages that
 * were already in the transcript (restored, or present before a remount) do not count.
 */
export function useSettledReplies(onSettled: (message: AutopilotChatMessage) => void) {
  const chatService = useChatService();
  const onSettledRef = React.useRef(onSettled);
  onSettledRef.current = onSettled;

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    // Replies already in the transcript (restored, or rendered before a remount) are not new:
    // re-sending one, as feedback does, must not announce it.
    const settled = new Set<string>();
    const streaming = new Map<string, AutopilotChatMessage>();
    // A stream still running is left out, so it is announced when it ends.
    const seed = (conversation: AutopilotChatMessage[] = []) => {
      for (const message of conversation) {
        if (!(message.stream && !message.done)) settled.add(message.id);
      }
    };
    seed(chatService.getConversation());
    const settle = (message: AutopilotChatMessage) => {
      streaming.delete(message.id);
      if (settled.has(message.id)) {
        return;
      }
      settled.add(message.id);
      onSettledRef.current(message);
    };
    const track = (message: AutopilotChatMessage) => {
      if (message.role !== AutopilotChatRole.Assistant) {
        return;
      }
      if (message.stream && !message.done) {
        streaming.set(message.id, message);
      } else {
        settle(message);
      }
    };

    const unsubscribes = [
      chatService.on(AutopilotChatEvent.SetConversation, seed),
      chatService.on(AutopilotChatEvent.Response, track),
      chatService.on(AutopilotChatEvent.SendChunk, track),
      chatService.on(AutopilotChatEvent.StopResponse, () => {
        for (const message of [...streaming.values()]) settle(message);
      }),
    ];

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [chatService]);
}
