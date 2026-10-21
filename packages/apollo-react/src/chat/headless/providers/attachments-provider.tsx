import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { isEqual } from 'lodash/fp';
import React from 'react';

import {
  AutopilotChatEvent,
  type AutopilotChatFileInfo,
  AutopilotChatInternalEvent,
  type AutopilotChatPrompt,
} from '../../service';
import { publishChatEvent } from '../utils/publish-chat-event';
import { useChatService } from './chat-service.provider';
import { useChatState } from './chat-state-provider';
import { useError } from './error-provider';

interface AutopilotAttachmentsContextType {
  attachments: AutopilotChatFileInfo[];
  /** The draft including changes not rendered yet, for intakes that finish back to back. */
  getAttachments: () => AutopilotChatFileInfo[];
  attachmentsLoading: AutopilotChatFileInfo[];
  addAttachments: (files: AutopilotChatFileInfo[]) => void;
  removeAttachment: (name: string, index: number) => void;
  clearAttachments: () => void;
}

export const AutopilotAttachmentsContext = React.createContext<AutopilotAttachmentsContextType>({
  attachments: [],
  getAttachments: () => [],
  attachmentsLoading: [],
  addAttachments: () => {},
  removeAttachment: () => {},
  clearAttachments: () => {},
});

export function AutopilotAttachmentsProvider({ children }: { children: React.ReactNode }) {
  const { _ } = useLingui();
  const chatService = useChatService();
  const prompt = chatService?.getPrompt?.() as AutopilotChatPrompt | undefined;

  const { allowedAttachments } = useChatState();
  const { setError } = useError();

  const [attachments, setAttachments] = React.useState<AutopilotChatFileInfo[]>(
    prompt?.attachments ?? []
  );
  const [attachmentsLoading, setAttachmentsLoading] = React.useState<AutopilotChatFileInfo[]>([]);

  // What the events last reported; the diff below publishes what changed since.
  const attachmentsRef = React.useRef<AutopilotChatFileInfo[]>(attachments);
  // The draft as of the last change, ahead of the render: two adds before a re-render would
  // otherwise both start from the rendered list, and the second would drop the first's files.
  const latestRef = React.useRef<AutopilotChatFileInfo[]>(attachments);
  const update = React.useCallback((next: AutopilotChatFileInfo[]) => {
    latestRef.current = next;
    setAttachments(next);
  }, []);
  const getAttachments = React.useCallback(() => latestRef.current, []);

  React.useEffect(() => {
    const currentAttachmentsWithoutContent = attachmentsRef.current.map(
      ({ content: _content, ...rest }) => rest
    );
    const newAttachmentsWithoutContent = attachments.map(({ content: _content, ...rest }) => rest);

    if (!isEqual(currentAttachmentsWithoutContent, newAttachmentsWithoutContent)) {
      // Calculate diff
      const added = attachments.filter(
        (newAtt) =>
          !attachmentsRef.current.some(
            (currentAtt) => currentAtt.name === newAtt.name && currentAtt.size === newAtt.size
          )
      );

      const removed = attachmentsRef.current.filter(
        (currentAtt) =>
          !attachments.some(
            (newAtt) => newAtt.name === currentAtt.name && newAtt.size === currentAtt.size
          )
      );

      attachmentsRef.current = attachments;

      if (chatService && (added.length > 0 || removed.length > 0)) {
        publishChatEvent(chatService, AutopilotChatEvent.Attachments, attachments);
        publishChatEvent(chatService, AutopilotChatEvent.SetAttachments, { added, removed });
      }
    }
  }, [attachments, chatService]);

  const addAttachments = React.useCallback(
    (newFiles: AutopilotChatFileInfo[]) => {
      const current = latestRef.current;
      const filesToAdd = [
        ...current,
        ...newFiles.filter(
          (file) =>
            !current.some((existing) => existing.name === file.name && existing.size === file.size)
        ),
      ];
      const totalCount = filesToAdd.length;

      if (allowedAttachments.maxCount && totalCount > allowedAttachments.maxCount) {
        setError(
          _(
            msg({
              id: 'autopilot-chat.error.too-many-files',
              message: `Maximum ${allowedAttachments.maxCount} files allowed`,
            })
          )
        );

        return;
      }

      if (!allowedAttachments.multiple && totalCount > 1) {
        setError(
          _(
            msg({
              id: 'autopilot-chat.error.multiple-files',
              message: `Only one file is allowed`,
            })
          )
        );

        return;
      }

      update(filesToAdd);
    },
    [allowedAttachments.maxCount, allowedAttachments.multiple, setError, _, update]
  );

  const removeAttachment = React.useCallback(
    (name: string, index: number) =>
      update(latestRef.current.filter((file, i) => i !== index || file.name !== name)),
    [update]
  );

  const clearAttachments = React.useCallback(() => update([]), [update]);

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const unsubscribeSetAttachmentsLoading = chatService.__internalService__.on(
      AutopilotChatInternalEvent.SetAttachmentsLoading,
      (state: AutopilotChatFileInfo[]) => {
        setAttachmentsLoading(state);
      }
    );

    const unsubscribe = chatService.on(
      AutopilotChatEvent.SetPrompt,
      (p: AutopilotChatPrompt | string) => {
        const newAttachments = typeof p === 'string' ? [] : (p.attachments ?? []);

        addAttachments(newAttachments);
      }
    );

    return () => {
      unsubscribeSetAttachmentsLoading();
      unsubscribe();
    };
  }, [chatService, addAttachments]);

  return (
    <AutopilotAttachmentsContext.Provider
      value={{
        attachments,
        getAttachments,
        attachmentsLoading,
        addAttachments,
        removeAttachment,
        clearAttachments,
      }}
    >
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
