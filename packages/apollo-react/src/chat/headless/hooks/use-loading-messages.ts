import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import React from 'react';

import { AutopilotChatEvent } from '../../service';
import { useChatService } from '../providers/chat-service.provider';

/** Placeholder the service stores for "use the localized default". */
export const DEFAULT_LOADING_MESSAGE_KEY = 'autopilot-chat-generating-response';
export const DEFAULT_LOADING_MESSAGE_DURATION = 5000;

/**
 * The loading messages to rotate while a reply is pending and how long each shows: the service's
 * defaults (`setDefaultLoadingMessages`), replaced by a single message from `setLoadingMessage`.
 */
export function useLoadingMessages() {
  const { _ } = useLingui();
  const chatService = useChatService();
  const [messages, setMessages] = React.useState<string[]>(
    () => chatService.getDefaultLoadingMessages() ?? [DEFAULT_LOADING_MESSAGE_KEY]
  );
  const [duration, setDuration] = React.useState(
    () => chatService.getLoadingMessageDuration() ?? DEFAULT_LOADING_MESSAGE_DURATION
  );

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const unsubscribes = [
      chatService.on(
        AutopilotChatEvent.SetDefaultLoadingMessages,
        (data: { messages: string[]; duration?: number }) => {
          setMessages(data.messages);
          setDuration(data.duration ?? DEFAULT_LOADING_MESSAGE_DURATION);
        }
      ),
      chatService.on(AutopilotChatEvent.SetLoadingMessage, (message: string) =>
        setMessages([message])
      ),
    ];

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [chatService]);

  const translate = React.useCallback(
    (message: string) =>
      message === DEFAULT_LOADING_MESSAGE_KEY
        ? _(
            msg({
              id: 'autopilot-chat.message.generating-response',
              message: `Generating response...`,
            })
          )
        : message,
    [_]
  );

  return { messages, duration, translate };
}
