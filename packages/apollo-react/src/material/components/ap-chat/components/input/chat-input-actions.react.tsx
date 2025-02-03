/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useAttachments } from '../../providers/attachements-provider.react';
import { useError } from '../../providers/error-provider.react';
import { ACCEPTED_FILE_EXTENSIONS } from '../../utils/constants';
import { parseFiles } from '../../utils/file-reader.react';
import { AutopilotChatActionButton } from '../common/action-button.react';

const InputActionsContainer = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    padding: `0 ${token.Spacing.SpacingXs} ${token.Spacing.SpacingXs}`,
}));

const InputActionsGroup = styled('div')(() => ({
    display: 'flex',
    gap: token.Spacing.SpacingXs,
}));

const SubmitButtonContainer = styled('div')(({ theme }) => ({
    '& .MuiIconButton-root': {
        borderRadius: token.Border.BorderRadiusM,
        backgroundColor: theme.palette.semantic.colorBackground,

        '&:hover': { backgroundColor: theme.palette.semantic.colorBackgroundSecondary },

        '&:not(.Mui-disabled)': {
            backgroundColor: `${theme.palette.semantic.colorNotificationBadge} !important`,

            '&:hover': { backgroundColor: `${theme.palette.semantic.colorForeground} !important` },
        },
    },
}));

interface AutopilotChatInputActionsProps {
    handleSubmit: (event: React.MouseEvent) => void;
    disableSubmit: boolean;
    waitingResponse: boolean;
}

function AutopilotChatInputActionsComponent({
    handleSubmit, disableSubmit, waitingResponse,
}: AutopilotChatInputActionsProps) {
    const theme = useTheme();
    const { addAttachments } = useAttachments();
    const { setError } = useError();

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileButtonClick = () => {
        if (fileInputRef.current) {
            // clear the input value to allow the user to select the same file again
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const handleAttachment = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const parsedFiles = await parseFiles(Array.from(event.target.files ?? []), 'text');

            addAttachments(parsedFiles);
        } catch (err: any) {
            setError(err);
        }
    }, [ addAttachments, setError ]);

    return (
        <InputActionsContainer>
            <InputActionsGroup>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept={ACCEPTED_FILE_EXTENSIONS}
                    multiple={true}
                    onChange={handleAttachment}
                />
                <AutopilotChatActionButton
                    iconName="attach_file"
                    onClick={handleFileButtonClick}
                    tooltip={t('autopilot-chat-attach-file')}
                />
            </InputActionsGroup>

            <InputActionsGroup>
                <SubmitButtonContainer>
                    <AutopilotChatActionButton
                        iconName={waitingResponse ? 'stop' : 'arrow_upward'}
                        tooltip={waitingResponse ? t('autopilot-chat-stop') : t('autopilot-chat-send')}
                        overrideColor={disableSubmit
                            ? theme.palette.semantic.colorForegroundDisable
                            : theme.palette.semantic.colorBackground
                        }
                        preventHover={true}
                        disabled={disableSubmit}
                        onClick={handleSubmit}
                    />
                </SubmitButtonContainer>
            </InputActionsGroup>
        </InputActionsContainer>
    );
}

export const AutopilotChatInputActions = React.memo(AutopilotChatInputActionsComponent);
