import token, { FontVariantToken } from '@uipath/apollo-core';
import React from 'react';

import {
  type AutopilotChatAllowedAttachments,
  type AutopilotChatConfiguration,
  type AutopilotChatDisabledFeatures,
  AutopilotChatEvent,
  AutopilotChatInterceptableEvent,
  AutopilotChatInternalEvent,
  type AutopilotChatMessage,
  AutopilotChatMode,
  type AutopilotChatOverrideLabels,
  AutopilotChatRole,
  type AutopilotChatSuggestion,
  CHAT_COMPACT_MODE_INPUT_MAX_ROWS,
  CHAT_COMPACT_MODE_INPUT_MIN_ROWS,
  CHAT_COMPACT_MODE_MESSAGE_GROUP_GAP,
  CHAT_COMPACT_MODE_MESSAGE_SPACING,
  CHAT_INPUT_MAX_ROWS,
  CHAT_INPUT_MIN_ROWS,
  CHAT_MESSAGE_GROUP_GAP,
  CHAT_MESSAGE_SPACING,
  CHAT_SUGGESTION_SPACING,
} from '../../service';
import { useChatService } from './chat-service.provider';

// Converts all properties of the type to required since we have defaults for all properties
type DeepRequired<T> = {
  [P in keyof T]-?: DeepRequired<T[P]>;
};

interface AutopilotChatStateContextType {
  historyAnchorElement: HTMLElement | null;
  setHistoryAnchorElement: (element: HTMLElement | null) => void;
  /** The header's settings button, for renderers that return focus to it on close. */
  settingsAnchorElement: HTMLElement | null;
  setSettingsAnchorElement: (element: HTMLElement | null) => void;
  fullScreenContainer: HTMLElement | null;
  setFullScreenContainer: (element: HTMLElement | null) => void;
  historyOpen: boolean;
  settingsOpen: boolean;
  chatMode: AutopilotChatMode;
  disabledFeatures: AutopilotChatDisabledFeatures;
  overrideLabels: AutopilotChatOverrideLabels;
  firstRunExperience: AutopilotChatConfiguration['firstRunExperience'];
  allowedAttachments: AutopilotChatAllowedAttachments;
  hasMessages: boolean;
  setHasMessages: (hasMessages: boolean) => void;
  spacing: DeepRequired<NonNullable<AutopilotChatConfiguration['spacing']>>;
  theming?: AutopilotChatConfiguration['theming'];
  portalContainer?: HTMLElement;
  readOnly: boolean;
  /** The first-run experience shows: it has content and the conversation is empty. */
  firstRunVisible: boolean;
  /** The service's current suggestions (`setSuggestions`), cleared by the service on request. */
  suggestions: ChatSuggestionsState;
}

/** Suggestions from `setSuggestions`, with the user turn they were set in. */
export interface ChatSuggestionsState {
  items: AutopilotChatSuggestion[];
  /** As passed to `setSuggestions`; `undefined` falls back to the first-run setting. */
  sendOnClick?: boolean;
  /**
   * How many user messages the conversation had when the suggestions were set. They belong to
   * that turn, replies included, and are left behind once another user message follows.
   */
  userTurns?: number;
}

export const countUserTurns = (messages: readonly AutopilotChatMessage[]) =>
  messages.reduce((count, message) => count + (message.role === AutopilotChatRole.User ? 1 : 0), 0);

const NO_SUGGESTIONS: ChatSuggestionsState = { items: [] };

const AutopilotChatStateContext = React.createContext<AutopilotChatStateContextType | null>(null);

interface AutopilotChatStateProviderProps {
  children: React.ReactNode;
  portalContainer?: HTMLElement;
}

const calculateSpacing = (chatSpacing: AutopilotChatConfiguration['spacing']) => {
  const compactMode = chatSpacing?.compactMode ?? false;

  const markdownTokens = {
    li: compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM,
    p: compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM,
    h1: compactMode ? FontVariantToken.fontSizeH4Bold : FontVariantToken.fontSizeH3Bold,
    h2: compactMode ? FontVariantToken.fontSizeH4Bold : FontVariantToken.fontSizeH3Bold,
    h3: compactMode ? FontVariantToken.fontSizeH4Bold : FontVariantToken.fontSizeH3Bold,
    h4: compactMode ? FontVariantToken.fontSizeMBold : FontVariantToken.fontSizeLBold,
    h5: compactMode ? FontVariantToken.fontSizeMBold : FontVariantToken.fontSizeLBold,
    h6: compactMode ? FontVariantToken.fontSizeMBold : FontVariantToken.fontSizeLBold,
    th: compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM,
    td: compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM,
    em: compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM,
    del: compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM,
    strong: compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM,
    link: compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM,
    citation: compactMode ? FontVariantToken.fontSizeXs : FontVariantToken.fontSizeM,
  };

  const promptBox = {
    minRows: compactMode ? CHAT_COMPACT_MODE_INPUT_MIN_ROWS : CHAT_INPUT_MIN_ROWS,
    maxRows: compactMode ? CHAT_COMPACT_MODE_INPUT_MAX_ROWS : CHAT_INPUT_MAX_ROWS,
  };

  const messageSpacing = compactMode ? CHAT_COMPACT_MODE_MESSAGE_SPACING : CHAT_MESSAGE_SPACING;
  const messageGroupGap = compactMode
    ? CHAT_COMPACT_MODE_MESSAGE_GROUP_GAP
    : CHAT_MESSAGE_GROUP_GAP;
  const primaryFontToken = compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM;
  const primaryBoldFontToken = compactMode
    ? FontVariantToken.fontSizeSBold
    : FontVariantToken.fontSizeMBold;
  const titleFontToken = FontVariantToken.fontSizeH4;
  const suggestionSpacing = CHAT_SUGGESTION_SPACING;
  const suggestionFontToken = compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM;
  const suggestionPadding = compactMode
    ? `${token.Spacing.SpacingMicro} ${token.Spacing.SpacingXs}`
    : `${token.Spacing.SpacingXs} ${token.Spacing.SpacingBase}`;
  return {
    compactMode,
    promptBox: {
      minRows: chatSpacing?.promptBox?.minRows ?? promptBox.minRows,
      maxRows: chatSpacing?.promptBox?.maxRows ?? promptBox.maxRows,
    },
    primaryFontToken: chatSpacing?.primaryFontToken ?? primaryFontToken,
    primaryBoldFontToken: chatSpacing?.primaryBoldFontToken ?? primaryBoldFontToken,
    titleFontToken: chatSpacing?.titleFontToken ?? titleFontToken,
    suggestionSpacing: chatSpacing?.suggestionSpacing ?? suggestionSpacing,
    suggestionFontToken: chatSpacing?.suggestionFontToken ?? suggestionFontToken,
    suggestionPadding: chatSpacing?.suggestionPadding ?? suggestionPadding,
    messageSpacing: chatSpacing?.messageSpacing ?? messageSpacing,
    messageGroupGap: chatSpacing?.messageGroupGap ?? messageGroupGap,
    markdownTokens: {
      li: chatSpacing?.markdownTokens?.li ?? markdownTokens.li,
      p: chatSpacing?.markdownTokens?.p ?? markdownTokens.p,
      h1: chatSpacing?.markdownTokens?.h1 ?? markdownTokens.h1,
      h2: chatSpacing?.markdownTokens?.h2 ?? markdownTokens.h2,
      h3: chatSpacing?.markdownTokens?.h3 ?? markdownTokens.h3,
      h4: chatSpacing?.markdownTokens?.h4 ?? markdownTokens.h4,
      h5: chatSpacing?.markdownTokens?.h5 ?? markdownTokens.h5,
      h6: chatSpacing?.markdownTokens?.h6 ?? markdownTokens.h6,
      th: chatSpacing?.markdownTokens?.th ?? markdownTokens.th,
      td: chatSpacing?.markdownTokens?.td ?? markdownTokens.td,
      em: chatSpacing?.markdownTokens?.em ?? markdownTokens.em,
      del: chatSpacing?.markdownTokens?.del ?? markdownTokens.del,
      strong: chatSpacing?.markdownTokens?.strong ?? markdownTokens.strong,
      link: chatSpacing?.markdownTokens?.link ?? markdownTokens.link,
      citation: chatSpacing?.markdownTokens?.citation ?? markdownTokens.citation,
    },
  };
};

export const AutopilotChatStateProvider: React.FC<AutopilotChatStateProviderProps> = ({
  children,
  portalContainer,
}) => {
  const chatService = useChatService();
  const chatInternalService = chatService.__internalService__;

  const [allowedAttachments, setAllowedAttachments] =
    React.useState<AutopilotChatAllowedAttachments>(
      chatService?.getConfig()?.allowedAttachments ?? {
        multiple: false,
        types: {},
        maxSize: 0,
        maxCount: 0,
      }
    );
  const [historyAnchorElement, setHistoryAnchorElement] = React.useState<HTMLElement | null>(null);
  const [settingsAnchorElement, setSettingsAnchorElement] = React.useState<HTMLElement | null>(
    null
  );
  const [fullScreenContainer, setFullScreenContainer] = React.useState<HTMLElement | null>(null);
  const [historyOpen, setHistoryOpen] = React.useState(chatService?.historyOpen ?? false);
  const [settingsOpen, setSettingsOpen] = React.useState(chatService?.settingsOpen ?? false);
  const [chatMode, setChatMode] = React.useState(
    chatService?.getConfig()?.mode ?? AutopilotChatMode.SideBySide
  );
  const [disabledFeatures, setDisabledFeatures] = React.useState(
    chatService?.getConfig()?.disabledFeatures ?? {}
  );
  const [overrideLabels, setOverrideLabels] = React.useState(
    chatService?.getConfig()?.overrideLabels ?? {}
  );
  const [firstRunExperience, setFirstRunExperience] = React.useState(
    chatService?.getConfig()?.firstRunExperience ?? {
      title: '',
      description: '',
      suggestions: [],
    }
  );
  // Kept in step with the service from the same events as the transcript, so the first-run
  // experience never shows for a render beside an existing conversation.
  const [hasMessages, setHasMessages] = React.useState(
    () => (chatService?.getConversation?.().length ?? 0) > 0
  );
  const [readOnly, setReadOnly] = React.useState(chatService?.getReadOnly() ?? false);
  const [spacing, setSpacing] = React.useState(calculateSpacing(chatService?.getConfig()?.spacing));
  const [theming, setTheming] = React.useState(chatService?.getConfig()?.theming);
  const [suggestions, setSuggestions] = React.useState<ChatSuggestionsState>(NO_SUGGESTIONS);

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const unsubscribeHistoryToggle = chatInternalService.on(
      AutopilotChatInternalEvent.ToggleHistory,
      (isOpen) => {
        setHistoryOpen(isOpen);
      }
    );

    const unsubscribeSettingsToggle = chatInternalService.on(
      AutopilotChatInternalEvent.ToggleSettings,
      (isOpen) => {
        setSettingsOpen(isOpen);
      }
    );

    const unsubscribeModeChange = chatService.on(AutopilotChatEvent.ModeChange, (mode) => {
      setChatMode(mode);
    });

    const unsubscribeDisabledFeatures = chatService.on(
      AutopilotChatEvent.SetDisabledFeatures,
      (features) => {
        setDisabledFeatures(features);
      }
    );

    const unsubscribeOverrideLabels = chatService.on(
      AutopilotChatEvent.SetOverrideLabels,
      (labels) => {
        setOverrideLabels(labels);
      }
    );

    const unsubscribeFirstRunExperience = chatService.on(
      AutopilotChatEvent.SetFirstRunExperience,
      (experience) => {
        setFirstRunExperience(experience);
      }
    );

    const unsubscribeAllowedAttachments = chatInternalService.on(
      AutopilotChatInternalEvent.SetAllowedAttachments,
      (allowed: AutopilotChatAllowedAttachments) => {
        setAllowedAttachments(allowed);
      }
    );

    const unsubscribeReadOnly = chatService.on(
      AutopilotChatEvent.SetReadOnly,
      (isReadOnly: boolean) => {
        setReadOnly(isReadOnly);
      }
    );

    const unsubscribeSpacing = chatInternalService.on(
      AutopilotChatInternalEvent.SetSpacing,
      (spacingConfig: AutopilotChatConfiguration['spacing']) => {
        setSpacing(calculateSpacing(spacingConfig));
      }
    );

    const unsubscribeTheming = chatInternalService.on(
      AutopilotChatInternalEvent.SetTheming,
      (themingConfig: AutopilotChatConfiguration['theming']) => {
        setTheming(themingConfig);
      }
    );

    const unsubscribeSuggestions = chatInternalService.on(
      AutopilotChatInternalEvent.SetSuggestions,
      ({
        suggestions: items,
        sendOnClick,
      }: {
        suggestions: AutopilotChatSuggestion[];
        sendOnClick?: boolean;
      }) => {
        setSuggestions(
          items.length === 0
            ? NO_SUGGESTIONS
            : { items, sendOnClick, userTurns: countUserTurns(chatService.getConversation()) }
        );
      }
    );

    const unsubscribes = [
      chatService.intercept(AutopilotChatInterceptableEvent.Request, () => {
        setHasMessages(true);
      }),
      chatService.on(AutopilotChatEvent.Response, () => setHasMessages(true)),
      chatService.on(AutopilotChatEvent.SetConversation, (conversation: AutopilotChatMessage[]) =>
        setHasMessages(conversation.length > 0)
      ),
      chatService.on(AutopilotChatEvent.NewChat, () => {
        setHasMessages(false);
        // A new chat starts without the last one's suggestions, in both renderers.
        setSuggestions(NO_SUGGESTIONS);
      }),
    ];

    return () => {
      unsubscribeSuggestions();
      for (const unsubscribe of unsubscribes) unsubscribe();
      unsubscribeHistoryToggle();
      unsubscribeSettingsToggle();
      unsubscribeModeChange();
      unsubscribeDisabledFeatures();
      unsubscribeOverrideLabels();
      unsubscribeFirstRunExperience();
      unsubscribeReadOnly();
      unsubscribeAllowedAttachments();
      unsubscribeSpacing();
      unsubscribeTheming();
    };
  }, [chatService, chatInternalService]);

  const firstRunVisible =
    !hasMessages &&
    !!firstRunExperience &&
    !!(
      firstRunExperience.title ||
      firstRunExperience.description ||
      firstRunExperience.suggestions?.length
    );

  const value = React.useMemo(
    () => ({
      historyOpen,
      settingsOpen,
      chatMode,
      disabledFeatures,
      overrideLabels,
      firstRunExperience,
      allowedAttachments,
      historyAnchorElement,
      setHistoryAnchorElement,
      settingsAnchorElement,
      setSettingsAnchorElement,
      fullScreenContainer,
      setFullScreenContainer,
      hasMessages,
      setHasMessages,
      spacing,
      theming,
      portalContainer,
      readOnly,
      firstRunVisible,
      suggestions,
    }),
    [
      historyOpen,
      settingsOpen,
      chatMode,
      disabledFeatures,
      overrideLabels,
      firstRunExperience,
      allowedAttachments,
      historyAnchorElement,
      setHistoryAnchorElement,
      settingsAnchorElement,
      fullScreenContainer,
      setFullScreenContainer,
      hasMessages,
      setHasMessages,
      spacing,
      theming,
      portalContainer,
      readOnly,
      firstRunVisible,
      suggestions,
    ]
  );

  return (
    <AutopilotChatStateContext.Provider value={value}>
      {children}
    </AutopilotChatStateContext.Provider>
  );
};

export const useChatState = () => {
  const context = React.useContext(AutopilotChatStateContext);

  if (!context) {
    throw new Error('useChatState must be used within a AutopilotChatStateProvider');
  }

  return context;
};
