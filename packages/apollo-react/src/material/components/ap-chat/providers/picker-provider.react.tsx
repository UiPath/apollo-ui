/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    AutopilotChatAgentModeInfo,
    AutopilotChatCustomHeaderAction,
    AutopilotChatEvent,
    AutopilotChatModelInfo,
} from '@uipath/portal-shell-util';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

import { useChatService } from './chat-service.provider.react';

interface PickerContextType {
    // Models
    models: AutopilotChatModelInfo[];
    selectedModel: AutopilotChatModelInfo | undefined;
    handleModelChange: (modelId: string) => void;

    // Agent Modes
    agentModes: AutopilotChatAgentModeInfo[];
    selectedAgentMode: AutopilotChatAgentModeInfo | undefined;
    handleAgentModeChange: (modeId: string) => void;

    // Custom Header Actions
    customHeaderActions: AutopilotChatCustomHeaderAction[];
    handleCustomHeaderAction: (action: AutopilotChatCustomHeaderAction) => void;
}

const PickerContext = createContext<PickerContextType>({
    models: [],
    selectedModel: undefined,
    handleModelChange: () => {},
    agentModes: [],
    selectedAgentMode: undefined,
    handleAgentModeChange: () => {},
    customHeaderActions: [],
    handleCustomHeaderAction: () => {},
});

export const AutopilotPickerProvider = ({ children }: { children: React.ReactNode }) => {
    const chatService = useChatService();

    // Models state
    const [ models, setModels ] = useState<AutopilotChatModelInfo[]>([]);
    const [ selectedModel, setSelectedModel ] = useState<AutopilotChatModelInfo | undefined>();

    // Agent Modes state
    const [ agentModes, setAgentModes ] = useState<AutopilotChatAgentModeInfo[]>([]);
    const [ selectedAgentMode, setSelectedAgentMode ] = useState<AutopilotChatAgentModeInfo | undefined>();

    // Custom Header Actions state
    const [ customHeaderActions, setCustomHeaderActions ] = useState<AutopilotChatCustomHeaderAction[]>([]);

    // Combined effects for Models, Agent Modes, and Custom Header Actions
    useEffect(() => {
        if (!chatService) {
            return;
        }

        // Subscribe to Models events
        const unsubscribeModels = chatService.on(
            AutopilotChatEvent.SetModels,
            (newModels: AutopilotChatModelInfo[]) => {
                setModels(newModels);
            },
        );

        const unsubscribeSelectedModel = chatService.on(
            AutopilotChatEvent.SetSelectedModel,
            (model: AutopilotChatModelInfo) => {
                setSelectedModel(model);
            },
        );

        // Subscribe to Agent Modes events
        const unsubscribeAgentModes = chatService.on(
            AutopilotChatEvent.SetAgentModes,
            (modes: AutopilotChatAgentModeInfo[]) => {
                setAgentModes(modes);
            },
        );

        const unsubscribeSelectedAgentMode = chatService.on(
            AutopilotChatEvent.SetSelectedAgentMode,
            (mode: AutopilotChatAgentModeInfo) => {
                setSelectedAgentMode(mode);
            },
        );

        // Subscribe to Custom Header Actions events
        const unsubscribeCustomHeaderActions = chatService.on(
            AutopilotChatEvent.SetCustomHeaderActions,
            (actions: AutopilotChatCustomHeaderAction[]) => {
                setCustomHeaderActions(actions);
            },
        );

        // Initialize state from chatService
        if (chatService.getModels) {
            setModels(chatService.getModels() ?? []);
        }
        if (chatService.getSelectedModel) {
            setSelectedModel(chatService.getSelectedModel());
        }
        if (chatService.getAgentModes) {
            setAgentModes(chatService.getAgentModes() ?? []);
        }
        if (chatService.getAgentMode) {
            setSelectedAgentMode(chatService.getAgentMode());
        }
        if (chatService.getCustomHeaderActions) {
            setCustomHeaderActions(chatService.getCustomHeaderActions() ?? []);
        }

        return () => {
            unsubscribeModels();
            unsubscribeSelectedModel();
            unsubscribeAgentModes();
            unsubscribeSelectedAgentMode();
            unsubscribeCustomHeaderActions();
        };
    }, [ chatService ]);

    // Handlers
    const handleModelChange = useCallback((modelId: string) => {
        chatService?.setSelectedModel(modelId);
    }, [ chatService ]);

    const handleAgentModeChange = useCallback((modeId: string) => {
        chatService?.setAgentMode(modeId);
    }, [ chatService ]);

    const handleCustomHeaderAction = useCallback((action: AutopilotChatCustomHeaderAction) => {
        (chatService as any)?._eventBus.publish(AutopilotChatEvent.CustomHeaderActionClicked, action);
    }, [ chatService ]);

    return (
        <PickerContext.Provider
            value={{
                models,
                selectedModel,
                handleModelChange,
                agentModes,
                selectedAgentMode,
                handleAgentModeChange,
                customHeaderActions,
                handleCustomHeaderAction,
            }}
        >
            {children}
        </PickerContext.Provider>
    );
};

export const usePicker = () => useContext(PickerContext);
