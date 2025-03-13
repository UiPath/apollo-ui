/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Box,
    styled,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatEvent,
    AutopilotChatPrompt,
} from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { ApTextAreaReact } from '../../../ap-text-area/ap-text-area.react';
import { useAttachments } from '../../providers/attachements-provider.react';
import { useError } from '../../providers/error-provider.react';
import { useLoading } from '../../providers/loading-provider.react';
import { useStreaming } from '../../providers/streaming-provider.react';
import { AutopilotChatService } from '../../services/chat-service';
import { CHAT_INPUT_MAX_ROWS } from '../../utils/constants';
import { AutopilotChatInputActions } from './chat-input-actions.react';
import { AutopilotChatInputAttachments } from './chat-input-attachments.react';
import { AutopilotChatInputFooter } from './chat-input-footer.react';
import { AutopilotChatInputHeader } from './chat-input-header.react';

export const InputContainer = styled('div')(({ theme }) => ({
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorder}`,
    borderRadius: token.Border.BorderRadiusL,
    gap: token.Spacing.SpacingBase,
    margin: `${token.Spacing.SpacingXs} 0`,
    backgroundColor: theme.palette.semantic.colorBackground,

    '&:hover,&:has(textarea:focus)': { borderColor: theme.palette.semantic.colorNotificationBadge },

    '& .MuiTextField-root': {
        width: '100%',
        height: token.Spacing.SpacingM,
        verticalAlign: 'middle',
    },

    '& .autopilot-chat-input .ap-text-area-container textarea': {
        padding: `0 ${token.Spacing.SpacingBase} 0 !important`,
        border: 'none',
        outline: 'none',
        borderRadius: token.Border.BorderRadiusL,
        backgroundColor: 'transparent',
        color: theme.palette.semantic.colorForeground,

        '&::placeholder': { color: theme.palette.semantic.colorForegroundDeEmp },
    },
}));

function AutopilotChatInputComponent() {
    const chatService = AutopilotChatService.Instance;
    const initialPrompt = chatService?.getPrompt?.();

    const [ message, setMessage ] = React.useState(
        typeof initialPrompt === 'string' ? initialPrompt : initialPrompt?.content ?? '',
    );

    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const { setError } = useError();
    const { waitingResponse } = useLoading();
    const { streaming } = useStreaming();
    const {
        attachments, clearAttachments,
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
            setMessage('');
            return;
        }

        setMessage(value);
    }, []);

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

    // TODO: Implement prompt library
    const handlePromptLibrary = React.useCallback(() => {
        setError('Prompt library not implemented');
    }, [ setError ]);

    return (
        <>
            <AutopilotChatInputHeader
                clearInput={() => setMessage('')}
                onPromptLibrary={handlePromptLibrary}
            />

            <InputContainer onClick={() => inputRef?.current?.focus()}>
                <AutopilotChatInputAttachments/>

                <Box className="autopilot-chat-input" sx={{ padding: `${token.Spacing.SpacingS} 0 !important` }}>
                    <ApTextAreaReact
                        resize="none"
                        ref={inputRef}
                        value={message}
                        placeholder={t('autopilot-chat-input-placeholder')}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        minRows={1}
                        maxRows={CHAT_INPUT_MAX_ROWS}
                    />
                </Box>

                <AutopilotChatInputActions
                    disableSubmit={message.trim().length === 0 && attachments.length === 0 && !waitingResponse && !streaming}
                    waitingResponse={waitingResponse || streaming}
                    handleSubmit={handleSubmit}
                />
            </InputContainer>

            <AutopilotChatInputFooter />
        </>
    );
}

export const AutopilotChatInput = React.memo(AutopilotChatInputComponent);
