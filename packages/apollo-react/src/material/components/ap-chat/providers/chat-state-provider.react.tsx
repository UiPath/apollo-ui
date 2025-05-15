/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    AutopilotChatAllowedAttachments,
    AutopilotChatConfiguration,
    AutopilotChatDisabledFeatures,
    AutopilotChatEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMode,
    AutopilotChatModelInfo,
    AutopilotChatOverrideLabels,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from './chat-service.provider.react';

interface AutopilotChatStateContextType {
    historyOpen: boolean;
    chatMode: AutopilotChatMode;
    disabledFeatures: AutopilotChatDisabledFeatures;
    overrideLabels: AutopilotChatOverrideLabels;
    firstRunExperience: AutopilotChatConfiguration['firstRunExperience'];
    allowedAttachments: AutopilotChatAllowedAttachments;
    models: AutopilotChatModelInfo[];
}

const AutopilotChatStateContext = React.createContext<AutopilotChatStateContextType | null>(null);

interface AutopilotChatStateProviderProps {
    children: React.ReactNode;
}

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
    const [ historyOpen, setHistoryOpen ] = React.useState(chatService?.historyOpen ?? false);
    const [ chatMode, setChatMode ] = React.useState(chatService?.getConfig()?.mode ?? AutopilotChatMode.SideBySide);
    const [ disabledFeatures, setDisabledFeatures ] = React.useState(chatService?.getConfig()?.disabledFeatures ?? {});
    const [ overrideLabels, setOverrideLabels ] = React.useState(chatService?.getConfig()?.overrideLabels ?? {});
    const [ firstRunExperience, setFirstRunExperience ] = React.useState(chatService?.getConfig()?.firstRunExperience ?? {
        title: '',
        description: '',
        suggestions: [],
    });
    const [ models, setModels ] = React.useState<AutopilotChatModelInfo[]>(chatService?.getModels() ?? []);
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

        return () => {
            unsubscribeHistoryToggle();
            unsubscribeModeChange();
            unsubscribeDisabledFeatures();
            unsubscribeOverrideLabels();
            unsubscribeFirstRunExperience();
            unsubscribeAllowedAttachments();
            unsubscribeModels();
        };
    }, [ chatService, chatInternalService ]);

    const value = React.useMemo(() => ({
        historyOpen,
        chatMode,
        disabledFeatures,
        overrideLabels,
        firstRunExperience,
        allowedAttachments,
        models,
    }), [ historyOpen, chatMode, disabledFeatures, overrideLabels, firstRunExperience, allowedAttachments, models ]);

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
