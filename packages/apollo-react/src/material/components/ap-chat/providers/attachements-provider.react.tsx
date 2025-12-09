import React from 'react';

import { isEqual } from 'lodash/fp';

import { useTranslate } from '../../../react/ApLocalizationProvider.react';
import {
  AutopilotChatEvent,
  AutopilotChatFileInfo,
  AutopilotChatInternalEvent,
  AutopilotChatPrompt,
} from '../service';
import { useChatService } from './chat-service.provider.react';
import { useChatState } from './chat-state-provider.react';
import { useError } from './error-provider.react';

interface AutopilotAttachmentsContextType {
    attachments: AutopilotChatFileInfo[];
    attachmentsLoading: AutopilotChatFileInfo[];
    addAttachments: (files: AutopilotChatFileInfo[]) => void;
    removeAttachment: (name: string, index: number) => void;
    clearAttachments: () => void;
}

export const AutopilotAttachmentsContext = React.createContext<AutopilotAttachmentsContextType>({
    attachments: [],
    attachmentsLoading: [],
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
    const [ attachmentsLoading, setAttachmentsLoading ] = React.useState<AutopilotChatFileInfo[]>([]);

    const attachmentsRef = React.useRef<AutopilotChatFileInfo[]>(attachments);

    React.useEffect(() => {
        const currentAttachmentsWithoutContent = attachmentsRef.current.map(({
            content: _content, ...rest
        }) => rest);
        const newAttachmentsWithoutContent = attachments.map(({
            content: _content, ...rest
        }) => rest);

        if (!isEqual(currentAttachmentsWithoutContent, newAttachmentsWithoutContent)) {
            // Calculate diff
            const added = attachments.filter(newAtt =>
                !attachmentsRef.current.some(currentAtt =>
                    currentAtt.name === newAtt.name && currentAtt.size === newAtt.size,
                ),
            );

            const removed = attachmentsRef.current.filter(currentAtt =>
                !attachments.some(newAtt =>
                    newAtt.name === currentAtt.name && newAtt.size === currentAtt.size,
                ),
            );

            attachmentsRef.current = attachments;

            const eventBus = (chatService as any)?._eventBus;

            if (eventBus && (added.length > 0 || removed.length > 0)) {
                eventBus.publish(AutopilotChatEvent.Attachments, attachments);
                eventBus.publish(AutopilotChatEvent.SetAttachments, {
                    added,
                    removed,
                });
            }
        }
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

        const unsubscribeSetAttachmentsLoading = chatService.__internalService__.on(
            AutopilotChatInternalEvent.SetAttachmentsLoading,
            (state: AutopilotChatFileInfo[]) => {
                setAttachmentsLoading(state);
            },
        );

        const unsubscribe = chatService.on(AutopilotChatEvent.SetPrompt, (p: AutopilotChatPrompt | string) => {
            const newAttachments = typeof p === 'string' ? [] : p.attachments ?? [];

            addAttachments(newAttachments);
        });

        return () => {
            unsubscribeSetAttachmentsLoading();
            unsubscribe();
        };
    }, [ chatService, addAttachments ]);

    return (
        <AutopilotAttachmentsContext.Provider value={{
            attachments,
            attachmentsLoading,
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
