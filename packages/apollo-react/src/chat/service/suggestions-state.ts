import {
  type AutopilotChatMessage,
  AutopilotChatRole,
  type AutopilotChatSuggestion,
} from './ChatModel';

// Internal: shared by the service and the headless layer, not exported from the service index.

/** The suggestions from `setSuggestions`, kept by the service for a chat mounted later. */
export interface ChatSuggestionsSnapshot {
  suggestions: readonly AutopilotChatSuggestion[];
  /** As passed to `setSuggestions`; `undefined` falls back to the first-run setting. */
  sendOnClick?: boolean;
  /**
   * How many user messages the conversation had when the suggestions were set. They belong to
   * that turn, replies included, and are left behind once another user message follows.
   */
  userTurns: number;
}

export const NO_SUGGESTIONS_SNAPSHOT: ChatSuggestionsSnapshot = Object.freeze({
  suggestions: Object.freeze([]),
  userTurns: 0,
});

export const countUserTurns = (messages: readonly AutopilotChatMessage[]) =>
  messages.reduce((count, message) => count + (message.role === AutopilotChatRole.User ? 1 : 0), 0);
