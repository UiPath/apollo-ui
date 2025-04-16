/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    AutopilotChatEvent,
    AutopilotChatModelInfo,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from './chat-service.provider.react';

interface AutopilotModelPickerContextType {
    models: AutopilotChatModelInfo[] | undefined;
    setModels: (models: AutopilotChatModelInfo[]) => void;
    selectedModel: AutopilotChatModelInfo | undefined;
    setSelectedModel: (model: AutopilotChatModelInfo) => void;
}

export const AutopilotModelPickerContext = React.createContext<AutopilotModelPickerContextType>({
    models: undefined,
    setModels: () => {},
    selectedModel: undefined,
    setSelectedModel: () => {},
});

export function AutopilotModelPickerProvider({ children }: { children: React.ReactNode }) {
    const chatService = useChatService();
    const [ models, setModels ] = React.useState<AutopilotChatModelInfo[] | undefined>(chatService?.getModels() ?? undefined);
    const [ selectedModel, setSelectedModel ] = React.useState<AutopilotChatModelInfo | undefined>(
        chatService?.getSelectedModel() ?? chatService?.getModels()?.[ 0 ] ?? undefined,
    );

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribe = chatService.on(AutopilotChatEvent.SetModels, (newModels: AutopilotChatModelInfo[]) => {
            setModels(newModels);
            setSelectedModel(newModels?.[ 0 ] ?? undefined);
        });

        const unsubscribeSelectedModel = chatService.on(AutopilotChatEvent.SetSelectedModel, (newSelectedModel: AutopilotChatModelInfo) => {
            setSelectedModel(newSelectedModel);
        });

        return () => {
            unsubscribe();
            unsubscribeSelectedModel();
        };
    }, [ chatService ]);

    return (
        <AutopilotModelPickerContext.Provider value={{
            models,
            setModels,
            selectedModel,
            setSelectedModel,
        }}>
            {children}
        </AutopilotModelPickerContext.Provider>
    );
}

export function useModelPicker() {
    const context = React.useContext(AutopilotModelPickerContext);

    if (!context) {
        throw new Error('useModelPicker must be used within a AutopilotModelPickerProvider');
    }

    return context;
}
