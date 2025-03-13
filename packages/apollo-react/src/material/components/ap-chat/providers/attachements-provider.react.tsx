/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import {
    AutopilotChatEvent,
    AutopilotChatFileInfo,
    AutopilotChatPrompt,
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatService } from '../services/chat-service';

interface AutopilotAttachmentsContextType {
    attachments: AutopilotChatFileInfo[];
    addAttachments: (files: AutopilotChatFileInfo[]) => void;
    removeAttachment: (name: string) => void;
    clearAttachments: () => void;
}

export const AutopilotAttachmentsContext = React.createContext<AutopilotAttachmentsContextType>({
    attachments: [],
    addAttachments: () => {},
    removeAttachment: () => {},
    clearAttachments: () => {},
});

export function AutopilotAttachmentsProvider({ children }: { children: React.ReactNode }) {
    const chatService = AutopilotChatService.Instance;
    const prompt = chatService?.getPrompt() as AutopilotChatPrompt | undefined;

    const [ attachments, setAttachments ] = React.useState<AutopilotChatFileInfo[]>(
        prompt?.attachments ?? [],
    );

    const addAttachments = React.useCallback((newFiles: AutopilotChatFileInfo[]) => {
        setAttachments(current => [
            ...current,
            ...newFiles.filter(file => !current.some(existing =>
                existing.name === file.name && existing.size === file.size,
            )),
        ]);
    }, []);

    const removeAttachment = React.useCallback((name: string) => {
        setAttachments(current => current.filter(file => file.name !== name));
    }, []);

    const clearAttachments = React.useCallback(() => {
        setAttachments([]);
    }, []);

    React.useEffect(() => {
        const unsubscribe = chatService.on(AutopilotChatEvent.SetPrompt, (p: AutopilotChatPrompt | string) => {
            const newAttachments = typeof p === 'string' ? [] : p.attachments ?? [];

            addAttachments(newAttachments);
        });

        return () => unsubscribe();
    }, [ chatService, addAttachments ]);

    return (
        <AutopilotAttachmentsContext.Provider value={{
            attachments,
            addAttachments,
            removeAttachment,
            clearAttachments,
        }}>
            {children}
        </AutopilotAttachmentsContext.Provider>
    );
}

export function useAttachments() {
    return React.useContext(AutopilotAttachmentsContext);
}
