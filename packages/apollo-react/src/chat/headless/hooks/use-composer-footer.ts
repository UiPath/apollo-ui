import React from 'react';

import { AutopilotChatEvent, type AutopilotChatInfoLink } from '../../service';
import { useChatService } from '../providers/chat-service.provider';
import { type ChatInfoLink, normalizeInfoLinks } from '../utils/info-links';
import { useChatLabels } from './use-chat-labels';

export interface ComposerFooter {
  disclaimer: string;
  links: ChatInfoLink[];
}

/**
 * What the footer under the composer shows, for every renderer: the disclaimer label and the
 * host's `infoLinks`, normalised.
 */
export function useComposerFooter(): ComposerFooter {
  const chatService = useChatService();
  const { footerDisclaimer } = useChatLabels();
  const [infoLinks, setInfoLinks] = React.useState<AutopilotChatInfoLink[] | undefined>(
    () => chatService?.getConfig()?.infoLinks
  );

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    setInfoLinks(chatService.getConfig()?.infoLinks);
    return chatService.on(AutopilotChatEvent.SetInfoLinks, setInfoLinks);
  }, [chatService]);

  const links = React.useMemo(() => normalizeInfoLinks(infoLinks), [infoLinks]);

  return { disclaimer: footerDisclaimer, links };
}
