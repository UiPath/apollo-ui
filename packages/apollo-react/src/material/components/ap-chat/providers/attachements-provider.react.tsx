/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import {
    AutopilotChatEvent,
    AutopilotChatFileInfo,
    AutopilotChatPrompt,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useTranslate } from '../../../react/ApLocalizationProvider.react';
import { useChatService } from './chat-service.provider.react';
import { useChatState } from './chat-state-provider.react';
import { useError } from './error-provider.react';

interface AutopilotAttachmentsContextType {
    attachments: AutopilotChatFileInfo[];
    addAttachments: (files: AutopilotChatFileInfo[]) => void;
    removeAttachment: (name: string, index: number) => void;
    clearAttachments: () => void;
}

export const AutopilotAttachmentsContext = React.createContext<AutopilotAttachmentsContextType>({
    attachments: [],
    addAttachments: () => {},
    removeAttachment: () => {},
    clearAttachments: () => {},
});

export function AutopilotAttachmentsProvider({ children }: { children: React.ReactNode }) {
    const { t } = useTranslate();
    const chatService = useChatService();
    const prompt = chatService?.getPrompt?.() as AutopilotChatPrompt | undefined;

    const { allowedAttachments } = useChatState();
    const { setError } = useError();

    const [ attachments, setAttachments ] = React.useState<AutopilotChatFileInfo[]>(
        prompt?.attachments ?? [],
    );

    const attachmentsRef = React.useRef<AutopilotChatFileInfo[]>(attachments);

    React.useEffect(() => {
        attachmentsRef.current = attachments;

        (chatService as any)._eventBus.publish(AutopilotChatEvent.Attachments, attachments);
    }, [ attachments, chatService ]);

    const addAttachments = React.useCallback((newFiles: AutopilotChatFileInfo[]) => {
        const filesToAdd = [
            ...attachmentsRef.current,
            ...newFiles.filter(file => !attachmentsRef.current.some(existing =>
                existing.name === file.name && existing.size === file.size,
            )),
        ];
        const totalCount = filesToAdd.length;

        if (allowedAttachments.maxCount && totalCount > allowedAttachments.maxCount) {
            setError(t('autopilot-chat-error-too-many-files', { maxCount: allowedAttachments.maxCount }));

            return;
        }

        if (!allowedAttachments.multiple && totalCount > 1) {
            setError(t('autopilot-chat-error-multiple-files'));

            return;
        }

        setAttachments(filesToAdd);
    }, [ allowedAttachments.maxCount, allowedAttachments.multiple, setError, t ]);

    const removeAttachment = React.useCallback((name: string, index: number) => {
        setAttachments(current => current.filter((file, i) => i !== index || file.name !== name));
    }, []);

    const clearAttachments = React.useCallback(() => {
        setAttachments([]);
    }, []);

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

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
    const context = React.useContext(AutopilotAttachmentsContext);

    if (!context) {
        throw new Error('useAttachments must be used within a AutopilotAttachmentsProvider');
    }

    return context;
}
