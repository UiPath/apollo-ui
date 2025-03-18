/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import React from 'react';

import { StorageService } from '../services/storage';
import {
    CHAT_WIDTH_KEY,
    CHAT_WIDTH_SIDE_BY_SIDE_MIN,
} from '../utils/constants';

interface ChatWidthContextType {
    width: number;
    setWidth: (width: number) => void;
    shouldAnimate: boolean;
    setShouldAnimate: (shouldAnimate: boolean) => void;
}

export const ChatWidthContext = React.createContext<ChatWidthContextType | null>(null);

export function useChatWidth() {
    const context = React.useContext(ChatWidthContext);
    if (!context) {
        throw new Error('useChatWidth must be used within a ChatWidthProvider');
    }
    return context;
}

interface ChatWidthProviderProps {
    children: React.ReactNode;
}

export function ChatWidthProvider({ children }: ChatWidthProviderProps) {
    const storage = StorageService.Instance;
    const [ width, setWidth ] = React.useState(() => {
        const savedWidth = storage.get(CHAT_WIDTH_KEY);

        return savedWidth ? parseInt(savedWidth, 10) : CHAT_WIDTH_SIDE_BY_SIDE_MIN;
    });
    const [ shouldAnimate, setShouldAnimate ] = React.useState(false);

    const value = React.useMemo(() => ({
        width,
        setWidth,
        shouldAnimate,
        setShouldAnimate,
    }), [ width, shouldAnimate ]);

    return (
        <ChatWidthContext.Provider value={value}>
            {children}
        </ChatWidthContext.Provider>
    );
}
