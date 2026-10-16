import React from 'react';

import {
  AutopilotChatEvent,
  type AutopilotChatHistory,
  AutopilotChatPreHookAction,
} from '../../service';
import { useChatService } from '../providers/chat-service.provider';
import { useLoading } from '../providers/loading-provider';

export interface HistoryItemState {
  /** The conversation is the one open in the chat. */
  isActive: boolean;
  /** Opens the conversation and closes the history; a no-op while active or renaming. */
  open: () => void;
  isEditing: boolean;
  draftName: string;
  setDraftName: (name: string) => void;
  /** Starts renaming, with the current name as the draft; only while the history is open. */
  startRename: () => void;
  /**
   * Renames through the `RenameConversation` pre-hook; an empty or unchanged name, a declining or
   * failing pre-hook, cancels instead.
   */
  commitRename: () => void;
  cancelRename: () => void;
  /** Deletes through the `DeleteConversation` pre-hook. */
  remove: () => void;
}

/**
 * One history entry for every renderer: whether it is the open conversation, opening it, the
 * rename flow and delete. (`useChatHistory` starts a new chat when the open one is deleted.)
 */
export function useHistoryItem(item: AutopilotChatHistory, historyOpen: boolean): HistoryItemState {
  const chatService = useChatService();
  const { setWaitingResponse } = useLoading();
  const [isActive, setIsActive] = React.useState(chatService.activeConversationId === item.id);
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftName, setDraftName] = React.useState(item.name);
  // Enter commits, and the blur that follows when the field unmounts would commit again.
  const isCommittingRef = React.useRef(false);
  // A blur from the field being removed after Escape must not commit.
  const isEditingRef = React.useRef(false);

  // The draft follows the host's name while not renaming.
  React.useEffect(() => {
    if (!isEditing) {
      setDraftName(item.name);
    }
  }, [item.name, isEditing]);

  React.useEffect(() => {
    if (chatService.activeConversationId === item.id && !isActive) {
      setIsActive(true);
    }

    const unsubscribeOpen = chatService.on(
      AutopilotChatEvent.OpenConversation,
      (id: string | null) => {
        if (!isActive && item.id === id) {
          setWaitingResponse(false);
        }
        setIsActive(id === item.id);
      }
    );
    const unsubscribeNewChat = chatService.on(AutopilotChatEvent.NewChat, () => setIsActive(false));

    return () => {
      unsubscribeOpen();
      unsubscribeNewChat();
    };
  }, [chatService, item.id, isActive, setWaitingResponse]);

  const startRename = React.useCallback(() => {
    if (!historyOpen) {
      return;
    }
    isCommittingRef.current = false;
    isEditingRef.current = true;
    setDraftName(item.name);
    setIsEditing(true);
  }, [historyOpen, item.name]);

  const cancelRename = React.useCallback(() => {
    isCommittingRef.current = false;
    isEditingRef.current = false;
    setDraftName(item.name);
    setIsEditing(false);
  }, [item.name]);

  const commitRename = React.useCallback(() => {
    if (isCommittingRef.current || !isEditingRef.current) {
      return;
    }
    const name = draftName.trim();

    if (name === '' || name === item.name) {
      cancelRename();
      return;
    }

    isCommittingRef.current = true;
    chatService
      .getPreHook(AutopilotChatPreHookAction.RenameConversation)({ conversationId: item.id, name })
      .then((proceed) => {
        if (!proceed) {
          cancelRename();
          return;
        }
        chatService.renameConversation(item.id, name);
        isEditingRef.current = false;
        setIsEditing(false);
        isCommittingRef.current = false;
      })
      .catch(() => cancelRename());
  }, [draftName, item.id, item.name, chatService, cancelRename]);

  const remove = React.useCallback(() => {
    chatService
      .getPreHook(AutopilotChatPreHookAction.DeleteConversation)({ conversationId: item.id })
      .then((proceed) => {
        if (proceed) {
          chatService.deleteConversation(item.id);
        }
      })
      // A failing pre-hook keeps the conversation, as a declining one does.
      .catch(() => {});
  }, [chatService, item.id]);

  const open = React.useCallback(() => {
    if (isEditing || isActive) {
      return;
    }
    chatService.openConversation(item.id);
    chatService.toggleHistory(false);
  }, [chatService, item.id, isActive, isEditing]);

  return {
    isActive,
    open,
    isEditing,
    draftName,
    setDraftName,
    startRename,
    commitRename,
    cancelRename,
    remove,
  };
}
