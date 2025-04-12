/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    CHAT_WIDTH_KEY,
    CHAT_WIDTH_SIDE_BY_SIDE_MIN,
    StorageService,
} from '@uipath/portal-shell-util';
import React from 'react';

interface AutopilotChatWidthContextType {
    width: number;
    setWidth: (width: number) => void;
    shouldAnimate: boolean;
    setShouldAnimate: (shouldAnimate: boolean) => void;
}

export const AutopilotChatWidthContext = React.createContext<AutopilotChatWidthContextType | null>(null);

interface AutopilotChatWidthProviderProps {
    children: React.ReactNode;
}

export function AutopilotChatWidthProvider({ children }: AutopilotChatWidthProviderProps) {
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
        <AutopilotChatWidthContext.Provider value={value}>
            {children}
        </AutopilotChatWidthContext.Provider>
    );
}

export function useChatWidth() {
    const context = React.useContext(AutopilotChatWidthContext);

    if (!context) {
        throw new Error('useChatWidth must be used within a AutopilotChatWidthProvider');
    }

    return context;
}
