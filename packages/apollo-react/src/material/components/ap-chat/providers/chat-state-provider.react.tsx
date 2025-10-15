/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatAllowedAttachments,
    AutopilotChatConfiguration,
    AutopilotChatDisabledFeatures,
    AutopilotChatEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMode,
    AutopilotChatModelInfo,
    AutopilotChatOverrideLabels,
    CHAT_COMPACT_MODE_INPUT_MAX_ROWS,
    CHAT_COMPACT_MODE_INPUT_MIN_ROWS,
    CHAT_COMPACT_MODE_MESSAGE_GROUP_GAP,
    CHAT_COMPACT_MODE_MESSAGE_SPACING,
    CHAT_INPUT_MAX_ROWS,
    CHAT_INPUT_MIN_ROWS,
    CHAT_MESSAGE_GROUP_GAP,
    CHAT_MESSAGE_SPACING,
    CHAT_SUGGESTION_SPACING,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from './chat-service.provider.react';

// Converts all properties of the type to required since we have defaults for all properties
type DeepRequired<T> = {
    [P in keyof T]-?: DeepRequired<T[P]>;
};

interface AutopilotChatStateContextType {
    historyAnchorElement: HTMLElement | null;
    setHistoryAnchorElement: (element: HTMLElement | null) => void;
    fullScreenContainer: HTMLElement | null;
    setFullScreenContainer: (element: HTMLElement | null) => void;
    historyOpen: boolean;
    settingsOpen: boolean;
    chatMode: AutopilotChatMode;
    disabledFeatures: AutopilotChatDisabledFeatures;
    overrideLabels: AutopilotChatOverrideLabels;
    firstRunExperience: AutopilotChatConfiguration['firstRunExperience'];
    allowedAttachments: AutopilotChatAllowedAttachments;
    models: AutopilotChatModelInfo[];
    hasMessages: boolean;
    setHasMessages: (hasMessages: boolean) => void;
    spacing: DeepRequired<NonNullable<AutopilotChatConfiguration['spacing']>>;
}

const AutopilotChatStateContext = React.createContext<AutopilotChatStateContextType | null>(null);

interface AutopilotChatStateProviderProps {
    children: React.ReactNode;
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
    const messageGroupGap = compactMode ? CHAT_COMPACT_MODE_MESSAGE_GROUP_GAP : CHAT_MESSAGE_GROUP_GAP;
    const primaryFontToken = compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM;
    const primaryBoldFontToken = compactMode ? FontVariantToken.fontSizeSBold : FontVariantToken.fontSizeMBold;
    const titleFontToken = FontVariantToken.fontSizeH4;
    const suggestionSpacing = CHAT_SUGGESTION_SPACING;
    const suggestionFontToken = compactMode ? FontVariantToken.fontSizeS : FontVariantToken.fontSizeM;
    const suggestionPadding = compactMode ? `${token.Spacing.SpacingMicro} ${token.Spacing.SpacingXs}` : `${token.Spacing.SpacingXs} ${token.Spacing.SpacingBase}`;
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

export const AutopilotChatStateProvider: React.FC<AutopilotChatStateProviderProps> = ({ children }) => {
    const chatService = useChatService();
    const chatInternalService = chatService.__internalService__;

    const [ allowedAttachments, setAllowedAttachments ] = React.useState<AutopilotChatAllowedAttachments>(
        chatService?.getConfig()?.allowedAttachments ?? {
            multiple: false,
            types: {},
            maxSize: 0,
            maxCount: 0,
        },
    );
    const [ historyAnchorElement, setHistoryAnchorElement ] = React.useState<HTMLElement | null>(null);
    const [ fullScreenContainer, setFullScreenContainer ] = React.useState<HTMLElement | null>(null);
    const [ historyOpen, setHistoryOpen ] = React.useState(chatService?.historyOpen ?? false);
    const [ settingsOpen, setSettingsOpen ] = React.useState(chatService?.settingsOpen ?? false);
    const [ chatMode, setChatMode ] = React.useState(chatService?.getConfig()?.mode ?? AutopilotChatMode.SideBySide);
    const [ disabledFeatures, setDisabledFeatures ] = React.useState(chatService?.getConfig()?.disabledFeatures ?? {});
    const [ overrideLabels, setOverrideLabels ] = React.useState(chatService?.getConfig()?.overrideLabels ?? {});
    const [ firstRunExperience, setFirstRunExperience ] = React.useState(chatService?.getConfig()?.firstRunExperience ?? {
        title: '',
        description: '',
        suggestions: [],
    });
    const [ models, setModels ] = React.useState<AutopilotChatModelInfo[]>(chatService?.getModels() ?? []);
    const [ hasMessages, setHasMessages ] = React.useState(false);
    const [ spacing, setSpacing ] = React.useState(calculateSpacing(chatService?.getConfig()?.spacing));

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribeHistoryToggle = chatInternalService.on(
            AutopilotChatInternalEvent.ToggleHistory,
            (isOpen) => {
                setHistoryOpen(isOpen);
            },
        );

        const unsubscribeSettingsToggle = chatInternalService.on(
            AutopilotChatInternalEvent.ToggleSettings,
            (isOpen) => {
                setSettingsOpen(isOpen);
            },
        );

        const unsubscribeModeChange = chatService.on(
            AutopilotChatEvent.ModeChange,
            (mode) => {
                setChatMode(mode);
            },
        );

        const unsubscribeDisabledFeatures = chatService.on(
            AutopilotChatEvent.SetDisabledFeatures,
            (features) => {
                setDisabledFeatures(features);
            },
        );

        const unsubscribeOverrideLabels = chatService.on(
            AutopilotChatEvent.SetOverrideLabels,
            (labels) => {
                setOverrideLabels(labels);
            },
        );

        const unsubscribeFirstRunExperience = chatService.on(
            AutopilotChatEvent.SetFirstRunExperience,
            (experience) => {
                setFirstRunExperience(experience);
            },
        );

        const unsubscribeAllowedAttachments = chatInternalService.on(
            AutopilotChatInternalEvent.SetAllowedAttachments,
            (allowed: AutopilotChatAllowedAttachments) => {
                setAllowedAttachments(allowed);
            },
        );

        const unsubscribeModels = chatService.on(
            AutopilotChatEvent.SetModels,
            (newModels: AutopilotChatModelInfo[]) => {
                setModels(newModels);
            },
        );

        const unsubscribeSpacing = chatInternalService.on(
            AutopilotChatInternalEvent.SetSpacing,
            (spacingConfig: AutopilotChatConfiguration['spacing']) => {
                setSpacing(calculateSpacing(spacingConfig));
            },
        );

        return () => {
            unsubscribeHistoryToggle();
            unsubscribeSettingsToggle();
            unsubscribeModeChange();
            unsubscribeDisabledFeatures();
            unsubscribeOverrideLabels();
            unsubscribeFirstRunExperience();
            unsubscribeAllowedAttachments();
            unsubscribeModels();
            unsubscribeSpacing();
        };
    }, [ chatService, chatInternalService ]);

    const value = React.useMemo(() => ({
        historyOpen,
        settingsOpen,
        chatMode,
        disabledFeatures,
        overrideLabels,
        firstRunExperience,
        allowedAttachments,
        models,
        historyAnchorElement,
        setHistoryAnchorElement,
        fullScreenContainer,
        setFullScreenContainer,
        hasMessages,
        setHasMessages,
        spacing,
    }), [
        historyOpen,
        settingsOpen,
        chatMode,
        disabledFeatures,
        overrideLabels,
        firstRunExperience,
        allowedAttachments,
        models,
        historyAnchorElement,
        setHistoryAnchorElement,
        fullScreenContainer,
        setFullScreenContainer,
        hasMessages,
        setHasMessages,
        spacing,
    ]);

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
