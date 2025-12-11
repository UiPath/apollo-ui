import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { ApChatTheme } from '../service/ChatModel';
import { AutopilotChatInternalEvent } from '../service/ChatModel';
import { useChatService } from './chat-service.provider';

interface ThemeContextValue {
    theme: ApChatTheme;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const chatService = useChatService();
    const [theme, setTheme] = useState<ApChatTheme>(chatService.getTheme() as ApChatTheme);

    // Subscribe to theme changes from service (service → provider)
    useEffect(() => {
        const unsubscribe = chatService.__internalService__.on(
            AutopilotChatInternalEvent.SetTheme,
            (newTheme: ApChatTheme) => {
                setTheme(newTheme);
            },
        );

        return () => {
            unsubscribe();
        };
    }, [chatService]);

    const value = useMemo<ThemeContextValue>(() => ({
        theme,
        isDark: theme.startsWith('dark'),
    }), [theme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
