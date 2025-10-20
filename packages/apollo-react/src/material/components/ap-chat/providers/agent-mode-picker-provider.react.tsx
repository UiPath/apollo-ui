/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    AutopilotChatAgentModeInfo,
    AutopilotChatEvent,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from './chat-service.provider.react';

interface AutopilotAgentModePickerContextType {
    agentModes: AutopilotChatAgentModeInfo[] | undefined;
    setAgentModes: (agentModes: AutopilotChatAgentModeInfo[]) => void;
    selectedAgentMode: AutopilotChatAgentModeInfo | undefined;
    setSelectedAgentMode: (agentMode: AutopilotChatAgentModeInfo) => void;
}

export const AutopilotAgentModePickerContext = React.createContext<AutopilotAgentModePickerContextType>({
    agentModes: [],
    setAgentModes: () => {},
    selectedAgentMode: undefined,
    setSelectedAgentMode: () => {},
});

export function AutopilotAgentModePickerProvider({ children }: { children: React.ReactNode }) {
    const chatService = useChatService();
    const [ agentModes, setAgentModes ] = React.useState<AutopilotChatAgentModeInfo[] | undefined>(
        chatService?.getAgentModes() ?? undefined,
    );
    const [ selectedAgentMode, setSelectedAgentMode ] = React.useState<AutopilotChatAgentModeInfo | undefined>(
        chatService?.getAgentMode() ?? chatService?.getAgentModes()?.[0] ?? undefined,
    );

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribe = chatService.on(AutopilotChatEvent.SetAgentModes, (newAgentModes: AutopilotChatAgentModeInfo[]) => {
            setAgentModes(newAgentModes);
            setSelectedAgentMode(newAgentModes?.[0] ?? undefined);
        });

        const unsubscribeSelectedAgentMode = chatService.on(AutopilotChatEvent.SetSelectedAgentMode, (mode: AutopilotChatAgentModeInfo) => {
            setSelectedAgentMode(mode);
        });

        return () => {
            unsubscribe();
            unsubscribeSelectedAgentMode();
        };
    }, [ chatService, agentModes ]);

    return (
        <AutopilotAgentModePickerContext.Provider value={{
            agentModes,
            setAgentModes,
            selectedAgentMode,
            setSelectedAgentMode,
        }}>
            {children}
        </AutopilotAgentModePickerContext.Provider>
    );
}

export function useAgentModePicker() {
    const context = React.useContext(AutopilotAgentModePickerContext);

    if (!context) {
        throw new Error('useAgentModePicker must be used within a AutopilotAgentModePickerProvider');
    }

    return context;
}
