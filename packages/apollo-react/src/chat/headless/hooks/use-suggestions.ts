import React from 'react';

import {
  AutopilotChatInternalEvent,
  type AutopilotChatMessage,
  type AutopilotChatSuggestion,
} from '../../service';
import { useChatService } from '../providers/chat-service.provider';
import { countUserTurns, useChatState } from '../providers/chat-state-provider';

/**
 * Picking a suggestion, as both renderers do: with `sendOnClick` its prompt is sent through the
 * `Request` intercept, otherwise it fills the composer; either way the composer takes focus.
 */
export function useSuggestionSelect() {
  const chatService = useChatService();

  return React.useCallback(
    (suggestion: AutopilotChatSuggestion, sendOnClick: boolean) => {
      if (sendOnClick) {
        chatService.sendRequest({ content: suggestion.prompt });
      } else {
        chatService.setPrompt(suggestion.prompt);
      }
      chatService.__internalService__.publish(AutopilotChatInternalEvent.SetInputFocused, true);
    },
    [chatService]
  );
}

/**
 * The suggestions to show after the conversation, and whether picking one sends it. `attached` is
 * whether they still belong to the conversation's latest user turn, given the `messages` a
 * renderer shows: replies to that turn keep them, the next user message leaves them behind (the
 * service also clears them on every request).
 */
export function useConversationSuggestions(messages?: readonly AutopilotChatMessage[]) {
  const { suggestions, firstRunExperience } = useChatState();

  return {
    suggestions: suggestions.items,
    // Material's rule: `setSuggestions`' flag, else the first-run setting.
    sendOnClick: suggestions.sendOnClick ?? firstRunExperience?.sendOnClick ?? false,
    attached:
      suggestions.items.length > 0 &&
      messages !== undefined &&
      messages.length > 0 &&
      countUserTurns(messages) === suggestions.userTurns,
  };
}
