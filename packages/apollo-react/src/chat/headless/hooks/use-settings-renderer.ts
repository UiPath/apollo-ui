import React from 'react';

import { useChatService } from '../providers/chat-service.provider';
import { useChatState } from '../providers/chat-state-provider';

/**
 * Hands `container` to the host's `settingsRenderer` each time the settings open, and empties it
 * when they close. Keep the container mounted while the panel is closed: the host renders into it
 * (CAS mounts a React root), so it must not change identity between openings.
 */
export function useSettingsRenderer(container: HTMLElement | null) {
  const chatService = useChatService();
  const { settingsOpen } = useChatState();

  React.useEffect(() => {
    const settingsRenderer = chatService.getConfig().settingsRenderer;

    if (!container || !settingsRenderer) {
      return;
    }

    container.innerHTML = '';

    if (!settingsOpen) {
      return;
    }

    try {
      settingsRenderer(container);
    } catch {
      // A failing host renderer leaves the panel empty rather than breaking the chat.
    }
  }, [chatService, container, settingsOpen]);
}
