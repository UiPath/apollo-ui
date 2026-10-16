import React from 'react';

import {
  type AutopilotChatActionPayload,
  AutopilotChatEvent,
  AutopilotChatInterceptableEvent,
  type AutopilotChatMessage,
  AutopilotChatRole,
} from '../../service';
import {
  getMessageCopyText,
  groupChatMessages,
  withoutFakeStream,
} from '../messages/message-groups';
import { useChatService } from '../providers/chat-service.provider';
import { useChatState } from '../providers/chat-state-provider';

/**
 * The transcript a renderer shows, kept in step with the service, plus the service-side effects of
 * the built-in message actions (feedback is written back onto the message, copy fills the
 * clipboard). Mount it once per chat: it handles those action events.
 */
export function useChatMessages() {
  const chatService = useChatService();
  const { setHasMessages } = useChatState();
  const [messages, setMessages] = React.useState<AutopilotChatMessage[]>(() =>
    withoutFakeStream(chatService?.getConversation?.() ?? [])
  );

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    // Patch an existing message or append a new one.
    const upsert = (message: AutopilotChatMessage) => {
      setMessages((previous) =>
        previous.some((existing) => existing.id === message.id)
          ? previous.map((existing) => (existing.id === message.id ? message : existing))
          : [...previous, message]
      );
    };

    const sendFeedback = ({ message, action }: AutopilotChatActionPayload) => {
      if (message.role !== AutopilotChatRole.Assistant) {
        return;
      }

      chatService.sendResponse({
        ...message,
        ...(message.fakeStream ? { fakeStream: false } : {}),
        ...(message.stream ? { stream: false, done: true } : {}),
        feedback: { isPositive: !!action.details?.isPositive },
      } satisfies AutopilotChatMessage);
    };

    const copy = ({ group, message }: AutopilotChatActionPayload) => {
      const text = getMessageCopyText(group, message);

      if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    };

    const unsubscribes = [
      // An interceptor, so the user's message shows without waiting for the host to confirm it.
      chatService.intercept(AutopilotChatInterceptableEvent.Request, upsert),
      chatService.on(AutopilotChatEvent.Response, upsert),
      chatService.on(AutopilotChatEvent.NewChat, () => setMessages([])),
      chatService.on(AutopilotChatEvent.SetConversation, (conversation: AutopilotChatMessage[]) =>
        setMessages(withoutFakeStream(conversation))
      ),
      chatService.on(AutopilotChatEvent.Feedback, sendFeedback),
      chatService.on(AutopilotChatEvent.Copy, copy),
    ];

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [chatService]);

  React.useEffect(() => {
    setHasMessages(messages.length > 0);
  }, [messages, setHasMessages]);

  const groups = React.useMemo(() => groupChatMessages(messages), [messages]);

  return { messages, groups };
}
