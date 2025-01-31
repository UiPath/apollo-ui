/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Box,
    styled,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { ApTextAreaReact } from '../../../ap-text-area/ap-text-area.react';
import { AutopilotChatRole } from '../../models/chat.model';
import { useAttachments } from '../../providers/attachements-provider.react';
import { useError } from '../../providers/error-provider.react';
import { AutopilotChatService } from '../../services/chat-service';
import {
    CHAT_INPUT_MAX_ROWS,
    DEFAULT_MESSAGE_RENDERER,
} from '../../utils/constants';
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
    const [ message, setMessage ] = React.useState('');
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const { setError } = useError();
    const {
        attachments, clearAttachments,
    } = useAttachments();

    const handleChange = React.useCallback((value: string) => {
        // if value is empty, clear input and return (handle empty new lines)
        if (value.trim().length === 0) {
            setMessage('');
            return;
        }

        setMessage(value);
    }, []);

    const handleSubmit = React.useCallback(() => {
        const chatService = AutopilotChatService.Instance;

        chatService.sendMessage({
            id: crypto.randomUUID(),
            content: message,
            created_at: new Date().toISOString(),
            role: AutopilotChatRole.User,
            widget: DEFAULT_MESSAGE_RENDERER,
            attachments,
        });
        // clear input
        setMessage('');
        clearAttachments();
    }, [ message, attachments, clearAttachments ]);

    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey && message.trim().length > 0) {
            handleSubmit();
        }
    }, [ message, handleSubmit ]);

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
                    disableSubmit={message.trim().length === 0 && attachments.length === 0}
                    handleSubmit={handleSubmit}
                />
            </InputContainer>

            <AutopilotChatInputFooter />
        </>
    );
}

export const AutopilotChatInput = React.memo(AutopilotChatInputComponent);
