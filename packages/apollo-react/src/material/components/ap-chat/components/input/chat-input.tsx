import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Box, styled } from '@mui/material';
import token, { type FontVariantToken } from '@uipath/apollo-core';
import React from 'react';
import { useAttachments } from '../../providers/attachements-provider';
import { useChatService } from '../../providers/chat-service.provider';
import { useChatState } from '../../providers/chat-state-provider';
import { useLoading } from '../../providers/loading-provider';
import { useResourceData } from '../../providers/resource-data-provider';
import { useStreaming } from '../../providers/streaming-provider';
import {
  AutopilotChatEvent,
  AutopilotChatInternalEvent,
  type AutopilotChatPrompt,
} from '../../service';
import { parseFiles } from '../../utils/file-reader';
import { fontByVariant } from '../../utils/font-by-variant';
import { AutopilotChatInputActions } from './chat-input-actions';
import { AutopilotChatInputAttachments } from './chat-input-attachments';
import { ChatInputEditor, type ChatInputEditorHandle } from './chat-input-editor';
import { AutopilotChatInputError } from './chat-input-error';
import { AutopilotChatInputFooter } from './chat-input-footer';

const InputContainer = styled('div')<{ primaryFontToken: FontVariantToken }>(
  ({ primaryFontToken }) => ({
    border: `${token.Border.BorderThickM} solid transparent`,
    boxShadow: `inset 0 0 0 ${token.Border.BorderThickS} var(--color-border)`,
    borderRadius: token.Border.BorderRadiusL,
    gap: token.Spacing.SpacingBase,
    marginBottom: token.Spacing.SpacingXs,

    '&:focus-within': {
      borderColor: 'var(--color-focus-indicator)',
      boxShadow: 'none',
    },

    '& .MuiTextField-root': {
      width: '100%',
      height: token.Spacing.SpacingM,
      verticalAlign: 'middle',
    },

    '& .autopilot-chat-input': { position: 'relative' },

    '& .autopilot-chat-input .tiptap-editor-container': {
      padding: `0 ${token.Spacing.SpacingBase}`,
      color: 'var(--color-foreground)',

      '&:focus': {
        boxShadow: 'none',
      },

      ...(primaryFontToken &&
        (() => {
          const fontToken = fontByVariant(primaryFontToken);
          return fontToken
            ? {
                fontSize: fontToken.fontSize,
                fontFamily: fontToken.fontFamily,
                lineHeight: fontToken.lineHeight,
                fontWeight: fontToken.fontWeight,
              }
            : {};
        })()),
    },
  })
);

const GradientContainer = styled('div')(() => ({
  position: 'absolute',
  zIndex: 1,
  bottom: '2px',
  left: token.Spacing.SpacingBase,
  width: `calc(100% - 2 * ${token.Spacing.SpacingBase})`,
  height: token.Spacing.SpacingXs,
  background: `linear-gradient(
        to bottom,
        var(--color-background)50 0%,
        var(--color-background)75 25%,
        var(--color-background) 50%
    )`,
}));

function AutopilotChatInputComponent() {
  const { _ } = useLingui();
  const chatService = useChatService();
  const initialPrompt = chatService?.getPrompt?.();
  const { disabledFeatures, overrideLabels, spacing } = useChatState();

  const { hasResources } = useResourceData();
  const [message, setMessage] = React.useState(
    typeof initialPrompt === 'string' ? initialPrompt : (initialPrompt?.content ?? '')
  );

  const editorRef = React.useRef<ChatInputEditorHandle>(null);
  const inputContainerRef = React.useRef<HTMLDivElement>(null);
  const { waitingResponse, skeletonLoader } = useLoading();
  const { streaming } = useStreaming();
  const { attachments, clearAttachments, addAttachments, attachmentsLoading } = useAttachments();

  const editorLineHeight = React.useMemo(() => {
    const fontToken = fontByVariant(spacing.primaryFontToken);
    return fontToken?.lineHeight;
  }, [spacing.primaryFontToken]);

  React.useEffect(() => {
    if (!chatService) {
      return;
    }

    const unsubscribeSetInputFocused = chatService.__internalService__.on(
      AutopilotChatInternalEvent.SetInputFocused,
      (value: boolean) => {
        if (value) {
          editorRef.current?.focus();
        }
      }
    );

    const unsubscribeSetPrompt = chatService.on(
      AutopilotChatEvent.SetPrompt,
      (prompt: AutopilotChatPrompt | string) => {
        setMessage(typeof prompt === 'string' ? prompt : prompt.content);
      }
    );

    return () => {
      unsubscribeSetInputFocused();
      unsubscribeSetPrompt();
    };
  }, [chatService]);

  const handleChange = React.useCallback(
    (value: string) => {
      // if value is empty, clear input and return (handle empty new lines)
      if (value.trim().length === 0) {
        chatService.setPrompt('');
        return;
      }

      chatService.setPrompt(value);
    },
    [chatService]
  );

  const handleSubmit = React.useCallback(() => {
    if (waitingResponse || streaming) {
      chatService.stopResponse();
      return;
    }

    const serializedContent = editorRef.current?.getSerializedContent() ?? message;

    chatService.sendRequest({
      content: serializedContent,
      attachments,
    });

    // clear input
    editorRef.current?.clear();
    setMessage('');
    clearAttachments();
  }, [message, attachments, clearAttachments, chatService, waitingResponse, streaming]);

  const handleKeyDown = React.useCallback(
    (event: KeyboardEvent): boolean => {
      if (event.key !== 'Enter' || event.shiftKey) {
        return false;
      }

      if (waitingResponse || streaming) {
        event.preventDefault();
        return true;
      }

      const editorContent = editorRef.current?.getSerializedContent() ?? message;
      if ((editorContent.trim().length > 0 || attachments.length > 0) && !skeletonLoader) {
        handleSubmit();
        return true;
      }
      return false;
    },
    [message, handleSubmit, waitingResponse, streaming, skeletonLoader, attachments]
  );

  const handlePaste = React.useCallback(
    async (event: ClipboardEvent) => {
      if (disabledFeatures?.attachments) {
        return;
      }

      const items = event.clipboardData?.items;

      if (!items) {
        return;
      }

      const allowedAttachments = Object.keys(
        chatService?.getConfig()?.allowedAttachments?.types ?? {}
      );
      const attachmentsToAdd: File[] = [];
      let foundAllowedAttachment = false;

      for (let i = 0; i < items.length; i++) {
        if (allowedAttachments.includes(items[i]!.type)) {
          const blob = items[i]!.getAsFile();

          if (blob) {
            attachmentsToAdd.push(blob);
            foundAllowedAttachment = true;
          }
        }
      }

      if (foundAllowedAttachment) {
        event.preventDefault();
      }

      const parsedFiles = await parseFiles(attachmentsToAdd);

      addAttachments(parsedFiles);
    },
    [chatService, addAttachments, disabledFeatures?.attachments]
  );

  React.useEffect(() => {
    const container = inputContainerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('paste', handlePaste);

    return () => {
      container.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const hasLoadingAttachments =
    attachmentsLoading.filter((attachment) => attachment.loading).length > 0;

  const handleResourceTriggerClick = () => {
    editorRef.current?.openResourcePicker();
  };

  return (
    <>
      <AutopilotChatInputError />

      <InputContainer
        primaryFontToken={spacing.primaryFontToken}
        onClick={() => editorRef?.current?.focus()}
        ref={inputContainerRef}
      >
        <AutopilotChatInputAttachments />

        <Box
          className="autopilot-chat-input"
          sx={{ padding: `${token.Spacing.SpacingS} 0 0 !important` }}
        >
          <div className="tiptap-editor-container">
            <ChatInputEditor
              ref={editorRef}
              value={message}
              placeholder={
                overrideLabels?.inputPlaceholder ??
                _(msg({ id: 'autopilot-chat.input.placeholder', message: `Type a message...` }))
              }
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              minRows={spacing.promptBox.minRows}
              maxRows={spacing.promptBox.maxRows}
              lineHeight={editorLineHeight}
              anchorEl={inputContainerRef.current}
            />
          </div>

          <GradientContainer />
        </Box>

        <AutopilotChatInputActions
          disableSubmit={
            (message.trim().length === 0 &&
              attachments.length === 0 &&
              !waitingResponse &&
              !streaming) ||
            (skeletonLoader && !waitingResponse && !streaming) ||
            hasLoadingAttachments
          }
          waitingResponse={waitingResponse || streaming}
          handleSubmit={handleSubmit}
          onResourceTriggerClick={hasResources ? handleResourceTriggerClick : undefined}
        />
      </InputContainer>

      {!disabledFeatures?.footer && <AutopilotChatInputFooter />}
    </>
  );
}

export const AutopilotChatInput = React.memo(AutopilotChatInputComponent);
