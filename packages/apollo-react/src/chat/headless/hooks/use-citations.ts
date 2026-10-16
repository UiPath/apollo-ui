import React from 'react';

import {
  AutopilotChatEvent,
  type AutopilotChatMessage,
  AutopilotChatPreHookAction,
  type PdfCitation,
  type UrlCitation,
} from '../../service';
import { getCitationUrl, getGroupCitations } from '../markdown/citations';
import { useChatService } from '../providers/chat-service.provider';

/**
 * Opens a citation as both renderers do: the `citation-click` pre-hook gets `{ citation }` and, if
 * it allows, the citation's URL opens in a new tab. A URL that is not http(s) or relative is never
 * opened, but the hook still runs with the unchanged citation so a host can handle it.
 */
export function useOpenCitation() {
  const chatService = useChatService();

  return React.useCallback(
    (citation: UrlCitation | PdfCitation) => {
      if (!chatService) {
        return;
      }

      chatService
        .getPreHook(AutopilotChatPreHookAction.CitationClick)({ citation })
        .then((proceed) => {
          const url = getCitationUrl(citation);
          if (proceed && url) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        });
    },
    [chatService]
  );
}

/**
 * The sources of a message's group, read from the service so streamed content parts count, and
 * whether the host said more messages of the group are coming (the list waits for them).
 */
export function useMessageSources(message: AutopilotChatMessage) {
  const chatService = useChatService();
  const groupId = message.groupId ?? '';
  const [sources, setSources] = React.useState<Array<UrlCitation | PdfCitation>>(() =>
    getGroupCitations(chatService?.getMessagesInGroup(groupId) ?? [])
  );
  // From the message too: it can mount from the very Response that carries the flag.
  const [isWaitingForMoreMessages, setIsWaitingForMoreMessages] = React.useState(
    !!message.shouldWaitForMoreMessages
  );

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const refresh = () => setSources(getGroupCitations(chatService.getMessagesInGroup(groupId)));
    const unsubscribes = [
      chatService.on(AutopilotChatEvent.Response, (response: AutopilotChatMessage) => {
        if (response.groupId === groupId || response.id === message.id) {
          refresh();
          setIsWaitingForMoreMessages(!!response.shouldWaitForMoreMessages);
        }
      }),
      chatService.on(AutopilotChatEvent.SendChunk, (chunk: AutopilotChatMessage) => {
        if (chunk.groupId === groupId || chunk.id === message.id) {
          refresh();
        }
      }),
      chatService.on(AutopilotChatEvent.StopResponse, refresh),
    ];

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [chatService, message.id, groupId]);

  return { sources, isWaitingForMoreMessages };
}
