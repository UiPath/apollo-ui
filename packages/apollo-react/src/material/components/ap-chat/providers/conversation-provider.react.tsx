/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';

import {
    AutopilotChatConfiguration,
    AutopilotChatEvent,
    AutopilotChatMessage,
} from '../models/chat.model';
import { AutopilotChatService } from '../services/chat-service';

interface AutopilotConversationContextType {
    messages: AutopilotChatMessage[];
    config: AutopilotChatConfiguration | null;
}

export const AutopilotConversationContext = React.createContext<AutopilotConversationContextType>({
    messages: [],
    config: null,
});

export function AutopilotConversationProvider({ children }: { children: React.ReactNode }) {
    const [ messages, setMessages ] = React.useState<AutopilotChatMessage[]>([]);
    const [ config ] = React.useState<AutopilotChatConfiguration | null>(null);

    React.useEffect(() => {
        const chatService = AutopilotChatService.Instance;
        const unsubscribe = chatService.on(AutopilotChatEvent.Message, (message: AutopilotChatMessage) => {
            setMessages(current => [ ...current, message ]);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <AutopilotConversationContext.Provider value={{
            messages,
            config,
        }}>
            {children}
        </AutopilotConversationContext.Provider>
    );
}

export function useConversation() {
    return React.useContext(AutopilotConversationContext);
}
