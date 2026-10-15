import React from 'react';

import { stripResourceTokens } from '../../headless/markdown/resource-token-parser';
import { useChatService } from '../../headless/providers/chat-service.provider';
import { AutopilotChatEvent, type AutopilotChatMessage } from '../../service';

/**
 * Plain-text message body that follows streamed chunks. A stand-in for the markdown renderer.
 */
export function TextMessageRenderer({ message }: { message: AutopilotChatMessage }) {
  const chatService = useChatService();
  const [content, setContent] = React.useState(message.content);

  React.useEffect(() => setContent(message.content), [message.content]);

  React.useEffect(
    () =>
      chatService.on(AutopilotChatEvent.SendChunk, (chunk: AutopilotChatMessage) => {
        if (chunk.id !== message.id) {
          return;
        }
        // The service accumulates chunks on the stored message; read it rather than re-joining.
        const stored = chatService.getConversation().find((entry) => entry.id === message.id);
        setContent(stored?.content ?? '');
      }),
    [chatService, message.id]
  );

  return <p className="whitespace-pre-wrap break-words">{stripResourceTokens(content)}</p>;
}
