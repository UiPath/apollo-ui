import React from 'react';

import { useChatService } from '../providers/chat-service.provider';
import type { AutopilotChatMessage } from '../service';
import { AutopilotChatEvent } from '../service';

export const useIsStreamingMessage = (message: AutopilotChatMessage) => {
  const chatService = useChatService();
  const [isStreaming, setIsStreaming] = React.useState(message.stream && !message.done);

  React.useEffect(() => {
    const unsubscribeSendChunk = chatService.on(
      AutopilotChatEvent.SendChunk,
      (msg: AutopilotChatMessage) => {
        if (msg.id === message.id) {
          setIsStreaming(msg.stream && !msg.done);
        }
      }
    );

    const unsubscribeStopResponse = chatService.on(AutopilotChatEvent.StopResponse, () => {
      setIsStreaming(false);
    });

    return () => {
      unsubscribeSendChunk();
      unsubscribeStopResponse();
    };
  }, [message.id, chatService]);

  return { isStreaming };
};
