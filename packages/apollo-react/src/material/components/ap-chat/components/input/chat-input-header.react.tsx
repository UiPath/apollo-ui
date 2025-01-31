/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { StatusTypes } from '../../../../models/statusTypes';
import { t } from '../../../../utils/localization/loc';
import { useAttachments } from '../../providers/attachements-provider.react';
import { useError } from '../../providers/error-provider.react';
import { AutopilotChatService } from '../../services/chat-service';
import { AutopilotChatActionButton } from '../common/action-button.react';

interface AutopilotChatInputHeaderProps {
    onPromptLibrary: (event: React.MouseEvent) => void;
    clearInput: () => void;
}

const InputHeaderActions = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: token.Spacing.SpacingXs,
}));

function AutopilotChatInputHeaderComponent({
    onPromptLibrary, clearInput,
}: AutopilotChatInputHeaderProps) {
    const {
        error, clearError,
    } = useError();

    const { clearAttachments } = useAttachments();

    // FIXME: ApAlertBarReact doesn't have the styles.. they are in the ap-alert-bar component
    React.useEffect(() => {
        const listener = () => clearError();

        document.addEventListener('cancelAlert', listener);

        return () => {
            document.removeEventListener('cancelAlert', listener);
        };
    }, [ clearError ]);

    const handleNewChat = React.useCallback(() => {
        AutopilotChatService.Instance.newChat();
        clearAttachments();
        clearInput();
    }, [ clearAttachments, clearInput ]);

    if (error) {
        return <ap-alert-bar style={{ width: '100%' }} status={StatusTypes.ERROR}>{error}</ap-alert-bar>;
    }

    return (
        <InputHeaderActions>
            <AutopilotChatActionButton
                iconName="book_2"
                tooltip={t('autopilot-chat-prompt-library')}
                onClick={onPromptLibrary}
                variant="custom"
            />
            <AutopilotChatActionButton
                iconName="add"
                text={t('autopilot-chat-new-chat')}
                onClick={handleNewChat}
            />
        </InputHeaderActions>
    );
}

export const AutopilotChatInputHeader = React.memo(AutopilotChatInputHeaderComponent);
