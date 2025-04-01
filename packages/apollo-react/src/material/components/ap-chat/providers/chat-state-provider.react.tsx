/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    AutopilotChatConfiguration,
    AutopilotChatDisabledFeatures,
    AutopilotChatEvent,
    AutopilotChatInternalEvent,
    AutopilotChatMode,
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatInternalService } from '../services/chat-internal-service';
import { AutopilotChatService } from '../services/chat-service';

interface AutopilotChatStateContextType {
    historyOpen: boolean;
    chatMode: AutopilotChatMode;
    disabledFeatures: AutopilotChatDisabledFeatures;
    firstRunExperience: AutopilotChatConfiguration['firstRunExperience'];
}

const AutopilotChatStateContext = React.createContext<AutopilotChatStateContextType | null>(null);

interface AutopilotChatStateProviderProps {
    children: React.ReactNode;
}

export const AutopilotChatStateProvider: React.FC<AutopilotChatStateProviderProps> = ({ children }) => {
    const chatService = AutopilotChatService.Instance;
    const chatInternalService = AutopilotChatInternalService.Instance;

    const [ historyOpen, setHistoryOpen ] = React.useState(chatService?.historyOpen ?? false);
    const [ chatMode, setChatMode ] = React.useState(chatService?.getConfig()?.mode ?? AutopilotChatMode.SideBySide);
    const [ disabledFeatures, setDisabledFeatures ] = React.useState(chatService?.getConfig()?.disabledFeatures ?? {});
    const [ firstRunExperience, setFirstRunExperience ] = React.useState(chatService?.getConfig()?.firstRunExperience ?? {
        title: '',
        description: '',
        suggestions: [],
    });

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

        const unsubscribeFirstRunExperience = chatService.on(
            AutopilotChatEvent.SetFirstRunExperience,
            (experience) => {
                setFirstRunExperience(experience);
            },
        );

        return () => {
            unsubscribeHistoryToggle();
            unsubscribeModeChange();
            unsubscribeDisabledFeatures();
            unsubscribeFirstRunExperience();
        };
    }, [ chatService, chatInternalService ]);

    const value = React.useMemo(() => ({
        historyOpen,
        chatMode,
        disabledFeatures,
        firstRunExperience,
    }), [ historyOpen, chatMode, disabledFeatures, firstRunExperience ]);

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
