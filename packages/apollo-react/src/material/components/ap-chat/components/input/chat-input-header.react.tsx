/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { StatusTypes } from '../../../../models/statusTypes';
import { t } from '../../../../utils/localization/loc';
import { useError } from '../../providers/error-provider.react';
import { AutopilotChatActionButton } from '../common/action-button.react';

interface AutopilotChatInputHeaderProps {
    onNewChat: (event: React.MouseEvent) => void;
    onPromptLibrary: (event: React.MouseEvent) => void;
}

const InputHeaderActions = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: token.Spacing.SpacingXs,
}));

export const AutopilotChatInputHeader = ({
    onNewChat, onPromptLibrary,
}: AutopilotChatInputHeaderProps) => {
    const {
        error, clearError,
    } = useError();

    // FIXME: ApAlertBarReact doesn't have the styles.. they are in the ap-alert-bar component
    React.useEffect(() => {
        const listener = () => clearError();

        document.addEventListener('cancelAlert', listener);

        return () => {
            document.removeEventListener('cancelAlert', listener);
        };
    }, [ clearError ]);

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
                onClick={onNewChat}
            />
        </InputHeaderActions>
    );
};
