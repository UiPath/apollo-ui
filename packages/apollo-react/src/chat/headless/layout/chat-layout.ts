import { type AutopilotChatDisabledFeatures, AutopilotChatMode } from '../../service';

export interface ChatLayoutInput {
  chatMode: AutopilotChatMode;
  disabledFeatures: AutopilotChatDisabledFeatures;
  readOnly: boolean;
}

export interface ChatLayout {
  mode: AutopilotChatMode;
  isOpen: boolean;
  /** FullScreen always shows the header; `disabledFeatures.header` only applies to the panel. */
  showHeader: boolean;
  showHeaderSeparator: boolean;
  showComposer: boolean;
  historyAvailable: boolean;
  settingsAvailable: boolean;
  /** Viewport height instead of leaving room for a host header; opt-in via `fullHeight: false`. */
  fullHeight: boolean;
}

/**
 * Which regions a chat layout shows for the current mode and configuration, shared by every
 * renderer so the visibility rules stay identical.
 */
export function resolveChatLayout({
  chatMode,
  disabledFeatures,
  readOnly,
}: ChatLayoutInput): ChatLayout {
  return {
    mode: chatMode,
    isOpen: chatMode !== AutopilotChatMode.Closed,
    showHeader: chatMode === AutopilotChatMode.FullScreen || !disabledFeatures.header,
    showHeaderSeparator: !disabledFeatures.headerSeparator,
    showComposer: !readOnly,
    historyAvailable: !disabledFeatures.history,
    settingsAvailable: !disabledFeatures.settings,
    fullHeight: disabledFeatures.fullHeight === false,
  };
}
