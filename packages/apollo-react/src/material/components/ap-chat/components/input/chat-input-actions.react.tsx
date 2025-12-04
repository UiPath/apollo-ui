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
import { usePicker } from '../../providers/picker-provider.react';
import { parseFiles } from '../../utils/file-reader';
import { AutopilotChatAudio } from '../audio/chat-audio.react';
import { AutopilotChatActionButton } from '../common/action-button.react';
import { VisuallyHidden } from '../common/shared-controls.react';
import { AutopilotChatAgentModeSelector } from './chat-input-agent-mode-selector.react';
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
        backgroundColor: theme.palette.semantic.colorBackgroundDisabled,

        '&:not(.Mui-disabled)': {
            backgroundColor: `${theme.palette.semantic.colorForeground} !important`,

            '&:hover, &:active, &:focus': { backgroundColor: `${theme.palette.semantic.colorForegroundDeEmp} !important` },
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
    const {
        disabledFeatures, allowedAttachments,
    } = useChatState();
    const {
        models, agentModes,
    } = usePicker();

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
            } else {
                setError(undefined);
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

    // Build full description text for screen readers
    const attachmentDescription = React.useMemo(() => {
        const parts: string[] = [];

        if (allowedAttachments.maxCount && allowedAttachments.maxCount > 1 && allowedAttachments.multiple) {
            parts.push(
                t('autopilot-chat-dropzone-overlay-max-count', { maxCount: allowedAttachments.maxCount }),
            );
        }

        parts.push(
            t('autopilot-chat-dropzone-overlay-max-size', { maxSize: allowedAttachments.maxSize / 1024 / 1024 }),
            t('autopilot-chat-allowed-file-types', { fileTypes: acceptedExtensions.split(',').join(', ') }),
        );

        return parts.join('. ');
    }, [ allowedAttachments, acceptedExtensions ]);

    // Calculate if we should use icons based on how many features are enabled
    const hasMultipleFeatures = [
        !disabledFeatures.attachments,
        models.length > 0,
        (agentModes?.length ?? 0) > 0,
    ].filter(Boolean).length > 1;

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
                        <VisuallyHidden id="autopilot-chat-attach-file-description">
                            {attachmentDescription}
                        </VisuallyHidden>
                        <AutopilotChatActionButton
                            iconName="attach_file"
                            onClick={handleFileButtonClick}
                            tooltipPlacement="top"
                            data-testid="autopilot-chat-attach-file-button"
                            ariaLabel={t('autopilot-chat-attach-file')}
                            ariaDescribedby="autopilot-chat-attach-file-description"
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
                {(models.length > 0) ? (
                    <AutopilotChatInputModelPicker useIcon={hasMultipleFeatures} />
                ) : null}
                {(agentModes.length > 0) ? (
                    <AutopilotChatAgentModeSelector useIcon={false} />
                ) : null}
            </InputActionsGroup>

            <InputActionsGroup>
                {!disabledFeatures.audio && (
                    <AutopilotChatAudio/>
                )}
                <SubmitButtonContainer>
                    <AutopilotChatActionButton
                        iconName={waitingResponse ? 'stop' : 'arrow_upward'}
                        tooltip={waitingResponse ? t('autopilot-chat-stop') : t('autopilot-chat-send')}
                        overrideColor={disableSubmit
                            ? theme.palette.semantic.colorForegroundDisable
                            : theme.palette.semantic.colorBackground
                        }
                        variant={waitingResponse ? 'normal' : 'outlined'}
                        preventHover={true}
                        disabled={disableSubmit}
                        onClick={handleSubmit}
                        data-testid="autopilot-chat-submit-button"
                        ariaLabel={waitingResponse ? t('autopilot-chat-stop') : t('autopilot-chat-send')}
                    />
                </SubmitButtonContainer>
            </InputActionsGroup>
        </InputActionsContainer>
    );
}

export const AutopilotChatInputActions = React.memo(AutopilotChatInputActionsComponent);
