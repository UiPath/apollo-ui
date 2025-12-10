import React from 'react';

import { styled } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useAttachments } from '../../providers/attachements-provider';
import { useChatState } from '../../providers/chat-state-provider';
import { useError } from '../../providers/error-provider';
import { usePicker } from '../../providers/picker-provider';
import { parseFiles } from '../../utils/file-reader';
import { AutopilotChatAudio } from '../audio/chat-audio';
import { AutopilotChatActionButton } from '../common/action-button';
import { VisuallyHidden } from '../common/shared-controls';
import { AutopilotChatAgentModeSelector } from './chat-input-agent-mode-selector';
import { AutopilotChatInputModelPicker } from './chat-input-model-picker';

const InputActionsContainer = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'space-between',
    padding: `0 ${token.Spacing.SpacingXs} ${token.Spacing.SpacingXs}`,
}));

const InputActionsGroup = styled('div')(() => ({
    display: 'flex',
    gap: token.Spacing.SpacingMicro,
}));

const SubmitButtonContainer = styled('div')((() => ({
    '& .MuiIconButton-root': {
        borderRadius: token.Border.BorderRadiusM,
        backgroundColor: 'var(--color-background-disabled)',

        '&:not(.Mui-disabled)': {
            backgroundColor: `var(--color-foreground) !important`,

            '&:hover, &:active, &:focus': { backgroundColor: `var(--color-foreground-de-emp) !important` },
        },
    },
})));

interface AutopilotChatInputActionsProps {
    handleSubmit: (event: React.MouseEvent) => void;
    disableSubmit: boolean;
    waitingResponse: boolean;
}

function AutopilotChatInputActionsComponent({
    handleSubmit, disableSubmit, waitingResponse,
}: AutopilotChatInputActionsProps) {
    const { _ } = useLingui();
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
                    const fileName = file.name;
                    const fileSize = fileSizeMB;
                    const maxSize = allowedAttachments.maxSize / 1024 / 1024;

                    return _(msg({ id: 'autopilot-chat.input.actions.error.file-too-large', message: `File "${fileName}" (${fileSize}MB) exceeds the maximum size of ${maxSize}MB` }));
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
        const maxCount = allowedAttachments.maxCount;
        const maxSize = allowedAttachments.maxSize / 1024 / 1024;
        const fileTypes = acceptedExtensions.split(',').join(', ');

        if (allowedAttachments.maxCount && allowedAttachments.maxCount > 1 && allowedAttachments.multiple) {
            parts.push(
                _(msg({ id: 'autopilot-chat.input.actions.attachments.max-count', message: `Maximum ${maxCount} files` })),
            );
        }

        parts.push(
            _(msg({ id: 'autopilot-chat.input.actions.attachments.max-size', message: `Maximum ${maxSize}MB per file` })),
            _(msg({ id: 'autopilot-chat.input.actions.attachments.allowed-types', message: `Allowed types: ${fileTypes}` })),
        );

        return parts.join('. ');
    }, [ allowedAttachments, acceptedExtensions, _ ]);

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
                            ariaLabel={_(msg({ id: 'autopilot-chat.input.actions.attach-file', message: `Attach file` }))}
                            ariaDescribedby="autopilot-chat-attach-file-description"
                            tooltip={
                                <>
                                    <ap-typography
                                        color={'var(--color-foreground-inverse)'}
                                        variant={FontVariantToken.fontSizeM}
                                    >
                                        {_(msg({ id: 'autopilot-chat.input.actions.attach-file', message: `Attach file` }))}
                                    </ap-typography>

                                    {allowedAttachments.maxCount && allowedAttachments.maxCount > 1 && allowedAttachments.multiple && (() => {
                                        const maxCount = allowedAttachments.maxCount;
                                        return (
                                            <ap-typography
                                                color={'var(--color-foreground-inverse)'}
                                                variant={FontVariantToken.fontSizeXs}
                                            >
                                                {_(msg({ id: 'autopilot-chat.input.actions.attachments.max-count', message: `Maximum ${maxCount} files` }))}
                                            </ap-typography>
                                        );
                                    })()}

                                    {(() => {
                                        const maxSize = allowedAttachments.maxSize / 1024 / 1024;
                                        return (
                                            <ap-typography
                                                color={'var(--color-foreground-inverse)'}
                                                variant={FontVariantToken.fontSizeXs}
                                            >
                                                {_(msg({ id: 'autopilot-chat.input.actions.attachments.max-size', message: `Maximum ${maxSize}MB per file` }))}
                                            </ap-typography>
                                        );
                                    })()}

                                    {(() => {
                                        const fileTypes = acceptedExtensions.split(',').join(', ');
                                        return (
                                            <ap-typography
                                                color={'var(--color-foreground-inverse)'}
                                                variant={FontVariantToken.fontSizeXs}
                                            >
                                                {_(msg({ id: 'autopilot-chat.input.actions.attachments.allowed-types', message: `Allowed types: ${fileTypes}` }))}
                                            </ap-typography>
                                        );
                                    })()}
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
                        tooltip={waitingResponse ? _(msg({ id: 'autopilot-chat.input.actions.stop', message: `Stop` })) : _(msg({ id: 'autopilot-chat.input.actions.send', message: `Send` }))}
                        overrideColor={disableSubmit
                            ? 'var(--color-foreground-disable)'
                            : 'var(--color-background)'
                        }
                        variant={waitingResponse ? 'normal' : 'outlined'}
                        preventHover={true}
                        disabled={disableSubmit}
                        onClick={handleSubmit}
                        data-testid="autopilot-chat-submit-button"
                        ariaLabel={waitingResponse ? _(msg({ id: 'autopilot-chat.input.actions.stop', message: `Stop` })) : _(msg({ id: 'autopilot-chat.input.actions.send', message: `Send` }))}
                    />
                </SubmitButtonContainer>
            </InputActionsGroup>
        </InputActionsContainer>
    );
}

export const AutopilotChatInputActions = React.memo(AutopilotChatInputActionsComponent);
