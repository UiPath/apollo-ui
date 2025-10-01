/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Box,
    styled,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatPrompt,
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { ApTextAreaReact } from '../../../ap-text-area/ap-text-area.react';
import { useAttachments } from '../../providers/attachements-provider.react';
import { useChatService } from '../../providers/chat-service.provider.react';
import { useChatState } from '../../providers/chat-state-provider.react';
import { useLoading } from '../../providers/loading-provider.react';
import { useStreaming } from '../../providers/streaming-provider.react';
import { parseFiles } from '../../utils/file-reader';
import { fontByVariant } from '../../utils/font-by-variant';
import { AutopilotChatInputActions } from './chat-input-actions.react';
import { AutopilotChatInputAttachments } from './chat-input-attachments.react';
import { AutopilotChatInputError } from './chat-input-error.react';
import { AutopilotChatInputFooter } from './chat-input-footer.react';

export const InputContainer = styled('div')<{ primaryFontToken: FontVariantToken }>(({
    theme, primaryFontToken,
}) => ({
    border: `${token.Border.BorderThickM} solid transparent`,
    boxShadow: `inset 0 0 0 ${token.Border.BorderThickS} ${theme.palette.semantic.colorBorder}`,
    borderRadius: token.Border.BorderRadiusL,
    gap: token.Spacing.SpacingBase,
    marginBottom: token.Spacing.SpacingXs,

    '&:has(textarea:focus)': {
        borderColor: theme.palette.semantic.colorFocusIndicator,
        boxShadow: 'none',
    },

    '& .MuiTextField-root': {
        width: '100%',
        height: token.Spacing.SpacingM,
        verticalAlign: 'middle',
    },

    '& .autopilot-chat-input': { position: 'relative' },

    '& .autopilot-chat-input .ap-text-area-container textarea': {
        padding: `0 ${token.Spacing.SpacingBase} 0 !important`,
        border: 'none',
        outline: 'none',
        borderRadius: token.Border.BorderRadiusL,
        backgroundColor: 'transparent',
        color: theme.palette.semantic.colorForeground,

        '&::placeholder': { color: theme.palette.semantic.colorForegroundDeEmp },

        ...(primaryFontToken && {
            '&, &::placeholder': {
                fontSize: fontByVariant(primaryFontToken).fontSize,
                fontFamily: fontByVariant(primaryFontToken).fontFamily,
                lineHeight: fontByVariant(primaryFontToken).lineHeight,
                fontWeight: fontByVariant(primaryFontToken).fontWeight,
            },
        }),
    },
}));

const GradientContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    zIndex: 1,
    bottom: '2px',
    left: token.Spacing.SpacingBase,
    width: `calc(100% - 2 * ${token.Spacing.SpacingBase})`,
    height: token.Spacing.SpacingXs,
    background: `linear-gradient(
        to bottom,
        ${theme.palette.semantic.colorBackground}50 0%,
        ${theme.palette.semantic.colorBackground}75 25%,
        ${theme.palette.semantic.colorBackground} 50%
    )`,
}));

function AutopilotChatInputComponent() {
    const chatService = useChatService();
    const initialPrompt = chatService?.getPrompt?.();
    const {
        disabledFeatures,
        overrideLabels,
        spacing,
    } = useChatState();

    const [ message, setMessage ] = React.useState(
        typeof initialPrompt === 'string' ? initialPrompt : initialPrompt?.content ?? '',
    );

    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const {
        waitingResponse, skeletonLoader,
    } = useLoading();
    const { streaming } = useStreaming();
    const {
        attachments, clearAttachments, addAttachments,
    } = useAttachments();

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribeSetPrompt = chatService.on(AutopilotChatEvent.SetPrompt, (prompt: AutopilotChatPrompt | string) => {
            setMessage(typeof prompt === 'string' ? prompt : prompt.content);
        });

        return () => {
            unsubscribeSetPrompt();
        };
    }, [ chatService ]);

    const handleChange = React.useCallback((value: string) => {
        // if value is empty, clear input and return (handle empty new lines)
        if (value.trim().length === 0) {
            chatService.setPrompt('');
            return;
        }

        chatService.setPrompt(value);
    }, [ chatService ]);

    const handleSubmit = React.useCallback(() => {
        if (waitingResponse || streaming) {
            chatService.stopResponse();
            return;
        }

        chatService.sendRequest({
            content: message,
            attachments,
        });

        // clear input
        setMessage('');
        clearAttachments();
    }, [ message, attachments, clearAttachments, chatService, waitingResponse, streaming ]);

    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
        if (waitingResponse || streaming) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
            }

            return;
        }

        if (event.key === 'Enter' && !event.shiftKey && message.trim().length > 0) {
            handleSubmit();
        }
    }, [ message, handleSubmit, waitingResponse, streaming ]);

    const handlePaste = React.useCallback(async (event: ClipboardEvent) => {
        if (disabledFeatures?.attachments) {
            return;
        }

        const items = event.clipboardData?.items;

        if (!items) {
            return;
        }

        const allowedAttachments = Object.keys(chatService?.getConfig()?.allowedAttachments?.types ?? {});
        const attachmentsToAdd: File[] = [];
        let foundAllowedAttachment = false;

        for (let i = 0; i < items.length; i++) {
            if (allowedAttachments.includes(items[i].type)) {
                const blob = items[i].getAsFile();

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
    }, [ chatService, addAttachments, disabledFeatures?.attachments ]);

    React.useEffect(() => {
        if (!inputRef.current) {
            return;
        }

        const textareaElement = inputRef.current;
        textareaElement.addEventListener('paste', handlePaste);

        return () => {
            textareaElement.removeEventListener('paste', handlePaste);
        };
    }, [ handlePaste ]);

    return (
        <>
            <AutopilotChatInputError />

            <InputContainer primaryFontToken={spacing.primaryFontToken} onClick={() => inputRef?.current?.focus()}>
                <AutopilotChatInputAttachments/>

                <Box className="autopilot-chat-input" sx={{ padding: `${token.Spacing.SpacingS} 0 0 !important` }}>
                    <ApTextAreaReact
                        resize="none"
                        ref={inputRef}
                        value={message}
                        placeholder={overrideLabels?.inputPlaceholder ?? t('autopilot-chat-input-placeholder')}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        minRows={spacing.promptBox.minRows}
                        maxRows={spacing.promptBox.maxRows}
                    />

                    <GradientContainer/>
                </Box>

                <AutopilotChatInputActions
                    disableSubmit={(
                        message.trim().length === 0 &&
                        attachments.length === 0 &&
                        !waitingResponse &&
                        !streaming
                    ) || (skeletonLoader && !waitingResponse && !streaming)}
                    waitingResponse={waitingResponse || streaming}
                    handleSubmit={handleSubmit}
                />
            </InputContainer>

            {!disabledFeatures?.footer && <AutopilotChatInputFooter />}
        </>
    );
}

export const AutopilotChatInput = React.memo(AutopilotChatInputComponent);
