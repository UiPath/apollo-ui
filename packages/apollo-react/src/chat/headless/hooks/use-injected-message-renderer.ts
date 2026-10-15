import React from 'react';

import type { AutopilotChatMessage } from '../../service';
import { useChatService } from '../providers/chat-service.provider';

/**
 * Hands `ref`'s element to the renderer injected for `message.widget` and runs its cleanup before
 * the next render and on unmount. An effect rather than a ref callback: React calls a new ref
 * callback on every render, which would render again without cleaning up first.
 */
export function useInjectedMessageRenderer(
  ref: React.RefObject<HTMLElement | null>,
  message: AutopilotChatMessage
) {
  const chatService = useChatService();

  React.useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    const cleanup = chatService.renderMessage(ref.current, message);

    return () => {
      cleanup?.();
    };
  }, [chatService, message, ref]);
}
