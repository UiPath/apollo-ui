import React from 'react';

import {
  type AutopilotChatCustomHeaderAction,
  type AutopilotChatDisabledFeatures,
  AutopilotChatMode,
  AutopilotChatPreHookAction,
} from '../../service';
import { useAttachments } from '../providers/attachments-provider';
import { useChatService } from '../providers/chat-service.provider';
import { useChatState } from '../providers/chat-state-provider';
import { usePicker } from '../providers/picker-provider';

export interface ChatHeaderActionVisibility {
  newChat: boolean;
  settings: boolean;
  history: boolean;
  fullScreenToggle: boolean;
  customActions: boolean;
  close: boolean;
}

export interface ChatHeaderActionVisibilityInput {
  chatMode: AutopilotChatMode;
  disabledFeatures: AutopilotChatDisabledFeatures;
  readOnly: boolean;
  customActionCount: number;
}

/**
 * Which built-in header actions show. Close is opt-in for Embedded (`close: false`) and opt-out
 * everywhere else.
 */
export function getChatHeaderActionVisibility({
  chatMode,
  disabledFeatures,
  readOnly,
  customActionCount,
}: ChatHeaderActionVisibilityInput): ChatHeaderActionVisibility {
  const isEmbedded = chatMode === AutopilotChatMode.Embedded;

  return {
    newChat: !readOnly && !disabledFeatures.newChat,
    settings: !readOnly && !disabledFeatures.settings,
    history: !readOnly && !disabledFeatures.history,
    fullScreenToggle: !disabledFeatures.fullScreen && !isEmbedded,
    customActions: !readOnly && customActionCount > 0,
    close: isEmbedded ? disabledFeatures.close === false : !disabledFeatures.close,
  };
}

export interface ChatHeaderActions {
  visibility: ChatHeaderActionVisibility;
  isFullScreen: boolean;
  customHeaderActions: AutopilotChatCustomHeaderAction[];
  newChat: () => void;
  toggleSettings: () => void;
  toggleHistory: () => void;
  toggleFullScreen: () => void;
  close: () => void;
  runCustomAction: (action: AutopilotChatCustomHeaderAction) => void;
}

export interface UseChatHeaderActionsOptions {
  /**
   * Mode to derive visibility from instead of the live one, for a renderer that keeps drawing its
   * previous layout while it animates closed.
   */
  mode?: AutopilotChatMode;
}

/**
 * Header action visibility and handlers, each gated by its pre-hook, shared by every renderer.
 */
export function useChatHeaderActions({
  mode,
}: UseChatHeaderActionsOptions = {}): ChatHeaderActions {
  const chatService = useChatService();
  const { disabledFeatures, chatMode, historyOpen, settingsOpen, readOnly } = useChatState();
  const visibleMode = mode ?? chatMode;
  const { clearAttachments } = useAttachments();
  const { customHeaderActions, handleCustomHeaderAction } = usePicker();

  const withPreHook = React.useCallback(
    (action: AutopilotChatPreHookAction, data: unknown, run: () => void) => {
      chatService
        ?.getPreHook(action)(data)
        .then((proceed) => {
          if (proceed) {
            run();
          }
        });
    },
    [chatService]
  );

  const newChat = React.useCallback(() => {
    withPreHook(AutopilotChatPreHookAction.NewChat, undefined, () => {
      chatService.newChat();
      chatService.stopResponse();
      chatService.setPrompt('');
      clearAttachments();
    });
  }, [chatService, clearAttachments, withPreHook]);

  const toggleHistory = React.useCallback(() => {
    withPreHook(AutopilotChatPreHookAction.ToggleHistory, { historyOpen }, () =>
      chatService.toggleHistory()
    );
  }, [chatService, historyOpen, withPreHook]);

  const toggleSettings = React.useCallback(() => {
    withPreHook(AutopilotChatPreHookAction.ToggleSettings, { settingsOpen }, () =>
      chatService.toggleSettings()
    );
  }, [chatService, settingsOpen, withPreHook]);

  const toggleFullScreen = React.useCallback(() => {
    withPreHook(AutopilotChatPreHookAction.ToggleChat, { chatMode }, () =>
      chatService.setChatMode(
        chatMode === AutopilotChatMode.FullScreen
          ? AutopilotChatMode.SideBySide
          : AutopilotChatMode.FullScreen
      )
    );
  }, [chatService, chatMode, withPreHook]);

  const close = React.useCallback(() => {
    withPreHook(AutopilotChatPreHookAction.CloseChat, undefined, () => chatService.close());
  }, [chatService, withPreHook]);

  const visibility = React.useMemo(
    () =>
      getChatHeaderActionVisibility({
        chatMode: visibleMode,
        disabledFeatures,
        readOnly,
        customActionCount: customHeaderActions.length,
      }),
    [visibleMode, disabledFeatures, readOnly, customHeaderActions.length]
  );

  return {
    visibility,
    isFullScreen: visibleMode === AutopilotChatMode.FullScreen,
    customHeaderActions,
    newChat,
    toggleSettings,
    toggleHistory,
    toggleFullScreen,
    close,
    runCustomAction: handleCustomHeaderAction,
  };
}
