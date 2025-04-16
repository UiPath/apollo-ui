/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useAttachments } from '../../providers/attachements-provider.react';
import { useChatState } from '../../providers/chat-state-provider.react';
import { useError } from '../../providers/error-provider.react';
import { parseFiles } from '../../utils/file-reader';
import { AutopilotChatActionButton } from '../common/action-button.react';
import { AutopilotChatInputModelPicker } from './chat-input-model-picker.react';

const InputActionsContainer = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    padding: `0 ${token.Spacing.SpacingXs} ${token.Spacing.SpacingXs}`,
}));

const InputActionsGroup = styled('div')(() => ({
    display: 'flex',
    gap: token.Spacing.SpacingMicro,
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
    const {
        addAttachments, attachments,
    } = useAttachments();
    const { setError } = useError();
    const {
        disabledFeatures, allowedAttachments, models,
    } = useChatState();
    const attachmentsCountRef = React.useRef(attachments.length);

    React.useEffect(() => {
        attachmentsCountRef.current = attachments.length;
    }, [ attachments ]);

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
            const parsedFiles = await parseFiles(Array.from(event.target.files ?? []));
            const oversizedFiles = parsedFiles.filter(file => file.size > allowedAttachments.maxSize);

            if (oversizedFiles.length > 0) {
                const errorMessages = oversizedFiles.map(file => {
                    const fileSizeMB = Math.round(file.size / 1024 / 1024);

                    return t('autopilot-chat-error-file-too-large', {
                        fileName: file.name,
                        fileSize: fileSizeMB,
                        maxSize: allowedAttachments.maxSize / 1024 / 1024,
                    });
                });

                setError(errorMessages.join('\n'));
            }

            addAttachments(parsedFiles.filter(file => file.size <= allowedAttachments.maxSize));
        } catch (err: any) {
            setError(err);
        }
    }, [ addAttachments, setError, allowedAttachments.maxSize ]);

    const acceptedExtensions = React.useMemo(() => {
        return Object.values(allowedAttachments.types)
            .flat()
            .join(',');
    }, [ allowedAttachments ]);

    return (
        <InputActionsContainer>
            <InputActionsGroup>
                {!disabledFeatures.attachments && (
                    <>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept={acceptedExtensions}
                            multiple={allowedAttachments.multiple}
                            onChange={handleAttachment}
                        />
                        <AutopilotChatActionButton
                            iconName="attach_file"
                            onClick={handleFileButtonClick}
                            tooltipPlacement="top"
                            tooltip={
                                <>
                                    <ap-typography
                                        color={theme.palette.semantic.colorForegroundInverse}
                                        variant={FontVariantToken.fontSizeM}
                                    >
                                        {t('autopilot-chat-attach-file')}
                                    </ap-typography>

                                    {allowedAttachments.maxCount && allowedAttachments.maxCount > 1 && allowedAttachments.multiple && (
                                        <ap-typography
                                            color={theme.palette.semantic.colorForegroundInverse}
                                            variant={FontVariantToken.fontSizeXs}
                                        >
                                            {t('autopilot-chat-dropzone-overlay-max-count', { maxCount: allowedAttachments.maxCount })}
                                        </ap-typography>
                                    )}

                                    <ap-typography
                                        color={theme.palette.semantic.colorForegroundInverse}
                                        variant={FontVariantToken.fontSizeXs}
                                    >
                                        {t(
                                            'autopilot-chat-dropzone-overlay-max-size',
                                            { maxSize: allowedAttachments.maxSize / 1024 / 1024 },
                                        )}
                                    </ap-typography>

                                    <ap-typography
                                        color={theme.palette.semantic.colorForegroundInverse}
                                        variant={FontVariantToken.fontSizeXs}
                                    >
                                        {t(
                                            'autopilot-chat-allowed-file-types',
                                            { fileTypes: acceptedExtensions.split(',').join(', ') },
                                        )}
                                    </ap-typography>
                                </>
                            }
                        />
                    </>
                )}
                { models.length > 0 && <AutopilotChatInputModelPicker useIcon={!disabledFeatures.attachments} /> }
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
