import React from 'react';

import {
  AutopilotChatEvent,
  AutopilotChatInternalEvent,
  AutopilotChatMode,
  CHAT_MESSAGE_MAX_PADDING,
  CHAT_WIDTH_KEY,
  CHAT_WIDTH_SIDE_BY_SIDE_MIN,
  StorageService,
} from '../../service';
import { useChatService } from '../providers/chat-service.provider';
import { calculateDynamicPadding } from '../utils/dynamic-padding';

const storedWidth = () =>
  parseInt(
    StorageService.Instance.get(CHAT_WIDTH_KEY) ?? CHAT_WIDTH_SIDE_BY_SIDE_MIN.toString(),
    10
  );

/**
 * How far a user message stays from the leading edge, in pixels: wider as the chat widens, and the
 * maximum in FullScreen.
 */
export function useMessageInset() {
  const chatService = useChatService();
  // Starts from the stored width in every mode, as Material always has; FullScreen reaches the
  // maximum through ModeChange or the layout's ChatResize.
  const [inset, setInset] = React.useState(() => calculateDynamicPadding(storedWidth()));

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const unsubscribes = [
      chatService.__internalService__.on(AutopilotChatInternalEvent.ChatResize, (width: number) =>
        setInset(calculateDynamicPadding(width))
      ),
      chatService.on(AutopilotChatEvent.ModeChange, (mode: AutopilotChatMode) =>
        setInset(
          mode === AutopilotChatMode.FullScreen
            ? CHAT_MESSAGE_MAX_PADDING
            : calculateDynamicPadding(storedWidth())
        )
      ),
    ];

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [chatService]);

  return inset;
}
