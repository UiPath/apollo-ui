/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React from 'react';

import {
    AutopilotChatEvent,
    AutopilotChatPrompt,
    FileInfo,
} from '../models/chat.model';
import { AutopilotChatService } from '../services/chat-service';

interface AutopilotAttachmentsContextType {
    attachments: FileInfo[];
    addAttachments: (files: FileInfo[]) => void;
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
    const [ attachments, setAttachments ] = React.useState<FileInfo[]>([]);

    const addAttachments = React.useCallback((newFiles: FileInfo[]) => {
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
        const unsubscribe = chatService.on(AutopilotChatEvent.SetPrompt, (prompt: AutopilotChatPrompt | string) => {
            const newAttachments = typeof prompt === 'string' ? [] : prompt.attachments ?? [];
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
